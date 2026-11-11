from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.schemas.financial.receipt import Receipt

class PurchaseDetailBase(BaseModel):
    product_id: Optional[int] = None
    consumable_id: Optional[int] = None
    item_type: str = "product" # product, consumable
    description: Optional[str] = None
    quantity: int = 1
    unit: Optional[str] = None
    unit_cost: float = 0.0
    sales_price: Optional[float] = 0.0

class PurchaseDetailCreate(PurchaseDetailBase):
    pass

class PurchaseDetail(PurchaseDetailBase):
    id: int
    purchase_id: int
    subtotal: Optional[float] = 0.0

    class Config:
        from_attributes = True

class PurchaseBase(BaseModel):
    provider_id: Optional[int] = None
    provider_name: str
    branch_id: int
    status: str = "pending"  # pending, partial, paid, cancelled
    category: Optional[str] = None

class PurchaseCreate(PurchaseBase):
    details: List[PurchaseDetailCreate]

class Purchase(PurchaseBase):
    id: int
    date: datetime
    subtotal: Optional[float] = 0.0
    tax: Optional[float] = 0.0
    total: Optional[float] = 0.0
    details: List[PurchaseDetail] = []
    receipts: List[Receipt] = []

    class Config:
        from_attributes = True
