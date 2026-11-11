from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.crm.lead import Lead

class OpportunityBase(BaseModel):
    lead_id: int
    stage_id: int
    estimated_value: float = 0.0
    probability: int = 0
    expected_close_date: Optional[datetime] = None

class OpportunityCreate(OpportunityBase):
    pass

class OpportunityUpdate(BaseModel):
    stage_id: Optional[int] = None
    estimated_value: Optional[float] = None
    probability: Optional[int] = None
    won_date: Optional[datetime] = None
    lost_reason: Optional[str] = None

class Opportunity(OpportunityBase):
    id: int
    won_date: Optional[datetime] = None
    lost_reason: Optional[str] = None
    lead: Lead # Full lead for UI
    
    class Config:
        from_attributes = True
