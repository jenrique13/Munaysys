import React, { useState, useEffect, useRef } from 'react';
import { useOperativeStore } from '../../operative/hooks/useOperativeStore';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { User, Mail, FileText, Users, Clock, Search, CheckCircle } from 'lucide-react';
import type { Client } from '../../operative/types';

export interface VisitFormData {
    id?: number;
    name: string;
    ci_rif: string;
    email: string;
    reason: string;
    host_client_id: number | null;
    host_client_name: string;
    status?: string;
    entry_time?: string;
    exit_time?: string;
}

interface VisitsFormProps {
    onVisitCreated: (visit: VisitFormData) => void;
}

const VisitsForm: React.FC<VisitsFormProps> = ({ onVisitCreated }) => {
    const { user } = useAuthStore();
    const { clients, fetchClients } = useOperativeStore();
    const branchId = user?.branch_id;

    const [formData, setFormData] = useState<VisitFormData>({
        name: '',
        ci_rif: '',
        email: '',
        reason: '',
        host_client_id: null,
        host_client_name: ''
    });

    const [isSearching, setIsSearching] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (branchId) {
            fetchClients(branchId);
        }
    }, [branchId, fetchClients]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsSearching(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const filteredClients = clients.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (c.ci_rif && c.ci_rif.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Mock ID creation for local state
        const newVisit = {
            id: Date.now(),
            ...formData,
            status: 'active',
            entry_time: new Date().toISOString()
        };

        onVisitCreated(newVisit);

        // Reset form
        setFormData({
            name: '',
            ci_rif: '',
            email: '',
            reason: '',
            host_client_id: null,
            host_client_name: ''
        });
        setSearchTerm('');
    };

    const handleSelectClient = (client: Client) => {
        setFormData({
            ...formData,
            host_client_id: client.id,
            host_client_name: client.name
        });
        setSearchTerm(client.name);
        setIsSearching(false);
    };

    return (
        <div className="bg-white rounded-3xl p-6 md:p-8 border shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <User size={20} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Registrar Visita</h2>
                    <p className="text-sm text-gray-500">Ingreso rápido de visitantes</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Nombre */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre Completo *</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User size={16} className="text-gray-400" />
                            </div>
                            <input
                                required
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                placeholder="Ej. Juan Pérez"
                            />
                        </div>
                    </div>

                    {/* Cédula */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cédula / Pasaporte *</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FileText size={16} className="text-gray-400" />
                            </div>
                            <input
                                required
                                type="text"
                                value={formData.ci_rif}
                                onChange={e => setFormData({ ...formData, ci_rif: e.target.value })}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                placeholder="Ej. V-12345678"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Correo Electrónico</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail size={16} className="text-gray-400" />
                            </div>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                placeholder="correo@ejemplo.com"
                            />
                        </div>
                    </div>

                    {/* A quién visita (Autocomplete) */}
                    <div className="md:col-span-2 relative" ref={wrapperRef}>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">A quién visita *</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Users size={16} className="text-gray-400" />
                            </div>
                            <input
                                required
                                type="text"
                                value={searchTerm}
                                onChange={e => {
                                    setSearchTerm(e.target.value);
                                    setIsSearching(true);
                                    setFormData({ ...formData, host_client_id: null, host_client_name: e.target.value });
                                }}
                                onFocus={() => setIsSearching(true)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                placeholder="Buscar empresa o persona..."
                            />
                            {searchTerm && (
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                    {formData.host_client_id ? (
                                        <CheckCircle size={16} className="text-green-500" />
                                    ) : (
                                        <Search size={16} className="text-gray-400" />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Dropdown Results */}
                        {isSearching && searchTerm.length > 0 && !formData.host_client_id && (
                            <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 max-h-60 overflow-y-auto">
                                {filteredClients.length > 0 ? (
                                    <ul className="py-2">
                                        {filteredClients.map(client => (
                                            <li
                                                key={client.id}
                                                onClick={() => handleSelectClient(client)}
                                                className="px-4 py-2 hover:bg-indigo-50 cursor-pointer flex flex-col"
                                            >
                                                <span className="font-medium text-gray-800">{client.name}</span>
                                                <span className="text-xs text-gray-500">{client.ci_rif || 'Sin CI/RIF'}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="p-4 text-center text-sm text-gray-500">
                                        No se encontraron clientes. 
                                        <div className="mt-1 text-xs text-indigo-600 cursor-pointer font-medium hover:underline" onClick={() => {
                                            setFormData({...formData, host_client_name: searchTerm});
                                            setIsSearching(false);
                                        }}>
                                            Usar "{searchTerm}" de todos modos
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Motivo */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Motivo de la Visita *</label>
                        <textarea
                            required
                            value={formData.reason}
                            onChange={e => setFormData({ ...formData, reason: e.target.value })}
                            rows={2}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                            placeholder="Ej. Reunión de negocios, Entrega de documentos..."
                        />
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <CheckCircle size={18} />
                        Registrar Entrada
                    </button>
                </div>
            </form>
        </div>
    );
};

export default VisitsForm;
