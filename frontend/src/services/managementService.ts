import api from './api';

export interface SedePerformance {
  sede: string;
  ingresos: number;
  ocupacion: number;
  color: string;
}

export interface CRMFunnel {
  stage: string;
  count: number;
}

export interface RevenueByCategory {
  category: string;
  amount: number;
}

export const managementService = {
  getKPIs: async (branchId: number) => {
    const response = await api.get('/dashboards/kpis', {
      headers: { 'X-Branch-Id': branchId.toString() }
    });
    return response.data;
  },

  getRevenueTrend: async (branchId: number) => {
    const response = await api.get('/dashboards/revenue-trend', {
      headers: { 'X-Branch-Id': branchId.toString() }
    });
    return response.data;
  },

  getRevenueByCategory: async (branchId: number) => {
    const response = await api.get('/dashboards/revenue-by-category', {
      headers: { 'X-Branch-Id': branchId.toString() }
    });
    return response.data;
  },

  getCRMFunnel: async () => {
    const response = await api.get('/dashboards/crm-funnel');
    return response.data;
  },

  getSedePerformance: async () => {
    const response = await api.get('/dashboards/sede-performance');
    return response.data;
  }
};
