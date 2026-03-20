import React, { useEffect } from 'react';
import type { DropResult } from '@hello-pangea/dnd';
import { DragDropContext } from '@hello-pangea/dnd';
import { KanbanColumn } from './KanbanColumn';
import { useCRMStore } from '../hooks/useCRMStore';

export const KanbanBoard: React.FC = () => {
    const { stages, opportunities, isLoading, fetchKanbanData, moveOpportunity } = useCRMStore();

    useEffect(() => {
        fetchKanbanData();
    }, [fetchKanbanData]);

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const sourceStageId = parseInt(source.droppableId);
        const destStageId = parseInt(destination.droppableId);
        const opportunityId = parseInt(draggableId);

        // Call Zustand Store action
        moveOpportunity(opportunityId, sourceStageId, destStageId);
    };

    if (isLoading && stages.length === 0) {
        return (
            <div className="flex h-full w-full justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden">

            {/* Scrollable Horizonte para las columnas Kanban */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 pb-2">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex h-full items-start">
                        {stages.map((stage) => {
                            // Filtrar oportunidades que pertenecen a esta fase (estado local persistido)
                            const stageOpps = opportunities.filter((opp) => opp.stage_id === stage.id);

                            return (
                                <KanbanColumn
                                    key={stage.id}
                                    stageId={stage.id}
                                    title={stage.name}
                                    color={stage.color || '#E2E8F0'}
                                    opportunities={stageOpps}
                                />
                            );
                        })}
                    </div>
                </DragDropContext>
            </div>

        </div>
    );
};
