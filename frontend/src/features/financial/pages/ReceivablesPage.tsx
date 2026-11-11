import React, { useEffect, useState } from 'react';
import { useFinancialStore } from '../hooks/useFinancialStore';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { useSystemStore } from '../../system/hooks/useSystemStore';
import { formatCurrency, formatBs } from '../../../utils/format';
import { Search, Users, ArrowRight, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ReceivablesPage: React.FC = () => {
    const { receivables, fetchReceivables, isLoading } = useFinancialStore();
    const { bcvRateUsd } = useSystemStore();
    const { selectedBranchId } = useAuthStore();
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchReceivables();
    }, [fetchReceivables, selectedBranchId]);

    const filteredReceivables = receivables.filter(r =>
        r.client_name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => b.balance - a.balance);

    const totalBalance = filteredReceivables.reduce((sum, r) => sum + r.balance, 0);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Cuentas por Cobrar</h1>
                    <p className="text-sm text-gray-500 mt-1">Resumen de saldos deudores por cliente</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm flex items-center gap-3">
                    <div className="p-2 bg-red-50 rounded-lg">
                        <Wallet className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider text-left">Total por Cobrar</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-xl font-bold text-gray-900">{formatCurrency(totalBalance)}</p>
                            {bcvRateUsd && <p className="text-sm font-medium text-gray-500">{formatBs(totalBalance, bcvRateUsd)}</p>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4">
                <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-gray-400">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        Cargando saldos...
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-left">
                            <thead className="bg-gray-50 hidden md:table-header-group">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última Venta</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo Pendiente</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-50 md:bg-white flex flex-col md:table-row-group gap-4 md:gap-0 p-4 md:p-0 md:divide-y md:divide-gray-200">
                                {filteredReceivables.map((r) => (
                                    <tr key={r.client_id} className="hover:bg-gray-50 transition-colors group flex flex-col md:table-row bg-white border md:border-0 border-gray-200 rounded-xl p-4 md:p-0 shadow-sm md:shadow-none">
                                        <td className="px-0 py-2 md:px-6 md:py-4 md:whitespace-nowrap flex justify-between items-center md:table-cell border-b md:border-0 border-gray-100">
                                            <span className="md:hidden font-bold text-xs text-gray-400 uppercase">Cliente</span>
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-xs mr-3">
                                                    {r.client_name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="text-sm font-medium text-gray-900">{r.client_name}</div>
                                            </div>
                                        </td>
                                        <td className="px-0 py-2 md:px-6 md:py-4 md:whitespace-nowrap text-sm text-gray-500 flex justify-between items-center md:table-cell border-b md:border-0 border-gray-100">
                                            <span className="md:hidden font-bold text-xs text-gray-400 uppercase">Última Venta</span>
                                            {r.last_order_date ? new Date(r.last_order_date).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-0 py-2 md:px-6 md:py-4 md:whitespace-nowrap text-right flex justify-between items-center md:table-cell border-b md:border-0 border-gray-100">
                                            <span className="md:hidden font-bold text-xs text-gray-400 uppercase">Saldo Pendiente</span>
                                            <div className="text-right md:text-right">
                                                <div className="text-sm font-bold text-red-600">
                                                    {formatCurrency(r.balance)}
                                                </div>
                                                {bcvRateUsd && (
                                                    <div className="text-xs text-red-400 font-medium mt-0.5">
                                                        {formatBs(r.balance, bcvRateUsd)}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-0 py-3 md:px-6 md:py-4 md:whitespace-nowrap text-right text-sm font-medium flex justify-end md:table-cell mt-2 md:mt-0">
                                            <button
                                                onClick={() => navigate(`/billing?client_id=${r.client_id}`)}
                                                className="inline-flex items-center text-indigo-600 hover:text-indigo-900 transition-colors w-full md:w-auto justify-end"
                                            >
                                                Ver Estado <ArrowRight size={14} className="ml-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredReceivables.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                            <Users size={40} className="mx-auto mb-3 opacity-20" />
                                            No se encontraron saldos pendientes
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReceivablesPage;
