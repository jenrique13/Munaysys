from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PedidoBase(BaseModel):
    item_type: str  # product, package, amenity, room
    item_id: int
    item_name: Optional[str] = None
    quantity: float = 1.0
    unit_price: float = 0.0
    discount: float = 0.0
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    service_id: Optional[int] = None

class PedidoCreate(PedidoBase):
    pass

class Pedido(PedidoBase):
    id: int
    orden_id: int
    subtotal: float
    amenity_id: Optional[int] = None
    amenity_quantity: float = 0.0
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    service_id: Optional[int] = None

    class Config:
        from_attributes = True
