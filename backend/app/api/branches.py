from typing import List
from fastapi import APIRouter, Depends, HTTPException
from app.api import deps
from app.api.deps import get_uow
from app.uow.unit_of_work import UnitOfWork
from app.schemas.user import BranchResponse
from app import models

router = APIRouter()

@router.get("/", response_model=List[BranchResponse])
def read_branches(
    skip: int = 0,
    limit: int = 100,
    uow: UnitOfWork = Depends(get_uow)
):
    """
    Retrieve branches.
    """
    return uow.branches.get_all_active()

@router.get("/{branch_id}", response_model=BranchResponse)
def read_branch(
    branch_id: int,
    uow: UnitOfWork = Depends(get_uow)
):
    """
    Get a branch.
    """
    branch = uow.branches.get(branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    return branch
