import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { useFinancialStore } from '../hooks/useFinancialStore';
import { useProvidersStore } from '../hooks/useProvidersStore';
import { useSystemStore } from '../../system/hooks/useSystemStore';
import { formatCurrency, formatBs } from '../../../utils/format';

import { Wallet, Plus, Search, Tag, X, Download, AlertCircle } from 'lucide-react';

// REMOVED static CATEGORIES array

const NewExpenseModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { selectedBranchId } = useAuthStore();
    const { createExpense, isLoading, error, cashCategories, fetchCashCategories, paymentMethods, fetchPaymentMethods } = useFinancialStore();
    const { providers, fetchProviders } = useProvidersStore();
    const { bcvRateUsd, bcvRateEur, fetchBcvRates } = useSystemStore();

    useEffect(() => {
        if (paymentMethods.length === 0) fetchPaymentMethods();
        if (cashCategories.length === 0) fetchCashCategories();
        if (!bcvRateUsd) fetchBcvRates();
        fetchProviders();
    }, [fetchProviders, fetchPaymentMethods, fetchCashCategories, fetchBcvRates, paymentMethods.length, cashCategories.length, bcvRateUsd]);

    const [amount, setAmount] = useState<number>(0);
    const expenseCategories = cashCategories.filter(c => c.type === 'expense' && c.is_active);
    const [category, setCategory] = useState<string>("");

    useEffect(() => {
        if (expenseCategories.length > 0) {
            const exists = expenseCategories.some(c => c.name === category);
            if (!exists) {
                setCategory(expenseCategories[0].name);
            }
        }
    }, [expenseCategories, category]);
    const [description, setDescription] = useState('');
    const [providerId, setProviderId] = useState<number | ''>('');
    const [method, setMethod] = useState<string>(paymentMethods.find(m => m.is_active)?.name || "Efectivo");
    const [refCurrency, setRefCurrency] = useState<'usd' | 'eur'>('usd');
    const [customRate, setCustomRate] = useState<number>(0);
    const [applyIGTF, setApplyIGTF] = useState(false);

    // Update customRate when refCurrency or BCV rates change
    useEffect(() => {
        const rate = refCurrency === 'usd' ? bcvRateUsd : bcvRateEur;
        setCustomRate(rate || 0);
    }, [refCurrency, bcvRateUsd, bcvRateEur]);

    const isIGTFMethod = [
        'EFECTIVO $',
        'ZELLE',
        'BANESCO (Panama)',
        'PAY PALL',
        'BANK OF AMERICAN'
    ].includes(method);

    const subtotal = amount / 1.16;
    const tax = amount - subtotal;
    const igtf_amount = (applyIGTF && isIGTFMethod) ? amount * 0.03 : 0;
    const totalWithIGTF = amount + igtf_amount;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (amount <= 0) return;

        const ok = await createExpense({
            branch_id: selectedBranchId ?? 0,
            amount: totalWithIGTF,
            category,
            description,
            provider_id: providerId ? Number(providerId) : undefined,
            provider: providerId ? providers.find(p => p.id === Number(providerId))?.name : undefined,
            payment_method: method,
            exchange_rate: customRate,
            exchange_currency: refCurrency,
            subtotal: subtotal,
            tax: tax,
            igtf_amount: igtf_amount
        });
        if (ok) onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl z-10 flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
                    <div>
                        <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                            <Wallet size={18} /> Registrar Gasto
                        </h2>
                        <p className="text-gray-500 text-xs mt-0.5 font-medium">Registro de pagos de servicios, nómina y otros gastos operativos.</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:bg-gray-100 p-1 rounded-full">
                        <X size={18} />
                    </button>
                </div>

                {error && (
                    <div className="mx-6 mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 border border-red-100 text-sm shrink-0">
                        <AlertCircle size={16} />
                        <span className="font-bold">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden min-h-0 flex-1">
                    <div className="flex flex-col md:flex-row overflow-y-auto min-h-0">
                        
                        {/* Columna Izquierda: Resumen de Cálculos */}
                        <div className="w-full md:w-1/2 p-5 lg:p-6 bg-slate-50/50 border-r border-gray-100 flex flex-col">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Resumen de Cálculos</h3>

                            <div className="bg-white shadow-sm text-blue-900 text-xs p-5 rounded-xl border border-blue-100/60 flex-1 flex flex-col justify-between">
                                <div className="space-y-4 flex-1">
                                    <div className="flex justify-between mb-2">
                                        <span className="font-medium text-slate-600">Base Imponible:</span>
                                        <div className="text-right">
                                            <span className="font-bold text-gray-700 block">{formatCurrency(subtotal)}</span>
                                            <span className="text-[10px] text-gray-500">{formatBs(subtotal, customRate)}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between mb-2">
                                        <span className="font-medium text-slate-600">IVA Proporcional (16%):</span>
                                        <div className="text-right">
                                            <span className="font-bold text-gray-700 block">{formatCurrency(tax)}</span>
                                            <span className="text-[10px] text-gray-500">{formatBs(tax, customRate)}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between border-t border-blue-100/60 pt-3">
                                        <span className="font-medium text-slate-600">Monto Gasto (Neto):</span>
                                        <div className="text-right">
                                            <span className="font-extrabold text-indigo-600 block">{formatCurrency(amount)}</span>
                                            <span className="text-[10px] text-indigo-400 font-medium">{formatBs(amount, customRate)}</span>
                                        </div>
                                    </div>

                                    {applyIGTF && isIGTFMethod && (
                                        <div className="flex justify-between text-orange-600 font-bold mt-4 pt-4 border-t border-orange-200 border-dashed">
                                            <span>+ IGTF (3% de {formatCurrency(amount)}):</span>
                                            <div className="text-right">
                                                <span className="block">{formatCurrency(igtf_amount)}</span>
                                                <span className="text-[10px] opacity-80">{formatBs(igtf_amount, customRate)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between border-t border-blue-200/60 mt-4 pt-4 text-sm bg-blue-50/50 -mx-5 px-5 pb-3 rounded-b-xl border-dashed shrink-0">
                                    <span className="font-bold mt-1 text-slate-700 uppercase tracking-tight">TOTAL A PAGAR:</span>
                                    <div className="text-right">
                                        <span className="font-black text-blue-900 text-xl block">
                                            {formatCurrency(totalWithIGTF)}
                                        </span>
                                        <span className="text-xs font-bold text-blue-700">
                                            {formatBs(totalWithIGTF, customRate)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Columna Derecha: Formulario */}
                        <div className="w-full md:w-1/2 p-5 lg:p-6 space-y-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Detalles del Gasto</h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Monto del Gasto (€)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    value={amount === 0 ? '' : amount}
                                    onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-lg font-bold text-indigo-700 bg-indigo-50/30"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                                <select
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                                >
                                    {expenseCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    {expenseCategories.length === 0 && <option value="Otros Gastos Operativos">Otros Gastos Operativos (Default)</option>}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Entidad / Proveedor</label>
                                <select
                                    required
                                    value={providerId}
                                    onChange={e => setProviderId(e.target.value === '' ? '' : Number(e.target.value))}
                                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                                >
                                    <option value="" disabled>Seleccione proveedor...</option>
                                    {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta / Método de Pago</label>
                                <select
                                    required
                                    value={method}
                                    onChange={e => setMethod(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                                >
                                    {paymentMethods.filter(m => m.is_active).map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                                    {paymentMethods.filter(m => m.is_active).length === 0 && <option value="Efectivo">Efectivo (Default)</option>}
                                </select>
                            </div>

                            <div className="flex items-start gap-2 p-3 bg-orange-50/50 border border-orange-100 rounded-lg">
                                <input
                                    type="checkbox"
                                    id="apply-igtf-expense"
                                    checked={applyIGTF && isIGTFMethod}
                                    disabled={!isIGTFMethod}
                                    onChange={e => setApplyIGTF(e.target.checked)}
                                    className="mt-0.5 w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <label htmlFor="apply-igtf-expense" className={`text-sm font-bold cursor-pointer select-none leading-snug ${!isIGTFMethod ? 'text-gray-400' : 'text-orange-800'}`}>
                                    Aplicar IGTF (3%)
                                    {!isIGTFMethod && <span className="block text-[10px] font-normal text-gray-400 italic mt-0.5">Solo aplica para divisas / métodos internacionales</span>}
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción / Notas</label>
                                <input
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Ej. Pago de servicio eléctrico..."
                                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                />
                            </div>

                            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">Tasa de Cambio Manual</label>
                                <div className="flex gap-2 mb-3">
                                    <button
                                        type="button"
                                        onClick={() => setRefCurrency('usd')}
                                        className={`flex-1 py-1.5 rounded-md text-xs font-bold transition ${refCurrency === 'usd' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}
                                    >
                                        Dólar (USD)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRefCurrency('eur')}
                                        className={`flex-1 py-1.5 rounded-md text-xs font-bold transition ${refCurrency === 'eur' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}
                                    >
                                        Euro (EUR)
                                    </button>
                                </div>

                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">BS</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={customRate}
                                        onChange={e => setCustomRate(parseFloat(e.target.value) || 0)}
                                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4 border-t bg-white shrink-0 flex justify-end gap-3 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.05)] z-10">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
                        <button disabled={isLoading || amount <= 0} type="submit" className="px-6 py-2.5 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm">
                            {isLoading ? 'Procesando...' : 'Confirmar y Registrar Gasto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ExpensesPage: React.FC = () => {
    const { selectedBranchId } = useAuthStore();
    const { expenses, fetchExpenses, fetchCashCategories, fetchPaymentMethods, isLoading, error } = useFinancialStore();
    const { fetchBcvRates } = useSystemStore();
    const { bcvRateUsd } = useSystemStore();
    const [search, setSearch] = useState('');
    const [showNew, setShowNew] = useState(false);

    useEffect(() => {
        fetchExpenses(selectedBranchId ?? undefined);
        fetchCashCategories();
        fetchPaymentMethods();
        fetchBcvRates();
    }, [selectedBranchId, fetchExpenses, fetchCashCategories, fetchPaymentMethods, fetchBcvRates]);

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
                    {error && <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-bold border border-red-100 self-center">{error}</div>}
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
                    <div className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg font-bold border border-red-100 flex items-center gap-2">
                        <span>{formatCurrency(totalExpenses)}</span>
                        {bcvRateUsd && <span className="text-xs font-medium text-red-500">| {formatBs(totalExpenses, bcvRateUsd)}</span>}
                    </div>
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
                                        <td className="py-3 px-4 text-right">
                                            <div className="font-bold text-red-600">-{formatCurrency(e.amount)}</div>
                                            {bcvRateUsd && <div className="text-xs text-red-400 font-medium mt-0.5">{formatBs(e.amount, bcvRateUsd)}</div>}
                                        </td>
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
