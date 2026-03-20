import api from '../../../services/api';
import type { Quote, QuoteCreate, QuoteUpdate } from '../types';

export const quotesService = {
    getAll: async (branchId?: number, skip = 0, limit = 100): Promise<Quote[]> => {
        const response = await api.get<Quote[]>('/crm/quotes/', { params: { branch_id: branchId, skip, limit } });
        return response.data;
    },

    getById: async (id: number): Promise<Quote> => {
        const response = await api.get<Quote>(`/crm/quotes/${id}`);
        return response.data;
    },

    create: async (data: QuoteCreate): Promise<Quote> => {
        const response = await api.post<Quote>('/crm/quotes/', data);
        return response.data;
    },

    update: async (id: number, data: QuoteUpdate): Promise<Quote> => {
        const response = await api.put<Quote>(`/crm/quotes/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/crm/quotes/${id}`);
    },

    convertToOrder: async (quoteId: number, clientId: number | null): Promise<{ message: string; order_id: number; order_total: number }> => {
        const response = await api.post(`/crm/quotes/${quoteId}/convert`, { client_id: clientId });
        return response.data;
    },
};
