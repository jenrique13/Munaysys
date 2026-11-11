from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app import models
from app.repositories.base import BaseRepository

class MembershipRepository(BaseRepository[models.Membership]):
    def __init__(self, db: Session):
        super().__init__(models.Membership, db)

    def get_multi(self, skip: int = 0, limit: int = 1000) -> List[models.Membership]:
        return self.db.query(self.model).options(
            joinedload(models.Membership.client),
            joinedload(models.Membership.office)
        ).order_by(self.model.id.desc()).offset(skip).limit(limit).all()

    def get_by_client(self, client_id: int) -> List[models.Membership]:
        return self.db.query(self.model).options(
            joinedload(models.Membership.client),
            joinedload(models.Membership.office)
        ).filter(self.model.client_id == client_id).all()

    def get_active_by_client(self, client_id: int) -> Optional[models.Membership]:
        return self.db.query(self.model).options(
            joinedload(models.Membership.client),
            joinedload(models.Membership.office)
        ).filter(
            self.model.client_id == client_id,
            self.model.status == "active"
        ).first()
