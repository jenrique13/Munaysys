import React, { useEffect, useState } from 'react';
import { useOperativeStore } from '../../operative/hooks/useOperativeStore';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useFinancialStore } from '../hooks/useFinancialStore';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { useSystemStore } from '../../system/hooks/useSystemStore';
import { Receipt, Search, FileText, Download, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import OrderDetailsModal from '../components/OrderDetailsModal';
import { financialService } from '../services/financial.service';
import type { Orden } from '../types';

const BillingPage: React.FC = () => {
    const { clients, fetchClients } = useOperativeStore();
    const { fetchClientStatement, clientStatement, isLoading } = useFinancialStore();
    const { selectedBranchId } = useAuthStore();
    const { bcvRateUsd } = useSystemStore();

    const [search, setSearch] = useState('');
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const clientIdParam = searchParams.get('client_id');

    const [statusFilter, setStatusFilter] = useState('all'); // all, paid, pending
    const [monthFilter, setMonthFilter] = useState('all'); // YYYY-MM

    // Preview Detail Store
    const [selectedOrderForPreview, setSelectedOrderForPreview] = useState<Orden | null>(null);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);

    const selectedClient = clients.find(c => c.id === selectedClientId);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchClients(selectedBranchId ?? undefined, search || undefined);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [search, selectedBranchId]);

    useEffect(() => {
        if (clientIdParam) {
            setSelectedClientId(parseInt(clientIdParam));
        }
    }, [clientIdParam]);

    useEffect(() => {
        if (selectedClientId) {
            let month, year;
            if (monthFilter !== 'all') {
                const [y, m] = monthFilter.split('-').map(Number);
                year = y;
                month = m;
            }
            fetchClientStatement(selectedClientId, month, year);
        }
    }, [selectedClientId, monthFilter, fetchClientStatement]);

    const months = Array.from({ length: 12 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return {
            value: `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`,
            label: d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
        };
    });

    const filteredClients = clients; // Already filtered by server

    // Since we are now filtering in the backend, visibleOrders and visibleReceipts 
    // are just the ones from the statement, but we keep the status filter locally
    const visibleOrders = [...(clientStatement?.orders.filter(o => {
        const matchesStatus = statusFilter === 'all' || 
            (statusFilter === 'paid' && o.status === 'paid') ||
            (statusFilter === 'pending' && (o.status === 'pending' || o.status === 'partial'));
        return matchesStatus;
    }) || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const visibleReceipts = [...(clientStatement?.receipts || [])].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const visibleAmenities = clientStatement?.amenities || [];
    const visibleHistory = clientStatement?.amenity_history || [];

    const handlePrint = () => {
        window.print();
    };

    const handleOrderClick = async (orderId: number) => {
        setIsPreviewLoading(true);
        try {
            const data = await financialService.getOrder(orderId);
            setSelectedOrderForPreview(data);
            setIsPreviewModalOpen(true);
        } catch (err) {
            console.error("Error fetching order details", err);
        } finally {
            setIsPreviewLoading(false);
        }
    };

    return (
        <div className="flex h-full bg-gray-50/30 overflow-hidden print:bg-white">

            {/* Sidebar de Clientes (Se oculta al imprimir) */}
            <div className="w-80 border-r bg-white flex flex-col shrink-0 print:hidden relative">
                <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                    <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                        <Receipt size={18} className="text-indigo-600" /> Estado de Cuenta
                    </h2>
                </div>
                <div className="p-4 border-b bg-white">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente..."
                            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition" />
                    </div>
                </div>
                <div className="flex-1 overflow-auto">
                    <ul className="divide-y divide-gray-100">
                        {filteredClients.map(c => (
                            <li key={c.id}>
                                <button
                                    onClick={() => setSelectedClientId(c.id)}
                                    className={`w-full text-left p-4 hover:bg-indigo-50/50 transition-colors ${selectedClientId === c.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : 'border-l-4 border-transparent'}`}
                                >
                                    <div className="font-medium text-gray-800 text-sm">{c.name}</div>
                                    <div className="text-xs text-gray-500 mt-1 truncate">{c.email || 'Sin email'}</div>
                                </button>
                            </li>
                        ))}
                        {filteredClients.length === 0 && (
                            <li className="p-8 text-center text-gray-400 text-sm">No se encontraron clientes.</li>
                        )}
                    </ul>
                </div>
            </div>

            {/* Contenido Principal (Documento del Estado de Cuenta) */}
            <div className="flex-1 overflow-auto p-8 relative">
                {!selectedClientId ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 print:hidden">
                        <FileText size={48} className="mb-4 opacity-20" />
                        <p>Selecciona un cliente para ver su estado de cuenta.</p>
                    </div>
                ) : isLoading || !clientStatement ? (
                    <div className="h-full flex items-center justify-center text-gray-400">Cargando estado de cuenta...</div>
                ) : (
                    <div className="max-w-4xl mx-auto bg-white p-10 rounded-xl shadow-sm border border-gray-200 print:shadow-none print:border-none print:p-0">

                        {/* Cabecera del Documento */}
                        <div className="flex justify-between items-start border-b pb-8 mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">Estado de Cuenta</h1>
                                <p className="text-gray-500">Fecha de emisión: {new Date().toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                                <h3 className="text-xl font-bold text-indigo-700">Nest Coworking</h3>
                                <p className="text-gray-500 text-sm mt-1">{selectedClient?.branch?.name || 'Sede Principal'}</p>
                                <div className="mt-4 flex flex-col md:flex-row gap-2 justify-end">
                                    <button onClick={() => {
                                        import('../../../utils/exportToCSV').then(({ exportToCSV }) => {
                                            const sortedOrders = [...clientStatement.orders].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                                            const sortedReceipts = [...clientStatement.receipts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                                            const exportData = sortedOrders.map(o => ({
                                                Fecha: new Date(o.date).toLocaleDateString(),
                                                Referencia: `ORD-${o.id}`,
                                                Tipo: 'Cargo',
                                                Estado: o.status,
                                                Monto: o.total
                                            })).concat(sortedReceipts.map(r => ({
                                                Fecha: new Date(r.date).toLocaleDateString(),
                                                Referencia: r.orden_id ? `ORD-${r.orden_id}` : 'General',
                                                Tipo: 'Abono',
                                                Estado: 'Aplicado' as any,
                                                Monto: -r.amount
                                            })));
                                            exportToCSV(exportData, `edo_cuenta_cliente_${selectedClientId}`);
                                        });
                                    }} className="inline-flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors print:hidden">
                                        <Download size={14} /> Exportar CSV
                                    </button>
                                    <button onClick={handlePrint} className="inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors print:hidden">
                                        <Download size={14} /> Imprimir PDF
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Info Cliente & Resumen */}
                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Información del Cliente</h3>
                                <div className="space-y-2">
                                    <p className="text-lg font-bold text-gray-800">{selectedClient?.name}</p>
                                    {selectedClient?.ci_rif && (
                                        <p className="text-sm text-gray-700">
                                            <span className="font-bold text-gray-400 uppercase tracking-wider text-xs mr-1">CI/RIF:</span>
                                            {selectedClient.ci_rif}
                                        </p>
                                    )}
                                    <p className="text-sm text-gray-600">{selectedClient?.email}</p>
                                    <p className="text-sm text-gray-600">{selectedClient?.phone}</p>
                                </div>
                            </div>

                            <div className={`p-6 rounded-xl border ${clientStatement.balance > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'} flex flex-col justify-center items-center text-center`}>
                                <h3 className="text-xs font-bold uppercase tracking-widest mb-2 opacity-70">Saldo Deudor Actual</h3>
                                <div className="text-4xl font-bold mb-1">
                                    ${Number(clientStatement.balance).toFixed(2)}
                                </div>
                                {bcvRateUsd && (
                                    <div className="text-lg text-gray-500 font-medium mb-2">
                                        Bs {(Number(clientStatement.balance) * (bcvRateUsd || 0)).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                    </div>
                                )}
                                {clientStatement.balance <= 0 ? (
                                    <div className="text-emerald-600 font-medium text-sm flex items-center justify-center gap-1.5"><CheckCircle size={16} /> Cuenta al día</div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="text-red-600 font-medium text-sm flex items-center justify-center gap-1.5"><AlertTriangle size={16} /> Pagos pendientes</div>
                                        <button 
                                            onClick={() => navigate(`/orders?client_id=${selectedClientId}&status=pending`)}
                                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors print:hidden"
                                        >
                                            Ir a Cobrar Deuda
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Filtros de Estado de Cuenta */}
                        <div className="flex gap-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100 print:hidden text-sm">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Filtrar por Mes</label>
                                <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)}
                                    className="w-full bg-white border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500">
                                    <option value="all">Todo el historial</option>
                                    {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Estado de Órdenes</label>
                                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                                    className="w-full bg-white border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500">
                                    <option value="all">Todas las órdenes</option>
                                    <option value="paid">Solo Pagadas</option>
                                    <option value="pending">Solo con Deuda</option>
                                </select>
                            </div>
                        </div>

                        {/* Listado de Facturación (Órdenes) */}
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Facturación (Cargos)</h3>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-500 hidden md:table-header-group">
                                    <tr>
                                        <th className="py-2 px-3 font-semibold rounded-l-lg">Fecha</th>
                                        <th className="py-2 px-3 font-semibold">Orden #</th>
                                        <th className="py-2 px-3 font-semibold">Sede</th>
                                        <th className="py-2 px-3 font-semibold">Estado</th>
                                        <th className="py-2 px-3 font-semibold text-right rounded-r-lg">Monto Cargo ($)</th>
                                    </tr>
                                </thead>
                                <tbody className="flex flex-col md:table-row-group gap-4 md:gap-0">
                                    {visibleOrders.length === 0 ? (
                                        <tr><td colSpan={5} className="py-4 text-center text-gray-400">No se encontraron órdenes con estos filtros.</td></tr>
                                    ) : visibleOrders.map(o => (
                                        <tr 
                                            key={o.id} 
                                            onClick={() => handleOrderClick(o.id)}
                                            className="border border-gray-200 md:border-b md:border-t-0 md:border-l-0 md:border-r-0 border-gray-50 last:border-0 hover:bg-indigo-50/50 cursor-pointer transition-all active:bg-indigo-100 group flex flex-col md:table-row rounded-xl md:rounded-none p-4 md:p-0 shadow-sm md:shadow-none bg-white"
                                        >
                                            <td className="py-2 md:py-3 px-0 md:px-3 text-gray-600 flex justify-between md:table-cell border-b md:border-0 border-gray-100">
                                                <span className="md:hidden font-bold text-xs text-gray-400 uppercase">Fecha</span>
                                                <div className="flex items-center gap-2">
                                                    {new Date(o.date).toLocaleDateString()}
                                                    {isPreviewLoading && selectedOrderForPreview?.id === o.id && (
                                                        <Loader2 size={12} className="animate-spin text-indigo-500" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-2 md:py-3 px-0 md:px-3 font-medium text-gray-800 group-hover:text-indigo-600 flex justify-between md:table-cell border-b md:border-0 border-gray-100">
                                                <span className="md:hidden font-bold text-xs text-gray-400 uppercase">Orden #</span>
                                                ORD-{o.id.toString().padStart(5, '0')}
                                            </td>
                                            <td className="py-2 md:py-3 px-0 md:px-3 text-gray-500 text-xs flex justify-between md:table-cell border-b md:border-0 border-gray-100">
                                                <span className="md:hidden font-bold text-xs text-gray-400 uppercase">Sede</span>
                                                {(o as any).branch?.name || '---'}
                                            </td>
                                            <td className="py-2 md:py-3 px-0 md:px-3 capitalize text-gray-500 flex justify-between md:table-cell border-b md:border-0 border-gray-100">
                                                <span className="md:hidden font-bold text-xs text-gray-400 uppercase">Estado</span>
                                                {o.status}
                                            </td>
                                            <td className="py-2 md:py-3 px-0 md:px-3 font-bold text-gray-900 text-right text-base flex justify-between md:table-cell mt-2 md:mt-0">
                                                <span className="md:hidden font-bold text-xs text-gray-400 uppercase">Monto</span>
                                                ${o.total.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="text-right pt-2 mt-2">
                                <span className="text-gray-500 font-medium mr-4">Total Cargos:</span>
                                <span className="text-lg font-bold text-gray-900">${clientStatement.total_charges.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Listado de Pagos Reales */}
                        <div className="mb-8 overflow-hidden">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Abonos (Pagos)</h3>
                            <table className="w-full text-left text-sm table-fixed md:table-auto">
                                <thead className="bg-emerald-50 text-emerald-700 hidden md:table-header-group">
                                    <tr>
                                        <th className="py-2 px-3 font-semibold rounded-l-lg w-24">Fecha</th>
                                        <th className="py-2 px-3 font-semibold w-24">Orden</th>
                                        <th className="py-2 px-3 font-semibold">Método / Ref</th>
                                        <th className="py-2 px-3 font-semibold text-right w-24">Tasa</th>
                                        <th className="py-2 px-3 font-semibold text-right w-32">Monto Divisa</th>
                                        <th className="py-2 px-3 font-semibold text-right rounded-r-lg w-32">Monto Bs</th>
                                    </tr>
                                </thead>
                                <tbody className="flex flex-col md:table-row-group gap-4 md:gap-0">
                                    {visibleReceipts.length === 0 ? (
                                        <tr><td colSpan={6} className="py-4 text-center text-gray-400">No se encontraron abonos con estos filtros.</td></tr>
                                    ) : visibleReceipts.map(r => (
                                        <tr key={r.id} className="border border-emerald-100 md:border-b md:border-t-0 md:border-l-0 md:border-r-0 border-gray-50 last:border-0 hover:bg-emerald-50/30 flex flex-col md:table-row rounded-xl md:rounded-none p-4 md:p-0 shadow-sm md:shadow-none bg-white">
                                            <td className="py-2 md:py-3 px-0 md:px-3 text-gray-600 flex justify-between md:table-cell border-b md:border-0 border-gray-100">
                                                <span className="md:hidden font-bold text-xs text-emerald-600 uppercase">Fecha</span>
                                                {new Date(r.date).toLocaleDateString()}
                                            </td>
                                            <td className="py-2 md:py-3 px-0 md:px-3 font-medium text-gray-800 flex justify-between md:table-cell border-b md:border-0 border-gray-100">
                                                <span className="md:hidden font-bold text-xs text-emerald-600 uppercase">Orden</span>
                                                {r.orden_id ? `ORD-${r.orden_id.toString().padStart(4, '0')}` : 'Gral'}
                                            </td>
                                            <td className="py-2 md:py-3 px-0 md:px-3 text-gray-600 flex flex-col md:flex-row md:items-center justify-between md:table-cell border-b md:border-0 border-gray-100 truncate">
                                                <span className="md:hidden font-bold text-xs text-emerald-600 uppercase mb-1">Método / Ref</span>
                                                <div>
                                                    {typeof r.payment_method === 'object' ? (r.payment_method as any).name : r.payment_method} 
                                                    <span className="text-gray-400 text-xs ml-1">({r.reference || 'N/A'})</span>
                                                </div>
                                            </td>
                                            <td className="py-2 md:py-3 px-0 md:px-3 text-right text-xs text-gray-500 flex justify-between md:table-cell border-b md:border-0 border-gray-100">
                                                <span className="md:hidden font-bold text-xs text-emerald-600 uppercase">Tasa</span>
                                                {r.exchange_rate ? r.exchange_rate.toFixed(2) : '---'}
                                            </td>
                                            <td className="py-2 md:py-3 px-0 md:px-3 font-bold text-emerald-600 text-right whitespace-nowrap flex justify-between md:table-cell border-b md:border-0 border-gray-100 mt-2 md:mt-0">
                                                <span className="md:hidden font-bold text-xs text-emerald-600 uppercase">Monto Divisa</span>
                                                <div>
                                                    {r.exchange_currency?.toLowerCase() === 'eur' ? '€' : '$'}
                                                    {r.amount.toFixed(2)}
                                                </div>
                                            </td>
                                            <td className="py-2 md:py-3 px-0 md:px-3 font-bold text-gray-700 text-right whitespace-nowrap flex justify-between md:table-cell mt-1 md:mt-0">
                                                <span className="md:hidden font-bold text-xs text-emerald-600 uppercase">Monto Bs</span>
                                                <div>
                                                    Bs {(r.amount * (r.exchange_rate || 1)).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="text-right pt-2 mt-2">
                                <span className="text-gray-500 font-medium mr-4">Total Abonado:</span>
                                <span className="text-lg font-bold text-emerald-600">${clientStatement.total_paid.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Amenidades Disponibles */}
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Amenidades Disponibles</h3>
                            {visibleAmenities.length === 0 ? (
                                <p className="py-4 text-center text-gray-400 text-sm italic">El cliente no cuenta con amenidades activas en este momento.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {visibleAmenities.map(a => (
                                        <div key={a.id} className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl flex justify-between items-center">
                                            <div>
                                                <div className="font-bold text-indigo-900">{a.name}</div>
                                                <div className="text-xs text-indigo-500 capitalize">{a.category || 'General'}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-black text-indigo-600">{a.quantity}</div>
                                                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">{a.unit || 'Unidades'}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Historial de Uso de Amenidades */}
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Historial de Uso de Amenidades</h3>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-indigo-50 text-indigo-700 hidden md:table-header-group">
                                    <tr>
                                        <th className="py-2 px-3 font-semibold rounded-l-lg">Fecha</th>
                                        <th className="py-2 px-3 font-semibold">Amenidad</th>
                                        <th className="py-2 px-3 font-semibold">Concepto / Motivo</th>
                                        <th className="py-2 px-3 font-semibold text-right rounded-r-lg">Consumo</th>
                                    </tr>
                                </thead>
                                <tbody className="flex flex-col md:table-row-group gap-4 md:gap-0">
                                    {visibleHistory.length === 0 ? (
                                        <tr><td colSpan={4} className="py-4 text-center text-gray-400 italic">No hay historial de uso para este periodo.</td></tr>
                                    ) : visibleHistory.map(h => (
                                        <tr key={h.id} className="border border-indigo-100 md:border-b md:border-t-0 md:border-l-0 md:border-r-0 border-gray-50 last:border-0 hover:bg-indigo-50/30 flex flex-col md:table-row rounded-xl md:rounded-none p-4 md:p-0 shadow-sm md:shadow-none bg-white">
                                            <td className="py-2 md:py-3 px-0 md:px-3 text-gray-600 flex justify-between md:table-cell border-b md:border-0 border-gray-100">
                                                <span className="md:hidden font-bold text-xs text-indigo-400 uppercase">Fecha</span>
                                                {new Date(h.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="py-2 md:py-3 px-0 md:px-3 font-medium text-gray-800 flex justify-between md:table-cell border-b md:border-0 border-gray-100">
                                                <span className="md:hidden font-bold text-xs text-indigo-400 uppercase">Amenidad</span>
                                                {h.amenity?.name || 'Amenidad'}
                                            </td>
                                            <td className="py-2 md:py-3 px-0 md:px-3 text-gray-500 text-xs flex flex-col md:flex-row md:items-center justify-between md:table-cell border-b md:border-0 border-gray-100">
                                                <span className="md:hidden font-bold text-xs text-indigo-400 uppercase mb-1">Concepto / Motivo</span>
                                                {h.reason || 'Consumo regular'}
                                            </td>
                                            <td className={`py-2 md:py-3 px-0 md:px-3 font-bold text-right flex justify-between md:table-cell mt-2 md:mt-0 ${h.change < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                <span className="md:hidden font-bold text-xs text-indigo-400 uppercase">Consumo</span>
                                                <div>
                                                    {h.change > 0 ? '+' : ''}{h.change}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pie de documento */}
                        <div className="mt-16 pt-8 border-t text-center text-sm text-gray-400">
                            <p>Este documento es un comprobante interno de estado de cuenta comercial.</p>
                            <p className="mt-1">Si tiene dudas sobre los cargos, por favor contáctenos.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Detalle de Orden */}
            <OrderDetailsModal 
                order={selectedOrderForPreview}
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
            />
        </div>
    );
};

export default BillingPage;
