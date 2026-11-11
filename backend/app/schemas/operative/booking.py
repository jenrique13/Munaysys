from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.operative.room import RoomOut
from app.schemas.operative.client import ClientOut

class BookingBase(BaseModel):
    room_id: int
    client_id: int
    start_time: datetime
    end_time: datetime
    status: str = "confirmed"
    total_hours: float = 0.0
    total_cost: float = 0.0
    notes: Optional[str] = None
    service_id: Optional[int] = None

class BookingCreate(BookingBase):
    pass

class BookingStatusUpdate(BaseModel):
    status: str  # confirmed | cancelled | pending

class BookingUpdate(BaseModel):
    room_id: Optional[int] = None
    client_id: Optional[int] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    service_id: Optional[int] = None

class BookingOut(BookingBase):
    id: int
    total_hours: float
    total_cost: float
    orden_id: Optional[int] = None
    created_at: datetime
    room: RoomOut
    client: ClientOut
    
    class Config:
        from_attributes = True
