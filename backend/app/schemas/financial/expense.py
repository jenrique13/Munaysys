from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ExpenseBase(BaseModel):
    branch_id: int
    amount: float
    exchange_rate: Optional[float] = None
    exchange_currency: str = "eur"
    category: str
    description: Optional[str] = None
    provider: Optional[str] = None
    provider_id: Optional[int] = None
    payment_method: Optional[str] = None
    subtotal: Optional[float] = 0.0
    tax: Optional[float] = 0.0

class ExpenseCreate(ExpenseBase):
    pass

class Expense(ExpenseBase):
    id: int
    date: datetime

    class Config:
        from_attributes = True
