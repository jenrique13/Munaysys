import React, { useState, useEffect, useMemo } from 'react';
import { X, Receipt as ReceiptIcon, Search, DollarSign, AlertCircle, FileText } from 'lucide-react';
import { financialService } from '../services/financial.service';
import type { PaymentMethod, ClientStatement } from '../types';
import { useSystemStore } from '../../system/hooks/useSystemStore';
import { formatBs } from '../../../utils/format';

interface ClientPaymentModalProps {
    clientId: number;
    clientName: string;
    branchId: number;
    onClose: () => void;
    onSuccess: () => void;
}

export const ClientPaymentModal: React.FC<ClientPaymentModalProps> = ({ clientId, clientName, branchId, onClose, onSuccess }) => {
    const { bcvRateUsd, bcvRateEur } = useSystemStore();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [statement, setStatement] = useState<ClientStatement | null>(null);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

    const [paymentType, setPaymentType] = useState<'full' | 'partial'>('full');
    const [amount, setAmount] = useState<number>(0);
    const [selectedMethod, setSelectedMethod] = useState<string>('');
    const [reference, setReference] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    // IGTF and Currency logic
    const [refCurrency, setRefCurrency] = useState<'usd' | 'eur'>('usd');
    const [customRate, setCustomRate] = useState<number>(0);
    const [applyIGTF, setApplyIGTF] = useState(false);

    useEffect(() => {
        const rate = refCurrency === 'usd' ? bcvRateUsd : bcvRateEur;
        setCustomRate(rate || 0);
    }, [refCurrency, bcvRateUsd, bcvRateEur]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [stmt, methods] = await Promise.all([
                    financialService.getClientStatement(clientId),
                    financialService.getPaymentMethods(branchId)
                ]);
                setStatement(stmt);
                setPaymentMethods(methods);

                if (methods.length > 0) {
                    const defaultMethod = methods.find(m => m.is_active)?.name || methods[0].name;
                    setSelectedMethod(defaultMethod);
                }
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Error al cargar datos del cliente');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [clientId, branchId]);

    const pendingOrders = useMemo(() => {
        if (!statement) return [];
        return statement.orders
            .filter(o => o.status === 'pending' || o.status === 'partial')
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [statement]);

    const totalDebt = useMemo(() => {
        return pendingOrders.reduce((sum, order) => {
            const paid = order.receipts?.reduce((acc, r) => acc + r.amount, 0) || 0;
            return sum + (order.total - paid);
        }, 0);
    }, [pendingOrders]);

    useEffect(() => {
        if (paymentType === 'full') {
            setAmount(totalDebt);
        }
    }, [paymentType, totalDebt]);

    const isIGTFMethod = [
        'EFECTIVO $',
        'ZELLE',
        'BANESCO (Panama)',
        'PAY PALL',
        'BANK OF AMERICAN'
    ].includes(selectedMethod);

    const igtf_amount = (applyIGTF && isIGTFMethod) ? amount * 0.03 : 0;
    const totalToPay = amount + igtf_amount;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (amount <= 0) {
            setError('El monto debe ser mayor a 0');
            return;
        }

        if (amount > totalDebt + 0.01) { // Float tolerance
            setError('El monto no puede ser mayor a la deuda total');
            return;
        }

        try {
            setSubmitting(true);
            await financialService.createClientPayment({
                client_id: clientId,
                amount: amount,
                payment_method: selectedMethod,
                reference: reference,
                igtf_amount: igtf_amount,
                exchange_rate: customRate,
                exchange_currency: refCurrency
            });
            onSuccess();
        } catch (err: any) {
            //todo
            setError(err)
            alert(err)
            console.log(err)
            //==================================
            setError(err.response?.data?.detail || 'Error al procesar el pago');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
                <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center z-10">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-slate-500 font-bold">Cargando estado de cuenta...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl z-10 flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
                    <div>
                        <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                            <ReceiptIcon size={18} /> Registrar Pago (Consolidado)
                        </h2>
                        <p className="text-gray-500 text-xs mt-0.5 font-medium">Cliente: <span className="text-gray-700 font-bold">{clientName}</span></p>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:bg-gray-100 p-1 rounded-full">
                        <X size={18} />
                    </button>
                </div>

                {error && (
                    <div className="mx-6 mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 border border-red-100 text-sm">
                        <AlertCircle size={16} />
                        <span className="font-bold">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden min-h-0 flex-1">
                    <div className="flex flex-col md:flex-row overflow-y-auto min-h-0">

                        {/* Columna Izquierda: Resumen */}
                        <div className="w-full md:w-1/2 p-5 lg:p-6 bg-slate-50/50 border-r border-gray-100 flex flex-col">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Resumen de la Deuda</h3>

                            <div className="bg-white shadow-sm text-blue-900 text-xs p-5 rounded-xl border border-blue-100/60 flex-1 flex flex-col">

                                {/* Detalles de Deuda (Scrollable if many orders) */}
                                <div className="flex-1 overflow-y-auto mb-4 pr-1 space-y-2 border-b border-blue-200/60 pb-4">
                                    {pendingOrders.length === 0 ? (
                                        <p className="text-gray-400 text-center italic">No hay órdenes pendientes.</p>
                                    ) : (
                                        pendingOrders.map(order => {
                                            const paid = order.receipts?.reduce((acc, r) => acc + r.amount, 0) || 0;
                                            const debt = order.total - paid;
                                            return (
                                                <div key={order.id} className="flex justify-between items-center bg-blue-50/30 p-2 rounded">
                                                    <div>
                                                        <span className="font-bold">ORD-{order.id}</span>
                                                        <span className="text-[10px] text-gray-500 ml-2">{new Date(order.date).toLocaleDateString()}</span>
                                                    </div>
                                                    <span className="font-bold text-gray-700">€{debt.toFixed(2)}</span>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                <div className="flex justify-between mb-4 pb-4 border-b border-blue-200/60">
                                    <span>Deuda Total Restante:</span>
                                    <div className="text-right">
                                        <span className="font-bold text-base block">€{totalDebt.toFixed(2)}</span>
                                        <span className="text-[10px] opacity-70">{formatBs(totalDebt, customRate)}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between pt-3 mt-3">
                                    <span>Abono a Deuda (Neto):</span>
                                    <div className="text-right">
                                        <span className="font-bold text-gray-700 block">€{amount.toFixed(2)}</span>
                                        <span className="text-[10px] text-gray-500">{formatBs(amount, customRate)}</span>
                                    </div>
                                </div>

                                {applyIGTF && isIGTFMethod && (
                                    <div className="flex justify-between text-orange-600 font-bold mt-4 pt-4 border-t border-orange-200 border-dashed">
                                        <span>+ IGTF (3% de €{amount.toFixed(2)}):</span>
                                        <div className="text-right">
                                            <span className="block">€{igtf_amount.toFixed(2)}</span>
                                            <span className="text-[10px] opacity-80">{formatBs(igtf_amount, customRate)}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-between border-t border-blue-200/60 mt-4 pt-4 text-sm bg-blue-50/50 -mx-5 px-5 pb-3 rounded-b-xl border-dashed">
                                    <span className="font-bold mt-1">TOTAL A COBRAR:</span>
                                    <div className="text-right">
                                        <span className="font-black text-blue-900 text-xl block">
                                            €{totalToPay.toFixed(2)}
                                        </span>
                                        <span className="text-xs font-bold text-blue-700">
                                            {formatBs(totalToPay, customRate)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Columna Derecha: Formulario */}
                        <div className="w-full md:w-1/2 p-5 lg:p-6 space-y-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Detalles del Pago</h3>

                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <label className={`cursor-pointer flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${paymentType === 'full'
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                                        : 'border-gray-200 bg-white text-gray-500 hover:border-indigo-200'
                                    }`}>
                                    <input type="radio" name="ptype" checked={paymentType === 'full'} onChange={() => setPaymentType('full')} className="sr-only" />
                                    <span className="font-bold text-xs">Pago Total</span>
                                </label>
                                <label className={`cursor-pointer flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${paymentType === 'partial'
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                                        : 'border-gray-200 bg-white text-gray-500 hover:border-indigo-200'
                                    }`}>
                                    <input type="radio" name="ptype" checked={paymentType === 'partial'} onChange={() => setPaymentType('partial')} className="sr-only" />
                                    <span className="font-bold text-xs">Abono Parcial</span>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Monto a abonar (€)</label>
                                <input
                                    type="number" step="0.01" max={totalDebt} required
                                    value={amount}
                                    onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                                    disabled={paymentType === 'full'}
                                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-lg font-bold text-indigo-700 bg-indigo-50/30 disabled:opacity-50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                                <select
                                    value={selectedMethod}
                                    onChange={e => setSelectedMethod(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    {paymentMethods.filter(m => m.is_active).map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                                    {paymentMethods.filter(m => m.is_active).length === 0 && <option value="Efectivo">Efectivo (Default)</option>}
                                </select>
                            </div>

                            <div className="flex items-start gap-2 p-3 bg-orange-50/50 border border-orange-100 rounded-lg">
                                <input
                                    type="checkbox"
                                    id="apply-igtf-order"
                                    checked={applyIGTF && isIGTFMethod}
                                    disabled={!isIGTFMethod}
                                    onChange={e => setApplyIGTF(e.target.checked)}
                                    className="mt-0.5 w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <label htmlFor="apply-igtf-order" className={`text-sm font-bold cursor-pointer select-none leading-snug ${!isIGTFMethod ? 'text-gray-400' : 'text-orange-800'}`}>
                                    Aplicar IGTF (3%)
                                    {!isIGTFMethod && <span className="block text-[10px] font-normal text-gray-400 italic mt-0.5">Solo aplica para divisas / métodos internacionales</span>}
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Referencia (Opcional)</label>
                                <input
                                    value={reference} onChange={e => setReference(e.target.value)}
                                    placeholder="Nro de recibo o transferencia..."
                                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                />
                            </div>

                            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">Tasa de Cambio Manual</label>
                                <div className="flex gap-2 mb-3">
                                    <button type="button" onClick={() => setRefCurrency('usd')} className={`flex-1 py-1.5 rounded-md text-xs font-bold transition ${refCurrency === 'usd' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}>Dólar (USD)</button>
                                    <button type="button" onClick={() => setRefCurrency('eur')} className={`flex-1 py-1.5 rounded-md text-xs font-bold transition ${refCurrency === 'eur' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}>Euro (EUR)</button>
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
                        <button disabled={submitting || amount <= 0 || totalDebt === 0} type="submit" className="px-6 py-2.5 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm">
                            {submitting ? 'Procesando...' : 'Confirmar y Registrar Pago'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
