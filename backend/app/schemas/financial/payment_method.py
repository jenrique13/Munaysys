from pydantic import BaseModel
from typing import Optional

class PaymentMethodBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True
    branch_id: Optional[int] = None

class PaymentMethodCreate(PaymentMethodBase):
    pass

class PaymentMethodUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class PaymentMethod(PaymentMethodBase):
    id: int

    class Config:
        from_attributes = True
