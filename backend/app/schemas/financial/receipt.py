from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.user import BranchResponse

class ReceiptBase(BaseModel):
    amount: float
    exchange_rate: Optional[float] = None
    exchange_currency: str = "eur"
    type: str = "income"  # income, expense
    payment_method: str  # Cash, Zelle, Banesco (VE), etc.
    reference: Optional[str] = None
    client_id: Optional[int] = None
    orden_id: Optional[int] = None
    purchase_id: Optional[int] = None
    branch_id: Optional[int] = None
    igtf_amount: float = 0.0

class ReceiptCreate(ReceiptBase):
    pass

class Receipt(ReceiptBase):
    id: int
    date: datetime
    branch_id: Optional[int] = None
    branch: Optional[BranchResponse] = None

    class Config:
        from_attributes = True

class ClientPaymentCreate(BaseModel):
    client_id: int
    amount: float
    payment_method: str
    reference: Optional[str] = None
    branch_id: Optional[int] = None
    igtf_amount: float = 0.0
    exchange_rate: Optional[float] = None
    exchange_currency: Optional[str] = "usd"
