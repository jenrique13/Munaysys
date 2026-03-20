import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { useFinancialStore } from '../hooks/useFinancialStore';

import { Wallet, Plus, Search, Tag, X, Download } from 'lucide-react';

// REMOVED static CATEGORIES array

const NewExpenseModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { selectedBranchId } = useAuthStore();
    const { createExpense, isLoading, cashCategories } = useFinancialStore();

    const [amount, setAmount] = useState<number>(0);
    const expenseCategories = cashCategories.filter(c => c.type === 'expense' && c.is_active);
    const [category, setCategory] = useState<string>(expenseCategories[0]?.name || "Otros Gastos Operativos");
    const [description, setDescription] = useState('');
    const [provider, setProvider] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (amount <= 0) return;

        const ok = await createExpense({
            branch_id: selectedBranchId ?? 0,
            amount,
            category,
            description,
            provider
        });
        if (ok) onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm z-10 overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                        <Wallet size={18} /> Registrar Gasto
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:bg-gray-100 p-1 rounded-full"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                        <select value={category} onChange={e => setCategory(e.target.value)} required
                            className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500">
                            {expenseCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            {expenseCategories.length === 0 && <option value="Otros Gastos Operativos">Otros Gastos Operativos (Default)</option>}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Monto ($)</label>
                        <input type="number" step="0.01" min="0" required value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción / Notas</label>
                        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ej. Pago de servicio eléctrico..."
                            className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Entidad / Proveedor (Opcional)</label>
                        <input value={provider} onChange={e => setProvider(e.target.value)} placeholder="Ej. Corpoelec"
                            className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button disabled={isLoading || amount <= 0} type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                            {isLoading ? 'Guardando...' : 'Registrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ExpensesPage: React.FC = () => {
    const { selectedBranchId } = useAuthStore();
    const { expenses, fetchExpenses, fetchCashCategories, isLoading } = useFinancialStore();
    const [search, setSearch] = useState('');
    const [showNew, setShowNew] = useState(false);

    useEffect(() => {
        fetchExpenses(selectedBranchId ?? undefined);
        fetchCashCategories();
    }, [selectedBranchId, fetchExpenses, fetchCashCategories]);

    const filtered = expenses.filter(e =>
        e.category.toLowerCase().includes(search.toLowerCase()) ||
        (e.description?.toLowerCase() || '').includes(search.toLowerCase())
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalExpenses = filtered.reduce((sum, e) => sum + e.amount, 0);

    return (
        <div className="flex flex-col h-full bg-gray-50/30">
            <div className="bg-white px-6 py-4 flex justify-between items-center shrink-0 border-b">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Wallet size={22} className="text-indigo-600" /> Gastos Operativos
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Registro de pagos de servicios, nómina y otros gastos (no inventario).</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => {
                        import('../../../utils/exportToCSV').then(({ exportToCSV }) => {
                            const exportData = filtered.map(e => ({
                                ID: `GAS-${e.id}`,
                                Categoría: e.category,
                                Descripción: e.description,
                                Proveedor: e.provider,
                                Fecha: new Date(e.date).toLocaleDateString(),
                                Monto: e.amount
                            }));
                            exportToCSV(exportData, 'reporte_gastos');
                        });
                    }} className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
                        <Download size={16} /> Exportar
                    </button>
                    <button onClick={() => setShowNew(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
                        <Plus size={16} /> Nuevo Gasto
                    </button>
                </div>
            </div>

            <div className="px-6 py-3 bg-white border-b shrink-0 flex items-center justify-between">
                <div className="relative max-w-sm w-full">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar en descripción o categoría..."
                        className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition" />
                </div>
                <div className="flex gap-4 items-center">
                    <span className="text-sm font-medium text-gray-500">Total listado:</span>
                    <span className="px-3 py-1 bg-red-50 text-red-700 rounded font-bold border border-red-100">${totalExpenses.toFixed(2)}</span>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {isLoading && expenses.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">Cargando gastos...</div>
                    ) : filtered.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            <Wallet size={36} className="mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No hay gastos en esta sucursal</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                <tr>
                                    <th className="py-3 px-4 w-12 text-center">ID</th>
                                    <th className="py-3 px-4">Categoría</th>
                                    <th className="py-3 px-4">Descripción</th>
                                    <th className="py-3 px-4">Proveedor / Entidad</th>
                                    <th className="py-3 px-4">Fecha</th>
                                    <th className="py-3 px-4 text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map(e => (
                                    <tr key={e.id} className="hover:bg-indigo-50/20 transition group">
                                        <td className="py-3 px-4 text-sm text-gray-500 text-center">#{e.id}</td>
                                        <td className="py-3 px-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                                                <Tag size={12} /> {e.category}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 font-medium text-gray-800 text-sm">{e.description || '-'}</td>
                                        <td className="py-3 px-4 text-sm text-gray-600">{e.provider || '-'}</td>
                                        <td className="py-3 px-4 text-xs text-gray-500">{new Date(e.date).toLocaleDateString()}</td>
                                        <td className="py-3 px-4 font-bold text-red-600 text-right">-${e.amount.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {showNew && <NewExpenseModal onClose={() => setShowNew(false)} />}
        </div>
    );
};

export default ExpensesPage;
