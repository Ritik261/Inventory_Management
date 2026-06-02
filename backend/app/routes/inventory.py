from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.database import supabase
from app.schemas.inventory import InventoryLogResponse, InventoryAdjustment

router = APIRouter(prefix="/api/inventory", tags=["Inventory"])


@router.get("/logs", response_model=list[InventoryLogResponse])
def list_inventory_logs(
    product_id: Optional[int] = Query(None, description="Filter by product"),
    change_type: Optional[str] = Query(None, description="Filter by change type"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """List inventory change logs with optional filters."""
    query = supabase.table("inventory_logs").select("*, products(name, sku)")

    if product_id:
        query = query.eq("product_id", product_id)
    if change_type:
        query = query.eq("change_type", change_type)

    response = query.order("created_at", desc=True).range(skip, skip + limit - 1).execute()

    logs = []
    for row in response.data:
        product_data = row.pop("products", None)
        log = {**row}
        if product_data:
            log["product_name"] = product_data.get("name")
            log["product_sku"] = product_data.get("sku")
        logs.append(log)

    return logs


@router.get("/logs/{product_id}", response_model=list[InventoryLogResponse])
def get_product_inventory_logs(
    product_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """Get inventory change history for a specific product."""
    # Check product exists
    product = supabase.table("products").select("id").eq("id", product_id).execute()
    if not product.data:
        raise HTTPException(status_code=404, detail="Product not found")

    response = (
        supabase.table("inventory_logs")
        .select("*, products(name, sku)")
        .eq("product_id", product_id)
        .order("created_at", desc=True)
        .range(skip, skip + limit - 1)
        .execute()
    )

    logs = []
    for row in response.data:
        product_data = row.pop("products", None)
        log = {**row}
        if product_data:
            log["product_name"] = product_data.get("name")
            log["product_sku"] = product_data.get("sku")
        logs.append(log)

    return logs


@router.post("/adjust", response_model=InventoryLogResponse, status_code=201)
def adjust_inventory(adjustment: InventoryAdjustment):
    """
    Manually adjust inventory for a product.
    Positive quantity_change = add stock; Negative = remove stock.
    """
    # Check product exists
    product_resp = supabase.table("products").select("*").eq("id", adjustment.product_id).execute()
    if not product_resp.data:
        raise HTTPException(status_code=404, detail="Product not found")

    product = product_resp.data[0]
    current_stock = product["stock"]
    new_stock = current_stock + adjustment.quantity_change

    if new_stock < 0:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock. Current: {current_stock}, trying to remove: {abs(adjustment.quantity_change)}"
        )

    # Update product stock
    supabase.table("products").update({"stock": new_stock}).eq("id", adjustment.product_id).execute()

    # Log the change
    log_response = supabase.table("inventory_logs").insert({
        "product_id": adjustment.product_id,
        "change_type": "manual_adjustment",
        "quantity_change": adjustment.quantity_change,
        "previous_stock": current_stock,
        "new_stock": new_stock,
        "notes": adjustment.notes or "Manual inventory adjustment",
    }).execute()

    if not log_response.data:
        raise HTTPException(status_code=500, detail="Failed to log inventory adjustment")

    log = log_response.data[0]
    log["product_name"] = product["name"]
    log["product_sku"] = product["sku"]

    return log


@router.get("/summary")
def get_inventory_summary():
    """Get a summary of inventory status across all products."""
    products = supabase.table("products").select("id, name, sku, stock, price").order("stock", desc=False).execute()

    total_products = len(products.data)
    total_stock = sum(p["stock"] for p in products.data)
    total_value = sum(p["stock"] * p["price"] for p in products.data)
    out_of_stock = [p for p in products.data if p["stock"] == 0]
    low_stock = [p for p in products.data if 0 < p["stock"] <= 10]

    return {
        "total_products": total_products,
        "total_stock_units": total_stock,
        "total_inventory_value": round(total_value, 2),
        "out_of_stock_count": len(out_of_stock),
        "low_stock_count": len(low_stock),
        "out_of_stock_products": out_of_stock,
        "low_stock_products": low_stock,
    }
