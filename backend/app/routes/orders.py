from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.database import supabase
from app.schemas.order import OrderCreate, OrderStatusUpdate, OrderResponse, OrderItemResponse

router = APIRouter(prefix="/api/orders", tags=["Orders"])


@router.get("/", response_model=list[OrderResponse])
def list_orders(
    status: Optional[str] = Query(None, description="Filter by status"),
    customer_id: Optional[int] = Query(None, description="Filter by customer"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """List all orders with optional filters and pagination."""
    query = supabase.table("orders").select("*, customers(name, email)")

    if status:
        query = query.eq("status", status)
    if customer_id:
        query = query.eq("customer_id", customer_id)

    response = query.order("created_at", desc=True).range(skip, skip + limit - 1).execute()

    orders = []
    for row in response.data:
        customer_data = row.pop("customers", None)
        order = {**row}
        if customer_data:
            order["customer_name"] = customer_data.get("name")
            order["customer_email"] = customer_data.get("email")
        orders.append(order)

    return orders


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int):
    """Get a single order by ID with its items."""
    response = (
        supabase.table("orders")
        .select("*, customers(name, email)")
        .eq("id", order_id)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Order not found")

    row = response.data[0]
    customer_data = row.pop("customers", None)
    order = {**row}
    if customer_data:
        order["customer_name"] = customer_data.get("name")
        order["customer_email"] = customer_data.get("email")

    # Fetch order items with product info
    items_response = (
        supabase.table("order_items")
        .select("*, products(name, sku)")
        .eq("order_id", order_id)
        .execute()
    )

    items = []
    for item in items_response.data:
        product_data = item.pop("products", None)
        item_dict = {**item}
        if product_data:
            item_dict["product_name"] = product_data.get("name")
            item_dict["product_sku"] = product_data.get("sku")
        items.append(item_dict)

    order["items"] = items
    return order


@router.post("/", response_model=OrderResponse, status_code=201)
def create_order(order: OrderCreate):
    """
    Create a new order with items.
    - Validates customer exists
    - Validates each product exists and has sufficient stock
    - Automatically reduces stock for each product
    - Logs all inventory changes
    """
    # 1. Validate customer exists
    customer = supabase.table("customers").select("id, name, email").eq("id", order.customer_id).execute()
    if not customer.data:
        raise HTTPException(status_code=404, detail="Customer not found")

    # 2. Validate all products and check stock
    product_ids = [item.product_id for item in order.items]
    products_response = supabase.table("products").select("*").in_("id", product_ids).execute()
    products_map = {p["id"]: p for p in products_response.data}

    # Check all products exist
    for item in order.items:
        if item.product_id not in products_map:
            raise HTTPException(
                status_code=404,
                detail=f"Product with ID {item.product_id} not found"
            )

    # Check stock availability for all items
    insufficient_stock = []
    for item in order.items:
        product = products_map[item.product_id]
        if product["stock"] < item.quantity:
            insufficient_stock.append({
                "product_id": item.product_id,
                "product_name": product["name"],
                "sku": product["sku"],
                "requested": item.quantity,
                "available": product["stock"],
            })

    if insufficient_stock:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Insufficient stock for one or more products",
                "insufficient_items": insufficient_stock,
            }
        )

    # 3. Calculate total amount
    total_amount = 0.0
    order_items_data = []
    for item in order.items:
        product = products_map[item.product_id]
        unit_price = product["price"]
        total_price = unit_price * item.quantity
        total_amount += total_price
        order_items_data.append({
            "product_id": item.product_id,
            "quantity": item.quantity,
            "unit_price": unit_price,
            "total_price": round(total_price, 2),
        })

    # 4. Create the order
    order_response = supabase.table("orders").insert({
        "customer_id": order.customer_id,
        "status": "pending",
        "total_amount": round(total_amount, 2),
    }).execute()

    if not order_response.data:
        raise HTTPException(status_code=500, detail="Failed to create order")

    new_order = order_response.data[0]
    order_id = new_order["id"]

    # 5. Create order items
    for item_data in order_items_data:
        item_data["order_id"] = order_id

    supabase.table("order_items").insert(order_items_data).execute()

    # 6. Reduce stock and log inventory changes
    for item in order.items:
        product = products_map[item.product_id]
        new_stock = product["stock"] - item.quantity

        # Update product stock
        supabase.table("products").update({"stock": new_stock}).eq("id", item.product_id).execute()

        # Log inventory change
        supabase.table("inventory_logs").insert({
            "product_id": item.product_id,
            "change_type": "order_placed",
            "quantity_change": -item.quantity,
            "previous_stock": product["stock"],
            "new_stock": new_stock,
            "reference_id": order_id,
            "notes": f"Stock reduced for Order #{order_id}",
        }).execute()

    # 7. Build response
    result = {**new_order}
    customer_info = customer.data[0]
    result["customer_name"] = customer_info["name"]
    result["customer_email"] = customer_info["email"]

    # Fetch created items
    items_resp = (
        supabase.table("order_items")
        .select("*, products(name, sku)")
        .eq("order_id", order_id)
        .execute()
    )
    items = []
    for it in items_resp.data:
        prod = it.pop("products", None)
        d = {**it}
        if prod:
            d["product_name"] = prod.get("name")
            d["product_sku"] = prod.get("sku")
        items.append(d)

    result["items"] = items
    return result


@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_order_status(order_id: int, status_update: OrderStatusUpdate):
    """
    Update order status. If cancelled, restores stock to products.
    """
    # Check order exists
    existing = supabase.table("orders").select("*").eq("id", order_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Order not found")

    current_order = existing.data[0]
    old_status = current_order["status"]
    new_status = status_update.status.value

    if old_status == new_status:
        raise HTTPException(status_code=400, detail=f"Order is already '{new_status}'")

    if old_status == "cancelled":
        raise HTTPException(status_code=400, detail="Cannot change status of a cancelled order")

    if old_status == "delivered":
        raise HTTPException(status_code=400, detail="Cannot change status of a delivered order")

    # If cancelling, restore stock
    if new_status == "cancelled":
        items_response = supabase.table("order_items").select("*").eq("order_id", order_id).execute()

        for item in items_response.data:
            product = supabase.table("products").select("*").eq("id", item["product_id"]).execute()
            if product.data:
                current_stock = product.data[0]["stock"]
                restored_stock = current_stock + item["quantity"]

                supabase.table("products").update({"stock": restored_stock}).eq("id", item["product_id"]).execute()

                supabase.table("inventory_logs").insert({
                    "product_id": item["product_id"],
                    "change_type": "order_cancelled",
                    "quantity_change": item["quantity"],
                    "previous_stock": current_stock,
                    "new_stock": restored_stock,
                    "reference_id": order_id,
                    "notes": f"Stock restored for cancelled Order #{order_id}",
                }).execute()

    # Update order status
    response = supabase.table("orders").update({"status": new_status}).eq("id", order_id).execute()

    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to update order status")

    return response.data[0]


@router.delete("/{order_id}", status_code=200)
def delete_order(order_id: int):
    """Delete an order (only if pending). Restores stock."""
    existing = supabase.table("orders").select("*").eq("id", order_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Order not found")

    if existing.data[0]["status"] != "pending":
        raise HTTPException(
            status_code=400,
            detail="Only pending orders can be deleted. Cancel the order first."
        )

    # Restore stock
    items_response = supabase.table("order_items").select("*").eq("order_id", order_id).execute()
    for item in items_response.data:
        product = supabase.table("products").select("stock").eq("id", item["product_id"]).execute()
        if product.data:
            current_stock = product.data[0]["stock"]
            restored_stock = current_stock + item["quantity"]
            supabase.table("products").update({"stock": restored_stock}).eq("id", item["product_id"]).execute()

            supabase.table("inventory_logs").insert({
                "product_id": item["product_id"],
                "change_type": "order_deleted",
                "quantity_change": item["quantity"],
                "previous_stock": current_stock,
                "new_stock": restored_stock,
                "reference_id": order_id,
                "notes": f"Stock restored for deleted Order #{order_id}",
            }).execute()

    # Delete order items first, then order
    supabase.table("order_items").delete().eq("order_id", order_id).execute()
    supabase.table("orders").delete().eq("id", order_id).execute()

    return {"message": "Order deleted and stock restored successfully"}
