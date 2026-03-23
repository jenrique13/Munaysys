import React, { useEffect, useState } from 'react';
import { useFinancialStore } from '../hooks/useFinancialStore';
import { useSystemStore } from '../../system/hooks/useSystemStore';
import { useOperativeStore } from '../../operative/hooks/useOperativeStore';
import { useProvidersStore } from '../hooks/useProvidersStore';
import { formatCurrency, formatBs } from '../../../utils/format';
import {
    Plus, Search, ArrowUpCircle, ArrowDownCircle, History,
    Filter, DollarSign, Calendar, Settings
} from 'lucide-react';
import CategoryManagementModal from '../components/CategoryManagementModal';

const CashFlowPage: React.FC = () => {
    const {
        cashMovements, financialSummary, cashCategories, isLoading, paymentMethods,
        fetchCashMovements, fetchFinancialSummary, fetchCashCategories, createCashMovement
    } = useFinancialStore();
    const { bcvRateUsd } = useSystemStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

    const [formData, setFormData] = useState<{
        amount: number;
        type: 'income' | 'expense';
        category: string;
        description: string;
        client_name?: string;
        provider_name?: string;
        payment_method?: string;
    }>({
        amount: 0,
        type: 'income',
        category: '',
        description: '',
        client_name: '',
        provider_name: '',
        payment_method: ''
    });

    const { clients, fetchClients } = useOperativeStore();
    const { providers, fetchProviders } = useProvidersStore();

    useEffect(() => {
        fetchCashMovements();
        fetchFinancialSummary();
        fetchCashCategories();
        fetchClients();
        fetchProviders();
    }, [fetchCashMovements, fetchFinancialSummary, fetchCashCategories, fetchClients, fetchProviders]);

    const filteredMovements = cashMovements.filter(m => {
        const matchesSearch = m.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || m.type === filterType;
        return matchesSearch && matchesType;
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await createCashMovement(formData);
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
                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider text-left">Efectivo en Caja</p>
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
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría / Entidad</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredMovements.map((m) => (
                                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} />
                                                {new Date(m.date).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-[10px] font-bold uppercase rounded-md bg-gray-100 text-gray-600 block w-max mb-1">
                                                {m.category}
                                            </span>
                                            {(m.client_name || m.provider_name) && (
                                                <div className="text-xs text-gray-500 font-medium">
                                                    {m.client_name ? `Cliente: ${m.client_name}` : `Prov: ${m.provider_name}`}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {m.description || '-'}
                                            {m.payment_method && (
                                                <span className="block text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-widest">{m.payment_method}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
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
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredMovements.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
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

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Descripción</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                    rows={3}
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
