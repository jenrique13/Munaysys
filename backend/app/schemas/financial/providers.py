from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime

class ProviderBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    nit_ruc: Optional[str] = None
    contact_name: Optional[str] = None
    payment_info: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("email", mode="before")
    @classmethod
    def empty_string_to_none(cls, v):
        if v == "" or v == "None":
            return None
        return v

class ProviderCreate(ProviderBase):
    pass

class ProviderUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    nit_ruc: Optional[str] = None
    contact_name: Optional[str] = None
    payment_info: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("email", mode="before")
    @classmethod
    def empty_string_to_none(cls, v):
        if v == "" or v == "None":
            return None
        return v

class Provider(ProviderBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class PayableBase(BaseModel):
    branch_id: int
    provider_id: Optional[int] = None
    amount: float
    exchange_rate: Optional[float] = None
    exchange_currency: str = "eur"
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: str = "pending" # pending | paid | partial
    reference: Optional[str] = None
    payment_method: Optional[str] = None
    category: Optional[str] = None
    paid_date: Optional[datetime] = None
    subtotal: float = 0.0
    tax: float = 0.0
    expense_id: Optional[int] = None
    purchase_id: Optional[int] = None

class PayableCreate(PayableBase):
    pass

class PayableUpdate(BaseModel):
    amount: Optional[float] = None
    exchange_rate: Optional[float] = None
    exchange_currency: Optional[str] = None
    status: Optional[str] = None
    reference: Optional[str] = None
    payment_method: Optional[str] = None
    category: Optional[str] = None
    paid_date: Optional[datetime] = None
    subtotal: Optional[float] = None
    tax: Optional[float] = None
    igtf_amount: Optional[float] = None

class Payable(PayableBase):
    id: int
    created_at: datetime
    provider: Optional[Provider] = None
    class Config:
        from_attributes = True

class ProviderStatementTransaction(BaseModel):
    id: int
    date: datetime
    type: str  # purchase | expense | payment
    description: str
    reference: Optional[str] = None
    amount: float
    exchange_rate: Optional[float] = None
    amount_bs: Optional[float] = None
    status: Optional[str] = None

class ProviderStatement(BaseModel):
    provider_id: int
    provider_name: str
    total_purchases: float
    total_expenses: float
    total_paid: float
    balance: float
    total_purchases_bs: float = 0
    total_expenses_bs: float = 0
    total_paid_bs: float = 0
    balance_bs: float = 0
    transactions: List[ProviderStatementTransaction]
