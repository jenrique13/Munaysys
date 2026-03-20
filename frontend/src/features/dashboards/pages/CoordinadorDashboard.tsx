import React, { useEffect } from 'react';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { useDashboardStore } from '../hooks/useDashboardStore';
import { Landmark, CalendarDays, FileText, AlertCircle } from 'lucide-react';

/**
 * Dashboard for Coordinador role:
 * Shows full Operativo + Finanzas for the user's specific branch.
 */
const CoordinadorDashboard: React.FC = () => {
    const { user } = useAuthStore();
    const { kpis, isLoading, error, fetchDashboardData } = useDashboardStore();
    const branchName = user?.branch?.name ?? 'Tu Sede';
    const branchColor = user?.branch?.color ?? '#4F46E5';

    useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

    return (
        <div className="p-8 pb-20 bg-slate-50 min-h-full">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <span className="text-xs font-bold uppercase tracking-widest mb-1 block" style={{ color: branchColor }}>COORDINADOR · {branchName}</span>
                    <h1 className="text-2xl font-bold text-slate-800">Dashboard de Sede</h1>
                    <p className="text-slate-500 text-sm mt-1">Rendimiento operativo y financiero de {branchName}</p>
                </div>
                <button onClick={fetchDashboardData} className="text-sm bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-50 shadow-sm">Actualizar</button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-center gap-2 mb-6">
                    <AlertCircle size={16} />
                    <span className="text-sm font-medium">{error}</span>
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
                                    <Landmark size={18} />
                                </div>
                                <p className="text-sm text-gray-500 font-medium">Ingresos Totales</p>
                            </div>
                            <p className="text-2xl font-bold text-gray-800">US$ {kpis.totalIncome?.toFixed(0) ?? 0}</p>
                        </div>
                        <div className="bg-white rounded-2xl p-5 border shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
                                    <CalendarDays size={18} />
                                </div>
                                <p className="text-sm text-gray-500 font-medium">Reservas Hoy</p>
                            </div>
                            <p className="text-2xl font-bold text-gray-800">{kpis.activeBookingsToday ?? 0}</p>
                        </div>
                        <div className="bg-white rounded-2xl p-5 border shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                                    <FileText size={18} />
                                </div>
                                <p className="text-sm text-gray-500 font-medium">Gastos Totales</p>
                            </div>
                            <p className="text-2xl font-bold text-gray-800">US$ {kpis.totalExpenses?.toFixed(0) ?? 0}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border p-5 shadow-sm">
                        <p className="text-sm font-bold text-gray-700 mb-4">Utilidad Operativa</p>
                        <div className="p-6 rounded-xl text-white text-center" style={{ background: `linear-gradient(135deg, ${branchColor}, ${branchColor}90)` }}>
                            <p className="text-4xl font-bold">US$ {kpis.profit?.toFixed(0) ?? 0}</p>
                            <p className="text-sm mt-1 opacity-80">Utilidad neta — últimos 30 días</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoordinadorDashboard;
