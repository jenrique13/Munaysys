from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

class PackageBase(BaseModel):
    name: str
    price: float = 0.0
    items_json: Any = []  # Configuración del paquete
    branch_id: int

class PackageCreate(PackageBase):
    pass

class Package(PackageBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
