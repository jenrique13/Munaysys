from pydantic import BaseModel, field_validator
from typing import Optional, List, Any

class OfficeBase(BaseModel):
    name: str
    branch_id: int
    category: str = "privada"      # privada | suite | loft
    capacity: int = 1
    monthly_rate: float = 0.0
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

class OfficeCreate(OfficeBase):
    pass

class OfficeUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    capacity: Optional[int] = None
    monthly_rate: Optional[float] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None
    amenities_json: Optional[List[Any]] = None
    description: Optional[str] = None

class OfficeOut(OfficeBase):
    id: int
    class Config:
        from_attributes = True
