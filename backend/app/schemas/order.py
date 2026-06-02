from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


# ---------- Order Item Schemas ----------

class OrderItemCreate(BaseModel):
    product_id: int = Field(..., description="ID of the product to order")
    quantity: int = Field(..., gt=0, description="Quantity (must be > 0)")


class OrderItemResponse(BaseModel):
    id: int
    order_id: int
    product_id: int
    quantity: int
    unit_price: float
    total_price: float
    product_name: Optional[str] = None
    product_sku: Optional[str] = None


# ---------- Order Schemas ----------

class OrderCreate(BaseModel):
    customer_id: int = Field(..., description="ID of the customer placing the order")
    items: List[OrderItemCreate] = Field(..., min_length=1, description="At least one item required")


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderResponse(BaseModel):
    id: int
    customer_id: int
    status: str
    total_amount: float
    created_at: str
    updated_at: str
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    items: Optional[List[OrderItemResponse]] = None
