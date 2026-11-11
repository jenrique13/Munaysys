from typing import List
from sqlalchemy.orm import Session
from app.models import Opportunity, Lead, PipelineStage
from app.repositories.base import BaseRepository

class OpportunityRepository(BaseRepository[Opportunity]):
    def __init__(self, db: Session):
        super().__init__(Opportunity, db)

    def get_by_branch(self, branch_id: int) -> List[Opportunity]:
        q = self.db.query(self.model).join(PipelineStage)
        if branch_id and branch_id > 0:
            q = q.filter(PipelineStage.branch_id == branch_id)
        return q.filter(self.model.lead.has(Lead.status != 'archived')).all()
