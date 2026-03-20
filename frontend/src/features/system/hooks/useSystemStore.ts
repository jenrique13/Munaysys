import { create } from 'zustand';
import { systemService } from '../services/system.service';
import type { AppNotification } from '../services/system.service';

interface SystemState {
    notifications: AppNotification[];
    isLoading: boolean;
    error: string | null;
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: number) => Promise<void>;
}

export const useSystemStore = create<SystemState>((set) => ({
    notifications: [],
    isLoading: false,
    error: null,

    fetchNotifications: async () => {
        set({ isLoading: true, error: null });
        try {
            const data = await systemService.getNotifications();
            set({ notifications: data, isLoading: false });
        } catch (e: any) {
            set({ error: e.message, isLoading: false });
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
