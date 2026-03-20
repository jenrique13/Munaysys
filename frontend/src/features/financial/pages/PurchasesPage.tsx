import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { useFinancialStore } from '../hooks/useFinancialStore';
import { useProvidersStore } from '../hooks/useProvidersStore';
import type { Purchase, PurchaseDetail, Product, PaymentMethod } from '../types';
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

const PAYMENT_METHODS: PaymentMethod[] = [
    "Efectivo", "Mercantil (Venezuela)", "Banesco (Venezuela)", "BNC",
    "Mercantil (Panamá)", "Banesco (Panamá)", "Facebank", "Zelle", "PayPal", "Intercambio"
];

const PaymentModal: React.FC<{ purchase: Purchase; onClose: () => void }> = ({ purchase, onClose }) => {
    const { createReceipt, isLoading } = useFinancialStore();
    const [amount, setAmount] = useState<number>(purchase.total - purchase.receipts.reduce((sum, r) => sum + r.amount, 0));
    const [method, setMethod] = useState<PaymentMethod>("Efectivo");
    const [reference, setReference] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const ok = await createReceipt({
            purchase_id: purchase.id,
            amount,
            type: "expense",
            payment_method: method,
            reference
        });
        if (ok) onClose();
    };

    const remaining = purchase.total - purchase.receipts.reduce((sum, r) => sum + r.amount, 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm z-10 overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2"><DollarSign size={18} /> Pago a Proveedor</h2>
                    <button onClick={onClose} className="text-gray-400 hover:bg-gray-100 p-1 rounded-full"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-red-50 text-red-800 text-xs p-3 rounded-lg border border-red-100 mb-4">
                        <p>Total de la Compra: <strong>${purchase.total.toFixed(2)}</strong></p>
                        <p>Deuda Restante: <strong>${remaining.toFixed(2)}</strong></p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Monto a abonar ($)</label>
                        <input type="number" step="0.01" max={remaining} required value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta/Método de Pago</label>
                        <select value={method} onChange={e => setMethod(e.target.value as PaymentMethod)}
                            className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500">
                            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Referencia</label>
                        <input value={reference} onChange={e => setReference(e.target.value)} placeholder="Comprobante, Nro de operación..."
                            className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button disabled={isLoading || amount <= 0} type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                            {isLoading ? 'Guardando...' : 'Registrar Pago'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const NewPurchaseModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { selectedBranchId } = useAuthStore();
    const { createPurchase, products, isLoading } = useFinancialStore();
    const { providers, fetchProviders } = useProvidersStore();

    const [providerId, setProviderId] = useState<number | ''>('');
    const [items, setItems] = useState<PurchaseDetail[]>([]);
    const [manualItem, setManualItem] = useState({ description: '', unit_cost: 0, quantity: 1 });

    const subtotal = items.reduce((sum, it) => sum + (it.unit_cost * it.quantity), 0);
    const tax = subtotal * 0.16;
    const total = subtotal + tax;

    const handleAddProduct = (product: Product) => {
        setItems(prev => {
            const existing = prev.find(i => i.product_id === product.id);
            if (existing) {
                return prev.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { product_id: product.id, productName: product.name, unit_cost: product.price, quantity: 1, subtotal: product.price }];
        });
    };

    const handleAddManualItem = () => {
        if (!manualItem.description) return;
        setItems(prev => [...prev, {
            description: manualItem.description,
            productName: manualItem.description, // for UI display 
            unit_cost: manualItem.unit_cost,
            quantity: manualItem.quantity,
            subtotal: manualItem.unit_cost * manualItem.quantity
        }]);
        setManualItem({ description: '', unit_cost: 0, quantity: 1 });
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
            details: items
        });
        if (ok) onClose();
    };

    useEffect(() => {
        fetchProviders();
    }, [fetchProviders]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl z-10 flex h-[80vh] overflow-hidden">
                <div className="flex-1 flex flex-col border-r h-full bg-gray-50">
                    <div className="px-6 py-4 border-b bg-white shrink-0">
                        <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2"><ShoppingCart size={18} /> Registro de Compra a Proveedor</h2>
                    </div>
                    <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6 flex flex-col gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Proveedor *</label>
                            <select required value={providerId} onChange={e => setProviderId(Number(e.target.value))}
                                className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="" disabled>Seleccione un proveedor...</option>
                                {providers.map((p: any) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            {providers.length === 0 && <p className="text-xs text-red-500 mt-1">Debe registrar proveedores primero.</p>}
                        </div>

                        <div className="flex-1 border rounded-xl bg-white overflow-hidden flex flex-col">
                            <div className="bg-gray-100 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between items-center">
                                <span>Líneas de Compra</span>
                            </div>

                            <div className="p-2 border-b bg-gray-50 flex gap-2 items-end">
                                <div className="flex-1">
                                    <label className="text-[10px] text-gray-500 font-bold uppercase">ítem Manual o Servicio</label>
                                    <input value={manualItem.description} onChange={e => setManualItem(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Descripción libre..." className="w-full px-2 py-1 text-sm border rounded outline-none" />
                                </div>
                                <div className="w-20">
                                    <label className="text-[10px] text-gray-500 font-bold uppercase">Costo Un.</label>
                                    <input type="number" step="0.01" value={manualItem.unit_cost} onChange={e => setManualItem(prev => ({ ...prev, unit_cost: parseFloat(e.target.value) || 0 }))}
                                        className="w-full px-2 py-1 text-sm border rounded outline-none" />
                                </div>
                                <div className="w-16">
                                    <label className="text-[10px] text-gray-500 font-bold uppercase">Cant.</label>
                                    <input type="number" min="1" value={manualItem.quantity} onChange={e => setManualItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                                        className="w-full px-2 py-1 text-sm border rounded outline-none" />
                                </div>
                                <button type="button" onClick={handleAddManualItem} disabled={!manualItem.description} className="px-3 py-1 bg-gray-200 hover:bg-indigo-600 hover:text-white rounded text-sm font-bold transition-colors disabled:opacity-50">Add</button>
                            </div>

                            <div className="flex-1 overflow-auto p-2">
                                {items.length === 0 ? (
                                    <div className="text-center py-6 text-gray-400 text-sm flex flex-col items-center">
                                        <p>Agrega ítems del catálogo para abastecer stock físico, o utiliza entradas manuales para otro tipo de compras/servicios.</p>
                                    </div>
                                ) : (
                                    <ul className="space-y-2">
                                        {items.map((item, index) => (
                                            <li key={index} className="flex items-center justify-between p-2 border border-gray-100 rounded hover:bg-gray-50 transition">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-800 flex items-center gap-2">
                                                        {item.productName}
                                                        {item.product_id && <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 rounded uppercase tracking-wider">Aumenta Stock</span>}
                                                    </span>
                                                    <span className="text-xs text-gray-500">Costo c/u: ${item.unit_cost.toFixed(2)}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <input type="number" min="1" value={item.quantity} onChange={e => handleUpdateQuantity(index, parseInt(e.target.value))}
                                                        className="w-16 px-2 py-1 text-sm border rounded text-center outline-none focus:ring-1" />
                                                    <span className="font-bold text-sm w-16 text-right">${(item.unit_cost * item.quantity).toFixed(2)}</span>
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
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-600 pb-2 border-b">
                                <span>IVA (16%)</span>
                                <span>${tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-lg font-bold text-gray-900 pt-1">
                                <span>Total a Pagar</span>
                                <span>${total.toFixed(2)}</span>
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
                            <input placeholder="Filtrar productos..." className="w-full pl-8 pr-3 py-1.5 border rounded-lg text-sm bg-white" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto p-2 space-y-1">
                        {products.filter(p => p.type === 'physical').map(p => (
                            <div key={p.id} className="p-3 border border-transparent hover:border-indigo-100 hover:bg-indigo-50/50 rounded-lg cursor-pointer transition flex justify-between items-center group"
                                onClick={() => handleAddProduct(p)}>
                                <div>
                                    <p className="text-sm font-medium text-gray-800">{p.name}</p>
                                    <p className="text-[10px] font-bold text-indigo-600">Stock actual: {p.stock}</p>
                                </div>
                                <Plus size={16} className="text-gray-400 group-hover:text-indigo-600" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const PurchasesPage: React.FC = () => {
    const { selectedBranchId } = useAuthStore();
    const { purchases, fetchPurchases, fetchProducts, isLoading } = useFinancialStore();
    const [search, setSearch] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [payPurchase, setPayPurchase] = useState<Purchase | null>(null);

    useEffect(() => {
        fetchPurchases(selectedBranchId ?? undefined);
        fetchProducts(selectedBranchId ?? undefined);
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
                                Pagado: p.receipts.reduce((sum, r) => sum + r.amount, 0),
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
                                    const paidAmount = p.receipts.reduce((sum, r) => sum + r.amount, 0);
                                    return (
                                        <tr key={p.id} className="hover:bg-indigo-50/20 transition group">
                                            <td className="py-3 px-4 text-sm text-gray-500">#{p.id}</td>
                                            <td className="py-3 px-4 font-medium text-gray-800 text-sm">{p.provider_name}</td>
                                            <td className="py-3 px-4 text-xs text-gray-500">{new Date(p.date).toLocaleDateString()}</td>
                                            <td className="py-3 px-4 font-bold text-gray-900">${p.total.toFixed(2)}</td>
                                            <td className="py-3 px-4 text-sm text-emerald-600 font-medium">${paidAmount.toFixed(2)}</td>
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
