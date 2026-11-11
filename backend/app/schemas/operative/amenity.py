from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class AmenityBase(BaseModel):
    name: str
    branch_id: int
    space_id: Optional[int] = None
    space_type: Optional[str] = None    # office | room
    client_id: Optional[int] = None
    membership_id: Optional[int] = None
    quantity: float = 1.0
    available: bool = True
    unit: str = "unidad"
    price: float = 0.0
    service_id: Optional[int] = None
    category: Optional[str] = None
    description: Optional[str] = None
    is_recurring: bool = False
    monthly_quota: float = 0.0
    is_active: bool = True

class AmenityCreate(AmenityBase):
    pass

class AmenityUpdate(BaseModel):
    quantity: Optional[float] = None
    available: Optional[bool] = None
    price: Optional[float] = None
    category: Optional[str] = None
    description: Optional[str] = None
    is_recurring: Optional[bool] = None
    monthly_quota: Optional[float] = None
    is_active: Optional[bool] = None

class AmenityOut(AmenityBase):
    id: int
    class Config:
        from_attributes = True

class AmenityHistoryBase(BaseModel):
    amenity_id: int
    client_id: int
    old_quantity: float
    new_quantity: float
    change: float
    reason: Optional[str] = None

class AmenityHistoryCreate(AmenityHistoryBase):
    pass

class AmenityHistoryOut(AmenityHistoryBase):
    id: int
    created_at: datetime
    amenity: Optional[AmenityOut] = None
    class Config:
        from_attributes = True

# --- TEMPLATES ---

class AmenityTemplateItemBase(BaseModel):
    service_id: int
    quantity: float = 1.0

class AmenityTemplateItemCreate(AmenityTemplateItemBase):
    pass

class AmenityTemplateItemOut(AmenityTemplateItemBase):
    id: int
    class Config:
        from_attributes = True

class AmenityTemplateBase(BaseModel):
    name: str
    space_type: str
    category_name: str
    branch_id: Optional[int] = None
    is_active: bool = True

class AmenityTemplateCreate(AmenityTemplateBase):
    items: List[AmenityTemplateItemCreate] = []

class AmenityTemplateUpdate(BaseModel):
    name: Optional[str] = None
    space_type: Optional[str] = None
    category_name: Optional[str] = None
    is_active: Optional[bool] = None
    items: Optional[List[AmenityTemplateItemCreate]] = None

class AmenityTemplateOut(AmenityTemplateBase):
    id: int
    items: List[AmenityTemplateItemOut] = []
    class Config:
        from_attributes = True
