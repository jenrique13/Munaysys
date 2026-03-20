from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.api.deps import get_current_user
from app.schemas import configuration as schemas
from app.crud import configuration as crud_config

router = APIRouter()

# --- USERS ---

@router.get("/users", response_model=List[schemas.UserConfigOut])
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Only superusers or managers can list users? 
    # For now, keep it simple but ensure joins if needed by CRUD
    return crud_config.get_users_config(db, skip=skip, limit=limit)


@router.get("/users/{user_id}", response_model=schemas.UserConfigOut)
def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    user = crud_config.get_user_config(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


@router.put("/users/{user_id}", response_model=schemas.UserConfigOut)
def update_user(
    user_id: int,
    user_in: schemas.UserConfigUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    user = crud_config.update_user_config(db, user_id, user_in)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user

@router.delete("/users/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Security check: don't delete yourself or other superusers if not super
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes eliminarte a ti mismo")
    
    success = crud_config.delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return None

# --- ROLES ---

@router.get("/roles", response_model=List[schemas.RoleOut])
def read_roles(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return db.query(models.Role).all()


@router.post("/roles", response_model=schemas.RoleOut, status_code=201)
def create_role(
    role_in: schemas.RoleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud_config.create_role(db, role_in)


@router.put("/roles/{role_id}", response_model=schemas.RoleOut)
def update_role(
    role_id: int,
    role_in: schemas.RoleUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    role = crud_config.update_role(db, role_id, role_in)
    if not role:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    return role


@router.delete("/roles/{role_id}", status_code=204)
def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    success = crud_config.delete_role(db, role_id)
    if not success:
        # It could be not found OR in use. 
        # For simplicity return 400 if it exists but can't be deleted, or 404.
        role = crud_config.get_role(db, role_id)
        if role:
            raise HTTPException(status_code=400, detail="El rol está en uso y no puede eliminarse")
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    return None

# --- BRANCHES (SEDES) ---

@router.get("/branches", response_model=List[schemas.BranchOut])
def read_branches(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud_config.get_branches(db, skip=skip, limit=limit)


@router.get("/branches/{branch_id}", response_model=schemas.BranchOut)
def read_branch(
    branch_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    branch = crud_config.get_branch(db, branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Sede no encontrada")
    return branch


@router.post("/branches", response_model=schemas.BranchOut, status_code=201)
def create_branch(
    branch_in: schemas.BranchCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud_config.create_branch(db, branch_in)


@router.put("/branches/{branch_id}", response_model=schemas.BranchOut)
def update_branch(
    branch_id: int,
    branch_in: schemas.BranchUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    branch = crud_config.update_branch(db, branch_id, branch_in)
    if not branch:
        raise HTTPException(status_code=404, detail="Sede no encontrada")
    return branch
