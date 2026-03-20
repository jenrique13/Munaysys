export interface DashboardKPIs {
    newLeads: number;
    totalIncome: number;
    totalExpenses: number;
    activeBookingsToday: number;
    profit: number;
}

export interface RevenueTrend {
    name: string;
    ingresos: number;
    gastos: number;
}

export interface OccupancyStat {
    name: string;
    reservas: number;
}

export interface SedePerformance {
    sede: string;
    ingresos: number;
    gastos: number;
    utilidad: number;
    ocupacion: number;
    color: string;
}
