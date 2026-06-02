from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ---------- Product Schemas ----------

class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Product name")
    description: Optional[str] = Field(None, max_length=1000)
    sku: str = Field(..., min_length=1, max_length=100, description="Unique stock-keeping unit")
    price: float = Field(..., gt=0, description="Product price (must be > 0)")
    stock: int = Field(..., ge=0, description="Initial stock quantity")


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    price: Optional[float] = Field(None, gt=0)
    stock: Optional[int] = Field(None, ge=0)


class ProductResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    sku: str
    price: float
    stock: int
    created_at: str
    updated_at: str
