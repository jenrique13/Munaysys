from pydantic import BaseModel, EmailStr
from typing import Optional
from .role import RoleResponse
from app.schemas.user import BranchResponse

# Base Properties
class UserBase(BaseModel):
    email: EmailStr
    branch_id: Optional[int] = None

# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str
    role_id: Optional[int] = None

# Properties to receive via API on update
class UserUpdate(UserBase):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    status: Optional[str] = None
    role_id: Optional[int] = None
    branch_id: Optional[int] = None
    is_active: Optional[bool] = None
    access_permissions: Optional[dict] = None

# Properties in DB
class UserInDBBase(UserBase):
    id: int
    role_id: Optional[int] = None
    status: str
    is_active: bool = True
    is_superuser: bool = False
    access_permissions: Optional[dict] = None

    class Config:
        from_attributes = True

class User(UserInDBBase):
    role: Optional[RoleResponse] = None
    branch: Optional[BranchResponse] = None
