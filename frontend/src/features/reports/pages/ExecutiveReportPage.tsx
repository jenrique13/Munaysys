import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import api from '../../../services/api';
import {
    BarChart, TrendingUp, TrendingDown, Euro, ShoppingBag,
    Building2, CreditCard, Download, RefreshCw, Calendar, ArrowUpRight, ArrowDownRight,
    DoorOpen, Sparkles
} from 'lucide-react';
import html2pdf from 'html2pdf.js';

// ── Types ─────────────────────────────────────────────────────────────────────
interface SalesByCategory {
    category: string;
    total: number;
}
interface PaymentMethod {
    method: string;
    total: number;
    count: number;
}
interface SalesBySpace {
    space_type: string;
    total: number;
    count: number;
}
interface SalesByRoom {
    room_name: string;
    total: number;
    count: number;
}
interface SalesByService {
    service_name: string;
    total: number;
    count: number;
}
interface BranchSummary {
    branch_id: number;
    branch_name: string;
    branch_color: string;
    total_sales_eur: number;
    total_orders: number;
    sales_by_category: SalesByCategory[];
    cash_flow: { income: number; expenses: number; net: number };
    income_by_payment_method: PaymentMethod[];
    sales_by_space: SalesBySpace[];
    sales_by_room: SalesByRoom[];
    sales_by_service: SalesByService[];
}
interface ExecutiveSummary {
    period: { start: string; end: string };
    branches: BranchSummary[];
    totals: { total_sales: number; total_income: number; total_expenses: number; net_flow: number };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (v: number | undefined | null) => {
    if (v === undefined || v === null) return '€0.00';
    return `€${v.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
const pct = (part: number, total: number) => total > 0 ? ((part / total) * 100).toFixed(1) : '0.0';

const CATEGORY_LABELS: Record<string, string> = {
    product: 'Productos', service: 'Servicios', amenity: 'Amenidades',
    room: 'Salas', package: 'Paquetes', membership: 'Membresías', otros: 'Otros',
};

// Office category labels — maps Office.category values to display names
const SPACE_LABELS: Record<string, string> = {
    privada:              'Oficina Privada',
    suite:                'Suite Ejecutiva',
    loft:                 'Loft / Estudio',
    fijo:                 'Escritorio Fijo',
    'Escritorio Fijo':    'Escritorio Fijo',
    consultorio:          'Consultorio',
    hot_desk:             'Hot Desk',
    compartida:           'Oficina Compartida',
    'Espacios Compartidos': 'Espacios Compartidos',
    sin_espacio:          'Sin Espacio Asignado',
};

const PAYMENT_COLORS: Record<string, string> = {
    Cash: '#10b981', Zelle: '#6366f1', 'Banesco (VE)': '#f59e0b',
    'Transferencia': '#3b82f6', 'Tarjeta': '#8b5cf6', Otro: '#94a3b8',
};

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, icon: Icon, color, sub }: { label: string; value: string; icon: any; color: string; sub?: string }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
        <div className="p-3 rounded-xl shrink-0" style={{ backgroundColor: `${color}18` }}>
            <Icon size={22} style={{ color }} />
        </div>
        <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
            <p className="text-xl font-bold text-gray-800 truncate">{value}</p>
            {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
    </div>
);

// ── Progress Bar ──────────────────────────────────────────────────────────────
const ProgressBar = ({ value, max, color }: { value: number; max: number; color: string }) => {
    const w = max > 0 ? Math.min(100, (value / max) * 100) : 0;
    return (
        <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${w}%`, backgroundColor: color }} />
        </div>
    );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const ExecutiveReportPage: React.FC = () => {
    const { user } = useAuthStore();
    const [data, setData] = useState<ExecutiveSummary | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const reportRef = useRef<HTMLDivElement>(null);

    const roleName = (user as any)?.role?.name ?? (user?.is_superuser ? 'Super Admin' : '');
    const isAuthorized = user?.is_superuser || ['Gerente', 'Super Admin'].includes(roleName);

    const fetchData = async () => {
        setIsLoading(true);
        setError('');
        try {
            const res = await api.get('/reports/executive-summary', {
                params: { start: startDate, end: endDate }
            });
            setData(res.data);
        } catch (e: any) {
            setError(e.response?.data?.detail || 'Error al cargar el reporte.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthorized) fetchData();
    }, []);

    const handleExportPDF = () => {
        if (!reportRef.current) return;
        const opt = {
            margin: [10, 10, 10, 10] as [number, number, number, number],
            filename: `Reporte_Ejecutivo_${startDate}_${endDate}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'landscape' as const },
            pagebreak: { mode: ['css', 'legacy'] }
        };
        html2pdf().set(opt).from(reportRef.current).save();
    };

    // Access denied
    if (!isAuthorized) {
        return (
            <div className="flex-1 flex items-center justify-center p-12 text-center">
                <div>
                    <BarChart size={48} className="mx-auto mb-4 text-gray-200" />
                    <h2 className="text-xl font-bold text-gray-700 mb-2">Acceso Restringido</h2>
                    <p className="text-gray-400 text-sm">Este reporte es exclusivo para Gerentes y Super Administradores.</p>
                </div>
            </div>
        );
    }

    const branches = data?.branches ?? [];
    const totals = data?.totals;
    const maxSales = Math.max(...branches.map(b => b.total_sales_eur), 1);
    const maxIncome = Math.max(...branches.map(b => b.cash_flow.income), 1);

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            {/* Header */}
            <div className="bg-white px-6 py-4 border-b shadow-sm shrink-0 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <BarChart size={22} className="text-indigo-600" /> Reporte Ejecutivo Gerencial
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Consolidado por sede — Ventas, Flujo de Caja y Métodos de Pago</p>
                </div>
                <button onClick={handleExportPDF}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 text-sm font-semibold shadow-sm transition">
                    <Download size={15} /> Exportar PDF
                </button>
            </div>

            {/* Filter Bar */}
            <div className="px-6 py-3 bg-white border-b shrink-0 flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <label className="text-xs font-semibold text-gray-500 uppercase">Desde</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                        className="border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Hasta</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                        className="border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" />
                </div>
                <button onClick={fetchData} disabled={isLoading}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 text-sm font-semibold disabled:opacity-60 transition">
                    <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                    {isLoading ? 'Cargando...' : 'Actualizar'}
                </button>
                {data && (
                    <span className="text-xs text-gray-400 ml-auto">
                        Período: <strong>{data.period.start}</strong> → <strong>{data.period.end}</strong>
                    </span>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="mx-6 mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 shrink-0">
                    {error}
                </div>
            )}

            {/* Loading */}
            {isLoading && !data && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-gray-400 text-sm">Calculando reporte...</p>
                    </div>
                </div>
            )}

            {/* Report Body */}
            {data && (
                <div className="flex-1 overflow-auto p-6 space-y-8" ref={reportRef}>

                    {/* ── Global KPIs ── */}
                    <section>
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <TrendingUp size={14} /> Consolidado Global
                        </h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <KpiCard label="Total Ventas (EUR)" value={fmt(totals!.total_sales)} icon={Euro} color="#6366f1" sub={`${branches.length} sedes`} />
                            <KpiCard label="Ingresos Totales" value={fmt(totals!.total_income)} icon={TrendingUp} color="#10b981" />
                            <KpiCard label="Gastos Totales" value={fmt(totals!.total_expenses)} icon={TrendingDown} color="#ef4444" />
                            <KpiCard label="Flujo Neto" value={fmt(totals!.net_flow)} icon={totals!.net_flow >= 0 ? ArrowUpRight : ArrowDownRight}
                                color={totals!.net_flow >= 0 ? '#10b981' : '#ef4444'} />
                        </div>
                    </section>

                    {/* ── Ventas por Sede ── */}
                    <section>
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Building2 size={14} /> Ventas por Sede
                        </h2>
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-indigo-600 text-white text-xs uppercase tracking-wide">
                                    <tr>
                                        <th className="py-3 px-5">Sede</th>
                                        <th className="py-3 px-4 text-right">Órdenes</th>
                                        <th className="py-3 px-4 text-right text-gray-500">Total Ventas (EUR)</th>
                                        <th className="py-3 px-4">Participación</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {branches.map(b => (
                                        <tr key={b.branch_id} className="hover:bg-indigo-50/20 transition">
                                            <td className="py-3 px-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: b.branch_color }} />
                                                    <span className="font-semibold text-gray-800">{b.branch_name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-right text-gray-600">{b.total_orders}</td>
                                            <td className="py-3 px-4 text-right font-bold text-gray-800">{fmt(b.total_sales_eur)}</td>
                                            <td className="py-3 px-4 w-48">
                                                <div className="flex items-center gap-2">
                                                    <ProgressBar value={b.total_sales_eur} max={maxSales} color={b.branch_color} />
                                                    <span className="text-xs text-gray-400 shrink-0">{pct(b.total_sales_eur, totals!.total_sales)}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-indigo-50 font-bold">
                                        <td className="py-3 px-5 text-indigo-700">TOTAL</td>
                                        <td className="py-3 px-4 text-right text-indigo-700">{branches.reduce((s, b) => s + b.total_orders, 0)}</td>
                                        <td className="py-3 px-4 text-right text-indigo-700">{fmt(totals!.total_sales)}</td>
                                        <td className="py-3 px-4 text-indigo-700">100%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* ── Ventas por Categoría ── */}
                    <section>
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <ShoppingBag size={14} /> Ventas por Categoría por Sede
                        </h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                            {branches.map(b => (
                                <div key={b.branch_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderTop: `3px solid ${b.branch_color}` }}>
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: b.branch_color }} />
                                        <span className="font-bold text-gray-800 text-sm">{b.branch_name}</span>
                                        <span className="ml-auto text-xs text-gray-400">{fmt(b.total_sales_eur)}</span>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        {b.sales_by_category.length === 0 ? (
                                            <p className="text-xs text-gray-400 text-center py-4">Sin ventas en el período</p>
                                        ) : (
                                            b.sales_by_category
                                                .sort((a, c) => c.total - a.total)
                                                .map(cat => (
                                                    <div key={cat.category}>
                                                        <div className="flex justify-between text-xs mb-1">
                                                            <span className="text-gray-600 font-medium">
                                                                {CATEGORY_LABELS[cat.category] || cat.category}
                                                            </span>
                                                            <span className="font-bold text-gray-800">{fmt(cat.total)} <span className="text-gray-400 font-normal">({pct(cat.total, b.total_sales_eur)}%)</span></span>
                                                        </div>
                                                        <ProgressBar value={cat.total} max={b.total_sales_eur} color={b.branch_color} />
                                                    </div>
                                                ))
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ── Flujo de Caja ── */}
                    <section>
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <TrendingUp size={14} /> Flujo de Caja por Sede
                        </h2>
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-700 text-white text-xs uppercase tracking-wide">
                                    <tr>
                                        <th className="py-3 px-5">Sede</th>
                                        <th className="py-3 px-4 text-right">Ingresos (EUR)</th>
                                        <th className="py-3 px-4 text-right">Egresos / Gastos</th>
                                        <th className="py-3 px-4 text-right">Flujo Neto</th>
                                        <th className="py-3 px-4">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {branches.map(b => {
                                        const isPositive = b.cash_flow.net >= 0;
                                        return (
                                            <tr key={b.branch_id} className="hover:bg-gray-50 transition">
                                                <td className="py-3 px-5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: b.branch_color }} />
                                                        <span className="font-semibold text-gray-800">{b.branch_name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-right font-semibold text-emerald-600">{fmt(b.cash_flow.income)}</td>
                                                <td className="py-3 px-4 text-right text-red-500">{fmt(b.cash_flow.expenses)}</td>
                                                <td className={`py-3 px-4 text-right font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {fmt(b.cash_flow.net)}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                        {isPositive ? 'Superávit' : 'Déficit'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                                        <td className="py-3 px-5 text-slate-700">TOTAL</td>
                                        <td className="py-3 px-4 text-right text-emerald-700">{fmt(totals!.total_income)}</td>
                                        <td className="py-3 px-4 text-right text-red-600">{fmt(totals!.total_expenses)}</td>
                                        <td className={`py-3 px-4 text-right ${totals!.net_flow >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{fmt(totals!.net_flow)}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${totals!.net_flow >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                {totals!.net_flow >= 0 ? 'Superávit' : 'Déficit'}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* ── Métodos de Pago ── */}
                    <section>
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <CreditCard size={14} /> Ingresos por Método de Pago por Sede
                        </h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                            {branches.map(b => (
                                <div key={b.branch_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderBottom: `2px solid ${b.branch_color}20` }}>
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: b.branch_color }} />
                                        <span className="font-bold text-gray-800 text-sm">{b.branch_name}</span>
                                        <span className="ml-auto text-xs text-gray-400">{fmt(b.cash_flow.income)} ingresados</span>
                                    </div>
                                    <div className="divide-y divide-gray-50">
                                        {b.income_by_payment_method.length === 0 ? (
                                            <p className="text-xs text-gray-400 text-center py-6">Sin cobros registrados</p>
                                        ) : (
                                            b.income_by_payment_method
                                                .sort((a, c) => c.total - a.total)
                                                .map(pm => (
                                                    <div key={pm.method} className="px-4 py-3 flex items-center gap-3">
                                                        <div className="w-2.5 h-2.5 rounded-full shrink-0"
                                                            style={{ backgroundColor: PAYMENT_COLORS[pm.method] || '#94a3b8' }} />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between text-xs mb-1.5">
                                                                <span className="font-semibold text-gray-700">{pm.method}</span>
                                                                <span className="font-bold text-gray-800">{fmt(pm.total)}</span>
                                                            </div>
                                                            <ProgressBar value={pm.total} max={b.cash_flow.income}
                                                                color={PAYMENT_COLORS[pm.method] || '#94a3b8'} />
                                                            <p className="text-[10px] text-gray-400 mt-1">{pm.count} transacción{pm.count !== 1 ? 'es' : ''} · {pct(pm.total, b.cash_flow.income)}%</p>
                                                        </div>
                                                    </div>
                                                ))
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ── Ventas por Tipo de Espacio (Membresías) ── */}
                    <section>
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Building2 size={14} /> Ventas por Tipo de Espacio — Membresías por Sede
                        </h2>
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-teal-700 text-white text-xs uppercase tracking-wide">
                                    <tr>
                                        <th className="py-3 px-5">Tipo de Espacio</th>
                                        {branches.map(b => (
                                            <th key={b.branch_id} className="py-3 px-4 text-right">
                                                <span className="flex items-center justify-end gap-1">
                                                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: b.branch_color }} />
                                                    {b.branch_name}
                                                </span>
                                            </th>
                                        ))}
                                        <th className="py-3 px-4 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {(() => {
                                        const allTypes = Array.from(
                                            new Set(branches.flatMap(b => b.sales_by_space.map(s => s.space_type)))
                                        ).sort();
                                        if (allTypes.length === 0) return (
                                            <tr><td colSpan={branches.length + 2} className="py-8 text-center text-xs text-gray-400">Sin membresías en el período</td></tr>
                                        );
                                        return allTypes.map((type, idx) => {
                                            const rowTotal = branches.reduce((sum, b) => {
                                                const found = b.sales_by_space.find(s => s.space_type === type);
                                                return sum + (found?.total ?? 0);
                                            }, 0);
                                            const rowCount = branches.reduce((sum, b) => {
                                                const found = b.sales_by_space.find(s => s.space_type === type);
                                                return sum + (found?.count ?? 0);
                                            }, 0);
                                            return (
                                                <tr key={type} className={`hover:bg-teal-50/20 transition ${idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                                                    <td className="py-3 px-5">
                                                        <div className="font-medium text-gray-700">{SPACE_LABELS[type] ?? type}</div>
                                                        <div className="text-[10px] text-gray-400">{rowCount} contrato{rowCount !== 1 ? 's' : ''} en total</div>
                                                    </td>
                                                    {branches.map(b => {
                                                        const found = b.sales_by_space.find(s => s.space_type === type);
                                                        return (
                                                            <td key={b.branch_id} className="py-3 px-4 text-right">
                                                                {found ? (
                                                                    <div>
                                                                        <div className="font-semibold text-gray-800">{fmt(found.total)}</div>
                                                                        <div className="text-[10px] text-gray-400">{found.count} contrato{found.count !== 1 ? 's' : ''}</div>
                                                                    </div>
                                                                ) : <span className="text-gray-300">—</span>}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="py-3 px-4 text-right font-bold text-teal-700">{fmt(rowTotal)}</td>
                                                </tr>
                                            );
                                        });
                                    })()}
                                    {/* Totals row */}
                                    <tr className="bg-teal-50 font-bold border-t-2 border-teal-200">
                                        <td className="py-3 px-5 text-teal-700">TOTAL MEMBRESÍAS</td>
                                        {branches.map(b => (
                                            <td key={b.branch_id} className="py-3 px-4 text-right text-teal-700">
                                                <div>{fmt(b.sales_by_space.reduce((s, x) => s + x.total, 0))}</div>
                                                <div className="text-[10px] font-normal">{b.sales_by_space.reduce((s, x) => s + x.count, 0)} contratos</div>
                                            </td>
                                        ))}
                                        <td className="py-3 px-4 text-right text-teal-700">
                                            {fmt(branches.reduce((s, b) => s + b.sales_by_space.reduce((ss, x) => ss + x.total, 0), 0))}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* ── Ventas por Salas ── */}
                    <section>
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <DoorOpen size={14} /> Ventas por Sala por Sede
                        </h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                            {branches.map(b => {
                                const roomTotal = b.sales_by_room.reduce((s, x) => s + x.total, 0);
                                return (
                                    <div key={b.branch_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                        <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderTop: `3px solid ${b.branch_color}` }}>
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: b.branch_color }} />
                                            <span className="font-bold text-gray-800 text-sm">{b.branch_name}</span>
                                            <span className="ml-auto text-xs text-gray-400">{fmt(roomTotal)}</span>
                                        </div>
                                        <div className="p-4 space-y-3">
                                            {b.sales_by_room.length === 0 ? (
                                                <p className="text-xs text-gray-400 text-center py-4">Sin reservas facturadas en el período</p>
                                            ) : (
                                                b.sales_by_room
                                                    .sort((a, c) => c.total - a.total)
                                                    .map(rm => (
                                                        <div key={rm.room_name}>
                                                            <div className="flex justify-between text-xs mb-1">
                                                                <span className="text-gray-600 font-medium">{rm.room_name}</span>
                                                                <span className="font-bold text-gray-800">
                                                                    {fmt(rm.total)}
                                                                    <span className="text-gray-400 font-normal ml-1">({rm.count} res.)</span>
                                                                </span>
                                                            </div>
                                                            <ProgressBar value={rm.total} max={roomTotal || 1} color={b.branch_color} />
                                                        </div>
                                                    ))
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* ── Ventas por Servicios ── */}
                    <section>
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Sparkles size={14} /> Ventas por Servicio por Sede
                        </h2>
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-violet-600 text-white text-xs uppercase tracking-wide">
                                    <tr>
                                        <th className="py-3 px-5">Servicio</th>
                                        {branches.map(b => (
                                            <th key={b.branch_id} className="py-3 px-4 text-right">
                                                <span className="flex items-center justify-end gap-1">
                                                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: b.branch_color }} />
                                                    {b.branch_name}
                                                </span>
                                            </th>
                                        ))}
                                        <th className="py-3 px-4 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {(() => {
                                        // Collect unique service names across all branches
                                        const allServices = Array.from(
                                            new Set(branches.flatMap(b => b.sales_by_service.map(s => s.service_name)))
                                        ).sort();
                                        if (allServices.length === 0) return (
                                            <tr><td colSpan={branches.length + 2} className="py-8 text-center text-xs text-gray-400">Sin servicios vendidos en el período</td></tr>
                                        );
                                        return allServices.map((svc, idx) => {
                                            const rowTotal = branches.reduce((sum, b) => {
                                                const found = b.sales_by_service.find(s => s.service_name === svc);
                                                return sum + (found?.total ?? 0);
                                            }, 0);
                                            return (
                                                <tr key={svc} className={`hover:bg-violet-50/20 transition ${idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                                                    <td className="py-3 px-5 font-medium text-gray-700">{svc}</td>
                                                    {branches.map(b => {
                                                        const found = b.sales_by_service.find(s => s.service_name === svc);
                                                        return (
                                                            <td key={b.branch_id} className="py-3 px-4 text-right">
                                                                {found ? <span className="font-semibold text-gray-800">{fmt(found.total)}</span> : <span className="text-gray-300">—</span>}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="py-3 px-4 text-right font-bold text-violet-700">{fmt(rowTotal)}</td>
                                                </tr>
                                            );
                                        });
                                    })()}
                                    {/* Totals row */}
                                    <tr className="bg-violet-50 font-bold border-t-2 border-violet-200">
                                        <td className="py-3 px-5 text-violet-700">TOTAL SERVICIOS</td>
                                        {branches.map(b => (
                                            <td key={b.branch_id} className="py-3 px-4 text-right text-violet-700">
                                                {fmt(b.sales_by_service.reduce((s, x) => s + x.total, 0))}
                                            </td>
                                        ))}
                                        <td className="py-3 px-4 text-right text-violet-700">
                                            {fmt(branches.reduce((s, b) => s + b.sales_by_service.reduce((ss, x) => ss + x.total, 0), 0))}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Footer for PDF */}
                    <footer className="text-center text-xs text-gray-300 pt-4 border-t">
                        Reporte generado por Munaysys • Nest Coworking — {new Date().toLocaleString()}
                    </footer>
                </div>
            )}
        </div>
    );
};

export default ExecutiveReportPage;
