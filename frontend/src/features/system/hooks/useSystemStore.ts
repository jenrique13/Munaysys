import { create } from 'zustand';
import { systemService } from '../services/system.service';
import type { AppNotification } from '../services/system.service';

interface SystemState {
    notifications: AppNotification[];
    isLoading: boolean;
    error: string | null;
    bcvRateUsd: number | null;
    bcvRateEur: number | null;
    fetchNotifications: () => Promise<void>;
    fetchBcvRates: () => Promise<void>;
    markAsRead: (id: number) => Promise<void>;
}

export const useSystemStore = create<SystemState>((set) => ({
    notifications: [],
    isLoading: false,
    error: null,
    bcvRateUsd: null,
    bcvRateEur: null,

    fetchNotifications: async () => {
        set({ isLoading: true, error: null });
        try {
            const data = await systemService.getNotifications();
            set({ notifications: data, isLoading: false });
        } catch (e: any) {
            set({ error: e.message, isLoading: false });
        }
    },

    fetchBcvRates: async () => {
        try {
            const data = await systemService.getBcvRates();
            set({ bcvRateUsd: data.usd, bcvRateEur: data.eur });
        } catch (e: any) {
            console.error("Failed to fetch BCV rates", e);
        }
    },

    markAsRead: async (id: number) => {
        try {
            await systemService.markAsRead(id);
            set(state => ({
                notifications: state.notifications.map(n =>
                    n.id === id ? { ...n, is_read: true } : n
                )
            }));
        } catch (e: any) {
            console.error("Failed to mark notification as read", e);
        }
    }
}));
