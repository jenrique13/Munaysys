from app.uow.unit_of_work import UnitOfWork
from app.schemas.crm import LeadCreate, LeadUpdate

class LeadUseCases:
    def __init__(self, uow: UnitOfWork):
        self.uow = uow

    def create(self, lead_in: LeadCreate):
        db_lead = self.uow.leads.create(lead_in.model_dump())
        self.uow.commit()
        self.uow.refresh(db_lead)
        return db_lead

    def update(self, lead_id: int, lead_update: LeadUpdate):
        db_lead = self.uow.leads.get(lead_id)
        if not db_lead:
            return None
        update_data = lead_update.model_dump(exclude_unset=True)
        self.uow.leads.update(db_lead, update_data)
        self.uow.commit()
        self.uow.refresh(db_lead)
        return db_lead

    def archive(self, lead_id: int):
        db_lead = self.uow.leads.get(lead_id)
        if not db_lead:
            return None
        self.uow.leads.update(db_lead, {"status": "archived"})
        self.uow.commit()
        self.uow.refresh(db_lead)
        return db_lead

    def delete(self, lead_id: int):
        # We need to manually delete dependencies or use cascade
        # In this clean architecture, the Repository could handle it or the Use Case
        db_lead = self.uow.leads.get(lead_id)
        if not db_lead:
            return None
        self.uow.leads.remove(lead_id)
        self.uow.commit()
        return db_lead
