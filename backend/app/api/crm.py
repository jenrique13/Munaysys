from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.api.deps import get_current_user, get_target_branch_id
from app.schemas import crm as schemas
from app.crud import crm as crud_crm
from app.api import quotes as quotes_router

router = APIRouter()
router.include_router(quotes_router.router, prefix="/quotes", tags=["quotes"])

# --- STAGES ---
@router.get("/stages", response_model=List[schemas.PipelineStage])
def read_stages(
    branch_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    """Retorna las columnas del Kanban ordenadas por order_index"""
    # Si no se especifica, usamos target_branch_id, pero permitimos override con 0
    actual_branch_id = branch_id if branch_id is not None else target_branch_id
    return crud_crm.get_stages(db, branch_id=actual_branch_id)

@router.post("/stages", response_model=schemas.PipelineStage)
def create_stage(
    stage_in: schemas.PipelineStageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    if not stage_in.branch_id:
        stage_in.branch_id = target_branch_id or current_user.branch_id or 1
    return crud_crm.create_stage(db, stage_in)


# --- LEADS ---
@router.get("/leads", response_model=List[schemas.Lead])
def read_leads(
    skip: int = 0, limit: int = 100,
    branch_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    actual_branch_id = branch_id if branch_id is not None else target_branch_id
    return crud_crm.get_leads(db, branch_id=actual_branch_id, skip=skip, limit=limit)

@router.post("/leads", response_model=schemas.Lead)
def create_lead(
    lead_in: schemas.LeadCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    if not lead_in.branch_id:
        lead_in.branch_id = target_branch_id or current_user.branch_id or 1
    return crud_crm.create_lead(db, lead_in)

@router.put("/leads/{lead_id}", response_model=schemas.Lead)
def update_lead(
    lead_id: int,
    lead_update: schemas.LeadUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    lead = crud_crm.update_lead(db, lead_id=lead_id, lead_update=lead_update)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    return lead

@router.put("/leads/{lead_id}/archive", response_model=schemas.Lead)
def archive_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    lead = crud_crm.archive_lead(db, lead_id=lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    return lead

@router.delete("/leads/{lead_id}", status_code=204)
def delete_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    lead = crud_crm.delete_lead(db, lead_id=lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    return None


# --- OPPORTUNITIES (CRM KANBAN) ---
@router.get("/opportunities", response_model=List[schemas.Opportunity])
def read_opportunities(
    branch_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    """Retorna todas las cards de oportunidad para renderizar en el kanban"""
    actual_branch_id = branch_id if branch_id is not None else target_branch_id
    return crud_crm.get_opportunities(db, branch_id=actual_branch_id)

@router.post("/opportunities", response_model=schemas.Opportunity)
def create_opportunity(
    opp_in: schemas.OpportunityCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud_crm.create_opportunity(db, opp_in)

@router.put("/opportunities/{opp_id}/stage")
def update_stage_drag_and_drop(
    opp_id: int,
    stage_update: schemas.OpportunityUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Recibe la actualización de fase mediante el evento onDragEnd de DnD de Frontend.
    Si el stage de destino es de tipo 'Ganado', convierte el Lead en Cliente automáticamente."""
    if stage_update.stage_id is None:
        raise HTTPException(status_code=400, detail="stage_id es requerido")

    result = crud_crm.update_opportunity_stage(db, opp_id=opp_id, stage_id=stage_update.stage_id)
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

