from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ServiceBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float = 0.0
    is_active: bool = True
    is_amenity: bool = False
    is_room_rate: bool = False
    branch_id: int

class ServiceCreate(ServiceBase):
    pass

class Service(ServiceBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
