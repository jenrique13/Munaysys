from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app import models
from app.repositories.base import BaseRepository

class PedidoRepository(BaseRepository[models.Pedido]):
    def __init__(self, db: Session):
        super().__init__(models.Pedido, db)

    def get_by_order(self, orden_id: int) -> List[models.Pedido]:
        return self.db.query(self.model).filter(self.model.orden_id == orden_id).all()

class OrderRepository(BaseRepository[models.Orden]):
    def __init__(self, db: Session):
        super().__init__(models.Orden, db)

    def get_by_branch(self, branch_id: int, skip: int = 0, limit: int = 100, search: str = None, status: str = None) -> List[models.Orden]:
        q = self.db.query(self.model).join(models.Client).options(
            joinedload(models.Orden.client),
            joinedload(models.Orden.branch),
            joinedload(models.Orden.details),
            joinedload(models.Orden.receipts)
        )
        if branch_id and branch_id > 0:
            q = q.filter(self.model.branch_id == branch_id)
            
        if status and status != 'all':
            q = q.filter(self.model.status == status)
            
        if search:
            search_filter = f"%{search}%"
            # Support searching by client name OR order ID
            is_digit = search.isdigit()
            if is_digit:
                q = q.filter((models.Client.name.ilike(search_filter)) | (self.model.id == int(search)))
            else:
                q = q.filter(models.Client.name.ilike(search_filter))
                
        return q.order_by(self.model.date.desc()).offset(skip).limit(limit).all()

    def get_with_details(self, orden_id: int) -> Optional[models.Orden]:
        return self.db.query(self.model).options(
            joinedload(self.model.details),
            joinedload(self.model.receipts)
        ).filter(self.model.id == orden_id).first()
