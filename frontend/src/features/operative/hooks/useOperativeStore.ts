import { create } from 'zustand';
import type { Client, Office, Room, Membership, Amenity, Booking, ContractTemplate, SpaceCategory, RoomType, AmenityTemplate } from '../types';
import { operativeService } from '../services/operative.service';

interface OperativeState {
    clients: Client[];
    offices: Office[];
    rooms: Room[];
    memberships: Membership[];
    amenities: Amenity[];
    bookings: Booking[];
    amenityTemplates: AmenityTemplate[];
    isLoading: boolean;
    error: string | null;
    clearError: () => void;

    fetchClients: (branchId?: number, search?: string) => Promise<void>;
    fetchOffices: (branchId?: number) => Promise<void>;
    fetchRooms: (branchId?: number) => Promise<void>;
    fetchBookings: (branchId?: number, start?: string, end?: string) => Promise<void>;
    fetchMemberships: (branchId?: number) => Promise<void>;
    fetchClientMemberships: (clientId: number) => Promise<Membership[]>;
    fetchAmenities: (branchId?: number, clientId?: number, spaceId?: number, spaceType?: string) => Promise<Amenity[]>;
    fetchAmenityTemplates: (branchId?: number) => Promise<void>;

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
    updateBooking: (id: number, data: Partial<Booking>) => Promise<boolean>;
    deleteBooking: (id: number) => Promise<boolean>;

    // Contract Templates
    contractTemplates: ContractTemplate[];
    fetchContractTemplates: () => Promise<void>;
    createContractTemplate: (data: Partial<ContractTemplate>) => Promise<boolean>;
    updateContractTemplate: (id: number, data: Partial<ContractTemplate>) => Promise<boolean>;
    deleteContractTemplate: (id: number) => Promise<boolean>;

    // Catalogs
    spaceCategories: SpaceCategory[];
    fetchSpaceCategories: (branchId?: number) => Promise<void>;
    createSpaceCategory: (data: Partial<SpaceCategory>) => Promise<boolean>;
    updateSpaceCategory: (id: number, data: Partial<SpaceCategory>) => Promise<boolean>;
    deleteSpaceCategory: (id: number) => Promise<boolean>;

    roomTypes: RoomType[];
    fetchRoomTypes: (branchId?: number) => Promise<void>;
    createRoomType: (data: Partial<RoomType>) => Promise<boolean>;
    updateRoomType: (id: number, data: Partial<RoomType>) => Promise<boolean>;
    deleteRoomType: (id: number) => Promise<boolean>;
}

export const useOperativeStore = create<OperativeState>((set, get) => ({
    clients: [],
    offices: [],
    rooms: [],
    memberships: [],
    amenities: [],
    bookings: [],
    amenityTemplates: [],
    contractTemplates: [],
    spaceCategories: [],
    roomTypes: [],
    isLoading: false,
    error: null,
    clearError: () => set({ error: null }),

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

    fetchAmenityTemplates: async (branchId) => {
        try {
            const data = await operativeService.getAmenityTemplates(branchId);
            set({ amenityTemplates: data });
        } catch (e: any) { set({ error: e.message }); }
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
    updateBooking: async (id, data) => {
        try {
            await operativeService.updateBooking(id, data);
            await get().fetchBookings();
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },
    deleteBooking: async (id) => {
        try {
            await operativeService.deleteBooking(id);
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

    // Catalogs
    fetchSpaceCategories: async (branchId) => {
        try {
            const data = await operativeService.getSpaceCategories(branchId);
            set({ spaceCategories: data });
        } catch (e: any) { set({ error: e.message }); }
    },
    createSpaceCategory: async (data) => {
        try {
            await operativeService.createSpaceCategory(data);
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },
    updateSpaceCategory: async (id, data) => {
        try {
            await operativeService.updateSpaceCategory(id, data);
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },
    deleteSpaceCategory: async (id) => {
        try {
            await operativeService.deleteSpaceCategory(id);
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },

    fetchRoomTypes: async (branchId) => {
        try {
            const data = await operativeService.getRoomTypes(branchId);
            set({ roomTypes: data });
        } catch (e: any) { set({ error: e.message }); }
    },
    createRoomType: async (data) => {
        try {
            await operativeService.createRoomType(data);
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },
    updateRoomType: async (id, data) => {
        try {
            await operativeService.updateRoomType(id, data);
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },
    deleteRoomType: async (id) => {
        try {
            await operativeService.deleteRoomType(id);
            return true;
        } catch (e: any) { set({ error: e.message }); return false; }
    },
}));
