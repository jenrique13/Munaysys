from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.schemas.crm.lead import Lead
from app.schemas.operative.client import ClientOut

class QuoteItemBase(BaseModel):
    item_type: str
    item_id: Optional[int] = None
    quantity: Optional[float] = 1.0
    unit_price: Optional[float] = 0.0
    description: str
    discount: Optional[float] = 0.0
    subtotal: Optional[float] = 0.0
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    service_id: Optional[int] = None

class QuoteItemCreate(QuoteItemBase):
    pass

class QuoteItem(QuoteItemBase):
    id: int
    quote_id: int
    class Config:
        from_attributes = True

class QuoteBase(BaseModel):
    branch_id: int
    title: str
    lead_id: Optional[int] = None
    client_id: Optional[int] = None
    notes: Optional[str] = None
    expires_at: Optional[datetime] = None
    discount: Optional[float] = 0.0
    discount_type: str = "amount"
    apply_tax: bool = True

class QuoteCreate(QuoteBase):
    items: List[QuoteItemCreate]

class QuoteUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    lead_id: Optional[int] = None
    client_id: Optional[int] = None
    notes: Optional[str] = None
    expires_at: Optional[datetime] = None
    discount: Optional[float] = None
    discount_type: Optional[str] = None
    apply_tax: Optional[bool] = None
    items: Optional[List[QuoteItemCreate]] = None

class Quote(QuoteBase):
    id: int
    subtotal: Optional[float] = 0.0
    tax: Optional[float] = 0.0
    total: Optional[float] = 0.0
    status: str
    created_at: datetime
    converted_order_id: Optional[int] = None
    items: List[QuoteItem]
    lead: Optional[Lead] = None
    client: Optional[ClientOut] = None
    class Config:
        from_attributes = True

class QuoteConvertToOrder(BaseModel):
    client_id: Optional[int] = None
