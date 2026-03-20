import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { useOperativeStore } from '../hooks/useOperativeStore';
import type { Office } from '../types';
import { LayoutGrid, Plus, X, CheckCircle, XCircle, Sparkles } from 'lucide-react';

// ── Nuevas Categorías ─────────────────────────────────────────────────────────
const CATEGORIES = ['privada', 'fijo', 'compartido'];

const CAT_STYLES: Record<string, { bg: string; badge: string; label: string; icon: string }> = {
    privada: { bg: 'from-indigo-50 to-indigo-100/60', badge: 'bg-indigo-100 text-indigo-700', label: 'Oficina Privada', icon: '🏢' },
    fijo: { bg: 'from-violet-50 to-violet-100/60', badge: 'bg-violet-100 text-violet-700', label: 'Escritorio Fijo', icon: '🖥️' },
    compartido: { bg: 'from-teal-50   to-teal-100/60', badge: 'bg-teal-100   text-teal-700', label: 'Espacio Compartido', icon: '🤝' },
};

// ── Amenidades Modal (solo visualización) ─────────────────────────────────────
const AmenitiesModal: React.FC<{ office: Office; onClose: () => void }> = ({ office, onClose }) => {
    const amenities = (office.amenities_json ?? []) as string[];
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm z-10 overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                        <Sparkles size={16} className="text-indigo-500" /> Amenidades — {office.name}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"><X size={18} /></button>
                </div>
                <div className="p-6">
                    {amenities.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center italic">Sin amenidades registradas</p>
                    ) : (
                        <ul className="space-y-2">
                            {amenities.map((a, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                                    <CheckCircle size={14} className="text-emerald-500 shrink-0" /> {a}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Space Form Modal (Create & Edit) ─────────────────────────────────────────
const SpaceFormModal: React.FC<{ onClose: () => void; currentBranchId: number; initialData?: Office }> = ({ onClose, currentBranchId, initialData }) => {
    const { createOffice, updateOffice, isLoading } = useOperativeStore();
    const isEditing = !!initialData;

    // Initialize form with initialData if editing, else defaults
    const [form, setForm] = useState<Partial<Office>>(
        initialData ? { ...initialData } : { name: '', branch_id: currentBranchId, category: 'privada', capacity: 1, monthly_rate: 0, is_active: true, description: '', amenities_json: [] }
    );
    const [tag, setTag] = useState('');

    const addTag = () => {
        if (tag.trim()) {
            setForm(p => ({ ...p, amenities_json: [...(p.amenities_json ?? []), tag.trim()] }));
            setTag('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let ok = false;
        if (isEditing && form.id) {
            ok = await updateOffice(form.id, form);
        } else {
            ok = await createOffice(form);
        }
        if (ok) onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg z-10 overflow-y-auto max-h-[90vh]">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 sticky top-0">
                    <h2 className="font-bold text-gray-800 text-lg">{isEditing ? 'Editar Espacio' : 'Nuevo Espacio'}</h2>
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
                                {CATEGORIES.map(c => <option key={c} value={c}>{CAT_STYLES[c].label}</option>)}
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
                            {isLoading ? 'Guardando...' : 'Guardar Espacio'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Space Card ────────────────────────────────────────────────────────────────
const SpaceCard: React.FC<{ office: Office; onEdit: (office: Office) => void; onDelete: (office: Office) => void }> = ({ office, onEdit, onDelete }) => {
    const style = CAT_STYLES[office.category] ?? CAT_STYLES.privada;
    const [showAmenities, setShowAmenities] = useState(false);
    return (
        <>
            <div className={`bg-gradient-to-br ${style.bg} rounded-xl border border-white shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow relative group`}>
                {/* Opciones ocultas en top/right, se muestran en hover */}
                <div className="absolute top-3 right-3 flex gap-1 items-center opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/60 backdrop-blur-sm rounded-lg p-1">
                    <button onClick={() => onEdit(office)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors" title="Editar Espacio">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button onClick={() => onDelete(office)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors" title="Eliminar Espacio">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>

                <div className="flex justify-between items-start mt-2">
                    <div className="pr-16">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">{style.icon}</span>
                            <h3 className="font-bold text-gray-800 text-base">{office.name}</h3>
                        </div>
                        {office.description && <p className="text-xs text-gray-500 mt-0.5 ml-7">{office.description}</p>}
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${style.badge}`}>{style.label}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                    <span><strong>{office.capacity}</strong> personas</span>
                    <span className="text-green-700 font-semibold">${office.monthly_rate.toLocaleString('es-CL')}/mes</span>
                    <span className="flex items-center gap-1">
                        {office.status === 'disponible' ? <CheckCircle size={14} className="text-emerald-500" /> : <XCircle size={14} className="text-red-400" />}
                        {office.status === 'disponible' ? 'Disponible' : office.status === 'ocupado' ? 'Ocupado' : 'Mantenimiento'}
                    </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                    <div className="flex flex-wrap gap-1 flex-1">
                        {((office.amenities_json ?? []) as string[]).slice(0, 3).map((a, i) => (
                            <span key={i} className="bg-white/80 text-gray-600 text-xs px-2 py-0.5 rounded-full border border-gray-200">{a}</span>
                        ))}
                        {((office.amenities_json ?? []) as string[]).length > 3 && (
                            <span className="bg-white/80 text-gray-400 text-xs px-2 py-0.5 rounded-full border border-gray-200">
                                +{((office.amenities_json ?? []) as string[]).length - 3} más
                            </span>
                        )}
                    </div>
                    {((office.amenities_json ?? []) as string[]).length > 0 && (
                        <button onClick={() => setShowAmenities(true)}
                            className="ml-2 flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium shrink-0">
                            <Sparkles size={12} /> Ver todas
                        </button>
                    )}
                </div>
            </div>
            {showAmenities && <AmenitiesModal office={office} onClose={() => setShowAmenities(false)} />}
        </>
    );
};

// ── Page ──────────────────────────────────────────────────────────────────────
const EspaciosPage: React.FC = () => {
    const { offices, fetchOffices, deleteOffice, isLoading } = useOperativeStore();
    const { selectedBranchId } = useAuthStore();

    // UI State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingSpace, setEditingSpace] = useState<Office | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>('all');

    useEffect(() => { fetchOffices(selectedBranchId ?? undefined); }, [selectedBranchId]);

    const handleCreateNew = () => {
        setEditingSpace(null);
        setIsFormOpen(true);
    };

    const handleEdit = (office: Office) => {
        setEditingSpace(office);
        setIsFormOpen(true);
    };

    const handleDelete = async (office: Office) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente el espacio "${office.name}"?`)) {
            await deleteOffice(office.id);
        }
    };

    const filtered = activeCategory === 'all' ? offices : offices.filter(o => o.category === activeCategory);

    return (
        <div className="flex flex-col h-full">
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <LayoutGrid size={22} className="text-indigo-600" /> Espacios
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Catálogo de espacios agrupados por categoría.</p>
                </div>
                <button onClick={handleCreateNew}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
                    <Plus size={16} /> Nuevo Espacio
                </button>
            </div>

            {/* Category Filter */}
            <div className="px-6 py-3 bg-white border-b border-gray-100 flex gap-2 shrink-0 overflow-x-auto">
                {[['all', 'Todos'], ...CATEGORIES.map(c => [c, CAT_STYLES[c].label])].map(([val, label]) => (
                    <button key={val} onClick={() => setActiveCategory(val)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors shrink-0 ${activeCategory === val ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {val !== 'all' && CAT_STYLES[val as string]?.icon} {label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-auto p-6">
                {isLoading && offices.length === 0 ? (
                    <div className="text-center text-gray-400 pt-20">Cargando espacios...</div>
                ) : filtered.length === 0 ? (
                    <div className="text-center pt-20">
                        <LayoutGrid size={40} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No hay espacios en esta categoría</p>
                        <p className="text-sm text-gray-400 mt-1">Agrega un nuevo espacio para comenzar.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filtered.map(o => <SpaceCard key={o.id} office={o} onEdit={handleEdit} onDelete={handleDelete} />)}
                    </div>
                )}
            </div>

            {isFormOpen && <SpaceFormModal onClose={() => setIsFormOpen(false)} currentBranchId={selectedBranchId ?? 0} initialData={editingSpace ?? undefined} />}
        </div>
    );
};

export default EspaciosPage;
