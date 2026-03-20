import React, { useEffect, useState } from 'react';
import { useFinancialStore } from '../hooks/useFinancialStore';
import { Search, Users, ArrowRight, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ReceivablesPage: React.FC = () => {
    const { receivables, fetchReceivables, isLoading } = useFinancialStore();
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchReceivables();
    }, [fetchReceivables]);

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
                        <p className="text-xl font-bold text-gray-900">${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
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
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última Venta</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo Pendiente</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredReceivables.map((r) => (
                                    <tr key={r.client_id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-xs mr-3">
                                                    {r.client_name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="text-sm font-medium text-gray-900">{r.client_name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {r.last_order_date ? new Date(r.last_order_date).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <span className="text-sm font-bold text-red-600">
                                                ${r.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => navigate('/billing')}
                                                className="inline-flex items-center text-indigo-600 hover:text-indigo-900 transition-colors"
                                            >
                                                Ver Estado <ArrowRight size={14} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
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
