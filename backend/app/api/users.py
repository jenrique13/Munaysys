from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.api import deps
from app.api.deps import get_uow
from app.uow.unit_of_work import UnitOfWork
from app.schemas.auth import User, UserCreate, UserUpdate
from app import models
from app.use_cases.auth import UserUseCases

router = APIRouter()

@router.get("/me", response_model=User)
def read_user_me(
    current_user: models.User = Depends(deps.get_current_user),
    uow: UnitOfWork = Depends(get_uow)
):
    """
    Get current user profile with role and branch details.
    """
    use_case = UserUseCases(uow)
    user = use_case.get_by_id(current_user.id)
    return user

@router.get("/", response_model=List[User])
def read_users(
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_superuser),
    uow: UnitOfWork = Depends(get_uow)
):
    """
    Retrieve users (Superuser only).
    """
    return uow.users.get_multi(skip=skip, limit=limit)

@router.post("/", response_model=User)
def create_user(
    user_in: UserCreate,
    current_user: models.User = Depends(deps.get_current_active_superuser),
    uow: UnitOfWork = Depends(get_uow)
):
    """
    Create new user.
    """
    use_case = UserUseCases(uow)
    try:
        return use_case.create(user_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{user_id}", response_model=User)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    current_user: models.User = Depends(deps.get_current_active_superuser),
    uow: UnitOfWork = Depends(get_uow)
):
    """
    Update a user.
    """
    use_case = UserUseCases(uow)
    user = use_case.update(user_id, user_in)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
