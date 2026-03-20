export interface User {
    id: number;
    email: string;
    role_id: number | null;
    branch_id: number | null;
    status: string;
}

export interface PipelineStage {
    id: number;
    name: string;
    order_index: number;
    color: string;
    probability: number;
    branch_id: number;
}

export interface Lead {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    source: string | null;
    ci_rif: string | null;
    status: string;
    score: number;
    created_at: string;
    branch_id: number;
    assigned_user_id: number | null;
}

export interface Opportunity {
    id: number;
    lead_id: number;
    stage_id: number;
    estimated_value: number;
    probability: number;
    expected_close_date: string | null;
    lead: Lead;
}
