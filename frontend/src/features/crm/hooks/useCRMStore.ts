import { create } from 'zustand';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import type { PipelineStage, Opportunity } from '../../../types';
import { crmService } from '../services/crm.service';

interface CRMState {
    stages: PipelineStage[];
    opportunities: Opportunity[];
    isLoading: boolean;
    error: string | null;
    lastConvertedClient: { id: number; name: string; email: string | null } | null;

    // Actions
    fetchKanbanData: (branchId?: number) => Promise<void>;
    moveOpportunity: (oppId: number, sourceStageId: number, destStageId: number) => Promise<void>;
    addLeadWithOpportunity: (leadData: any, expectedValue: number) => Promise<boolean>;

    // CRUD Actions UI
    updateLeadAction: (leadId: number, leadData: any) => Promise<boolean>;
    archiveLeadAction: (leadId: number) => Promise<boolean>;
    deleteLeadAction: (leadId: number) => Promise<boolean>;

    // UI State
    editingLeadOpp: Opportunity | null;
    setEditingLeadOpp: (opp: Opportunity | null) => void;
    clearConvertedClient: () => void;
}

export const useCRMStore = create<CRMState>((set, get) => ({
    stages: [],
    opportunities: [],
    isLoading: false,
    error: null,
    editingLeadOpp: null,
    lastConvertedClient: null,

    setEditingLeadOpp: (opp) => set({ editingLeadOpp: opp }),
    clearConvertedClient: () => set({ lastConvertedClient: null }),

    fetchKanbanData: async (branchId?: number) => {
        set({ isLoading: true, error: null });
        try {
            // We pass branchId (0 = all) to get global visibility
            const [stages, opportunities] = await Promise.all([
                crmService.getStages(branchId),
                crmService.getOpportunities(branchId),
            ]);
            set({ stages, opportunities, isLoading: false });
        } catch (e: any) {
            set({ error: e.message || 'Error cargando datos del Kanban', isLoading: false });
        }
    },

    moveOpportunity: async (oppId: number, sourceStageId: number, destStageId: number) => {
        if (sourceStageId === destStageId) return;

        // Optimistic UI update
        const prevOpps = get().opportunities;
        set({
            opportunities: prevOpps.map(opp =>
                opp.id === oppId ? { ...opp, stage_id: destStageId } : opp
            )
        });

        try {
            const result = await crmService.updateOpportunityStage(oppId, destStageId);
            // Detect if the backend auto-created a client from this lead
            if (result.client_created) {
                set({ lastConvertedClient: result.client_created });
            }
        } catch (e: any) {
            // Revert if error
            set({ opportunities: prevOpps, error: 'Error al mover la oportunidad' });
        }
    },

    addLeadWithOpportunity: async (leadData: any, expectedValue: number) => {
        set({ isLoading: true, error: null });
        try {
            const state = get();
            if (state.stages.length === 0) throw new Error("No hay pipeline stages definidos.");

            const firstStageId = state.stages[0].id;

            // 1. Create Lead
            const branchId = useAuthStore.getState().selectedBranchId ?? 0;
            const newLead = await crmService.createLead({ ...leadData, branch_id: branchId });

            // 2. Create Opportunity
            await crmService.createOpportunity({
                lead_id: newLead.id,
                stage_id: firstStageId,
                estimated_value: expectedValue,
                probability: state.stages[0].probability || 10
            });

            // Reload context to get all joins (or we could manually insert into state)
            await get().fetchKanbanData();

            return true;
        } catch (e: any) {
            set({ error: e.message || 'Error al crear el Lead', isLoading: false });
            return false;
        }
    },

    updateLeadAction: async (leadId: number, leadData: any) => {
        set({ isLoading: true, error: null });
        try {
            await crmService.updateLead(leadId, leadData);
            await get().fetchKanbanData(); // reload
            return true;
        } catch (e: any) {
            set({ error: e.message || 'Error al actualizar el Lead', isLoading: false });
            return false;
        }
    },

    archiveLeadAction: async (leadId: number) => {
        if (!confirm("¿Deseas archivar este lead? Podrás recuperarlo después si es necesario.")) return false;
        set({ isLoading: true });
        try {
            await crmService.archiveLead(leadId);
            await get().fetchKanbanData();
            return true;
        } catch (e: any) {
            set({ error: e.message || 'Error al archivar el Lead', isLoading: false });
            return false;
        }
    },

    deleteLeadAction: async (leadId: number) => {
        if (!confirm("¿Deseas eliminar permanentemente este lead y todas sus oportunidades asociadas? Esta acción no se puede deshacer.")) return false;
        set({ isLoading: true });
        try {
            await crmService.deleteLead(leadId);
            await get().fetchKanbanData();
            return true;
        } catch (e: any) {
            set({ error: e.message || 'Error al eliminar el Lead', isLoading: false });
            return false;
        }
    }
}));

