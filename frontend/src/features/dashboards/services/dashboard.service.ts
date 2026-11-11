import api from '../../../services/api';
import type { DashboardKPIs, RevenueTrend, OccupancyStat, SedePerformance, SalesCrmDashboardData, OperatorDashboardData } from '../types';

const BASE = '/dashboards';

export const dashboardService = {
    getKPIs: async (): Promise<DashboardKPIs> => {
        const response = await api.get(`${BASE}/kpis`);
        return response.data;
    },

    getRevenueTrend: async (): Promise<RevenueTrend[]> => {
        const response = await api.get(`${BASE}/revenue-trend`);
        return response.data;
    },

    getOccupancyStats: async (): Promise<OccupancyStat[]> => {
        const response = await api.get(`${BASE}/occupancy-stats`);
        return response.data;
    },

    getSedePerformance: async (): Promise<SedePerformance[]> => {
        const response = await api.get(`${BASE}/sede-performance`);
        return response.data;
    },

    getSalesCrmDashboard: async (period: string = 'monthly'): Promise<SalesCrmDashboardData> => {
        const response = await api.get(`${BASE}/sales-crm`, { params: { period } });
        return response.data;
    },

    getOperatorDashboard: async (): Promise<OperatorDashboardData> => {
        const response = await api.get(`${BASE}/operator`);
        return response.data;
    }
};
