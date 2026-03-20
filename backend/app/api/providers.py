from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.api.deps import get_current_user
from app.schemas import providers as schemas
from app.crud import providers as crud_providers

router = APIRouter()

# --- PROVIDERS ---

@router.get("/", response_model=List[schemas.Provider])
def read_providers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    branch_id = current_user.branch_id or 1
    return crud_providers.get_providers(db, branch_id=branch_id, skip=skip, limit=limit)


@router.get("/{provider_id}", response_model=schemas.Provider)
def read_provider(
    provider_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    provider = crud_providers.get_provider(db, provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    return provider


@router.post("/", response_model=schemas.Provider, status_code=201)
def create_provider(
    provider_in: schemas.ProviderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud_providers.create_provider(db, provider_in)


@router.put("/{provider_id}", response_model=schemas.Provider)
def update_provider(
    provider_id: int,
    provider_in: schemas.ProviderUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    provider = crud_providers.update_provider(db, provider_id, provider_in)
    if not provider:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    return provider


@router.delete("/{provider_id}", status_code=204)
def delete_provider(
    provider_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    success = crud_providers.delete_provider(db, provider_id)
    if not success:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado o no pudo eliminarse")
    return None


# --- PAYABLES ---

@router.get("/payables/", response_model=List[schemas.Payable])
def read_payables(
    provider_id: Optional[int] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    branch_id = current_user.branch_id or 1
    return crud_providers.get_payables(db, branch_id=branch_id, provider_id=provider_id, skip=skip, limit=limit)


@router.post("/payables/", response_model=schemas.Payable, status_code=201)
def create_payable(
    payable_in: schemas.PayableCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Verify provider exists
    provider = crud_providers.get_provider(db, payable_in.provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    
    payable_in.branch_id = current_user.branch_id or 1
    return crud_providers.create_payable(db, payable_in)


@router.put("/payables/{payable_id}", response_model=schemas.Payable)
def update_payable(
    payable_id: int,
    payable_in: schemas.PayableUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    payable = crud_providers.update_payable(db, payable_id, payable_in)
    if not payable:
        raise HTTPException(status_code=404, detail="Cuenta por pagar no encontrada")
    return payable


@router.delete("/payables/{payable_id}", status_code=204)
def delete_payable(
    payable_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    success = crud_providers.delete_payable(db, payable_id)
    if not success:
        raise HTTPException(status_code=404, detail="Cuenta por pagar no encontrada")
    return None
