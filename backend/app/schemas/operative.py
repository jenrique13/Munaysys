from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List, Any
from datetime import datetime

# ── CLIENTS ────────────────────────────────────────────────
class ClientBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    branch_id: Optional[int] = None
    lead_id: Optional[int] = None
    ci_rif: Optional[str] = None
    status: str = "active"
    notes: Optional[str] = None

    @field_validator("email", mode="before")
    @classmethod
    def empty_string_to_none(cls, v):
        if v == "" or v == "None":
            return None
        return v

class ClientCreate(ClientBase):
    pass

class ClientUpdate(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    ci_rif: Optional[str] = None
    notes: Optional[str] = None

class ClientOut(ClientBase):
    id: int
    created_at: datetime
    active_membership_name: Optional[str] = None
    has_active_membership: bool = False
    
    class Config:
        from_attributes = True

# ── OFFICES ─────────────────────────────────────────────────
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

# ── ROOMS ───────────────────────────────────────────────────
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
    class Config:
        from_attributes = True

# ── MEMBERSHIPS ─────────────────────────────────────────────
class MembershipBase(BaseModel):
    client_id: int
    office_id: Optional[int] = None
    plan_name: str
    start_date: datetime
    end_date: Optional[datetime] = None
    hours_included: float = 0.0
    hours_used: float = 0.0
    price: float = 0.0
    status: str = "active"

class MembershipCreate(MembershipBase):
    pass

class MembershipUpdate(BaseModel):
    plan_name: Optional[str] = None
    end_date: Optional[datetime] = None
    hours_included: Optional[float] = None
    hours_used: Optional[float] = None
    price: Optional[float] = None
    status: Optional[str] = None

class MembershipOut(MembershipBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# ── AMENITY HISTORY ──────────────────────────────────────────
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
    class Config:
        from_attributes = True

# ── AMENITIES ───────────────────────────────────────────────
class AmenityBase(BaseModel):
    name: str
    branch_id: int
    space_id: Optional[int] = None
    space_type: Optional[str] = None    # office | room
    client_id: Optional[int] = None
    quantity: int = 1
    available: bool = True
    unit: str = "unidad"
    price: float = 0.0
    category: Optional[str] = None
    description: Optional[str] = None
    is_recurring: bool = False
    monthly_quota: int = 0

class AmenityCreate(AmenityBase):
    pass

class AmenityUpdate(BaseModel):
    quantity: Optional[int] = None
    available: Optional[bool] = None
    price: Optional[float] = None
    category: Optional[str] = None
    description: Optional[str] = None
    is_recurring: Optional[bool] = None
    monthly_quota: Optional[int] = None

class AmenityOut(AmenityBase):
    id: int
    class Config:
        from_attributes = True

# ── BOOKINGS ─────────────────────────────────────────────────
class BookingBase(BaseModel):
    room_id: int
    client_id: int
    start_time: datetime
    end_time: datetime
    status: str = "confirmed"
    notes: Optional[str] = None

class BookingCreate(BookingBase):
    pass

class BookingStatusUpdate(BaseModel):
    status: str  # confirmed | cancelled | pending

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

# ── CONTRACT TEMPLATES ───────────────────────────────────────
class ContractTemplateBase(BaseModel):
    name: str
    space_type: str  # privada | suite | loft | sala_reuniones | general
    body_html: str
    branch_id: Optional[int] = None
    is_active: bool = True

class ContractTemplateCreate(ContractTemplateBase):
    pass

class ContractTemplateUpdate(BaseModel):
    name: Optional[str] = None
    space_type: Optional[str] = None
    body_html: Optional[str] = None
    is_active: Optional[bool] = None

class ContractTemplateOut(ContractTemplateBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True
