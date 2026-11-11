from datetime import datetime
from typing import Optional, Tuple
from app.uow.unit_of_work import UnitOfWork
from app import models, schemas

class OpportunityUseCases:
    def __init__(self, uow: UnitOfWork):
        self.uow = uow

    def get_all_for_kanban(self, branch_id: int):
        return self.uow.opportunities.get_by_branch(branch_id)

    def create(self, opp_in: schemas.crm.OpportunityCreate):
        db_opp = self.uow.opportunities.create(opp_in.model_dump())
        self.uow.commit()
        self.uow.refresh(db_opp)
        return db_opp

    def update_stage_drag_and_drop(self, opp_id: int, stage_id: int) -> Optional[Tuple[models.Opportunity, Optional[models.Client]]]:
        """
        Mueve la oportunidad a un nuevo stage y, si el stage es de tipo 'Ganado',
        convierte el Lead en Cliente automáticamente dentro de una transacción atómica.
        """
        db_opp = self.uow.opportunities.get(opp_id)
        if not db_opp:
            return None

        db_stage = self.uow.stages.get(stage_id)
        db_opp.stage_id = stage_id

        # Detect if destination stage is "Won"
        is_win_stage = db_stage and any(
            x in db_stage.name.lower() for x in ["ganado", "won", "cerrado"]
        )

        new_client = None
        if is_win_stage:
            db_opp.won_date = datetime.utcnow()
            
            # Update Lead status to 'won'
            lead = db_opp.lead
            if lead:
                lead.status = "won"
                # Use repository to get or create client
                new_client = self.uow.clients.get_or_create_from_lead(lead)

        self.uow.commit()
        self.uow.refresh(db_opp)
        if new_client:
            self.uow.refresh(new_client)
            
        return db_opp, new_client
