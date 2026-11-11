import React, { useEffect, useState } from 'react';
import { useConfigurationStore } from '../hooks/useConfigurationStore';
import type { Role } from '../types';
import {
    Shield, Search, Edit2, Plus, Trash2, X, Check,
    Lock, Info, AlertCircle
} from 'lucide-react';

const MODULES = [
    { id: 'crm', label: 'CRM / Ventas', description: 'Acceso a pipelines, prospectos y oportunidades.' },
    { id: 'operative', label: 'Operativa', description: 'Gestión de clientes, salas, oficinas y membresías.' },
    { id: 'financial', label: 'Finanzas', description: 'Control de órdenes, pagos, caja y gastos.' },
    { id: 'configuration', label: 'Gestión / Configuración', description: 'Administración de usuarios, sedes y roles.' },
];

const FINANCIAL_SUB_MODULES = [
    { id: 'financial_dashboard', label: 'Dashboard / KPIs', slug: 'dashboard' },
    { id: 'financial_orders', label: 'Órdenes / Ventas', slug: 'orders' },
    { id: 'financial_products', label: 'Productos', slug: 'products' },
    { id: 'financial_services', label: 'Servicios', slug: 'services' },
    { id: 'financial_consumables', label: 'Consumibles', slug: 'consumables' },
    { id: 'financial_receivables', label: 'Cuentas por Cobrar', slug: 'cuentas-por-cobrar' },
    { id: 'financial_cashflow', label: 'Flujo de Caja', slug: 'caja' },
    { id: 'financial_purchases', label: 'Compras', slug: 'purchases' },
    { id: 'financial_vendors', label: 'Proveedores', slug: 'proveedores' },
    { id: 'financial_payables', label: 'Cuentas por Pagar', slug: 'cuentas-por-pagar' },
    { id: 'financial_expenses', label: 'Gastos', slug: 'expenses' },
    { id: 'financial_billing', label: 'Estado de Cuenta', slug: 'billing' },
];

const OPERATIVE_SUB_MODULES = [
    { id: 'operative_clients', label: 'Clientes', slug: 'clients' },
    { id: 'operative_espacios', label: 'Espacios', slug: 'espacios' },
    { id: 'operative_rooms', label: 'Salas', slug: 'rooms' },
    { id: 'operative_bookings', label: 'Reservas', slug: 'bookings' },
    { id: 'operative_memberships', label: 'Membresías', slug: 'memberships' },
];

const RoleModal: React.FC<{ role?: Role | null, onClose: () => void }> = ({ role, onClose }) => {
    const { createRole, updateRole, isLoading, error, clearError } = useConfigurationStore();
    const [name, setName] = useState(role?.name || '');
    const [permissions, setPermissions] = useState<Record<string, boolean>>({
        crm: false, operative: false, financial: false, configuration: false,
        ...(role?.permissions_json || {})
    });

    const handleToggle = (mod: string) => {
        const newVal = !permissions[mod];
        setPermissions(prev => {
            const updated = { ...prev, [mod]: newVal };
            // If turning on main modules, turn on all sub-modules
            if (mod === 'financial' && newVal) {
                FINANCIAL_SUB_MODULES.forEach(sub => { updated[sub.id] = true; });
            }
            if (mod === 'operative' && newVal) {
                OPERATIVE_SUB_MODULES.forEach(sub => { updated[sub.id] = true; });
            }
            // If turning off main modules, turn off all sub-modules
            if (mod === 'financial' && !newVal) {
                FINANCIAL_SUB_MODULES.forEach(sub => { updated[sub.id] = false; });
            }
            if (mod === 'operative' && !newVal) {
                OPERATIVE_SUB_MODULES.forEach(sub => { updated[sub.id] = false; });
            }
            return updated;
        });
    };

    const handleSubToggle = (subId: string) => {
        setPermissions(prev => {
            const updated = { ...prev, [subId]: !prev[subId] };
            // If at least one sub-module is active, but main is not, keep main false (partial)
            // But if ALL are active, maybe set main to true? 
            // For now, let's keep it simple: main is either full access or no access.
            // If any sub-module is toggled manually, main should usually be false unless all are on.
            return updated;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let success = false;
        if (role) {
            success = await updateRole(role.id, { name, permissions_json: permissions });
        } else {
            success = await createRole({ name, permissions_json: permissions });
        }
        if (success) onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden">
                <div className={`px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r ${role ? 'from-slate-700 to-slate-800' : 'from-indigo-600 to-indigo-700'}`}>
                    <h2 className="font-bold text-white text-lg flex items-center gap-2">
                        {role ? <Edit2 size={18} /> : <Plus size={18} />}
                        {role ? 'Editar Rol' : 'Nuevo Rol de Usuario'}
                    </h2>
                    <button type="button" onClick={onClose} className="text-white/70 hover:text-white p-1 rounded-full transition"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2"><AlertCircle size={14} /> {error}</div>}

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nombre del Rol</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ej. Recepcionista, Supervisor..."
                            className="w-full px-4 py-2.5 text-sm border-2 border-gray-100 rounded-xl outline-none focus:border-indigo-500 transition"
                        />
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Permisos de Módulos</label>
                            <div className="group relative">
                                <Info size={14} className="text-gray-400 cursor-help" />
                                <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-gray-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 shadow-xl font-medium">
                                    Define a qué secciones del sistema tendrá acceso este rol por defecto al crear nuevos usuarios.
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {MODULES.map(mod => (
                                <div key={mod.id} className="space-y-2">
                                    <div
                                        onClick={() => handleToggle(mod.id)}
                                        className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${permissions[mod.id] ? 'border-indigo-100 bg-indigo-50/50 shadow-sm' : 'border-gray-50 bg-gray-50/30'}`}
                                    >
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-bold ${permissions[mod.id] ? 'text-indigo-900' : 'text-gray-700'}`}>{mod.label}</span>
                                            <span className="text-[10px] text-gray-500 mt-0.5">{mod.description}</span>
                                        </div>
                                        <div className={`w-10 h-6 rounded-full relative transition-colors ${permissions[mod.id] ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${permissions[mod.id] ? 'left-5' : 'left-1'}`} />
                                        </div>
                                    </div>

                                    {/* Sub-modules for Financial */}
                                    {mod.id === 'financial' && (
                                        <div className="pl-4 pr-1 py-1 grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-1">
                                            {FINANCIAL_SUB_MODULES.map(sub => (
                                                <div
                                                    key={sub.id}
                                                    onClick={(e) => { e.stopPropagation(); handleSubToggle(sub.id); }}
                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${permissions[sub.id] ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-100 text-gray-400 opacity-60'}`}
                                                >
                                                    <div className={`w-3 h-3 rounded-sm border flex items-center justify-center transition-colors ${permissions[sub.id] ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300'}`}>
                                                        {permissions[sub.id] && <Check size={8} className="text-white" />}
                                                    </div>
                                                    <span className="text-[10px] font-bold">{sub.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Sub-modules for Operative */}
                                    {mod.id === 'operative' && (
                                        <div className="pl-4 pr-1 py-1 grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-1">
                                            {OPERATIVE_SUB_MODULES.map(sub => (
                                                <div
                                                    key={sub.id}
                                                    onClick={(e) => { e.stopPropagation(); handleSubToggle(sub.id); }}
                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${permissions[sub.id] ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-100 text-gray-400 opacity-60'}`}
                                                >
                                                    <div className={`w-3 h-3 rounded-sm border flex items-center justify-center transition-colors ${permissions[sub.id] ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300'}`}>
                                                        {permissions[sub.id] && <Check size={8} className="text-white" />}
                                                    </div>
                                                    <span className="text-[10px] font-bold">{sub.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2 border-t mt-6">
                        <button type="button" onClick={() => { clearError(); onClose(); }} className="px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl text-sm font-bold transition">Cancelar</button>
                        <button disabled={isLoading || !name} type="submit"
                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-bold disabled:opacity-50 shadow-md shadow-indigo-200 transition-all flex items-center gap-2">
                            {isLoading ? 'Guardando...' : (role ? 'Actualizar Rol' : 'Crear Rol')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const RolesPage: React.FC = () => {
    const { roles, fetchRoles, deleteRole, isLoading, error, clearError } = useConfigurationStore();
    const [search, setSearch] = useState('');
    const [selectedRole, setSelectedRole] = useState<Role | null | 'new'>(null);
    const [confirmDelete, setConfirmDelete] = useState<Role | null>(null);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    const filtered = roles.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

    const handleDelete = async () => {
        if (!confirmDelete) return;
        const success = await deleteRole(confirmDelete.id);
        if (success) setConfirmDelete(null);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50 overflow-auto">
            {/* Header */}
            <div className="bg-white px-8 py-6 border-b border-slate-100 shrink-0">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                            <Lock className="text-indigo-600" /> Roles y Permisos
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Configura los perfiles de acceso para los usuarios del sistema.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => { clearError(); setSelectedRole('new'); }}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl hover:bg-indigo-700 transition font-black text-sm shadow-lg shadow-indigo-100"
                    >
                        <Plus size={18} /> Nuevo Rol
                    </button>
                </div>
            </div>

            <div className="p-8">
                <div className="flex flex-col gap-6">
                    {/* Search & Feedback */}
                    <div className="flex items-center justify-between">
                        <div className="relative max-w-sm w-full">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar rol por nombre..."
                                className="w-full pl-12 pr-4 py-3 border-2 border-white rounded-2xl text-sm bg-white shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                            />
                        </div>
                        {error && (
                            <div className="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 animate-pulse flex items-center gap-2">
                                <AlertCircle size={14} /> {error}
                                <button type="button" onClick={clearError} className="p-1 hover:bg-red-100 rounded-full transition"><X size={12} /></button>
                            </div>
                        )}
                    </div>

                    {/* Roles Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {isLoading && roles.length === 0 ? (
                            Array(3).fill(0).map((_, i) => (
                                <div key={i} className="h-64 bg-white rounded-2xl border-2 border-white p-6 animate-pulse shadow-sm">
                                    <div className="h-6 w-1/2 bg-slate-100 rounded-lg mb-4" />
                                    <div className="h-32 bg-slate-50 rounded-lg mb-4" />
                                    <div className="h-8 w-1/4 bg-slate-100 rounded-lg self-end" />
                                </div>
                            ))
                        ) : filtered.length === 0 ? (
                            <div className="col-span-full py-20 text-center">
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white shadow-sm">
                                    <Shield size={32} className="text-slate-300" />
                                </div>
                                <h3 className="text-slate-800 font-black text-lg">No se encontraron roles</h3>
                                <p className="text-slate-500 text-sm max-w-xs mx-auto mt-2">Prueba con otro término de búsqueda o crea un nuevo rol administrativo.</p>
                            </div>
                        ) : (
                            filtered.map(role => (
                                <div key={role.id} className="bg-white rounded-3xl border-2 border-white p-7 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            type="button"
                                            onClick={() => { clearError(); setSelectedRole(role); }}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setConfirmDelete(role)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="bg-indigo-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-5 border border-indigo-100">
                                        <Shield size={22} className="text-indigo-600" />
                                    </div>

                                    <h3 className="font-black text-xl text-slate-800 mb-4">{role.name}</h3>

                                    <div className="space-y-3 flex-1 mb-6">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Permisos de Acceso</p>
                                        <div className="flex flex-wrap gap-2">
                                            {MODULES.map(m => (
                                                <span
                                                    key={m.id}
                                                    className={`px-3 py-1 rounded-full text-[10px] font-black border transition-colors ${role.permissions_json?.[m.id]
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                        : 'bg-slate-50 text-slate-400 border-slate-100 opacity-60'}`}
                                                >
                                                    {m.label}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-5 border-t border-slate-50 flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-400">ID: #{role.id}</span>
                                        <button
                                            type="button"
                                            onClick={() => { clearError(); setSelectedRole(role); }}
                                            className="text-indigo-600 text-xs font-black uppercase tracking-wider hover:underline"
                                        >
                                            Configurar
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {selectedRole && (
                <RoleModal
                    role={selectedRole === 'new' ? null : selectedRole}
                    onClose={() => setSelectedRole(null)}
                />
            )}

            {/* Delete Confirmation */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm z-10 p-8 text-center border border-slate-100 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500" />
                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Trash2 size={28} className="text-red-500" />
                        </div>
                        <h3 className="font-black text-slate-800 text-2xl mb-2">¿Eliminar Rol?</h3>
                        <p className="text-slate-500 text-sm mb-6 px-4">Si el rol <span className="font-bold text-slate-800">{confirmDelete.name}</span> está asignado a usuarios existentes, la eliminación fallará.</p>

                        <div className="flex flex-col gap-3">
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isLoading}
                                className="w-full py-3.5 bg-red-600 text-white hover:bg-red-700 rounded-2xl font-black text-sm transition-all disabled:opacity-50"
                            >
                                {isLoading ? 'Eliminando...' : 'Sí, Eliminar Rol'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirmDelete(null)}
                                className="w-full py-3.5 text-slate-500 hover:bg-slate-50 rounded-2xl font-bold text-sm transition-all"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RolesPage;
