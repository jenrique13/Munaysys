import { create } from 'zustand';
import { providersService } from '../services/providers.service';
import type {
    Provider,
    Payable,
    CreateProviderDTO,
    UpdateProviderDTO,
    CreatePayableDTO,
    UpdatePayableDTO,
} from '../services/providers.service';

interface ProvidersState {
    providers: Provider[];
    payables: Payable[];
    isLoading: boolean;
    error: string | null;
    fetchProviders: () => Promise<void>;
    createProvider: (data: CreateProviderDTO) => Promise<void>;
    updateProvider: (id: number, data: UpdateProviderDTO) => Promise<void>;
    deleteProvider: (id: number) => Promise<void>;
    fetchPayables: (providerId?: number) => Promise<void>;
    createPayable: (data: CreatePayableDTO) => Promise<void>;
    updatePayable: (id: number, data: UpdatePayableDTO) => Promise<void>;
    deletePayable: (id: number) => Promise<void>;
}

export const useProvidersStore = create<ProvidersState>((set) => ({
    providers: [],
    payables: [],
    isLoading: false,
    error: null,

    fetchProviders: async () => {
        set({ isLoading: true, error: null });
        try {
            const providers = await providersService.getProviders();
            set({ providers, isLoading: false });
        } catch (error: any) {
            set({ error: error.message || 'Error al cargar proveedores', isLoading: false });
        }
    },

    createProvider: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const newProvider = await providersService.createProvider(data);
            set((state) => ({
                providers: [...state.providers, newProvider],
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.message || 'Error al crear proveedor', isLoading: false });
            throw error;
        }
    },

    updateProvider: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
            const updatedProvider = await providersService.updateProvider(id, data);
            set((state) => ({
                providers: state.providers.map(p => p.id === id ? updatedProvider : p),
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.message || 'Error al actualizar proveedor', isLoading: false });
            throw error;
        }
    },

    deleteProvider: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await providersService.deleteProvider(id);
            set((state) => ({
                providers: state.providers.filter(p => p.id !== id),
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.message || 'Error al eliminar proveedor', isLoading: false });
            throw error;
        }
    },

    fetchPayables: async (providerId) => {
        set({ isLoading: true, error: null });
        try {
            const payables = await providersService.getPayables(providerId);
            set({ payables, isLoading: false });
        } catch (error: any) {
            set({ error: error.message || 'Error al cargar cuentas por pagar', isLoading: false });
        }
    },

    createPayable: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const newPayable = await providersService.createPayable(data);
            set((state) => ({
                payables: [...state.payables, newPayable],
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.message || 'Error al registrar cuenta por pagar', isLoading: false });
            throw error;
        }
    },

    updatePayable: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
            const updatedPayable = await providersService.updatePayable(id, data);
            set((state) => ({
                payables: state.payables.map(p => p.id === id ? updatedPayable : p),
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.message || 'Error al actualizar cuenta por pagar', isLoading: false });
            throw error;
        }
    },

    deletePayable: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await providersService.deletePayable(id);
            set((state) => ({
                payables: state.payables.filter(p => p.id !== id),
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.message || 'Error al eliminar cuenta por pagar', isLoading: false });
            throw error;
        }
    },
}));
