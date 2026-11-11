import React, { useEffect, useState } from 'react';
import { useConfigurationStore } from '../hooks/useConfigurationStore';
// import type { User, UserConfigUpdate } from '../types';
import type { User } from '../types';
// import {
//     Globe, Search, Edit2, Key, Check, X, Trash2,
//     ToggleLeft, ToggleRight, UserCheck, UserX, Plus
// } from 'lucide-react';
import {
    Globe, Search, Key, X, Trash2,
    ToggleLeft, ToggleRight, UserCheck, UserX, Plus
} from 'lucide-react';

// ── CREATE CLIENT USER MODAL ──────────────────────────────────────────────────
const CreateClientUserModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { createClientUser, branches, isLoading, error } = useConfigurationStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [selectedBranch, setSelectedBranch] = useState<number | ''>('');
    const [roleName, setRoleName] = useState('Coworker');
    const [localError, setLocalError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');
        if (password !== confirmPassword) {
            setLocalError('Las contraseñas no coinciden.');
            return;
        }
        const ok = await createClientUser({ email, password, role_name: roleName, branch_id: selectedBranch || undefined });
        if (ok) onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-teal-600 to-teal-700">
                    <h2 className="font-bold text-white text-lg flex items-center gap-2">
                        <Globe size={18} /> Nuevo Acceso de Portal
                    </h2>
                    <button onClick={onClose} className="text-teal-200 hover:text-white p-1 rounded-full">
                        <X size={18} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {(error || localError) && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                            {localError || error}
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                            Correo Electrónico del Cliente
                        </label>
                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                            className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="cliente@empresa.com" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Contraseña</label>
                            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                                className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                                placeholder="••••••••" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Confirmar</label>
                            <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                                placeholder="••••••••" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Rol de Portal</label>
                            <div className="px-3 py-2 text-sm border rounded-lg bg-teal-50 text-teal-700 font-semibold">
                                Coworker
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Sede</label>
                            <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value ? Number(e.target.value) : '')}
                                className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                                <option value="">-- Sin Sede --</option>
                                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium">Cancelar</button>
                        <button disabled={isLoading} type="submit"
                            className="px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-semibold disabled:opacity-50 flex items-center gap-2">
                            {isLoading ? 'Creando...' : <><Plus size={14} /> Crear Acceso</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── EDIT PORTAL USER MODAL ────────────────────────────────────────────────────
const EditClientUserModal: React.FC<{ user: User; onClose: () => void }> = ({ user, onClose }) => {
    const { updateClientUser, isLoading } = useConfigurationStore();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');
        if (!password) { setLocalError('Ingresa la nueva contraseña.'); return; }
        if (password !== confirmPassword) { setLocalError('Las contraseñas no coinciden.'); return; }
        const ok = await updateClientUser(user.id, { password });
        if (ok) onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-slate-700 to-slate-800">
                    <h2 className="font-bold text-white text-lg flex items-center gap-2">
                        <Key size={18} /> Cambiar Contraseña
                    </h2>
                    <button onClick={onClose} className="text-slate-300 hover:text-white p-1 rounded-full"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border font-medium">{user.email}</p>
                    {localError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{localError}</div>}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Nueva Contraseña</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                            className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Confirmar Contraseña</label>
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                            className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div className="flex justify-end gap-3 pt-2 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium">Cancelar</button>
                        <button disabled={isLoading} type="submit"
                            className="px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-semibold disabled:opacity-50">
                            {isLoading ? 'Guardando...' : 'Cambiar Contraseña'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── MAIN CLIENT PORTAL PAGE ───────────────────────────────────────────────────
const ClientPortalPage: React.FC = () => {
    const { clientUsers, fetchClientUsers, fetchBranches, updateClientUser, deleteClientUser, isLoading } = useConfigurationStore();
    const [search, setSearch] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<User | null>(null);

    useEffect(() => {
        fetchClientUsers();
        fetchBranches();
    }, []);

    const filtered = clientUsers.filter(u => u.email.toLowerCase().includes(search.toLowerCase()));

    const handleToggleActive = async (u: User) => {
        await updateClientUser(u.id, { is_active: !u.is_active });
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        await deleteClientUser(confirmDelete.id);
        setConfirmDelete(null);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50/30">
            {/* Header */}
            <div className="bg-white px-6 py-4 flex justify-between items-center shrink-0 border-b shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Globe size={22} className="text-teal-600" /> Portal Coworker — Clientes
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Gestiona los accesos de clientes al portal de autoservicio.</p>
                </div>
                <button onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl hover:bg-teal-700 transition font-semibold text-sm shadow-sm">
                    <Plus size={16} /> Nuevo Acceso
                </button>
            </div>

            {/* Stats / Search */}
            <div className="px-6 py-3 bg-white border-b shrink-0 flex items-center justify-between gap-4">
                <div className="relative max-w-sm w-full">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por correo..."
                        className="w-full pl-9 pr-3 py-2 border rounded-xl text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition" />
                </div>
                <div className="flex gap-3 items-center text-sm text-gray-500 shrink-0">
                    <span className="font-medium text-gray-700">{filtered.length}</span> clientes con acceso
                    <span className="text-gray-300">|</span>
                    <span className="font-medium text-emerald-600">{filtered.filter(u => u.is_active).length}</span> activos
                </div>
            </div>

            {/* Info Banner */}
            <div className="mx-6 mt-4 p-3 bg-teal-50 border border-teal-100 rounded-xl text-sm text-teal-700 flex items-start gap-3 shrink-0">
                <Globe size={18} className="shrink-0 mt-0.5 text-teal-500" />
                <div>
                    <p className="font-semibold">Acceso automático al crear membresias</p>
                    <p className="text-teal-600 text-xs mt-0.5">Cuando se crea una nueva membresía, el cliente recibe automáticamente acceso al Portal Coworker con una contraseña temporal. Puedes gestionar y restablecer las contraseñas desde aquí.</p>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto p-6">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    {isLoading && clientUsers.length === 0 ? (
                        <div className="p-16 text-center">
                            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-gray-400 text-sm">Cargando clientes del portal...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-16 text-center text-gray-400 text-sm">
                            <Globe size={36} className="mx-auto mb-3 text-gray-200" />
                            <p>No hay clientes con acceso al portal.</p>
                            <p className="text-xs mt-1">Se crean automáticamente al generar una membresía, o puedes añadirlos manualmente.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b text-xs font-bold text-gray-500 uppercase tracking-wide">
                                <tr>
                                    <th className="py-3 px-5">Correo del Cliente</th>
                                    <th className="py-3 px-4">Rol en Portal</th>
                                    <th className="py-3 px-4">Sede</th>
                                    <th className="py-3 px-4 text-center">Estado</th>
                                    <th className="py-3 px-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {filtered.map(u => (
                                    <tr key={u.id} className={`hover:bg-teal-50/20 transition ${!u.is_active ? 'opacity-50' : ''}`}>
                                        <td className="py-3 px-5">
                                            <div className="font-semibold text-gray-800">{u.email}</div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-bold rounded-full">
                                                {u.role?.name ?? 'Portal'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {u.branch?.name ? (
                                                <span className="px-2 py-0.5 text-xs font-bold rounded-full text-white"
                                                    style={{ backgroundColor: (u.branch as any)?.color || '#0d9488' }}>
                                                    {u.branch.name}
                                                </span>
                                            ) : <span className="text-xs text-gray-400 italic">Sin sede</span>}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {u.is_active ? (
                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold text-xs inline-flex items-center gap-1">
                                                    <UserCheck size={10} /> Activo
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-bold text-xs inline-flex items-center gap-1">
                                                    <UserX size={10} /> Suspendido
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => handleToggleActive(u)}
                                                    title={u.is_active ? 'Suspender acceso' : 'Activar acceso'}
                                                    className={`p-1.5 rounded-lg transition-colors ${u.is_active ? 'text-emerald-500 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-100'}`}>
                                                    {u.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                                </button>
                                                <button onClick={() => setEditUser(u)} title="Cambiar contraseña"
                                                    className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors">
                                                    <Key size={15} />
                                                </button>
                                                <button onClick={() => setConfirmDelete(u)} title="Eliminar acceso"
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modals */}
            {isCreating && <CreateClientUserModal onClose={() => { setIsCreating(false); fetchClientUsers(); }} />}
            {editUser && <EditClientUserModal user={editUser} onClose={() => { setEditUser(null); fetchClientUsers(); }} />}

            {/* Confirm Delete */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 p-6 text-center">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Trash2 size={22} className="text-red-600" />
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg mb-1">Eliminar Acceso</h3>
                        <p className="text-gray-500 text-sm mb-1">¿Eliminar el acceso al portal de este cliente?</p>
                        <p className="font-medium text-gray-700 text-sm mb-5 bg-gray-50 rounded-lg py-2 px-3">{confirmDelete.email}</p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium">Cancelar</button>
                            <button onClick={handleDelete} disabled={isLoading}
                                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-xl text-sm font-semibold disabled:opacity-50">
                                {isLoading ? 'Eliminando...' : 'Sí, Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientPortalPage;
