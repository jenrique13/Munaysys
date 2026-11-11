from typing import List
from sqlalchemy.orm import Session, joinedload
from app import models
from app.repositories.base import BaseRepository

class ReceiptRepository(BaseRepository[models.Receipt]):
    def __init__(self, db: Session):
        super().__init__(models.Receipt, db)

    def get_by_branch(self, branch_id: int, skip: int = 0, limit: int = 100) -> List[models.Receipt]:
        q = self.db.query(self.model).options(joinedload(self.model.branch))
        if branch_id and branch_id > 0:
            q = q.filter(self.model.branch_id == branch_id)
        return q.order_by(self.model.date.desc()).offset(skip).limit(limit).all()

    def get_by_order(self, orden_id: int) -> List[models.Receipt]:
        return self.db.query(self.model).filter(self.model.orden_id == orden_id).all()

    def get_by_purchase(self, purchase_id: int) -> List[models.Receipt]:
        return self.db.query(self.model).filter(self.model.purchase_id == purchase_id).all()
