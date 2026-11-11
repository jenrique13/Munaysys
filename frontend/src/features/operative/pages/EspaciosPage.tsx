import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { useOperativeStore } from '../hooks/useOperativeStore';
import type { Office } from '../types';
import { LayoutGrid, Plus, X, CheckCircle, XCircle, Sparkles, Edit2, Trash2, Users, Euro } from 'lucide-react';

// ── Amenidades Modal (solo visualización) ─────────────────────────────────────


// ── Space Form Modal (Create & Edit) ─────────────────────────────────────────
const SpaceFormModal: React.FC<{ onClose: () => void; currentBranchId: number; initialData?: Office }> = ({ onClose, currentBranchId, initialData }) => {
    const { createOffice, updateOffice, isLoading, spaceCategories } = useOperativeStore();
    const isEditing = !!initialData;

    // Initialize form with initialData if editing, else defaults
    const [form, setForm] = useState<Partial<Office>>(
        initialData ? { ...initialData } : { name: '', branch_id: currentBranchId, category: spaceCategories[0]?.name || '', capacity: 1, monthly_rate: 0, is_active: true, description: '', amenities_json: [] }

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
                                {spaceCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad</label>
                            <input type="number" min={1} value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: +e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tarifa/mes (€)</label>
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

// ── Page ──────────────────────────────────────────────────────────────────────
const EspaciosPage: React.FC = () => {
    const { offices, fetchOffices, deleteOffice, spaceCategories, fetchSpaceCategories, isLoading } = useOperativeStore();
    const { selectedBranchId } = useAuthStore();

    // UI State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingSpace, setEditingSpace] = useState<Office | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>('all');

    useEffect(() => { 
        fetchOffices(selectedBranchId ?? undefined); 
        fetchSpaceCategories(selectedBranchId ?? undefined);
    }, [selectedBranchId]);

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
            fetchOffices(selectedBranchId ?? undefined);
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
                    <p className="text-sm text-gray-500 mt-1">Gestión detallada de espacios en forma de lista.</p>
                </div>
                <button onClick={handleCreateNew}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
                    <Plus size={16} /> Nuevo Espacio
                </button>
            </div>

            {/* Category Filter */}
            <div className="px-6 py-3 bg-white border-b border-gray-100 flex gap-2 shrink-0 overflow-x-auto">
                <button onClick={() => setActiveCategory('all')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors shrink-0 ${activeCategory === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    Todos
                </button>
                {spaceCategories.map(c => (
                    <button key={c.id} onClick={() => setActiveCategory(c.name)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors shrink-0 ${activeCategory === c.name ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {c.name}
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
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre & Categoría</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Capacidad</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tarifa/Mes</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map(o => (
                                    <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-800 flex items-center gap-2">
                                                {o.name}
                                                <span className="bg-gray-100 text-gray-600 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">{o.category}</span>
                                            </div>
                                            {o.description && <div className="text-xs text-gray-400 mt-1 truncate max-w-[250px]">{o.description}</div>}
                                            {((o.amenities_json ?? []) as string[]).length > 0 && (
                                                <div className="flex gap-1 mt-1.5 flex-wrap">
                                                {((o.amenities_json ?? []) as string[]).slice(0, 3).map((a, i) => <span key={i} className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 rounded">{a}</span>)}
                                                {((o.amenities_json ?? []) as string[]).length > 3 && <span className="text-[10px] bg-gray-50 text-gray-500 px-1.5 rounded">+{((o.amenities_json ?? []) as string[]).length - 3}</span>}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1 text-gray-600">
                                                <Users size={14} /> {o.capacity}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1 text-green-700 font-semibold">
                                                <Euro size={14} /> {o.monthly_rate.toLocaleString('es-CL')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${o.status === 'disponible' ? 'bg-green-100 text-green-800' : o.status === 'ocupado' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {o.status === 'disponible' ? <CheckCircle size={12} className="text-green-600" /> : o.status === 'ocupado' ? <XCircle size={12} className="text-red-600" /> : <Sparkles size={12} className="text-yellow-600" />}
                                                {o.status === 'disponible' ? 'Disponible' : o.status === 'ocupado' ? 'Ocupado' : 'Mantenimiento'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleEdit(o)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors" title="Editar">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(o)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors" title="Eliminar">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isFormOpen && <SpaceFormModal onClose={() => setIsFormOpen(false)} currentBranchId={selectedBranchId ?? 0} initialData={editingSpace ?? undefined} />}
        </div>
    );
};

export default EspaciosPage;
