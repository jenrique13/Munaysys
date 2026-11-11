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
    subtotal?: number;
    tax?: number;
    igtf_amount?: number;
    expense_id: number | null;
    purchase_id: number | null;
    branch_id: number;
    category?: string;
    exchange_rate?: number;
    exchange_currency?: string;
    provider?: Provider;
    payment_method?: string;
}

export interface CreatePayableDTO {
    provider_id: number;
    amount: number;
    branch_id: number;
    due_date: string;
    description?: string;
    reference?: string;
    status?: string;
    subtotal?: number;
    tax?: number;
    igtf_amount?: number;
    exchange_rate?: number;
    exchange_currency?: string;
    expense_id?: number | null;
    purchase_id?: number | null;
    category?: string;
    paid_date?: string | null;
    payment_method?: string;
}

export type UpdatePayableDTO = Partial<CreatePayableDTO>;

export const providersService = {
    getProviders: async () => {
        const response = await api.get('/providers');
        return response.data;
    },

    getProvider: async (id: number) => {
        const response = await api.get(`/providers/${id}`);
        return response.data;
    },

    createProvider: async (data: CreateProviderDTO) => {
        const response = await api.post('/providers', data);
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
    getPayables: async (providerId?: number, month?: number, year?: number, branchId?: number) => {
        const params: any = {};
        if (providerId) params.provider_id = providerId;
        if (month) params.month = month;
        if (year) params.year = year;
        if (branchId !== undefined) params.branch_id = branchId;
        const response = await api.get('/providers/payables', { params });
        return response.data;
    },

    createPayable: async (data: CreatePayableDTO) => {
        const response = await api.post('/providers/payables', data);
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

    getProviderStatement: async (providerId: number, params?: { month?: number; year?: number; status?: string; branch_id?: number }) => {
        const response = await api.get(`/providers/${providerId}/statement`, { params });
        return response.data;
    },
};

export interface ProviderStatementTransaction {
    id: number;
    date: string;
    type: 'purchase' | 'expense' | 'payment' | 'payable';
    description: string;
    reference: string | null;
    amount: number;
    exchange_rate: number | null;
    amount_bs: number | null;
    status: string | null;
}

export interface ProviderStatement {
    provider_id: number;
    provider_name: string;
    total_purchases: number;
    total_expenses: number;
    total_paid: number;
    balance: number;
    total_purchases_bs: number;
    total_expenses_bs: number;
    total_paid_bs: number;
    balance_bs: number;
    transactions: ProviderStatementTransaction[];
}
