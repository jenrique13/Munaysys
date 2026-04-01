import type { Branch } from '../../configuration/types';

export interface PaymentMethod {
    id: number;
    name: string;
    description?: string;
    is_active: boolean;
    branch_id: number;
}

export type PaymentStatus = "pending" | "partial" | "paid" | "cancelled";

export interface Product {
    id: number;
    name: string;
    description?: string;
    price: number;
    stock: number;
    type: "physical" | "service";
    is_active: boolean;
    branch_id: number;
    created_at: string;
}

export interface Service {
    id: number;
    name: string;
    description?: string;
    price: number;
    is_active: boolean;
    is_amenity: boolean;
    branch_id: number;
    created_at: string;
}

export interface ConsumableCategory {
    id: number;
    name: string;
    description?: string;
    branch_id: number;
    is_active: boolean;
}

export interface Consumable {
    id: number;
    name: string;
    description?: string;
    category_id: number | null;
    category?: ConsumableCategory | null;
    cost: number;
    stock: number;
    unit: string;
    is_active: boolean;
    branch_id: number;
    created_at: string;
}

export interface ConsumableUsage {
    id: number;
    consumable_id: number;
    quantity: number;
    reason: string;
    user_email?: string;
    created_at: string;
    branch_id: number;
    consumable?: Consumable;
}

export interface Package {
    id: number;
    name: string;
    price: number;
    items_json: any;
    branch_id: number;
    created_at: string;
}

export interface Receipt {
    id: number;
    orden_id?: number | null;
    purchase_id?: number | null;
    client_id?: number | null;
    amount: number;
    date: string;
    type: "income" | "expense";
    payment_method: PaymentMethod;
    reference?: string;
    exchange_rate?: number;
    exchange_currency?: string;
}

export interface Pedido {
    id?: number;
    orden_id?: number;
    item_type: string;
    item_id: number;
    quantity: number;
    unit_price: number;
    discount: number;
    subtotal: number;
    item_name?: string;  // resolved by backend from Product/Service/Office/Room
    start_time?: string;
    end_time?: string;
    // UI Helper (Not in DB - used when building order in frontend)
    itemName?: string;
}

export interface Orden {
    id: number;
    client_id: number;
    branch_id: number;
    date: string;
    subtotal: number;
    discount: number;
    discount_type: 'amount' | 'percentage';
    tax: number;
    total: number;
    status: PaymentStatus;
    details: Pedido[];
    receipts: Receipt[];
}

export interface PurchaseDetail {
    id?: number;
    purchase_id?: number;
    product_id?: number | null;
    description?: string;
    quantity: number;
    unit_cost: number;
    subtotal: number;
    // UI Helper
    productName?: string;
}

export interface Purchase {
    id: number;
    provider_id?: number | null;
    provider_name: string;
    branch_id: number;
    date: string;
    subtotal: number;
    tax: number;
    total: number;
    status: PaymentStatus;
    details: PurchaseDetail[];
    receipts: Receipt[];
}

export interface Expense {
    id: number;
    branch_id: number;
    date: string;
    amount: number;
    category: string;
    description?: string;
    provider?: string;
    provider_id?: number | null;
    payment_method?: string;
    exchange_rate?: number;
    exchange_currency?: string;
}

export interface ClientStatement {
    client_id: number;
    total_charges: number;
    total_paid: number;
    balance: number;
    orders: Orden[];
    receipts: Receipt[];
}

export interface CashCategory {
    id: number;
    branch_id: number;
    name: string;
    description?: string;
    type: "income" | "expense";
    is_active: boolean;
}

export interface CashMovement {
    id: number;
    branch_id: number;
    amount: number;
    type: "income" | "expense";
    category: string;
    description?: string;
    client_name?: string;
    provider_name?: string;
    payment_method?: string;
    date: string;
    branch?: Branch;
}

export interface ReceivableSummary {
    client_id: number;
    client_name: string;
    balance: number;
    last_order_date?: string;
}

export interface FinancialSummary {
    total_receivables: number;
    total_payables: number;
    current_cash: number;
    branch_id: number;
}

// --- DASHBOARD STATS ---

export interface TimeSeriesData {
    date: string;
    amount: number;
}

export interface CategoryDistribution {
    category: string;
    amount: number;
    percentage: number;
}

export interface OccupancyStats {
    total_slots: number;
    occupied_slots: number;
    percentage: number;
}

export interface DashboardStats {
    total_sales: number;
    total_expenses: number;
    net_profit: number;
    sales_trend: TimeSeriesData[];
    expenses_trend: TimeSeriesData[];
    category_distribution: CategoryDistribution[];
    occupancy_stats?: OccupancyStats | null;
    branch_id: number;
}
