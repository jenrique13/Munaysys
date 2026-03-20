import axios from 'axios';
import type { DashboardKPIs, RevenueTrend, OccupancyStat, SedePerformance } from '../types';

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000/api/v1`;

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

export const dashboardService = {
    getKPIs: async (): Promise<DashboardKPIs> => {
        const response = await axios.get(`${API_URL}/dashboards/kpis`, getAuthHeaders());
        return response.data;
    },

    getRevenueTrend: async (): Promise<RevenueTrend[]> => {
        const response = await axios.get(`${API_URL}/dashboards/revenue-trend`, getAuthHeaders());
        return response.data;
    },

    getOccupancyStats: async (): Promise<OccupancyStat[]> => {
        const response = await axios.get(`${API_URL}/dashboards/occupancy-stats`, getAuthHeaders());
        return response.data;
    },

    getSedePerformance: async (): Promise<SedePerformance[]> => {
        const response = await axios.get(`${API_URL}/dashboards/sede-performance`, getAuthHeaders());
        return response.data;
    }
};
