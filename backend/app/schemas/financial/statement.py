from pydantic import BaseModel
from typing import List, Optional
from .order import Orden
from .receipt import Receipt
from app.schemas.operative.amenity import AmenityOut, AmenityHistoryOut

class ClientStatement(BaseModel):
    client_id: int
    total_charges: float
    total_paid: float
    balance: float
    orders: List[Orden]
    receipts: List[Receipt]
    amenities: Optional[List[AmenityOut]] = []
    amenity_history: Optional[List[AmenityHistoryOut]] = []
