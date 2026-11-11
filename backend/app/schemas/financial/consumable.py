from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.user import BranchResponse

class ConsumableCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    branch_id: int
    is_active: bool = True

class ConsumableCategoryCreate(ConsumableCategoryBase):
    pass

class ConsumableCategory(ConsumableCategoryBase):
    id: int

    class Config:
        from_attributes = True

class ConsumableBase(BaseModel):
    name: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    cost: float = 0.0
    stock: int = 0
    unit: str = "unit"
    is_active: bool = True
    branch_id: int

class ConsumableCreate(ConsumableBase):
    pass

class Consumable(ConsumableBase):
    id: int
    created_at: datetime
    category: Optional[ConsumableCategory] = None

    class Config:
        from_attributes = True

class ConsumableUsageBase(BaseModel):
    consumable_id: int
    quantity: int
    reason: str
    branch_id: int

class ConsumableUsageCreate(ConsumableUsageBase):
    pass

class ConsumableUsage(ConsumableUsageBase):
    id: int
    user_email: Optional[str] = None
    created_at: datetime
    consumable: Optional[Consumable] = None
    branch: Optional[BranchResponse] = None

    class Config:
        from_attributes = True
