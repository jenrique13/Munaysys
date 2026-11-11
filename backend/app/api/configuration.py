from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_uow
from app.uow.unit_of_work import UnitOfWork
from app.schemas.auth import User as UserOut, UserUpdate, RoleResponse as RoleOut, RoleCreate, RoleUpdate
from app.schemas.user import BranchResponse as BranchOut, BranchCreate, BranchUpdate
from app.core.security import get_password_hash
from app import models

router = APIRouter()

# --- USERS ---

@router.get("/users", response_model=List[UserOut])
def read_users(
    skip: int = 0,
    limit: int = 100,
    uow: UnitOfWork = Depends(get_uow),
):
    return uow.users.get_multi(skip=skip, limit=limit)

@router.get("/users/{user_id}", response_model=UserOut)
def read_user(
    user_id: int,
    uow: UnitOfWork = Depends(get_uow),
):
    user = uow.users.get_with_roles(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user

@router.put("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    uow: UnitOfWork = Depends(get_uow),
):
    db_user = uow.users.get(user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    update_data = user_in.model_dump(exclude_unset=True)
    # Hash password if provided
    if "password" in update_data and update_data["password"]:
        update_data["password_hash"] = get_password_hash(update_data.pop("password"))
    else:
        update_data.pop("password", None)

    uow.users.update(db_user, update_data)
    uow.commit()
    uow.refresh(db_user)
    return db_user

# --- CLIENT PORTAL USERS ---

@router.get("/client-users", response_model=List[UserOut])
def read_client_users(uow: UnitOfWork = Depends(get_uow)):
    """Returns all users with Coworker role."""
    coworker_role = uow.db.query(models.Role).filter(models.Role.name == "Coworker").first()
    if not coworker_role:
        return []
    return (
        uow.db.query(models.User)
        .filter(models.User.role_id == coworker_role.id)
        .all()
    )

@router.post("/client-users", response_model=UserOut, status_code=201)
def create_client_user(
    email: str,
    password: str,
    role_name: str = "Coworker",
    branch_id: Optional[int] = None,
    uow: UnitOfWork = Depends(get_uow),
):
    """Creates a portal user for an existing client."""
    if uow.users.get_by_email(email):
        raise HTTPException(status_code=400, detail="Ya existe un usuario con ese correo.")
    
    role = uow.db.query(models.Role).filter(models.Role.name == role_name).first()
    if not role:
        raise HTTPException(status_code=404, detail=f"Rol '{role_name}' no encontrado.")
    
    db_user = models.User(
        email=email,
        password_hash=get_password_hash(password),
        role_id=role.id,
        branch_id=branch_id,
        is_active=True,
        status="active",
        access_permissions={"client_portal": True}
    )
    uow.db.add(db_user)
    uow.commit()
    uow.refresh(db_user)
    return db_user

@router.put("/client-users/{user_id}", response_model=UserOut)
def update_client_user(
    user_id: int,
    user_in: UserUpdate,
    uow: UnitOfWork = Depends(get_uow),
):
    """Update access for a client portal user."""
    db_user = uow.users.get(user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    update_data = user_in.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        update_data["password_hash"] = get_password_hash(update_data.pop("password"))
    else:
        update_data.pop("password", None)

    uow.users.update(db_user, update_data)
    uow.commit()
    uow.refresh(db_user)
    return db_user

@router.delete("/client-users/{user_id}")
def delete_client_user(user_id: int, uow: UnitOfWork = Depends(get_uow)):
    db_user = uow.users.get(user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    uow.db.delete(db_user)
    uow.commit()
    return {"ok": True}

# --- ROLES ---

@router.get("/roles", response_model=List[RoleOut])
def read_roles(
    uow: UnitOfWork = Depends(get_uow),
):
    return uow.roles.get_multi()

@router.post("/roles", response_model=RoleOut, status_code=201)
def create_role(
    role_in: RoleCreate,
    uow: UnitOfWork = Depends(get_uow),
):
    db_role = uow.roles.create(role_in.model_dump())
    uow.commit()
    uow.refresh(db_role)
    return db_role

@router.put("/roles/{role_id}", response_model=RoleOut)
def update_role(
    role_id: int,
    role_in: RoleUpdate,
    uow: UnitOfWork = Depends(get_uow),
):
    db_role = uow.roles.get(role_id)
    if not db_role:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    
    uow.roles.update(db_role, role_in.model_dump(exclude_unset=True))
    uow.commit()
    uow.refresh(db_role)
    return db_role

@router.delete("/roles/{role_id}")
def delete_role(
    role_id: int,
    uow: UnitOfWork = Depends(get_uow),
):
    db_role = uow.roles.get(role_id)
    if not db_role:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    
    # Check if role is assigned to any user
    user_count = uow.db.query(models.User).filter(models.User.role_id == role_id).count()
    if user_count > 0:
        raise HTTPException(status_code=400, detail="No se puede eliminar un rol que tiene usuarios asignados")
        
    uow.roles.remove(role_id)
    uow.commit()
    return {"ok": True}

# --- BRANCHES (SEDES) ---

@router.get("/branches", response_model=List[BranchOut])
def read_branches(
    uow: UnitOfWork = Depends(get_uow),
):
    return uow.branches.get_all_active()

@router.get("/branches/{branch_id}", response_model=BranchOut)
def read_branch(
    branch_id: int,
    uow: UnitOfWork = Depends(get_uow),
):
    branch = uow.branches.get(branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Sede no encontrada")
    return branch

@router.post("/branches", response_model=BranchOut, status_code=201)
def create_branch(
    branch_in: BranchCreate,
    uow: UnitOfWork = Depends(get_uow),
):
    db_branch = uow.branches.create(branch_in.model_dump())
    uow.commit()
    uow.refresh(db_branch)
    return db_branch

@router.put("/branches/{branch_id}", response_model=BranchOut)
def update_branch(
    branch_id: int,
    branch_in: BranchUpdate,
    uow: UnitOfWork = Depends(get_uow),
):
    db_branch = uow.branches.get(branch_id)
    if not db_branch:
        raise HTTPException(status_code=404, detail="Sede no encontrada")
    
    uow.branches.update(db_branch, branch_in.model_dump(exclude_unset=True))
    uow.commit()
    uow.refresh(db_branch)
    return db_branch
