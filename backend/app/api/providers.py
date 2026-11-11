from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from app import models
from app.api import deps
from app.api.deps import get_target_branch_id, get_uow
from app.uow.unit_of_work import UnitOfWork
from app.schemas.financial import providers as schemas
from app.use_cases.financial.provider_use_cases import ProviderUseCases
from app.use_cases.financial.get_financial_data import GetFinancialDataUseCase

router = APIRouter()

@router.get("/", response_model=List[schemas.Provider])
def read_providers(
    skip: int = 0,
    limit: int = 100,
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow)
):
    return uow.providers.get_by_branch(target_branch_id, skip=skip, limit=limit)

@router.post("/", response_model=schemas.Provider)
def create_provider(
    provider_in: schemas.ProviderCreate,
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow)
):
    data = provider_in.model_dump()
    # Providers are global, branch_id is optional and should be None if 0
    data["branch_id"] = target_branch_id if target_branch_id > 0 else None
    
    db_obj = uow.providers.create(data)
    uow.commit()
    uow.refresh(db_obj)
    return db_obj

@router.get("/payables", response_model=List[schemas.Payable])
def read_payables(
    provider_id: Optional[int] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow)
):
    return uow.payables.get_by_branch(target_branch_id, provider_id=provider_id, month=month, year=year, skip=skip, limit=limit)

@router.post("/payables", response_model=schemas.Payable)
def create_payable(
    payable_in: schemas.PayableCreate,
    uow: UnitOfWork = Depends(get_uow)
):
    use_case = ProviderUseCases(uow)
    return use_case.create_payable(payable_in)

@router.put("/payables/{payable_id}", response_model=schemas.Payable)
def update_payable(
    payable_id: int,
    payable_in: schemas.PayableUpdate,
    uow: UnitOfWork = Depends(get_uow)
):
    use_case = ProviderUseCases(uow)
    updated = use_case.update_payable(payable_id, payable_in)
    if not updated:
        raise HTTPException(status_code=404, detail="Payable not found")
    return updated

@router.get("/{provider_id}/statement", response_model=schemas.ProviderStatement)
def get_provider_statement(
    provider_id: int,
    month: Optional[int] = None,
    year: Optional[int] = None,
    status: Optional[str] = None,
    current_user: models.User = Depends(deps.get_current_user),
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow)
):
    # Role check: Coordinador, Gerencia (Gerente), Super Admin
    privileged_roles = ["Super Administrador", "Gerente", "Coordinador"]
    is_privileged = current_user.is_superuser or (current_user.role and current_user.role.name in privileged_roles)
    
    if not is_privileged:
        raise HTTPException(
            status_code=403, 
            detail="No tiene permisos para ver el estado de cuenta del proveedor."
        )
        
    use_case = GetFinancialDataUseCase(uow)
    statement = use_case.get_provider_statement(
        provider_id, 
        branch_id=target_branch_id, 
        month=month, 
        year=year, 
        status=status
    )
    if not statement:
        raise HTTPException(status_code=404, detail="Provider not found")
    return statement
