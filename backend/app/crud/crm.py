from datetime import datetime
from sqlalchemy.orm import Session
from app import models
from app.schemas import crm as schemas
from app.crud import operative as crud_operative

# --- STAGES ---
def get_stages(db: Session, branch_id: int):
    q = db.query(models.PipelineStage)
    if branch_id and branch_id > 0:
        q = q.filter(models.PipelineStage.branch_id == branch_id)
    return q.order_by(models.PipelineStage.order_index.asc()).all()

def create_stage(db: Session, stage: schemas.PipelineStageCreate):
    db_stage = models.PipelineStage(**stage.model_dump())
    db.add(db_stage)
    db.commit()
    db.refresh(db_stage)
    return db_stage

# --- LEADS ---
def get_leads(db: Session, branch_id: int, skip: int = 0, limit: int = 100):
    q = db.query(models.Lead)
    if branch_id and branch_id > 0:
        q = q.filter(models.Lead.branch_id == branch_id)
    return q.filter(models.Lead.status != 'archived')\
             .order_by(models.Lead.created_at.desc())\
             .offset(skip).limit(limit).all()

def create_lead(db: Session, lead: schemas.LeadCreate):
    db_lead = models.Lead(**lead.model_dump())
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    return db_lead

def update_lead(db: Session, lead_id: int, lead_update: schemas.LeadUpdate):
    db_lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if db_lead:
        update_data = lead_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_lead, key, value)
        db.commit()
        db.refresh(db_lead)
    return db_lead

def archive_lead(db: Session, lead_id: int):
    db_lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if db_lead:
        db_lead.status = "archived"
        db.commit()
        db.refresh(db_lead)
    return db_lead

def delete_lead(db: Session, lead_id: int):
    db_lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if db_lead:
        # Borrado en cascada manual MVP
        db.query(models.Opportunity).filter(models.Opportunity.lead_id == lead_id).delete()
        db.delete(db_lead)
        db.commit()
    return db_lead

# --- OPPORTUNITIES ---
def get_opportunities(db: Session, branch_id: int):
    # Trae todas las oportunidades agrupadas por stage para el kanban
    q = db.query(models.Opportunity).join(models.PipelineStage)
    if branch_id and branch_id > 0:
        q = q.filter(models.PipelineStage.branch_id == branch_id)
    return q.filter(models.Opportunity.lead.has(models.Lead.status != 'archived'))\
             .all()

def create_opportunity(db: Session, obj_in: schemas.OpportunityCreate):
    db_obj = models.Opportunity(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_opportunity_stage(db: Session, opp_id: int, stage_id: int):
    """Mueve la oportunidad a un nuevo stage y, si el stage es de tipo 'Ganado',
    convierte el Lead en Cliente automáticamente si aún no existe."""
    db_obj = db.query(models.Opportunity).filter(models.Opportunity.id == opp_id).first()
    if not db_obj:
        return None

    db_stage = db.query(models.PipelineStage).filter(models.PipelineStage.id == stage_id).first()

    db_obj.stage_id = stage_id

    # Detectar si el stage destino es de tipo "Ganado"
    is_win_stage = db_stage and ("ganado" in db_stage.name.lower() or "won" in db_stage.name.lower() or "cerrado" in db_stage.name.lower())

    new_client = None
    if is_win_stage:
        db_obj.won_date = datetime.utcnow()

        # Actualizar el status del Lead a 'won'
        lead = db_obj.lead  
        if lead:
            lead.status = "won"

            # Usar el helper robusto para obtener o crear el cliente
            new_client = crud_operative.get_or_create_client_from_lead(db, lead)

    db.commit()
    db.refresh(db_obj)
    # Retornar una tupla: (oportunidad_actualizada, cliente_nuevo_o_none)
    return db_obj, new_client
