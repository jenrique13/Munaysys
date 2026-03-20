from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app import models, schemas
from app.core.security import get_password_hash
# --- USERS ---

def get_user_config(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).options(
        joinedload(models.User.role),
        joinedload(models.User.branch)
    ).filter(models.User.id == user_id).first()

def get_users_config(db: Session, skip: int = 0, limit: int = 100) -> List[models.User]:
    return db.query(models.User).options(
        joinedload(models.User.role),
        joinedload(models.User.branch)
    ).offset(skip).limit(limit).all()

def update_user_config(db: Session, user_id: int, obj_in: schemas.UserConfigUpdate) -> Optional[models.User]:
    db_obj = get_user_config(db, user_id)
    if not db_obj:
        return None
        
    update_data = obj_in.model_dump(exclude_unset=True)
    
    if "password" in update_data and update_data["password"]:
        db_obj.password_hash = get_password_hash(update_data["password"])
        del update_data["password"]
    
    for field, value in update_data.items():
        setattr(db_obj, field, value)
        
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_user(db: Session, user_id: int) -> bool:
    db_obj = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_obj:
        return False
    db.delete(db_obj)
    db.commit()
    return True


# --- BRANCHES ---

def get_branch(db: Session, branch_id: int) -> Optional[models.Branch]:
    return db.query(models.Branch).filter(models.Branch.id == branch_id).first()

def get_branches(db: Session, skip: int = 0, limit: int = 100) -> List[models.Branch]:
    return db.query(models.Branch).offset(skip).limit(limit).all()

def create_branch(db: Session, obj_in: schemas.BranchCreate) -> models.Branch:
    db_obj = models.Branch(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_branch(db: Session, branch_id: int, obj_in: schemas.BranchUpdate) -> Optional[models.Branch]:
    db_obj = get_branch(db, branch_id)
    if not db_obj:
        return None
        
    update_data = obj_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
        
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


# --- ROLES ---

def get_role(db: Session, role_id: int) -> Optional[models.Role]:
    return db.query(models.Role).filter(models.Role.id == role_id).first()

def create_role(db: Session, obj_in: schemas.RoleCreate) -> models.Role:
    db_obj = models.Role(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_role(db: Session, role_id: int, obj_in: schemas.RoleUpdate) -> Optional[models.Role]:
    db_obj = get_role(db, role_id)
    if not db_obj:
        return None
        
    update_data = obj_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
        
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_role(db: Session, role_id: int) -> bool:
    db_obj = get_role(db, role_id)
    if not db_obj:
        return False
    
    # Check if role is used by users
    user_count = db.query(models.User).filter(models.User.role_id == role_id).count()
    if user_count > 0:
        return False # Cannot delete role in use
        
    db.delete(db_obj)
    db.commit()
    return True
