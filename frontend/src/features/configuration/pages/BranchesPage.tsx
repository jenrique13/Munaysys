import React, { useEffect, useState } from 'react';
import { useConfigurationStore } from '../hooks/useConfigurationStore';
import type { Branch } from '../types';
import { Building2, Search, Edit2, Plus, CheckCircle, XCircle, X } from 'lucide-react';

const BranchModal: React.FC<{ branch?: Branch; onClose: () => void }> = ({ branch, onClose }) => {
    const { createBranch, updateBranch, isLoading } = useConfigurationStore();
    const [name, setName] = useState(branch?.name || '');
    const [address, setAddress] = useState(branch?.address || '');
    const [color, setColor] = useState(branch?.color || '#4F46E5');
    const [isActive, setIsActive] = useState(branch ? branch.is_active : true);

    const isEdit = !!branch;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let ok = false;

        if (isEdit) {
            ok = await updateBranch(branch.id, { name, address, color, is_active: isActive });
        } else {
            ok = await createBranch({ name, address, color });
        }

        if (ok) onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md z-10 overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                        <Building2 size={18} /> {isEdit ? 'Editar Sede' : 'Nueva Sede'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:bg-gray-100 p-1 rounded-full"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Sede *</label>
                        <input type="text" required value={name} onChange={e => setName(e.target.value)}
                            placeholder="Ej: Sede Principal, Sede Norte..."
                            className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dirección (Opcional)</label>
                        <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2}
                            placeholder="Ubicación física..."
                            className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Color de la Sede</label>
                        <div className="flex items-center gap-3">
                            <input type="color" value={color} onChange={e => setColor(e.target.value)}
                                className="w-10 h-10 rounded cursor-pointer border-0 p-0" title="Seleccionar color" />
                            <span className="text-sm text-gray-500 font-mono max-w-[100px]">{color.toUpperCase()}</span>
                        </div>
                    </div>

                    {isEdit && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)}
                                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
                            <label htmlFor="isActive" className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                                Sede Operativa (Mostrar en catálogos y sistemas)
                            </label>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium">Cancelar</button>
                        <button disabled={isLoading || !name.trim()} type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50">
                            {isLoading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Sede'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const BranchesPage: React.FC = () => {
    const { branches, fetchBranches, isLoading } = useConfigurationStore();
    const [search, setSearch] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [editBranch, setEditBranch] = useState<Branch | null>(null);

    useEffect(() => {
        fetchBranches();
    }, [fetchBranches]);

    const filtered = branches.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="flex flex-col h-full bg-gray-50/30">
            <div className="bg-white px-6 py-4 flex justify-between items-center shrink-0 border-b">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Building2 size={22} className="text-indigo-600" /> Gestión de Sedes
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Administra los locales físicos y sucursales.</p>
                </div>
                <button onClick={() => setShowNew(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
                    <Plus size={16} /> Nueva Sede
                </button>
            </div>

            <div className="px-6 py-3 bg-white border-b shrink-0 flex items-center justify-between">
                <div className="relative max-w-sm w-full">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar sucursal..."
                        className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition" />
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1.5 text-xs bg-indigo-50 text-indigo-700 rounded font-medium border border-indigo-100">Mostrando {filtered.length} sedes</span>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {isLoading && branches.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">Cargando sedes...</div>
                    ) : filtered.length === 0 ? (
                        <div className="p-12 text-center text-gray-400 text-sm flex flex-col items-center">
                            <Building2 size={36} className="mx-auto mb-3 opacity-30" />
                            <p className="font-medium text-gray-500">No hay sedes registradas</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                <tr>
                                    <th className="py-3 px-4 w-16">ID</th>
                                    <th className="py-3 px-4">Nombre</th>
                                    <th className="py-3 px-4">Dirección</th>
                                    <th className="py-3 px-4">Estado</th>
                                    <th className="py-3 px-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {filtered.map(b => (
                                    <tr key={b.id} className="hover:bg-indigo-50/20 transition">
                                        <td className="py-3 px-4 text-gray-500 font-mono">#{b.id}</td>
                                        <td className="py-3 px-4 font-bold text-gray-800">{b.name}</td>
                                        <td className="py-3 px-4 text-gray-600 truncate max-w-[200px]" title={b.address || 'N/A'}>{b.address || <span className="text-gray-400 italic">Sin dirección registrada</span>}</td>
                                        <td className="py-3 px-4">
                                            {b.is_active ?
                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded font-bold text-xs flex w-max items-center gap-1"><CheckCircle size={12} /> Operativa</span> :
                                                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded font-bold text-xs flex w-max items-center gap-1"><XCircle size={12} /> Clausurada</span>
                                            }
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <button onClick={() => setEditBranch(b)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Editar Sede">
                                                <Edit2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {showNew && <BranchModal onClose={() => setShowNew(false)} />}
            {editBranch && <BranchModal branch={editBranch} onClose={() => setEditBranch(null)} />}
        </div>
    );
};

export default BranchesPage;
