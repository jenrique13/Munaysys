// CRM-specific types for Quotes (Presupuestos)

export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'converted';

export interface QuoteItem {
    id: number;
    quote_id: number;
    item_type: 'product' | 'room' | 'office' | 'custom' | 'service';
    item_id?: number | null;
    description: string;
    quantity: number;
    unit_price: number;
    discount: number;
    subtotal: number;
    start_time?: string | null;
    end_time?: string | null;
    service_id?: number | null;
}

export interface QuoteItemCreate {
    item_type: string;
    item_id?: number | null;
    description: string;
    quantity: number;
    unit_price: number;
    discount: number;
    subtotal: number;
    start_time?: string | null;
    end_time?: string | null;
    service_id?: number | null;
}

export interface QuoteLead {
    id: number;
    name: string;
    email?: string | null;
    company?: string | null;
    ci_rif?: string | null;
    phone?: string | null;
}

export interface QuoteClient {
    id: number;
    name: string;
    email?: string | null;
    ci_rif?: string | null;
    phone?: string | null;
}

export interface Quote {
    id: number;
    branch_id: number;
    title: string;
    status: QuoteStatus;
    lead_id?: number | null;
    client_id?: number | null;
    notes?: string | null;
    expires_at?: string | null;
    subtotal: number;
    discount: number;
    discount_type: 'amount' | 'percentage';
    tax: number;
    total: number;
    apply_tax: boolean;
    converted_order_id?: number | null;
    created_at: string;
    items: QuoteItem[];
    lead?: QuoteLead | null;
    client?: QuoteClient | null;
}

export interface QuoteCreate {
    branch_id: number;
    title: string;
    lead_id?: number | null;
    client_id?: number | null;
    notes?: string | null;
    expires_at?: string | null;
    discount: number;
    discount_type: 'amount' | 'percentage';
    apply_tax: boolean;
    items: QuoteItemCreate[];
}

export interface QuoteUpdate {
    title?: string;
    status?: QuoteStatus;
    lead_id?: number | null;
    client_id?: number | null;
    notes?: string | null;
    expires_at?: string | null;
    discount?: number;
    discount_type?: 'amount' | 'percentage';
    apply_tax?: boolean;
    items?: QuoteItemCreate[];
}
