from typing import List
from sqlalchemy.orm import Session
from app import models
from app.repositories.base import BaseRepository

class ProductRepository(BaseRepository[models.Product]):
    def __init__(self, db: Session):
        super().__init__(models.Product, db)

    def get_by_branch(self, branch_id: int, skip: int = 0, limit: int = 100) -> List[models.Product]:
        q = self.db.query(self.model)
        if branch_id and branch_id > 0:
            q = q.filter(self.model.branch_id == branch_id)
        return q.offset(skip).limit(limit).all()

    def update_stock(self, product_id: int, quantity_change: int) -> models.Product:
        db_product = self.get(product_id)
        if db_product:
            db_product.stock += quantity_change
            self.db.add(db_product)
        return db_product
