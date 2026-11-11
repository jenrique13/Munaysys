from typing import List
from fastapi import APIRouter, Depends, HTTPException
from app.api import deps
from app.api.deps import get_uow
from app.uow.unit_of_work import UnitOfWork
from app.schemas.auth import RoleResponse, RoleCreate, RoleUpdate
from app import models

router = APIRouter()

@router.get("/", response_model=List[RoleResponse])
def read_roles(
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_superuser),
    uow: UnitOfWork = Depends(get_uow)
):
    """
    Retrieve roles (Superuser only).
    """
    return uow.roles.get_multi(skip=skip, limit=limit)

@router.get("/{role_id}", response_model=RoleResponse)
def read_role(
    role_id: int,
    current_user: models.User = Depends(deps.get_current_active_superuser),
    uow: UnitOfWork = Depends(get_uow)
):
    """
    Get a role.
    """
    role = uow.roles.get(role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role

@router.put("/{role_id}", response_model=RoleResponse)
def update_role(
    role_id: int,
    role_in: RoleUpdate,
    current_user: models.User = Depends(deps.get_current_active_superuser),
    uow: UnitOfWork = Depends(get_uow)
):
    """
    Update a role.
    """
    db_role = uow.roles.get(role_id)
    if not db_role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    uow.roles.update(db_role, role_in.model_dump(exclude_unset=True))
    uow.commit()
    uow.refresh(db_role)
    return db_role
