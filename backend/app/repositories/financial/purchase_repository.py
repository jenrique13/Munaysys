from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app import models
from app.repositories.base import BaseRepository

class PurchaseDetailRepository(BaseRepository[models.PurchaseDetail]):
    def __init__(self, db: Session):
        super().__init__(models.PurchaseDetail, db)

    def get_by_purchase(self, purchase_id: int) -> List[models.PurchaseDetail]:
        return self.db.query(self.model).filter(self.model.purchase_id == purchase_id).all()

class PurchaseRepository(BaseRepository[models.Purchase]):
    def __init__(self, db: Session):
        super().__init__(models.Purchase, db)

    def get_by_branch(self, branch_id: int, skip: int = 0, limit: int = 100) -> List[models.Purchase]:
        q = self.db.query(self.model)
        if branch_id and branch_id > 0:
            q = q.filter(self.model.branch_id == branch_id)
        return q.order_by(self.model.date.desc()).offset(skip).limit(limit).all()

    def get_with_details(self, purchase_id: int) -> Optional[models.Purchase]:
        return self.db.query(self.model).options(
            joinedload(self.model.details),
            joinedload(self.model.receipts)
        ).filter(self.model.id == purchase_id).first()
