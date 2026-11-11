export interface Role {
    id: number;
    name: string;
    permissions_json: any;
}

export interface RoleCreate {
    name: string;
    permissions_json?: any;
}

export interface RoleUpdate {
    name?: string;
    permissions_json?: any;
}

export interface User {
    id: number;
    email: string;
    is_active: boolean;
    is_superuser: boolean;
    role_id?: number;
    branch_id?: number;
    access_permissions: Record<string, any>;
    created_at: string;
    updated_at: string;
    role?: Role;
    branch?: Branch;
}

export interface UserConfigUpdate {
    is_active?: boolean;
    access_permissions?: Record<string, any>;
    password?: string;
    role_id?: number;
    branch_id?: number;
}

export interface Branch {
    id: number;
    name: string;
    address?: string;
    color?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface BranchCreate {
    name: string;
    address?: string;
    color?: string;
}

export interface BranchUpdate {
    name?: string;
    address?: string;
    color?: string;
    is_active?: boolean;
}
