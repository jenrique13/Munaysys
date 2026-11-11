from typing import List
from sqlalchemy.orm import Session
from app import models
from app.repositories.base import BaseRepository

class ExpenseRepository(BaseRepository[models.Expense]):
    def __init__(self, db: Session):
        super().__init__(models.Expense, db)

    def get_by_branch(self, branch_id: int, skip: int = 0, limit: int = 100) -> List[models.Expense]:
        q = self.db.query(self.model)
        if branch_id and branch_id > 0:
            q = q.filter(self.model.branch_id == branch_id)
        return q.order_by(self.model.date.desc()).offset(skip).limit(limit).all()
