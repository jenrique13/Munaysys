import { create } from 'zustand';
import { financialService } from '../services/financial.service';
import type { Product, Service, Consumable, ConsumableCategory, ConsumableUsage } from '../types';

interface InventoryState {
    products: Product[];
    services: Service[];
    consumables: Consumable[];
    consumableCategories: ConsumableCategory[];
    consumableUsages: ConsumableUsage[];
    isLoading: boolean;
    error: string | null;

    fetchInventory: () => Promise<void>;
    fetchConsumableUsages: () => Promise<void>;

    // Products
    createProduct: (data: Partial<Product>) => Promise<boolean>;
    updateProduct: (id: number, data: Partial<Product>) => Promise<boolean>;
    deleteProduct: (id: number) => Promise<boolean>;

    // Services
    createService: (data: Partial<Service>) => Promise<boolean>;
    updateService: (id: number, data: Partial<Service>) => Promise<boolean>;
    deleteService: (id: number) => Promise<boolean>;

    // Consumables
    createConsumable: (data: Partial<Consumable>) => Promise<boolean>;
    updateConsumable: (id: number, data: Partial<Consumable>) => Promise<boolean>;
    deleteConsumable: (id: number) => Promise<boolean>;
    // Consumable Categories
    createConsumableCategory: (data: Partial<ConsumableCategory>) => Promise<boolean>;
    updateConsumableCategory: (id: number, data: Partial<ConsumableCategory>) => Promise<boolean>;
    deleteConsumableCategory: (id: number) => Promise<boolean>;

    // Usage
    createConsumableUsage: (data: Partial<ConsumableUsage>) => Promise<boolean>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
    products: [],
    services: [],
    consumables: [],
    consumableCategories: [],
    consumableUsages: [],
    isLoading: false,
    error: null,

    fetchInventory: async () => {
        set({ isLoading: true, error: null });
        try {
            const [prods, svcs, cons, cats] = await Promise.all([
                financialService.getProducts(),
                financialService.getServices(),
                financialService.getConsumables(),
                financialService.getConsumableCategories()
            ]);
            set({ products: prods, services: svcs, consumables: cons, consumableCategories: cats, isLoading: false });
        } catch (e: any) {
            set({ error: e.message, isLoading: false });
        }
    },

    // ── PRODUCTS ──────────────────────────────────────────────
    createProduct: async (data) => {
        try {
            await financialService.createProduct(data);
            await get().fetchInventory();
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },
    updateProduct: async (id, data) => {
        try {
            await financialService.updateProduct(id, data);
            await get().fetchInventory();
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },
    deleteProduct: async (id) => {
        try {
            await financialService.deleteProduct(id);
            await get().fetchInventory();
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },

    // ── SERVICES ──────────────────────────────────────────────
    createService: async (data) => {
        try {
            await financialService.createService(data);
            await get().fetchInventory();
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },
    updateService: async (id, data) => {
        try {
            await financialService.updateService(id, data);
            await get().fetchInventory();
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },
    deleteService: async (id) => {
        try {
            await financialService.deleteService(id);
            await get().fetchInventory();
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },

    // ── CONSUMABLES ───────────────────────────────────────────
    createConsumable: async (data) => {
        try {
            await financialService.createConsumable(data);
            await get().fetchInventory();
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },
    updateConsumable: async (id, data) => {
        try {
            await financialService.updateConsumable(id, data);
            await get().fetchInventory();
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },
    deleteConsumable: async (id) => {
        try {
            await financialService.deleteConsumable(id);
            await get().fetchInventory();
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },

    // ── CONSUMABLE CATEGORIES ─────────────────────────────────
    createConsumableCategory: async (data) => {
        try {
            await financialService.createConsumableCategory(data);
            await get().fetchInventory();
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },
    updateConsumableCategory: async (id, data) => {
        try {
            await financialService.updateConsumableCategory(id, data);
            await get().fetchInventory();
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },
    deleteConsumableCategory: async (id) => {
        try {
            await financialService.deleteConsumableCategory(id);
            await get().fetchInventory();
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },

    // ── CONSUMABLE USAGES ─────────────────────────────────────
    fetchConsumableUsages: async () => {
        set({ isLoading: true, error: null });
        try {
            const usages = await financialService.getConsumableUsages();
            set({ consumableUsages: usages, isLoading: false });
        } catch (e: any) {
            set({ error: e.message, isLoading: false });
        }
    },
    createConsumableUsage: async (data) => {
        try {
            await financialService.createConsumableUsage(data);
            await get().fetchConsumableUsages();
            await get().fetchInventory(); // To update the remaining stock immediately
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    }
}));
