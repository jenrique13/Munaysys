import React, { useEffect } from 'react';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { useDashboardStore } from '../hooks/useDashboardStore';
import { Users2, TrendingUp, FileText, AlertCircle } from 'lucide-react';

/**
 * Dashboard for Ventas (Sales) role:
 * Shows CRM-focused metrics — leads, pipeline value, and quotes.
 */
const VentasDashboard: React.FC = () => {
    const { user } = useAuthStore();
    const { kpis, isLoading, error, fetchDashboardData } = useDashboardStore();
    const branchColor = user?.branch?.color ?? '#F59E0B';
    const branchName = user?.branch?.name;

    useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

    return (
        <div className="p-8 pb-20 bg-slate-50 min-h-full">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <span className="text-xs font-bold uppercase tracking-widest mb-1 block" style={{ color: branchColor }}>
                        VENTAS {branchName ? `· ${branchName}` : '· Todas las Sedes'}
                    </span>
                    <h1 className="text-2xl font-bold text-slate-800">Dashboard de Ventas & CRM</h1>
                    <p className="text-slate-500 text-sm mt-1">Pipeline de leads, presupuestos y conversiones</p>
                </div>
                <button onClick={fetchDashboardData} className="text-sm bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-50 shadow-sm">Actualizar</button>
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
            ) : kpis && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="bg-white rounded-2xl p-5 border shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${branchColor}20`, color: branchColor }}>
                                    <Users2 size={18} />
                                </div>
                                <p className="text-sm text-gray-500 font-medium">Nuevos Leads</p>
                            </div>
                            <p className="text-3xl font-bold text-gray-800">{kpis.newLeads ?? 0}</p>
                            <p className="text-xs text-gray-400 mt-1">Últimos 30 días</p>
                        </div>
                        <div className="bg-white rounded-2xl p-5 border shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                                    <TrendingUp size={18} />
                                </div>
                                <p className="text-sm text-gray-500 font-medium">Ingresos Generados</p>
                            </div>
                            <p className="text-3xl font-bold text-gray-800">US$ {(kpis.totalIncome ?? 0).toFixed(0)}</p>
                            <p className="text-xs text-gray-400 mt-1">Órdenes convertidas</p>
                        </div>
                        <div className="bg-white rounded-2xl p-5 border shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
                                    <FileText size={18} />
                                </div>
                                <p className="text-sm text-gray-500 font-medium">Presupuestos</p>
                            </div>
                            <p className="text-3xl font-bold text-gray-800">—</p>
                            <p className="text-xs text-gray-400 mt-1">Ver módulo de Presupuestos</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border p-5 shadow-sm">
                        <p className="text-sm font-semibold text-gray-700 mb-3">📌 Acceso por Sede</p>
                        <p className="text-sm text-gray-500">
                            La base de datos de <strong>Clientes</strong> es compartida entre todas las sedes.
                            Al crear un <strong>Presupuesto</strong>, deberás seleccionar la <strong>Sede</strong> antes de elegir los productos o servicios.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VentasDashboard;
