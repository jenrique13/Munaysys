import { create } from 'zustand';
import { configurationService } from '../services/configuration.service';
import type { User, UserConfigUpdate, Branch, BranchCreate, BranchUpdate, Role, RoleCreate, RoleUpdate } from '../types';

interface ConfigurationState {
    users: User[];
    clientUsers: User[];
    branches: Branch[];
    roles: Role[];
    isLoading: boolean;
    error: string | null;

    fetchUsers: () => Promise<void>;
    updateUser: (userId: number, data: UserConfigUpdate) => Promise<boolean>;
    createUser: (data: any) => Promise<boolean>;
    deleteUser: (userId: number) => Promise<boolean>;

    fetchClientUsers: () => Promise<void>;
    createClientUser: (data: { email: string; password: string; role_name?: string; branch_id?: number }) => Promise<boolean>;
    updateClientUser: (userId: number, data: UserConfigUpdate) => Promise<boolean>;
    deleteClientUser: (userId: number) => Promise<boolean>;

    fetchRoles: () => Promise<void>;
    createRole: (data: RoleCreate) => Promise<boolean>;
    updateRole: (roleId: number, data: RoleUpdate) => Promise<boolean>;
    deleteRole: (roleId: number) => Promise<boolean>;

    fetchBranches: () => Promise<void>;
    createBranch: (data: BranchCreate) => Promise<boolean>;
    updateBranch: (branchId: number, data: BranchUpdate) => Promise<boolean>;
    clearError: () => void;
}

export const useConfigurationStore = create<ConfigurationState>((set, get) => ({
    users: [],
    clientUsers: [],
    branches: [],
    roles: [],
    isLoading: false,
    error: null,

    fetchUsers: async () => {
        set({ isLoading: true, error: null });
        try {
            const users = await configurationService.getUsers();
            set({ users, isLoading: false });
        } catch (e: any) { set({ error: e.message, isLoading: false }); }
    },

    updateUser: async (userId, data) => {
        set({ isLoading: true, error: null });
        try {
            await configurationService.updateUser(userId, data);
            await get().fetchUsers();
            return true;
        } catch (e: any) { set({ error: e.message, isLoading: false }); return false; }
    },

    createUser: async (data) => {
        set({ isLoading: true, error: null });
        try {
            await configurationService.createUser(data);
            await get().fetchUsers();
            return true;
        } catch (e: any) { set({ error: e.response?.data?.detail || e.message, isLoading: false }); return false; }
    },

    deleteUser: async (userId) => {
        set({ isLoading: true, error: null });
        try {
            await configurationService.deleteUser(userId);
            await get().fetchUsers();
            return true;
        } catch (e: any) { set({ error: e.message, isLoading: false }); return false; }
    },

    fetchClientUsers: async () => {
        set({ isLoading: true, error: null });
        try {
            const clientUsers = await configurationService.getClientUsers();
            set({ clientUsers, isLoading: false });
        } catch (e: any) { set({ error: e.message, isLoading: false }); }
    },

    createClientUser: async (data) => {
        set({ isLoading: true, error: null });
        try {
            await configurationService.createClientUser(data);
            await get().fetchClientUsers();
            return true;
        } catch (e: any) { set({ error: e.response?.data?.detail || e.message, isLoading: false }); return false; }
    },

    updateClientUser: async (userId, data) => {
        set({ isLoading: true, error: null });
        try {
            await configurationService.updateClientUser(userId, data);
            await get().fetchClientUsers();
            return true;
        } catch (e: any) { set({ error: e.message, isLoading: false }); return false; }
    },

    deleteClientUser: async (userId) => {
        set({ isLoading: true, error: null });
        try {
            await configurationService.deleteClientUser(userId);
            await get().fetchClientUsers();
            return true;
        } catch (e: any) { set({ error: e.message, isLoading: false }); return false; }
    },

    fetchRoles: async () => {
        set({ isLoading: true, error: null });
        try {
            const roles = await configurationService.getRoles();
            set({ roles, isLoading: false });
        } catch (e: any) { set({ error: e.message, isLoading: false }); }
    },

    createRole: async (data) => {
        set({ isLoading: true, error: null });
        try {
            await configurationService.createRole(data);
            await get().fetchRoles();
            return true;
        } catch (e: any) { set({ error: e.message, isLoading: false }); return false; }
    },

    updateRole: async (roleId, data) => {
        set({ isLoading: true, error: null });
        try {
            await configurationService.updateRole(roleId, data);
            await get().fetchRoles();
            return true;
        } catch (e: any) { set({ error: e.message, isLoading: false }); return false; }
    },

    deleteRole: async (roleId) => {
        set({ isLoading: true, error: null });
        try {
            await configurationService.deleteRole(roleId);
            await get().fetchRoles();
            return true;
        } catch (e: any) { set({ error: e.response?.data?.detail || e.message, isLoading: false }); return false; }
    },

    fetchBranches: async () => {
        set({ isLoading: true, error: null });
        try {
            const branches = await configurationService.getBranches();
            set({ branches, isLoading: false });
        } catch (e: any) { set({ error: e.message, isLoading: false }); }
    },

    createBranch: async (data) => {
        set({ isLoading: true, error: null });
        try {
            await configurationService.createBranch(data);
            await get().fetchBranches();
            return true;
        } catch (e: any) { set({ error: e.message, isLoading: false }); return false; }
    },

    updateBranch: async (branchId, data) => {
        set({ isLoading: true, error: null });
        try {
            await configurationService.updateBranch(branchId, data);
            await get().fetchBranches();
            return true;
        } catch (e: any) { set({ error: e.message, isLoading: false }); return false; }
    },

    clearError: () => set({ error: null }),
}));
