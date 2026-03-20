import api from '../../../services/api';

export interface AppNotification {
    id: number;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

export const systemService = {
    getNotifications: async () => {
        const { data } = await api.get<AppNotification[]>('/system/notifications');
        return data;
    },
    markAsRead: async (notifId: number) => {
        const { data } = await api.put(`/system/notifications/${notifId}/read`);
        return data;
    }
};
