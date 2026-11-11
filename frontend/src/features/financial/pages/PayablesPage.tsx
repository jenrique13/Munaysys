import React, { useEffect, useState, useRef } from 'react';
import { useProvidersStore } from '../hooks/useProvidersStore';
import { useSystemStore } from '../../system/hooks/useSystemStore';
import { useFinancialStore } from '../hooks/useFinancialStore';
import { formatCurrency, formatBs } from '../../../utils/format';
import { Plus, Search, Calendar, CheckCircle, Download, Filter } from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { useConfigurationStore } from '../../configuration/hooks/useConfigurationStore';
import type { CreatePayableDTO } from '../services/providers.service';
import type { Payable } from '../services/providers.service';

const PayablesPage: React.FC = () => {
    const { payables, providers, isLoading, fetchPayables, fetchProviders, createPayable, updatePayable } = useProvidersStore();
    const { paymentMethods, fetchPaymentMethods } = useFinancialStore();
    const { bcvRateUsd, bcvRateEur, fetchBcvRates } = useSystemStore();
    const { branches } = useConfigurationStore();
    const { selectedBranchId } = useAuthStore();
    const branchName = branches.find(b => b.id === selectedBranchId)?.name || 'Todas las sedes';
    const tableRef = useRef<HTMLTableElement>(null);
    const { cashCategories, fetchCashCategories } = useFinancialStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refCurrency, setRefCurrency] = useState<'usd' | 'eur'>('usd');
    const [payingPayable, setPayingPayable] = useState<Payable | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<string>('');
    const [customRate, setCustomRate] = useState<number>(0);
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [applyIGTF, setApplyIGTF] = useState(false);

    const expenseCategories = cashCategories.filter(c => c.type === 'expense' && c.is_active);

    const [formData, setFormData] = useState<Omit<CreatePayableDTO, 'branch_id'>>({
        provider_id: 0,
        reference: '',
        subtotal: 0,
        tax: 0,
        amount: 0,
        due_date: new Date().toISOString().split('T')[0],
        status: 'pending',
        category: '',
        paid_date: null,
        expense_id: null,
        purchase_id: null
    });

    useEffect(() => {
        if (!formData.category && expenseCategories.length > 0) {
            setFormData(prev => ({ ...prev, category: expenseCategories[0].name }));
        }
    }, [expenseCategories, formData.category]);

    useEffect(() => {
        fetchPayables(undefined, selectedMonth, selectedYear, selectedBranchId ?? undefined);
        fetchProviders();
        fetchPaymentMethods();
        fetchBcvRates();
        fetchCashCategories();
    }, [fetchPayables, fetchProviders, fetchPaymentMethods, fetchBcvRates, fetchCashCategories, selectedMonth, selectedYear, selectedBranchId]);

    // Update customRate when refCurrency or BCV rates change
    useEffect(() => {
        const rate = refCurrency === 'usd' ? bcvRateUsd : bcvRateEur;
        setCustomRate(rate || 0);
    }, [refCurrency, bcvRateUsd, bcvRateEur]);

    const filteredPayables = payables.filter(p => {
        const matchesSearch =
            (p.provider?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
            (p.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

        return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

    const totalFilteredAmount = filteredPayables.reduce((sum, p) => sum + p.amount, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createPayable({
                ...formData,
                branch_id: selectedBranchId || 1, // Fallback to 1 if not set
                exchange_rate: customRate,
                exchange_currency: refCurrency
            });
            closeModal();
        } catch (error) {
            console.error(error);
            alert("Error al registrar cuenta por pagar");
        }
    };

    const handleOpenPayment = (payable: Payable) => {
        setPayingPayable(payable);
        setPaymentMethod(paymentMethods.find(m => m.is_active)?.name || "Efectivo");
    };

    const handleConfirmPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!payingPayable) return;
        try {
            await updatePayable(payingPayable.id, {
                status: 'paid',
                paid_date: new Date().toISOString(),
                payment_method: paymentMethod as any
            });
            setPayingPayable(null);
        } catch (error) {
            console.error(error);
            alert("Error al confirmar el pago");
        }
    };

    const handleExportPDF = () => {
        const table = tableRef.current;
        if (!table) return;

        // Create a temporary container for the PDF content
        const container = document.createElement('div');
        container.style.padding = '15px';
        container.style.backgroundColor = 'white';
        container.style.fontFamily = 'Arial, sans-serif';

        // Header Section
        const header = `
            <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #3b82f6; padding-bottom: 15px;">
                <h1 style="font-size: 28px; margin: 0; color: #1e3a8a; font-weight: bold;">NEST COWORKING</h1>
                <h2 style="font-size: 18px; margin: 5px 0; color: #4b5563;">${branchName.toUpperCase()}</h2>
                <div style="margin-top: 15px; display: flex; justify-content: space-between; align-items: flex-end;">
                    <div style="text-align: left;">
                        <p style="margin: 0; font-size: 12px; color: #6b7280;">REPORTE DE CUENTAS POR PAGAR</p>
                        <p style="margin: 2px 0; font-size: 14px; font-weight: bold;">${['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][selectedMonth-1]} ${selectedYear}</p>
                    </div>
                    <div style="text-align: right;">
                        <p style="margin: 0; font-size: 11px; color: #6b7280;">Fecha de Emisión: ${new Date().toLocaleDateString()}</p>
                        <div style="margin-top: 5px; background: #f3f4f6; padding: 5px 10px; border-radius: 6px; display: inline-block;">
                            <span style="font-size: 11px; font-weight: bold; color: #374151;">TASAS BCV:</span>
                            <span style="margin-left: 10px; font-size: 11px; color: #1f2937;">USD: <strong>${bcvRateUsd?.toFixed(2) || '-'} BS</strong></span>
                            <span style="margin-left: 10px; font-size: 11px; color: #1f2937;">EUR: <strong>${bcvRateEur?.toFixed(2) || '-'} BS</strong></span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Clone the table and remove the "Acciones" column
        const tableClone = table.cloneNode(true) as HTMLTableElement;
        const rows = tableClone.querySelectorAll('tr');
        rows.forEach(row => {
            if (row.cells.length > 1) {
                row.deleteCell(-1); // Remove the last column (Actions)
            } else if (row.cells.length === 1) {
                const cell = row.cells[0];
                const colspan = cell.getAttribute('colspan');
                if (colspan) {
                    cell.setAttribute('colspan', (parseInt(colspan) - 1).toString());
                }
            }
        });

        // Add some styling to the table for PDF
        tableClone.style.width = '100%';
        tableClone.style.borderCollapse = 'collapse';
        tableClone.style.fontSize = '10px';
        
        // Ensure all TD/TH have some border/padding for readability
        const cells = tableClone.querySelectorAll('th, td');
        cells.forEach(c => {
            const cell = c as HTMLElement;
            cell.style.padding = '8px 4px';
            cell.style.borderBottom = '1px solid #e5e7eb';
        });

        const headers = tableClone.querySelectorAll('th');
        headers.forEach(h => {
            const header = h as HTMLElement;
            header.style.backgroundColor = '#f9fafb';
            header.style.color = '#374151';
            header.style.fontWeight = 'bold';
            header.style.textAlign = 'left';
            header.style.textTransform = 'uppercase';
            header.style.fontSize = '9px';
        });

        container.innerHTML = header;
        container.appendChild(tableClone);

        const opt = {
            margin: 8 as any,
            filename: `Cuentas_Por_Pagar_${branchName.replace(/\s+/g, '_')}_${selectedMonth}_${selectedYear}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' as const }
        };

        html2pdf().from(container).set(opt).save();
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setFormData({
            provider_id: 0,
            reference: '',
            subtotal: 0,
            tax: 0,
            amount: 0,
            due_date: new Date().toISOString().split('T')[0],
            status: 'pending',
            category: expenseCategories[0]?.name || "Deudas",
            paid_date: null,
            expense_id: null,
            purchase_id: null
        });
        setRefCurrency('usd');
    };

    const isOverdue = (dateString: string) => {
        return new Date(dateString) < new Date() && new Date(dateString).toDateString() !== new Date().toDateString();
    };

    const isDueToday = (dateString: string) => {
        return new Date(dateString).toDateString() === new Date().toDateString();
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Cuentas por Pagar</h1>
                    <p className="text-sm text-gray-500 mt-1">Control de pagos pendientes y recordatorios</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                        <Download className="w-5 h-5 mr-2" />
                        Exportar PDF
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Registrar Deuda
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="flex-1 relative w-full">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por proveedor o referencia..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <select 
                                value={selectedMonth} 
                                onChange={e => setSelectedMonth(Number(e.target.value))}
                                className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer"
                            >
                                {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, i) => (
                                    <option key={i+1} value={i+1}>{m}</option>
                                ))}
                            </select>
                            <select 
                                value={selectedYear} 
                                onChange={e => setSelectedYear(Number(e.target.value))}
                                className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer"
                            >
                                {[2024, 2025, 2026].map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="pending">Pendientes</option>
                            <option value="paid">Pagados</option>
                        </select>
                    </div>
                </div>
                
                {/* Total Summary Row */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                    <div className="flex items-center gap-4 bg-blue-50 px-6 py-2 rounded-xl border border-blue-100 shadow-sm">
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                                TOTAL {statusFilter === 'all' ? 'GENERAL' : statusFilter === 'pending' ? 'PENDIENTE' : 'PAGADO'}
                            </p>
                            <h3 className="text-2xl font-black text-blue-900 leading-none">
                                {formatCurrency(totalFilteredAmount)}
                            </h3>
                            {bcvRateUsd && (
                                <p className="text-xs font-bold text-blue-600 mt-1">
                                    {formatBs(totalFilteredAmount, bcvRateUsd)} <span className="text-[10px] opacity-70">BCV</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">Cargando cuentas...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table ref={tableRef} className="min-w-full divide-y divide-gray-200 text-left">
                            <thead className="bg-gray-50 hidden md:table-header-group">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Fecha Límite
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Proveedor
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Referencia / Factura
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Base Imponible
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        IVA 16%
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tasa de Cambio
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-50 md:bg-white flex flex-col md:table-row-group gap-4 md:gap-0 p-4 md:p-0 md:divide-y md:divide-gray-200">
                                {filteredPayables.map((payable) => (
                                    <tr key={payable.id} className="hover:bg-gray-50 transition-colors flex flex-col md:table-row bg-white border md:border-0 border-gray-200 rounded-xl p-4 md:p-0 shadow-sm md:shadow-none">
                                        <td className="px-0 py-2 md:px-6 md:py-4 md:whitespace-nowrap flex justify-between items-center md:table-cell border-b md:border-0 border-gray-100">
                                            <span className="md:hidden font-bold text-xs text-gray-400 uppercase">Fecha Límite</span>
                                            <div className="flex items-center">
                                                <Calendar className={`w-4 h-4 mr-2 md:inline hidden ${payable.status === 'paid' ? 'text-gray-400' :
                                                    isOverdue(payable.due_date) ? 'text-red-500' :
                                                        isDueToday(payable.due_date) ? 'text-yellow-500' : 'text-gray-400'
                                                    }`} />
                                                <span className={`text-sm ${payable.status === 'pending' && isOverdue(payable.due_date) ? 'text-red-600 font-medium' :
                                                    payable.status === 'pending' && isDueToday(payable.due_date) ? 'text-yellow-600 font-medium' : 'text-gray-900'
                                                    }`}>
                                                    {new Date(payable.due_date).toLocaleDateString()}
                                                    {payable.status === 'pending' && isOverdue(payable.due_date) && ' (Vencido)'}
                                                    {payable.status === 'pending' && isDueToday(payable.due_date) && ' (Vence hoy)'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-0 py-2 md:px-6 md:py-4 md:whitespace-nowrap flex justify-between items-center md:table-cell border-b md:border-0 border-gray-100">
                                            <span className="md:hidden font-bold text-xs text-gray-400 uppercase">Proveedor</span>
                                            <div className="text-sm font-medium text-gray-900">{payable.provider?.name || `ID: ${payable.provider_id}`}</div>
                                        </td>
                                        <td className="px-0 py-2 md:px-6 md:py-4 md:whitespace-nowrap text-sm text-gray-500 flex justify-between items-center md:table-cell border-b md:border-0 border-gray-100">
                                            <span className="md:hidden font-bold text-xs text-gray-400 uppercase">Referencia</span>
                                            {payable.reference || '-'}
                                        </td>
                                        <td className="px-0 py-2 md:px-6 md:py-4 md:whitespace-nowrap text-right text-sm text-gray-600 flex justify-between items-center md:table-cell border-b md:border-0 border-gray-100">
                                            <span className="md:hidden font-bold text-xs text-gray-400 uppercase">Base Imponible</span>
                                            {formatCurrency(payable.subtotal || 0)}
                                        </td>
                                        <td className="px-0 py-2 md:px-6 md:py-4 md:whitespace-nowrap text-right text-sm text-gray-600 flex justify-between items-center md:table-cell border-b md:border-0 border-gray-100">
                                            <span className="md:hidden font-bold text-xs text-gray-400 uppercase">IVA 16%</span>
                                            {formatCurrency(payable.tax || 0)}
                                        </td>
                                        <td className="px-0 py-2 md:px-6 md:py-4 md:whitespace-nowrap text-right text-sm flex justify-between items-center md:table-cell border-b md:border-0 border-gray-100">
                                            <span className="md:hidden font-bold text-xs text-gray-400 uppercase">Total</span>
                                            <div className="text-right md:text-right">
                                                <div className="font-bold text-gray-900">{formatCurrency(payable.amount)}</div>
                                                {(payable.exchange_rate || bcvRateUsd || bcvRateEur) && (
                                                    <div className="text-xs text-gray-500 font-medium mt-0.5">
                                                        {formatBs(payable.amount, payable.exchange_rate || (bcvRateUsd || bcvRateEur))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-0 py-2 md:px-6 md:py-4 md:whitespace-nowrap text-center text-sm text-gray-500 flex justify-between items-center md:table-cell border-b md:border-0 border-gray-100">
                                            <span className="md:hidden font-bold text-xs text-gray-400 uppercase">Tasa de Cambio</span>
                                            {payable.exchange_rate ? (
                                                <span className="font-medium">{payable.exchange_rate.toFixed(2)} <small className="text-[10px] uppercase">{payable.exchange_currency}</small></span>
                                            ) : '-'}
                                        </td>
                                        <td className="px-0 py-2 md:px-6 md:py-4 md:whitespace-nowrap flex justify-between items-center md:table-cell border-b md:border-0 border-gray-100">
                                            <span className="md:hidden font-bold text-xs text-gray-400 uppercase">Estado</span>
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${payable.status === 'paid' ? 'bg-green-100 text-green-800' :
                                                payable.status === 'cancelled' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {payable.status === 'paid' ? 'Pagado' : payable.status === 'cancelled' ? 'Cancelado' : 'Pendiente'}
                                            </span>
                                        </td>
                                        <td className="px-0 py-3 md:px-6 md:py-4 md:whitespace-nowrap text-right text-sm font-medium flex justify-end md:table-cell mt-2 md:mt-0">
                                            {payable.status === 'pending' && (
                                                <button
                                                    onClick={() => handleOpenPayment(payable)}
                                                    className="text-green-600 hover:text-green-900 flex items-center justify-end w-full md:w-auto"
                                                    title="Marcar como pagado"
                                                >
                                                    <CheckCircle className="w-5 h-5 mr-1" />
                                                    Pagar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filteredPayables.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                                            No se encontraron cuentas por pagar
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Crear */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none bg-black bg-opacity-50">
                    <div className="relative w-full max-w-md mx-auto my-6">
                        <div className="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-lg outline-none focus:outline-none">
                            <div className="flex items-start justify-between p-5 border-b border-solid border-blueGray-200 rounded-t">
                                <h3 className="text-xl font-semibold">
                                    Registrar Deuda / Pago Pendiente
                                </h3>
                                <button
                                    className="p-1 ml-auto bg-transparent border-0 text-black opacity-5 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                                    onClick={closeModal}
                                >
                                    <span className="bg-transparent text-black opacity-5 h-6 w-6 text-2xl block outline-none focus:outline-none">
                                        ×
                                    </span>
                                </button>
                            </div>
                            <div className="relative p-6 flex-auto">
                                <form id="payable-form" onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor *</label>
                                            <select
                                                required
                                                value={formData.provider_id}
                                                onChange={(e) => setFormData({ ...formData, provider_id: Number(e.target.value) })}
                                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="0" disabled>Seleccione un proveedor</option>
                                                {providers.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría de Gasto *</label>
                                            <select
                                                required
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                {expenseCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                                {expenseCategories.length === 0 && <option value="Deudas">Deudas (Default)</option>}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Concepto / Referencia / Factura</label>
                                        <input
                                            type="text"
                                            value={formData.reference || ''}
                                            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                                            placeholder="Ej: Factura 1234, Alquiler Marzo"
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Base Imponible ($)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                required
                                                value={formData.subtotal || ''}
                                                onChange={(e) => {
                                                    const subtotal = parseFloat(e.target.value) || 0;
                                                    const tax = subtotal * 0.16;
                                                    setFormData({ ...formData, subtotal, tax, amount: subtotal + tax });
                                                }}
                                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">IVA 16% ($)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                required
                                                value={formData.tax || ''}
                                                onChange={(e) => {
                                                    const tax = parseFloat(e.target.value) || 0;
                                                    setFormData({ ...formData, tax, amount: (formData.subtotal || 0) + tax });
                                                }}
                                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1 font-bold text-blue-600">Total a Pagar * ($)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                required
                                                value={formData.amount || ''}
                                                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                                className="w-full px-3 py-2 border rounded-lg bg-blue-50 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de pago (Vencimiento) *</label>
                                            <input
                                                type="date"
                                                required
                                                value={formData.due_date}
                                                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                    {/* Rate Selection */}
                                    <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg mt-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tasa de Cambio a Aplicar</label>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => setRefCurrency('usd')} className={`flex-1 py-1.5 rounded-md text-sm font-bold transition ${refCurrency === 'usd' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}>Dólar (USD)</button>
                                            <button type="button" onClick={() => setRefCurrency('eur')} className={`flex-1 py-1.5 rounded-md text-sm font-bold transition ${refCurrency === 'eur' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}>Euro (EUR)</button>
                                        </div>

                                        <div className="mt-3">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tasa Manual (BS/{refCurrency.toUpperCase()})</label>
                                            <input 
                                                type="number" 
                                                step="0.01" 
                                                value={customRate} 
                                                onChange={e => setCustomRate(parseFloat(e.target.value) || 0)}
                                                className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm font-bold text-indigo-600 outline-none focus:ring-1 focus:ring-indigo-500"
                                            />
                                        </div>

                                        <div className="mt-3 flex justify-between items-center px-1">
                                            <span className="text-sm text-gray-600 font-medium">Equivalente a pagar:</span>
                                            <div className="text-right">
                                                <span className="text-lg font-bold text-gray-900 block">
                                                    {formatBs(formData.amount, customRate)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="flex items-center justify-end p-6 border-t border-solid border-blueGray-200 rounded-b">
                                <button
                                    className="text-gray-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                                    type="button"
                                    onClick={closeModal}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="bg-blue-600 text-white active:bg-blue-700 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                                    type="submit"
                                    form="payable-form"
                                    disabled={!formData.provider_id || formData.amount <= 0}
                                >
                                    Registrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Modal Confirmar Pago */}
            {payingPayable && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden z-10">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">Confirmar Pago</h2>
                            <button onClick={() => setPayingPayable(null)} className="text-gray-400 hover:bg-gray-100 p-1 rounded-full"><span className="text-xl leading-none">&times;</span></button>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (!payingPayable) return;
                            try {
                                const rate = refCurrency === 'usd' ? bcvRateUsd : bcvRateEur;
                                const isIGTFMethod = [
                                    'EFECTIVO $',
                                    'ZELLE',
                                    'BANESCO (Panama)',
                                    'PAY PALL',
                                    'BANK OF AMERICAN'
                                ].includes(paymentMethod);

                                const igtf_amount = (applyIGTF && isIGTFMethod) ? payingPayable.amount * 0.03 : 0;
                                
                                await updatePayable(payingPayable.id, {
                                    status: 'paid',
                                    paid_date: new Date().toISOString(),
                                    payment_method: paymentMethod as any,
                                    exchange_rate: customRate || rate || undefined,
                                    exchange_currency: refCurrency,
                                    igtf_amount: igtf_amount
                                });
                                setPayingPayable(null);
                                setApplyIGTF(false);
                            } catch (error) {
                                console.error(error);
                                alert("Error al confirmar el pago");
                            }
                        }} className="p-6 space-y-4">
                            <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg border border-blue-100 mb-4">
                                <div className="flex justify-between mb-1">
                                    <span>Base Imponible:</span>
                                    <div className="text-right">
                                        <span className="font-medium block">€{(payingPayable.subtotal || (payingPayable.amount / 1.16)).toFixed(2)}</span>
                                        <span className="text-[10px] text-blue-400">{formatBs((payingPayable.subtotal || (payingPayable.amount / 1.16)), customRate || (refCurrency === 'usd' ? bcvRateUsd : bcvRateEur) || 0)}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between mb-1">
                                    <span>IVA (16%):</span>
                                    <div className="text-right">
                                        <span className="font-medium block">€{(payingPayable.tax || (payingPayable.amount - (payingPayable.amount / 1.16))).toFixed(2)}</span>
                                        <span className="text-[10px] text-blue-400">{formatBs((payingPayable.tax || (payingPayable.amount - (payingPayable.amount / 1.16))), customRate || (refCurrency === 'usd' ? bcvRateUsd : bcvRateEur) || 0)}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between border-t border-blue-200 pt-1 mt-1">
                                    <span>Monto Deuda (Total):</span>
                                    <div className="text-right">
                                        <span className="font-bold text-gray-700 block">€{payingPayable.amount.toFixed(2)}</span>
                                        <span className="text-[10px] text-gray-500">{formatBs(payingPayable.amount, customRate || (refCurrency === 'usd' ? bcvRateUsd : bcvRateEur) || 0)}</span>
                                    </div>
                                </div>

                                {applyIGTF && [
                                    'EFECTIVO $',
                                    'ZELLE',
                                    'BANESCO (Panama)',
                                    'PAY PALL',
                                    'BANK OF AMERICAN'
                                ].includes(paymentMethod) && (
                                    <div className="flex justify-between text-orange-600 font-bold mt-2 pt-2 border-t border-orange-200 border-dashed">
                                        <span>+ IGTF (3% de €{payingPayable.amount.toFixed(2)}):</span>
                                        <div className="text-right">
                                            <span className="block">€{(payingPayable.amount * 0.03).toFixed(2)}</span>
                                            <span className="text-[10px]">{formatBs((payingPayable.amount * 0.03), customRate || (refCurrency === 'usd' ? bcvRateUsd : bcvRateEur) || 0)}</span>
                                        </div>
                                    </div>
                                )}
                                <div className="flex justify-between border-t-2 border-blue-300 mt-2 pt-2 text-sm bg-blue-100/50 -mx-3 px-3 rounded-b-lg">
                                    <span className="font-bold uppercase tracking-tight">Total a Pagar:</span>
                                    <div className="text-right">
                                        <span className="font-black text-blue-900 text-base block">
                                            €{(payingPayable.amount + (applyIGTF && [
                                                'EFECTIVO $',
                                                'ZELLE',
                                                'BANESCO (Panama)',
                                                'PAY PALL',
                                                'BANK OF AMERICAN'
                                            ].includes(paymentMethod) ? (payingPayable.subtotal || (payingPayable.amount / 1.16)) * 0.03 : 0)).toFixed(2)}
                                        </span>
                                        <span className="text-xs font-bold text-blue-700">
                                            {formatBs(
                                                payingPayable.amount + (applyIGTF && [
                                                    'EFECTIVO $',
                                                    'ZELLE',
                                                    'BANESCO (Panama)',
                                                    'PAY PALL',
                                                    'BANK OF AMERICAN'
                                                ].includes(paymentMethod) ? (payingPayable.subtotal || (payingPayable.amount / 1.16)) * 0.03 : 0), 
                                                customRate || (refCurrency === 'usd' ? bcvRateUsd : bcvRateEur) || 0
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta/Método de Pago</label>
                                <select required value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                                    {paymentMethods.filter(m => m.is_active).map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                                    {paymentMethods.filter(m => m.is_active).length === 0 && <option value="Efectivo">Efectivo (Default)</option>}
                                </select>
                            </div>

                            <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-100 rounded-lg">
                                <input 
                                    type="checkbox" 
                                    id="apply-igtf" 
                                    checked={applyIGTF && [
                                        'EFECTIVO $',
                                        'ZELLE',
                                        'BANESCO (Panama)',
                                        'PAY PALL',
                                        'BANK OF AMERICAN'
                                    ].includes(paymentMethod)} 
                                    disabled={![
                                        'EFECTIVO $',
                                        'ZELLE',
                                        'BANESCO (Panama)',
                                        'PAY PALL',
                                        'BANK OF AMERICAN'
                                    ].includes(paymentMethod)}
                                    onChange={e => setApplyIGTF(e.target.checked)}
                                    className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <label htmlFor="apply-igtf" className={`text-sm font-bold cursor-pointer select-none ${![
                                    'EFECTIVO $',
                                    'ZELLE',
                                    'BANESCO (Panama)',
                                    'PAY PALL',
                                    'BANK OF AMERICAN'
                                ].includes(paymentMethod) ? 'text-gray-400' : 'text-orange-800'}`}>
                                    Aplicar Impuesto IGTF (3%)
                                    {![
                                        'EFECTIVO $',
                                        'ZELLE',
                                        'BANESCO (Panama)',
                                        'PAY PALL',
                                        'BANK OF AMERICAN'
                                    ].includes(paymentMethod) && <span className="block text-[10px] font-normal text-gray-400 italic">Solo disponible para pagos en divisas / métodos internacionales</span>}
                                </label>
                            </div>

                            {/* Rate Selection */}
                            <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tasa de Cambio a Aplicar</label>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setRefCurrency('usd')} className={`flex-1 py-1.5 rounded-md text-sm font-bold transition ${refCurrency === 'usd' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}>Dólar (USD)</button>
                                    <button type="button" onClick={() => setRefCurrency('eur')} className={`flex-1 py-1.5 rounded-md text-sm font-bold transition ${refCurrency === 'eur' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}>Euro (EUR)</button>
                                </div>
                                
                                <div className="mt-3">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tasa Manual (BS/{refCurrency.toUpperCase()})</label>
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        value={customRate} 
                                        onChange={e => setCustomRate(parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm font-bold text-indigo-600 outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>

                                <div className="mt-3 flex justify-between items-center px-1">
                                    <span className="text-sm text-gray-600 font-medium">Equivalente a pagar:</span>
                                    <div className="text-right">
                                        <span className="text-lg font-bold text-gray-900 block">
                                            {formatBs(
                                                payingPayable.amount + (applyIGTF && [
                                                    'EFECTIVO $',
                                                    'ZELLE',
                                                    'BANESCO (Panama)',
                                                    'PAY PALL',
                                                    'BANK OF AMERICAN'
                                                ].includes(paymentMethod) ? (payingPayable.subtotal || (payingPayable.amount / 1.16)) * 0.03 : 0), 
                                                customRate || (refCurrency === 'usd' ? bcvRateUsd : bcvRateEur) || 0
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setPayingPayable(null)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
                                <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold">Confirmar Pago</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            <div className={`${isModalOpen || payingPayable ? 'opacity-25 fixed inset-0 z-40 bg-black' : 'hidden'}`}></div>
        </div>
    );
};

export default PayablesPage;
