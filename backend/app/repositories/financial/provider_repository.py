from typing import List, Optional
from sqlalchemy.orm import Session
from app import models
from app.repositories.base import BaseRepository

class ProviderRepository(BaseRepository[models.Provider]):
    def __init__(self, db: Session):
        super().__init__(models.Provider, db)

    def get_by_branch(self, branch_id: int, skip: int = 0, limit: int = 100) -> List[models.Provider]:
        query = self.db.query(self.model)
        # Providers are now global, we ignore branch_id for filtering
        return query.offset(skip).limit(limit).all()

class PayableRepository(BaseRepository[models.Payable]):
    def __init__(self, db: Session):
        super().__init__(models.Payable, db)

    def get_by_branch(self, branch_id: int, provider_id: Optional[int] = None, month: Optional[int] = None, year: Optional[int] = None, skip: int = 0, limit: int = 100) -> List[models.Payable]:
        query = self.db.query(self.model)
        if branch_id and branch_id > 0:
            query = query.filter(self.model.branch_id == branch_id)
        if provider_id:
            query = query.filter(self.model.provider_id == provider_id)
        if month:
            from sqlalchemy import extract
            query = query.filter(extract('month', self.model.due_date) == month)
        if year:
            from sqlalchemy import extract
            query = query.filter(extract('year', self.model.due_date) == year)
        return query.offset(skip).limit(limit).all()
