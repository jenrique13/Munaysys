from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any

class RoleResponse(BaseModel):
    id: int
    name: str
    permissions_json: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class BranchResponse(BaseModel):
    id: int
    name: str
    color: Optional[str] = '#4F46E5'

    class Config:
        from_attributes = True

# Base Properties
class UserBase(BaseModel):
    email: EmailStr
    branch_id: Optional[int] = None

# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str

# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = None
    status: Optional[str] = None

# Properties to return via API
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

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[int] = None
