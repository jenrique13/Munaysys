import { useState, useEffect, useMemo } from 'react';
import { Users, Search, CheckCircle, Archive, Clock, XCircle } from 'lucide-react';
import { useCRMStore } from '../hooks/useCRMStore';
import type { Lead, Opportunity, PipelineStage } from '../../../types';

// Status badge config
const statusConfig: Record<string, { label: string; classes: string; icon: React.ComponentType<{ size?: number }> }> = {
    active: { label: 'Activo', classes: 'bg-blue-100 text-blue-700', icon: Clock },
    won: { label: 'Ganado', classes: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    archived: { label: 'Archivado', classes: 'bg-gray-100 text-gray-500', icon: Archive },
    lost: { label: 'Perdido', classes: 'bg-red-100 text-red-600', icon: XCircle },
};

const ALL_STATUSES = ['all', 'active', 'won', 'archived'];

// Merge leads with their opportunity's current stage info
function buildProspectoRows(
    opportunities: Opportunity[],
    stages: PipelineStage[]
): Array<{ lead: Lead; opp: Opportunity; stage: PipelineStage | undefined }> {
    const stageMap = new Map(stages.map(s => [s.id, s]));
    return opportunities.map(opp => ({
        lead: opp.lead,
        opp,
        stage: stageMap.get(opp.stage_id),
    }));
}

export const ProspectosPage: React.FC = () => {
    const { stages, opportunities, fetchKanbanData, isLoading } = useCRMStore();

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        fetchKanbanData(0); // Fetch all branches
    }, [fetchKanbanData]);

    const rows = useMemo(() => buildProspectoRows(opportunities, stages), [opportunities, stages]);

    const filtered = useMemo(() => rows.filter(({ lead }) => {
        const matchesSearch = !search ||
            lead.name.toLowerCase().includes(search.toLowerCase()) ||
            (lead.email || '').toLowerCase().includes(search.toLowerCase()) ||
            (lead.company || '').toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
        return matchesSearch && matchesStatus;
    }), [rows, search, statusFilter]);

    const fmt = (v: number) => `$${v.toLocaleString('es-VE', { minimumFractionDigits: 0 })}`;

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Users size={22} className="text-blue-600" />
                        Prospectos
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Historial completo de leads y su progreso en el pipeline.</p>
                </div>
                <span className="bg-blue-50 text-blue-700 text-sm font-semibold px-3 py-1 rounded-full">
                    {filtered.length} prospecto{filtered.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Filters */}
            <div className="bg-white border-b border-gray-100 px-6 py-3 flex flex-wrap gap-3 items-center shrink-0">
                <div className="relative flex-1 min-w-48 max-w-sm">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por nombre, email o empresa..."
                        className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                </div>
                <div className="flex gap-1.5">
                    {ALL_STATUSES.map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${statusFilter === s
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600 bg-white'}`}
                        >
                            {s === 'all' ? 'Todos' : statusConfig[s]?.label || s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto p-6">
                {isLoading && opportunities.length === 0 ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                        <Users size={40} className="mb-3 text-gray-300" />
                        <p className="font-medium">No se encontraron prospectos</p>
                        <p className="text-sm mt-1">Crea un nuevo Lead desde el Pipeline.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-8">#</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prospecto</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Empresa</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stage Actual</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Valor Est.</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Fuente</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden xl:table-cell">Creado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map(({ lead, opp, stage }, idx) => {
                                    const statusInfo = statusConfig[lead.status] || statusConfig['active'];
                                    const StatusIcon = statusInfo.icon;
                                    return (
                                        <tr key={opp.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                        {lead.name[0].toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-gray-800 truncate">{lead.name}</p>
                                                        <div className="flex items-center gap-2">
                                                            {lead.email && <p className="text-xs text-gray-400 truncate">{lead.email}</p>}
                                                            {lead.ci_rif && <span className="text-[10px] text-indigo-500 font-mono bg-indigo-50 px-1 rounded">{lead.ci_rif}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                                                {lead.company || <span className="text-gray-300">—</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                {stage ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                                                        style={{ backgroundColor: stage.color + '22', color: stage.color }}>
                                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stage.color }} />
                                                        {stage.name}
                                                    </span>
                                                ) : <span className="text-gray-300 text-xs">—</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.classes}`}>
                                                    <StatusIcon size={10} />
                                                    {statusInfo.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-gray-700 hidden lg:table-cell">
                                                {opp.estimated_value > 0 ? fmt(opp.estimated_value) : <span className="text-gray-300">—</span>}
                                            </td>
                                            <td className="px-4 py-3 hidden lg:table-cell">
                                                {lead.source ? (
                                                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">{lead.source}</span>
                                                ) : <span className="text-gray-300 text-xs">—</span>}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-xs hidden xl:table-cell">
                                                {new Date(lead.created_at).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* KPI Footer */}
            <div className="bg-white border-t border-gray-200 px-6 py-3 flex gap-6 text-sm text-gray-500 shrink-0">
                <span>Total leads: <strong className="text-gray-700">{rows.length}</strong></span>
                <span>Ganados: <strong className="text-emerald-600">{rows.filter(r => r.lead.status === 'won').length}</strong></span>
                <span>
                    Valor Total Est.: <strong className="text-blue-600">
                        {fmt(rows.reduce((sum, r) => sum + (r.opp.estimated_value || 0), 0))}
                    </strong>
                </span>
            </div>
        </div>
    );
};
