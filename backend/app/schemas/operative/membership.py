from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime
from app.schemas.operative.client import ClientOut
from app.schemas.operative.office import OfficeOut

class MembershipBase(BaseModel):
    client_id: int
    office_id: Optional[int] = None
    plan_name: str
    start_date: datetime
    end_date: Optional[datetime] = None
    hours_included: float = 0.0
    hours_used: float = 0.0
    price: float = 0.0
    billing_address: Optional[str] = None
    status: str = "active"
    authorized_persons_json: Optional[List[dict]] = []
    custom_contract_html: Optional[str] = None

class MembershipCreate(MembershipBase):
    pass

class MembershipUpdate(BaseModel):
    office_id: Optional[int] = None
    plan_name: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    hours_included: Optional[float] = None
    hours_used: Optional[float] = None
    price: Optional[float] = None
    billing_address: Optional[str] = None
    status: Optional[str] = None
    authorized_persons_json: Optional[List[dict]] = None
    custom_contract_html: Optional[str] = None

class MembershipOut(MembershipBase):
    id: int
    created_at: datetime
    client: Optional[ClientOut] = None
    office: Optional[OfficeOut] = None

    class Config:
        from_attributes = True
