from typing import List
from sqlalchemy.orm import Session
from app import models
from app.repositories.base import BaseRepository

class ServiceRepository(BaseRepository[models.Service]):
    def __init__(self, db: Session):
        super().__init__(models.Service, db)

    def get_by_branch(self, branch_id: int, skip: int = 0, limit: int = 100) -> List[models.Service]:
        q = self.db.query(self.model)
        if branch_id and branch_id > 0:
            q = q.filter(self.model.branch_id == branch_id)
        return q.offset(skip).limit(limit).all()

class PackageRepository(BaseRepository[models.Package]):
    def __init__(self, db: Session):
        super().__init__(models.Package, db)

    def get_by_branch(self, branch_id: int, skip: int = 0, limit: int = 100) -> List[models.Package]:
        q = self.db.query(self.model)
        if branch_id and branch_id > 0:
            q = q.filter(self.model.branch_id == branch_id)
        return q.offset(skip).limit(limit).all()
