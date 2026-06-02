from pydantic import BaseModel
from typing import Optional


# ---------- Inventory Log Schemas ----------

class InventoryLogResponse(BaseModel):
    id: int
    product_id: int
    change_type: str
    quantity_change: int
    previous_stock: int
    new_stock: int
    reference_id: Optional[int] = None
    notes: Optional[str] = None
    created_at: str
    product_name: Optional[str] = None
    product_sku: Optional[str] = None


class InventoryAdjustment(BaseModel):
    product_id: int
    quantity_change: int  # positive = add stock, negative = remove stock
    notes: Optional[str] = None
