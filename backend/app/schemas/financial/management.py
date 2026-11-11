from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class BranchMonthlyPerformance(BaseModel):
    branch_name: str
    month: str
    month_idx: int
    income: float
    expenses: float
    balance: float
    profitability: float

class CategoryAmount(BaseModel):
    category: str
    amount: float

class MethodAmount(BaseModel):
    method: str
    amount: float

class BranchSummary(BaseModel):
    branch_name: str
    income_by_category: List[CategoryAmount]
    income_by_method: List[MethodAmount]
    expenses_by_category: List[CategoryAmount]
    expenses_by_method: List[MethodAmount]

class ManagementDashboardResponse(BaseModel):
    income_trend: List[Dict[str, Any]] # { month: 'Jan', Sede1: 100, Sede2: 150 }
    orders_by_branch: List[Dict[str, Any]] # { branch: 'Sede 1', count: 50 }
    mayor_nest_performance: Dict[str, List[BranchMonthlyPerformance]] # BranchName -> List of months
    monthly_details: List[BranchSummary]
    year: int
    month: int
