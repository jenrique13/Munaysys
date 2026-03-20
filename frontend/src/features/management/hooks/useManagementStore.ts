import { create } from 'zustand';
import { managementService } from '../../../services/managementService';
import type { SedePerformance, CRMFunnel, RevenueByCategory } from '../../../services/managementService';

interface ManagementState {
  kpis: any;
  revenueTrend: any[];
  revenueByCategory: RevenueByCategory[];
  crmFunnel: CRMFunnel[];
  sedePerformance: SedePerformance[];
  isLoading: boolean;
  error: string | null;

  fetchManagementData: (branchId: number) => Promise<void>;
}

export const useManagementStore = create<ManagementState>((set) => ({
  kpis: null,
  revenueTrend: [],
  revenueByCategory: [],
  crmFunnel: [],
  sedePerformance: [],
  isLoading: false,
  error: null,

  fetchManagementData: async (branchId: number) => {
    set({ isLoading: true, error: null });
    try {
      const [kpis, trend, categories, funnel, performance] = await Promise.all([
        managementService.getKPIs(branchId),
        managementService.getRevenueTrend(branchId),
        managementService.getRevenueByCategory(branchId),
        managementService.getCRMFunnel(),
        managementService.getSedePerformance()
      ]);
      set({ 
        kpis: kpis || { totalIncome: 0, totalExpenses: 0, profit: 0, newLeads: 0, activeBookingsToday: 0 }, 
        revenueTrend: Array.isArray(trend) ? trend : [], 
        revenueByCategory: Array.isArray(categories) ? categories : [], 
        crmFunnel: Array.isArray(funnel) ? funnel : [], 
        sedePerformance: Array.isArray(performance) ? performance : [],
        isLoading: false 
      });
    } catch (err: any) {
      set({ error: err.message || 'Error al cargar datos de gerencia', isLoading: false });
    }
  }
}));
