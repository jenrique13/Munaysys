import React, { useEffect, useState } from 'react';
import { useConfigurationStore } from '../hooks/useConfigurationStore';
import type { User, UserConfigUpdate } from '../types';
import {
    Shield, Search, Edit2, Key, Check, X, UserPlus, Trash2,
    ToggleLeft, ToggleRight, ChevronDown
} from 'lucide-react';

// Role permissions presets
const ROLE_PERMISSIONS: Record<string, Record<string, boolean>> = {
    'Operador': { crm: false, operative: true, financial_limited: true, financial: false, configuration: false },
    'Coordinador': { crm: false, operative: true, financial: true, configuration: false },
    'Ventas': { crm: true, operative: false, financial: false, configuration: false },
    'Gerente': { crm: true, operative: true, financial: true, configuration: true },
};

const MODULES = [
    { id: 'crm', label: 'CRM / Ventas' },
    { id: 'operative', label: 'Operativa' },
    { id: 'financial', label: 'Finanzas' },
    { id: 'configuration', label: 'Configuración (Gestión)' },
];

// ── CREATE USER MODAL ────────────────────────────────────────────────────────
const CreateUserModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { createUser, updateUser, roles, branches, isLoading, error } = useConfigurationStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedBranch, setSelectedBranch] = useState<number | ''>('');
    const [permissions, setPermissions] = useState<Record<string, boolean>>({
        crm: false, operative: false, financial: false, configuration: false
    });

    const handleRoleChange = (roleName: string) => {
        setSelectedRole(roleName);
        const preset = ROLE_PERMISSIONS[roleName];
        if (preset) {
            setPermissions({
                crm: !!preset.crm,
                operative: !!preset.operative,
                financial: !!preset.financial,
                configuration: !!preset.configuration,
            });
        }
    };

    const handleToggle = (mod: string) => {
        setPermissions(prev => ({ ...prev, [mod]: !prev[mod] }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const roleObj = roles.find(r => r.name === selectedRole);
        const createdOk = await createUser({ email, password });
        if (createdOk) {
            // Refresh to get new user id, then update their role/branch/permissions
            const users = useConfigurationStore.getState().users;
            const newUser = users.find(u => u.email === email);
            if (newUser) {
                await updateUser(newUser.id, {
                    role_id: roleObj?.id,
                    branch_id: selectedBranch !== '' ? selectedBranch : undefined,
                    access_permissions: permissions,
                });
            }
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-indigo-600 to-indigo-700">
                    <h2 className="font-bold text-white text-lg flex items-center gap-2">
                        <UserPlus size={18} /> Nuevo Usuario
                    </h2>
                    <button onClick={onClose} className="text-indigo-200 hover:text-white p-1 rounded-full transition"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Correo Electrónico</label>
                            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="usuario@nestcoworking.com" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Contraseña Inicial</label>
                            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                                className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="••••••••" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Tipo de Usuario</label>
                            <div className="relative">
                                <select value={selectedRole} onChange={e => handleRoleChange(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 appearance-none pr-8 bg-white">
                                    <option value="">-- Seleccionar Rol --</option>
                                    {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Sede</label>
                            <div className="relative">
                                <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value !== '' ? Number(e.target.value) : '')}
                                    className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 appearance-none pr-8 bg-white">
                                    <option value="">-- Sin Sede --</option>
                                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {selectedRole && (
                        <div className="border rounded-xl p-4 bg-indigo-50/50">
                            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Acceso a Módulos</h3>
                            <div className="space-y-2">
                                {MODULES.map(mod => (
                                    <div key={mod.id} className="flex items-center justify-between">
                                        <span className="text-sm text-gray-700">{mod.label}</span>
                                        <button type="button" onClick={() => handleToggle(mod.id)}
                                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold transition-colors ${permissions[mod.id] ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {permissions[mod.id] ? <Check size={10} /> : <X size={10} />}
                                            {permissions[mod.id] ? 'Habilitado' : 'Deshabilitado'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-indigo-500 mt-2">Los permisos fueron pre-configurados según el rol seleccionado.</p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium">Cancelar</button>
                        <button disabled={isLoading || !email || !password} type="submit"
                            className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-semibold disabled:opacity-50 flex items-center gap-2">
                            {isLoading ? 'Creando...' : <><UserPlus size={14} /> Crear Usuario</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── EDIT USER MODAL ──────────────────────────────────────────────────────────
const EditUserModal: React.FC<{ user: User; onClose: () => void }> = ({ user, onClose }) => {
    const { updateUser, roles, branches, isLoading } = useConfigurationStore();
    const [isActive, setIsActive] = useState(user.is_active);
    const [permissions, setPermissions] = useState<Record<string, boolean>>({
        crm: false, operative: false, financial: false, configuration: false,
        ...(user.access_permissions || {})
    });
    const [selectedRole, setSelectedRole] = useState<number | ''>(user.role_id ?? '');
    const [selectedBranch, setSelectedBranch] = useState<number | ''>(user.branch_id ?? '');
    const [password, setPassword] = useState('');

    const handleRoleChange = (roleId: number | '') => {
        setSelectedRole(roleId);
        const role = roles.find(r => r.id === roleId);
        if (role) {
            const preset = ROLE_PERMISSIONS[role.name];
            if (preset) {
                setPermissions({
                    crm: !!preset.crm,
                    operative: !!preset.operative,
                    financial: !!preset.financial,
                    configuration: !!preset.configuration,
                });
            }
        }
    };

    const handleToggle = (mod: string) => {
        setPermissions(prev => ({ ...prev, [mod]: !prev[mod] }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data: UserConfigUpdate = {
            is_active: isActive,
            access_permissions: permissions,
            role_id: selectedRole !== '' ? selectedRole : undefined,
            branch_id: selectedBranch !== '' ? selectedBranch : undefined,
        };
        if (password.trim()) { data.password = password.trim(); }
        const ok = await updateUser(user.id, data);
        if (ok) onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-slate-700 to-slate-800">
                    <h2 className="font-bold text-white text-lg flex items-center gap-2">
                        <Shield size={18} /> Editar Usuario
                    </h2>
                    <button onClick={onClose} className="text-slate-300 hover:text-white p-1 rounded-full transition"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                    <div className="bg-gray-50 rounded-xl p-4 border">
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Usuario</p>
                        <p className="font-semibold text-gray-800">{user.email}</p>
                        {user.is_superuser && <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded">Superusuario</span>}
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border">
                        <div>
                            <p className="text-sm font-semibold text-gray-800">Estado de Cuenta</p>
                            <p className="text-xs text-gray-500">{isActive ? 'El usuario puede iniciar sesión' : 'Acceso bloqueado'}</p>
                        </div>
                        <button type="button" onClick={() => setIsActive(!isActive)} disabled={user.is_superuser}
                            className={`transition-colors ${isActive ? 'text-emerald-500' : 'text-gray-300'} disabled:opacity-50`}>
                            {isActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                        </button>
                    </div>

                    {/* Role & Branch */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Tipo de Usuario</label>
                            <div className="relative">
                                <select value={selectedRole} onChange={e => handleRoleChange(e.target.value !== '' ? Number(e.target.value) : '')}
                                    className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 appearance-none pr-8 bg-white">
                                    <option value="">-- Sin Rol --</option>
                                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Sede</label>
                            <div className="relative">
                                <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value !== '' ? Number(e.target.value) : '')}
                                    className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 appearance-none pr-8 bg-white">
                                    <option value="">-- Sin Sede --</option>
                                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Permissions */}
                    <div className="border rounded-xl p-4 bg-gray-50/50">
                        <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Acceso a Módulos</h3>
                        <div className="space-y-2">
                            {MODULES.map(mod => (
                                <div key={mod.id} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">{mod.label}</span>
                                    <button type="button" onClick={() => handleToggle(mod.id)} disabled={user.is_superuser}
                                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold transition-colors disabled:opacity-50 ${permissions[mod.id] ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {permissions[mod.id] ? <Check size={10} /> : <X size={10} />}
                                        {permissions[mod.id] ? 'Sí' : 'No'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Change Password */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide flex items-center gap-1.5"><Key size={12} /> Nueva Contraseña</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Dejar en blanco para no cambiar"
                            className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>

                    <div className="flex justify-end gap-3 pt-2 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium">Cancelar</button>
                        <button disabled={isLoading} type="submit"
                            className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-semibold disabled:opacity-50">
                            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── MAIN USERS PAGE ──────────────────────────────────────────────────────────
const UsersPage: React.FC = () => {
    const { users, fetchUsers, fetchRoles, fetchBranches, updateUser, deleteUser, isLoading, clearError } = useConfigurationStore();
    const [search, setSearch] = useState('');
    const [editUser, setEditUser] = useState<User | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<User | null>(null);

    useEffect(() => {
        fetchUsers();
        fetchRoles();
        fetchBranches();
    }, []);

    const filtered = users.filter(u => u.email.toLowerCase().includes(search.toLowerCase()));

    const handleToggleActive = async (u: User) => {
        await updateUser(u.id, { is_active: !u.is_active });
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        await deleteUser(confirmDelete.id);
        setConfirmDelete(null);
    };

    const getRoleBadge = (u: User) => {
        if (u.is_superuser) return (
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">Super Admin</span>
        );
        const roleName = u.role?.name ?? (u.role_id ? `Rol #${u.role_id}` : null);
        if (roleName) return (
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">{roleName}</span>
        );
        return <span className="text-xs text-gray-400 italic">Sin rol</span>;
    };

    const getBranchBadge = (u: User) => {
        const branchName = u.branch?.name;
        if (!branchName) return <span className="text-xs text-gray-400 italic">Sin sede</span>;
        const color = u.branch && (u.branch as any).color ? (u.branch as any).color : '#4F46E5';
        return (
            <span className="px-2 py-0.5 text-xs font-bold rounded-full text-white" style={{ backgroundColor: color }}>
                {branchName}
            </span>
        );
    };

    return (
        <div className="flex flex-col h-full bg-gray-50/30">
            {/* Header */}
            <div className="bg-white px-6 py-4 flex justify-between items-center shrink-0 border-b shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Shield size={22} className="text-indigo-600" /> Gestión de Usuarios
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Administra accesos, roles y sedes del equipo.</p>
                </div>
                <button onClick={() => { clearError?.(); setIsCreating(true); }}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition font-semibold text-sm shadow-sm">
                    <UserPlus size={16} /> Nuevo Usuario
                </button>
            </div>

            {/* Stats Bar / Search */}
            <div className="px-6 py-3 bg-white border-b shrink-0 flex items-center justify-between gap-4">
                <div className="relative max-w-sm w-full">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por correo..."
                        className="w-full pl-9 pr-3 py-2 border rounded-xl text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition" />
                </div>
                <div className="flex gap-3 items-center text-sm text-gray-500 shrink-0">
                    <span className="font-medium text-gray-700">{filtered.length}</span> usuarios
                    <span className="text-gray-300">|</span>
                    <span className="font-medium text-emerald-600">{filtered.filter(u => u.is_active).length}</span> activos
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto p-6">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    {isLoading && users.length === 0 ? (
                        <div className="p-16 text-center">
                            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-gray-400 text-sm">Cargando usuarios...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-16 text-center text-gray-400 text-sm">
                            <Shield size={32} className="mx-auto mb-3 text-gray-200" />
                            No se encontraron usuarios.
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b text-xs font-bold text-gray-500 uppercase tracking-wide">
                                <tr>
                                    <th className="py-3 px-5">Usuario</th>
                                    <th className="py-3 px-4">Tipo / Rol</th>
                                    <th className="py-3 px-4">Sede</th>
                                    <th className="py-3 px-4">Módulos</th>
                                    <th className="py-3 px-4 text-center">Estado</th>
                                    <th className="py-3 px-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {filtered.map(u => (
                                    <tr key={u.id} className={`hover:bg-indigo-50/20 transition ${!u.is_active ? 'opacity-50' : ''}`}>
                                        <td className="py-3 px-5">
                                            <div className="font-semibold text-gray-800">{u.email}</div>
                                        </td>
                                        <td className="py-3 px-4">{getRoleBadge(u)}</td>
                                        <td className="py-3 px-4">{getBranchBadge(u)}</td>
                                        <td className="py-3 px-4">
                                            {u.is_superuser ? (
                                                <span className="text-purple-500 font-bold text-xs">Todos</span>
                                            ) : (
                                                <div className="flex gap-1 flex-wrap">
                                                    {MODULES.map(m => u.access_permissions?.[m.id] ? (
                                                        <span key={m.id} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] rounded border border-indigo-100">{m.label}</span>
                                                    ) : null)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {u.is_active ? (
                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold text-xs inline-flex items-center gap-1"><Check size={10} /> Activo</span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-bold text-xs inline-flex items-center gap-1"><X size={10} /> Inactivo</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center justify-end gap-1">
                                                {/* Toggle active */}
                                                <button onClick={() => handleToggleActive(u)} disabled={u.is_superuser}
                                                    title={u.is_active ? 'Desactivar' : 'Activar'}
                                                    className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${u.is_active ? 'text-emerald-500 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-100'}`}>
                                                    {u.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                                </button>
                                                {/* Edit */}
                                                <button onClick={() => setEditUser(u)} title="Editar usuario"
                                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                                    <Edit2 size={15} />
                                                </button>
                                                {/* Delete */}
                                                <button onClick={() => setConfirmDelete(u)} disabled={u.is_superuser} title="Eliminar usuario"
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30">
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
            {isCreating && <CreateUserModal onClose={() => setIsCreating(false)} />}
            {editUser && <EditUserModal user={editUser} onClose={() => setEditUser(null)} />}

            {/* Confirm Delete Dialog */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 p-6 text-center">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Trash2 size={22} className="text-red-600" />
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg mb-1">Eliminar Usuario</h3>
                        <p className="text-gray-500 text-sm mb-1">¿Estás seguro de que deseas eliminar este usuario?</p>
                        <p className="font-medium text-gray-700 text-sm mb-5 bg-gray-50 rounded-lg py-2 px-3">{confirmDelete.email}</p>
                        <p className="text-xs text-red-500 mb-5">Esta acción no se puede deshacer.</p>
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

export default UsersPage;
