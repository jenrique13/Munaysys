import React from 'react';
// import { X, Calendar, Hash, MapPin, Tag, Receipt as ReceiptIcon, DollarSign, Clock } from 'lucide-react';
import { X, Calendar, Hash, MapPin, Tag, Receipt as ReceiptIcon, Clock } from 'lucide-react';
import type { Orden } from '../types';

interface OrderDetailsModalProps {
    order: Orden | null;
    isOpen: boolean;
    onClose: () => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ order, isOpen, onClose }) => {
    if (!isOpen || !order) return null;

    const totalReceipts = order.receipts.reduce((sum, r) => sum + Number(r.amount) + Number(r.igtf_amount || 0), 0);
    const difference = Math.max(0, order.total - totalReceipts);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <ReceiptIcon size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Detalle de Orden</h3>
                            <p className="text-indigo-100 text-xs font-medium">ORD-{order.id.toString().padStart(5, '0')}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 space-y-8">
                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <Calendar size={10} /> Fecha
                            </span>
                            <p className="text-sm font-semibold text-slate-700">{new Date(order.date).toLocaleDateString()}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <MapPin size={10} /> Sede
                            </span>
                            <p className="text-sm font-semibold text-slate-700 truncate">{(order as any).branch?.name || '---'}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <Tag size={10} /> Estado
                            </span>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${order.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                order.status === 'partial' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                {order.status}
                            </span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <Hash size={10} /> ID Ref
                            </span>
                            <p className="text-sm font-semibold text-slate-700">{order.id}</p>
                        </div>
                    </div>

                    {/* Table Details */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Resumen de Ítems</h4>
                        <div className="border rounded-xl overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase">
                                    <tr>
                                        <th className="py-2.5 px-4 w-12">Cant.</th>
                                        <th className="py-2.5 px-4">Descripción</th>
                                        <th className="py-2.5 px-4 text-right">Unit.</th>
                                        <th className="py-2.5 px-4 text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {order.details.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3 px-4 font-medium text-slate-600">{item.quantity}</td>
                                            <td className="py-3 px-4 text-slate-800">
                                                <div className="font-semibold">{item.item_name || item.itemName || '---'}</div>
                                                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                    <Tag size={10} /> {item.item_type}
                                                    {item.start_time && (
                                                        <>
                                                            <Clock size={10} className="ml-2" />
                                                            {new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-right text-slate-600">€{item.unit_price.toFixed(2)}</td>
                                            <td className="py-3 px-4 text-right font-bold text-slate-900">€{item.subtotal.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Totals & Receipts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Receipts (Abonos) */}
                        <div className="flex flex-col justify-between h-full">
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Abonos Aplicados</h4>
                                <div className="space-y-2 max-h-[180px] overflow-auto pr-1">
                                    {order.receipts.length === 0 ? (
                                        <div className="text-slate-400 text-xs italic bg-slate-50 p-4 rounded-xl border border-dashed text-center">
                                            No se han registrado pagos para esta orden.
                                        </div>
                                    ) : (
                                        order.receipts.map(r => (
                                            <div key={r.id} className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                                                <div>
                                                    <p className="text-xs font-bold text-emerald-800">
                                                        {typeof r.payment_method === 'object' ? (r.payment_method as any).name : r.payment_method}
                                                    </p>
                                                    <p className="text-[10px] text-emerald-600 mt-0.5">{new Date(r.date).toLocaleDateString()} · {r.reference || 'N/A'}</p>
                                                </div>
                                                <p className="font-bold text-emerald-700 text-sm">€{r.amount.toFixed(2)}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2.5">
                                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                                    <span>Total Abonado</span>
                                    <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">€{totalReceipts.toFixed(2)}</span>
                                </div>
                                {difference > 0.009 && (
                                    <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                                        <span className="text-rose-600 font-bold uppercase tracking-wider text-[10px]">Diferencia Faltante</span>
                                        <span className="text-sm font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-100">€{difference.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-end">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>Subtotal</span>
                                    <span>€{order.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>Impuestos (16%)</span>
                                    <span>€{order.tax.toFixed(2)}</span>
                                </div>
                                {order.discount > 0 && (
                                    <div className="flex justify-between text-xs text-red-500 font-medium">
                                        <span>Descuento</span>
                                        <span>-€{order.discount.toFixed(2)}</span>
                                    </div>
                                )}
                                {(order.igtf_amount && order.igtf_amount > 0) ? (
                                    <div className="flex justify-between text-xs text-slate-500">
                                        <span>Impuestos (IGTF 3%)</span>
                                        <span>€{order.igtf_amount.toFixed(2)}</span>
                                    </div>
                                ) : null}
                                <div className="h-px bg-slate-200 my-2"></div>
                                <div className="flex justify-between items-center pt-1">
                                    <span className="font-bold text-slate-800 text-base">Total Orden</span>
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-indigo-600">€{order.total.toFixed(2)}</div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Euros (Moneda Base)</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 shrink-0 border-t border-slate-200">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                        Cerrar
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md active:scale-95"
                    >
                        <ReceiptIcon size={16} /> Ver Ticket
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsModal;
