import React, { useEffect } from 'react';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { useSalesDashboardStore } from '../hooks/useSalesDashboardStore';
import { Users2, TrendingUp, FileText, AlertCircle } from 'lucide-react';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

const VentasDashboard: React.FC = () => {
    const { user } = useAuthStore();
    const { data, isLoading, error, period, setPeriod, fetchData } = useSalesDashboardStore();
    const branchColor = user?.branch?.color ?? '#F59E0B';
    const branchName = user?.branch?.name;

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-DE', { style: 'currency', currency: 'EUR' }).format(value);
    };

    return (
        <div className="p-8 pb-20 bg-slate-50 min-h-full">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <span className="text-xs font-bold uppercase tracking-widest mb-1 block" style={{ color: branchColor }}>
                        VENTAS & CRM {branchName ? `· ${branchName}` : '· Todas las Sedes'}
                    </span>
                    <h1 className="text-2xl font-bold text-slate-800">Dashboard de Ventas</h1>
                    <p className="text-slate-500 text-sm mt-1">Análisis de rendimiento, leads y captación</p>
                </div>
                <div className="flex gap-3 items-center">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-4 py-2 hover:border-slate-300 transition-colors shadow-sm focus:ring-2 focus:ring-blue-100 outline-none"
                    >
                        <option value="daily">Diario (Hoy)</option>
                        <option value="weekly">Semanal (Últimos 7 días)</option>
                        <option value="monthly">Mensual (Últimos 30 días)</option>
                    </select>
                    <button onClick={fetchData} className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors">
                        Actualizar
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-center gap-2 mb-6">
                    <AlertCircle size={16} /><span className="text-sm font-medium">{error}</span>
                </div>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center p-16">
                    <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${branchColor} transparent transparent transparent` }} />
                </div>
            ) : data && (
                <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="bg-white rounded-2xl p-5 border shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
                                    <Users2 size={18} />
                                </div>
                                <p className="text-sm text-gray-500 font-medium">Nuevos Leads</p>
                            </div>
                            <p className="text-3xl font-bold text-gray-800">{data.leads.total}</p>
                            <p className="text-xs text-gray-400 mt-1 capitalize">{period}</p>
                        </div>
                        
                        <div className="bg-white rounded-2xl p-5 border shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                                    <TrendingUp size={18} />
                                </div>
                                <p className="text-sm text-gray-500 font-medium">Ingresos Generados</p>
                            </div>
                            <p className="text-3xl font-bold text-gray-800">
                                {formatCurrency(data.revenue_by_category.reduce((sum, item) => sum + item.amount, 0))}
                            </p>
                            <p className="text-xs text-gray-400 mt-1 capitalize pt-0.5">{period} (Órdenes emitidas)</p>
                        </div>

                        <div className="bg-white rounded-2xl p-5 border shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
                                    <FileText size={18} />
                                </div>
                                <p className="text-sm text-gray-500 font-medium">Presupuestos Emitidos</p>
                            </div>
                            <p className="text-3xl font-bold text-gray-800">{data.quotes.total}</p>
                            <p className="text-xs text-gray-400 mt-1 capitalize">{period}</p>
                        </div>
                    </div>

                    {/* CHARTS GRID */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Leads By Status */}
                        <div className="bg-white rounded-2xl border shadow-sm p-6">
                            <h3 className="text-sm font-bold text-slate-700 mb-4">Leads por Estado</h3>
                            <div className="h-64 w-full">
                                {data.leads.by_status.length > 0 ? (
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie
                                                data={data.leads.by_status}
                                                dataKey="count"
                                                nameKey="status"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {data.leads.by_status.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex bg-slate-50 rounded-xl items-center justify-center h-full text-slate-400 text-sm">Sin datos para mostrar</div>
                                )}
                            </div>
                        </div>

                        {/* Quotes By Status */}
                        <div className="bg-white rounded-2xl border shadow-sm p-6">
                            <h3 className="text-sm font-bold text-slate-700 mb-4">Presupuestos por Estado</h3>
                            <div className="h-64 w-full">
                                {data.quotes.by_status.length > 0 ? (
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie
                                                data={data.quotes.by_status}
                                                dataKey="count"
                                                nameKey="status"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {data.quotes.by_status.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex bg-slate-50 rounded-xl items-center justify-center h-full text-slate-400 text-sm">Sin datos para mostrar</div>
                                )}
                            </div>
                        </div>

                        {/* Revenue by Category */}
                        <div className="bg-white rounded-2xl border shadow-sm p-6">
                            <h3 className="text-sm font-bold text-slate-700 mb-4">Ingresos por Concepto</h3>
                            <div className="h-64 w-full">
                                {data.revenue_by_category.length > 0 ? (
                                    <ResponsiveContainer>
                                        <BarChart data={data.revenue_by_category} layout="vertical" margin={{ left: 25, right: 30 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                            <XAxis type="number" tickFormatter={(v) => `€${v}`} />
                                            <YAxis dataKey="category" type="category" width={90} tick={{ fontSize: 13 }} />
                                            <Tooltip formatter={(value: any) => formatCurrency(value)} />
                                            <Bar dataKey="amount" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Ingresos" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex bg-slate-50 rounded-xl items-center justify-center h-full text-slate-400 text-sm">Sin operaciones reportadas</div>
                                )}
                            </div>
                        </div>

                        {/* Hours Sold By Room */}
                        <div className="bg-white rounded-2xl border shadow-sm p-6">
                            <h3 className="text-sm font-bold text-slate-700 mb-4">Horas Vendidas por Sala</h3>
                            <div className="h-64 w-full">
                                {data.room_hours.length > 0 ? (
                                    <ResponsiveContainer>
                                        <BarChart data={data.room_hours} layout="vertical" margin={{ left: 25, right: 30 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                            <XAxis type="number" />
                                            <YAxis dataKey="room" type="category" width={110} tick={{ fontSize: 13 }} />
                                            <Tooltip formatter={(value: any) => `${value} hrs`} />
                                            <Bar dataKey="hours" fill="#10b981" radius={[0, 4, 4, 0]} name="Horas Vendidas" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex bg-slate-50 rounded-xl items-center justify-center h-full text-slate-400 text-sm">Sin horas de sala reportadas</div>
                                )}
                            </div>
                        </div>

                        {/* Revenue by Branch */}
                        <div className="bg-white rounded-2xl border shadow-sm p-6 lg:col-span-2">
                            <h3 className="text-sm font-bold text-slate-700 mb-4">Ingresos por Sede</h3>
                            <div className="h-72 w-full">
                                {data.revenue_by_branch.length > 0 ? (
                                    <ResponsiveContainer>
                                        <BarChart data={data.revenue_by_branch} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="branch" />
                                            <YAxis tickFormatter={(v) => `€${v}`} />
                                            <Tooltip formatter={(value: any) => formatCurrency(value)} />
                                            <Bar dataKey="amount" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Ingresos" maxBarSize={60} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex bg-slate-50 rounded-xl items-center justify-center h-full text-slate-400 text-sm">Sin ingresos reportados</div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default VentasDashboard;
