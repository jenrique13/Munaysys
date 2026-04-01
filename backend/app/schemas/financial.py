from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime
from app.schemas.user import BranchResponse

# --- PRODUCTS & PACKAGES ---

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float = 0.0
    stock: int = 0
    is_active: bool = True
    branch_id: int

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- SERVICES ---
class ServiceBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float = 0.0
    is_active: bool = True
    is_amenity: bool = False
    branch_id: int

class ServiceCreate(ServiceBase):
    pass

class Service(ServiceBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- CONSUMABLE CATEGORIES ---
class ConsumableCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    branch_id: int
    is_active: bool = True

class ConsumableCategoryCreate(ConsumableCategoryBase):
    pass

class ConsumableCategory(ConsumableCategoryBase):
    id: int

    class Config:
        from_attributes = True

# --- CONSUMABLES ---
class ConsumableBase(BaseModel):
    name: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    cost: float = 0.0
    stock: int = 0
    unit: str = "unit"
    is_active: bool = True
    branch_id: int

class ConsumableCreate(ConsumableBase):
    pass

class Consumable(ConsumableBase):
    id: int
    created_at: datetime
    category: Optional[ConsumableCategory] = None

    class Config:
        from_attributes = True


class PackageBase(BaseModel):
    name: str
    price: float = 0.0
    items_json: Any = []  # Configuración del paquete
    branch_id: int

class PackageCreate(PackageBase):
    pass

class Package(PackageBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- RECEIPTS (PAGOS / ABONOS) ---

class ReceiptBase(BaseModel):
    amount: float
    exchange_rate: Optional[float] = None
    exchange_currency: str = "usd"
    type: str = "income"  # income, expense
    payment_method: str  # Cash, Zelle, Banesco (VE), etc.
    reference: Optional[str] = None
    client_id: Optional[int] = None
    orden_id: Optional[int] = None
    purchase_id: Optional[int] = None
    branch_id: Optional[int] = None

class ReceiptCreate(ReceiptBase):
    pass

class Receipt(ReceiptBase):
    id: int
    date: datetime
    branch_id: Optional[int] = None
    branch: Optional[BranchResponse] = None

    class Config:
        from_attributes = True


# --- CONSUMABLE USAGE ---

class ConsumableUsageBase(BaseModel):
    consumable_id: int
    quantity: int
    reason: str
    branch_id: int

class ConsumableUsageCreate(ConsumableUsageBase):
    pass

class ConsumableUsage(ConsumableUsageBase):
    id: int
    user_email: Optional[str] = None
    created_at: datetime
    consumable: Optional[Consumable] = None
    branch: Optional[BranchResponse] = None

    class Config:
        from_attributes = True

# --- VENTAS (Órdenes / Pedidos) ---

class PedidoBase(BaseModel):
    item_type: str  # product, package, amenity, room
    item_id: int
    quantity: int = 1
    unit_price: float = 0.0
    discount: float = 0.0
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None

class PedidoCreate(PedidoBase):
    pass

class Pedido(PedidoBase):
    id: int
    orden_id: int
    subtotal: float
    item_name: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None

    class Config:
        from_attributes = True


class OrdenBase(BaseModel):
    client_id: int
    branch_id: int
    discount: float = 0.0
    discount_type: str = "amount"  # amount | percentage
    status: str = "pending"  # pending, partial, paid, cancelled

class OrdenCreate(OrdenBase):
    details: List[PedidoCreate]

class OrdenUpdate(BaseModel):
    client_id: Optional[int] = None
    discount: Optional[float] = None
    discount_type: Optional[str] = None  # amount | percentage
    status: Optional[str] = None
    details: Optional[List[PedidoCreate]] = None
    reason: str  # Mandatory reason for audit log when updating

class Orden(OrdenBase):
    id: int
    date: datetime
    subtotal: float
    discount_type: str = "amount"
    tax: float  # 16% IVA
    total: float
    details: List[Pedido] = []
    receipts: List[Receipt] = []
    branch: Optional[BranchResponse] = None

    class Config:
        from_attributes = True


# --- COMPRAS (Purchases) ---

class PurchaseDetailBase(BaseModel):
    product_id: Optional[int] = None
    description: Optional[str] = None
    quantity: int = 1
    unit_cost: float = 0.0

class PurchaseDetailCreate(PurchaseDetailBase):
    pass

class PurchaseDetail(PurchaseDetailBase):
    id: int
    purchase_id: int
    subtotal: float

    class Config:
        from_attributes = True


class PurchaseBase(BaseModel):
    provider_id: Optional[int] = None
    provider_name: str
    branch_id: int
    status: str = "pending"  # pending, partial, paid, cancelled

class PurchaseCreate(PurchaseBase):
    details: List[PurchaseDetailCreate]

class Purchase(PurchaseBase):
    id: int
    date: datetime
    subtotal: float
    tax: float
    total: float
    details: List[PurchaseDetail] = []
    receipts: List[Receipt] = []

    class Config:
        from_attributes = True


# --- GASTOS (Expenses) ---

class ExpenseBase(BaseModel):
    branch_id: int
    amount: float
    exchange_rate: Optional[float] = None
    exchange_currency: str = "usd"
    category: str
    description: Optional[str] = None
    provider: Optional[str] = None
    provider_id: Optional[int] = None
    payment_method: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    pass

class Expense(ExpenseBase):
    id: int
    date: datetime

    class Config:
        from_attributes = True


# --- CASH MOVEMENTS ---

class CashMovementBase(BaseModel):
    branch_id: int
    amount: float
    type: str  # income, expense
    category: str
    description: Optional[str] = None
    client_name: Optional[str] = None
    provider_name: Optional[str] = None
    payment_method: Optional[str] = None

class CashMovementCreate(CashMovementBase):
    pass

class CashMovement(CashMovementBase):
    id: int
    date: datetime
    branch: Optional[BranchResponse] = None

    class Config:
        from_attributes = True



# --- CASH CATEGORIES ---

class CashCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    type: str  # income, expense
    branch_id: Optional[int] = None
    is_active: bool = True

class CashCategoryCreate(CashCategoryBase):
    pass

class CashCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    is_active: Optional[bool] = None

class CashCategory(CashCategoryBase):
    id: int

    class Config:
        from_attributes = True

# --- SUMMARIES ---

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


# --- DASHBOARD STATS ---

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
    total_sales: float
    total_expenses: float
    net_profit: float
    sales_trend: List[TimeSeriesData]
    expenses_trend: List[TimeSeriesData]
    category_distribution: List[CategoryDistribution]
    occupancy_stats: Optional[OccupancyStats] = None
    branch_id: int

# --- PAYMENT METHODS ---

class PaymentMethodBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True
    branch_id: Optional[int] = None

class PaymentMethodCreate(PaymentMethodBase):
    pass

class PaymentMethodUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class PaymentMethod(PaymentMethodBase):
    id: int

    class Config:
        from_attributes = True
