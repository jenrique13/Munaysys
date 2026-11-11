import React, { useEffect, useState, useCallback } from 'react';
import { X, Download, Filter, Calendar, CreditCard, ShoppingCart, Receipt } from 'lucide-react';
import { useProvidersStore } from '../hooks/useProvidersStore';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ProviderStatement } from '../services/providers.service';

interface ProviderStatementModalProps {
    providerId: number;
    providerName: string;
    onClose: () => void;
}

const ProviderStatementModal: React.FC<ProviderStatementModalProps> = ({ providerId, providerName, onClose }) => {
    const { user, selectedBranchId } = useAuthStore();
    const { fetchProviderStatement } = useProvidersStore();
    const [statement, setStatement] = useState<ProviderStatement | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [status, setStatus] = useState<string>('');

    const loadStatement = useCallback(async () => {
        setIsLoading(true);
        try {
            // Priority: selectedBranchId > user.branch_id
            const branch_id = selectedBranchId || user?.branch_id;
            const data = await fetchProviderStatement(providerId, { 
                month, 
                year, 
                status, 
                branch_id 
            });
            setStatement(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [providerId, month, year, status, selectedBranchId, user?.branch_id, fetchProviderStatement]);

    useEffect(() => {
        loadStatement();
    }, [loadStatement]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'purchase': return <ShoppingCart className="w-4 h-4 text-blue-500" />;
            case 'expense': return <CreditCard className="w-4 h-4 text-orange-500" />;
            case 'payable': return <CreditCard className="w-4 h-4 text-purple-500" />;
            case 'payment': return <Receipt className="w-4 h-4 text-green-500" />;
            default: return null;
        }
    };

    const getTypeName = (type: string) => {
        switch (type) {
            case 'purchase': return 'Compra';
            case 'expense': return 'Gasto';
            case 'payable': return 'Cta. por Pagar';
            case 'payment': return 'Pago realizado';
            default: return type;
        }
    };

    const getStatusLabel = (status: string) => {
        if (status === 'paid' || status === 'confirmed') return 'Pagado';
        if (status === 'pending' || status === 'partial') return 'Pendiente';
        if (status === 'cancelled') return 'Cancelado';
        return status;
    };

    const getStatusClass = (status: string) => {
        if (status === 'paid' || status === 'confirmed') return 'bg-green-100 text-green-700';
        if (status === 'pending' || status === 'partial') return 'bg-amber-100 text-amber-700';
        if (status === 'cancelled') return 'bg-red-100 text-red-700';
        return 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Estado de Cuenta: {providerName}</h2>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Resumen de transacciones y deudas</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Filters */}
                <div className="p-4 bg-white border-b flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-gray-400" />
                        <select 
                            value={month} 
                            onChange={(e) => setMonth(Number(e.target.value))}
                            className="text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    {format(new Date(2024, i, 1), 'MMMM', { locale: es })}
                                </option>
                            ))}
                        </select>
                        <select 
                            value={year} 
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
                        >
                            {[2023, 2024, 2025, 2026].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-gray-400" />
                        <select 
                            value={status} 
                            onChange={(e) => setStatus(e.target.value)}
                            className="text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
                        >
                            <option value="">Todos los estados</option>
                            <option value="pending">Pendientes</option>
                            <option value="paid">Pagados</option>
                            <option value="cancelled">Cancelados</option>
                        </select>
                    </div>
                </div>

                {/* Summary Cards */}
                {statement && (
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50">
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <p className="text-[10px] font-bold text-gray-500 uppercase">Total Compras</p>
                            <p className="text-lg font-bold text-blue-600">{formatCurrency(statement.total_purchases)}</p>
                            <p className="text-xs text-gray-400">Bs {statement.total_purchases_bs?.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <p className="text-[10px] font-bold text-gray-500 uppercase">Total Gastos</p>
                            <p className="text-lg font-bold text-orange-600">{formatCurrency(statement.total_expenses)}</p>
                            <p className="text-xs text-gray-400">Bs {statement.total_expenses_bs?.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <p className="text-[10px] font-bold text-gray-500 uppercase">Total Pagado</p>
                            <p className="text-lg font-bold text-green-600">{formatCurrency(statement.total_paid)}</p>
                            <p className="text-xs text-gray-400">Bs {statement.total_paid_bs?.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border-2 border-red-100 shadow-sm">
                            <p className="text-[10px] font-bold text-gray-500 uppercase">Saldo Pendiente</p>
                            <p className="text-lg font-bold text-red-600">{formatCurrency(statement.balance)}</p>
                            <p className="text-xs text-gray-400">Bs {statement.balance_bs?.toLocaleString()}</p>
                        </div>
                    </div>
                )}

                {/* Transactions Tables */}
                <div className="flex-1 overflow-auto p-6 space-y-10">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-32">
                            <p className="text-gray-500 animate-pulse font-medium">Cargando transacciones...</p>
                        </div>
                    ) : (
                        <>
                            {/* Table 1: Purchases and Expenses */}
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <ShoppingCart className="w-5 h-5 text-slate-700" />
                                    <h3 className="text-lg font-bold text-slate-800">Compras y Gastos</h3>
                                </div>
                                <div className="border rounded-xl overflow-hidden shadow-sm">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Descripción</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Referencia</th>
                                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Tasa</th>
                                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Monto Divisa</th>
                                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Monto Bs</th>
                                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {statement?.transactions.filter(t => t.type !== 'payment').map((t) => (
                                                <tr key={`${t.type}-${t.id}`} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                        {format(new Date(t.date), 'dd/MM/yyyy')}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            {getIcon(t.type)}
                                                            <span className="text-xs font-medium text-gray-700">{getTypeName(t.type)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-800">
                                                        {t.description}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-500 italic">
                                                        {t.reference || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-xs text-gray-400">
                                                        {t.exchange_rate?.toFixed(2) || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                                                        {formatCurrency(t.amount)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-sm text-gray-600">
                                                        Bs {t.amount_bs?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase ${getStatusClass(t.status || '')}`}>
                                                            {getStatusLabel(t.status || '')}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {statement?.transactions.filter(t => t.type !== 'payment').length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                                        No hay compras o gastos registrados.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Table 2: Payments */}
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <Receipt className="w-5 h-5 text-emerald-600" />
                                    <h3 className="text-lg font-bold text-slate-800">Pagos Realizados</h3>
                                </div>
                                <div className="border rounded-xl overflow-hidden shadow-sm">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Descripción</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ref / Método</th>
                                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Tasa</th>
                                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Monto Divisa</th>
                                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Monto Bs</th>
                                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {statement?.transactions.filter(t => t.type === 'payment').map((t) => (
                                                <tr key={`${t.type}-${t.id}`} className="hover:bg-emerald-50/30 transition-colors">
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                        {format(new Date(t.date), 'dd/MM/yyyy')}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-800">
                                                        {t.description}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-500 italic">
                                                        {t.reference || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-xs text-gray-400">
                                                        {t.exchange_rate?.toFixed(2) || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-sm font-bold text-emerald-600">
                                                        {formatCurrency(t.amount)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-sm text-emerald-700">
                                                        Bs {t.amount_bs?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase ${getStatusClass(t.status || '')}`}>
                                                            {getStatusLabel(t.status || '')}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {statement?.transactions.filter(t => t.type === 'payment').length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                                        No hay pagos registrados para este periodo.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
                
                <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-bold hover:bg-gray-900 transition-all active:scale-95">
                        <Download size={16} /> Descargar Reporte
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProviderStatementModal;
