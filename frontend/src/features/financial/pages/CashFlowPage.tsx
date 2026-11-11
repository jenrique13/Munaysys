import React, { useEffect, useState } from 'react';
import { useFinancialStore } from '../hooks/useFinancialStore';
import { useSystemStore } from '../../system/hooks/useSystemStore';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { useOperativeStore } from '../../operative/hooks/useOperativeStore';
import { useProvidersStore } from '../hooks/useProvidersStore';
import { formatCurrency, formatBs, formatDate } from '../../../utils/format';
import {
    Plus, Search, ArrowUpCircle, ArrowDownCircle, History,
    Filter, DollarSign, Calendar, Settings
} from 'lucide-react';
import CategoryManagementModal from '../components/CategoryManagementModal';

const CashFlowPage: React.FC = () => {
    const {
        cashMovements, financialSummary, cashCategories, isLoading, paymentMethods,
        fetchCashMovements, fetchFinancialSummary, fetchCashCategories, createCashMovement,
        fetchPaymentMethods
    } = useFinancialStore();
    const { user, selectedBranchId } = useAuthStore();
    const { bcvRateUsd, bcvRateEur, fetchBcvRates } = useSystemStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
    
    // Period filters
    const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1);
    const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());

    const [formData, setFormData] = useState<{
        amount: number;
        type: 'income' | 'expense';
        category: string;
        description: string;
        client_name?: string;
        provider_name: string;
        payment_method?: string;
        exchange_rate?: number;
        exchange_currency?: string;
    }>({
        amount: 0,
        type: 'income',
        category: '',
        description: '',
        client_name: '',
        provider_name: '',
        payment_method: '',
        exchange_rate: 0,
        exchange_currency: 'usd'
    });

    const { clients, fetchClients } = useOperativeStore();
    const { providers, fetchProviders } = useProvidersStore();

    useEffect(() => {
        fetchCashMovements(selectedBranchId || undefined, filterMonth, filterYear);
        fetchFinancialSummary(selectedBranchId || undefined, filterMonth, filterYear);
        fetchCashCategories();
        fetchClients();
        fetchProviders();
        fetchPaymentMethods(selectedBranchId || undefined);
        fetchBcvRates();
    }, [fetchCashMovements, fetchFinancialSummary, fetchCashCategories, fetchClients, fetchProviders, fetchPaymentMethods, fetchBcvRates, selectedBranchId, filterMonth, filterYear]);

    const filteredMovements = cashMovements.filter(m => {
        const matchesSearch = m.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || m.type === filterType;
        return matchesSearch && matchesType;
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await createCashMovement({
            ...formData,
            branch_id: selectedBranchId || user?.branch_id || 1
        });
        if (success) {
            setIsModalOpen(false);
            setFormData({ amount: 0, type: 'income', category: '', description: '', client_name: '', provider_name: '', payment_method: '' });
        }
    };

    // Filter categories by selected type
    const availableCategories = cashCategories.filter(c => c.type === formData.type && c.is_active);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Flujo de Caja</h1>
                    <p className="text-sm text-gray-500 mt-1">Control de tesorería y movimientos manuales</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 rounded-lg">
                            <DollarSign className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider text-left">
                                {filterMonth ? 'Balance del Período' : 'Efectivo en Caja'}
                            </p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-xl font-bold text-gray-900">
                                    {formatCurrency(financialSummary?.current_cash || 0)}
                                </p>
                                {bcvRateUsd && (
                                    <p className="text-sm font-medium text-gray-500">
                                        {formatBs(financialSummary?.current_cash || 0, bcvRateUsd)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsConfigModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm"
                        title="Gestionar Categorías"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Registrar Movimiento
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="md:col-span-2 relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por descripción o categoría..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as any)}
                            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                        >
                             <option value="all">Tipos</option>
                             <option value="income">Ingresos</option>
                             <option value="expense">Egresos</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <select
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                        >
                            <option value={0}>Todos los meses</option>
                            {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((m, i) => (
                                <option key={m} value={i + 1}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-32 relative">
                        <select
                            value={filterYear}
                            onChange={(e) => setFilterYear(parseInt(e.target.value))}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                        >
                            {[2024, 2025, 2026].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                    <History size={18} className="text-gray-400" />
                    <h2 className="font-bold text-gray-800">Historial de Movimientos</h2>
                </div>
                {isLoading ? (
                    <div className="p-12 text-center text-gray-400">Cargando movimientos...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-left">
                            <thead className="bg-gray-50 hidden md:table-header-group">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sede</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría / Entidad</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Tasa de Cambio</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-50 md:bg-white flex flex-col md:table-row-group gap-4 md:gap-0 p-4 md:p-0 md:divide-y md:divide-gray-200">
                                {filteredMovements.map((m) => (
                                    <tr key={m.id} className="hover:bg-gray-50 transition-colors flex flex-col md:table-row bg-white border md:border-0 border-gray-200 rounded-xl p-4 md:p-0 shadow-sm md:shadow-none">
                                        <td className="px-0 py-2 md:px-6 md:py-4 md:whitespace-nowrap text-sm text-gray-500 flex justify-between items-center md:table-cell border-b md:border-0 border-gray-100">
                                            <span className="md:hidden font-bold text-xs text-gray-400 uppercase">Fecha</span>
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="md:hidden" />
                                                {formatDate(m.date)}
                                            </div>
                                        </td>
                                        <td className="px-0 py-2 md:px-6 md:py-4 md:whitespace-nowrap text-xs font-bold text-slate-500 flex justify-between items-center md:table-cell border-b md:border-0 border-gray-100">
                                            <span className="md:hidden font-bold text-xs text-gray-400 uppercase">Sede</span>
                                            {m.branch?.name || `Sede #${m.branch_id}`}
                                        </td>
                                        <td className="px-0 py-2 md:px-6 md:py-4 md:whitespace-nowrap flex flex-col md:table-cell border-b md:border-0 border-gray-100">
                                            <span className="md:hidden font-bold text-xs text-gray-400 uppercase mb-1">Categoría / Entidad</span>
                                            <div className="flex flex-col items-end md:items-start">
                                                <span className="px-2 py-1 text-[10px] font-bold uppercase rounded-md bg-gray-100 text-gray-600 block w-max mb-1">
                                                    {m.category}
                                                </span>
                                                {(m.client_name || m.provider_name) && (
                                                    <div className="text-xs text-gray-500 font-medium">
                                                        {m.client_name ? `Cliente: ${m.client_name}` : `Prov: ${m.provider_name}`}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-0 py-2 md:px-6 md:py-4 text-sm text-gray-700 flex flex-col md:table-cell border-b md:border-0 border-gray-100 text-right md:text-left">
                                            <span className="md:hidden font-bold text-xs text-gray-400 uppercase mb-1 self-start">Descripción</span>
                                            {m.description || '-'}
                                            {m.payment_method && (
                                                <span className="block text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-widest">{m.payment_method}</span>
                                            )}
                                        </td>
                                        <td className="px-0 py-2 md:px-6 md:py-4 md:whitespace-nowrap md:text-center flex justify-between items-center md:table-cell border-b md:border-0 border-gray-100">
                                            <span className="md:hidden font-bold text-xs text-gray-400 uppercase">Tasa de Cambio</span>
                                            {m.exchange_rate ? (
                                                <div className="flex flex-col items-end md:items-center">
                                                    <span className="text-xs font-bold text-indigo-600">
                                                        {m.exchange_rate.toFixed(2)} BS
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">
                                                        /{m.exchange_currency || 'usd'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-300">-</span>
                                            )}
                                        </td>
                                        <td className="px-0 py-2 md:px-6 md:py-4 md:whitespace-nowrap text-right flex justify-between items-center md:table-cell mt-2 md:mt-0">
                                            <span className="md:hidden font-bold text-xs text-gray-400 uppercase">Monto</span>
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className={`text-sm font-bold ${m.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                        {m.type === 'income' ? '+' : '-'}{formatCurrency(m.amount)}
                                                    </span>
                                                    {m.type === 'income' ?
                                                        <ArrowUpCircle size={16} className="text-emerald-500" /> :
                                                        <ArrowDownCircle size={16} className="text-red-500" />
                                                    }
                                                </div>
                                                {bcvRateUsd && (
                                                    <span className="text-xs text-gray-400 font-medium mt-1">
                                                        {formatBs(m.amount, bcvRateUsd)}
                                                    </span>
                                                )}
                                                {((m as any).igtf_amount || 0) > 0 && (
                                                    <span className="text-[10px] font-bold text-orange-600 uppercase border border-orange-200 bg-orange-50 px-1.5 rounded-full mt-1">
                                                        + IGTF
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredMovements.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            No se encontraron movimientos registrados
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de Configuración de Categorías */}
            <CategoryManagementModal
                isOpen={isConfigModalOpen}
                onClose={() => setIsConfigModalOpen(false)}
            />

            {/* Modal de Registro */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 text-lg">Nuevo Movimiento de Caja</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'income', category: '' })}
                                    className={`py-2 px-4 rounded-md text-sm font-bold transition ${formData.type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Ingreso
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'expense', category: '' })}
                                    className={`py-2 px-4 rounded-md text-sm font-bold transition ${formData.type === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Egreso
                                </button>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Monto ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.amount || ''}
                                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-lg"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Categoría</label>
                                <select
                                    required
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="" disabled>Seleccionar...</option>
                                    {availableCategories.length > 0 ? (
                                        availableCategories.map(c => (
                                            <option key={c.id} value={c.name}>{c.name}</option>
                                        ))
                                    ) : (
                                        <option value="" disabled>No hay categorías para este tipo</option>
                                    )}
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>

                            {formData.type === 'income' ? (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Cliente (Búsqueda)</label>
                                    <input
                                        list="clients-list"
                                        type="text"
                                        value={formData.client_name || ''}
                                        onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Escribe o selecciona un cliente registrados"
                                    />
                                    <datalist id="clients-list">
                                        {clients.map(c => <option key={c.id} value={c.name} />)}
                                    </datalist>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Proveedor (Búsqueda)</label>
                                    <input
                                        list="providers-list"
                                        type="text"
                                        value={formData.provider_name || ''}
                                        onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Escribe o selecciona un proveedor registrado"
                                    />
                                    <datalist id="providers-list">
                                        {providers.map(p => <option key={p.id} value={p.name} />)}
                                    </datalist>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Método de Pago</label>
                                <select
                                    required
                                    value={formData.payment_method || ''}
                                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="" disabled>Seleccione método...</option>
                                    {paymentMethods.filter(m => m.is_active).map(m => (
                                        <option key={m.id} value={m.name}>{m.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg mb-4">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tasa de Cambio a Aplicar</label>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setFormData({ ...formData, exchange_currency: 'usd', exchange_rate: bcvRateUsd || 0 })} className={`flex-1 py-1.5 rounded-md text-sm font-bold transition ${formData.exchange_currency === 'usd' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}>Dólar (USD)</button>
                                    <button type="button" onClick={() => setFormData({ ...formData, exchange_currency: 'eur', exchange_rate: bcvRateEur || 0 })} className={`flex-1 py-1.5 rounded-md text-sm font-bold transition ${formData.exchange_currency === 'eur' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}>Euro (EUR)</button>
                                </div>
                                
                                <div className="mt-3">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tasa Manual (BS/{formData.exchange_currency?.toUpperCase()})</label>
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        value={formData.exchange_rate} 
                                        onChange={e => setFormData({ ...formData, exchange_rate: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm font-bold text-indigo-600 outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>

                                <div className="mt-3 flex justify-between items-center px-1">
                                    <span className="text-sm text-gray-600 font-medium">Equivalente en BS:</span>
                                    <div className="text-right">
                                        <span className="text-lg font-bold text-gray-900 block">
                                            {formatBs(formData.amount, formData.exchange_rate || 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Descripción</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                    rows={2}
                                    placeholder="Detalles del movimiento..."
                                />
                            </div>

                            <button
                                type="submit"
                                className={`w-full py-3 rounded-lg text-white font-bold shadow-lg transition transform active:scale-95 ${formData.type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
                            >
                                Registrar {formData.type === 'income' ? 'Ingreso' : 'Egreso'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CashFlowPage;
