import React, { useState } from 'react';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import VisitsForm from '../components/VisitsForm';
import type { VisitFormData } from '../components/VisitsForm';
import RecentVisitsTable from '../components/RecentVisitsTable';
import { useDashboardStore } from '../hooks/useDashboardStore';
import { CalendarDays, Clock } from 'lucide-react';
import { useEffect } from 'react';

const OperadorDashboard: React.FC = () => {
    const { user } = useAuthStore();
    const { operatorData, fetchOperatorData } = useDashboardStore();
    const branchName = user?.branch?.name ?? 'Tu Sede';
    const branchColor = user?.branch?.color ?? '#10B981';

    useEffect(() => {
        fetchOperatorData();
    }, [fetchOperatorData]);

    // Local state for visits (mocked for now since backend doesn't support it yet)
    const [visits, setVisits] = useState<VisitFormData[]>([]);

    const handleVisitCreated = (newVisit: VisitFormData) => {
        setVisits(prev => [...prev, newVisit]);
    };

    const handleVisitExit = (visitId: number) => {
        setVisits(prev => prev.map(v => 
            v.id === visitId 
                ? { ...v, status: 'completed', exit_time: new Date().toISOString() } 
                : v
        ));
    };

    return (
        <div className="p-4 md:p-8 pb-20 bg-slate-50 min-h-full">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white border shadow-sm" style={{ color: branchColor }}>
                            RECEPCIÓN
                        </span>
                        <span className="text-slate-400 text-xs font-medium">•</span>
                        <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{branchName}</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Registro de Visitas</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Control de accesos para hoy, {format(new Date(), "eeee d 'de' MMMM, hh:mm aa", { locale: es })}
                    </p>
                </div>
            </div>

            {/* Dashboard Content */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Formulario de Registro (1/3 en pantallas muy grandes, pero arriba en móvil) */}
                <div className="xl:col-span-1">
                    <VisitsForm onVisitCreated={handleVisitCreated} />
                </div>

                {/* Tabla de Visitas Recientes (2/3) */}
                <div className="xl:col-span-2 flex flex-col gap-8">
                    <RecentVisitsTable visits={visits} onVisitExit={handleVisitExit} />

                    {/* Reservas del Día */}
                    <div className="bg-white rounded-3xl p-6 md:p-8 border shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <CalendarDays size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Reservas de Hoy</h2>
                                    <p className="text-sm text-gray-500">Próximos clientes en sala</p>
                                </div>
                            </div>
                            <div className="text-xs font-bold px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
                                {operatorData?.daily_bookings?.length || 0} Total
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left divide-y divide-gray-200">
                                <thead className="bg-gray-50 hidden md:table-header-group">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Sala</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Horario</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Cliente</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Notas</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-50 md:bg-white flex flex-col md:table-row-group gap-4 md:gap-0 p-4 md:p-0 md:divide-y md:divide-gray-200">
                                    {(!operatorData?.daily_bookings || operatorData.daily_bookings.length === 0) ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                                                No hay reservas programadas para hoy
                                            </td>
                                        </tr>
                                    ) : (
                                        operatorData.daily_bookings.map((b: any, i: number) => (
                                            <tr key={i} className="flex flex-col md:table-row bg-white border md:border-0 border-gray-200 rounded-xl p-4 md:p-0 shadow-sm md:shadow-none hover:bg-gray-50 transition-colors">
                                                {/* Sala */}
                                                <td className="px-0 py-2 md:px-6 md:py-4 md:whitespace-nowrap flex justify-between items-center md:table-cell border-b md:border-0 border-gray-100">
                                                    <span className="md:hidden font-bold text-xs text-gray-400 uppercase">Sala</span>
                                                    <span className="font-bold text-gray-800">{b.room_name}</span>
                                                </td>
                                                {/* Horario */}
                                                <td className="px-0 py-2 md:px-6 md:py-4 md:whitespace-nowrap text-center flex justify-between items-center md:table-cell border-b md:border-0 border-gray-100">
                                                    <span className="md:hidden font-bold text-xs text-gray-400 uppercase">Horario</span>
                                                    <div className="flex items-center gap-1.5 md:justify-center">
                                                        <Clock size={14} className="text-indigo-500" />
                                                        <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg">
                                                            {format(new Date(b.start_time), 'HH:mm')} - {format(new Date(b.end_time), 'HH:mm')}
                                                        </span>
                                                    </div>
                                                </td>
                                                {/* Cliente */}
                                                <td className="px-0 py-2 md:px-6 md:py-4 md:whitespace-nowrap flex justify-between items-center md:table-cell border-b md:border-0 border-gray-100">
                                                    <span className="md:hidden font-bold text-xs text-gray-400 uppercase">Cliente</span>
                                                    <span className="font-medium text-gray-700">{b.client_name}</span>
                                                </td>
                                                {/* Notas */}
                                                <td className="px-0 py-2 md:px-6 md:py-4 text-sm text-gray-500 flex justify-between items-center md:table-cell mt-2 md:mt-0">
                                                    <span className="md:hidden font-bold text-xs text-gray-400 uppercase">Notas</span>
                                                    <span className="truncate max-w-[150px] md:max-w-[200px]" title={b.notes || ''}>
                                                        {b.notes || '-'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OperadorDashboard;
