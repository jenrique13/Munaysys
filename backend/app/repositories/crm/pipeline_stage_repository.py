from typing import List
from sqlalchemy.orm import Session
from app.models import PipelineStage
from app.repositories.base import BaseRepository

class PipelineStageRepository(BaseRepository[PipelineStage]):
    def __init__(self, db: Session):
        super().__init__(PipelineStage, db)

    def get_by_branch(self, branch_id: int) -> List[PipelineStage]:
        q = self.db.query(self.model)
        if branch_id and branch_id > 0:
            q = q.filter(self.model.branch_id == branch_id)
        return q.order_by(self.model.order_index.asc()).all()
