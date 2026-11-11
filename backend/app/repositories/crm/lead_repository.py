from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.models import Lead, Opportunity, PipelineStage
from app.repositories.base import BaseRepository

class LeadRepository(BaseRepository[Lead]):
    def __init__(self, db: Session):
        super().__init__(Lead, db)

    def get_active_leads(self, branch_id: int, skip: int = 0, limit: int = 100) -> List[Lead]:
        q = self.db.query(self.model).options(joinedload(Lead.branch)).filter(self.model.status != 'archived')
        if branch_id and branch_id > 0:
            q = q.filter(self.model.branch_id == branch_id)
        return q.order_by(self.model.created_at.desc()).offset(skip).limit(limit).all()

class OpportunityRepository(BaseRepository[Opportunity]):
    def __init__(self, db: Session):
        super().__init__(Opportunity, db)

    def get_by_branch(self, branch_id: int) -> List[Opportunity]:
        q = self.db.query(self.model).join(Lead).options(joinedload(Opportunity.lead))
        if branch_id and branch_id > 0:
            q = q.filter(Lead.branch_id == branch_id)
        return q.all()

class PipelineStageRepository(BaseRepository[PipelineStage]):
    def __init__(self, db: Session):
        super().__init__(PipelineStage, db)

    def get_by_branch(self, branch_id: int) -> List[PipelineStage]:
        q = self.db.query(self.model)
        if branch_id and branch_id > 0:
            q = q.filter(self.model.branch_id == branch_id)
        return q.order_by(self.model.order_index).all()
