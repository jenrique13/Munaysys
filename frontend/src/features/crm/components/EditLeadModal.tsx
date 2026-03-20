import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCRMStore } from '../hooks/useCRMStore';

export const EditLeadModal: React.FC = () => {
    const { editingLeadOpp, setEditingLeadOpp, updateLeadAction, isLoading } = useCRMStore();
    const [formData, setFormData] = useState({
        email: '',
        phone: '',
        company: '',
        source: 'Web',
        ci_rif: '',
    });

    useEffect(() => {
        if (editingLeadOpp) {
            setFormData({
                email: editingLeadOpp.lead.email || '',
                phone: editingLeadOpp.lead.phone || '',
                company: editingLeadOpp.lead.company || '',
                source: editingLeadOpp.lead.source || 'Web',
                ci_rif: editingLeadOpp.lead.ci_rif || '',
            });
        }
    }, [editingLeadOpp]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingLeadOpp) return;

        const success = await updateLeadAction(editingLeadOpp.lead.id, formData);
        if (success) {
            setEditingLeadOpp(null);
        }
    };

    const onClose = () => setEditingLeadOpp(null);

    if (!editingLeadOpp) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg z-10 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Editar Lead</h2>
                        <p className="text-sm text-gray-500 font-medium mt-0.5">{editingLeadOpp.lead.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-colors self-start"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    <form id="edit-lead-form" onSubmit={handleSubmit} className="space-y-4">

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    placeholder="juan@empresa.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    placeholder="+56 9 1234 5678"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                            <input
                                type="text"
                                name="company"
                                value={formData.company}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="Empresa S.A."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">CI / RIF</label>
                            <input
                                type="text"
                                name="ci_rif"
                                value={formData.ci_rif}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="V-12345678"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Origen</label>
                            <select
                                name="source"
                                value={formData.source}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            >
                                <option value="Web">Sitio Web</option>
                                <option value="Referido">Referido</option>
                                <option value="Llamada Fria">Llamada Fría</option>
                                <option value="Redes Sociales">Redes Sociales</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="edit-lead-form"
                        disabled={isLoading}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-70 flex items-center"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                Guardando...
                            </>
                        ) : "Actualizar Lead"}
                    </button>
                </div>
            </div>
        </div>
    );
};
