from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ReceivableSummary(BaseModel):
    client_id: int
    client_name: str
    balance: float
    last_order_date: Optional[datetime] = None

class FinancialSummary(BaseModel):
    total_receivables: float
    total_payables: float
    current_cash: float
    branch_id: int

class TimeSeriesData(BaseModel):
    date: str
    amount: float

class CategoryDistribution(BaseModel):
    category: str
    amount: float
    percentage: float

class OccupancyStats(BaseModel):
    total_slots: int
    occupied_slots: int
    percentage: float

class DashboardStats(BaseModel):
    total_sales_eur: float
    total_sales_usd: float
    total_expenses_eur: float
    total_expenses_usd: float
    sales_trend: List[TimeSeriesData]
    expenses_trend: List[TimeSeriesData]
    category_distribution: List[CategoryDistribution]
    occupancy_stats: Optional[OccupancyStats] = None
    branch_id: int
