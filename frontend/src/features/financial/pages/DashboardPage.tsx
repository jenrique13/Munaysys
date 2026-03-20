import React, { useEffect, useMemo } from 'react';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { useFinancialStore } from '../hooks/useFinancialStore';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import {
    TrendingUp, TrendingDown, DollarSign, Users, PieChart as PieChartIcon,
    ArrowUpRight, ArrowDownRight, Activity, Calendar
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

const DashboardPage: React.FC = () => {
    const { selectedBranchId } = useAuthStore();
    const { dashboardStats, fetchDashboardStats, isLoading } = useFinancialStore();

    useEffect(() => {
        fetchDashboardStats();
    }, [selectedBranchId, fetchDashboardStats]);

    const combinedTrend = useMemo(() => {
        if (!dashboardStats) return [];
        // Combine sales and expenses by date
        const dates = new Set([
            ...dashboardStats.sales_trend.map(s => s.date),
            ...dashboardStats.expenses_trend.map(e => e.date)
        ]);

        return Array.from(dates).sort().map(d => {
            const sale = dashboardStats.sales_trend.find(s => s.date === d)?.amount || 0;
            const exp = dashboardStats.expenses_trend.find(e => e.date === d)?.amount || 0;
            return {
                name: new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }),
                ventas: sale,
                gastos: exp,
                utilidad: sale - exp
            };
        });
    }, [dashboardStats]);

    if (isLoading && !dashboardStats) {
        return (
            <div className="flex h-full items-center justify-center bg-slate-50/50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium animate-pulse">Cargando tablero...</p>
                </div>
            </div>
        );
    }

    if (!dashboardStats) return <div className="p-10 text-center text-slate-400">No se encontraron datos estadísticos.</div>;

    const { total_sales, total_expenses, net_profit, category_distribution, occupancy_stats } = dashboardStats;

    return (
        <div className="flex flex-col h-full bg-slate-50/50 overflow-auto">
            {/* Header */}
            <div className="bg-white px-8 py-6 border-b border-slate-100 shrink-0">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                            <Activity className="text-indigo-600" /> Tablero de Control
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Análisis operativo para la sede actual (últimos 30 días).</p>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                        <button className="px-3 py-1.5 text-xs font-bold bg-white text-indigo-600 rounded-md shadow-sm">30 Días</button>
                        <button className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-white/50 rounded-md transition" disabled>90 Días</button>
                    </div>
                </div>
            </div>

            <div className="p-8 space-y-8">
                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Ventas Totales"
                        value={`$${total_sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                        icon={<DollarSign size={24} />}
                        color="indigo"
                        trend="up"
                        subvalue="12%"
                    />
                    <StatCard
                        title="Gastos Operativos"
                        value={`$${total_expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                        icon={<TrendingDown size={24} />}
                        color="amber"
                        trend="down"
                        subvalue="5%"
                    />
                    <StatCard
                        title="Utilidad Neta"
                        value={`$${net_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                        icon={<TrendingUp size={24} />}
                        color="emerald"
                        trend={net_profit >= 0 ? 'up' : 'down'}
                        subvalue={`${((net_profit / (total_sales || 1)) * 100).toFixed(1)}%`}
                    />
                    <StatCard
                        title="Ocupación"
                        value={occupancy_stats ? `${occupancy_stats.percentage.toFixed(1)}%` : '0%'}
                        icon={<Users size={24} />}
                        color="indigo"
                        subvalue={occupancy_stats ? `${occupancy_stats.occupied_slots}/${occupancy_stats.total_slots}` : 'N/A'}
                        trend="up"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Chart */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-[400px]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Calendar size={18} className="text-indigo-500" /> Tendencia Financiera</h3>
                            <div className="flex gap-4 text-xs font-bold uppercase tracking-wider">
                                <span className="flex items-center gap-1.5 text-indigo-500"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Ventas</span>
                                <span className="flex items-center gap-1.5 text-amber-500"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Gastos</span>
                            </div>
                        </div>
                        <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={combinedTrend}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                                    />
                                    <Line type="monotone" dataKey="ventas" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="gastos" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Category Distribution */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-[400px]">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><PieChartIcon size={18} className="text-indigo-500" /> Distribución de Ingresos</h3>
                        <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={category_distribution}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="amount"
                                        nameKey="category"
                                    >
                                        {category_distribution.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        formatter={(value: any) => `$${Number(value).toFixed(2)}`}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '11px', color: '#64748b', fontWeight: 'bold' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Additional Insight Bar Chart */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-3 h-[300px]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800">Crecimiento de Utilidad Diaria</h3>
                    </div>
                    <div className="flex-1 h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={combinedTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="utilidad" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
