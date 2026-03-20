from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any


# --- Roles ---

class RoleOut(BaseModel):
    id: int
    name: str
    permissions_json: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class RoleCreate(BaseModel):
    name: str
    permissions_json: Optional[Dict[str, Any]] = {}

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    permissions_json: Optional[Dict[str, Any]] = None

# --- Users ---

class UserConfigBase(BaseModel):
    status: Optional[str] = "active"
    is_active: Optional[bool] = True
    role_id: Optional[int] = None
    branch_id: Optional[int] = None

class UserConfigUpdate(UserConfigBase):
    access_permissions: Optional[Dict[str, bool]] = None
    password: Optional[str] = None


class UserConfigOut(BaseModel):
    id: int
    email: str
    status: str
    is_active: bool
    role_id: Optional[int]
    branch_id: Optional[int]
    access_permissions: Optional[Dict[str, Any]] = None
    role: Optional[RoleOut] = None
    branch: Optional[BranchOut] = None

    class Config:
        from_attributes = True


# --- Branches ---

class BranchBase(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = True
    config_json: Optional[Dict[str, Any]] = {}

class BranchCreate(BranchBase):
    pass

class BranchUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None
    config_json: Optional[Dict[str, Any]] = None

class BranchOut(BranchBase):
    id: int

    class Config:
        from_attributes = True

