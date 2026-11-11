from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime
from app.schemas.user import BranchResponse

class ClientBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    branch_id: Optional[int] = None
    lead_id: Optional[int] = None
    ci_rif: Optional[str] = None
    status: str = "active"
    notes: Optional[str] = None

    @field_validator("email", mode="before")
    @classmethod
    def empty_string_to_none(cls, v):
        if v == "" or v == "None":
            return None
        return v

class ClientCreate(ClientBase):
    pass

class ClientUpdate(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    ci_rif: Optional[str] = None
    notes: Optional[str] = None

class ClientOut(ClientBase):
    id: int
    created_at: datetime
    active_membership_name: Optional[str] = None
    has_active_membership: bool = False
    branch: Optional[BranchResponse] = None
    
    class Config:
        from_attributes = True
