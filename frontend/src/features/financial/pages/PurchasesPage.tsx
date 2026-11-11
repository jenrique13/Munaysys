import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { useFinancialStore } from '../hooks/useFinancialStore';
import { useProvidersStore } from '../hooks/useProvidersStore';
import { useSystemStore } from '../../system/hooks/useSystemStore';
import { formatCurrency, formatBs } from '../../../utils/format';
import type { Purchase, PurchaseDetail, Product } from '../types';
import { ShoppingCart, Plus, Search, DollarSign, X, Receipt as ReceiptIcon, Download } from 'lucide-react';

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

const PaymentModal: React.FC<{ purchase: Purchase; onClose: () => void }> = ({ purchase, onClose }) => {
    const { createReceipt, isLoading, paymentMethods } = useFinancialStore();
    const { bcvRateUsd, bcvRateEur } = useSystemStore();
    const [amount, setAmount] = useState<number>(purchase.total - purchase.receipts.reduce((sum, r) => sum + Number(r.amount), 0));
    const [method, setMethod] = useState<string>(paymentMethods.find(m => m.is_active)?.name || "Efectivo");
    const [reference, setReference] = useState('');
    const [refCurrency, setRefCurrency] = useState<'usd' | 'eur'>('usd');
    const [customRate, setCustomRate] = useState<number>(0);

    // Update customRate when refCurrency or BCV rates change
    useEffect(() => {
        const rate = refCurrency === 'usd' ? bcvRateUsd : bcvRateEur;
        setCustomRate(rate || 0);
    }, [refCurrency, bcvRateUsd, bcvRateEur]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const ok = await createReceipt({
            purchase_id: purchase.id,
            amount,
            type: "expense",
            payment_method: method as any,
            reference,
            exchange_rate: customRate,
            exchange_currency: refCurrency
        });
        if (ok) onClose();
    };

    const remaining = purchase.total - purchase.receipts.reduce((sum, r) => sum + Number(r.amount), 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl z-10 flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
                    <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2"><DollarSign size={18} /> Pago a Proveedor</h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:bg-gray-100 p-1 rounded-full"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden min-h-0">
                    <div className="flex flex-col md:flex-row overflow-y-auto min-h-0">
                        {/* Columna Izquierda: Resumen */}
                        <div className="w-full md:w-1/2 p-5 lg:p-6 bg-slate-50/50 border-r border-gray-100 flex flex-col">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Resumen de la Compra</h3>
                            <div className="bg-white shadow-sm text-red-900 text-sm p-5 rounded-xl border border-red-100/60 flex-1 flex flex-col justify-center">
                                <div className="flex justify-between mb-4 opacity-80">
                                    <span>Total de la Compra:</span>
                                    <span className="font-medium text-lg">${purchase.total.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between border-t border-red-200/60 pt-4">
                                    <span className="font-bold mt-1">Deuda Restante:</span>
                                    <div className="text-right">
                                        <span className="font-black text-2xl block">${remaining.toFixed(2)}</span>
                                        <span className="text-xs opacity-70">Pendiente de Pago</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Columna Derecha: Formulario */}
                        <div className="w-full md:w-1/2 p-5 lg:p-6 space-y-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Detalles del Pago</h3>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Monto a abonar ($)</label>
                                <input type="number" step="0.01" max={remaining} required value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-lg font-bold text-indigo-700 bg-indigo-50/30" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta/Método de Pago</label>
                                <select value={method} onChange={e => setMethod(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500">
                                    {paymentMethods.filter(m => m.is_active).map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                                    {paymentMethods.filter(m => m.is_active).length === 0 && <option value="Efectivo">Efectivo (Default)</option>}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Referencia (Opcional)</label>
                                <input value={reference} onChange={e => setReference(e.target.value)} placeholder="Comprobante, Nro de operación..."
                                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                            </div>

                            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">Tasa de Cambio Manual</label>
                                <div className="flex gap-2 mb-3">
                                    <button type="button" onClick={() => setRefCurrency('usd')} className={`flex-1 py-1.5 rounded-md text-xs font-bold transition ${refCurrency === 'usd' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}>Dólar (USD)</button>
                                    <button type="button" onClick={() => setRefCurrency('eur')} className={`flex-1 py-1.5 rounded-md text-xs font-bold transition ${refCurrency === 'eur' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}>Euro (EUR)</button>
                                </div>
                                
                                <div className="relative mb-3">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">BS</span>
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        value={customRate} 
                                        onChange={e => setCustomRate(parseFloat(e.target.value) || 0)}
                                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                                    <span className="text-sm text-gray-600 font-medium">Equivalente a pagar:</span>
                                    <div className="text-right">
                                        <span className="text-lg font-black text-gray-900 block">
                                            {formatBs(amount, customRate)}
                                        </span>
                                    </div>
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

const NewPurchaseModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { selectedBranchId } = useAuthStore();
    const { createPurchase, products, consumables, isLoading, fetchProducts, fetchConsumables, cashCategories, fetchCashCategories } = useFinancialStore();
    const { providers, fetchProviders } = useProvidersStore();

    const [providerId, setProviderId] = useState<number | ''>('');
    const expenseCategories = cashCategories.filter(c => c.type === 'expense' && c.is_active);
    const [category, setCategory] = useState<string>("");

    useEffect(() => {
        if (!category && expenseCategories.length > 0) {
            setCategory(expenseCategories[0].name);
        }
    }, [expenseCategories, category]);
    const [items, setItems] = useState<PurchaseDetail[]>([]);
    const [manualItem, setManualItem] = useState({ 
        description: '', 
        unit_cost: 0, 
        sales_price: 0, 
        quantity: 1, 
        item_type: 'product' as 'product' | 'consumable',
        unit: 'unidad'
    });
    const [catalogSearch, setCatalogSearch] = useState('');

    const combinedCatalog = [
        ...products.filter(p => p.type === 'physical').map(p => ({ ...p, item_type: 'product' as const })),
        ...consumables.map(c => ({ ...c, item_type: 'consumable' as const }))
    ];

    const filteredCatalog = combinedCatalog.filter(p =>
        p.name.toLowerCase().includes(catalogSearch.toLowerCase())
    );

    const subtotal = items.reduce((sum, it) => sum + (it.unit_cost * it.quantity), 0);
    const tax = subtotal * 0.16;
    const total = subtotal + tax;

    const handleAddFromCatalog = (entry: any) => {
        setItems(prev => {
            const existing = prev.find(i => 
                entry.item_type === 'product' ? i.product_id === entry.id : i.consumable_id === entry.id
            );
            if (existing) {
                return prev.map(i => {
                    const match = entry.item_type === 'product' ? i.product_id === entry.id : i.consumable_id === entry.id;
                    return match ? { ...i, quantity: i.quantity + 1 } : i;
                });
            }
            return [...prev, { 
                product_id: entry.item_type === 'product' ? entry.id : undefined,
                consumable_id: entry.item_type === 'consumable' ? entry.id : undefined,
                item_type: entry.item_type,
                productName: entry.name, 
                unit_cost: entry.price || entry.cost || 0, 
                sales_price: entry.price,
                quantity: 1, 
                subtotal: entry.price || entry.cost || 0 
            }];
        });
    };

    const handleAddManualItem = () => {
        if (!manualItem.description) return;
        if (manualItem.item_type === 'product' && manualItem.sales_price <= 0) return;

        setItems(prev => [...prev, {
            item_type: manualItem.item_type,
            description: manualItem.description,
            productName: manualItem.description, // for UI display 
            unit_cost: manualItem.unit_cost,
            sales_price: manualItem.item_type === 'product' ? manualItem.sales_price : undefined,
            quantity: manualItem.quantity,
            unit: manualItem.unit,
            subtotal: manualItem.unit_cost * manualItem.quantity
        }]);
        setManualItem({ 
            description: '', 
            unit_cost: 0, 
            sales_price: 0, 
            quantity: 1, 
            item_type: manualItem.item_type, 
            unit: 'unidad' 
        });
    };

    const handleRemoveItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpdateQuantity = (index: number, val: number) => {
        if (val < 1) return;
        setItems(prev => prev.map((item, i) => i === index ? { ...item, quantity: val } : item));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0 || !providerId) return;

        const selectedProv = providers.find((p: any) => p.id === providerId);

        const ok = await createPurchase({
            provider_id: providerId as number,
            provider_name: selectedProv?.name || 'Proveedor Descocido',
            branch_id: selectedBranchId ?? 0,
            status: "pending",
            category: category,
            details: items
        });
        if (ok) {
            // Refresh catalog
            await fetchProducts(selectedBranchId ?? undefined);
            await fetchConsumables(selectedBranchId ?? undefined);
            onClose();
        }
    };

    useEffect(() => {
        fetchProviders();
        fetchConsumables(selectedBranchId ?? undefined);
        fetchCashCategories();
    }, [fetchProviders, fetchConsumables, selectedBranchId, fetchCashCategories]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl z-10 flex h-[80vh] overflow-hidden">
                <div className="flex-1 flex flex-col border-r h-full bg-gray-50">
                    <div className="px-6 py-4 border-b bg-white shrink-0">
                        <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2"><ShoppingCart size={18} /> Registro de Compra a Proveedor</h2>
                    </div>
                    <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6 flex flex-col gap-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor *</label>
                                <select required value={providerId} onChange={e => setProviderId(Number(e.target.value))}
                                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500">
                                    <option value="" disabled>Seleccione un proveedor...</option>
                                    {providers.map((p: any) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría de Gasto *</label>
                                <select required value={category} onChange={e => setCategory(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500">
                                    {expenseCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    {expenseCategories.length === 0 && <option value="Compras">Compras (Default)</option>}
                                </select>
                            </div>
                        </div>

                        <div className="flex-1 border rounded-xl bg-white overflow-hidden flex flex-col">
                            <div className="bg-gray-100 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between items-center">
                                <span>Líneas de Compra</span>
                            </div>

                            <div className="p-3 border-b bg-gray-50 flex flex-wrap gap-3 items-end">
                                <div className="w-32">
                                    <label className="text-[10px] text-gray-500 font-bold uppercase">Tipo</label>
                                    <select 
                                        value={manualItem.item_type} 
                                        onChange={e => setManualItem(prev => ({ ...prev, item_type: e.target.value as any }))}
                                        className="w-full px-2 py-1 text-sm border rounded outline-none bg-white"
                                    >
                                        <option value="product">Producto</option>
                                        <option value="consumable">Consumible</option>
                                    </select>
                                </div>
                                <div className="flex-1 min-w-[150px]">
                                    <label className="text-[10px] text-gray-500 font-bold uppercase">Nombre del Ítem</label>
                                    <input value={manualItem.description} onChange={e => setManualItem(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Descripción o nombre..." className="w-full px-2 py-1 text-sm border rounded outline-none" />
                                </div>
                                <div className="w-20">
                                    <label className="text-[10px] text-gray-500 font-bold uppercase">Costo Un.</label>
                                    <input type="number" step="0.01" value={manualItem.unit_cost} onChange={e => setManualItem(prev => ({ ...prev, unit_cost: parseFloat(e.target.value) || 0 }))}
                                        className="w-full px-2 py-1 text-sm border rounded outline-none" />
                                </div>
                                {manualItem.item_type === 'product' ? (
                                    <div className="w-24">
                                        <label className="text-[10px] text-indigo-500 font-bold uppercase">Precio Venta</label>
                                        <input type="number" step="0.01" value={manualItem.sales_price} onChange={e => setManualItem(prev => ({ ...prev, sales_price: parseFloat(e.target.value) || 0 }))}
                                            className="w-full px-2 py-1 text-sm border-indigo-200 border rounded outline-none focus:ring-1 focus:ring-indigo-500" />
                                    </div>
                                ) : (
                                    <div className="w-24">
                                        <label className="text-[10px] text-amber-500 font-bold uppercase">Unidad</label>
                                        <input value={manualItem.unit} onChange={e => setManualItem(prev => ({ ...prev, unit: e.target.value }))}
                                            placeholder="cj, lt, kg..." className="w-full px-2 py-1 text-sm border-amber-200 border rounded outline-none focus:ring-1 focus:ring-amber-500" />
                                    </div>
                                )}
                                <div className="w-16">
                                    <label className="text-[10px] text-gray-500 font-bold uppercase">Cant.</label>
                                    <input type="number" min="1" value={manualItem.quantity} onChange={e => setManualItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                                        className="w-full px-2 py-1 text-sm border rounded outline-none" />
                                </div>
                                <button type="button" onClick={handleAddManualItem} 
                                    disabled={!manualItem.description || (manualItem.item_type === 'product' && manualItem.sales_price <= 0)} 
                                    className="px-3 py-1 bg-gray-200 hover:bg-indigo-600 hover:text-white rounded text-sm font-bold transition-colors disabled:opacity-50">Add</button>
                            </div>

                            <div className="flex-1 overflow-auto p-2">
                                {items.length === 0 ? (
                                    <div className="text-center py-6 text-gray-400 text-sm flex flex-col items-center">
                                        <p>Agrega ítems del catálogo o escribe uno nuevo arriba.</p>
                                        <p className="text-xs mt-1 text-indigo-400 font-medium">Los ítems nuevos se crearán automáticamente en el inventario de esta sede.</p>
                                    </div>
                                ) : (
                                    <ul className="space-y-2">
                                        {items.map((item, index) => (
                                            <li key={index} className="flex items-center justify-between p-2 border border-gray-100 rounded hover:bg-gray-50 transition">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-800 flex items-center gap-2">
                                                        {item.productName}
                                                        {item.item_type === 'product' && (item.product_id 
                                                            ? <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 rounded uppercase tracking-wider font-bold">Stock Venta</span>
                                                            : <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 rounded uppercase tracking-wider font-bold">Nuevo Producto</span>
                                                        )}
                                                        {item.item_type === 'consumable' && (item.consumable_id
                                                            ? <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 rounded uppercase tracking-wider font-bold">Stock Consumo</span>
                                                            : <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 rounded uppercase tracking-wider font-bold">Nuevo Consumible</span>
                                                        )}
                                                    </span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs text-gray-500">Costo: €{item.unit_cost.toFixed(2)}</span>
                                                        {item.sales_price && <span className="text-xs text-indigo-500 font-medium">P.Venta: €{item.sales_price.toFixed(2)}</span>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <input type="number" min="1" value={item.quantity} onChange={e => handleUpdateQuantity(index, parseInt(e.target.value))}
                                                        className="w-16 px-2 py-1 text-sm border rounded text-center outline-none focus:ring-1" />
                                                    <span className="font-bold text-sm w-16 text-right">€{(item.unit_cost * item.quantity).toFixed(2)}</span>
                                                    <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-400 hover:text-red-600 p-1"><X size={16} /></button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2 text-sm">
                            <div className="flex justify-between items-center text-gray-600">
                                <span>Subtotal Gravable</span>
                                <span>€{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-600 pb-2 border-b">
                                <span>IVA (16%)</span>
                                <span>€{tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-lg font-bold text-gray-900 pt-1">
                                <span>Total a Pagar</span>
                                <span>€{total.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-auto shrink-0 pt-4">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg">Cancelar</button>
                            <button disabled={isLoading || items.length === 0} type="submit" className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                                {isLoading ? 'Procesando...' : 'Registrar Compra'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="w-[300px] shrink-0 bg-white flex flex-col">
                    <div className="px-4 py-4 border-b bg-gray-50 shrink-0">
                        <h3 className="font-bold text-sm text-gray-700 uppercase tracking-widest mb-3">Catálogo (Stock)</h3>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                value={catalogSearch}
                                onChange={e => setCatalogSearch(e.target.value)}
                                placeholder="Filtrar catálogo..."
                                className="w-full pl-8 pr-3 py-1.5 border rounded-lg text-sm bg-white"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto p-2 space-y-1">
                        {filteredCatalog.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-xs px-4">
                                {catalogSearch
                                    ? <p>No hay resultados para "<strong>{catalogSearch}</strong>".</p>
                                    : <p>No hay inventario registrado en esta sede. Usa el formulario para agregar ítems manuales.</p>
                                }
                            </div>
                        ) : (
                            filteredCatalog.map((p, idx) => (
                                <div key={idx} className="p-3 border border-transparent hover:border-indigo-100 hover:bg-indigo-50/50 rounded-lg cursor-pointer transition flex justify-between items-center group"
                                    onClick={() => handleAddFromCatalog(p)}>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                                            <span className={`text-[8px] px-1 rounded uppercase font-bold tracking-tighter ${p.item_type === 'product' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                                                {p.item_type === 'product' ? 'Prod' : 'Cons'}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-400">Existencia: {p.stock} {(p as any).unit || 'unidades'}</p>
                                    </div>
                                    <Plus size={14} className="text-gray-300 group-hover:text-indigo-600 shrink-0" />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const PurchasesPage: React.FC = () => {
    const { selectedBranchId } = useAuthStore();
    const { purchases, fetchPurchases, fetchProducts, fetchConsumables, isLoading } = useFinancialStore();
    const { bcvRateUsd } = useSystemStore();
    const [search, setSearch] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [payPurchase, setPayPurchase] = useState<Purchase | null>(null);

    useEffect(() => {
        fetchPurchases(selectedBranchId ?? undefined);
        fetchProducts(selectedBranchId ?? undefined);
        fetchConsumables(selectedBranchId ?? undefined);
    }, [selectedBranchId]);

    const filtered = purchases.filter(p =>
        p.provider_name.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="flex flex-col h-full bg-gray-50/30">
            <div className="bg-white px-6 py-4 flex justify-between items-center shrink-0 border-b">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <ShoppingCart size={22} className="text-indigo-600" /> Compras a Proveedores
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Gestión de facturas de proveedores y abastecimiento interno.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => {
                        import('../../../utils/exportToCSV').then(({ exportToCSV }) => {
                            const exportData = filtered.map(p => ({
                                ID: `COM-${p.id}`,
                                Proveedor: p.provider_name,
                                Fecha: new Date(p.date).toLocaleDateString(),
                                Total: p.total,
                                Pagado: p.receipts.reduce((sum, r) => sum + Number(r.amount), 0),
                                Estado: p.status
                            }));
                            exportToCSV(exportData, 'reporte_compras');
                        });
                    }} className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
                        <Download size={16} /> Exportar
                    </button>
                    <button onClick={() => setShowNew(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
                        <Plus size={16} /> Nueva Compra
                    </button>
                </div>
            </div>

            <div className="px-6 py-3 bg-white border-b shrink-0 flex items-center justify-between">
                <div className="relative max-w-sm w-full">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por proveedor..."
                        className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition" />
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {isLoading && purchases.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">Cargando compras...</div>
                    ) : filtered.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            <ShoppingCart size={36} className="mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No hay compras registradas</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                <tr>
                                    <th className="py-3 px-4">ID</th>
                                    <th className="py-3 px-4">Proveedor</th>
                                    <th className="py-3 px-4">Fecha</th>
                                    <th className="py-3 px-4">Monto Total</th>
                                    <th className="py-3 px-4">Pagado</th>
                                    <th className="py-3 px-4">Estado</th>
                                    <th className="py-3 px-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map(p => {
                                    const paidAmount = p.receipts.reduce((sum, r) => sum + Number(r.amount), 0);
                                    return (
                                        <tr key={p.id} className="hover:bg-indigo-50/20 transition group">
                                            <td className="py-3 px-4 text-sm text-gray-500">#{p.id}</td>
                                            <td className="py-3 px-4 font-medium text-gray-800 text-sm">{p.provider_name}</td>
                                            <td className="py-3 px-4 text-xs text-gray-500">{new Date(p.date).toLocaleDateString()}</td>
                                            <td className="py-3 px-4">
                                                <div className="font-bold text-gray-900">€{p.total.toFixed(2)}</div>
                                                {bcvRateUsd && <div className="text-xs text-gray-500 font-medium mt-0.5">{formatBs(p.total, bcvRateUsd)}</div>}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="text-sm text-emerald-600 font-medium">€{paidAmount.toFixed(2)}</div>
                                                {bcvRateUsd && <div className="text-xs text-emerald-500 mt-0.5">{formatBs(paidAmount, bcvRateUsd)}</div>}
                                            </td>
                                            <td className="py-3 px-4"><StatusBadge status={p.status} /></td>
                                            <td className="py-3 px-4 text-right">
                                                <button
                                                    onClick={() => setPayPurchase(p)}
                                                    disabled={p.status === 'paid' || p.status === 'cancelled'}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-sm
                                                    disabled:opacity-50 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200
                                                    bg-white text-indigo-600 hover:bg-indigo-50 border-indigo-200"
                                                >
                                                    <ReceiptIcon size={14} /> Pagar
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {showNew && <NewPurchaseModal onClose={() => setShowNew(false)} />}
            {payPurchase && <PaymentModal purchase={payPurchase} onClose={() => { setPayPurchase(null); fetchPurchases(selectedBranchId ?? undefined); }} />}
        </div>
    );
};

export default PurchasesPage;
