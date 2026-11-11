import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CreditCard, Tag, AlertCircle } from 'lucide-react';
import { financialService } from '../services/financial.service';
import type { PaymentMethod, CashCategory } from '../types';
import { useAuthStore } from '../../../features/auth/hooks/useAuthStore';
import { useOperativeStore } from '../../operative/hooks/useOperativeStore';
import { LayoutDashboard, LogIn } from 'lucide-react'; // icons for tabs

const CatalogsPage: React.FC = () => {
    const { selectedBranchId, user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'payments' | 'expenses' | 'spaces' | 'rooms'>('payments');

    
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [cashCategories, setCashCategories] = useState<CashCategory[]>([]);
    
    // Operative Catalogs
    const { 
        spaceCategories, roomTypes, 
        fetchSpaceCategories, fetchRoomTypes,
        createSpaceCategory, updateSpaceCategory, deleteSpaceCategory,
        createRoomType, updateRoomType, deleteRoomType
    } = useOperativeStore();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [formData, setFormData] = useState<{
        name: string;
        description: string;
        type: 'income' | 'expense';
        is_active: boolean;
    }>({ name: '', description: '', type: 'expense', is_active: true });

    const isAuthorized = user?.is_superuser || user?.role?.name === 'Gerente';

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'payments') {
                const data = await financialService.getPaymentMethods(selectedBranchId ?? undefined);
                setPaymentMethods(data);
            } else if (activeTab === 'expenses') {
                const data = await financialService.getCashCategories();
                setCashCategories(data);
            } else if (activeTab === 'spaces') {
                await fetchSpaceCategories(selectedBranchId ?? undefined);
            } else if (activeTab === 'rooms') {
                await fetchRoomTypes(selectedBranchId ?? undefined);
            }
            setError(null);
        } catch (err) {
            setError('Error al cargar datos. Verifique sus permisos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab, selectedBranchId]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (activeTab === 'payments') {
                if (editingItem) {
                    await financialService.updatePaymentMethod(editingItem.id, {
                        name: formData.name, description: formData.description, is_active: formData.is_active
                    });
                } else {
                    await financialService.createPaymentMethod({ 
                        name: formData.name, description: formData.description, is_active: formData.is_active
                    });
                }
            } else if (activeTab === 'expenses') {
                if (editingItem) {
                    await financialService.updateCashCategory(editingItem.id, {
                        name: formData.name, description: formData.description, is_active: formData.is_active, type: formData.type
                    });
                } else {
                    await financialService.createCashCategory({ 
                        name: formData.name, description: formData.description, is_active: formData.is_active, type: formData.type
                    });
                }
            } else if (activeTab === 'spaces') {
                if (editingItem) {
                    await updateSpaceCategory(editingItem.id, {
                        name: formData.name, description: formData.description, is_active: formData.is_active
                    });
                } else {
                    await createSpaceCategory({ 
                        name: formData.name, description: formData.description, is_active: formData.is_active, branch_id: selectedBranchId ?? undefined
                    });
                }
            } else if (activeTab === 'rooms') {
                if (editingItem) {
                    await updateRoomType(editingItem.id, {
                        name: formData.name, description: formData.description, is_active: formData.is_active
                    });
                } else {
                    await createRoomType({ 
                        name: formData.name, description: formData.description, is_active: formData.is_active, branch_id: selectedBranchId ?? undefined
                    });
                }
            }
            setShowModal(false);
            fetchData();
        } catch (err) {
            alert('Error al guardar. Verifique sus permisos.');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Está seguro de eliminar este elemento?')) return;
        try {
            if (activeTab === 'payments') {
                await financialService.deletePaymentMethod(id);
            } else if (activeTab === 'expenses') {
                await financialService.deleteCashCategory(id);
            } else if (activeTab === 'spaces') {
                await deleteSpaceCategory(id);
            } else if (activeTab === 'rooms') {
                await deleteRoomType(id);
            }
            fetchData();
        } catch (err) {
            alert('Error al eliminar. Verifique sus permisos.');
        }
    };

    if (!isAuthorized) {
        return (
            <div className="p-8 flex flex-col items-center justify-center text-center">
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800">Acceso Denegado</h2>
                <p className="text-gray-600 max-w-md">Solo los administradores y gerentes pueden gestionar los catálogos del sistema.</p>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Gestión de Catálogos</h1>
                    <p className="text-gray-500 text-sm">Configure los valores disponibles para el sistema financiero</p>
                </div>
                <button
                    onClick={() => { 
                        setEditingItem(null); 
                        setFormData({ name: '', description: '', type: 'expense', is_active: true }); 
                        setShowModal(true); 
                    }}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm"
                >
                    <Plus size={20} />
                    {activeTab === 'payments' ? 'Nuevo Método' : activeTab === 'spaces' ? 'Nueva Categoría Espacio' : activeTab === 'rooms' ? 'Nuevo Tipo Sala' : 'Nueva Categoría'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('payments')}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition ${activeTab === 'payments' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <div className="flex items-center gap-2">
                        <CreditCard size={18} />
                        Métodos de Pago
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('expenses')}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition ${activeTab === 'expenses' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <div className="flex items-center gap-2">
                        <Tag size={18} />
                        Categorías de Caja
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('spaces')}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition ${activeTab === 'spaces' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <div className="flex items-center gap-2">
                        <LayoutDashboard size={18} />
                        Categorías de Espacios
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('rooms')}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition ${activeTab === 'rooms' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <div className="flex items-center gap-2">
                        <LogIn size={18} />
                        Tipos de Salas
                    </div>
                </button>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-2"><AlertCircle size={20}/> {error}</div>}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                            {activeTab === 'expenses' && <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>}
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Descripción</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">Cargando...</td></tr>
                        ) : (activeTab === 'payments' ? paymentMethods : activeTab === 'expenses' ? cashCategories : activeTab === 'spaces' ? spaceCategories : roomTypes).length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">No se encontraron elementos</td></tr>
                        ) : (activeTab === 'payments' ? paymentMethods : activeTab === 'expenses' ? cashCategories : activeTab === 'spaces' ? spaceCategories : roomTypes).map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                                {activeTab === 'expenses' && (
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${(item as any).type === 'income' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {(item as any).type === 'income' ? 'Ingreso' : 'Egreso'}
                                        </span>
                                    </td>
                                )}
                                <td className="px-6 py-4 text-sm text-gray-500">{item.description || '-'}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {item.is_active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => { 
                                            setEditingItem(item); 
                                            setFormData({ 
                                                name: item.name, 
                                                description: item.description || '', 
                                                type: (item as any).type || 'expense', 
                                                is_active: item.is_active 
                                            }); 
                                            setShowModal(true); 
                                        }} 
                                        className="text-gray-400 hover:text-indigo-600 transition p-2"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-600 transition p-2"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">{editingItem ? 'Editar' : 'Nuevo'} {activeTab === 'payments' ? 'Método' : activeTab === 'spaces' ? 'Categoría de Espacio' : activeTab === 'rooms' ? 'Tipo de Sala' : 'Categoría'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition">×</button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                    placeholder="Ej. Efectivo, Papelería, etc."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none"
                                    rows={3}
                                />
                            </div>
                            {activeTab === 'expenses' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Categoría</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                    >
                                        <option value="income">Ingreso (Entrada de Caja)</option>
                                        <option value="expense">Egreso (Salida de Caja)</option>
                                    </select>
                                </div>
                            )}
                            <div className="flex items-center gap-2 py-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <label htmlFor="is_active" className="text-sm text-gray-700 font-medium">Elemento Activo</label>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancelar</button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CatalogsPage;
