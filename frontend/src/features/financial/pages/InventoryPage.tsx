import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { useInventoryStore } from '../hooks/useInventoryStore';
import { Package, Sparkles, SprayCan, Plus, X, Edit, Trash2 } from 'lucide-react';

type TabType = 'products' | 'services' | 'consumables';

const InventoryPage: React.FC = () => {
    const branch_id = useAuthStore(s => s.selectedBranchId);
    const {
        products, services, consumables, fetchInventory, isLoading,
        deleteProduct, deleteService, deleteConsumable
    } = useInventoryStore();

    const [activeTab, setActiveTab] = useState<TabType>('products');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => { fetchInventory(); }, [branch_id]);

    const handleCreate = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = async (item: any) => {
        if (!window.confirm(`¿Seguro que deseas eliminar "${item.name}"?`)) return;
        if (activeTab === 'products') await deleteProduct(item.id);
        if (activeTab === 'services') await deleteService(item.id);
        if (activeTab === 'consumables') await deleteConsumable(item.id);
    };

    const TABS: { id: TabType; label: string; icon: any }[] = [
        { id: 'products', label: 'Productos', icon: Package },
        { id: 'services', label: 'Servicios', icon: Sparkles },
        { id: 'consumables', label: 'Consumibles', icon: SprayCan },
    ];

    const currentData = activeTab === 'products' ? products : activeTab === 'services' ? services : consumables;

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Package size={22} className="text-indigo-600" /> Catálogo de Inventario
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Gestión de productos con stock, servicios adicionales y consumibles internos.</p>
                </div>
                <button onClick={handleCreate} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
                    <Plus size={16} /> Nuevo {activeTab === 'products' ? 'Producto' : activeTab === 'services' ? 'Servicio' : 'Consumible'}
                </button>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b px-6 flex gap-6 shrink-0">
                {TABS.map(t => {
                    const active = activeTab === t.id;
                    const Icon = t.icon;
                    return (
                        <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium transition-colors ${active ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                            <Icon size={18} className={active ? 'text-indigo-600' : 'text-gray-400'} /> {t.label}
                        </button>
                    );
                })}
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto p-6">
                {isLoading && currentData.length === 0 ? (
                    <div className="text-center text-gray-400 pt-20">Cargando catálogo...</div>
                ) : currentData.length === 0 ? (
                    <div className="text-center pt-20">
                        <Package size={40} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No hay elementos registrados en esta categoría.</p>
                    </div>
                ) : (
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                                    <th className="font-medium p-4">Nombre</th>
                                    {activeTab === 'consumables' && <th className="font-medium p-4">Categoría</th>}
                                    <th className="font-medium p-4">Precio/Costo</th>
                                    {activeTab !== 'services' && <th className="font-medium p-4">Stock</th>}
                                    <th className="font-medium p-4 w-24 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {currentData.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="p-4">
                                            <p className="font-medium text-gray-800">{item.name}</p>
                                            {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}
                                        </td>
                                        {activeTab === 'consumables' && <td className="p-4 text-gray-600 capitalize">{item.category}</td>}
                                        <td className="p-4">
                                            <span className="font-semibold text-gray-700">${(activeTab === 'consumables' ? item.cost : item.price)?.toLocaleString('es-CL')}</span>
                                        </td>
                                        {activeTab !== 'services' && (
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.stock > 10 ? 'bg-green-100 text-green-700' : item.stock > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                                    {item.stock} un.
                                                </span>
                                            </td>
                                        )}
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
                <InventoryItemModal
                    tab={activeTab}
                    initialData={editingItem}
                    onClose={() => setIsModalOpen(false)}
                    branchId={branch_id ?? 1}
                />
            )}
        </div>
    );
};

// ── Form Modal ──────────────────────────────────────────────────────────────
const InventoryItemModal: React.FC<{ tab: TabType; initialData: any; onClose: () => void; branchId: number }> = ({ tab, initialData, onClose, branchId }) => {
    const { createProduct, updateProduct, createService, updateService, createConsumable, updateConsumable } = useInventoryStore();
    const isEdit = !!initialData;

    const [form, setForm] = useState<any>(
        initialData ? { ...initialData } : { name: '', description: '', is_active: true, branch_id: branchId }
    );

    // Initial default injections based on tab
    useEffect(() => {
        if (!isEdit) {
            if (tab === 'products') setForm((p: any) => ({ ...p, price: 0, stock: 0 }));
            if (tab === 'services') setForm((p: any) => ({ ...p, price: 0 }));
            if (tab === 'consumables') setForm((p: any) => ({ ...p, category: 'cleaning', cost: 0, stock: 0, unit: 'unidad' }));
        }
    }, [tab, isEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let ok = false;
        if (tab === 'products') ok = isEdit ? await updateProduct(form.id, form) : await createProduct(form);
        if (tab === 'services') ok = isEdit ? await updateService(form.id, form) : await createService(form);
        if (tab === 'consumables') ok = isEdit ? await updateConsumable(form.id, form) : await createConsumable(form);

        if (ok) onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md z-10 overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="font-bold text-gray-800 text-lg">
                        {isEdit ? 'Editar ' : 'Nuevo '}
                        {tab === 'products' ? 'Producto' : tab === 'services' ? 'Servicio' : 'Consumible'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                        <input required value={form.name || ''} onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>

                    {tab === 'consumables' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                            <select value={form.category || 'cleaning'} onChange={e => setForm((p: any) => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="cleaning">Limpieza</option>
                                <option value="office">Oficina / Papelería</option>
                                <option value="food">Comida / Cocina</option>
                                <option value="other">Otros</option>
                            </select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{tab === 'consumables' ? 'Costo unitario ($)' : 'Precio de venta ($)'}</label>
                            <input type="number" step="0.01" min="0" required value={tab === 'consumables' ? form.cost : form.price} onChange={e => setForm((p: any) => ({ ...p, [tab === 'consumables' ? 'cost' : 'price']: +e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        {tab !== 'services' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Actual</label>
                                <input type="number" min="0" required value={form.stock || 0} onChange={e => setForm((p: any) => ({ ...p, stock: +e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                        <textarea value={form.description || ''} onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
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

export default InventoryPage;
