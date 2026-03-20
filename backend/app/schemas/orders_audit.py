from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

# --- ORDER AUDIT LOGS ---

class OrderAuditLogBase(BaseModel):
    orden_id: int
    user_id: Optional[int] = None
    action: str  # modified, deleted, created
    reason: Optional[str] = None
    changes_json: Optional[Dict[str, Any]] = {}

class OrderAuditLogCreate(OrderAuditLogBase):
    pass

class OrderAuditLogOut(OrderAuditLogBase):
    id: int
    created_at: datetime
    
    # Optional nested info about the user who made the change
    user_email: Optional[str] = None

    class Config:
        from_attributes = True
