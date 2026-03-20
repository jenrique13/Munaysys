// ── OPERATIVE MODULE TYPES ─────────────────────────────────

export interface Client {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    branch_id?: number;
    lead_id?: number;
    ci_rif?: string;
    status: string; // active | inactive | suspended
    notes?: string;
    created_at: string;
    active_membership_name?: string;
    has_active_membership: boolean;
}

export interface Office {
    id: number;
    name: string;
    branch_id: number;
    category: string; // privada | suite | loft
    capacity: number;
    monthly_rate: number;
    status: string; // disponible | ocupado | mantenimiento
    is_active: boolean;
    amenities_json: string[];
    description?: string;
}

export interface Room {
    id: number;
    name: string;
    branch_id: number;
    type: string; // sala_reuniones | auditorio | hot_desk
    capacity: number;
    hourly_rate: number;
    status: string; // disponible | ocupado | mantenimiento
    is_active: boolean;
    amenities_json: string[];
    description?: string;
}

export interface Membership {
    id: number;
    client_id: number;
    office_id?: number;
    plan_name: string;
    start_date: string;
    end_date?: string;
    hours_included: number;
    hours_used: number;
    price: number;
    status: string; // active | expired | cancelled
    created_at: string;
}

export interface Amenity {
    id: number;
    name: string;
    branch_id: number;
    space_id?: number;
    space_type?: 'office' | 'room';
    client_id?: number;
    quantity: number;
    available: boolean;
    unit: string;
    price: number;
    category?: string;
    description?: string;
    is_recurring: boolean;
    monthly_quota: number;
}

export interface AmenityHistory {
    id: number;
    amenity_id: number;
    client_id: number;
    old_quantity: number;
    new_quantity: number;
    change: number;
    reason?: string;
    created_at: string;
}

export interface Booking {
    id: number;
    room_id: number;
    client_id: number;
    start_time: string;
    end_time: string;
    status: string; // confirmed | cancelled | pending
    total_hours: number;
    total_cost: number;
    notes?: string;
    created_at: string;
    room: Room;
    client: Client;
}

export interface ContractTemplate {
    id: number;
    name: string;
    space_type: string; // privada | suite | loft | sala_reuniones | general
    body_html: string;
    branch_id?: number;
    is_active: boolean;
    created_at: string;
}
