import { create } from 'zustand';
import { dashboardService } from '../services/dashboard.service';
import type { DashboardKPIs, RevenueTrend, OccupancyStat, SedePerformance, OperatorDashboardData } from '../types';

interface DashboardState {
    kpis: DashboardKPIs | null;
    revenueTrend: RevenueTrend[];
    occupancyStats: OccupancyStat[];
    sedePerformance: SedePerformance[];
    operatorData: OperatorDashboardData | null;
    isLoading: boolean;
    error: string | null;

    fetchDashboardData: () => Promise<void>;
    fetchOperatorData: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
    kpis: null,
    revenueTrend: [],
    occupancyStats: [],
    sedePerformance: [],
    operatorData: null,
    isLoading: false,
    error: null,

    fetchDashboardData: async () => {
        set({ isLoading: true, error: null });
        try {
            const [kpis, revenueTrend, occupancyStats, sedePerformance] = await Promise.all([
                dashboardService.getKPIs(),
                dashboardService.getRevenueTrend(),
                dashboardService.getOccupancyStats(),
                dashboardService.getSedePerformance()
            ]);

            set({
                kpis,
                revenueTrend,
                occupancyStats,
                sedePerformance,
                isLoading: false
            });
        } catch (error: any) {
            set({
                error: error.response?.data?.detail || 'Error al cargar los datos del dashboard',
                isLoading: false
            });
        }
    },

    fetchOperatorData: async () => {
        set({ isLoading: true, error: null });
        try {
            const data = await dashboardService.getOperatorDashboard();
            set({
                operatorData: data,
                isLoading: false
            });
        } catch (error: any) {
            set({
                error: error.response?.data?.detail || 'Error al cargar los datos del dashboard operativo',
                isLoading: false
            });
        }
    }
}));
