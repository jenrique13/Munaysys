from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# --- Quote Items ---
class QuoteItemBase(BaseModel):
    item_type: str  # product, room, office, custom
    item_id: Optional[int] = None
    description: str
    quantity: int = 1
    unit_price: float = 0.0
    discount: float = 0.0
    subtotal: float = 0.0


class QuoteItemCreate(QuoteItemBase):
    pass


class QuoteItem(QuoteItemBase):
    id: int
    quote_id: int

    class Config:
        from_attributes = True


# --- Quotes ---
class QuoteBase(BaseModel):
    title: str
    lead_id: Optional[int] = None
    client_id: Optional[int] = None
    notes: Optional[str] = None
    expires_at: Optional[datetime] = None
    discount: float = 0.0


class QuoteCreate(QuoteBase):
    branch_id: int
    items: List[QuoteItemCreate] = []


class QuoteUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None  # draft, sent, approved, rejected, converted
    lead_id: Optional[int] = None
    client_id: Optional[int] = None
    notes: Optional[str] = None
    expires_at: Optional[datetime] = None
    discount: Optional[float] = None
    items: Optional[List[QuoteItemCreate]] = None


# --- Nested Lead/Client info for display ---
class QuoteLeadInfo(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    company: Optional[str] = None
    ci_rif: Optional[str] = None
    class Config:
        from_attributes = True


class QuoteClientInfo(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    ci_rif: Optional[str] = None
    class Config:
        from_attributes = True


class Quote(QuoteBase):
    id: int
    branch_id: int
    status: str
    subtotal: float
    tax: float
    total: float
    converted_order_id: Optional[int] = None
    created_at: datetime
    items: List[QuoteItem] = []
    lead: Optional[QuoteLeadInfo] = None
    client: Optional[QuoteClientInfo] = None

    class Config:
        from_attributes = True


# --- Convert to Order ---
class QuoteConvertToOrder(BaseModel):
    client_id: Optional[int] = None  # Optional: if provided, assigns to this client. If not, creates one from lead.
