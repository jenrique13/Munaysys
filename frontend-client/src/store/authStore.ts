import { create } from 'zustand';
import api from '../services/api';

export interface AuthUser {
    id: number;
    email: string;
    is_active: boolean;
    is_superuser: boolean;
    role?: { id: number; name: string };
    branch?: { id: number; name: string; color?: string };
}

interface AuthState {
    user: AuthUser | null;
    isLoading: boolean;
    error: string | null;
    fetchCurrentUser: () => Promise<void>;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true,
    error: null,
    fetchCurrentUser: async () => {
        const token = localStorage.getItem('token');
        if (!token) { set({ isLoading: false }); return; }

        set({ isLoading: true, error: null });
        try {
            const response = await api.get('/auth/me');
            set({ user: response.data, isLoading: false });
        } catch (error) {
            localStorage.removeItem('token');
            set({ user: null, isLoading: false });
        }
    },
    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', password);

            const response = await api.post('/auth/login', formData);
            localStorage.setItem('token', response.data.access_token);

            const userResponse = await api.get('/auth/me');
            set({ user: userResponse.data, isLoading: false });
            return true;
        } catch (error: any) {
            set({
                error: error.response?.data?.detail || 'Error al iniciar sesión',
                isLoading: false
            });
            return false;
        }
    },
    logout: () => {
        localStorage.removeItem('token');
        set({ user: null });
    }
}));
