import React, { useEffect, useMemo } from 'react';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { useManagementStore } from '../hooks/useManagementStore';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import {
    TrendingUp, TrendingDown, DollarSign, PieChart as PieChartIcon,
    ArrowUpRight, ArrowDownRight, Activity, LayoutDashboard,
    Layers, Building2, Target
} from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

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

    useEffect(() => {
        fetchManagementData(selectedBranchId ?? 0);
    }, [selectedBranchId, fetchManagementData]);

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

    // Si aún no hay KPIs y no hay error, mostrar algo neutral para evitar crash
    if (!kpis) return null;

    return (
        <div className="flex flex-col h-full bg-slate-50/50 overflow-auto">
            {/* Header */}
            <div className="bg-white px-8 py-8 border-b border-slate-100 shrink-0 shadow-sm">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                            <LayoutDashboard className="text-indigo-600" size={32} /> Inteligencia de Negocios
                        </h1>
                        <p className="text-slate-500 text-sm mt-1 font-medium italic">
                            {selectedBranchId === 0 ? 'Visión Global Consolidada' : 'Análisis Ejecutivo de Sede'} · Reporte en tiempo real
                        </p>
                    </div>
                    <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-indigo-100">
                        {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </div>
                </div>
            </div>

            <div className="p-8 space-y-10 pb-20">
                {/* Main KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Ingresos"
                        value={`$${(kpis.totalIncome || 0).toLocaleString(undefined, { minimumFractionDigits: 1 })}`}
                        icon={<DollarSign size={24} />}
                        color="indigo"
                        trend="up"
                        subvalue="Revenue"
                    />
                    <StatCard
                        title="Gastos"
                        value={`$${(kpis.totalExpenses || 0).toLocaleString(undefined, { minimumFractionDigits: 1 })}`}
                        icon={<TrendingDown size={24} />}
                        color="amber"
                        trend="down"
                        subvalue="Costos"
                    />
                    <StatCard
                        title="Utilidad"
                        value={`$${(kpis.profit || 0).toLocaleString(undefined, { minimumFractionDigits: 1 })}`}
                        icon={<TrendingUp size={24} />}
                        color="emerald"
                        trend={(kpis.profit || 0) >= 0 ? 'up' : 'down'}
                        subvalue="Neto"
                    />
                    <StatCard
                        title="Prospectos"
                        value={(kpis.newLeads || 0).toString()}
                        icon={<Target size={24} />}
                        color="indigo"
                        subvalue="Leads"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Revenue Trend Area Chart */}
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col h-[400px]">
                        <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2">
                            <Activity size={20} className="text-indigo-500" /> Tendencia de Ingresos (6 Meses)
                        </h3>
                        <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={combinedTrend}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Line type="monotone" dataKey="ingresos" stroke="#6366f1" strokeWidth={4} dot={{ r: 4 }} />
                                    <Line type="monotone" dataKey="gastos" stroke="#f59e0b" strokeWidth={4} dot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* CRM Funnel Chart */}
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col h-[400px]">
                        <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2">
                            <Layers size={20} className="text-indigo-500" /> Conversión CRM
                        </h3>
                        <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={crmFunnel || []} layout="vertical" margin={{ left: 20 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="stage" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700 }} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                                    <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Sede Comparison Table */}
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2">
                        <Building2 size={20} className="text-indigo-500" /> Desempeño por Sede
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-50">
                                    <th className="pb-4">Sede</th>
                                    <th className="pb-4">Ingresos ($)</th>
                                    <th className="pb-4">Ocupación (%)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {(sedePerformance || []).map((s, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-4 font-bold text-slate-700">{s.sede}</td>
                                        <td className="py-4 font-black text-indigo-600">${(s.ingresos || 0).toLocaleString()}</td>
                                        <td className="py-4">
                                            <div className="w-full h-2 bg-slate-100 rounded-full max-w-[150px]">
                                                <div 
                                                    className="h-full bg-indigo-500 rounded-full" 
                                                    style={{ width: `${s.ocupacion || 0}%`, backgroundColor: s.color || '#6366f1' }}
                                                ></div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagementPage;
