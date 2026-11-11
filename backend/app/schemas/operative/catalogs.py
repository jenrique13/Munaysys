from pydantic import BaseModel
from typing import Optional

class SpaceCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True
    branch_id: Optional[int] = None

class SpaceCategoryCreate(SpaceCategoryBase):
    pass

class SpaceCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class SpaceCategoryOut(SpaceCategoryBase):
    id: int

    class Config:
        from_attributes = True


class RoomTypeBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True
    branch_id: Optional[int] = None

class RoomTypeCreate(RoomTypeBase):
    pass

class RoomTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class RoomTypeOut(RoomTypeBase):
    id: int

    class Config:
        from_attributes = True
