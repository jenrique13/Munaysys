from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app import models
from app.repositories.base import BaseRepository

class NotificationRepository(BaseRepository[models.Notification]):
    def __init__(self, db: Session):
        super().__init__(models.Notification, db)

    def get_for_user(self, user_id: int, role_name: str = None, branch_id: int = None, skip: int = 0, limit: int = 50) -> List[models.Notification]:
        """
        Fetches notifications matching user ID, role, or branch (broadcast).
        """
        filters = [models.Notification.user_id == user_id]
        if role_name:
            # Check if role_name is in target_roles comma-separated string
            filters.append(models.Notification.target_roles.contains(role_name.lower()))
            
        q = self.db.query(self.model).filter(or_(*filters))
        
        if branch_id:
            q = q.filter(or_(self.model.branch_id == branch_id, self.model.branch_id == None))
            
        return q.order_by(self.model.created_at.desc()).offset(skip).limit(limit).all()

    def mark_read(self, notification_id: int) -> bool:
        db_obj = self.get(notification_id)
        if db_obj:
            db_obj.is_read = True
            self.db.add(db_obj)
            return True
        return False
