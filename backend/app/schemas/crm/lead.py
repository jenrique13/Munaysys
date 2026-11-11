from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.schemas.user import BranchResponse
from .pipeline_stage import PipelineStage

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
    branch: Optional[BranchResponse] = None
    stage: Optional[PipelineStage] = None
    
    class Config:
        from_attributes = True
