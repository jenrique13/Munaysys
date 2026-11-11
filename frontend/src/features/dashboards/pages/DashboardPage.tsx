import React, { useEffect } from 'react';
import { useDashboardStore } from '../hooks/useDashboardStore';
import { useSystemStore } from '../../system/hooks/useSystemStore';
import { formatCurrency, formatBs, formatMixedCurrency } from '../../../utils/format';
import { Users, Landmark, Wallet, CalendarDays, TrendingUp, DollarSign, DoorOpen } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';

export const DashboardPage: React.FC = () => {
    const { kpis, revenueTrend, occupancyStats, sedePerformance, isLoading, error, fetchDashboardData } = useDashboardStore();
    const { bcvRateEur } = useSystemStore();

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="bg-red-50 text-red-600 p-4 rounded-lg font-medium">
                    Error cargando métricas: {error}
                </div>
            </div>
        );
    }

    // Using formatCurrency from utils

    return (
        <div className="p-8 pb-20 bg-slate-50 min-h-full">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Dashboard Gerencial</h1>
                    <p className="text-slate-500 text-sm mt-1">Resumen del rendimiento económico y operativo últimos 30 días</p>
                </div>
                <button
                    onClick={fetchDashboardData}
                    className="text-sm bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                >
                    Actualizar Datos
                </button>
            </div>

            {/* KPI Cards Top Row */}
            {kpis && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* KPI 1 */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-500">Nuevos Leads</span>
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                <Users size={16} />
                            </div>
                        </div>
                        <div className="flex items-baseline">
                            <p className="text-2xl font-bold text-slate-800">{kpis.newLeads}</p>
                        </div>
                    </div>

                    {/* KPI 2 */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-500">Ingresos Totales</span>
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <Landmark size={16} />
                            </div>
                        </div>
                        <div className="flex items-baseline flex-wrap">
                            <p className="text-2xl font-bold text-slate-800 mr-2">
                                {formatMixedCurrency(kpis.totalIncomeEur, kpis.totalIncomeUsd)}
                            </p>
                            {bcvRateEur && <p className="text-sm font-medium text-slate-500">{formatBs(kpis.totalIncomeEur, bcvRateEur)}</p>}
                        </div>
                    </div>

                    {/* KPI 3 */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-500">Gastos Totales</span>
                            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                                <Wallet size={16} />
                            </div>
                        </div>
                        <div className="flex items-baseline flex-wrap">
                            <p className="text-2xl font-bold text-slate-800 mr-2">
                                {formatMixedCurrency(kpis.totalExpensesEur, kpis.totalExpensesUsd)}
                            </p>
                            {bcvRateEur && <p className="text-sm font-medium text-slate-500">{formatBs(kpis.totalExpensesEur, bcvRateEur)}</p>}
                        </div>
                    </div>

                    {/* KPI 4 */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-500">Salas Ocupadas (Ahora)</span>
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <CalendarDays size={16} />
                            </div>
                        </div>
                        <div className="flex items-baseline">
                            <p className="text-2xl font-bold text-slate-800">{kpis.currentlyOccupiedRooms}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

                {/* Revenue/Expense Trend Chart */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center mb-6">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mr-3">
                            <TrendingUp size={16} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">Tendencia Financiera (6 Meses)</h2>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10}
                                    tickFormatter={(value: number) => `€${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => [formatCurrency(Number(value || 0)), '']}
                                />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                <Area type="monotone" name="Ingresos" dataKey="ingresos" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIngresos)" />
                                <Area type="monotone" name="Gastos" dataKey="gastos" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorGastos)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Occupancy Stats Chart */}
                <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center mb-6">
                        <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 mr-3">
                            <DoorOpen size={16} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">Uso de Salas (30 Días)</h2>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={occupancyStats} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12 }} width={80} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any, name: string | undefined) => [
                                        name === 'Ocupación' ? `${value}%` : `${value} Reservas`, 
                                        name || ''
                                    ]}
                                />
                                <Bar dataKey="ocupacion" name="Ocupación" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={15} />
                                <Bar dataKey="reservas" name="Reservas" fill="#c4b5fd" radius={[0, 4, 4, 0]} barSize={8} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            {/* Performance by Branch Row */}
            {sedePerformance && sedePerformance.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-8">
                    <div className="flex items-center mb-6">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mr-3">
                            <TrendingUp size={16} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">Rendimiento Económico por Sede (30 Días)</h2>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sedePerformance} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis dataKey="sede" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12 }} width={120} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => [formatCurrency(Number(value || 0)), '']}
                                />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                                <Bar dataKey="utilidad" name="Utilidad" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Profit Resumen */}
            {kpis && (
                <div className="bg-slate-900 rounded-xl p-8 shadow-lg text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
                        <div>
                            <p className="text-slate-400 font-medium mb-1">Utilidad Operativa (Últimos 30 días)</p>
                            <div className="flex items-baseline flex-wrap">
                                <h3 className="text-4xl font-bold tracking-tight mr-3">
                                    {formatMixedCurrency(kpis.profit, kpis.profitUsd)}
                                </h3>
                                {bcvRateEur && <span className="text-xl font-medium text-slate-300">{formatBs(kpis.profit, bcvRateEur)}</span>}
                            </div>
                        </div>
                        <div className="mt-4 md:mt-0 px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20 flex items-center">
                            <DollarSign size={20} className={kpis.profit >= 0 ? "text-emerald-400 mr-2" : "text-red-400 mr-2"} />
                            <span className="font-semibold text-lg">{kpis.profit >= 0 ? "Margen Positivo" : "Déficit"}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


