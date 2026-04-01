import { create } from 'zustand';
import type {
    Product,
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
import { financialService } from '../services/financial.service';

interface FinancialState {
    products: Product[];
    orders: Orden[];
    purchases: Purchase[];
    expenses: Expense[];
    receipts: Receipt[];
    receivables: ReceivableSummary[];
    cashMovements: CashMovement[];
    cashCategories: CashCategory[];
    paymentMethods: PaymentMethod[];
    financialSummary: FinancialSummary | null;
    dashboardStats: DashboardStats | null;
    clientStatement: ClientStatement | null;
    isLoading: boolean;
    error: string | null;

    fetchProducts: (branchId?: number) => Promise<void>;
    fetchOrders: (branchId?: number) => Promise<void>;
    fetchPurchases: (branchId?: number) => Promise<void>;
    fetchExpenses: (branchId?: number) => Promise<void>;
    fetchReceipts: (orderId?: number, purchaseId?: number) => Promise<void>;
    fetchClientStatement: (clientId: number) => Promise<ClientStatement | null>;
    fetchReceivables: (branchId?: number) => Promise<void>;
    fetchCashMovements: (branchId?: number, month?: number, year?: number) => Promise<void>;
    fetchCashCategories: () => Promise<void>;
    fetchFinancialSummary: (branchId?: number, month?: number, year?: number) => Promise<void>;
    fetchDashboardStats: (branchId?: number) => Promise<void>;
    fetchPaymentMethods: (branchId?: number) => Promise<void>;

    createProduct: (data: Partial<Product>) => Promise<boolean>;
    createOrder: (data: Partial<Orden>) => Promise<boolean>;
    updateOrder: (orderId: number, data: any) => Promise<boolean>;
    deleteOrder: (orderId: number, reason: string) => Promise<boolean>;
    getOrderLogs: (orderId: number) => Promise<any[]>;
    createPurchase: (data: Partial<Purchase>) => Promise<boolean>;
    createExpense: (data: Partial<Expense>) => Promise<boolean>;
    createReceipt: (data: Partial<Receipt>) => Promise<boolean>;
    createCashMovement: (data: Partial<CashMovement>) => Promise<boolean>;
    createCashCategory: (data: Partial<CashCategory>) => Promise<boolean>;
    updateCashCategory: (id: number, data: Partial<CashCategory>) => Promise<boolean>;
    deleteCashCategory: (id: number) => Promise<boolean>;
}

export const useFinancialStore = create<FinancialState>((set, get) => ({
    products: [],
    orders: [],
    purchases: [],
    expenses: [],
    receipts: [],
    receivables: [],
    cashMovements: [],
    cashCategories: [],
    paymentMethods: [],
    financialSummary: null,
    dashboardStats: null,
    clientStatement: null,
    isLoading: false,
    error: null,

    fetchProducts: async (branchId) => {
        set({ isLoading: true, error: null });
        try {
            const products = await financialService.getProducts(branchId);
            set({ products, isLoading: false });
        } catch (e: any) { set({ error: e.message, isLoading: false }); }
    },

    fetchOrders: async (branchId) => {
        set({ isLoading: true, error: null });
        try {
            const orders = await financialService.getOrders(branchId);
            set({ orders, isLoading: false });
        } catch (e: any) { set({ error: e.message, isLoading: false }); }
    },

    fetchPurchases: async (branchId) => {
        set({ isLoading: true, error: null });
        try {
            const purchases = await financialService.getPurchases(branchId);
            set({ purchases, isLoading: false });
        } catch (e: any) { set({ error: e.message, isLoading: false }); }
    },

    fetchExpenses: async (branchId) => {
        set({ isLoading: true, error: null });
        try {
            const expenses = await financialService.getExpenses(branchId);
            set({ expenses, isLoading: false });
        } catch (e: any) { set({ error: e.message, isLoading: false }); }
    },

    fetchReceipts: async (orderId, purchaseId) => {
        set({ isLoading: true, error: null });
        try {
            const receipts = await financialService.getReceipts(orderId, purchaseId);
            set({ receipts, isLoading: false });
        } catch (e: any) { set({ error: e.message, isLoading: false }); }
    },

    fetchClientStatement: async (clientId) => {
        set({ isLoading: true, error: null });
        try {
            const data = await financialService.getClientStatement(clientId);
            set({ clientStatement: data, isLoading: false });
            return data;
        } catch (e: any) {
            set({ error: e.message, isLoading: false });
            return null;
        }
    },

    fetchReceivables: async () => {
        set({ isLoading: true, error: null });
        try {
            const receivables = await financialService.getReceivables();
            set({ receivables, isLoading: false });
        } catch (e: any) { set({ error: e.message, isLoading: false }); }
    },

    fetchCashMovements: async (branchId, month, year) => {
        set({ isLoading: true, error: null });
        try {
            const cashMovements = await financialService.getCashMovements(branchId, month, year);
            set({ cashMovements, isLoading: false });
        } catch (e: any) { set({ error: e.message, isLoading: false }); }
    },

    fetchCashCategories: async () => {
        set({ isLoading: true, error: null });
        try {
            const cashCategories = await financialService.getCashCategories();
            set({ cashCategories, isLoading: false });
        } catch (e: any) { set({ error: e.message, isLoading: false }); }
    },

    fetchFinancialSummary: async (branchId, month, year) => {
        set({ isLoading: true, error: null });
        try {
            const financialSummary = await financialService.getFinancialSummary(branchId, month, year);
            set({ financialSummary, isLoading: false });
        } catch (e: any) { set({ error: e.message, isLoading: false }); }
    },

    fetchDashboardStats: async (branchId) => {
        set({ isLoading: true, error: null });
        try {
            const dashboardStats = await financialService.getDashboardStats(branchId);
            set({ dashboardStats, isLoading: false });
        } catch (e: any) { set({ error: e.message, isLoading: false }); }
    },

    fetchPaymentMethods: async (branchId) => {
        set({ isLoading: true, error: null });
        try {
            const paymentMethods = await financialService.getPaymentMethods(branchId);
            set({ paymentMethods, isLoading: false });
        } catch (e: any) { set({ error: e.message, isLoading: false }); }
    },

    createProduct: async (data) => {
        try {
            await financialService.createProduct(data);
            await get().fetchProducts();
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },

    createOrder: async (data) => {
        try {
            await financialService.createOrder(data);
            await get().fetchOrders();
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },

    updateOrder: async (orderId, data) => {
        try {
            await financialService.updateOrder(orderId, data);
            await get().fetchOrders();
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },

    deleteOrder: async (orderId, reason) => {
        try {
            await financialService.deleteOrder(orderId, reason);
            await get().fetchOrders();
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },

    getOrderLogs: async (orderId) => {
        try {
            return await financialService.getOrderLogs(orderId);
        } catch (e: any) { set({ error: e.message }); return []; }
    },

    createPurchase: async (data) => {
        try {
            await financialService.createPurchase(data);
            await get().fetchPurchases();
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },

    createExpense: async (data) => {
        try {
            await financialService.createExpense(data);
            await get().fetchExpenses();
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },

    createReceipt: async (data) => {
        try {
            await financialService.createReceipt(data);
            if (data.orden_id) await get().fetchOrders();
            if (data.purchase_id) await get().fetchPurchases();
            if (data.client_id) await get().fetchClientStatement(data.client_id);
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },

    createCashMovement: async (data) => {
        try {
            await financialService.createCashMovement(data);
            await get().fetchCashMovements();
            await get().fetchFinancialSummary();
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },

    createCashCategory: async (data) => {
        try {
            await financialService.createCashCategory(data);
            await get().fetchCashCategories();
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },

    updateCashCategory: async (id, data) => {
        try {
            await financialService.updateCashCategory(id, data);
            await get().fetchCashCategories();
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },

    deleteCashCategory: async (id) => {
        try {
            await financialService.deleteCashCategory(id);
            await get().fetchCashCategories();
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },
}));
