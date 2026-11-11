from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.schemas.user import BranchResponse
from app.schemas.financial.pedido import Pedido, PedidoCreate
from app.schemas.financial.receipt import Receipt
from app.schemas.operative.client import ClientOut

class OrdenBase(BaseModel):
    client_id: int
    branch_id: int
    discount: Optional[float] = 0.0
    discount_type: str = "amount"  # amount | percentage
    apply_tax: bool = True
    igtf_amount: Optional[float] = 0.0
    status: str = "pending"  # pending, partial, paid, cancelled

class OrdenCreate(OrdenBase):
    details: List[PedidoCreate]

class OrdenUpdate(BaseModel):
    client_id: Optional[int] = None
    discount: Optional[float] = None
    discount_type: Optional[str] = None  # amount | percentage
    status: Optional[str] = None
    apply_tax: Optional[bool] = None
    details: Optional[List[PedidoCreate]] = None
    reason: str  # Mandatory reason for audit log when updating

class Orden(OrdenBase):
    id: int
    date: datetime
    subtotal: Optional[float] = 0.0
    discount_type: str = "amount"
    tax: Optional[float] = 0.0  # 16% IVA
    total: Optional[float] = 0.0
    igtf_amount: Optional[float] = 0.0
    details: List[Pedido] = []
    receipts: List[Receipt] = []
    branch: Optional[BranchResponse] = None
    client: Optional[ClientOut] = None

    class Config:
        from_attributes = True
