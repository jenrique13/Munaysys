import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { useInventoryStore } from '../hooks/useInventoryStore';
import { SprayCan, Plus, X, Edit, Trash2, FolderEdit, LogOut } from 'lucide-react';
import type { Consumable, ConsumableCategory } from '../types';

const ConsumablesPage: React.FC = () => {
    const branch_id = useAuthStore(s => s.selectedBranchId);
    const { consumables, fetchInventory, isLoading, deleteConsumable } = useInventoryStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<Consumable> | null>(null);

    useEffect(() => { fetchInventory(); }, [branch_id, fetchInventory]);

    const handleCreate = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item: Consumable) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = async (item: Consumable) => {
        if (!window.confirm(`¿Seguro que deseas eliminar el consumible "${item.name}"?`)) return;
        await deleteConsumable(item.id);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <SprayCan size={22} className="text-indigo-600" /> Consumibles
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Gestión de stock para artículos de limpieza, oficina y uso interno.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setIsUsageModalOpen(true)} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium shadow-sm transition-colors border">
                        <LogOut size={16} /> Orden de Salida
                    </button>
                    <button onClick={handleCreate} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
                        <Plus size={16} /> Nuevo Consumible
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto p-6">
                {isLoading && consumables.length === 0 ? (
                    <div className="text-center text-gray-400 pt-20">Cargando catálogo...</div>
                ) : consumables.length === 0 ? (
                    <div className="text-center pt-20">
                        <SprayCan size={40} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No hay consumibles registrados en esta sede.</p>
                    </div>
                ) : (
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                                    <th className="font-medium p-4">Nombre</th>
                                    <th className="font-medium p-4">Categoría</th>
                                    <th className="font-medium p-4">Costo Interno</th>
                                    <th className="font-medium p-4">Stock de Uso</th>
                                    <th className="font-medium p-4 w-24 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {consumables.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="p-4">
                                            <p className="font-medium text-gray-800">{item.name}</p>
                                            {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}
                                        </td>
                                        <td className="p-4 text-gray-600 capitalize">
                                            {item.category?.name || 'Sin Categoría'}
                                        </td>
                                        <td className="p-4">
                                            <span className="font-semibold text-gray-700">${item.cost?.toLocaleString('es-CL')}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.stock > 10 ? 'bg-green-100 text-green-700' : item.stock > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                                {item.stock} un.
                                            </span>
                                        </td>
                                        <td className="p-4 text-center hidden group-hover:flex justify-center gap-2">
                                            <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={16} /></button>
                                            <button onClick={() => handleDelete(item)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <ConsumableFormModal
                    initialData={editingItem}
                    onClose={() => setIsModalOpen(false)}
                    branchId={branch_id ?? 1}
                />
            )}

            {isUsageModalOpen && (
                <ConsumableUsageModal
                    onClose={() => setIsUsageModalOpen(false)}
                    branchId={branch_id ?? 1}
                />
            )}
        </div>
    );
};

// ── Form Modal ──────────────────────────────────────────────────────────────
const ConsumableFormModal: React.FC<{ initialData: Partial<Consumable> | null; onClose: () => void; branchId: number }> = ({ initialData, onClose, branchId }) => {
    const { createConsumable, updateConsumable, consumableCategories } = useInventoryStore();
    const isEdit = !!initialData;

    const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

    const [form, setForm] = useState<Partial<Consumable>>(
        initialData ? { ...initialData } : { name: '', description: '', cost: 0, stock: 0, unit: 'unidad', category_id: null, is_active: true, branch_id: branchId }
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const ok = isEdit && form.id ? await updateConsumable(form.id, form) : await createConsumable(form);
        if (ok) onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md z-10 overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="font-bold text-gray-800 text-lg">
                        {isEdit ? 'Editar Consumible' : 'Nuevo Consumible'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                        <input required value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-700">Categoría</label>
                            <button type="button" onClick={() => setIsCategoryManagerOpen(true)} className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium">
                                <FolderEdit size={14} /> Gestionar Categorías
                            </button>
                        </div>
                        <select
                            value={form.category_id || ''}
                            onChange={e => setForm(p => ({ ...p, category_id: e.target.value ? parseInt(e.target.value) : null }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Seleccione una categoría...</option>
                            {consumableCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Costo unitario ($)</label>
                            <input type="number" step="0.01" min="0" required value={form.cost ?? 0} onChange={e => setForm(p => ({ ...p, cost: +e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Actual</label>
                            <input type="number" min="0" required value={form.stock ?? 0} onChange={e => setForm(p => ({ ...p, stock: +e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                        <textarea value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button type="submit" className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700">Guardar</button>
                    </div>
                </form>
            </div>

            {isCategoryManagerOpen && (
                <CategoryManagerModal onClose={() => setIsCategoryManagerOpen(false)} branchId={branchId} />
            )}
        </div>
    );
};

// ── Category Manager Modal ───────────────────────────────────────────────────
const CategoryManagerModal: React.FC<{ onClose: () => void; branchId: number }> = ({ onClose, branchId }) => {
    const { consumableCategories, createConsumableCategory, updateConsumableCategory, deleteConsumableCategory } = useInventoryStore();
    const [name, setName] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        if (editingId) {
            await updateConsumableCategory(editingId, { name, branch_id: branchId });
            setEditingId(null);
        } else {
            await createConsumableCategory({ name, branch_id: branchId });
        }
        setName('');
    };

    const handleEdit = (cat: ConsumableCategory) => {
        setEditingId(cat.id);
        setName(cat.name);
    };

    const handleDelete = async (cat: ConsumableCategory) => {
        if (!window.confirm(`¿Eliminar la categoría "${cat.name}"? Los consumibles asociados quedarán sin categoría.`)) return;
        await deleteConsumableCategory(cat.id);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md z-10 overflow-hidden flex flex-col max-h-[80vh]">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
                    <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                        <FolderEdit size={20} className="text-indigo-600" /> Gestionar Categorías
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full"><X size={18} /></button>
                </div>

                <div className="p-6 flex-1 overflow-auto bg-gray-50/50">
                    <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
                        <input
                            type="text"
                            required
                            placeholder="Nueva categoría..."
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-indigo-700 whitespace-nowrap">
                            {editingId ? 'Guardar' : 'Agregar'}
                        </button>
                        {editingId && (
                            <button type="button" onClick={() => { setEditingId(null); setName(''); }} className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium text-sm hover:bg-gray-300">
                                <X size={16} />
                            </button>
                        )}
                    </form>

                    <div className="space-y-2">
                        {consumableCategories.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center italic">No hay categorías registradas.</p>
                        ) : (
                            consumableCategories.map(cat => (
                                <div key={cat.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100 shadow-sm group">
                                    <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                                    <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(cat)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={14} /></button>
                                        <button onClick={() => handleDelete(cat)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-white shrink-0 text-right">
                    <button onClick={onClose} className="px-5 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200">Cerrar</button>
                </div>
            </div>
        </div>
    );
};

// ── Usage Form Modal ────────────────────────────────────────────────────────
const ConsumableUsageModal: React.FC<{ onClose: () => void; branchId: number }> = ({ onClose, branchId }) => {
    const { consumables, createConsumableUsage } = useInventoryStore();
    const [consumableId, setConsumableId] = useState<number | ''>('');
    const [quantity, setQuantity] = useState<number>(1);
    const [reason, setReason] = useState('');

    const activeConsumables = consumables.filter(c => c.is_active && c.stock > 0);
    const selectedItem = activeConsumables.find(c => c.id === consumableId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!consumableId) return;
        const ok = await createConsumableUsage({
            consumable_id: consumableId as number,
            quantity,
            reason: reason.trim(),
            branch_id: branchId
        });
        if (ok) onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md z-10 overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2"><LogOut size={18} /> Registrar Orden de Salida</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ítem a descontar</label>
                        <select required value={consumableId} onChange={e => setConsumableId(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="">Seleccione un consumible...</option>
                            {activeConsumables.map(c => (
                                <option key={c.id} value={c.id}>{c.name} (Stock: {c.stock})</option>
                            ))}
                        </select>
                        {activeConsumables.length === 0 && (
                            <p className="text-xs text-red-500 mt-1">No hay consumibles con stock disponible en esta sede.</p>
                        )}
                    </div>
                    {selectedItem && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad a sustraer</label>
                            <input type="number" min="1" max={selectedItem.stock} required value={quantity} onChange={e => setQuantity(+e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de salida</label>
                        <textarea required placeholder="Ej: Reposición baño piso 1" value={reason} onChange={e => setReason(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button disabled={!consumableId || quantity < 1 || !reason.trim()} type="submit" className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                            Registrar Salida
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ConsumablesPage;
