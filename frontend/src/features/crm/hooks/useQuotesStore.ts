import { create } from 'zustand';
import type { Quote, QuoteCreate, QuoteUpdate } from '../types';
import { quotesService } from '../services/quotes.service';

interface QuotesState {
    quotes: Quote[];
    isLoading: boolean;
    error: string | null;
    lastConvertedOrderId: number | null;

    fetchQuotes: (branchId?: number, search?: string, status?: string) => Promise<void>;
    createQuote: (data: QuoteCreate) => Promise<Quote | null>;
    updateQuote: (id: number, data: QuoteUpdate) => Promise<Quote | null>;
    deleteQuote: (id: number) => Promise<boolean>;
    convertToOrder: (quoteId: number, clientId: number | null) => Promise<boolean>;
    clearConvertedOrder: () => void;
}

export const useQuotesStore = create<QuotesState>((set) => ({
    quotes: [],
    isLoading: false,
    error: null,
    lastConvertedOrderId: null,

    clearConvertedOrder: () => set({ lastConvertedOrderId: null }),

    fetchQuotes: async (branchId?: number, search?: string, status?: string) => {
        set({ isLoading: true, error: null });
        try {
            const quotes = await quotesService.getAll(branchId, search, status);
            set({ quotes, isLoading: false });
        } catch (e: any) {
            set({ error: e.message || 'Error al cargar presupuestos', isLoading: false });
        }
    },

    createQuote: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const newQuote = await quotesService.create(data);
            set(state => ({ quotes: [newQuote, ...state.quotes], isLoading: false }));
            return newQuote;
        } catch (e: any) {
            set({ error: e.response?.data?.detail || e.message || 'Error al crear el presupuesto', isLoading: false });
            return null;
        }
    },

    updateQuote: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
            const updated = await quotesService.update(id, data);
            set(state => ({
                quotes: state.quotes.map(q => q.id === id ? updated : q),
                isLoading: false,
            }));
            return updated;
        } catch (e: any) {
            set({ error: e.response?.data?.detail || e.message || 'Error al actualizar el presupuesto', isLoading: false });
            return null;
        }
    },

    deleteQuote: async (id) => {
        try {
            await quotesService.delete(id);
            set(state => ({ quotes: state.quotes.filter(q => q.id !== id) }));
            return true;
        } catch (e: any) {
            set({ error: e.message || 'Error al eliminar el presupuesto' });
            return false;
        }
    },

    convertToOrder: async (quoteId, clientId) => {
        set({ isLoading: true, error: null });
        try {
            const result = await quotesService.convertToOrder(quoteId, clientId);
            set(state => ({
                quotes: state.quotes.map(q => q.id === quoteId ? { ...q, status: 'converted' as const, converted_order_id: result.order_id } : q),
                lastConvertedOrderId: result.order_id,
                isLoading: false,
            }));
            return true;
        } catch (e: any) {
            set({ error: e.response?.data?.detail || e.message || 'Error al convertir el presupuesto', isLoading: false });
            return false;
        }
    },
}));
