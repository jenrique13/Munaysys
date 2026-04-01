import { create } from 'zustand';
import api from '../services/api';

export interface ClientProfile {
    id: number;
    name: string;
    email: string;
    phone: string;
    ci_rif: string;
    status: string;
    active_membership_name?: string;
}

export interface Statement {
    balance: number;
    total_charges: number;
    total_paid: number;
    orders: any[];
    receipts: any[];
}

interface ClientState {
    profile: ClientProfile | null;
    statement: Statement | null;
    memberships: any[];
    rooms: any[];
    isLoading: boolean;
    fetchProfile: () => Promise<void>;
    fetchStatement: () => Promise<void>;
    fetchMemberships: () => Promise<void>;
    fetchRooms: () => Promise<void>;
    createBooking: (data: any) => Promise<boolean>;
    updateProfile: (id: number, data: any) => Promise<boolean>;
}

export const useClientStore = create<ClientState>((set, get) => ({
    profile: null,
    statement: null,
    memberships: [],
    rooms: [],
    isLoading: false,
    fetchProfile: async () => {
        set({ isLoading: true });
        try {
            const response = await api.get('/operative/clients/me');
            set({ profile: response.data, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
        }
    },
    fetchStatement: async () => {
        try {
            const response = await api.get('/financial/clients/me/statement');
            set({ statement: response.data });
        } catch (error) {}
    },
    fetchMemberships: async () => {
        const profile = get().profile;
        if (!profile) return;
        try {
            const response = await api.get(`/operative/memberships?client_id=${profile.id}`);
            set({ memberships: response.data });
        } catch (error) {}
    },
    fetchRooms: async () => {
        try {
            const response = await api.get('/operative/rooms');
            set({ rooms: response.data });
        } catch (error) {}
    },
    createBooking: async (data) => {
        try {
            await api.post('/operative/bookings', data);
            return true;
        } catch (error) {
            return false;
        }
    },
    updateProfile: async (id, data) => {
        try {
            await api.put(`/operative/clients/${id}`, data);
            get().fetchProfile();
            return true;
        } catch (error) {
            return false;
        }
    }
}));
