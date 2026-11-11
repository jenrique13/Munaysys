from app.uow.unit_of_work import UnitOfWork
from app import schemas

class GetCRMDataUseCase:
    def __init__(self, uow: UnitOfWork):
        self.uow = uow

    def get_stages(self, branch_id: int):
        return self.uow.stages.get_by_branch(branch_id)

    def get_leads(self, branch_id: int, skip: int = 0, limit: int = 100):
        return self.uow.leads.get_active_leads(branch_id, skip, limit)

    def get_opportunities(self, branch_id: int):
        return self.uow.opportunities.get_by_branch(branch_id)
