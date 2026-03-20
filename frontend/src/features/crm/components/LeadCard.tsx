import React, { useState } from 'react';
import type { Opportunity } from '../../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Building2, Calendar, DollarSign, GripVertical, MoreVertical, Edit2, Archive, Trash2 } from 'lucide-react';
import { Draggable } from '@hello-pangea/dnd';
import { useCRMStore } from '../hooks/useCRMStore';

interface Props {
    opportunity: Opportunity;
    index: number;
}

export const LeadCard: React.FC<Props> = ({ opportunity, index }) => {
    const { lead, estimated_value, probability, expected_close_date } = opportunity;
    const [showMenu, setShowMenu] = useState(false);
    const { deleteLeadAction, archiveLeadAction, setEditingLeadOpp } = useCRMStore();

    const handleAction = (action: 'edit' | 'archive' | 'delete', e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(false);
        if (action === 'edit') {
            setEditingLeadOpp(opportunity);
        } else if (action === 'archive') {
            archiveLeadAction(lead.id);
        } else if (action === 'delete') {
            deleteLeadAction(lead.id);
        }
    };

    return (
        <Draggable draggableId={opportunity.id.toString()} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    title={`Nombre: ${lead.name}\nEmpresa: ${lead.company || 'N/A'}\nEmail: ${lead.email || 'N/A'}\nTeléfono: ${lead.phone || 'N/A'}`}
                    className={`bg-white p-2.5 rounded-lg shadow-sm border border-gray-200 mb-2.5 group relative 
            ${snapshot.isDragging ? 'shadow-lg border-blue-400 rotate-2 z-50' : 'hover:border-gray-300'}
            transition-all duration-200`}
                >
                    {/* Header Card */}
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 pr-2">
                            <h4 className="font-semibold text-gray-800 text-[13px] leading-tight">{lead.name}</h4>
                        </div>
                        <div className="flex items-center space-x-1 shrink-0">
                            {/* Drag Handle */}
                            <div
                                {...provided.dragHandleProps}
                                className="text-gray-400 opacity-0 group-hover:opacity-100 cursor-grab"
                            >
                                <GripVertical size={16} />
                            </div>

                            {/* Actions Menu Trigger */}
                            <div className="relative">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                                    className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                >
                                    <MoreVertical size={16} />
                                </button>

                                {/* Dropdown Menu */}
                                {showMenu && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}
                                        />
                                        <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50 text-sm flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                            <button
                                                onClick={(e) => handleAction('edit', e)}
                                                className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                                            >
                                                <Edit2 size={14} className="mr-2" /> Editar
                                            </button>
                                            <button
                                                onClick={(e) => handleAction('archive', e)}
                                                className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-amber-600 transition-colors"
                                            >
                                                <Archive size={14} className="mr-2" /> Archivar
                                            </button>
                                            <div className="h-px bg-gray-100 my-1 mx-2" />
                                            <button
                                                onClick={(e) => handleAction('delete', e)}
                                                className="flex items-center px-3 py-2 text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                <Trash2 size={14} className="mr-2" /> Eliminar
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Company */}
                    {lead.company && (
                        <div className="flex items-center text-xs text-gray-500 mb-2.5">
                            <Building2 size={13} className="mr-1.5 shrink-0" />
                            <span className="truncate">{lead.company}</span>
                        </div>
                    )}

                    {/* Footer Metrics */}
                    <div className="flex justify-between items-center mt-3">
                        <div className="flex items-center text-[11px] font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                            <DollarSign size={11} className="mr-0.5" />
                            {estimated_value.toLocaleString('es-CL')}
                        </div>

                        {expected_close_date && (
                            <div className="flex items-center text-[11px] text-gray-400">
                                <Calendar size={11} className="mr-1" />
                                {format(new Date(expected_close_date), "d MMM", { locale: es })}
                            </div>
                        )}

                        <div className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${probability > 50 ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                            {probability}%
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
};
