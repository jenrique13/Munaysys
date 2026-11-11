from pydantic import BaseModel
from typing import Optional

class BranchBase(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: bool = True
    color: Optional[str] = '#4F46E5'

class BranchCreate(BranchBase):
    pass

class BranchUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None
    color: Optional[str] = None

class BranchResponse(BranchBase):
    id: int

    class Config:
        from_attributes = True
