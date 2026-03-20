import api from '../../../services/api';
import type { PipelineStage, Lead, Opportunity } from '../../../types';

export const crmService = {
    // Stages
    getStages: async (branchId?: number) => {
        const response = await api.get<PipelineStage[]>('/crm/stages', { params: { branch_id: branchId } });
        return response.data;
    },

    // Leads
    getLeads: async (branchId?: number) => {
        const response = await api.get<Lead[]>('/crm/leads', { params: { branch_id: branchId } });
        return response.data;
    },
    createLead: async (leadData: Partial<Lead>) => {
        const response = await api.post<Lead>('/crm/leads', leadData);
        return response.data;
    },
    updateLead: async (leadId: number, leadData: Partial<Lead>) => {
        const response = await api.put<Lead>(`/crm/leads/${leadId}`, leadData);
        return response.data;
    },
    archiveLead: async (leadId: number) => {
        const response = await api.put<Lead>(`/crm/leads/${leadId}/archive`);
        return response.data;
    },
    deleteLead: async (leadId: number) => {
        await api.delete(`/crm/leads/${leadId}`);
        return true;
    },

    // Opportunities
    getOpportunities: async (branchId?: number) => {
        const response = await api.get<Opportunity[]>('/crm/opportunities', { params: { branch_id: branchId } });
        return response.data;
    },
    createOpportunity: async (oppData: Partial<Opportunity>) => {
        const response = await api.post<Opportunity>('/crm/opportunities', oppData);
        return response.data;
    },

    updateOpportunityStage: async (oppId: number, newStageId: number) => {
        const response = await api.put<Opportunity & { client_created: { id: number; name: string; email: string | null } | null }>(
            `/crm/opportunities/${oppId}/stage`,
            { stage_id: newStageId }
        );
        return response.data;
    },
};
