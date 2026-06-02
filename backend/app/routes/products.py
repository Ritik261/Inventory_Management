from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.database import supabase
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse

router = APIRouter(prefix="/api/products", tags=["Products"])


@router.get("/", response_model=list[ProductResponse])
def list_products(
    search: Optional[str] = Query(None, description="Search by name or SKU"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """List all products with optional search and pagination."""
    query = supabase.table("products").select("*")

    if search:
        query = query.or_(f"name.ilike.%{search}%,sku.ilike.%{search}%")

    response = query.order("created_at", desc=True).range(skip, skip + limit - 1).execute()
    return response.data


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int):
    """Get a single product by ID."""
    response = supabase.table("products").select("*").eq("id", product_id).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Product not found")

    return response.data[0]


@router.post("/", response_model=ProductResponse, status_code=201)
def create_product(product: ProductCreate):
    """Create a new product. SKU must be unique."""
    # Check for duplicate SKU
    existing = supabase.table("products").select("id").eq("sku", product.sku).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail=f"Product with SKU '{product.sku}' already exists")

    data = product.model_dump()
    response = supabase.table("products").insert(data).execute()

    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create product")

    # Log initial inventory
    new_product = response.data[0]
    if new_product["stock"] > 0:
        supabase.table("inventory_logs").insert({
            "product_id": new_product["id"],
            "change_type": "initial_stock",
            "quantity_change": new_product["stock"],
            "previous_stock": 0,
            "new_stock": new_product["stock"],
            "notes": "Initial stock on product creation",
        }).execute()

    return new_product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, product: ProductUpdate):
    """Update a product. Cannot change SKU."""
    # Check product exists
    existing = supabase.table("products").select("*").eq("id", product_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = product.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    old_product = existing.data[0]

    # If stock is being updated, log the inventory change
    if "stock" in update_data and update_data["stock"] != old_product["stock"]:
        change = update_data["stock"] - old_product["stock"]
        supabase.table("inventory_logs").insert({
            "product_id": product_id,
            "change_type": "manual_adjustment",
            "quantity_change": change,
            "previous_stock": old_product["stock"],
            "new_stock": update_data["stock"],
            "notes": "Manual stock update via product edit",
        }).execute()

    response = supabase.table("products").update(update_data).eq("id", product_id).execute()

    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to update product")

    return response.data[0]


@router.delete("/{product_id}", status_code=200)
def delete_product(product_id: int):
    """Delete a product by ID."""
    existing = supabase.table("products").select("id").eq("id", product_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Product not found")

    # Check if product has associated order items
    order_items = supabase.table("order_items").select("id").eq("product_id", product_id).limit(1).execute()
    if order_items.data:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete product with existing orders. Consider setting stock to 0 instead."
        )

    supabase.table("products").delete().eq("id", product_id).execute()
    return {"message": "Product deleted successfully"}
