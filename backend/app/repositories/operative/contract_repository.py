from typing import List, Optional
from sqlalchemy.orm import Session
from app import models
from app.repositories.base import BaseRepository

class ContractTemplateRepository(BaseRepository[models.ContractTemplate]):
    def __init__(self, db: Session):
        super().__init__(models.ContractTemplate, db)

    def get_by_branch(self, branch_id: int) -> List[models.ContractTemplate]:
        return self.db.query(self.model).filter(
            (self.model.branch_id == branch_id) | (self.model.branch_id == None)
        ).all()
