from pydantic import BaseModel, field_validator
from typing import Optional, List, Any

class RoomBase(BaseModel):
    name: str
    branch_id: int
    type: str = "sala_reuniones"   # sala_reuniones | auditorio | hot_desk
    capacity: int = 1
    hourly_rate: float = 0.0
    status: str = "disponible"     # disponible | ocupado | mantenimiento
    is_active: bool = True
    amenities_json: List[Any] = []
    description: Optional[str] = None

    @field_validator('amenities_json', mode='before')
    @classmethod
    def validate_amenities(cls, v):
        if v is None or isinstance(v, dict):
            return []
        return v

class RoomCreate(RoomBase):
    pass

class RoomUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    capacity: Optional[int] = None
    hourly_rate: Optional[float] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None
    amenities_json: Optional[List[Any]] = None
    description: Optional[str] = None

class RoomOut(RoomBase):
    id: int
    is_occupied: bool = False
    occupancy_today_pct: float = 0.0
    
    class Config:
        from_attributes = True
