import api from '../../../services/api';
import type {
    Product,
    Service,
    Consumable,
    ConsumableCategory,
    ConsumableUsage,
    Orden,
    Purchase,
    Expense,
    Receipt,
    ClientStatement,
    ReceivableSummary,
    CashMovement,
    CashCategory,
    FinancialSummary,
    DashboardStats,
    PaymentMethod
} from '../types';

const BASE = '/financial';

export const financialService = {
    // ── PRODUCTS ─────────────────────────────
    getProducts: async (branchId?: number) => {
        const res = await api.get<Product[]>(`${BASE}/products`, { params: { branch_id: branchId } });
        return res.data;
    },
    createProduct: async (data: Partial<Product>) => {
        const res = await api.post<Product>(`${BASE}/products`, data);
        return res.data;
    },
    updateProduct: async (id: number, data: Partial<Product>) => {
        const res = await api.put<Product>(`${BASE}/products/${id}`, data);
        return res.data;
    },
    deleteProduct: async (id: number) => {
        const res = await api.delete(`${BASE}/products/${id}`);
        return res.data;
    },

    // ── SERVICES ─────────────────────────────
    getServices: async (branchId?: number) => {
        const res = await api.get<Service[]>(`${BASE}/services`, { params: { branch_id: branchId } });
        return res.data;
    },
    createService: async (data: Partial<Service>) => {
        const res = await api.post<Service>(`${BASE}/services`, data);
        return res.data;
    },
    updateService: async (id: number, data: Partial<Service>) => {
        const res = await api.put<Service>(`${BASE}/services/${id}`, data);
        return res.data;
    },
    deleteService: async (id: number) => {
        const res = await api.delete(`${BASE}/services/${id}`);
        return res.data;
    },

    // ── CONSUMABLE CATEGORIES ────────────────
    getConsumableCategories: async () => {
        const res = await api.get<ConsumableCategory[]>(`${BASE}/consumable-categories`);
        return res.data;
    },
    createConsumableCategory: async (data: Partial<ConsumableCategory>) => {
        const res = await api.post<ConsumableCategory>(`${BASE}/consumable-categories`, data);
        return res.data;
    },
    updateConsumableCategory: async (id: number, data: Partial<ConsumableCategory>) => {
        const res = await api.put<ConsumableCategory>(`${BASE}/consumable-categories/${id}`, data);
        return res.data;
    },
    deleteConsumableCategory: async (id: number) => {
        await api.delete(`${BASE}/consumable-categories/${id}`);
    },

    // ── USAGE / TICKETS ──────────────────────
    getConsumableUsages: async () => {
        const res = await api.get<ConsumableUsage[]>(`${BASE}/consumable-usage`);
        return res.data;
    },
    createConsumableUsage: async (data: Partial<ConsumableUsage>) => {
        const res = await api.post<ConsumableUsage>(`${BASE}/consumable-usage`, data);
        return res.data;
    },

    // ── CONSUMABLES ──────────────────────────
    getConsumables: async () => {
        const res = await api.get<Consumable[]>(`${BASE}/consumables`);
        return res.data;
    },
    createConsumable: async (data: Partial<Consumable>) => {
        const res = await api.post<Consumable>(`${BASE}/consumables`, data);
        return res.data;
    },
    updateConsumable: async (id: number, data: Partial<Consumable>) => {
        const res = await api.put<Consumable>(`${BASE}/consumables/${id}`, data);
        return res.data;
    },
    deleteConsumable: async (id: number) => {
        const res = await api.delete(`${BASE}/consumables/${id}`);
        return res.data;
    },

    // ── ORDERS (ÓRDENES) ─────────────────────
    getOrders: async (branchId?: number) => {
        const res = await api.get<Orden[]>(`${BASE}/orders`, { params: { branch_id: branchId } });
        return res.data;
    },
    createOrder: async (data: Partial<Orden>) => {
        const res = await api.post<Orden>(`${BASE}/orders`, data);
        return res.data;
    },
    updateOrder: async (orderId: number, data: any) => {
        const res = await api.put<Orden>(`${BASE}/orders/${orderId}`, data);
        return res.data;
    },
    deleteOrder: async (orderId: number, reason: string) => {
        const res = await api.delete(`${BASE}/orders/${orderId}?reason=${encodeURIComponent(reason)}`);
        return res.data;
    },
    getOrderLogs: async (orderId: number) => {
        const res = await api.get(`${BASE}/orders/${orderId}/logs`);
        return res.data;
    },
    getClientStatement: async (clientId: number) => {
        const res = await api.get<ClientStatement>(`${BASE}/clients/${clientId}/statement`);
        return res.data;
    },

    // ── PURCHASES (COMPRAS) ──────────────────
    getPurchases: async (branchId?: number) => {
        const res = await api.get<Purchase[]>(`${BASE}/purchases`, { params: { branch_id: branchId } });
        return res.data;
    },
    createPurchase: async (data: Partial<Purchase>) => {
        const res = await api.post<Purchase>(`${BASE}/purchases`, data);
        return res.data;
    },

    // ── EXPENSES (GASTOS) ────────────────────
    getExpenses: async (branchId?: number) => {
        const res = await api.get<Expense[]>(`${BASE}/expenses`, { params: { branch_id: branchId } });
        return res.data;
    },
    createExpense: async (data: Partial<Expense>) => {
        const res = await api.post<Expense>(`${BASE}/expenses`, data);
        return res.data;
    },

    // ── RECEIPTS (RECIBOS/PAGOS) ─────────────
    getReceipts: async (orderId?: number, purchaseId?: number) => {
        const params: any = {};
        if (orderId) params.order_id = orderId;
        if (purchaseId) params.purchase_id = purchaseId;
        const res = await api.get<Receipt[]>(`${BASE}/receipts`, { params });
        return res.data;
    },
    createReceipt: async (data: Partial<Receipt>) => {
        const res = await api.post<Receipt>(`${BASE}/receipts`, data);
        return res.data;
    },

    // ── CASH CATEGORIES ────────────────────
    getCashCategories: async () => {
        const res = await api.get<CashCategory[]>(`${BASE}/cash-categories`);
        return res.data;
    },
    createCashCategory: async (data: Partial<CashCategory>) => {
        const res = await api.post<CashCategory>(`${BASE}/cash-categories`, data);
        return res.data;
    },
    updateCashCategory: async (id: number, data: Partial<CashCategory>) => {
        const res = await api.put<CashCategory>(`${BASE}/cash-categories/${id}`, data);
        return res.data;
    },
    deleteCashCategory: async (id: number) => {
        await api.delete(`${BASE}/cash-categories/${id}`);
    },

    // ── PHASE 6: NEW FEATURES ────────────────
    getReceivables: async () => {
        const res = await api.get<ReceivableSummary[]>(`${BASE}/receivables`);
        return res.data;
    },
    getCashMovements: async () => {
        const res = await api.get<CashMovement[]>(`${BASE}/cash-movements`);
        return res.data;
    },
    createCashMovement: async (data: Partial<CashMovement>) => {
        const res = await api.post<CashMovement>(`${BASE}/cash-movements`, data);
        return res.data;
    },
    getFinancialSummary: async () => {
        const res = await api.get<FinancialSummary>(`${BASE}/financial-summary`);
        return res.data;
    },
    getDashboardStats: async () => {
        const res = await api.get<DashboardStats>(`${BASE}/dashboard-stats`);
        return res.data;
    },

    // ── PAYMENT METHODS ──────────────────────
    getPaymentMethods: async (branchId?: number) => {
        const res = await api.get<PaymentMethod[]>(`${BASE}/payment-methods`, { params: { branch_id: branchId } });
        return res.data;
    },
    createPaymentMethod: async (data: Partial<PaymentMethod>) => {
        const res = await api.post<PaymentMethod>(`${BASE}/payment-methods`, data);
        return res.data;
    },
    updatePaymentMethod: async (id: number, data: Partial<PaymentMethod>) => {
        const res = await api.put<PaymentMethod>(`${BASE}/payment-methods/${id}`, data);
        return res.data;
    },
    deletePaymentMethod: async (id: number) => {
        await api.delete(`${BASE}/payment-methods/${id}`);
    },
};
