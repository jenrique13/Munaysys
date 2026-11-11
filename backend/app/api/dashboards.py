from fastapi import APIRouter, Depends
from typing import Optional, List
from app import schemas
from app.api.deps import get_target_branch_id, get_uow
from app.uow.unit_of_work import UnitOfWork
from app.use_cases.financial import DashboardUseCases

router = APIRouter()

@router.get("/kpis")
def get_kpis(
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow)
):
    use_case = DashboardUseCases(uow)
    return use_case.get_kpis(target_branch_id)

@router.get("/revenue-trend")
def get_revenue_trend(
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow)
):
    use_case = DashboardUseCases(uow)
    return use_case.get_revenue_trend(target_branch_id)

@router.get("/sales-crm")
def get_sales_crm(
    period: str = 'monthly',
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow)
):
    use_case = DashboardUseCases(uow)
    return use_case.get_sales_crm_dashboard(target_branch_id, period)

@router.get("/revenue-by-category")
def get_revenue_by_category(
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow)
):
    use_case = DashboardUseCases(uow)
    return use_case.get_revenue_by_category(target_branch_id)

@router.get("/occupancy-stats")
def get_occupancy_stats(
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow)
):
    use_case = DashboardUseCases(uow)
    return use_case.get_occupancy_stats(target_branch_id)

@router.get("/crm-funnel")
def get_crm_funnel(
    uow: UnitOfWork = Depends(get_uow)
):
    use_case = DashboardUseCases(uow)
    return use_case.get_crm_funnel()

@router.get("/sede-performance")
def get_sede_performance(
    uow: UnitOfWork = Depends(get_uow)
):
    use_case = DashboardUseCases(uow)
    return use_case.get_sede_performance()
@router.get("/operator")
def get_operator_dashboard(
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow)
):
    use_case = DashboardUseCases(uow)
    return use_case.get_operator_dashboard(target_branch_id)

@router.get("/dashboard-stats")
def get_dashboard_stats(
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow)
):
    use_case = DashboardUseCases(uow)
    return use_case.get_dashboard_stats(target_branch_id)

@router.get("/management", response_model=schemas.financial.ManagementDashboardResponse)
def get_management_dashboard(
    month: Optional[int] = None,
    year: Optional[int] = None,
    uow: UnitOfWork = Depends(get_uow)
):
    use_case = DashboardUseCases(uow)
    return use_case.get_management_dashboard(month, year)
