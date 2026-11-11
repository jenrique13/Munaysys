import React, { useState, useEffect } from 'react';
import { useFinancialStore } from '../hooks/useFinancialStore';
import { X, Plus, Trash2, Edit2, Check, AlertCircle } from 'lucide-react';
// import type { CashCategory } from '../types';

interface CategoryManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({ isOpen, onClose }) => {
    const {
        cashCategories, fetchCashCategories,
        createCashCategory, updateCashCategory, deleteCashCategory,
        isLoading
    } = useFinancialStore();

    const [isEditing, setIsEditing] = useState<number | null>(null);
    const [editData, setEditData] = useState({ name: '', type: 'expense' as 'income' | 'expense' });
    const [newData, setNewData] = useState({ name: '', type: 'expense' as 'income' | 'expense' });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchCashCategories();
        }
    }, [isOpen, fetchCashCategories]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!newData.name.trim()) return;

        const success = await createCashCategory(newData);
        if (success) {
            setNewData({ name: '', type: 'expense' });
        } else {
            setError('Error al crear la categoría');
        }
    };

    const handleUpdate = async (id: number) => {
        setError(null);
        const success = await updateCashCategory(id, editData);
        if (success) {
            setIsEditing(null);
        } else {
            setError('Error al actualizar la categoría');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Estás seguro de eliminar esta categoría?')) return;
        setError(null);
        const success = await deleteCashCategory(id);
        if (!success) {
            setError('No se pudo eliminar la categoría (puede que esté en uso)');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800 text-lg">Gestionar Categorías de Caja</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {/* Formulario de creación */}
                    <form onSubmit={handleCreate} className="flex gap-2 mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Nombre de categoría..."
                                value={newData.name}
                                onChange={(e) => setNewData({ ...newData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-indigo-200 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                required
                            />
                        </div>
                        <select
                            value={newData.type}
                            onChange={(e) => setNewData({ ...newData, type: e.target.value as any })}
                            className="px-3 py-2 border border-indigo-200 rounded-md outline-none text-sm bg-white"
                        >
                            <option value="income">Ingreso</option>
                            <option value="expense">Egreso</option>
                        </select>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition flex items-center gap-1 text-sm font-bold"
                        >
                            <Plus size={16} /> Agregar
                        </button>
                    </form>

                    {/* Lista de categorías */}
                    <div className="max-h-[400px] overflow-y-auto pr-2">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo</th>
                                    <th className="px-4 py-2 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {cashCategories.map((cat) => (
                                    <tr key={cat.id} className="hover:bg-gray-50 group">
                                        <td className="px-4 py-3">
                                            {isEditing === cat.id ? (
                                                <input
                                                    type="text"
                                                    value={editData.name}
                                                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                                    className="w-full px-2 py-1 border border-indigo-300 rounded outline-none text-sm"
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className="text-sm text-gray-700">{cat.name}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {isEditing === cat.id ? (
                                                <select
                                                    value={editData.type}
                                                    onChange={(e) => setEditData({ ...editData, type: e.target.value as any })}
                                                    className="px-2 py-1 border border-indigo-300 rounded outline-none text-sm bg-white"
                                                >
                                                    <option value="income">Ingreso</option>
                                                    <option value="expense">Egreso</option>
                                                </select>
                                            ) : (
                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${cat.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {cat.type === 'income' ? 'Ingreso' : 'Egreso'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                {isEditing === cat.id ? (
                                                    <button
                                                        onClick={() => handleUpdate(cat.id)}
                                                        className="p-1.5 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200 transition"
                                                        title="Guardar"
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setIsEditing(cat.id);
                                                            setEditData({ name: cat.name, type: cat.type });
                                                        }}
                                                        className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition opacity-0 group-hover:opacity-100"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(cat.id)}
                                                    className="p-1.5 bg-red-50 text-red-500 rounded hover:bg-red-100 transition opacity-0 group-hover:opacity-100"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )).reverse()}
                                {cashCategories.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-8 text-center text-gray-400 text-sm">
                                            No hay categorías personalizadas creadas
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 font-bold hover:text-gray-800 transition text-sm"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CategoryManagementModal;
