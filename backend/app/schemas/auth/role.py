from pydantic import BaseModel
from typing import Optional, Dict, Any

class RoleResponse(BaseModel):
    id: int
    name: str
    permissions_json: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class RoleCreate(BaseModel):
    name: str
    permissions_json: Optional[Dict[str, Any]] = None

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    permissions_json: Optional[Dict[str, Any]] = None
