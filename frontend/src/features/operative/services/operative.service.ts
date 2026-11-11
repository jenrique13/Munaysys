import api from '../../../services/api';
import type { Client, Office, Room, Membership, Amenity, Booking, ContractTemplate, AmenityHistory, SpaceCategory, RoomType, AmenityTemplate } from '../types';
import type { Service } from '../../financial/types';

const BASE = '/operative';

export const operativeService = {
    // ── CLIENTS ──────────────────────────────
    getClients: async (branchId?: number, search?: string) => {
        const res = await api.get<Client[]>(`${BASE}/clients`, { params: { branch_id: branchId, search, limit: 10000 } });
        return res.data;
    },
    createClient: async (data: Partial<Client>) => {
        const res = await api.post<Client>(`${BASE}/clients`, data);
        return res.data;
    },
    updateClient: async (id: number, data: Partial<Client>) => {
        const res = await api.put<Client>(`${BASE}/clients/${id}`, data);
        return res.data;
    },

    // ── OFFICES ──────────────────────────────
    getOffices: async (branchId?: number) => {
        const res = await api.get<Office[]>(`${BASE}/offices`, { params: { branch_id: branchId } });
        return res.data;
    },
    createOffice: async (data: Partial<Office>) => {
        const res = await api.post<Office>(`${BASE}/offices`, data);
        return res.data;
    },
    updateOffice: async (id: number, data: Partial<Office>) => {
        const res = await api.put<Office>(`${BASE}/offices/${id}`, data);
        return res.data;
    },
    deleteOffice: async (id: number) => {
        const res = await api.delete(`${BASE}/offices/${id}`);
        return res.data;
    },

    // ── ROOMS ────────────────────────────────
    getRooms: async (branchId?: number) => {
        const res = await api.get<Room[]>(`${BASE}/rooms`, { params: { branch_id: branchId } });
        return res.data;
    },
    createRoom: async (data: Partial<Room>) => {
        const res = await api.post<Room>(`${BASE}/rooms`, data);
        return res.data;
    },
    updateRoom: async (id: number, data: Partial<Room>) => {
        const res = await api.put<Room>(`${BASE}/rooms/${id}`, data);
        return res.data;
    },
    deleteRoom: async (id: number) => {
        const res = await api.delete(`${BASE}/rooms/${id}`);
        return res.data;
    },

    // ── MEMBERSHIPS ──────────────────────────
    getMemberships: async (clientId?: number) => {
        const res = await api.get<Membership[]>(`${BASE}/memberships`, { params: { client_id: clientId } });
        return res.data;
    },
    createMembership: async (data: Partial<Membership>) => {
        const res = await api.post<Membership>(`${BASE}/memberships`, data);
        return res.data;
    },
    updateMembership: async (id: number, data: Partial<Membership>) => {
        const res = await api.put<Membership>(`${BASE}/memberships/${id}`, data);
        return res.data;
    },
    deleteMembership: async (id: number) => {
        const res = await api.delete(`${BASE}/memberships/${id}`);
        return res.data;
    },

    // ── AMENITIES ────────────────────────────
    getAmenities: async (branchId?: number, clientId?: number, spaceId?: number, spaceType?: string) => {
        const res = await api.get<Amenity[]>(`${BASE}/amenities`, {
            params: { branch_id: branchId, client_id: clientId, space_id: spaceId, space_type: spaceType },
        });
        return res.data;
    },
    createAmenity: async (data: Partial<Amenity>) => {
        const res = await api.post<Amenity>(`${BASE}/amenities`, data);
        return res.data;
    },
    updateAmenity: async (id: number, data: Partial<Amenity>) => {
        const res = await api.put<Amenity>(`${BASE}/amenities/${id}`, data);
        return res.data;
    },
    deleteAmenity: async (id: number) => {
        const res = await api.delete(`${BASE}/amenities/${id}`);
        return res.data;
    },
    getAmenityHistory: async (branchId?: number, clientId?: number) => {
        const res = await api.get<AmenityHistory[]>(`${BASE}/amenity-history`, {
            params: { branch_id: branchId, client_id: clientId },
        });
        return res.data;
    },
    getServices: async (branchId?: number) => {
        const res = await api.get<Service[]>(`/financial/services`, {
            params: { branch_id: branchId }
        });
        return res.data;
    },


    // ── BOOKINGS ─────────────────────────────
    getBookings: async (branchId?: number, start?: string, end?: string) => {
        const res = await api.get<Booking[]>(`${BASE}/bookings`, {
            params: { branch_id: branchId, start, end },
        });
        return res.data;
    },
    createBooking: async (data: Partial<Booking>) => {
        const res = await api.post<Booking>(`${BASE}/bookings`, data);
        return res.data;
    },
    updateBookingStatus: async (id: number, status: string) => {
        const res = await api.put<Booking>(`${BASE}/bookings/${id}/status`, { status });
        return res.data;
    },
    updateBooking: async (id: number, data: Partial<Booking>) => {
        const res = await api.put<Booking>(`${BASE}/bookings/${id}`, data);
        return res.data;
    },
    deleteBooking: async (id: number) => {
        const res = await api.delete(`${BASE}/bookings/${id}`);
        return res.data;
    },

    // ── CONTRACT TEMPLATES ────────────────────
    getContractTemplates: async () => {
        const res = await api.get<ContractTemplate[]>(`${BASE}/contract-templates`);
        return res.data;
    },
    getTemplateByType: async (spaceType: string) => {
        const res = await api.get<ContractTemplate | null>(`${BASE}/contract-templates/by-type/${spaceType}`);
        return res.data;
    },
    createContractTemplate: async (data: Partial<ContractTemplate>) => {
        const res = await api.post<ContractTemplate>(`${BASE}/contract-templates`, data);
        return res.data;
    },
    updateContractTemplate: async (id: number, data: Partial<ContractTemplate>) => {
        const res = await api.put<ContractTemplate>(`${BASE}/contract-templates/${id}`, data);
        return res.data;
    },
    deleteContractTemplate: async (id: number) => {
        await api.delete(`${BASE}/contract-templates/${id}`);
    },

    // ── CATALOGS (Space Categories & Room Types) ──────────────
    getSpaceCategories: async (branchId?: number) => {
        const res = await api.get<SpaceCategory[]>(`${BASE}/space-categories`, { params: { branch_id: branchId } });
        return res.data;
    },
    createSpaceCategory: async (data: Partial<SpaceCategory>) => {
        const res = await api.post<SpaceCategory>(`${BASE}/space-categories`, data);
        return res.data;
    },
    updateSpaceCategory: async (id: number, data: Partial<SpaceCategory>) => {
        const res = await api.put<SpaceCategory>(`${BASE}/space-categories/${id}`, data);
        return res.data;
    },
    deleteSpaceCategory: async (id: number) => {
        await api.delete(`${BASE}/space-categories/${id}`);
    },

    getRoomTypes: async (branchId?: number) => {
        const res = await api.get<RoomType[]>(`${BASE}/room-types`, { params: { branch_id: branchId } });
        return res.data;
    },
    createRoomType: async (data: Partial<RoomType>) => {
        const res = await api.post<RoomType>(`${BASE}/room-types`, data);
        return res.data;
    },
    updateRoomType: async (id: number, data: Partial<RoomType>) => {
        const res = await api.put<RoomType>(`${BASE}/room-types/${id}`, data);
        return res.data;
    },
    deleteRoomType: async (id: number) => {
        await api.delete(`${BASE}/room-types/${id}`);
    },
    
    // ── AMENITY TEMPLATES ─────────────────────
    getAmenityTemplates: async (branchId?: number) => {
        const res = await api.get<AmenityTemplate[]>(`${BASE}/amenity-templates`, { params: { branch_id: branchId } });
        return res.data;
    },
    createAmenityTemplate: async (data: Partial<AmenityTemplate>) => {
        const res = await api.post<AmenityTemplate>(`${BASE}/amenity-templates`, data);
        return res.data;
    },
    updateAmenityTemplate: async (id: number, data: Partial<AmenityTemplate>) => {
        const res = await api.put<AmenityTemplate>(`${BASE}/amenity-templates/${id}`, data);
        return res.data;
    },
    deleteAmenityTemplate: async (id: number) => {
        await api.delete(`${BASE}/amenity-templates/${id}`);
    },
};
