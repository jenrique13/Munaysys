import React from 'react';
import type { Opportunity } from '../../../types';
import { Droppable } from '@hello-pangea/dnd';
import { LeadCard } from './LeadCard';

interface Props {
    stageId: number;
    title: string;
    color: string;
    opportunities: Opportunity[];
}

export const KanbanColumn: React.FC<Props> = ({ stageId, title, color, opportunities }) => {
    return (
        <div className="flex flex-col w-64 shrink-0 bg-gray-50 bg-opacity-80 rounded-xl mr-3 overflow-hidden shadow-sm h-full max-h-screen">
            {/* Header */}
            <div
                className="px-3 py-2.5 border-b border-gray-200 flex justify-between items-center"
                style={{ borderTop: `4px solid ${color}` }}
            >
                <h3 className="font-bold text-gray-700 text-sm truncate pr-2">{title}</h3>
                <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-gray-500 shadow-sm shrink-0">
                    {opportunities.length}
                </span>
            </div>

            {/* Droppable Area */}
            <Droppable droppableId={stageId.toString()}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 p-3 overflow-y-auto transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-blue-50/50' : 'bg-transparent'
                            }`}
                    >
                        {opportunities.map((opp, index) => (
                            <LeadCard key={opp.id} opportunity={opp} index={index} />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
};
