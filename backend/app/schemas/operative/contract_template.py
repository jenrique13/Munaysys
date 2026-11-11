from pydantic import BaseModel
from typing import Optional
from datetime import datetime

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
