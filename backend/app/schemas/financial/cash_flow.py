from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.user import BranchResponse

class CashMovementBase(BaseModel):
    branch_id: int
    amount: float
    exchange_rate: Optional[float] = None
    exchange_currency: str = "eur"
    type: str  # income, expense
    category: str
    description: Optional[str] = None
    client_name: Optional[str] = None
    provider_name: Optional[str] = None
    payment_method: Optional[str] = None
    igtf_amount: Optional[float] = 0.0

class CashMovementCreate(CashMovementBase):
    pass

class CashMovement(CashMovementBase):
    id: int
    date: datetime
    branch: Optional[BranchResponse] = None

    class Config:
        from_attributes = True

class CashCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    type: str  # income, expense
    branch_id: Optional[int] = None
    is_active: bool = True

class CashCategoryCreate(CashCategoryBase):
    pass

class CashCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    is_active: Optional[bool] = None

class CashCategory(CashCategoryBase):
    id: int

    class Config:
        from_attributes = True
