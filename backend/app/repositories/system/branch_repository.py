from typing import List, Optional
from sqlalchemy.orm import Session
from app import models
from app.repositories.base import BaseRepository

class BranchRepository(BaseRepository[models.Branch]):
    def __init__(self, db: Session):
        super().__init__(models.Branch, db)

    def get_all_active(self) -> List[models.Branch]:
        return self.db.query(self.model).all()

class ExchangeRateRepository(BaseRepository[models.ExchangeRate]):
    def __init__(self, db: Session):
        super().__init__(models.ExchangeRate, db)

    def get_latest(self) -> Optional[models.ExchangeRate]:
        return self.db.query(self.model).order_by(self.model.date.desc()).first()
