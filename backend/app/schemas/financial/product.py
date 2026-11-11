from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float = 0.0
    stock: int = 0
    type: str = "physical"  # physical, service
    is_active: bool = True
    branch_id: int

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
