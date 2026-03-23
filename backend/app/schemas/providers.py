from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel


# --- Provider ---

class ProviderBase(BaseModel):
    name: str
    nit_ruc: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    contact_name: Optional[str] = None
    payment_info: Optional[str] = None
    notes: Optional[str] = None

class ProviderCreate(ProviderBase):
    branch_id: int = 1

class ProviderUpdate(ProviderBase):
    name: Optional[str] = None

class ProviderInDBBase(ProviderBase):
    id: int
    branch_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Provider(ProviderInDBBase):
    pass


# --- Payable (Cuentas por Pagar) ---

class PayableBase(BaseModel):
    provider_id: int
    reference: Optional[str] = None
    amount: float
    due_date: datetime
    status: Optional[str] = "pending"  # pending, paid, cancelled
    expense_id: Optional[int] = None
    purchase_id: Optional[int] = None
    payment_method: Optional[str] = None

class PayableCreate(PayableBase):
    branch_id: int = 1

class PayableUpdate(BaseModel):
    reference: Optional[str] = None
    amount: Optional[float] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None
    paid_date: Optional[datetime] = None
    payment_method: Optional[str] = None

class PayableInDBBase(PayableBase):
    id: int
    branch_id: int
    created_at: datetime
    paid_date: Optional[datetime] = None

    class Config:
        from_attributes = True

class Payable(PayableInDBBase):
    provider: Optional[Provider] = None

