from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi.encoders import jsonable_encoder

from app import models
from app.schemas import providers as schemas


# --- PROVIDERS ---

def get_provider(db: Session, provider_id: int) -> Optional[models.Provider]:
    return db.query(models.Provider).filter(models.Provider.id == provider_id).first()

def get_providers(db: Session, branch_id: int, skip: int = 0, limit: int = 100) -> List[models.Provider]:
    q = db.query(models.Provider)
    return q.offset(skip).limit(limit).all()

def create_provider(db: Session, obj_in: schemas.ProviderCreate) -> models.Provider:
    obj_in_data = jsonable_encoder(obj_in)
    db_obj = models.Provider(**obj_in_data)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_provider(db: Session, provider_id: int, obj_in: schemas.ProviderUpdate) -> Optional[models.Provider]:
    db_obj = get_provider(db, provider_id)
    if not db_obj:
        return None
    obj_data = jsonable_encoder(db_obj)
    update_data = obj_in.model_dump(exclude_unset=True)
    for field in obj_data:
        if field in update_data:
            setattr(db_obj, field, update_data[field])
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_provider(db: Session, provider_id: int) -> bool:
    db_obj = get_provider(db, provider_id)
    if not db_obj:
        return False
    # Will cascade delete payables
    db.delete(db_obj)
    db.commit()
    return True


# --- PAYABLES ---

def get_payable(db: Session, payable_id: int) -> Optional[models.Payable]:
    return db.query(models.Payable).filter(models.Payable.id == payable_id).first()

def get_payables(
    db: Session, branch_id: int, provider_id: Optional[int] = None, skip: int = 0, limit: int = 100
) -> List[models.Payable]:
    query = db.query(models.Payable)
    if branch_id > 0:
        query = query.filter(models.Payable.branch_id == branch_id)
    if provider_id:
        query = query.filter(models.Payable.provider_id == provider_id)
    return query.offset(skip).limit(limit).all()

def create_payable(db: Session, obj_in: schemas.PayableCreate) -> models.Payable:
    obj_in_data = jsonable_encoder(obj_in)
    db_obj = models.Payable(**obj_in_data)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_payable(db: Session, payable_id: int, obj_in: schemas.PayableUpdate) -> Optional[models.Payable]:
    db_obj = get_payable(db, payable_id)
    if not db_obj:
        return None
        
    was_pending = db_obj.status in ["pending", "partial"]
    
    obj_data = jsonable_encoder(db_obj)
    update_data = obj_in.model_dump(exclude_unset=True)
    for field in obj_data:
        if field in update_data:
            setattr(db_obj, field, update_data[field])
            
    # Auto-generate CashMovement when marking a Debt as Paid
    if was_pending and db_obj.status == "paid":
        provider_name = None
        if db_obj.provider_id:
            prov = db.query(models.Provider).filter(models.Provider.id == db_obj.provider_id).first()
            if prov: provider_name = prov.name
            
        cm = models.CashMovement(
            branch_id=db_obj.branch_id,
            amount=db_obj.amount,
            type="expense",
            category="Pago de Factura/Deuda",
            description=db_obj.reference or f"Pago Cta. #{db_obj.id}",
            provider_name=provider_name,
            payment_method=db_obj.payment_method
        )
        db.add(cm)
            
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_payable(db: Session, payable_id: int) -> bool:
    db_obj = get_payable(db, payable_id)
    if not db_obj:
        return False
    db.delete(db_obj)
    db.commit()
    return True
