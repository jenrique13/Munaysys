import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { useFinancialStore } from '../hooks/useFinancialStore';
import { useInventoryStore } from '../hooks/useInventoryStore';
import { useOperativeStore } from '../../operative/hooks/useOperativeStore';
import { useSystemStore } from '../../system/hooks/useSystemStore';
import { formatBs } from '../../../utils/format';
import { RoomBookingPicker } from '../components/RoomBookingPicker';
import { ClientPaymentModal } from '../components/ClientPaymentModal';
// import type { Orden, Pedido, Service } from '../types';
import type { Orden, Pedido } from '../types';
import type { Amenity, Client } from '../../operative/types';
import { operativeService } from '../../operative/services/operative.service';
import { ShoppingBag, Plus, Search, X, Receipt as ReceiptIcon, Download, Edit2, Trash2, History, Eye, Euro, Clock } from 'lucide-react';

const ReceiptEntry: React.FC<{ receipt: any }> = ({ receipt }) => {
    const paymentMethodName = typeof receipt.payment_method === 'object' ? receipt.payment_method.name : receipt.payment_method;
    const currency = receipt.exchange_currency?.toLowerCase() === 'eur' ? '€' : '$';
    const hasIGTF = receipt.igtf_amount && receipt.igtf_amount > 0;
    const baseAmount = Number(receipt.amount);

    return (
        <div className="flex justify-between items-center bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 text-sm">
            <div className="flex flex-col">
                <span className="font-semibold text-emerald-700">{paymentMethodName}</span>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    {receipt.reference && <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 rounded-full font-bold uppercase">Ref: {receipt.reference}</span>}
                    {receipt.exchange_rate && <span className="text-[10px] text-gray-400 font-medium">Tasa: {receipt.exchange_rate.toFixed(2)}</span>}
                    {hasIGTF && <span className="text-[10px] font-bold text-orange-600 uppercase border border-orange-200 bg-orange-50 px-1.5 rounded-full">+ IGTF</span>}
                </div>
                {hasIGTF && (
                     <span className="text-[10px] text-gray-500 font-medium mt-1">
                          Base: {currency}{baseAmount.toFixed(2)} | IGTF: {currency}{Number(receipt.igtf_amount).toFixed(2)}
                     </span>
                )}
            </div>
            <div className="text-right">
                <span className="font-bold text-emerald-700 block">{currency}{baseAmount.toFixed(2)}</span>
                <span className="text-[10px] text-gray-500 font-medium">
                    {formatBs(baseAmount, receipt.exchange_rate)}
                </span>
            </div>
        </div>
    );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const map: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-700',
        partial: 'bg-blue-100 text-blue-700',
        paid: 'bg-emerald-100 text-emerald-700',
        cancelled: 'bg-red-100 text-red-600',
    };
    const labels: Record<string, string> = { pending: 'Pendiente', partial: 'Abono Parcial', paid: 'Pagado', cancelled: 'Cancelado' };
    return (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status] ?? 'bg-gray-100 text-gray-500'}`}>
            {labels[status] ?? status}
        </span>
    );
};

// REMOVED static PAYMENT_METHODS array

const PaymentModal: React.FC<{ order: Orden; onClose: () => void }> = ({ order, onClose }) => {
    const { createReceipt, isLoading, paymentMethods } = useFinancialStore();
    const { bcvRateUsd, bcvRateEur } = useSystemStore();
    const paidAmount = order.receipts.reduce((sum, r) => sum + Number(r.amount), 0);
    const [amount, setAmount] = useState<number>(order.total - paidAmount);
    const [method, setMethod] = useState<string>(paymentMethods.find(m => m.is_active)?.name || "Efectivo");
    const [reference, setReference] = useState('');
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
    const igtf_amount = (applyIGTF && isIGTFMethod) ? amount * 0.03 : 0;
    const totalToPay = amount + igtf_amount;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const ok = await createReceipt({
            orden_id: order.id,
            client_id: order.client_id,
            amount: amount, // The debt payment part
            igtf_amount: igtf_amount,
            type: "income",
            payment_method: method as any,
            reference,
            exchange_rate: customRate,
            exchange_currency: refCurrency,
            branch_id: order.branch_id
        });
        if (ok) onClose();
    };


    const remaining = order.total - paidAmount;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl z-10 flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
                    <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2"><ReceiptIcon size={18} /> Registrar Pago</h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:bg-gray-100 p-1 rounded-full"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden min-h-0">
                    <div className="flex flex-col md:flex-row overflow-y-auto min-h-0">
                        {/* Columna Izquierda: Resumen */}
                        <div className="w-full md:w-1/2 p-5 lg:p-6 bg-slate-50/50 border-r border-gray-100 flex flex-col">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Resumen de la Orden</h3>
                            <div className="bg-white shadow-sm text-blue-900 text-xs p-5 rounded-xl border border-blue-100/60 flex-1">
                                <div className="flex justify-between mb-2.5 opacity-80">
                                    <span>Total de la Orden:</span>
                                    <span className="font-medium text-sm">€{order.total.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between mb-4 pb-4 border-b border-blue-200/60">
                                    <span>Restante por pagar:</span>
                                    <div className="text-right">
                                        <span className="font-bold text-base block">€{remaining.toFixed(2)}</span>
                                        <span className="text-[10px] opacity-70">{formatBs(remaining, customRate)}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between mb-2">
                                    <span>Base Imponible (Base):</span>
                                    <div className="text-right">
                                        <span className="font-medium block">€{subtotal.toFixed(2)}</span>
                                        <span className="text-[10px] text-blue-400/80">{formatBs(subtotal, customRate)}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between mb-3">
                                    <span>IVA (16%):</span>
                                    <div className="text-right">
                                        <span className="font-medium block">€{(amount - subtotal).toFixed(2)}</span>
                                        <span className="text-[10px] text-blue-400/80">{formatBs(amount - subtotal, customRate)}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between border-t border-blue-200/60 pt-3 mt-3">
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Monto a abonar (€)</label>
                                <input type="number" step="0.01" max={remaining} required value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-lg font-bold text-indigo-700 bg-indigo-50/30" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                                <select value={method} onChange={e => setMethod(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500">
                                    <option value="">Seleccione...</option>
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
                                <input value={reference} onChange={e => setReference(e.target.value)} placeholder="Nro de recibo o transferencia..."
                                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
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
                        <button disabled={isLoading || amount <= 0} type="submit" className="px-6 py-2.5 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm">
                            {isLoading ? 'Procesando...' : 'Confirmar y Registrar Pago'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
// --- Shared component imported from ../components/RoomBookingPicker ---

const NewOrderModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { selectedBranchId } = useAuthStore();
    const { createOrder, products, isLoading } = useFinancialStore();
    const { services, fetchInventory } = useInventoryStore();
    const { offices, rooms, fetchOffices, fetchRooms } = useOperativeStore();
    const [clients, setClients] = useState<Client[]>([]); // LOCAL search results
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        fetchOffices(selectedBranchId ?? undefined);
        fetchRooms(selectedBranchId ?? undefined);
        fetchInventory();
    }, [selectedBranchId, fetchOffices, fetchRooms, fetchInventory]);

    const [clientId, setClientId] = useState<number>(0);
    const [clientAmenities, setClientAmenities] = useState<Amenity[]>([]);

    useEffect(() => {
        if (clientId) {
            operativeService.getAmenities(selectedBranchId ?? undefined, clientId).then(setClientAmenities);
        } else {
            setClientAmenities([]);
        }
    }, [clientId, selectedBranchId]);
    const [discount, setDiscount] = useState(0);
    const [discountType, setDiscountType] = useState<'amount' | 'percentage'>('amount');
    const [items, setItems] = useState<Pedido[]>([]);
    const [clientSearch, setClientSearch] = useState('');
    const [showClientResults, setShowClientResults] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const [applyTax, setApplyTax] = useState(true);
    const [bookingRoom, setBookingRoom] = useState<any>(null);
    const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null);

    useEffect(() => {
        const fetchInitialClients = async () => {
            setIsSearching(true);
            setClients([]); // Clear previous results while searching
            try {
                const results = await operativeService.getClients(selectedBranchId ?? undefined, clientSearch);
                setClients(results);
            } catch (error) {
                console.error('Error searching clients:', error);
            } finally {
                setIsSearching(false);
            }
        };

        const timer = setTimeout(() => {
            fetchInitialClients();
        }, 300);
        return () => clearTimeout(timer);
    }, [clientSearch, selectedBranchId]);

    const [catalogSearch, setCatalogSearch] = useState('');

    // Unified Catalog
    type CatalogItem = { id: number; type: string; name: string; price: number; meta: string };
    const allCatalogItems: CatalogItem[] = [
        ...products.filter(p => p.is_active).map(p => ({ id: p.id, type: 'product', name: p.name, price: p.price, meta: `Stock: ${p.stock}` })),
        ...services.filter(s => s.is_active && !s.is_room_rate).map(s => ({ id: s.id, type: 'service', name: s.name, price: s.price, meta: 'Servicio' })),
        ...offices.filter(o => o.is_active && o.status === 'disponible').map(o => ({ id: o.id, type: 'office', name: o.name, price: o.monthly_rate, meta: `Capacidad: ${o.capacity} personas` }))
    ];

    rooms.filter(r => r.is_active).forEach(r => {
        allCatalogItems.push({
            id: r.id,
            type: 'room',
            name: r.name,
            price: r.hourly_rate,
            meta: `Reserva Sala (${r.capacity} pax)`
        });
    });
    const catalogItems = catalogSearch.trim()
        ? allCatalogItems.filter(i => i.name.toLowerCase().includes(catalogSearch.toLowerCase()) || i.type.toLowerCase().includes(catalogSearch.toLowerCase()))
        : allCatalogItems;

    // Derived state
    const subtotal = items.reduce((sum, it) => {
        let linePrice = it.unit_price * it.quantity;

        // Deduction for 'room' (category: hours)
        if (it.item_type === 'room') {
            const hourAmenity = clientAmenities.find(a => a.category === 'hours');
            if (hourAmenity && hourAmenity.quantity > 0) {
                const covered = Math.min(it.quantity, hourAmenity.quantity);
                linePrice = (it.quantity - covered) * it.unit_price;
            }
        }
        // Deduction for 'service' (by name)
        else if (it.item_type === 'service') {
            const amenity = clientAmenities.find(a => a.name === it.itemName);
            if (amenity && amenity.quantity > 0) {
                const covered = Math.min(it.quantity, amenity.quantity);
                linePrice = (it.quantity - covered) * it.unit_price;
            }
        }

        return sum + Math.max(0, linePrice - it.discount);
    }, 0);

    const discountAmount = discountType === 'percentage' ? subtotal * (discount / 100) : discount;
    const base = Math.max(0, subtotal - discountAmount);
    const tax = applyTax ? base * 0.16 : 0;
    const total = base + tax;

    const handleAddItem = (item: CatalogItem) => {
        if (item.type === 'room') {
            setBookingRoom(item);
            return;
        }
        setItems(prev => {
            const existing = prev.find(i => i.item_id === item.id && i.item_type === item.type);
            if (existing) {
                return prev.map(i => (i.item_id === item.id && i.item_type === item.type) ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, {
                item_type: item.type,
                item_id: item.id,
                itemName: item.name,
                unit_price: item.price,
                quantity: 1,
                discount: 0,
                subtotal: item.price,
                start_time: '',
                end_time: ''
            }];
        });
    };

    const handleConfirmBooking = (data: { serviceId: number; startTime: string; endTime: string; qty: number; price: number; serviceName: string }) => {
        if (!bookingRoom) return;

        if (typeof editingItemIdx !== 'undefined' && editingItemIdx !== null) {
            setItems(prev => prev.map((it, idx) => idx === editingItemIdx ? {
                ...it,
                itemName: `${bookingRoom.name} - ${data.serviceName}`,
                unit_price: data.price,
                quantity: data.qty,
                subtotal: data.price * data.qty,
                start_time: data.startTime,
                end_time: data.endTime,
                service_id: data.serviceId
            } : it));
            setEditingItemIdx(null);
        } else {
            setItems(prev => [...prev, {
                item_type: 'room',
                item_id: bookingRoom.id,
                itemName: `${bookingRoom.name} - ${data.serviceName}`,
                unit_price: data.price,
                quantity: data.qty,
                discount: 0,
                subtotal: data.price * data.qty,
                start_time: data.startTime,
                end_time: data.endTime,
                service_id: data.serviceId
            }]);
        }
        setBookingRoom(null);
    };

    const handleRemoveItem = (id: number, type: string, itemName: string) => {
        setItems(prev => prev.filter(i => !(i.item_id === id && i.item_type === type && i.itemName === itemName)));
    };

    const handleUpdateQuantity = (id: number, type: string, qty: number) => {
        if (qty < 1) return;
        setItems(prev => prev.map(i => (i.item_id === id && i.item_type === type) ? { ...i, quantity: qty } : i));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0 || !clientId) return;

        // Validation for rooms: must have start/end times
        const roomWithoutTime = items.find(i => i.item_type === 'room' && (!i.start_time || !i.end_time));
        if (roomWithoutTime) {
            alert(`Por favor defina el horario de reserva para la sala: ${roomWithoutTime.itemName} `);
            return;
        }

        setLocalError(null);
        const ok = await createOrder({
            client_id: clientId,
            branch_id: selectedBranchId ?? 0,
            discount: discount,
            discount_type: discountType,
            status: "pending",
            apply_tax: applyTax,
            details: items.map(it => ({
                ...it,
                start_time: it.start_time || undefined,
                end_time: it.end_time || undefined
            }))
        });
        if (ok) {
            onClose();
        } else {
            const serverError = useFinancialStore.getState().error;
            setLocalError(serverError || "Error al crear la orden. Verifique los datos e intente de nuevo.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl z-10 flex h-[80vh] overflow-hidden">
                {/* Form Side */}
                <div className="flex-1 flex flex-col border-r h-full bg-gray-50">
                    <div className="px-6 py-4 border-b bg-white shrink-0">
                        <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2"><ShoppingBag size={18} /> Nueva Orden</h2>
                    </div>
                    <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6 flex flex-col gap-6">
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    {isSearching ? <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-indigo-500 border-t-transparent" /> : <Search size={14} />}
                                </span>
                                <input
                                    type="text"
                                    placeholder="Buscar cliente por nombre, correo o ID..."
                                    value={clientSearch}
                                    onChange={e => {
                                        setClientSearch(e.target.value);
                                        setShowClientResults(true);
                                        // Reset clientId if user starts typing manually unless they already picked one and then changed it
                                        if (clientId !== 0 && e.target.value !== (clients.find(c => c.id === clientId)?.name || '')) {
                                            setClientId(0);
                                        }
                                    }}
                                    onFocus={() => setShowClientResults(true)}
                                    className="w-full pl-9 pr-3 py-2 border rounded-lg outline-none bg-white focus:ring-2 focus:ring-indigo-500 text-sm"
                                />
                                {clientSearch && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setClientSearch('');
                                            setClientId(0);
                                            setShowClientResults(false);
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                                {showClientResults && (clients.length > 0 || clientSearch || isSearching) && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-xl max-h-60 overflow-auto">
                                        {isSearching ? (
                                            <div className="p-4 text-center">
                                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-500 border-t-transparent mx-auto mb-2" />
                                                <span className="text-xs text-gray-500">Buscando clientes...</span>
                                            </div>
                                        ) : clients.length === 0 ? (
                                            <div className="p-3 text-sm text-gray-500 text-center">No se encontraron clientes</div>
                                        ) : (
                                            clients.map(c => (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setClientId(c.id);
                                                        setClientSearch(c.name);
                                                        setShowClientResults(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 flex flex-col border-b last:border-0"
                                                >
                                                    <span className="font-medium text-gray-800">{c.name}</span>
                                                    <span className="text-[10px] text-gray-400">
                                                        {c.email || 'Sin correo'} • {c.ci_rif || 'Sin ID'} • ID: {c.id}
                                                        {c.branch?.name && <span className="ml-2 px-1 rounded bg-slate-100 text-slate-500 font-bold uppercase">{c.branch.name}</span>}
                                                    </span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                            {clientId > 0 && !showClientResults && (
                                <p className="mt-1 text-[10px] text-indigo-600 font-medium">
                                    Seleccionado: {clients.find(c => c.id === clientId)?.name}
                                </p>
                            )}
                        </div>

                        <div className="flex-1 border rounded-xl bg-white overflow-hidden flex flex-col">
                            <div className="bg-gray-100 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Líneas de Pedido</div>
                            <div className="flex-1 overflow-auto p-2">
                                {items.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400 text-sm">Selecciona productos a la derecha para agregarlos.</div>
                                ) : (
                                    <ul className="space-y-2">
                                        {items.map((item, idx) => (
                                            <li key={`${item.item_id} -${item.item_type} -${idx} `} className="flex flex-col p-3 border border-gray-100 rounded hover:bg-gray-50 bg-white shadow-sm">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-gray-800">{item.itemName || 'Producto'}</span>
                                                        <span className="text-xs text-gray-500">€{item.unit_price.toFixed(2)} c/u {item.item_type === 'room' ? '(Sala)' : item.item_type === 'office' ? '(Oficina)' : ''}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {item.item_type === 'room' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const roomName = (item.itemName || "").split(' - ')[0];
                                                                    setBookingRoom({ id: item.item_id, name: roomName });
                                                                    setEditingItemIdx(idx);
                                                                }}
                                                                className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded transition-colors"
                                                                title="Editar Horario"
                                                            >
                                                                <Clock size={16} />
                                                            </button>
                                                        )}
                                                        <div className="flex flex-col items-end">
                                                            <input type="number" min="1" value={item.quantity} onChange={e => handleUpdateQuantity(item.item_id, item.item_type, parseInt(e.target.value))}
                                                                className="w-16 px-2 py-1 text-sm border rounded text-center" />
                                                            {(() => {
                                                                const svc = services.find(s => s.id === item.item_id && item.item_type === 'service');
                                                                if (svc?.is_amenity) {
                                                                    const amenity = clientAmenities.find(a => a.name === item.itemName);
                                                                    if (amenity && amenity.quantity > 0) {
                                                                        const covered = Math.min(item.quantity, amenity.quantity);
                                                                        return (
                                                                            <span className="text-[10px] text-emerald-600 font-bold mt-1">
                                                                                –{covered} cubierto por cuota
                                                                            </span>
                                                                        );
                                                                    }
                                                                }
                                                                return null;
                                                            })()}
                                                        </div>
                                                        <span className="font-bold text-sm w-16 text-right">
                                                            €{(() => {
                                                                let p = item.unit_price * item.quantity;
                                                                const svc = services.find(s => s.id === item.item_id && item.item_type === 'service');
                                                                if (svc?.is_amenity) {
                                                                    const amenity = clientAmenities.find(a => a.name === item.itemName);
                                                                    if (amenity && amenity.quantity > 0) {
                                                                        const covered = Math.min(item.quantity, amenity.quantity);
                                                                        p = (item.quantity - covered) * item.unit_price;
                                                                    }
                                                                }
                                                                return p.toFixed(2);
                                                            })()}
                                                        </span>
                                                        <button type="button" onClick={() => handleRemoveItem(item.item_id, item.item_type, item.itemName || '')} className="text-red-400 hover:text-red-600 p-1"><X size={16} /></button>
                                                    </div>
                                                </div>

                                                {item.item_type === 'room' && item.start_time && item.end_time && (
                                                    <div className="mt-2 p-2 bg-indigo-50 border border-indigo-100 rounded text-[10px] text-indigo-700 flex flex-col gap-1">
                                                        <div className="flex justify-between font-bold uppercase tracking-tight">
                                                            <span>Inicio: {new Date(item.start_time).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</span>
                                                            <span>Fin: {new Date(item.end_time).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</span>
                                                        </div>
                                                        <div className="text-right italic">Duración: {item.quantity} hrs</div>
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2 text-sm">
                            <div className="flex justify-between items-center text-gray-600">
                                <span>Subtotal</span>
                                <span>€{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-start text-gray-600">
                                <span className="mt-1">Descuento</span>
                                <div className="flex flex-col items-end gap-1">
                                    <div className="flex items-center gap-1">
                                        <div className="flex rounded border border-gray-200 overflow-hidden text-xs">
                                            <button type="button" onClick={() => setDiscountType('amount')} className={`px-2 py-1 font-bold transition ${discountType === 'amount' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>€</button>
                                            <button type="button" onClick={() => setDiscountType('percentage')} className={`px-2 py-1 font-bold transition ${discountType === 'percentage' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>%</button>
                                        </div>
                                        <input type="number" step="0.01" min="0" max={discountType === 'percentage' ? 100 : undefined} value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 border border-gray-200 rounded text-right text-red-500 outline-none" />
                                    </div>
                                    {discountType === 'percentage' && discountAmount > 0 && (
                                        <span className="text-xs text-red-400">-€{discountAmount.toFixed(2)}</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-gray-600 pb-2 border-b">
                                <div className="flex items-center gap-2">
                                    <span>IVA (16%)</span>
                                    <label className="relative inline-flex items-center cursor-pointer scale-75">
                                        <input type="checkbox" checked={applyTax} onChange={e => setApplyTax(e.target.checked)} className="sr-only peer" />
                                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>
                                <span className={!applyTax ? 'text-gray-300 line-through' : ''}>€{tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-lg font-bold text-gray-900 pt-1">
                                <span>Total</span>
                                <span>€{total.toFixed(2)}</span>
                            </div>
                        </div>

                        {localError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                <X size={16} className="shrink-0" />
                                {localError}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-auto shrink-0 pt-4">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg">Cancelar</button>
                            <button disabled={isLoading || items.length === 0} type="submit" className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                                {isLoading ? 'Generando...' : 'Emitir Orden'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Products Side */}
                <div className="w-[300px] shrink-0 bg-white flex flex-col">
                    <div className="px-4 py-4 border-b bg-gray-50 shrink-0">
                        <h3 className="font-bold text-sm text-gray-700 uppercase tracking-widest mb-3">Catálogo</h3>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input placeholder="Buscar productos..." value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 border rounded-lg text-sm bg-white" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto p-2 space-y-1">
                        {catalogItems.map((citem, idx) => (
                            <div key={`${citem.type} -${citem.id} -${idx} `} className="p-3 border border-transparent hover:border-indigo-100 hover:bg-indigo-50/50 rounded-lg cursor-pointer transition flex justify-between items-center group"
                                onClick={() => handleAddItem(citem)}>
                                <div>
                                    <p className="text-sm font-medium text-gray-800" title={citem.name}>{citem.name}</p>
                                    <p className="text-[10px] text-gray-400 capitalize">{citem.type === 'office' ? 'Espacio' : citem.type === 'room' ? 'Sala' : citem.type === 'product' ? 'Producto' : 'Servicio'} • {citem.meta}</p>
                                </div>
                                <span className="text-sm font-bold text-indigo-600 group-hover:scale-110 transition-transform">€{citem.price.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>
                {bookingRoom && (
                    <RoomBookingPicker
                        room={bookingRoom}
                        services={services}
                        onConfirm={handleConfirmBooking}
                        onCancel={() => setBookingRoom(null)}
                    />
                )}
            </div>
        </div>
    );
};

const DeleteOrderModal: React.FC<{ order: Orden; onClose: () => void }> = ({ order, onClose }) => {
    const { deleteOrder, isLoading } = useFinancialStore();
    const [reason, setReason] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const ok = await deleteOrder(order.id, reason);
        if (ok) onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm z-10 overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-red-50">
                    <h2 className="font-bold text-red-800 text-lg flex items-center gap-2"><Trash2 size={18} /> Anular Venta #{order.id}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:bg-gray-100 p-1 rounded-full"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <p className="text-sm text-gray-600">
                        ¿Estás seguro que deseas anular o eliminar esta orden? Deberás indicar un motivo real para la bitácora.
                    </p>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Motivo / Razón *</label>
                        <textarea required value={reason} onChange={e => setReason(e.target.value)} rows={3}
                            placeholder="Ej: Cliente canceló el pedido..."
                            className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-red-500 resize-none" />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button disabled={isLoading || !reason.trim()} type="submit" className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                            {isLoading ? 'Anulando...' : 'Anular Venta'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const OrderLogsModal: React.FC<{ orderId: number; onClose: () => void }> = ({ orderId, onClose }) => {
    const { getOrderLogs } = useFinancialStore();
    const [logs, setLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            setLoadingLogs(true);
            const data = await getOrderLogs(orderId);
            setLogs(data);
            setLoadingLogs(false);
        };
        fetchLogs();
    }, [orderId, getOrderLogs]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl z-10 overflow-hidden flex flex-col max-h-[80vh]">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
                    <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2"><History size={18} /> Bitácora Orden #{orderId}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:bg-gray-100 p-1 rounded-full"><X size={18} /></button>
                </div>
                <div className="p-6 overflow-auto flex-1 bg-slate-50">
                    {loadingLogs ? (
                        <div className="text-center text-gray-500 py-8">Cargando registros...</div>
                    ) : logs.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">No hay registros de modificaciones para esta orden.</div>
                    ) : (
                        <div className="space-y-4">
                            {logs.map(log => (
                                <div key={log.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`px - 2 py - 0.5 rounded text - xs font - bold ${log.action === 'CREATE' ? 'bg-green-100 text-green-700' : log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'} `}>
                                                {log.action}
                                            </span>
                                            <span className="text-sm font-medium text-gray-800">{log.user_email || `Usuario #${log.user_id} `}</span>
                                        </div>
                                        <span className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm text-gray-700 mb-2 font-medium">Motivo: <span className="font-normal">{log.reason || 'N/A'}</span></p>
                                    <div className="bg-slate-800 text-slate-300 text-[11px] p-3 rounded-lg overflow-x-auto">
                                        <pre>{JSON.stringify(log.changes, null, 2)}</pre>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const EditOrderModal: React.FC<{ order: Orden; onClose: () => void }> = ({ order, onClose }) => {
    const { selectedBranchId } = useAuthStore();
    const { updateOrder, products, isLoading } = useFinancialStore();
    const { services, fetchInventory } = useInventoryStore();
    const { offices, rooms, fetchOffices, fetchRooms } = useOperativeStore();
    const [applyTax, setApplyTax] = useState(order.apply_tax ?? true);

    useEffect(() => {
        fetchOffices(selectedBranchId ?? undefined);
        fetchRooms(selectedBranchId ?? undefined);
        fetchInventory();
    }, [selectedBranchId, fetchOffices, fetchRooms, fetchInventory]);

    const [discount, setDiscount] = useState(order.discount);
    const [discountType, setDiscountType] = useState<'amount' | 'percentage'>(order.discount_type ?? 'amount');
    const [reason, setReason] = useState('');
    // Initialize with existing details
    const [items, setItems] = useState<Pedido[]>(order.details ? order.details.map(d => ({
        ...d,
        itemName: d.item_name || `${d.item_type} #${d.item_id}`
    })) : []);
    const [localError, setLocalError] = useState<string | null>(null);
    const [catalogSearch, setCatalogSearch] = useState('');
    const [bookingRoom, setBookingRoom] = useState<any>(null);
    const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null);

    // Unified Catalog
    type CatalogItem = { id: number; type: string; name: string; price: number; meta: string };
    const allCatalogItems: CatalogItem[] = [
        ...products.filter(p => p.is_active).map(p => ({ id: p.id, type: 'product', name: p.name, price: p.price, meta: `Stock: ${p.stock}` })),
        ...services.filter(s => s.is_active && !s.is_room_rate).map(s => ({ id: s.id, type: 'service', name: s.name, price: s.price, meta: 'Servicio' })),
        ...offices.filter(o => o.is_active && o.status === 'disponible').map(o => ({ id: o.id, type: 'office', name: o.name, price: o.monthly_rate, meta: `Capacidad: ${o.capacity} personas` }))
    ];

    rooms.filter(r => r.is_active && r.status === 'disponible').forEach(r => {
        allCatalogItems.push({
            id: r.id,
            type: 'room',
            name: r.name,
            price: r.hourly_rate,
            meta: `Reserva Sala (${r.capacity} pax)`
        });
    });
    const catalogItems = catalogSearch.trim()
        ? allCatalogItems.filter(i => i.name.toLowerCase().includes(catalogSearch.toLowerCase()) || i.type.toLowerCase().includes(catalogSearch.toLowerCase()))
        : allCatalogItems;

    const subtotal = items.reduce((sum, it) => sum + (it.unit_price * it.quantity), 0);
    const discountAmount = discountType === 'percentage' ? subtotal * (discount / 100) : discount;
    const base = Math.max(0, subtotal - discountAmount);
    const tax = applyTax ? base * 0.16 : 0;
    const total = base + tax;

    const handleAddItem = (item: CatalogItem) => {
        if (item.type === 'room') {
            setBookingRoom(item);
            return;
        }
        setItems(prev => {
            const existing = prev.find(i => i.item_id === item.id && i.item_type === item.type);
            if (existing) {
                return prev.map(i => (i.item_id === item.id && i.item_type === item.type) ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, {
                item_type: item.type,
                item_id: item.id,
                itemName: item.name,
                unit_price: item.price,
                quantity: 1,
                discount: 0,
                subtotal: item.price,
                start_time: '',
                end_time: ''
            }];
        });
    };

    const handleConfirmBooking = (data: { serviceId: number; startTime: string; endTime: string; qty: number; price: number; serviceName: string }) => {
        if (!bookingRoom) return;

        if (typeof editingItemIdx !== 'undefined' && editingItemIdx !== null) {
            setItems(prev => prev.map((it, idx) => idx === editingItemIdx ? {
                ...it,
                itemName: `${bookingRoom.name} - ${data.serviceName}`,
                unit_price: data.price,
                quantity: data.qty,
                subtotal: data.price * data.qty,
                start_time: data.startTime,
                end_time: data.endTime,
                service_id: data.serviceId
            } : it));
            setEditingItemIdx(null);
        } else {
            setItems(prev => [...prev, {
                item_type: 'room',
                item_id: bookingRoom.id,
                itemName: `${bookingRoom.name} - ${data.serviceName}`,
                unit_price: data.price,
                quantity: data.qty,
                discount: 0,
                subtotal: data.price * data.qty,
                start_time: data.startTime,
                end_time: data.endTime,
                service_id: data.serviceId
            }]);
        }
        setBookingRoom(null);
    };

    const handleRemoveItem = (id: number, type: string, itemName: string) => {
        setItems(prev => prev.filter(i => !(i.item_id === id && i.item_type === type && i.itemName === itemName)));
    };

    const handleUpdateQuantity = (id: number, type: string, qty: number) => {
        const safeQty = isNaN(qty) ? 0 : Math.max(0, qty);
        setItems(prev => prev.map(i => (i.item_id === id && i.item_type === type) ? { ...i, quantity: safeQty } : i));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0 || !reason.trim()) return;

        const roomWithoutTime = items.find(i => i.item_type === 'room' && (!i.start_time || !i.end_time));
        if (roomWithoutTime) {
            alert(`Por favor defina el horario de reserva para la sala: ${roomWithoutTime.itemName}`);
            return;
        }

        setLocalError(null);
        const ok = await updateOrder(order.id, {
            discount: discount,
            discount_type: discountType,
            details: items.map(it => ({
                ...it,
                start_time: it.start_time || undefined,
                end_time: it.end_time || undefined
            })),
            apply_tax: applyTax,
            reason: reason.trim()
        });
        if (ok) {
            onClose();
        } else {
            const serverError = useFinancialStore.getState().error;
            setLocalError(serverError || "Error al guardar los cambios. Verifique los datos e intente de nuevo.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl z-10 flex h-[85vh] overflow-hidden">
                {/* Form Side */}
                <div className="flex-1 flex flex-col border-r h-full bg-gray-50">
                    <div className="px-6 py-4 border-b bg-blue-50 shrink-0 flex justify-between items-center">
                        <h2 className="font-bold text-blue-800 text-lg flex items-center gap-2"><Edit2 size={18} /> Editar Orden #{order.id}</h2>
                        <button onClick={onClose} type="button" className="text-gray-400 hover:bg-gray-100 p-1 rounded-full"><X size={18} /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6 flex flex-col gap-6">

                        <div className="flex-1 border rounded-xl bg-white overflow-hidden flex flex-col">
                            <div className="bg-gray-100 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Líneas de Pedido</div>
                            <div className="flex-1 overflow-auto p-2">
                                {items.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400 text-sm">Selecciona productos a la derecha para agregarlos.</div>
                                ) : (
                                    <ul className="space-y-2">
                                        {items.map((item, idx) => (
                                            <li key={`${item.item_id}-${item.item_type}-${idx}`} className="flex flex-col p-3 border border-gray-100 rounded hover:bg-gray-50 bg-white shadow-sm">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-gray-800">{item.itemName || `${item.item_type} #${item.item_id}`}</span>
                                                        <span className="text-xs text-gray-500">${Number(item.unit_price).toFixed(2)} c/u</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {item.item_type === 'room' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const roomName = (item.itemName || "").split(' - ')[0];
                                                                    setBookingRoom({ id: item.item_id, name: roomName });
                                                                    setEditingItemIdx(idx);
                                                                }}
                                                                className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded transition-colors"
                                                                title="Editar Horario"
                                                            >
                                                                <Clock size={16} />
                                                            </button>
                                                        )}
                                                        <input type="number" min="0" value={item.quantity === 0 ? '' : item.quantity} onChange={e => handleUpdateQuantity(item.item_id, item.item_type, parseInt(e.target.value) || 0)}
                                                            className="w-16 px-2 py-1 text-sm border rounded text-center outline-none focus:ring-2 focus:ring-indigo-500" />
                                                        <span className="font-bold text-sm w-16 text-right">${(item.unit_price * item.quantity).toFixed(2)}</span>
                                                        <button type="button" onClick={() => handleRemoveItem(item.item_id, item.item_type, item.itemName || '')} className="text-red-400 hover:text-red-600 p-1"><X size={16} /></button>
                                                    </div>
                                                </div>
                                                {item.item_type === 'room' && item.start_time && item.end_time && (
                                                    <div className="mt-2 p-2 bg-indigo-50 border border-indigo-100 rounded text-[10px] text-indigo-700 flex flex-col gap-1">
                                                        <div className="flex justify-between font-bold uppercase tracking-tight">
                                                            <span>Inicio: {new Date(item.start_time).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</span>
                                                            <span>Fin: {new Date(item.end_time).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</span>
                                                        </div>
                                                        <div className="text-right italic">Duración: {item.quantity} hrs</div>
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2 text-sm">
                            <div className="flex justify-between items-center text-gray-600 pb-2 border-b">
                                <div className="flex items-center gap-2">
                                    <span>IVA (16%)</span>
                                    <label className="relative inline-flex items-center cursor-pointer scale-75">
                                        <input type="checkbox" checked={applyTax} onChange={e => setApplyTax(e.target.checked)} className="sr-only peer" />
                                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>
                                <span className={!applyTax ? 'text-gray-300 line-through' : ''}>${tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-start text-gray-600">
                                <span className="mt-1">Descuento</span>
                                <div className="flex flex-col items-end gap-1">
                                    <div className="flex items-center gap-1">
                                        <div className="flex rounded border border-gray-200 overflow-hidden text-xs">
                                            <button type="button" onClick={() => setDiscountType('amount')} className={`px-2 py-1 font-bold transition ${discountType === 'amount' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>$</button>
                                            <button type="button" onClick={() => setDiscountType('percentage')} className={`px-2 py-1 font-bold transition ${discountType === 'percentage' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>%</button>
                                        </div>
                                        <input type="number" step="0.01" min="0" max={discountType === 'percentage' ? 100 : undefined} value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 border border-gray-200 rounded text-right text-red-500 outline-none" />
                                    </div>
                                    {discountType === 'percentage' && discountAmount > 0 && (
                                        <span className="text-xs text-red-400">-${discountAmount.toFixed(2)}</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-gray-600 pb-2 border-b">
                                <span>IVA (16%)</span>
                                <span>${tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-lg font-bold text-gray-900 pt-1">
                                <span>Total</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo del Cambio *</label>
                            <input type="text" required value={reason} onChange={e => setReason(e.target.value)}
                                placeholder="Ej: Ajuste de cantidades a petición del cliente..."
                                className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>

                        {localError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                <X size={16} className="shrink-0" />
                                {localError}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-auto shrink-0 pt-2">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg">Cancelar</button>
                            <button disabled={isLoading || items.length === 0 || !reason.trim()} type="submit" className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Products Side */}
                <div className="w-[300px] shrink-0 bg-white flex flex-col">
                    <div className="px-4 py-4 border-b bg-gray-50 shrink-0">
                        <h3 className="font-bold text-sm text-gray-700 uppercase tracking-widest mb-3">Catálogo</h3>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input placeholder="Buscar productos..." value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 border rounded-lg text-sm bg-white" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto p-2 space-y-1">
                        {catalogItems.map((citem, idx) => (
                            <div key={`${citem.type} -${citem.id} -${idx} `} className="p-3 border border-transparent hover:border-blue-100 hover:bg-blue-50/50 rounded-lg cursor-pointer transition flex justify-between items-center group"
                                onClick={() => handleAddItem(citem)}>
                                <div>
                                    <p className="text-sm font-medium text-gray-800" title={citem.name}>{citem.name}</p>
                                    <p className="text-[10px] text-gray-400 capitalize">{citem.type === 'office' ? 'Espacio' : citem.type === 'room' ? 'Sala' : citem.type === 'product' ? 'Producto' : 'Servicio'} • {citem.meta}</p>
                                </div>
                                <span className="text-sm font-bold text-blue-600 group-hover:scale-110 transition-transform">${citem.price.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>
                {bookingRoom && (
                    <RoomBookingPicker
                        room={bookingRoom}
                        services={services}
                        onConfirm={handleConfirmBooking}
                        onCancel={() => setBookingRoom(null)}
                    />
                )}
            </div>
        </div>
    );
};


const OrderDetailModal: React.FC<{ order: Orden; clientName: string; onClose: () => void }> = ({ order, clientName, onClose }) => {
    const { bcvRateUsd, bcvRateEur } = useSystemStore();
    const paidAmount = order.receipts.reduce((sum, r) => sum + Number(r.amount), 0);
    const remaining = order.total - paidAmount;

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const time = d.toLocaleTimeString('es-VE', { hour12: true, hour: '2-digit', minute: '2-digit' });
        const date = d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
        return `${time} - ${date}`;
    };

    const discountLabel = order.discount_type === 'percentage'
        ? `${order.discount}% (–€${(order.subtotal * (order.discount / 100)).toFixed(2)})`
        : `€${order.discount.toFixed(2)}`;

    const itemTypeLabel = (type: string) => {
        const labels: Record<string, string> = { product: 'Producto', service: 'Servicio', office: 'Espacio', room: 'Sala', amenity: 'Amenidad', package: 'Paquete' };
        return labels[type] ?? type;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl z-10 overflow-hidden flex flex-col max-h-[92vh]">

                {/* Header */}
                <div className="px-6 py-5 border-b bg-gradient-to-r from-indigo-700 to-indigo-600 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="font-bold text-white text-xl flex items-center gap-2">
                            <Eye size={20} /> Detalle de Orden #{order.id}
                        </h2>
                        <p className="text-indigo-100 text-xs mt-1 font-medium bg-indigo-800/30 inline-block px-2 py-0.5 rounded">
                            {formatDate(order.date)}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-full transition">
                        <X size={20} />
                    </button>
                </div>

                <div className="overflow-auto flex-1 p-6 space-y-6">
                    {/* Client & Status */}
                    <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Información del Cliente</p>
                            <p className="text-xl font-bold text-gray-900">{clientName}</p>
                            <p className="text-xs text-gray-500 mt-0.5">ID Cliente: {order.client_id}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Estado</p>
                            <StatusBadge status={order.status} />
                        </div>
                    </div>

                    {/* Items Table */}
                    <div>
                        <div className="flex justify-between items-end mb-3 px-1">
                            <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">Conceptos de Venta</p>
                            <span className="text-[10px] text-gray-400 font-medium">({order.details.length} items)</span>
                        </div>
                        <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100/80 text-[10px] text-gray-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="py-3 px-4 text-left font-bold">Descripción</th>
                                        <th className="py-3 px-2 text-center font-bold">Cant.</th>
                                        <th className="py-3 px-4 text-right font-bold w-24">P. Unit.</th>
                                        <th className="py-3 px-4 text-right font-bold w-24">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {order.details.map((d, i) => (
                                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="py-3.5 px-4">
                                                <div className="flex flex-col">
                                                    <span className="text-gray-900 font-bold">{d.item_name || `${itemTypeLabel(d.item_type)} #${d.item_id}`}</span>
                                                    <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-tight">{itemTypeLabel(d.item_type)}</span>
                                                    {d.start_time && (
                                                        <span className="mt-1 text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md self-start font-medium">
                                                            {formatDate(d.start_time)} ➔ {d.end_time ? formatDate(d.end_time).split(' - ')[0] : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-2 text-center text-gray-600 font-bold">{d.quantity}</td>
                                            <td className="py-3.5 px-4 text-right text-gray-500 font-medium">€{Number(d.unit_price).toFixed(2)}</td>
                                            <td className="py-3.5 px-4 text-right font-bold text-gray-900">€{Number(d.subtotal).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Totals & Payments Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Final Balance Summary */}
                        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                            <div>
                                <h3 className="text-[10px] text-indigo-300 uppercase font-bold tracking-widest mb-4">Resumen de Cuenta</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400">Total Facturado</span>
                                        <span className="font-bold">€{order.total.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400">Total Abonado</span>
                                        <span className="font-bold text-emerald-400">€{paidAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-slate-800">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] text-red-400 uppercase font-bold tracking-widest mb-1">Saldo Pendiente</p>
                                        <p className="text-3xl font-black">€{remaining.toFixed(2)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-slate-400 mb-0.5">Equivalente en Bs</p>
                                        <p className="text-sm font-bold text-indigo-400">{formatBs(remaining, bcvRateEur)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Breakdown */}
                        <div className="flex flex-col gap-4">
                            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm border border-gray-100 flex-1">
                                <div className="flex justify-between text-gray-500">
                                    <span>Subtotal Base</span>
                                    <span className="font-medium">€{order.subtotal.toFixed(2)}</span>
                                </div>
                                {order.discount > 0 && (
                                    <div className="flex justify-between text-red-500 font-medium">
                                        <span>Descuento</span>
                                        <span>–{discountLabel}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-gray-500">
                                    <span>Impuestos (IVA)</span>
                                    <span className="font-medium">€{order.tax.toFixed(2)}</span>
                                </div>
                                {(order.igtf_amount && order.igtf_amount > 0) ? (
                                    <div className="flex justify-between text-gray-500">
                                        <span>Impuestos (IGTF 3%)</span>
                                        <span className="font-medium">€{order.igtf_amount.toFixed(2)}</span>
                                    </div>
                                ) : null}
                                <div className="flex justify-between font-black text-gray-900 text-lg pt-2 border-t mt-2">
                                    <span>Total Final</span>
                                    <span>€{order.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pagos Registrados */}
                    <div className="pt-2">
                        <div className="flex items-center gap-2 mb-3">
                            <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">Pagos Registrados</p>
                            <div className="h-px flex-1 bg-gray-100"></div>
                        </div>
                        {order.receipts.length === 0 ? (
                            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-6 text-center">
                                <p className="text-sm text-gray-400 font-medium italic">No se han registrado abonos para esta orden.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-2.5">
                                {order.receipts.map((r, i) => (
                                    <ReceiptEntry key={i} receipt={r} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-6 py-4 border-t bg-gray-50 shrink-0 flex justify-end">
                    <button onClick={onClose} className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-md shadow-indigo-100 transition-all hover:-translate-y-0.5 active:translate-y-0">
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
};

const OrdersPage: React.FC = () => {
    const { selectedBranchId } = useAuthStore();
    const { orders, fetchOrders, fetchProducts, fetchPaymentMethods, isLoading } = useFinancialStore();
    const { bcvRateUsd, bcvRateEur } = useSystemStore();
    const { clients, fetchClients } = useOperativeStore();
    const [searchParams, setSearchParams] = useSearchParams();
    const urlClientId = searchParams.get('client_id');
    const urlStatus = searchParams.get('status');

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>(urlStatus || 'all');
    const [showNew, setShowNew] = useState(false);
    const [clientPaymentTarget, setClientPaymentTarget] = useState<{ clientId: number, clientName: string, branchId: number } | null>(null);
    const [deleteOrderTarget, setDeleteOrderTarget] = useState<Orden | null>(null);
    const [logsOrderTarget, setLogsOrderTarget] = useState<Orden | null>(null);
    const [editOrderTarget, setEditOrderTarget] = useState<Orden | null>(null);
    const [detailOrderTarget, setDetailOrderTarget] = useState<Orden | null>(null);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchOrders(selectedBranchId ?? undefined, search || undefined, statusFilter === 'all' ? undefined : statusFilter);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [search, selectedBranchId, statusFilter, fetchOrders]);

    useEffect(() => {
        fetchProducts(selectedBranchId ?? undefined);
        fetchClients(selectedBranchId ?? undefined);
        fetchPaymentMethods(selectedBranchId ?? undefined);

        if (urlClientId && clients.length > 0) {
            const client = clients.find(c => c.id === Number(urlClientId));
            if (client) {
                setSearch(client.name);
            }
        }
    }, [selectedBranchId, fetchProducts, fetchClients, fetchPaymentMethods, urlClientId]);

    const getClientName = (id: number, order?: Orden) => order?.client?.name || clients.find(c => c.id === id)?.name || 'Cliente desconocido';

    const filtered = orders.filter(o => {
        // Now using server-side search for the name, but we still apply the status filter locally 
        // on the current result set to keep the UI snappy for status switching.
        const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
        return matchesStatus;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="flex flex-col h-full bg-gray-50/30">
            <div className="bg-white px-6 py-4 flex justify-between items-center shrink-0 border-b">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <ShoppingBag size={22} className="text-indigo-600" /> Órdenes de Venta
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Gestión de ventas y cobros a clientes.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => {
                        import('../../../utils/exportToCSV').then(({ exportToCSV }) => {
                            const exportData = filtered.map(o => ({
                                ID: `ORD - ${o.id} `,
                                Cliente: getClientName(o.client_id, o),
                                Fecha: new Date(o.date).toLocaleDateString(),
                                Subtotal: o.subtotal,
                                Descuento: o.discount,
                                Total: o.total,
                                Pagado: o.receipts.reduce((sum, r) => sum + Number(r.amount), 0),
                                Estado: o.status
                            }));
                            exportToCSV(exportData, 'reporte_ordenes');
                        });
                    }} className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
                        <Download size={16} /> Exportar
                    </button>
                    <button onClick={() => setShowNew(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
                        <Plus size={16} /> Nueva Orden
                    </button>
                </div>
            </div>

            <div className="px-6 py-3 bg-white border-b shrink-0 flex items-center justify-between">
                <div className="flex gap-4 flex-1 max-w-2xl">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por cliente..."
                            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition" />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border rounded-lg text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="pending">Pendientes</option>
                        <option value="partial">Abono Parcial</option>
                        <option value="paid">Pagados</option>
                        <option value="cancelled">Anulados</option>
                    </select>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1.5 text-xs bg-indigo-50 text-indigo-700 rounded font-medium border border-indigo-100">Mostrando {filtered.length} órdenes</span>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {isLoading && orders.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">Cargando órdenes...</div>
                    ) : filtered.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            <ShoppingBag size={36} className="mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No hay órdenes registradas</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-header-group">
                                <tr>
                                    <th className="py-3 px-4">ID</th>
                                    <th className="py-3 px-4">Cliente</th>
                                    <th className="py-3 px-4">Fecha</th>
                                    <th className="py-3 px-4">Monto Total</th>
                                    <th className="py-3 px-4">Pagado</th>
                                    <th className="py-3 px-4">Estado</th>
                                    <th className="py-3 px-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 flex flex-col md:table-row-group gap-4 md:gap-0 bg-gray-50 md:bg-white p-4 md:p-0">
                                {filtered.map(o => {
                                    const paidAmount = o.receipts.reduce((sum, r) => sum + Number(r.amount), 0);
                                    return (
                                        <tr key={o.id} className="hover:bg-indigo-50/20 transition group flex flex-col md:table-row bg-white border md:border-0 border-gray-200 rounded-xl p-4 md:p-0 shadow-sm md:shadow-none relative">
                                            <td className="py-2 md:py-3 px-0 md:px-4 text-sm text-gray-500 flex justify-between items-center md:table-cell border-b md:border-0 border-gray-100">
                                                <span className="md:hidden font-bold text-xs text-gray-400 uppercase">ID</span>
                                                <span className="font-bold text-gray-700 md:font-normal">#{o.id}</span>
                                            </td>
                                            <td className="py-2 md:py-3 px-0 md:px-4 text-sm font-medium text-gray-800 flex flex-col md:table-cell border-b md:border-0 border-gray-100">
                                                <span className="md:hidden font-bold text-xs text-gray-400 uppercase mb-1">Cliente</span>
                                                {getClientName(o.client_id, o)}
                                            </td>
                                            <td className="py-2 md:py-3 px-0 md:px-4 text-xs text-gray-500 flex justify-between items-center md:table-cell border-b md:border-0 border-gray-100">
                                                <span className="md:hidden font-bold text-xs text-gray-400 uppercase">Fecha</span>
                                                {new Date(o.date).toLocaleDateString()}
                                            </td>
                                            <td className="py-2 md:py-3 px-0 md:px-4 flex justify-between items-center md:table-cell border-b md:border-0 border-gray-100">
                                                <span className="md:hidden font-bold text-xs text-gray-400 uppercase">Total</span>
                                                <div className="text-right md:text-left">
                                                    <div className="font-bold text-gray-900">€{o.total.toFixed(2)}</div>
                                                    {bcvRateEur && <div className="text-[10px] md:text-xs text-gray-500 font-medium mt-0.5">{formatBs(o.total, bcvRateEur)}</div>}
                                                </div>
                                            </td>
                                            <td className="py-2 md:py-3 px-0 md:px-4 flex justify-between items-center md:table-cell border-b md:border-0 border-gray-100">
                                                <span className="md:hidden font-bold text-xs text-gray-400 uppercase">Pagado</span>
                                                <div className="text-right md:text-left">
                                                    <div className="text-sm text-emerald-600 font-bold md:font-medium">€{paidAmount.toFixed(2)}</div>
                                                    {bcvRateEur && <div className="text-[10px] md:text-xs text-emerald-500 mt-0.5">{formatBs(paidAmount, bcvRateEur)}</div>}
                                                </div>
                                            </td>
                                            <td className="py-2 md:py-3 px-0 md:px-4 flex justify-between items-center md:table-cell border-b md:border-0 border-gray-100">
                                                <span className="md:hidden font-bold text-xs text-gray-400 uppercase">Estado</span>
                                                <StatusBadge status={o.status} />
                                            </td>
                                            <td className="py-3 md:py-3 px-0 md:px-4 text-right flex justify-end md:table-cell mt-2 md:mt-0">
                                                <div className="flex justify-end gap-2 md:gap-1.5 items-center w-full md:w-auto">
                                                    <button
                                                        onClick={() => setDetailOrderTarget(o)}
                                                        className="p-2 md:p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                        title="Ver Detalle"
                                                    >
                                                        <Eye size={18} className="md:w-4 md:h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setLogsOrderTarget(o)}
                                                        className="p-2 md:p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                        title="Ver Bitácora"
                                                    >
                                                        <History size={18} className="md:w-4 md:h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditOrderTarget(o)}
                                                        className="p-2 md:p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                                        title="Editar Orden"
                                                        disabled={o.status === 'cancelled' || o.status === 'paid'}
                                                    >
                                                        <Edit2 size={18} className="md:w-4 md:h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteOrderTarget(o)}
                                                        disabled={o.status === 'cancelled'}
                                                        className="p-2 md:p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                                        title="Anular / Eliminar"
                                                    >
                                                        <Trash2 size={18} className="md:w-4 md:h-4" />
                                                    </button>
                                                    <div className="w-px h-6 md:h-4 bg-gray-200 mx-1 md:mx-1"></div>
                                                    <button
                                                        onClick={() => setClientPaymentTarget({ clientId: o.client_id, clientName: getClientName(o.client_id, o), branchId: o.branch_id })}
                                                        disabled={o.status === 'paid' || o.status === 'cancelled'}
                                                        className="flex-1 md:flex-none inline-flex justify-center items-center gap-1.5 px-4 md:px-3 py-2 md:py-1.5 text-sm md:text-xs font-bold rounded border shadow-sm
                                                        disabled:opacity-50 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200
                                                        bg-white text-emerald-600 hover:bg-emerald-50 border-emerald-200"
                                                    >
                                                        <ReceiptIcon size={16} className="md:w-3.5 md:h-3.5" /> Cobrar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {showNew && <NewOrderModal onClose={() => setShowNew(false)} />}
            {clientPaymentTarget && (
                <ClientPaymentModal 
                    clientId={clientPaymentTarget.clientId} 
                    clientName={clientPaymentTarget.clientName} 
                    branchId={clientPaymentTarget.branchId} 
                    onClose={() => setClientPaymentTarget(null)} 
                    onSuccess={() => { setClientPaymentTarget(null); fetchOrders(selectedBranchId ?? undefined); }} 
                />
            )}
            {deleteOrderTarget && <DeleteOrderModal order={deleteOrderTarget} onClose={() => { setDeleteOrderTarget(null); }} />}
            {editOrderTarget && <EditOrderModal order={editOrderTarget} onClose={() => { setEditOrderTarget(null); }} />}
            {logsOrderTarget && <OrderLogsModal orderId={logsOrderTarget.id} onClose={() => setLogsOrderTarget(null)} />}
            {detailOrderTarget && (
                <OrderDetailModal
                    order={detailOrderTarget}
                    clientName={getClientName(detailOrderTarget.client_id, detailOrderTarget)}
                    onClose={() => setDetailOrderTarget(null)}
                />
            )}
        </div>
    );
};

export default OrdersPage;
