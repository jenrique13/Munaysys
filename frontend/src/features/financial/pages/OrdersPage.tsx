import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { useFinancialStore } from '../hooks/useFinancialStore';
import { useInventoryStore } from '../hooks/useInventoryStore';
import { useOperativeStore } from '../../operative/hooks/useOperativeStore';
import { useSystemStore } from '../../system/hooks/useSystemStore';
import { formatBs } from '../../../utils/format';
import type { Orden, Pedido } from '../types';
import type { Amenity } from '../../operative/types';
import { operativeService } from '../../operative/services/operative.service';
import { ShoppingBag, Plus, Search, X, Receipt as ReceiptIcon, Download, Edit2, Trash2, History, Eye } from 'lucide-react';

const ReceiptEntry: React.FC<{ receipt: any }> = ({ receipt }) => {
    const paymentMethodName = typeof receipt.payment_method === 'object' ? receipt.payment_method.name : receipt.payment_method;
    return (
        <div className="flex justify-between items-center bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 text-sm">
            <div>
                <span className="font-semibold text-emerald-700">{paymentMethodName}</span>
                {receipt.reference && <span className="text-xs text-gray-500 ml-2">Ref: {receipt.reference}</span>}
            </div>
            <span className="font-bold text-emerald-700">${Number(receipt.amount).toFixed(2)}</span>
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
        <span className={`text - xs font - semibold px - 2 py - 0.5 rounded - full ${map[status] ?? 'bg-gray-100 text-gray-500'} `}>
            {labels[status] ?? status}
        </span>
    );
};

// REMOVED static PAYMENT_METHODS array

const PaymentModal: React.FC<{ order: Orden; onClose: () => void }> = ({ order, onClose }) => {
    const { createReceipt, isLoading, paymentMethods } = useFinancialStore();
    const { bcvRateUsd, bcvRateEur } = useSystemStore();
    const [amount, setAmount] = useState<number>(order.total - order.receipts.reduce((sum, r) => sum + r.amount, 0));
    const [method, setMethod] = useState<string>(paymentMethods.find(m => m.is_active)?.name || "Efectivo");
    const [reference, setReference] = useState('');
    const [refCurrency, setRefCurrency] = useState<'usd' | 'eur'>('usd');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const ok = await createReceipt({
            orden_id: order.id,
            client_id: order.client_id,
            amount,
            type: "income",
            payment_method: method as any,
            reference,
            exchange_rate: (refCurrency === 'usd' ? bcvRateUsd : bcvRateEur) ?? undefined,
            exchange_currency: refCurrency
        });
        if (ok) onClose();
    };

    const remaining = order.total - order.receipts.reduce((sum, r) => sum + r.amount, 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm z-10 overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2"><ReceiptIcon size={18} /> Registrar Pago</h2>
                    <button onClick={onClose} className="text-gray-400 hover:bg-gray-100 p-1 rounded-full"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg border border-blue-100 mb-4">
                        <p>Total de la Orden: <strong>${order.total.toFixed(2)}</strong></p>
                        <p>Restante por pagar: <strong>${remaining.toFixed(2)}</strong></p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Monto a abonar ($)</label>
                        <input type="number" step="0.01" max={remaining} required value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                        <select value={method} onChange={e => setMethod(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500">
                            {paymentMethods.filter(m => m.is_active).map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                            {paymentMethods.filter(m => m.is_active).length === 0 && <option value="Efectivo">Efectivo (Default)</option>}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Referencia</label>
                        <input value={reference} onChange={e => setReference(e.target.value)} placeholder="Nro de recibo o transferencia..."
                            className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>

                    <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tasa de Cambio a Aplicar</label>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setRefCurrency('usd')} className={`flex-1 py-1.5 rounded-md text-sm font-bold transition ${refCurrency === 'usd' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}>Dólar (USD)</button>
                            <button type="button" onClick={() => setRefCurrency('eur')} className={`flex-1 py-1.5 rounded-md text-sm font-bold transition ${refCurrency === 'eur' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}>Euro (EUR)</button>
                        </div>
                        <div className="mt-3 flex justify-between items-center px-1">
                            <span className="text-sm text-gray-600 font-medium">Equivalente a cobrar:</span>
                            <div className="text-right">
                                <span className="text-lg font-bold text-gray-900 block">
                                    {formatBs(amount, refCurrency === 'usd' ? bcvRateUsd : bcvRateEur)}
                                </span>
                                <span className="text-[10px] text-gray-400 font-bold tracking-wide">
                                    TASA: {refCurrency === 'usd' ? bcvRateUsd : bcvRateEur} BS/{refCurrency.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button disabled={isLoading || amount <= 0} type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                            {isLoading ? 'Guardando...' : 'Registrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const NewOrderModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { selectedBranchId } = useAuthStore();
    const { createOrder, products, isLoading } = useFinancialStore();
    const { services, fetchInventory } = useInventoryStore();
    const { clients, offices, rooms, fetchClients, fetchOffices, fetchRooms } = useOperativeStore();

    useEffect(() => {
        fetchOffices(selectedBranchId ?? undefined);
        fetchRooms(selectedBranchId ?? undefined);
        fetchInventory();
    }, [selectedBranchId, fetchOffices, fetchRooms, fetchInventory]);

    const [clientId, setClientId] = useState<number>(clients[0]?.id || 0);
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

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchClients(selectedBranchId ?? undefined, clientSearch);
        }, 300);
        return () => clearTimeout(timer);
    }, [clientSearch, selectedBranchId, fetchClients]);

    const [catalogSearch, setCatalogSearch] = useState('');

    // Unified Catalog
    type CatalogItem = { id: number; type: string; name: string; price: number; meta: string };
    const allCatalogItems: CatalogItem[] = [
        ...products.filter(p => p.is_active).map(p => ({ id: p.id, type: 'product', name: p.name, price: p.price, meta: `Stock: ${p.stock} ` })),
        ...services.filter(s => s.is_active).map(s => ({ id: s.id, type: 'service', name: s.name, price: s.price, meta: 'Servicio' })),
        ...offices.filter(o => o.is_active && o.status === 'disponible').map(o => ({ id: o.id, type: 'office', name: o.name, price: o.monthly_rate, meta: `Capacidad: ${o.capacity} personas` })),
        ...rooms.filter(r => r.is_active && r.status === 'disponible').map(r => ({ id: r.id, type: 'room', name: r.name, price: r.hourly_rate, meta: `Por Hora(${r.capacity} pax)` }))
    ];
    const catalogItems = catalogSearch.trim()
        ? allCatalogItems.filter(i => i.name.toLowerCase().includes(catalogSearch.toLowerCase()) || i.type.toLowerCase().includes(catalogSearch.toLowerCase()))
        : allCatalogItems;

    // Derived state
    const subtotal = items.reduce((sum, it) => {
        let linePrice = it.unit_price * it.quantity;
        // Simple Amenity Deduction Logic (Client feedback loop)
        const svc = services.find(s => s.id === it.item_id && it.item_type === 'service');
        if (svc?.is_amenity) {
            const amenity = clientAmenities.find(a => a.name === it.itemName);
            if (amenity && amenity.quantity > 0) {
                const covered = Math.min(it.quantity, amenity.quantity);
                linePrice = (it.quantity - covered) * it.unit_price;
            }
        }
        return sum + linePrice;
    }, 0);

    const discountAmount = discountType === 'percentage' ? subtotal * (discount / 100) : discount;
    const base = Math.max(0, subtotal - discountAmount);
    const tax = base * 0.16;
    const total = base + tax;

    const handleAddItem = (item: CatalogItem) => {
        setItems(prev => {
            const existing = prev.find(i => i.item_id === item.id && i.item_type === item.type);
            if (existing && item.type !== 'room') {
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

    const handleRemoveItem = (id: number, type: string) => {
        setItems(prev => prev.filter(i => !(i.item_id === id && i.item_type === type)));
    };

    const handleUpdateQuantity = (id: number, type: string, qty: number) => {
        if (qty < 1) return;
        setItems(prev => prev.map(i => (i.item_id === id && i.item_type === type) ? { ...i, quantity: qty } : i));
    };

    const handleUpdateTimes = (id: number, type: string, start: string, end: string) => {
        setItems(prev => prev.map(i => (i.item_id === id && i.item_type === type) ? { ...i, start_time: start, end_time: end } : i));
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

        const ok = await createOrder({
            client_id: clientId,
            branch_id: selectedBranchId ?? 0,
            discount: discount,
            discount_type: discountType,
            status: "pending",
            details: items.map(it => ({
                ...it,
                start_time: it.start_time || undefined,
                end_time: it.end_time || undefined
            }))
        });
        if (ok) onClose();
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
                                    <Search size={14} />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Buscar cliente por nombre, correo o ID..."
                                    value={clientSearch || (clients.find(c => c.id === clientId)?.name || '')}
                                    onChange={e => {
                                        setClientSearch(e.target.value);
                                        setShowClientResults(true);
                                    }}
                                    onFocus={() => setShowClientResults(true)}
                                    className="w-full pl-9 pr-3 py-2 border rounded-lg outline-none bg-white focus:ring-2 focus:ring-indigo-500 text-sm"
                                />
                                {showClientResults && (clients.length > 0 || clientSearch) && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-xl max-h-60 overflow-auto">
                                        {clients.length === 0 ? (
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
                                                    <span className="text-[10px] text-gray-400">{c.email || 'Sin correo'} • {c.ci_rif || 'Sin ID'}</span>
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
                                                        <span className="text-sm font-medium text-gray-800">{item.itemName}</span>
                                                        <span className="text-xs text-gray-500">${item.unit_price.toFixed(2)} c/u {item.item_type === 'room' ? '(Sala)' : item.item_type === 'office' ? '(Oficina)' : ''}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
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
                                                            ${(() => {
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
                                                        <button type="button" onClick={() => handleRemoveItem(item.item_id, item.item_type)} className="text-red-400 hover:text-red-600 p-1"><X size={16} /></button>
                                                    </div>
                                                </div>

                                                {item.item_type === 'room' && (
                                                    <div className="mt-2 grid grid-cols-2 gap-2 border-t pt-2 border-dashed border-gray-200">
                                                        <div>
                                                            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-0.5">Inicio Reserva</label>
                                                            <input type="datetime-local" value={item.start_time}
                                                                onChange={e => handleUpdateTimes(item.item_id, item.item_type, e.target.value, item.end_time || '')}
                                                                className="w-full px-2 py-1 text-xs border rounded outline-none focus:ring-1 focus:ring-indigo-500" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-0.5">Fin Reserva</label>
                                                            <input type="datetime-local" value={item.end_time}
                                                                onChange={e => handleUpdateTimes(item.item_id, item.item_type, item.start_time || '', e.target.value)}
                                                                className="w-full px-2 py-1 text-xs border rounded outline-none focus:ring-1 focus:ring-indigo-500" />
                                                        </div>
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
                                <span>${subtotal.toFixed(2)}</span>
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
                                    <p className="text-sm font-medium text-gray-800">{citem.name}</p>
                                    <p className="text-[10px] text-gray-400 capitalize">{citem.type === 'office' ? 'Espacio' : citem.type === 'room' ? 'Sala' : citem.type === 'product' ? 'Producto' : 'Servicio'} • {citem.meta}</p>
                                </div>
                                <span className="text-sm font-bold text-indigo-600 group-hover:scale-110 transition-transform">${citem.price.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>
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

    useEffect(() => {
        fetchOffices(selectedBranchId ?? undefined);
        fetchRooms(selectedBranchId ?? undefined);
        fetchInventory();
    }, [selectedBranchId, fetchOffices, fetchRooms, fetchInventory]);

    const [discount, setDiscount] = useState(order.discount);
    const [discountType, setDiscountType] = useState<'amount' | 'percentage'>(order.discount_type ?? 'amount');
    // Initialize with existing details
    const [items, setItems] = useState<Pedido[]>(order.details ? order.details.map(d => ({
        ...d,
        itemName: d.item_name || `${d.item_type} #${d.item_id}`
    })) : []);
    const [reason, setReason] = useState('');
    const [catalogSearch, setCatalogSearch] = useState('');

    // Unified Catalog
    type CatalogItem = { id: number; type: string; name: string; price: number; meta: string };
    const allCatalogItems: CatalogItem[] = [
        ...products.filter(p => p.is_active).map(p => ({ id: p.id, type: 'product', name: p.name, price: p.price, meta: `Stock: ${p.stock} ` })),
        ...services.filter(s => s.is_active).map(s => ({ id: s.id, type: 'service', name: s.name, price: s.price, meta: 'Servicio' })),
        ...offices.filter(o => o.is_active && o.status === 'disponible').map(o => ({ id: o.id, type: 'office', name: o.name, price: o.monthly_rate, meta: `Capacidad: ${o.capacity} personas` })),
        ...rooms.filter(r => r.is_active && r.status === 'disponible').map(r => ({ id: r.id, type: 'room', name: r.name, price: r.hourly_rate, meta: `Por Hora(${r.capacity} pax)` }))
    ];
    const catalogItems = catalogSearch.trim()
        ? allCatalogItems.filter(i => i.name.toLowerCase().includes(catalogSearch.toLowerCase()) || i.type.toLowerCase().includes(catalogSearch.toLowerCase()))
        : allCatalogItems;

    const subtotal = items.reduce((sum, it) => sum + (it.unit_price * it.quantity), 0);
    const discountAmount = discountType === 'percentage' ? subtotal * (discount / 100) : discount;
    const base = Math.max(0, subtotal - discountAmount);
    const tax = base * 0.16;
    const total = base + tax;

    const handleAddItem = (item: CatalogItem) => {
        setItems(prev => {
            const existing = prev.find(i => i.item_id === item.id && i.item_type === item.type);
            if (existing) {
                return prev.map(i => (i.item_id === item.id && i.item_type === item.type) ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { item_type: item.type, item_id: item.id, itemName: item.name, unit_price: item.price, quantity: 1, discount: 0, subtotal: item.price }];
        });
    };

    const handleRemoveItem = (id: number, type: string) => {
        setItems(prev => prev.filter(i => !(i.item_id === id && i.item_type === type)));
    };

    const handleUpdateQuantity = (id: number, type: string, qty: number) => {
        const safeQty = isNaN(qty) ? 0 : Math.max(0, qty);
        setItems(prev => prev.map(i => (i.item_id === id && i.item_type === type) ? { ...i, quantity: safeQty } : i));
    };

    const handleUpdateTimes = (id: number, type: string, start: string, end: string) => {
        setItems(prev => prev.map(i => (i.item_id === id && i.item_type === type) ? { ...i, start_time: start, end_time: end } : i));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0 || !reason.trim()) return;

        const roomWithoutTime = items.find(i => i.item_type === 'room' && (!i.start_time || !i.end_time));
        if (roomWithoutTime) {
            alert(`Por favor defina el horario de reserva para la sala: ${roomWithoutTime.itemName}`);
            return;
        }

        const ok = await updateOrder(order.id, {
            discount: discount,
            discount_type: discountType,
            details: items.map(it => ({
                ...it,
                start_time: it.start_time || undefined,
                end_time: it.end_time || undefined
            })),
            reason: reason.trim()
        });
        if (ok) onClose();
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
                                                        <input type="number" min="0" value={item.quantity === 0 ? '' : item.quantity} onChange={e => handleUpdateQuantity(item.item_id, item.item_type, parseInt(e.target.value) || 0)}
                                                            className="w-16 px-2 py-1 text-sm border rounded text-center outline-none focus:ring-2 focus:ring-indigo-500" />
                                                        <span className="font-bold text-sm w-16 text-right">${(item.unit_price * item.quantity).toFixed(2)}</span>
                                                        <button type="button" onClick={() => handleRemoveItem(item.item_id, item.item_type)} className="text-red-400 hover:text-red-600 p-1"><X size={16} /></button>
                                                    </div>
                                                </div>
                                                {item.item_type === 'room' && (
                                                    <div className="mt-2 pt-2 border-t border-dashed grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="text-[10px] text-gray-400 uppercase font-bold">Inicio</label>
                                                            <input type="datetime-local" value={item.start_time ? item.start_time.slice(0, 16) : ''}
                                                                onChange={e => handleUpdateTimes(item.item_id, item.item_type, e.target.value, item.end_time || '')}
                                                                className="w-full text-xs px-2 py-1 border rounded" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] text-gray-400 uppercase font-bold">Fin</label>
                                                            <input type="datetime-local" value={item.end_time ? item.end_time.slice(0, 16) : ''}
                                                                onChange={e => handleUpdateTimes(item.item_id, item.item_type, item.start_time || '', e.target.value)}
                                                                className="w-full text-xs px-2 py-1 border rounded" />
                                                        </div>
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
                                <span>${subtotal.toFixed(2)}</span>
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
                                    <p className="text-sm font-medium text-gray-800">{citem.name}</p>
                                    <p className="text-[10px] text-gray-400 capitalize">{citem.type === 'office' ? 'Espacio' : citem.type === 'room' ? 'Sala' : citem.type === 'product' ? 'Producto' : 'Servicio'} • {citem.meta}</p>
                                </div>
                                <span className="text-sm font-bold text-blue-600 group-hover:scale-110 transition-transform">${citem.price.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};


const OrderDetailModal: React.FC<{ order: Orden; clientName: string; onClose: () => void }> = ({ order, clientName, onClose }) => {
    const paidAmount = order.receipts.reduce((sum, r) => sum + r.amount, 0);
    const remaining = order.total - paidAmount;
    const discountLabel = order.discount_type === 'percentage'
        ? `${order.discount}% (–$${(order.subtotal - (order.total / 1.16)).toFixed(2)})`
        : `$${order.discount.toFixed(2)}`;

    const itemTypeLabel = (type: string) => {
        const labels: Record<string, string> = { product: 'Producto', service: 'Servicio', office: 'Espacio', room: 'Sala', amenity: 'Amenidad', package: 'Paquete' };
        return labels[type] ?? type;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl z-10 overflow-hidden flex flex-col max-h-[88vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b bg-gradient-to-r from-indigo-600 to-indigo-500 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="font-bold text-white text-lg flex items-center gap-2">
                            <Eye size={18} /> Detalle Orden #{order.id}
                        </h2>
                        <p className="text-indigo-200 text-xs mt-0.5">{new Date(order.date).toLocaleString()}</p>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition">
                        <X size={18} />
                    </button>
                </div>

                <div className="overflow-auto flex-1 p-6 space-y-5">
                    {/* Client & Status */}
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider mb-0.5">Cliente</p>
                            <p className="text-lg font-bold text-gray-800">{clientName}</p>
                        </div>
                        <StatusBadge status={order.status} />
                    </div>

                    {/* Items Table */}
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider mb-2">Líneas de Pedido</p>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                    <tr>
                                        <th className="py-2 px-3 text-left font-semibold">Descripción</th>
                                        <th className="py-2 px-3 text-center font-semibold">Tipo</th>
                                        <th className="py-2 px-3 text-center font-semibold">Cant.</th>
                                        <th className="py-2 px-3 text-right font-semibold">P. Unit.</th>
                                        <th className="py-2 px-3 text-right font-semibold">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {order.details.map((d, i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            <td className="py-2.5 px-3 text-gray-800 font-medium">
                                                {d.item_name || `${itemTypeLabel(d.item_type)} #${d.item_id}`}
                                                {d.start_time && (
                                                    <span className="block text-xs text-gray-400 font-normal">
                                                        {new Date(d.start_time).toLocaleString()} → {d.end_time ? new Date(d.end_time).toLocaleString() : ''}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                                <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 text-xs font-semibold">{itemTypeLabel(d.item_type)}</span>
                                            </td>
                                            <td className="py-2.5 px-3 text-center text-gray-600">{d.quantity}</td>
                                            <td className="py-2.5 px-3 text-right text-gray-600">${Number(d.unit_price).toFixed(2)}</td>
                                            <td className="py-2.5 px-3 text-right font-semibold text-gray-800">${Number(d.subtotal).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm border">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>${order.subtotal.toFixed(2)}</span>
                        </div>
                        {order.discount > 0 && (
                            <div className="flex justify-between text-red-500">
                                <span>Descuento ({order.discount_type === 'percentage' ? `${order.discount}%` : 'fijo'})</span>
                                <span>–{discountLabel}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-gray-600">
                            <span>IVA (16%)</span>
                            <span>${order.tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t">
                            <span>Total</span>
                            <span>${order.total.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Payment Summary */}
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider mb-2">Pagos Registrados</p>
                        {order.receipts.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">Sin pagos registrados.</p>
                        ) : (
                            <div className="space-y-1.5">
                                {order.receipts.map((r, i) => (
                                    <ReceiptEntry key={i} receipt={r} />
                                ))}
                                <div className="flex justify-between text-sm font-semibold pt-1">
                                    <span className="text-gray-600">Total Pagado</span>
                                    <span className="text-emerald-600">${paidAmount.toFixed(2)}</span>
                                </div>
                                {remaining > 0.01 && (
                                    <div className="flex justify-between text-sm font-semibold">
                                        <span className="text-gray-600">Saldo Pendiente</span>
                                        <span className="text-red-500">${remaining.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-6 py-4 border-t shrink-0 flex justify-end">
                    <button onClick={onClose} className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

const OrdersPage: React.FC = () => {
    const { selectedBranchId } = useAuthStore();
    const { orders, fetchOrders, fetchProducts, fetchPaymentMethods, isLoading } = useFinancialStore();
    const { bcvRateUsd } = useSystemStore();
    const { clients, fetchClients } = useOperativeStore();
    const [search, setSearch] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [payOrder, setPayOrder] = useState<Orden | null>(null);
    const [deleteOrderTarget, setDeleteOrderTarget] = useState<Orden | null>(null);
    const [logsOrderTarget, setLogsOrderTarget] = useState<Orden | null>(null);
    const [editOrderTarget, setEditOrderTarget] = useState<Orden | null>(null);
    const [detailOrderTarget, setDetailOrderTarget] = useState<Orden | null>(null);

    useEffect(() => {
        fetchOrders(selectedBranchId ?? undefined);
        fetchProducts(selectedBranchId ?? undefined);
        fetchClients();
        fetchPaymentMethods(selectedBranchId ?? undefined);
    }, [selectedBranchId, fetchOrders, fetchProducts, fetchClients, fetchPaymentMethods]);

    const getClientName = (id: number) => clients.find(c => c.id === id)?.name || 'Cliente desconocido';

    const filtered = orders.filter(o =>
        getClientName(o.client_id).toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
                                Cliente: getClientName(o.client_id),
                                Fecha: new Date(o.date).toLocaleDateString(),
                                Subtotal: o.subtotal,
                                Descuento: o.discount,
                                Total: o.total,
                                Pagado: o.receipts.reduce((sum, r) => sum + r.amount, 0),
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
                <div className="relative max-w-sm w-full">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por cliente..."
                        className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition" />
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
                            <thead className="bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wide">
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
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map(o => {
                                    const paidAmount = o.receipts.reduce((sum, r) => sum + r.amount, 0);
                                    return (
                                        <tr key={o.id} className="hover:bg-indigo-50/20 transition group">
                                            <td className="py-3 px-4 text-sm text-gray-500">#{o.id}</td>
                                            <td className="py-3 px-4 font-medium text-gray-800 text-sm">{getClientName(o.client_id)}</td>
                                            <td className="py-3 px-4 text-xs text-gray-500">{new Date(o.date).toLocaleDateString()}</td>
                                            <td className="py-3 px-4">
                                                <div className="font-bold text-gray-900">${o.total.toFixed(2)}</div>
                                                {bcvRateUsd && <div className="text-xs text-gray-500 font-medium mt-0.5">{formatBs(o.total, bcvRateUsd)}</div>}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="text-sm text-emerald-600 font-medium">${paidAmount.toFixed(2)}</div>
                                                {bcvRateUsd && <div className="text-xs text-emerald-500 mt-0.5">{formatBs(paidAmount, bcvRateUsd)}</div>}
                                            </td>
                                            <td className="py-3 px-4"><StatusBadge status={o.status} /></td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex justify-end gap-1.5 items-center">
                                                    <button
                                                        onClick={() => setDetailOrderTarget(o)}
                                                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                        title="Ver Detalle"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setLogsOrderTarget(o)}
                                                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                        title="Ver Bitácora"
                                                    >
                                                        <History size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditOrderTarget(o)}
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                                        title="Editar Orden"
                                                        disabled={o.status === 'cancelled' || o.status === 'paid'}
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteOrderTarget(o)}
                                                        disabled={o.status === 'cancelled'}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                                        title="Anular / Eliminar"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    <div className="w-px h-4 bg-gray-200 mx-1"></div>
                                                    <button
                                                        onClick={() => setPayOrder(o)}
                                                        disabled={o.status === 'paid' || o.status === 'cancelled'}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded border shadow-sm
                                                        disabled:opacity-50 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200
                                                        bg-white text-emerald-600 hover:bg-emerald-50 border-emerald-200"
                                                    >
                                                        <ReceiptIcon size={14} /> Cobrar
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
            {payOrder && <PaymentModal order={payOrder} onClose={() => { setPayOrder(null); fetchOrders(selectedBranchId ?? undefined); }} />}
            {deleteOrderTarget && <DeleteOrderModal order={deleteOrderTarget} onClose={() => { setDeleteOrderTarget(null); }} />}
            {editOrderTarget && <EditOrderModal order={editOrderTarget} onClose={() => { setEditOrderTarget(null); }} />}
            {logsOrderTarget && <OrderLogsModal orderId={logsOrderTarget.id} onClose={() => setLogsOrderTarget(null)} />}
            {detailOrderTarget && (
                <OrderDetailModal
                    order={detailOrderTarget}
                    clientName={getClientName(detailOrderTarget.client_id)}
                    onClose={() => setDetailOrderTarget(null)}
                />
            )}
        </div>
    );
};

export default OrdersPage;
