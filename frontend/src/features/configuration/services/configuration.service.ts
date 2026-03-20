import api from '../../../services/api';
import type { User, UserConfigUpdate, Branch, BranchCreate, BranchUpdate, Role, RoleCreate, RoleUpdate } from '../types';

const BASE = '/configuration';

export const configurationService = {
    // ── USERS ─────────────────────────────
    getUsers: async () => {
        const res = await api.get<User[]>(`${BASE}/users`);
        return res.data;
    },
    getUser: async (userId: number) => {
        const res = await api.get<User>(`${BASE}/users/${userId}`);
        return res.data;
    },
    updateUser: async (userId: number, data: UserConfigUpdate) => {
        const res = await api.put<User>(`${BASE}/users/${userId}`, data);
        return res.data;
    },
    createUser: async (data: any) => {
        const res = await api.post<User>(`/auth/register`, data);
        return res.data;
    },
    deleteUser: async (userId: number) => {
        await api.delete(`${BASE}/users/${userId}`);
    },

    getRoles: async () => {
        const res = await api.get<Role[]>(`${BASE}/roles`);
        return res.data;
    },
    createRole: async (data: RoleCreate) => {
        const res = await api.post<Role>(`${BASE}/roles`, data);
        return res.data;
    },
    updateRole: async (id: number, data: RoleUpdate) => {
        const res = await api.put<Role>(`${BASE}/roles/${id}`, data);
        return res.data;
    },
    deleteRole: async (id: number) => {
        await api.delete(`${BASE}/roles/${id}`);
    },

    // ── BRANCHES ──────────────────────────
    getBranches: async () => {
        const res = await api.get<Branch[]>(`${BASE}/branches`);
        return res.data;
    },
    getBranch: async (branchId: number) => {
        const res = await api.get<Branch>(`${BASE}/branches/${branchId}`);
        return res.data;
    },
    createBranch: async (data: BranchCreate) => {
        const res = await api.post<Branch>(`${BASE}/branches`, data);
        return res.data;
    },
    updateBranch: async (branchId: number, data: BranchUpdate) => {
        const res = await api.put<Branch>(`${BASE}/branches/${branchId}`, data);
        return res.data;
    },
};
