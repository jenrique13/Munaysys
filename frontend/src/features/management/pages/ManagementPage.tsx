import React, { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { useManagementStore } from '../hooks/useManagementStore';
import { financialService } from '../../financial/services/financial.service';
import type { Orden } from '../../financial/types';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    TrendingUp, TrendingDown, Euro,
    ArrowUpRight, ArrowDownRight, Activity, LayoutDashboard,
    Layers, Building2, Target, Briefcase, FileText, PieChart as PieChartIcon, Search
} from 'lucide-react';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const StatCard: React.FC<{ title: string, value: string, icon: React.ReactNode, subvalue?: string, trend?: 'up' | 'down', color?: string }> = ({
    title, value, icon, subvalue, trend, color = 'indigo'
}) => {
    const colorClasses: Record<string, string> = {
        indigo: 'bg-indigo-50 text-indigo-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-600',
        red: 'bg-red-50 text-red-600',
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${colorClasses[color] || colorClasses.indigo}`}>
                    {icon}
                </div>
                {trend && (
                    <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {subvalue}
                    </span>
                )}
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{value}</h3>
            </div>
        </div>
    );
};

const ManagementPage: React.FC = () => {
    const { selectedBranchId } = useAuthStore();
    const {
        kpis,
        revenueTrend,
        revenueByCategory,
        crmFunnel,
        sedePerformance,
        fetchManagementData,
        isLoading,
        error
    } = useManagementStore();

    const [activeTab, setActiveTab] = useState<'executive' | 'operational' | 'transactional'>('executive');
    const [transactions, setTransactions] = useState<Orden[]>([]);
    const [loadingTransactions, setLoadingTransactions] = useState(false);

    useEffect(() => {
        fetchManagementData(selectedBranchId ?? 0);
    }, [selectedBranchId, fetchManagementData]);

    useEffect(() => {
        if (activeTab === 'transactional') {
            setLoadingTransactions(true);
            financialService.getOrders(selectedBranchId ?? 0)
                .then(orders => setTransactions(orders.slice(0, 50))) // Tomamos las últimas 50 para no sobrecargar
                .catch(err => console.error("Error fetching transactions", err))
                .finally(() => setLoadingTransactions(false));
        }
    }, [activeTab, selectedBranchId]);

    const combinedTrend = useMemo(() => {
        if (!revenueTrend || !Array.isArray(revenueTrend)) return [];
        return revenueTrend.map(d => ({
            ...d,
            utilidad: (d.ingresos || 0) - (d.gastos || 0)
        }));
    }, [revenueTrend]);

    if (isLoading && !kpis) {
        return (
            <div className="flex h-full items-center justify-center bg-slate-50/50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-bold animate-pulse">Generando reporte gerencial...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-10 text-center">
                <p className="text-red-500 font-bold mb-4">{error}</p>
                <button
                    onClick={() => fetchManagementData(selectedBranchId ?? 0)}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    if (!kpis) return null;

    const renderExecutiveTab = () => (
        <>
            {/* Main KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Ventas Totales" value={`€${(kpis.totalIncome || 0).toLocaleString(undefined, { minimumFractionDigits: 1 })}`} icon={<Euro size={24} />} color="indigo" trend="up" subvalue="Consolidado" />
                <StatCard title="Gastos / Costos" value={`€${(kpis.totalExpenses || 0).toLocaleString(undefined, { minimumFractionDigits: 1 })}`} icon={<TrendingDown size={24} />} color="amber" trend="down" subvalue="Egresos" />
                <StatCard title="Utilidad Neta" value={`€${(kpis.profit || 0).toLocaleString(undefined, { minimumFractionDigits: 1 })}`} icon={<TrendingUp size={24} />} color="emerald" trend={(kpis.profit || 0) >= 0 ? 'up' : 'down'} subvalue="Margen" />
                <StatCard title="Ticket Promedio" value={`€${((kpis.totalIncome || 0) / ((kpis.totalOrders || 1) === 0 ? 1 : kpis.totalOrders || 1)).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`} icon={<Target size={24} />} color="indigo" subvalue="Est." />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Trend Area Chart */}
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col h-[400px] lg:col-span-2">
                    <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2">
                        <Activity size={20} className="text-indigo-500" /> Tendencia de Ingresos y Gastos (YTD)
                    </h3>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={combinedTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold' }} />
                                <Line name="Ingresos Netos" type="monotone" dataKey="ingresos" stroke="#4F46E5" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                <Line name="Gastos Operativos" type="monotone" dataKey="gastos" stroke="#EF4444" strokeWidth={3} dot={{ r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Revenue By Category Donut */}
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col h-[400px]">
                    <h3 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-2">
                        <PieChartIcon size={20} className="text-indigo-500" /> Distribución de Ingresos
                    </h3>
                    <p className="text-xs text-slate-500 mb-4 font-medium">Por categoría de producto/servicio</p>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={revenueByCategory?.length ? revenueByCategory : [{ category: 'Sin datos', amount: 1 }]}
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="amount"
                                    nameKey="category"
                                    stroke="none"
                                >
                                    {(revenueByCategory?.length ? revenueByCategory : [{ category: 'Sin datos', amount: 1 }]).map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => `€${Number(value).toFixed(2)}`} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </>
    );

    const renderOperationalTab = () => (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sede Comparison Table */}
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[400px]">
                    <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                        <Building2 size={20} className="text-emerald-500" /> Desempeño por Sede
                    </h3>
                    <div className="overflow-auto flex-1 pr-2">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-white">
                                <tr className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                                    <th className="pb-4">Sede</th>
                                    <th className="pb-4">Ingresos (€)</th>
                                    <th className="pb-4">Ocupación (%)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {(sedePerformance || []).map((s, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-4 font-bold text-slate-700">{s.sede}</td>
                                        <td className="py-4 font-black text-emerald-600">€{(s.ingresos || 0).toLocaleString()}</td>
                                        <td className="py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-full h-2 bg-slate-100 rounded-full max-w-[100px]">
                                                    <div
                                                        className="h-full bg-emerald-500 rounded-full"
                                                        style={{ width: `${s.ocupacion || 0}%`, backgroundColor: s.color || '#10B981' }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs font-bold text-slate-500">{s.ocupacion || 0}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* CRM Funnel Chart */}
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col h-[400px]">
                    <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                        <Layers size={20} className="text-emerald-500" /> Conversión CRM (Pipeline)
                    </h3>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={crmFunnel || []} layout="vertical" margin={{ left: 20 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="stage" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#475569' }} width={100} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="count" fill="#10B981" radius={[0, 4, 4, 0]} barSize={32} name="Prospectos" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </>
    );

    const renderTransactionalTab = () => (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <FileText size={20} className="text-amber-500" /> Auditoría Transaccional
                </h3>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Buscar transacción..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 w-64" />
                    </div>
                    <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50">
                        Exportar CSV
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-white text-[10px] font-black uppercase text-slate-500 border-b border-slate-200">
                            <th className="p-4 pl-6">ID Orden</th>
                            <th className="p-4">Fecha</th>
                            <th className="p-4">Cliente</th>
                            <th className="p-4">Producto/Servicio</th>
                            <th className="p-4 text-right">Total</th>
                            <th className="p-4 pr-6 text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {loadingTransactions ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-500 font-bold animate-pulse">Cargando transacciones...</td>
                            </tr>
                        ) : transactions.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-500">No hay transacciones registradas.</td>
                            </tr>
                        ) : transactions.map((order) => (
                            <tr key={order.id} className="hover:bg-amber-50/30 transition-colors">
                                <td className="p-4 pl-6 font-bold text-slate-700">ORD-{order.id}</td>
                                <td className="p-4 text-slate-500 font-medium">{new Date(order.date).toLocaleDateString()}</td>
                                <td className="p-4 text-slate-800 font-bold">{order.client?.name || 'Cliente General'}</td>
                                <td className="p-4 text-slate-600 truncate max-w-[200px]">{order.details?.map(d => d.item_name || 'Item').join(', ') || 'Varios'}</td>
                                <td className="p-4 text-right font-black text-slate-800">€{order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td className="p-4 pr-6 text-center">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                        order.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 
                                        order.status === 'partial' ? 'bg-blue-100 text-blue-700' :
                                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                        'bg-amber-100 text-amber-700'
                                    }`}>
                                        {order.status === 'paid' ? 'Pagado' : 
                                         order.status === 'partial' ? 'Parcial' :
                                         order.status === 'cancelled' ? 'Cancelado' : 'Pendiente'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs font-medium text-slate-500">
                <span>Mostrando {transactions.length} registros (Últimos)</span>
                <div className="flex gap-1">
                    <button className="px-2 py-1 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-50" disabled>Anterior</button>
                    <button className="px-2 py-1 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-50" disabled>Siguiente</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-slate-50/50 overflow-auto">
            {/* Header and Tabs */}
            <div className="bg-white px-8 pt-8 border-b border-slate-200 shrink-0 shadow-sm z-10">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                            <LayoutDashboard className="text-indigo-600" size={32} /> Inteligencia de Negocios
                        </h1>
                        <p className="text-slate-500 text-sm mt-1 font-medium italic">
                            {selectedBranchId === 0 ? 'Visión Global Consolidada' : 'Análisis Ejecutivo de Sede'} · Reporte en tiempo real
                        </p>
                    </div>
                    <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-indigo-100 shadow-inner">
                        {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </div>
                </div>

                <div className="flex gap-6 border-b border-slate-200 mt-4">
                    <button 
                        onClick={() => setActiveTab('executive')}
                        className={`pb-4 px-2 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'executive' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <Briefcase size={18} /> Vista Ejecutiva
                    </button>
                    <button 
                        onClick={() => setActiveTab('operational')}
                        className={`pb-4 px-2 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'operational' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <Activity size={18} /> Rendimiento Operativo
                    </button>
                    <button 
                        onClick={() => setActiveTab('transactional')}
                        className={`pb-4 px-2 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'transactional' ? 'border-amber-600 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <FileText size={18} /> Detalle Transaccional
                    </button>
                </div>
            </div>

            <div className="p-8 space-y-8 pb-20">
                {activeTab === 'executive' && renderExecutiveTab()}
                {activeTab === 'operational' && renderOperationalTab()}
                {activeTab === 'transactional' && renderTransactionalTab()}
            </div>
        </div>
    );
};

export default ManagementPage;
