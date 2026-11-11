import { useEffect, useState } from 'react';
import { KanbanBoard } from '../components/KanbanBoard';
import { NewLeadModal } from '../components/NewLeadModal';
import { EditLeadModal } from '../components/EditLeadModal';
import { useCRMStore } from '../hooks/useCRMStore';
import { UserCheck, X } from 'lucide-react';

export const PipelinePage: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { lastConvertedClient, clearConvertedClient, fetchKanbanData } = useCRMStore();

    useEffect(() => {
        fetchKanbanData(0); // Fetch all branches
    }, [fetchKanbanData]);

    // Auto-dismiss the toast after 6 seconds
    useEffect(() => {
        if (lastConvertedClient) {
            const timer = setTimeout(() => clearConvertedClient(), 6000);
            return () => clearTimeout(timer);
        }
    }, [lastConvertedClient, clearConvertedClient]);

    return (
        <div className="flex flex-col h-full relative">
            {/* Header Page */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Pipeline de Ventas</h1>
                    <p className="text-sm text-gray-500 mt-1">Gestiona las oportunidades comerciales arrastrando las tarjetas.</p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors duration-200"
                >
                    + Nuevo Lead
                </button>
            </div>

            {/* Main Board Container */}
            <main className="flex-1 overflow-hidden bg-gray-100">
                <KanbanBoard />
            </main>

            <NewLeadModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
            <EditLeadModal />

            {/* Toast de Cliente Convertido */}
            {lastConvertedClient && (
                <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-emerald-700 text-white rounded-xl shadow-2xl p-4 flex items-start gap-3 max-w-sm border border-emerald-600">
                        <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                            <UserCheck size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm">¡Lead convertido a Cliente!</p>
                            <p className="text-emerald-200 text-xs mt-0.5 truncate">
                                <span className="font-semibold text-white">{lastConvertedClient.name}</span>
                                {lastConvertedClient.email && ` · ${lastConvertedClient.email}`}
                            </p>
                            <p className="text-emerald-300 text-xs mt-1">
                                Se ha creado un nuevo cliente automáticamente.
                            </p>
                        </div>
                        <button
                            onClick={clearConvertedClient}
                            className="text-emerald-300 hover:text-white transition-colors shrink-0 mt-0.5"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
