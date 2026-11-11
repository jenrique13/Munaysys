from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app import models
from app.repositories.base import BaseRepository

class UserRepository(BaseRepository[models.User]):
    def __init__(self, db: Session):
        super().__init__(models.User, db)

    def get_by_email(self, email: str) -> Optional[models.User]:
        return self.db.query(self.model).filter(self.model.email == email).first()

    def get_with_roles(self, user_id: int) -> Optional[models.User]:
        return self.db.query(self.model).options(
            joinedload(self.model.role),
            joinedload(self.model.branch)
        ).filter(self.model.id == user_id).first()

class RoleRepository(BaseRepository[models.Role]):
    def __init__(self, db: Session):
        super().__init__(models.Role, db)

    def get_by_name(self, name: str) -> Optional[models.Role]:
        return self.db.query(self.model).filter(self.model.name == name).first()
