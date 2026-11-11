from typing import List
from sqlalchemy.orm import Session, joinedload
from app import models
from app.repositories.base import BaseRepository

class ConsumableCategoryRepository(BaseRepository[models.ConsumableCategory]):
    def __init__(self, db: Session):
        super().__init__(models.ConsumableCategory, db)

    def get_by_branch(self, branch_id: int, skip: int = 0, limit: int = 100) -> List[models.ConsumableCategory]:
        q = self.db.query(self.model)
        if branch_id and branch_id > 0:
            q = q.filter(self.model.branch_id == branch_id)
        return q.offset(skip).limit(limit).all()

class ConsumableRepository(BaseRepository[models.Consumable]):
    def __init__(self, db: Session):
        super().__init__(models.Consumable, db)

    def get_by_branch(self, branch_id: int, skip: int = 0, limit: int = 100) -> List[models.Consumable]:
        q = self.db.query(self.model)
        if branch_id and branch_id > 0:
            q = q.filter(self.model.branch_id == branch_id)
        return q.offset(skip).limit(limit).all()

    def update_stock(self, item_id: int, quantity_change: int) -> models.Consumable:
        db_item = self.get(item_id)
        if db_item:
            db_item.stock -= quantity_change
            self.db.add(db_item)
        return db_item

class ConsumableUsageRepository(BaseRepository[models.ConsumableUsage]):
    def __init__(self, db: Session):
        super().__init__(models.ConsumableUsage, db)

    def get_by_branch(self, branch_id: int, skip: int = 0, limit: int = 100) -> List[models.ConsumableUsage]:
        q = self.db.query(self.model).options(joinedload(models.ConsumableUsage.consumable))
        if branch_id and branch_id > 0:
            q = q.filter(self.model.branch_id == branch_id)
        return q.order_by(models.ConsumableUsage.created_at.desc()).offset(skip).limit(limit).all()
