from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.api.deps import get_current_user, get_target_branch_id, get_uow
from app.schemas import crm as schemas
from app.api import quotes as quotes_router
from app.uow.unit_of_work import UnitOfWork
from app.use_cases.crm import GetCRMDataUseCase, LeadUseCases, OpportunityUseCases

router = APIRouter()
router.include_router(quotes_router.router, prefix="/quotes", tags=["quotes"])

# --- STAGES ---
@router.get("/stages", response_model=List[schemas.PipelineStage])
def read_stages(
    branch_id: Optional[int] = None,
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    """Retorna las columnas del Kanban ordenadas por order_index"""
    actual_branch_id = branch_id if branch_id is not None else target_branch_id
    use_case = GetCRMDataUseCase(uow)
    return use_case.get_stages(actual_branch_id)

@router.post("/stages", response_model=schemas.PipelineStage)
def create_stage(
    stage_in: schemas.PipelineStageCreate,
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    if not stage_in.branch_id:
        stage_in.branch_id = target_branch_id or current_user.branch_id or 1
    
    db_stage = uow.stages.create(stage_in.model_dump())
    uow.commit()
    uow.refresh(db_stage)
    return db_stage


# --- LEADS ---
@router.get("/leads", response_model=List[schemas.Lead])
def read_leads(
    skip: int = 0, limit: int = 100,
    branch_id: Optional[int] = None,
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    actual_branch_id = branch_id if branch_id is not None else target_branch_id
    use_case = GetCRMDataUseCase(uow)
    return use_case.get_leads(actual_branch_id, skip=skip, limit=limit)

@router.post("/leads", response_model=schemas.Lead)
def create_lead(
    lead_in: schemas.LeadCreate,
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    if not lead_in.branch_id:
        lead_in.branch_id = target_branch_id or current_user.branch_id or 1
    
    use_case = LeadUseCases(uow)
    return use_case.create(lead_in)

@router.put("/leads/{lead_id}", response_model=schemas.Lead)
def update_lead(
    lead_id: int,
    lead_update: schemas.LeadUpdate,
    current_user: models.User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
):
    use_case = LeadUseCases(uow)
    lead = use_case.update(lead_id, lead_update)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    return lead

@router.put("/leads/{lead_id}/archive", response_model=schemas.Lead)
def archive_lead(
    lead_id: int,
    current_user: models.User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
):
    use_case = LeadUseCases(uow)
    lead = use_case.archive(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    return lead

@router.delete("/leads/{lead_id}", status_code=204)
def delete_lead(
    lead_id: int,
    current_user: models.User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
):
    use_case = LeadUseCases(uow)
    lead = use_case.delete(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    return None


# --- OPPORTUNITIES (CRM KANBAN) ---
@router.get("/opportunities", response_model=List[schemas.Opportunity])
def read_opportunities(
    branch_id: Optional[int] = None,
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    """Retorna todas las cards de oportunidad para renderizar en el kanban"""
    actual_branch_id = branch_id if branch_id is not None else target_branch_id
    use_case = GetCRMDataUseCase(uow)
    return use_case.get_opportunities(actual_branch_id)

@router.post("/opportunities", response_model=schemas.Opportunity)
def create_opportunity(
    opp_in: schemas.OpportunityCreate,
    current_user: models.User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
):
    use_case = OpportunityUseCases(uow)
    return use_case.create(opp_in)

@router.put("/opportunities/{opp_id}/stage")
def update_stage_drag_and_drop(
    opp_id: int,
    stage_update: schemas.OpportunityUpdate,
    current_user: models.User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
):
    """Recibe la actualización de fase mediante el evento onDragEnd de DnD de Frontend.
    Si el stage de destino es de tipo 'Ganado', convierte el Lead en Cliente automáticamente."""
    if stage_update.stage_id is None:
        raise HTTPException(status_code=400, detail="stage_id es requerido")

    use_case = OpportunityUseCases(uow)
    result = use_case.update_stage_drag_and_drop(opp_id, stage_update.stage_id)
    
    if result is None:
        raise HTTPException(status_code=404, detail="Oportunidad no encontrada")

    opp, new_client = result

    # Serializar la oportunidad usando el schema
    opp_data = schemas.Opportunity.model_validate(opp).model_dump()

    # Adjuntar metadatos de conversión si se creó un cliente nuevo
    response = {**opp_data, "client_created": None}
    if new_client:
        response["client_created"] = {
            "id": new_client.id,
            "name": new_client.name,
            "email": new_client.email,
        }

    return response

