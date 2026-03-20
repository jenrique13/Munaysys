from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Pipeline Stages
class PipelineStageBase(BaseModel):
    name: str
    order_index: int
    color: str = "#E2E8F0"
    probability: int = 0
    branch_id: int

class PipelineStageCreate(PipelineStageBase):
    pass

class PipelineStage(PipelineStageBase):
    id: int
    class Config:
        from_attributes = True

# Leads
class LeadBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    source: Optional[str] = None
    ci_rif: Optional[str] = None
    branch_id: int
    assigned_user_id: Optional[int] = None

class LeadCreate(LeadBase):
    pass

class LeadUpdate(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    source: Optional[str] = None
    ci_rif: Optional[str] = None


class Lead(LeadBase):
    id: int
    status: str
    score: int
    created_at: datetime
    class Config:
        from_attributes = True

# Opportunities
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
    lead: Lead # Inclusión completa del Lead serializado para la UI

    class Config:
        from_attributes = True
