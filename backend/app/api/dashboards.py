from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app import models
from app.api.deps import get_current_user, get_target_branch_id, get_db
from app.crud import dashboards as crud

router = APIRouter()

@router.get("/kpis", response_model=Dict[str, Any])
def read_kpis(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    return crud.get_kpis(db=db, branch_id=target_branch_id)

@router.get("/revenue-trend", response_model=List[Dict[str, Any]])
def read_revenue_trend(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    return crud.get_revenue_trend(db=db, branch_id=target_branch_id)

@router.get("/occupancy-stats", response_model=List[Dict[str, Any]])
def read_occupancy_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    return crud.get_occupancy_stats(db=db, branch_id=target_branch_id)

@router.get("/revenue-by-category", response_model=List[Dict[str, Any]])
def read_revenue_by_category(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    return crud.get_revenue_by_category(db=db, branch_id=target_branch_id)

@router.get("/crm-funnel", response_model=List[Dict[str, Any]])
def read_crm_funnel(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # El funnel suele ser global para gerencia
    return crud.get_crm_funnel(db=db)

@router.get("/sede-performance", response_model=List[Dict[str, Any]])
def read_sede_performance(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.get_sede_performance(db=db)
