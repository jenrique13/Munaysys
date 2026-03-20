from sqlalchemy.orm import Session
from app import models
from app.schemas.system import NotificationCreate

def create_notification(db: Session, notification: NotificationCreate):
    db_notif = models.Notification(**notification.model_dump())
    db.add(db_notif)
    db.commit()
    db.refresh(db_notif)
    return db_notif

def get_notifications_for_user(db: Session, user: models.User, skip: int = 0, limit: int = 50):
    # Fetch notifications specifically for this user OR targeted at their role AND branch
    # To keep it simple, we use a basic OR logic if target_roles contains user.role
    
    role = user.role or ""
    
    # Base query for user's branch or global
    q = db.query(models.Notification).filter(
        (models.Notification.branch_id == user.branch_id) | (models.Notification.branch_id == None)
    )
    
    # Filter by user_id OR role matched
    q = q.filter(
        (models.Notification.user_id == user.id) | 
        (models.Notification.target_roles.contains(role))
    )
    
    return q.order_by(models.Notification.created_at.desc()).offset(skip).limit(limit).all()

def mark_notification_read(db: Session, notification_id: int):
    db_notif = db.query(models.Notification).filter(models.Notification.id == notification_id).first()
    if db_notif:
        db_notif.is_read = True
        db.commit()
        return True
    return False
