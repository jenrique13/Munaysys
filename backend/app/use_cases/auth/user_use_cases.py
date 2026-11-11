from typing import List, Optional
from app import models, schemas
from app.uow.unit_of_work import UnitOfWork
from app.core.security import get_password_hash

class UserUseCases:
    def __init__(self, uow: UnitOfWork):
        self.uow = uow

    def get_by_id(self, user_id: int) -> Optional[models.User]:
        return self.uow.users.get_with_roles(user_id)

    def create(self, user_in: schemas.auth.user.UserCreate):
        # 1. Check if email exists
        if self.uow.users.get_by_email(user_in.email):
            raise ValueError("Email already in use.")

        # 2. Create user with hashed password
        db_user = models.User(
            email=user_in.email,
            password_hash=get_password_hash(user_in.password),
            branch_id=user_in.branch_id,
            role_id=user_in.role_id,
            is_active=True,
            status="active"
        )
        self.uow.db.add(db_user)
        self.uow.commit()
        self.uow.refresh(db_user)
        return db_user

    def update(self, user_id: int, user_in: schemas.auth.user.UserUpdate):
        db_user = self.uow.users.get(user_id)
        if not db_user:
            return None
            
        update_data = user_in.model_dump(exclude_unset=True)
        if "password" in update_data:
            update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
            
        self.uow.users.update(db_user, update_data)
        self.uow.commit()
        self.uow.refresh(db_user)
        return db_user
