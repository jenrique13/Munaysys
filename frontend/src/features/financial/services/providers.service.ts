import api from '../../../services/api';

export interface Provider {
    id: number;
    name: string;
    nit_ruc: string | null;
    email: string | null;
    phone: string | null;
    contact_name: string | null;
    payment_info: string | null;
    notes: string | null;
    branch_id: number;
}

export type CreateProviderDTO = Omit<Provider, 'id' | 'branch_id'>;
export type UpdateProviderDTO = Partial<CreateProviderDTO>;

export interface Payable {
    id: number;
    provider_id: number;
    reference: string | null;
    amount: number;
    due_date: string;
    status: 'pending' | 'paid' | 'cancelled';
    paid_date: string | null;
    expense_id: number | null;
    purchase_id: number | null;
    branch_id: number;
    provider?: Provider;
}

export type CreatePayableDTO = Omit<Payable, 'id' | 'branch_id' | 'provider'>;
export type UpdatePayableDTO = Partial<CreatePayableDTO>;

export const providersService = {
    getProviders: async () => {
        const response = await api.get('/providers/');
        return response.data;
    },

    getProvider: async (id: number) => {
        const response = await api.get(`/providers/${id}`);
        return response.data;
    },

    createProvider: async (data: CreateProviderDTO) => {
        const response = await api.post('/providers/', data);
        return response.data;
    },

    updateProvider: async (id: number, data: UpdateProviderDTO) => {
        const response = await api.put(`/providers/${id}`, data);
        return response.data;
    },

    deleteProvider: async (id: number) => {
        const response = await api.delete(`/providers/${id}`);
        return response.data;
    },

    // --- Payables ---
    getPayables: async (providerId?: number) => {
        const url = providerId ? `/providers/payables/?provider_id=${providerId}` : '/providers/payables/';
        const response = await api.get(url);
        return response.data;
    },

    createPayable: async (data: CreatePayableDTO) => {
        const response = await api.post('/providers/payables/', data);
        return response.data;
    },

    updatePayable: async (id: number, data: UpdatePayableDTO) => {
        const response = await api.put(`/providers/payables/${id}`, data);
        return response.data;
    },

    deletePayable: async (id: number) => {
        const response = await api.delete(`/providers/payables/${id}`);
        return response.data;
    },
};
