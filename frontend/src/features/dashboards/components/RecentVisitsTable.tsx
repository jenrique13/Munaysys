import React from 'react';
import { Clock, LogOut, CheckCircle, Search, User } from 'lucide-react';
import type { VisitFormData } from './VisitsForm';

interface RecentVisitsTableProps {
    visits: VisitFormData[];
    onVisitExit: (visitId: number) => void;
}

const RecentVisitsTable: React.FC<RecentVisitsTableProps> = ({ visits, onVisitExit }) => {
    
    // Reverse array to show newest first
    const sortedVisits = [...visits].sort((a, b) => {
        if (!a.entry_time || !b.entry_time) return 0;
        return new Date(b.entry_time).getTime() - new Date(a.entry_time).getTime();
    });

    const formatTime = (isoString?: string) => {
        if (!isoString) return '--:--';
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="bg-white rounded-3xl p-6 md:p-8 border shadow-sm h-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                        <Clock size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Visitas de Hoy</h2>
                        <p className="text-sm text-gray-500">Registro de entradas y salidas</p>
                    </div>
                </div>
                <div className="text-xs font-bold px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
                    {visits.length} Total
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-left divide-y divide-gray-200">
                    <thead className="bg-gray-50 hidden md:table-header-group">
                        <tr>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Visitante</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Visita A</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Motivo</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Entrada</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Salida</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-50 md:bg-white flex flex-col md:table-row-group gap-4 md:gap-0 p-4 md:p-0 md:divide-y md:divide-gray-200">
                        {sortedVisits.map((visit) => (
                            <tr key={visit.id} className="hover:bg-gray-50 transition-colors flex flex-col md:table-row bg-white border md:border-0 border-gray-200 rounded-xl p-4 md:p-0 shadow-sm md:shadow-none">
                                {/* Visitante */}
                                <td className="px-0 py-2 md:px-6 md:py-4 md:whitespace-nowrap flex justify-between items-center md:table-cell border-b md:border-0 border-gray-100">
                                    <span className="md:hidden font-bold text-xs text-gray-400 uppercase">Visitante</span>
                                    <div>
                                        <div className="font-bold text-gray-900">{visit.name}</div>
                                        <div className="text-xs text-gray-500">{visit.ci_rif}</div>
                                    </div>
                                </td>

                                {/* Visita A */}
                                <td className="px-0 py-2 md:px-6 md:py-4 md:whitespace-nowrap flex justify-between items-center md:table-cell border-b md:border-0 border-gray-100">
                                    <span className="md:hidden font-bold text-xs text-gray-400 uppercase">Visita A</span>
                                    <div className="flex items-center text-sm font-medium text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg w-max">
                                        <User size={14} className="mr-1.5 opacity-70" />
                                        {visit.host_client_name}
                                    </div>
                                </td>

                                {/* Motivo */}
                                <td className="px-0 py-2 md:px-6 md:py-4 text-sm text-gray-600 flex justify-between items-center md:table-cell border-b md:border-0 border-gray-100">
                                    <span className="md:hidden font-bold text-xs text-gray-400 uppercase">Motivo</span>
                                    <span className="truncate max-w-[150px] md:max-w-[200px]" title={visit.reason}>
                                        {visit.reason}
                                    </span>
                                </td>

                                {/* Entrada */}
                                <td className="px-0 py-2 md:px-6 md:py-4 md:whitespace-nowrap text-center flex justify-between items-center md:table-cell border-b md:border-0 border-gray-100">
                                    <span className="md:hidden font-bold text-xs text-gray-400 uppercase">Entrada</span>
                                    <span className="font-semibold text-gray-800">{formatTime(visit.entry_time)}</span>
                                </td>

                                {/* Salida */}
                                <td className="px-0 py-2 md:px-6 md:py-4 md:whitespace-nowrap text-center flex justify-between items-center md:table-cell border-b md:border-0 border-gray-100">
                                    <span className="md:hidden font-bold text-xs text-gray-400 uppercase">Salida</span>
                                    <span className="font-semibold text-gray-500">{visit.exit_time ? formatTime(visit.exit_time) : '--:--'}</span>
                                </td>

                                {/* Estado / Acciones */}
                                <td className="px-0 py-3 md:px-6 md:py-4 md:whitespace-nowrap text-right flex justify-end items-center md:table-cell mt-2 md:mt-0">
                                    {visit.status === 'active' ? (
                                        <button 
                                            onClick={() => visit.id && onVisitExit(visit.id)}
                                            className="w-full md:w-auto flex items-center justify-center gap-1.5 bg-red-50 text-red-600 hover:bg-red-100 font-semibold px-3 py-1.5 rounded-lg transition-colors text-sm"
                                        >
                                            <LogOut size={16} />
                                            Marcar Salida
                                        </button>
                                    ) : (
                                        <div className="w-full md:w-auto flex items-center justify-end gap-1.5 text-gray-400 font-medium px-3 py-1.5 text-sm">
                                            <CheckCircle size={16} />
                                            Completada
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}

                        {visits.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                    <Search size={32} className="mx-auto mb-3 opacity-20" />
                                    No hay visitas registradas el día de hoy
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RecentVisitsTable;
