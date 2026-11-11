import { create } from 'zustand';
import { dashboardService } from '../services/dashboard.service';
import type { SalesCrmDashboardData } from '../types';

interface SalesDashboardState {
    data: SalesCrmDashboardData | null;
    isLoading: boolean;
    error: string | null;
    period: string;

    setPeriod: (period: string) => void;
    fetchData: () => Promise<void>;
}

export const useSalesDashboardStore = create<SalesDashboardState>((set, get) => ({
    data: null,
    isLoading: false,
    error: null,
    period: 'monthly',

    setPeriod: (period: string) => {
        set({ period });
        get().fetchData();
    },

    fetchData: async () => {
        const { period } = get();
        set({ isLoading: true, error: null });
        try {
            const data = await dashboardService.getSalesCrmDashboard(period);
            set({ data, isLoading: false });
        } catch (error: any) {
            set({
                error: error.response?.data?.detail || 'Error al cargar los datos de Ventas & CRM',
                isLoading: false
            });
        }
    }
}));
