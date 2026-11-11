from datetime import datetime
from app import models, schemas
from app.uow.unit_of_work import UnitOfWork

class InventoryUseCases:
    def __init__(self, uow: UnitOfWork):
        self.uow = uow

    def record_usage(self, usage_in: schemas.financial.consumable.ConsumableUsageCreate, user_email: str):
        # 1. Update stock
        self.uow.consumables.update_stock(usage_in.consumable_id, usage_in.quantity)
        
        # 2. Record usage history
        db_usage = models.ConsumableUsage(
            consumable_id=usage_in.consumable_id,
            quantity=usage_in.quantity,
            reason=usage_in.reason,
            branch_id=usage_in.branch_id,
            user_email=user_email,
            created_at=datetime.utcnow()
        )
        self.uow.db.add(db_usage)
        
        self.uow.commit()
        self.uow.refresh(db_usage)
        return db_usage
