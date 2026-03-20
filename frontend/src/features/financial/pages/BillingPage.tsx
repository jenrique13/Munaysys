import React, { useEffect, useState } from 'react';
import { useOperativeStore } from '../../operative/hooks/useOperativeStore';
import { useFinancialStore } from '../hooks/useFinancialStore';
import { Receipt, Search, FileText, Download, CheckCircle, AlertTriangle } from 'lucide-react';

const BillingPage: React.FC = () => {
    const { clients, fetchClients } = useOperativeStore();
    const { fetchClientStatement, clientStatement, isLoading } = useFinancialStore();

    const [search, setSearch] = useState('');
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

    useEffect(() => {
        fetchClients();
    }, []);

    useEffect(() => {
        if (selectedClientId) {
            fetchClientStatement(selectedClientId);
        }
    }, [selectedClientId]);

    const filteredClients = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

    const handlePrint = () => {
        window.print();
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
                                <p className="text-gray-500 text-sm mt-1">Sede Principal</p>
                                <div className="mt-4 flex flex-col md:flex-row gap-2 justify-end">
                                    <button onClick={() => {
                                        import('../../../utils/exportToCSV').then(({ exportToCSV }) => {
                                            const exportData = clientStatement.orders.map(o => ({
                                                Fecha: new Date(o.date).toLocaleDateString(),
                                                Referencia: `ORD-${o.id}`,
                                                Tipo: 'Cargo',
                                                Estado: o.status,
                                                Monto: o.total
                                            })).concat(clientStatement.receipts.map(r => ({
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
                                    <p className="text-lg font-bold text-gray-800">{clients.find(c => c.id === selectedClientId)?.name}</p>
                                    <p className="text-sm text-gray-600">{clients.find(c => c.id === selectedClientId)?.email}</p>
                                    <p className="text-sm text-gray-600">{clients.find(c => c.id === selectedClientId)?.phone}</p>
                                </div>
                            </div>

                            <div className={`p-6 rounded-xl border ${clientStatement.balance > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'} flex flex-col justify-center items-center text-center`}>
                                <h3 className="text-xs font-bold uppercase tracking-widest mb-2 opacity-70">Saldo Deudor Actual</h3>
                                <div className="text-4xl font-bold mb-2">
                                    ${Number(clientStatement.balance).toFixed(2)}
                                </div>
                                {clientStatement.balance <= 0 ? (
                                    <div className="text-emerald-600 font-medium text-sm flex items-center justify-center gap-1.5"><CheckCircle size={16} /> Cuenta al día</div>
                                ) : (
                                    <div className="text-red-600 font-medium text-sm flex items-center justify-center gap-1.5"><AlertTriangle size={16} /> Pagos pendientes</div>
                                )}
                            </div>
                        </div>

                        {/* Listado de Facturación (Órdenes) */}
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Facturación (Cargos)</h3>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-500">
                                    <tr>
                                        <th className="py-2 px-3 font-semibold rounded-l-lg">Fecha</th>
                                        <th className="py-2 px-3 font-semibold">Orden #</th>
                                        <th className="py-2 px-3 font-semibold">Sede</th>
                                        <th className="py-2 px-3 font-semibold">Estado</th>
                                        <th className="py-2 px-3 font-semibold text-right rounded-r-lg">Monto Cargo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clientStatement.orders.length === 0 ? (
                                        <tr><td colSpan={5} className="py-4 text-center text-gray-400">Sin historial de facturación.</td></tr>
                                    ) : clientStatement.orders.map(o => (
                                        <tr key={o.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                                            <td className="py-3 px-3 text-gray-600">{new Date(o.date).toLocaleDateString()}</td>
                                            <td className="py-3 px-3 font-medium text-gray-800">ORD-{o.id.toString().padStart(5, '0')}</td>
                                            <td className="py-3 px-3 text-gray-500 text-xs">{(o as any).branch?.name || '---'}</td>
                                            <td className="py-3 px-3 capitalize text-gray-500">{o.status}</td>
                                            <td className="py-3 px-3 font-bold text-gray-900 text-right text-base">${o.total.toFixed(2)}</td>
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
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Abonos (Pagos)</h3>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-emerald-50 text-emerald-700">
                                    <tr>
                                        <th className="py-2 px-3 font-semibold rounded-l-lg">Fecha</th>
                                        <th className="py-2 px-3 font-semibold">Ref. Orden</th>
                                        <th className="py-2 px-3 font-semibold">Sede</th>
                                        <th className="py-2 px-3 font-semibold">Método / Ref</th>
                                        <th className="py-2 px-3 font-semibold text-right rounded-r-lg">Monto Abonado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clientStatement.receipts.length === 0 ? (
                                        <tr><td colSpan={5} className="py-4 text-center text-gray-400">Sin abonos registrados.</td></tr>
                                    ) : clientStatement.receipts.map(r => (
                                        <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-emerald-50/30">
                                            <td className="py-3 px-3 text-gray-600">{new Date(r.date).toLocaleDateString()}</td>
                                            <td className="py-3 px-3 font-medium text-gray-800">{r.orden_id ? `ORD-${r.orden_id.toString().padStart(5, '0')}` : 'General'}</td>
                                            <td className="py-3 px-3 text-gray-500 text-xs">{(r as any).branch?.name || '---'}</td>
                                            <td className="py-3 px-3 text-gray-600">{r.payment_method} <span className="text-gray-400 text-xs ml-1">({r.reference || 'N/A'})</span></td>
                                            <td className="py-3 px-3 font-bold text-emerald-600 text-right text-base">+${r.amount.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="text-right pt-2 mt-2">
                                <span className="text-gray-500 font-medium mr-4">Total Abonado:</span>
                                <span className="text-lg font-bold text-emerald-600">${clientStatement.total_paid.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Pie de documento */}
                        <div className="mt-16 pt-8 border-t text-center text-sm text-gray-400">
                            <p>Este documento es un comprobante interno de estado de cuenta comercial.</p>
                            <p className="mt-1">Si tiene dudas sobre los cargos, por favor contáctenos.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BillingPage;
