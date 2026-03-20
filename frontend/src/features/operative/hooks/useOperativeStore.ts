import { create } from 'zustand';
import type { Client, Office, Room, Membership, Amenity, Booking, ContractTemplate } from '../types';
import { operativeService } from '../services/operative.service';

interface OperativeState {
    clients: Client[];
    offices: Office[];
    rooms: Room[];
    memberships: Membership[];
    amenities: Amenity[];
    bookings: Booking[];
    isLoading: boolean;
    error: string | null;

    fetchClients: (branchId?: number, search?: string) => Promise<void>;
    fetchOffices: (branchId?: number) => Promise<void>;
    fetchRooms: (branchId?: number) => Promise<void>;
    fetchBookings: (branchId?: number, start?: string, end?: string) => Promise<void>;
    fetchMemberships: (branchId?: number) => Promise<void>;
    fetchClientMemberships: (clientId: number) => Promise<Membership[]>;
    fetchAmenities: (branchId?: number, clientId?: number, spaceId?: number, spaceType?: string) => Promise<Amenity[]>;

    createClient: (data: Partial<Client>) => Promise<boolean>;
    updateClient: (id: number, data: Partial<Client>) => Promise<boolean>;

    createOffice: (data: Partial<Office>) => Promise<boolean>;
    updateOffice: (id: number, data: Partial<Office>) => Promise<boolean>;
    deleteOffice: (id: number) => Promise<boolean>;

    createRoom: (data: Partial<Room>) => Promise<boolean>;
    updateRoom: (id: number, data: Partial<Room>) => Promise<boolean>;
    deleteRoom: (id: number) => Promise<boolean>;

    createMembership: (data: Partial<Membership>) => Promise<boolean>;
    updateMembership: (id: number, data: Partial<Membership>) => Promise<boolean>;
    deleteMembership: (id: number) => Promise<boolean>;

    createBooking: (data: Partial<Booking>) => Promise<{ ok: boolean; conflict?: boolean }>;
    updateBookingStatus: (id: number, status: string) => Promise<boolean>;

    // Contract Templates
    contractTemplates: ContractTemplate[];
    fetchContractTemplates: () => Promise<void>;
    createContractTemplate: (data: Partial<ContractTemplate>) => Promise<boolean>;
    updateContractTemplate: (id: number, data: Partial<ContractTemplate>) => Promise<boolean>;
    deleteContractTemplate: (id: number) => Promise<boolean>;
}

export const useOperativeStore = create<OperativeState>((set, get) => ({
    clients: [],
    offices: [],
    rooms: [],
    memberships: [],
    amenities: [],
    bookings: [],
    contractTemplates: [],
    isLoading: false,
    error: null,

    fetchClients: async (branchId, search) => {
        set({ isLoading: true, error: null });
        try {
            const clients = await operativeService.getClients(branchId, search);
            set({ clients, isLoading: false });
        } catch (e: any) { set({ error: e.message, isLoading: false }); }
    },

    fetchOffices: async (branchId) => {
        set({ isLoading: true, error: null });
        try {
            const offices = await operativeService.getOffices(branchId);
            set({ offices, isLoading: false });
        } catch (e: any) { set({ error: e.message, isLoading: false }); }
    },

    fetchRooms: async (branchId) => {
        set({ isLoading: true, error: null });
        try {
            const rooms = await operativeService.getRooms(branchId);
            set({ rooms, isLoading: false });
        } catch (e: any) { set({ error: e.message, isLoading: false }); }
    },

    fetchBookings: async (branchId, start, end) => {
        set({ isLoading: true, error: null });
        try {
            const bookings = await operativeService.getBookings(branchId, start, end);
            set({ bookings, isLoading: false });
        } catch (e: any) { set({ error: e.message, isLoading: false }); }
    },

    fetchMemberships: async (/* branchId */) => {
        set({ isLoading: true, error: null });
        try {
            const memberships = await operativeService.getMemberships(undefined);
            set({ memberships, isLoading: false });
        } catch (e: any) { set({ error: e.message, isLoading: false }); }
    },

    fetchClientMemberships: async (clientId) => {
        const data = await operativeService.getMemberships(clientId);
        set({ memberships: data });
        return data;
    },

    fetchAmenities: async (branchId, clientId, spaceId, spaceType) => {
        const data = await operativeService.getAmenities(branchId, clientId, spaceId, spaceType);
        set({ amenities: data });
        return data;
    },

    createClient: async (data) => {
        try {
            await operativeService.createClient(data);
            await get().fetchClients();
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },

    updateClient: async (id, data) => {
        try {
            await operativeService.updateClient(id, data);
            await get().fetchClients();
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },

    createOffice: async (data) => {
        try {
            await operativeService.createOffice(data);
            await get().fetchOffices();
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },

    updateOffice: async (id, data) => {
        try {
            await operativeService.updateOffice(id, data);
            await get().fetchOffices();
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },

    deleteOffice: async (id) => {
        try {
            await operativeService.deleteOffice(id);
            await get().fetchOffices();
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },

    createRoom: async (data) => {
        try {
            await operativeService.createRoom(data);
            await get().fetchRooms();
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },

    updateRoom: async (id, data) => {
        try {
            await operativeService.updateRoom(id, data);
            await get().fetchRooms();
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },

    deleteRoom: async (id) => {
        try {
            await operativeService.deleteRoom(id);
            await get().fetchRooms();
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },

    createMembership: async (data) => {
        try {
            await operativeService.createMembership(data);
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },
    updateMembership: async (id, data) => {
        try {
            await operativeService.updateMembership(id, data);
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },
    deleteMembership: async (id) => {
        try {
            await operativeService.deleteMembership(id);
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },

    createBooking: async (data) => {
        try {
            await operativeService.createBooking(data);
            await get().fetchBookings();
            return { ok: true };
        } catch (e: any) {
            if (e?.response?.status === 409) return { ok: false, conflict: true };
            set({ error: e.message });
            return { ok: false };
        }
    },

    updateBookingStatus: async (id, status) => {
        try {
            await operativeService.updateBookingStatus(id, status);
            await get().fetchBookings();
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },

    fetchContractTemplates: async () => {
        try {
            const templates = await operativeService.getContractTemplates();
            set({ contractTemplates: templates });
        } catch (e: any) { set({ error: e.message }); }
    },
    createContractTemplate: async (data) => {
        try {
            await operativeService.createContractTemplate(data);
            await get().fetchContractTemplates();
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },
    updateContractTemplate: async (id, data) => {
        try {
            await operativeService.updateContractTemplate(id, data);
            await get().fetchContractTemplates();
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },
    deleteContractTemplate: async (id) => {
        try {
            await operativeService.deleteContractTemplate(id);
            await get().fetchContractTemplates();
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },
}));
