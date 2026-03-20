import React, { useEffect } from 'react';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { useDashboardStore } from '../hooks/useDashboardStore';
import { Landmark, CalendarDays, AlertCircle } from 'lucide-react';

/**
 * Dashboard for Operador role:
 * Limited view — only shows Orders and Estado de Cuenta KPIs.
 */
const OperadorDashboard: React.FC = () => {
    const { user } = useAuthStore();
    const { kpis, isLoading, error, fetchDashboardData } = useDashboardStore();
    const branchName = user?.branch?.name ?? 'Tu Sede';
    const branchColor = user?.branch?.color ?? '#10B981';

    useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

    return (
        <div className="p-8 pb-20 bg-slate-50 min-h-full">
            <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-widest mb-1 block" style={{ color: branchColor }}>OPERADOR · {branchName}</span>
                <h1 className="text-2xl font-bold text-slate-800">Panel Operativo</h1>
                <p className="text-slate-500 text-sm mt-1">Reservas activas y gestión diaria de {branchName}</p>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl">
                    <div className="bg-white rounded-2xl p-6 border shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${branchColor}20`, color: branchColor }}>
                                <CalendarDays size={18} />
                            </div>
                            <p className="text-sm text-gray-500 font-medium">Reservas Activas (Hoy)</p>
                        </div>
                        <p className="text-3xl font-bold text-gray-800">{kpis.activeBookingsToday ?? 0}</p>
                        <p className="text-xs text-gray-400 mt-1">Reservas confirmadas para hoy</p>
                    </div>
                    <div className="bg-white rounded-2xl p-6 border shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
                                <Landmark size={18} />
                            </div>
                            <p className="text-sm text-gray-500 font-medium">Ingresos del Mes</p>
                        </div>
                        <p className="text-3xl font-bold text-gray-800">US$ {(kpis.totalIncome ?? 0).toFixed(0)}</p>
                        <p className="text-xs text-gray-400 mt-1">Total facturado — últimos 30 días</p>
                    </div>
                </div>
            )}

            <div className="mt-8 p-5 bg-amber-50 border border-amber-100 rounded-2xl max-w-2xl">
                <p className="text-sm font-semibold text-amber-800 mb-1">Módulos Disponibles</p>
                <p className="text-xs text-amber-600">Como Operador tienes acceso a: Gestión Operativa (Clientes, Espacios, Salas, Reservas) y Finanzas limitado (Órdenes/Ventas y Estado de Cuenta).</p>
            </div>
        </div>
    );
};

export default OperadorDashboard;
