import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { useOperativeStore } from '../hooks/useOperativeStore';
import type { Office } from '../types';
import { Building, Plus, X, CheckCircle, XCircle } from 'lucide-react';

const CATEGORIES = ['privada', 'suite', 'loft'];

const CAT_STYLES: Record<string, { bg: string; badge: string; label: string }> = {
    privada: { bg: 'from-indigo-50 to-indigo-100/50', badge: 'bg-indigo-100 text-indigo-700', label: 'Oficina Privada' },
    suite: { bg: 'from-violet-50 to-violet-100/50', badge: 'bg-violet-100 text-violet-700', label: 'Suite Ejecutiva' },
    loft: { bg: 'from-amber-50 to-amber-100/50', badge: 'bg-amber-100 text-amber-700', label: 'Loft' },
};

// ── New Office Modal ──────────────────────────────────────────────────────────
const NewOfficeModal: React.FC<{ onClose: () => void; currentBranchId: number }> = ({ onClose, currentBranchId }) => {
    const { createOffice, isLoading } = useOperativeStore();
    const [form, setForm] = useState<Partial<Office>>({
        name: '', branch_id: currentBranchId, category: 'privada', capacity: 1, monthly_rate: 0, is_active: true, description: '', amenities_json: [],
    });
    const [tag, setTag] = useState('');

    const addTag = () => {
        if (tag.trim()) {
            setForm(p => ({ ...p, amenities_json: [...(p.amenities_json ?? []), tag.trim()] }));
            setTag('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const ok = await createOffice(form);
        if (ok) onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg z-10 overflow-y-auto max-h-[90vh]">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 sticky top-0">
                    <h2 className="font-bold text-gray-800 text-lg">Nueva Oficina</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                        <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej: Oficina 101" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad</label>
                            <input type="number" min={1} value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: +e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tarifa/mes ($)</label>
                            <input type="number" min={0} step="0.01" value={form.monthly_rate} onChange={e => setForm(p => ({ ...p, monthly_rate: +e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                        <input value={form.description ?? ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amenidades</label>
                        <div className="flex gap-2 mb-2">
                            <input value={tag} onChange={e => setTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Wifi, Aire Acond., Proyector..." />
                            <button type="button" onClick={addTag} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm">Agregar</button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {(form.amenities_json ?? []).map((a, i) => (
                                <span key={i} className="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                    {a as string}
                                    <button type="button" onClick={() => setForm(p => ({ ...p, amenities_json: (p.amenities_json ?? []).filter((_, j) => j !== i) }))} className="hover:text-red-500"><X size={10} /></button>
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button disabled={isLoading} className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60">
                            {isLoading ? 'Guardando...' : 'Guardar Oficina'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Office Card ───────────────────────────────────────────────────────────────
const OfficeCard: React.FC<{ office: Office }> = ({ office }) => {
    const style = CAT_STYLES[office.category] ?? CAT_STYLES.privada;
    return (
        <div className={`bg-gradient-to-br ${style.bg} rounded-xl border border-white shadow-sm p-5 flex flex-col gap-3`}>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-gray-800 text-base">{office.name}</h3>
                    {office.description && <p className="text-xs text-gray-500 mt-0.5">{office.description}</p>}
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${style.badge}`}>{style.label}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
                <span><strong>{office.capacity}</strong> personas</span>
                <span className="text-green-700 font-semibold">${office.monthly_rate.toLocaleString('es-CL')}/mes</span>
                <span className="flex items-center gap-1">
                    {office.status === 'disponible' && <><CheckCircle size={14} className="text-emerald-500" /> Disponible</>}
                    {office.status === 'ocupado' && <><XCircle size={14} className="text-red-400" /> Ocupada</>}
                    {office.status === 'mantenimiento' && <><XCircle size={14} className="text-yellow-400" /> Mantenimiento</>}
                </span>
            </div>
            {(office.amenities_json ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {(office.amenities_json as string[]).map((a, i) => (
                        <span key={i} className="bg-white/80 text-gray-600 text-xs px-2 py-0.5 rounded-full border border-gray-200">{a}</span>
                    ))}
                </div>
            )}
        </div>
    );
};

// ── Page ──────────────────────────────────────────────────────────────────────
const OfficePage: React.FC = () => {
    const { offices, fetchOffices, isLoading } = useOperativeStore();
    const { selectedBranchId } = useAuthStore();
    const [showModal, setShowModal] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>('all');

    useEffect(() => { fetchOffices(selectedBranchId ?? undefined); }, [selectedBranchId]);

    const grouped = CATEGORIES.reduce((acc, cat) => {
        acc[cat] = offices.filter(o => o.category === cat);
        return acc;
    }, {} as Record<string, Office[]>);

    const filtered = activeCategory === 'all' ? offices : grouped[activeCategory] ?? [];

    return (
        <div className="flex flex-col h-full">
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Building size={22} className="text-indigo-600" /> Oficinas
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Catálogo de oficinas agrupadas por categoría.</p>
                </div>
                <button onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
                    <Plus size={16} /> Nueva Oficina
                </button>
            </div>

            {/* Category Filter */}
            <div className="px-6 py-3 bg-white border-b border-gray-100 flex gap-2 shrink-0 overflow-x-auto">
                {[['all', 'Todas'], ...CATEGORIES.map(c => [c, CAT_STYLES[c].label])].map(([val, label]) => (
                    <button key={val} onClick={() => setActiveCategory(val)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors shrink-0 ${activeCategory === val ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-auto p-6">
                {isLoading && offices.length === 0 ? (
                    <div className="text-center text-gray-400 pt-20">Cargando oficinas...</div>
                ) : filtered.length === 0 ? (
                    <div className="text-center pt-20">
                        <Building size={40} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No hay oficinas en esta categoría</p>
                        <p className="text-sm text-gray-400 mt-1">Agrega una nueva oficina para comenzar.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filtered.map(o => <OfficeCard key={o.id} office={o} />)}
                    </div>
                )}
            </div>

            {showModal && <NewOfficeModal onClose={() => setShowModal(false)} currentBranchId={selectedBranchId ?? 0} />}
        </div>
    );
};

export default OfficePage;
