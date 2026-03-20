import { useState, useEffect, useCallback } from 'react';
import { FileText, Plus, Search, Trash2, Edit3, CheckCircle, ShoppingCart, Printer, ChevronDown, X, Package, DoorOpen, Building2 } from 'lucide-react';
import { useQuotesStore } from '../hooks/useQuotesStore';
import { useCRMStore } from '../hooks/useCRMStore';
import type { Quote, QuoteItemCreate, QuoteStatus } from '../types';
import { financialService } from '../../financial/services/financial.service';
import api from '../../../services/api';
import html2pdf from 'html2pdf.js';

import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { useConfigurationStore } from '../../configuration/hooks/useConfigurationStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CatalogItem {
    id: number;
    name: string;
    price: number;
    type: 'product' | 'room' | 'office';
    extra?: string;
}

const TAX_RATE = 0.16;

// ─── Status Config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<QuoteStatus, { label: string; bg: string; text: string; dot: string }> = {
    draft: { label: 'Borrador', bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
    sent: { label: 'Enviado', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
    approved: { label: 'Aprobado', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    rejected: { label: 'Rechazado', bg: 'bg-red-100', text: 'text-red-600', dot: 'bg-red-500' },
    converted: { label: 'Convertido', bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
};
const STATUS_ORDER: QuoteStatus[] = ['draft', 'sent', 'approved', 'rejected', 'converted'];

const fmt = (v: number) => `$${v.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`;

// ─── Quote Detail / Print View ─────────────────────────────────────────────────

const QuoteDetailView: React.FC<{ quote: Quote; onClose: () => void }> = ({ quote, onClose }) => {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownloadPdf = async () => {
        setIsDownloading(true);
        try {
            const element = document.getElementById('quote-doc');
            if (!element) return;
            const opt = {
                margin: 0.5,
                filename: `Presupuesto_${String(quote.id).padStart(5, '0')}.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
            };
            await html2pdf().set(opt).from(element).save();
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto print:bg-white print:p-0 print:inset-auto print:fixed-none">
            {/* Print button bar - hidden when printing */}
            <div className="no-print w-full max-w-3xl mb-3 flex justify-between items-center">
                <span className="text-white text-sm font-medium">Vista Previa del Presupuesto</span>
                <div className="flex gap-2">
                    <button
                        onClick={handleDownloadPdf}
                        disabled={isDownloading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {isDownloading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Printer size={15} />
                        )}
                        {isDownloading ? 'Generando PDF...' : 'Descargar PDF'}
                    </button>
                    <button onClick={onClose} className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg transition-colors">
                        <X size={15} />
                    </button>
                </div>
            </div>

            {/* Printable Document */}
            <div id="quote-doc" className="bg-white w-full max-w-3xl rounded-xl shadow-2xl print:shadow-none print:rounded-none p-10 print:p-8">
                {/* Header */}
                <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-slate-800">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
                                <img src="/src/assets/nest-logo.png" alt="Logo" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-2xl font-bold text-slate-800">Nest Coworking</span>
                        </div>
                        <p className="text-gray-500 text-sm">Sistema de Gestión Coworking</p>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-bold text-slate-800">PRESUPUESTO</p>
                        <p className="text-gray-500 font-mono text-sm mt-1">#{String(quote.id).padStart(5, '0')}</p>
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${STATUS_CONFIG[quote.status].bg} ${STATUS_CONFIG[quote.status].text}`}>
                            {STATUS_CONFIG[quote.status].label}
                        </span>
                    </div>
                </div>

                {/* Meta info */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Para:</p>
                        <p className="font-bold text-gray-800 text-lg">{quote.client?.name || quote.lead?.name || 'N/A'}</p>
                        {(quote.client?.ci_rif || quote.lead?.ci_rif) &&
                            <p className="text-gray-500 text-sm font-mono">CI/RIF: {quote.client?.ci_rif || quote.lead?.ci_rif}</p>}
                        {(quote.client?.email || quote.lead?.email) &&
                            <p className="text-gray-500 text-sm">{quote.client?.email || quote.lead?.email}</p>}
                        {quote.lead?.company && <p className="text-gray-500 text-sm">{quote.lead.company}</p>}
                    </div>
                    <div className="text-right space-y-1">
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-semibold">Fecha de Emisión</p>
                            <p className="text-gray-700">{new Date(quote.created_at).toLocaleDateString('es-VE')}</p>
                        </div>
                        {quote.expires_at && (
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-semibold">Válido hasta</p>
                                <p className="text-gray-700">{new Date(quote.expires_at).toLocaleDateString('es-VE')}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-gray-800 mb-6 bg-gray-50 rounded-lg px-4 py-3 border-l-4 border-blue-600">
                    {quote.title}
                </h2>

                {/* Items Table */}
                <table className="w-full mb-6 text-sm">
                    <thead>
                        <tr className="bg-slate-800 text-white">
                            <th className="text-left px-4 py-3 rounded-tl-lg">Descripción</th>
                            <th className="text-center px-4 py-3">Cant.</th>
                            <th className="text-right px-4 py-3">P. Unit.</th>
                            <th className="text-right px-4 py-3">Desc.</th>
                            <th className="text-right px-4 py-3 rounded-tr-lg">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {quote.items.map((item, i) => (
                            <tr key={item.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-4 py-3 text-gray-700 font-medium">{item.description}</td>
                                <td className="px-4 py-3 text-center text-gray-600">{item.quantity}</td>
                                <td className="px-4 py-3 text-right text-gray-600 font-mono">{fmt(item.unit_price)}</td>
                                <td className="px-4 py-3 text-right text-gray-500 font-mono">{item.discount > 0 ? `-${fmt(item.discount)}` : '—'}</td>
                                <td className="px-4 py-3 text-right text-gray-800 font-semibold font-mono">{fmt(item.subtotal)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-8">
                    <div className="w-72 space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Subtotal</span>
                            <span className="font-mono">{fmt(quote.subtotal)}</span>
                        </div>
                        {quote.discount > 0 && (
                            <div className="flex justify-between text-sm text-red-500">
                                <span>Descuento</span>
                                <span className="font-mono">-{fmt(quote.discount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>IVA (16%)</span>
                            <span className="font-mono">{fmt(quote.tax)}</span>
                        </div>
                        <div className="flex justify-between text-base font-bold text-slate-800 border-t-2 border-slate-800 pt-2">
                            <span>TOTAL</span>
                            <span className="font-mono text-blue-700">{fmt(quote.total)}</span>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {quote.notes && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                        <p className="text-xs text-amber-600 font-semibold uppercase mb-1">Observaciones</p>
                        <p className="text-gray-700 text-sm">{quote.notes}</p>
                    </div>
                )}

                {/* Footer */}
                <div className="border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
                    <p>Este presupuesto es válido únicamente durante el período indicado.</p>
                    <p className="mt-1">Nest Coworking · Sistema de Gestión de Coworking</p>
                </div>
            </div>

            {/* Global print styles */}
            <style>{`
                @media print {
                    body > * { display: none !important; }
                    .fixed.inset-0 { display: block !important; position: static !important; background: white !important; padding: 0 !important; }
                    .no-print { display: none !important; }
                    #quote-doc { box-shadow: none !important; border-radius: 0 !important; max-width: 100% !important; }
                }
            `}</style>
        </div>
    );
};

// ─── Quote Form Modal ─────────────────────────────────────────────────────────

const QuoteFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    editingQuote?: Quote | null;
}> = ({ isOpen, onClose, editingQuote }) => {
    const { createQuote, updateQuote, isLoading } = useQuotesStore();
    const { opportunities } = useCRMStore();
    const { selectedBranchId } = useAuthStore();
    const { branches } = useConfigurationStore();

    const [branchId, setBranchId] = useState<number>(0);
    const [title, setTitle] = useState('');
    const [leadId, setLeadId] = useState<number | null>(null);
    const [notes, setNotes] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [items, setItems] = useState<QuoteItemCreate[]>([]);
    const [catalog, setCatalog] = useState<CatalogItem[]>([]);
    const [catalogSearch, setCatalogSearch] = useState('');
    const [showCatalog, setShowCatalog] = useState(false);
    const [headerDiscount, setHeaderDiscount] = useState(0);

    // Load catalog (products + rooms + offices)
    useEffect(() => {
        if (!isOpen) return;
        Promise.all([
            financialService.getProducts(branchId || undefined),
            api.get('/operative/rooms', { params: { branch_id: branchId || undefined } }),
            api.get('/operative/offices', { params: { branch_id: branchId || undefined } }),
        ]).then(([products, roomsRes, officesRes]) => {
            const pItems: CatalogItem[] = (products || []).map((p: any) => ({ id: p.id, name: p.name, price: p.price, type: 'product', extra: p.type }));
            const rItems: CatalogItem[] = (roomsRes.data || []).map((r: any) => ({ id: r.id, name: r.name, price: r.hourly_rate, type: 'room', extra: `Capacidad: ${r.capacity}` }));
            const oItems: CatalogItem[] = (officesRes.data || []).map((o: any) => ({ id: o.id, name: o.name, price: o.monthly_rate, type: 'office', extra: `Capacidad: ${o.capacity}` }));
            setCatalog([...pItems, ...rItems, ...oItems]);
        }).catch(() => setCatalog([]));
    }, [isOpen, branchId]);

    // Populate form when editing
    useEffect(() => {
        if (editingQuote) {
            setTitle(editingQuote.title);
            setLeadId(editingQuote.lead_id || null);
            setNotes(editingQuote.notes || '');
            setExpiresAt(editingQuote.expires_at ? editingQuote.expires_at.slice(0, 10) : '');
            setHeaderDiscount(editingQuote.discount);
            setBranchId(editingQuote.branch_id);
            setItems(editingQuote.items.map(i => ({
                item_type: i.item_type,
                item_id: i.item_id,
                description: i.description,
                quantity: i.quantity,
                unit_price: i.unit_price,
                discount: i.discount,
                subtotal: i.subtotal,
            })));
        } else {
            setBranchId(selectedBranchId || (branches.length > 0 ? branches[0].id : 0));
            setTitle(''); setLeadId(null); setNotes(''); setExpiresAt('');
            setHeaderDiscount(0); setItems([]);
        }
    }, [editingQuote, isOpen, selectedBranchId, branches]);

    const addCatalogItem = useCallback((ci: CatalogItem) => {
        const newItem: QuoteItemCreate = {
            item_type: ci.type,
            item_id: ci.id,
            description: ci.name,
            quantity: 1,
            unit_price: ci.price,
            discount: 0,
            subtotal: ci.price,
        };
        setItems(prev => [...prev, newItem]);
        setShowCatalog(false);
        setCatalogSearch('');
    }, []);

    const addCustomItem = () => {
        setItems(prev => [...prev, { item_type: 'custom', item_id: null, description: '', quantity: 1, unit_price: 0, discount: 0, subtotal: 0 }]);
    };

    const updateItem = (idx: number, field: keyof QuoteItemCreate, value: any) => {
        setItems(prev => prev.map((item, i) => {
            if (i !== idx) return item;
            const updated = { ...item, [field]: value };
            updated.subtotal = Math.max(0, updated.quantity * updated.unit_price - updated.discount);
            return updated;
        }));
    };

    const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

    // Computed totals
    const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
    const discountTotal = items.reduce((s, i) => s + i.discount, 0) + headerDiscount;
    const taxable = subtotal - discountTotal;
    const tax = taxable * TAX_RATE;
    const total = taxable + tax;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || items.length === 0) return;
        const payload = {
            branch_id: branchId || selectedBranchId || 0,
            title: title.trim(),
            lead_id: leadId,
            notes: notes.trim() || null,
            expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
            discount: headerDiscount,
            items,
        };
        const result = editingQuote
            ? await updateQuote(editingQuote.id, { title: payload.title, lead_id: payload.lead_id, notes: payload.notes, expires_at: payload.expires_at, discount: payload.discount, items: payload.items })
            : await createQuote(payload);
        if (result) onClose();
    };

    const filteredCatalog = catalog.filter(c => c.name.toLowerCase().includes(catalogSearch.toLowerCase()));
    const uniqueLeads = [...new Map(opportunities.map(o => [o.lead.id, o.lead])).values()];

    if (!isOpen) return null;

    const typeIcon = (t: string) => t === 'product' ? <Package size={12} /> : t === 'room' ? <DoorOpen size={12} /> : <Building2 size={12} />;
    const typeColor = (t: string) => t === 'product' ? 'bg-blue-100 text-blue-600' : t === 'room' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600';

    return (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-start justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-4">
                {/* Modal Header */}
                <div className="bg-slate-800 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <FileText size={20} />
                        <span className="font-bold text-lg">{editingQuote ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}</span>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-gray-100">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Sede Responsable *</label>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {branches.map(b => (
                                    <button
                                        key={b.id}
                                        type="button"
                                        onClick={() => setBranchId(b.id)}
                                        className={`flex-1 min-w-[120px] px-3 py-2 rounded-xl border text-sm font-medium transition-all ${branchId === b.id
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100 ring-2 ring-blue-100'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600'
                                            }`}
                                    >
                                        {b.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Título del Presupuesto *</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Ej: Membresía Coworker Full - Enero 2026"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Lead Asociado</label>
                            <select
                                value={leadId ?? ''}
                                onChange={e => setLeadId(e.target.value ? Number(e.target.value) : null)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="">Sin lead asociado</option>
                                {uniqueLeads.map(l => (
                                    <option key={l.id} value={l.id}>{l.name}{l.company ? ` — ${l.company}` : ''}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Válido hasta</label>
                            <input
                                type="date"
                                value={expiresAt}
                                onChange={e => setExpiresAt(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Notas / Condiciones</label>
                            <input
                                type="text"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Condiciones de pago, observaciones..."
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Items section */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-xs font-semibold text-gray-500 uppercase">Líneas del Presupuesto *</label>
                            <div className="flex gap-2">
                                <button type="button" onClick={addCustomItem} className="text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg px-3 py-1.5 flex items-center gap-1 transition-colors hover:bg-gray-50">
                                    <Plus size={12} /> Línea Manual
                                </button>
                                <div className="relative">
                                    <button type="button" onClick={() => setShowCatalog(s => !s)} className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1.5 flex items-center gap-1 transition-colors">
                                        <Plus size={12} /> Del Catálogo
                                        <ChevronDown size={12} />
                                    </button>
                                    {showCatalog && (
                                        <div className="absolute right-0 top-9 bg-white rounded-xl shadow-2xl border border-gray-200 w-80 z-50 max-h-80 flex flex-col">
                                            <div className="p-2 border-b">
                                                <div className="relative">
                                                    <Search size={13} className="absolute left-2.5 top-2 text-gray-400" />
                                                    <input autoFocus value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)}
                                                        placeholder="Buscar en catálogo..." className="pl-8 pr-3 py-1.5 text-xs w-full border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-400" />
                                                </div>
                                            </div>
                                            <div className="overflow-y-auto flex-1">
                                                {filteredCatalog.length === 0 ? (
                                                    <p className="text-xs text-gray-400 text-center py-4">Sin resultados</p>
                                                ) : filteredCatalog.map((ci, i) => (
                                                    <button key={i} type="button" onClick={() => addCatalogItem(ci)}
                                                        className="w-full text-left px-3 py-2.5 hover:bg-blue-50 flex items-center justify-between group transition-colors border-b border-gray-50">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium shrink-0 ${typeColor(ci.type)}`}>
                                                                {typeIcon(ci.type)} {ci.type === 'product' ? 'Prod.' : ci.type === 'room' ? 'Sala' : 'Oficina'}
                                                            </span>
                                                            <span className="text-sm text-gray-700 truncate font-medium">{ci.name}</span>
                                                        </div>
                                                        <span className="text-xs text-emerald-600 font-mono shrink-0 ml-2">{fmt(ci.price)}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Items List */}
                        {items.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                                <FileText size={28} className="mx-auto mb-2 text-gray-300" />
                                <p className="text-sm">Agrega productos o espacios del catálogo</p>
                            </div>
                        ) : (
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                        <tr>
                                            <th className="text-left px-3 py-2">Descripción</th>
                                            <th className="text-center px-3 py-2 w-16">Cant.</th>
                                            <th className="text-right px-3 py-2 w-28">P. Unit.</th>
                                            <th className="text-right px-3 py-2 w-24">Desc.</th>
                                            <th className="text-right px-3 py-2 w-28">Subtotal</th>
                                            <th className="w-8 px-2 py-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {items.map((item, idx) => (
                                            <tr key={idx} className="group">
                                                <td className="px-2 py-1.5">
                                                    <input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)}
                                                        placeholder="Descripción..." className="w-full text-sm border-0 focus:ring-1 focus:ring-blue-400 rounded px-2 py-1 outline-none" />
                                                </td>
                                                <td className="px-2 py-1.5">
                                                    <input type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                                                        className="w-full text-center text-sm border border-gray-200 rounded px-1 py-1 focus:ring-1 focus:ring-blue-400 outline-none" />
                                                </td>
                                                <td className="px-2 py-1.5">
                                                    <input type="number" min="0" step="0.01" value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', Number(e.target.value))}
                                                        className="w-full text-right text-sm border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-blue-400 outline-none font-mono" />
                                                </td>
                                                <td className="px-2 py-1.5">
                                                    <input type="number" min="0" step="0.01" value={item.discount} onChange={e => updateItem(idx, 'discount', Number(e.target.value))}
                                                        className="w-full text-right text-sm border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-blue-400 outline-none font-mono" />
                                                </td>
                                                <td className="px-3 py-1.5 text-right font-semibold font-mono text-gray-700">{fmt(item.subtotal)}</td>
                                                <td className="px-2 py-1.5">
                                                    <button type="button" onClick={() => removeItem(idx)} className="text-gray-300 hover:text-red-500 transition-colors">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Totals Preview */}
                        {items.length > 0 && (
                            <div className="flex justify-end mt-4">
                                <div className="bg-gray-50 rounded-xl p-4 w-64 space-y-1 text-sm">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal</span><span className="font-mono">{fmt(subtotal)}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-gray-600">Desc. adicional</span>
                                        <input type="number" min="0" step="0.01" value={headerDiscount}
                                            onChange={e => setHeaderDiscount(Number(e.target.value))}
                                            className="w-24 text-right text-sm border border-gray-200 rounded px-2 py-0.5 font-mono outline-none focus:ring-1 focus:ring-blue-400" />
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>IVA (16%)</span><span className="font-mono">{fmt(tax)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-base text-slate-800 border-t border-gray-200 pt-2">
                                        <span>TOTAL</span><span className="font-mono text-blue-700">{fmt(total)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm text-gray-600 hover:text-gray-800 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isLoading || !title || items.length === 0}
                            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={15} />}
                            {editingQuote ? 'Guardar Cambios' : 'Crear Presupuesto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── Convert to Order Modal ────────────────────────────────────────────────────

const ConvertModal: React.FC<{ quote: Quote; onClose: () => void }> = ({ quote, onClose }) => {
    const { convertToOrder, isLoading } = useQuotesStore();
    const [clientId, setClientId] = useState<number | null>(quote.client_id || null);
    const [clients, setClients] = useState<any[]>([]);

    useEffect(() => {
        api.get('/operative/clients').then(r => setClients(r.data || [])).catch(() => { });
    }, []);

    const handleConvert = async () => {
        const ok = await convertToOrder(quote.id, clientId);
        if (ok) onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                        <ShoppingCart size={18} className="text-purple-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">Convertir a Orden</h3>
                        <p className="text-sm text-gray-500">{quote.title}</p>
                    </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5 text-sm text-amber-700">
                    Esta acción creará una <strong>Orden de Venta</strong> con los mismos ítems del presupuesto y lo marcará como <em>Convertido</em>.
                    {!clientId && quote.lead && (
                        <p className="mt-2 text-xs font-semibold">✨ Se creará un nuevo cliente basado en los datos del prospecto.</p>
                    )}
                </div>

                <div className="mb-5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Asignar a Cliente</label>
                    <select value={clientId ?? ''} onChange={e => setClientId(e.target.value ? Number(e.target.value) : null)}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none">
                        <option value="">Crear nuevo cliente automáticamente</option>
                        {clients.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.name}{c.email ? ` — ${c.email}` : ''}</option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1.5">Déjalo en blanco para aprovechar los datos del lead actual.</p>
                </div>

                <div className="flex gap-3 justify-end">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        Cancelar
                    </button>
                    <button onClick={handleConvert} disabled={(!clientId && !quote.lead) || isLoading}
                        className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ShoppingCart size={14} />}
                        Crear Orden
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

export const PresupuestosPage: React.FC = () => {
    const { quotes, fetchQuotes, deleteQuote, updateQuote, isLoading, lastConvertedOrderId, clearConvertedOrder } = useQuotesStore();
    const { fetchKanbanData } = useCRMStore();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
    const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);
    const [convertingQuote, setConvertingQuote] = useState<Quote | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        fetchQuotes(0); // Pass 0 for global visibility across all branches
        fetchKanbanData(0);
    }, [fetchQuotes, fetchKanbanData]);

    // Dismiss conversion success after 5s
    useEffect(() => {
        if (lastConvertedOrderId) {
            const t = setTimeout(() => clearConvertedOrder(), 5000);
            return () => clearTimeout(t);
        }
    }, [lastConvertedOrderId, clearConvertedOrder]);

    const filtered = quotes.filter(q => {
        const matchSearch = !search || q.title.toLowerCase().includes(search.toLowerCase()) ||
            (q.lead?.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (q.client?.name || '').toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || q.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const handleEdit = (q: Quote) => { setEditingQuote(q); setIsFormOpen(true); };
    const handleNewClose = () => { setIsFormOpen(false); setEditingQuote(null); };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Success Toast */}
            {lastConvertedOrderId && (
                <div className="fixed bottom-6 right-6 z-50 bg-purple-700 text-white rounded-xl shadow-2xl p-4 flex items-center gap-3 border border-purple-600 animate-in slide-in-from-bottom-4">
                    <CheckCircle size={18} className="text-purple-300" />
                    <div>
                        <p className="font-bold text-sm">¡Presupuesto convertido!</p>
                        <p className="text-purple-200 text-xs mt-0.5">Orden #{lastConvertedOrderId} creada en Ventas.</p>
                    </div>
                    <button onClick={clearConvertedOrder} className="ml-2 text-purple-300 hover:text-white"><X size={14} /></button>
                </div>
            )}

            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText size={22} className="text-purple-600" />
                        Presupuestos
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Crea y gestiona cotizaciones con el catálogo de productos y espacios.</p>
                </div>
                <button onClick={() => { setEditingQuote(null); setIsFormOpen(true); }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors">
                    <Plus size={16} /> Nuevo Presupuesto
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white border-b border-gray-100 px-6 py-3 flex flex-wrap gap-3 items-center shrink-0">
                <div className="relative flex-1 min-w-48 max-w-sm">
                    <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por título o cliente..."
                        className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-purple-400 outline-none" />
                </div>
                <div className="flex gap-1.5">
                    {['all', ...STATUS_ORDER].map(s => (
                        <button key={s} onClick={() => setStatusFilter(s)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${statusFilter === s
                                ? 'bg-purple-600 text-white border-purple-600'
                                : 'text-gray-600 border-gray-200 hover:border-purple-400 hover:text-purple-600 bg-white'}`}>
                            {s === 'all' ? 'Todos' : STATUS_CONFIG[s as QuoteStatus]?.label || s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto p-6">
                {isLoading && quotes.length === 0 ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                        <FileText size={40} className="mb-3 text-gray-300" />
                        <p className="font-medium">No hay presupuestos</p>
                        <p className="text-sm mt-1">Crea el primer presupuesto con el botón de arriba.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Título</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Lead / Cliente</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Vence</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map(q => {
                                    const sc = STATUS_CONFIG[q.status] || STATUS_CONFIG.draft;
                                    const isExpired = q.expires_at && new Date(q.expires_at) < new Date() && q.status !== 'converted';
                                    return (
                                        <tr key={q.id} className="hover:bg-purple-50/30 transition-colors">
                                            <td className="px-4 py-3 text-gray-400 font-mono text-xs">#{String(q.id).padStart(4, '0')}</td>
                                            <td className="px-4 py-3">
                                                <button onClick={() => setViewingQuote(q)} className="text-left group">
                                                    <p className="font-semibold text-gray-800 group-hover:text-purple-600 transition-colors">{q.title}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">{q.items.length} ítem{q.items.length !== 1 ? 's' : ''}</p>
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 hidden md:table-cell text-gray-600">
                                                {q.client?.name || q.lead?.name || <span className="text-gray-300">—</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <select value={q.status}
                                                        onChange={e => {
                                                            const newStatus = e.target.value as QuoteStatus;
                                                            if (newStatus === 'converted') {
                                                                setConvertingQuote(q);
                                                            } else {
                                                                updateQuote(q.id, { status: newStatus });
                                                            }
                                                        }}
                                                        disabled={q.status === 'converted'}
                                                        className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer disabled:cursor-default focus:ring-1 focus:ring-purple-400 outline-none ${sc.bg} ${sc.text}`}>
                                                        {STATUS_ORDER.map(s => (
                                                            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                                                        ))}
                                                    </select>
                                                    {isExpired && <span className="text-xs text-red-500 font-medium">Vencido</span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-semibold text-gray-800">{fmt(q.total)}</td>
                                            <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                                                {q.expires_at ? new Date(q.expires_at).toLocaleDateString('es-VE') : <span className="text-gray-300">—</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button onClick={() => setViewingQuote(q)} title="Ver / Imprimir"
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                        <Printer size={15} />
                                                    </button>
                                                    {q.status !== 'converted' && (
                                                        <button onClick={() => handleEdit(q)} title="Editar"
                                                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                                                            <Edit3 size={15} />
                                                        </button>
                                                    )}
                                                    {q.status === 'approved' && (
                                                        <button onClick={() => setConvertingQuote(q)} title="Convertir a Orden"
                                                            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                                                            <ShoppingCart size={15} />
                                                        </button>
                                                    )}
                                                    {q.status !== 'converted' && (
                                                        <button onClick={() => { if (confirm('¿Eliminar este presupuesto?')) deleteQuote(q.id); }} title="Eliminar"
                                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                            <Trash2 size={15} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modals */}
            <QuoteFormModal isOpen={isFormOpen} onClose={handleNewClose} editingQuote={editingQuote} />
            {viewingQuote && <QuoteDetailView quote={viewingQuote} onClose={() => setViewingQuote(null)} />}
            {convertingQuote && <ConvertModal quote={convertingQuote} onClose={() => setConvertingQuote(null)} />}
        </div>
    );
};
