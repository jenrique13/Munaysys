from typing import List, Optional
from sqlalchemy import extract
from sqlalchemy.orm import Session, joinedload
from app import models
from app.repositories.base import BaseRepository

class CashMovementRepository(BaseRepository[models.CashMovement]):
    def __init__(self, db: Session):
        super().__init__(models.CashMovement, db)

    def get_by_branch(self, branch_id: int, skip: int = 0, limit: int = 100, month: Optional[int] = None, year: Optional[int] = None) -> List[models.CashMovement]:
        q = self.db.query(self.model).options(joinedload(self.model.branch))
        if branch_id and branch_id > 0:
            q = q.filter(self.model.branch_id == branch_id)
        
        if year:
            q = q.filter(extract('year', self.model.date) == year)
            
        if month and month > 0: # 0 means "all months" in frontend
            q = q.filter(extract('month', self.model.date) == month)
            
        return q.order_by(self.model.date.desc()).offset(skip).limit(limit).all()

class CashCategoryRepository(BaseRepository[models.CashCategory]):
    def __init__(self, db: Session):
        super().__init__(models.CashCategory, db)

    def get_all(self, branch_id: int = None) -> List[models.CashCategory]:
        q = self.db.query(self.model).filter(self.model.is_active == True)
        # Categories can be global (branch_id=None) or branch-specific
        if branch_id:
            q = q.filter((self.model.branch_id == branch_id) | (self.model.branch_id == None))
        return q.all()

class PaymentMethodRepository(BaseRepository[models.PaymentMethod]):
    def __init__(self, db: Session):
        super().__init__(models.PaymentMethod, db)

    def get_active(self, branch_id: int = None) -> List[models.PaymentMethod]:
        q = self.db.query(self.model).filter(self.model.is_active == True)
        if branch_id:
            q = q.filter((self.model.branch_id == branch_id) | (self.model.branch_id == None))
        return q.all()
