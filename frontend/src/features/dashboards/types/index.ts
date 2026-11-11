export interface DashboardKPIs {
    newLeads: number;
    totalIncome: number;
    totalIncomeEur: number;
    totalIncomeUsd: number;
    totalExpenses: number;
    totalExpensesEur: number;
    totalExpensesUsd: number;
    currentlyOccupiedRooms: number;
    profit: number;
    profitUsd: number;
    activeBookingsToday?: number;
}

export interface RevenueTrend {
    name: string;
    ingresos: number;
    gastos: number;
}

export interface OccupancyStat {
    name: string;
    reservas: number;
    ocupacion: number;
}

export interface SedePerformance {
    sede: string;
    ingresos: number;
    gastos: number;
    utilidad: number;
    ocupacion: number;
    color: string;
}

export interface SalesCrmDashboardData {
    period: string;
    leads: {
        total: number;
        by_status: { status: string; count: number }[];
    };
    quotes: {
        total: number;
        by_status: { status: string; count: number }[];
    };
    revenue_by_category: { category: string; amount: number }[];
    room_hours: { room: string; hours: number }[];
    revenue_by_branch: { branch: string; amount: number }[];
}

export interface OperatorDashboardData {
    daily_sales: number;
    orders_by_category: { category: string; amount: number }[];
    recent_orders: {
        id: number;
        client_name: string;
        total: number;
        status: string;
        date: string;
    }[];
    debts: {
        client_id: number;
        client_name: string;
        balance: number;
        last_order_date: string | null;
    }[];
    daily_bookings: {
        room_name: string;
        client_name: string;
        start_time: string;
        end_time: string;
        notes: string;
    }[];
}
