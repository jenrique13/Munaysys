import { create } from 'zustand';
import { authService } from '../services/auth.service';
import type { LoginParams } from '../services/auth.service';

export interface AuthUser {
    id: number;
    email: string;
    is_active: boolean;
    is_superuser: boolean;
    role_id?: number;
    branch_id?: number;
    access_permissions: Record<string, any>;
    role?: { id: number; name: string; permissions_json: any };
    branch?: { id: number; name: string; color?: string };
}

interface AuthState {
    user: AuthUser | null;
    isLoading: boolean;
    error: string | null;
    selectedBranchId: number | null;
    fetchCurrentUser: () => Promise<void>;
    login: (credentials: LoginParams) => Promise<boolean>;
    logout: () => void;
    refreshToken: () => Promise<void>;
    clearError: () => void;
    setSelectedBranchId: (id: number | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: false,
    error: null,
    selectedBranchId: null,
    setSelectedBranchId: (id) => set({ selectedBranchId: id }),
    fetchCurrentUser: async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        set({ isLoading: true, error: null });
        try {
            const user = await authService.me();
            set({ user, isLoading: false });
        } catch (error) {
            console.error('Error fetching user', error);
            localStorage.removeItem('token'); // Invalid token
            set({ user: null, isLoading: false });
        }
    },

    login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
            const data = await authService.login(credentials);
            localStorage.setItem('token', data.access_token);
            const user = await authService.me();
            set({ user, isLoading: false });
            return true;
        } catch (error: any) {
            const status = error.response?.status;
            let errMsg = 'Ocurrió un error inesperado al iniciar sesión.';

            if (status === 401) {
                errMsg = 'Correo o contraseña incorrectos.';
            } else if (status === 400 && error.response?.data?.detail === "Usuario Inactivo") {
                errMsg = 'Tu cuenta está inactiva. Contacta al administrador.';
            }

            set({ error: errMsg, isLoading: false });
            return false;
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        set({ user: null });
    },

    refreshToken: async () => {
        try {
            const data = await authService.refreshToken();
            localStorage.setItem('token', data.access_token);
        } catch (error) {
            console.error('Silent refresh failed', error);
            // If refresh fails, we don't necessarily logout here, 
            // the 401 interceptor will handle it if the token is truly dead.
        }
    },

    clearError: () => set({ error: null })
}));
