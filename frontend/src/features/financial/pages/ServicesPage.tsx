import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { useInventoryStore } from '../hooks/useInventoryStore';
import { Sparkles, Plus, X, Edit, Trash2 } from 'lucide-react';
import type { Service } from '../types';

const ServicesPage: React.FC = () => {
    const branch_id = useAuthStore(s => s.selectedBranchId);
    const { services, fetchInventory, isLoading, deleteService } = useInventoryStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<Service> | null>(null);

    useEffect(() => { fetchInventory(); }, [branch_id, fetchInventory]);

    const handleCreate = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item: Service) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = async (item: Service) => {
        if (!window.confirm(`¿Seguro que deseas eliminar el servicio "${item.name}"?`)) return;
        await deleteService(item.id);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Sparkles size={22} className="text-indigo-600" /> Servicios
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Gestión de catálogo para servicios sin inventario.</p>
                </div>
                <button onClick={handleCreate} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
                    <Plus size={16} /> Nuevo Servicio
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto p-6">
                {isLoading && services.length === 0 ? (
                    <div className="text-center text-gray-400 pt-20">Cargando servicios...</div>
                ) : services.length === 0 ? (
                    <div className="text-center pt-20">
                        <Sparkles size={40} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No hay servicios registrados en esta sede.</p>
                    </div>
                ) : (
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                                    <th className="font-medium p-4">Nombre de Servicio</th>
                                    <th className="font-medium p-4">Precio Asociado</th>
                                    <th className="font-medium p-4 w-24 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {services.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="p-4">
                                            <p className="font-medium text-gray-800">{item.name}</p>
                                            {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}
                                        </td>
                                        <td className="p-4">
                                            <span className="font-semibold text-gray-700">${item.price?.toLocaleString('es-CL')}</span>
                                            {item.is_amenity && (
                                                <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                                                    Amenidad
                                                </span>
                                            )}
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
                <ServiceFormModal
                    initialData={editingItem}
                    onClose={() => setIsModalOpen(false)}
                    branchId={branch_id ?? 1}
                />
            )}
        </div>
    );
};

// ── Form Modal ──────────────────────────────────────────────────────────────
const ServiceFormModal: React.FC<{ initialData: Partial<Service> | null; onClose: () => void; branchId: number }> = ({ initialData, onClose, branchId }) => {
    const { createService, updateService } = useInventoryStore();
    const isEdit = !!initialData;

    const [form, setForm] = useState<Partial<Service>>(
        initialData ? { ...initialData } : { name: '', description: '', price: 0, is_active: true, is_amenity: false, branch_id: branchId }
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const ok = isEdit && form.id ? await updateService(form.id, form) : await createService(form);
        if (ok) onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md z-10 overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="font-bold text-gray-800 text-lg">
                        {isEdit ? 'Editar Servicio' : 'Nuevo Servicio'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Servicio</label>
                        <input required value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Costo al Cliente ($)</label>
                        <input type="number" step="0.01" min="0" required value={form.price ?? 0} onChange={e => setForm(p => ({ ...p, price: +e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción / Notas Adicionales</label>
                        <textarea value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                    </div>

                    <div className="flex items-center gap-2 py-2">
                        <input 
                            type="checkbox" 
                            id="is_amenity" 
                            checked={form.is_amenity || false} 
                            onChange={e => setForm(p => ({ ...p, is_amenity: e.target.checked }))}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="is_amenity" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Marcar como Amenidad (disponible para cuotas mensuales)
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button type="submit" className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ServicesPage;
