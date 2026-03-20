import React, { useMemo, useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/hooks/useAuthStore';
import { useConfigurationStore } from '../../features/configuration/hooks/useConfigurationStore';
import {
    LayoutDashboard, Users, LayoutGrid, DoorOpen, CalendarDays,
    TrendingUp, LogOut, Landmark, ShoppingBag, Wallet, Receipt,
    Users2, FileText, Shield, Building2, Package, Sparkles, SprayCan, BookOpen, Bell, Activity, Lock, BarChart, Settings, FileBarChart2
} from 'lucide-react';
import { useSystemStore } from '../../features/system/hooks/useSystemStore';

// Helper: get initials from email
const getInitials = (email: string) => email.substring(0, 2).toUpperCase();


export const MainLayout: React.FC = () => {
    const { user, logout, selectedBranchId, setSelectedBranchId } = useAuthStore();
    const { branches, fetchBranches } = useConfigurationStore();
    const navigate = useNavigate();

    const [showNotifications, setShowNotifications] = useState(false);
    const { notifications, fetchNotifications, markAsRead } = useSystemStore();

    useEffect(() => {
        if (branches.length === 0) fetchBranches();
    }, [fetchBranches, branches.length]);

    useEffect(() => {
        if (user) fetchNotifications();
    }, [user, fetchNotifications]);

    // Set initial branch based on user profile if not selected yet
    React.useEffect(() => {
        if (user && selectedBranchId === null) {
            setSelectedBranchId(user.branch_id ?? null);
        }
    }, [user, selectedBranchId, setSelectedBranchId]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Detect branch color for theming - fallback to indigo
    const activeBranch = branches.find(b => b.id === selectedBranchId);
    const themeColor = activeBranch?.color || (user as any)?.branch?.color || '#4F46E5';

    const roleName = (user as any)?.role?.name ?? (user?.is_superuser ? 'Super Admin' : 'Usuario');
    const branchName = (user as any)?.branch?.name ?? null;

    const canSelectBranch = user?.is_superuser || roleName === 'Gerente' || roleName === 'Ventas';

    React.useEffect(() => {
        const hex = themeColor.replace('#', '');
        if (hex.length === 6) {
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            const rgb = `${r} ${g} ${b}`;
            const root = document.documentElement;
            root.style.setProperty('--color-primary', themeColor);
            root.style.setProperty('--color-primary-rgb', rgb);
        }
    }, [themeColor]);

    const navGroups = [
        {
            label: 'General',
            module: null,
            items: [
                { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
            ],
        },
        {
            label: 'Gerencia',
            module: 'management',
            items: [
                { to: '/gerencia', icon: BarChart, label: 'Inteligencia de Negocios' },
            ],
        },
        {
            label: 'Reportes',
            module: 'reports',
            items: [
                { to: '/reportes', icon: FileBarChart2, label: 'Reportes PDF' },
            ],
        },
        {
            label: 'CRM',
            module: 'crm',
            items: [
                { to: '/pipeline', icon: TrendingUp, label: 'Pipeline de Ventas' },
                { to: '/prospectos', icon: Users2, label: 'Prospectos' },
                { to: '/presupuestos', icon: FileText, label: 'Presupuestos' },
            ],
        },
        {
            label: 'Operativo',
            module: 'operative',
            items: [
                { to: '/clients', icon: Users, label: 'Clientes' },
                { to: '/espacios', icon: LayoutGrid, label: 'Espacios' },
                { to: '/rooms', icon: DoorOpen, label: 'Salas' },
                { to: '/bookings', icon: CalendarDays, label: 'Reservas' },
                { to: '/memberships', icon: BookOpen, label: 'Membresías' },
            ],
        },
        {
            label: 'Finanzas',
            module: 'financial',
            items: [
                { to: '/dashboard', icon: Activity, label: 'Dashboard / KPIs' },
                { to: '/products', icon: Package, label: 'Productos' },
                { to: '/services', icon: Sparkles, label: 'Servicios' },
                { to: '/consumables', icon: SprayCan, label: 'Consumibles' },
                { to: '/orders', icon: Landmark, label: 'Órdenes / Ventas' },
                { to: '/cuentas-por-cobrar', icon: Users, label: 'Cuentas por Cobrar' },
                { to: '/caja', icon: Wallet, label: 'Flujo de Caja' },
                { to: '/purchases', icon: ShoppingBag, label: 'Compras' },
                { to: '/proveedores', icon: Users, label: 'Proveedores' },
                { to: '/cuentas-por-pagar', icon: Wallet, label: 'Cuentas por Pagar' },
                { to: '/expenses', icon: Receipt, label: 'Gastos' },
                { to: '/billing', icon: FileText, label: 'Estado de Cuenta' },
            ],
        },
        {
            label: 'Gestión',
            module: 'configuration',
            items: [
                { to: '/users', icon: Shield, label: 'Usuarios y Accesos' },
                { to: '/roles', icon: Lock, label: 'Gestionar Roles' },
                { to: '/branches', icon: Building2, label: 'Sedes y Sucursales' },
                { to: '/catalogos', icon: Settings, label: 'Catálogos' },
            ],
        },
    ];

    // Operator role has limited financial access (only orders & billing)
    const filteredNavGroups = useMemo(() => {
        return navGroups.map(group => {
            if (group.module === null) return group; // General always shown
            if (!user) return { ...group, items: [] };
            if (user.is_superuser) return group;

            const perms = user.access_permissions ?? {};
            
            // Special handling for management module
            if (group.module === 'management') {
                const isManager = roleName === 'Gerente' || roleName === 'Super Admin' || user.is_superuser;
                return isManager ? group : { ...group, items: [] };
            }

            // Reports module is visible to all authenticated users (content filtered inside page)
            if (group.module === 'reports') {
                return group;
            }

            const hasAccess = !!perms[group.module];

            if (!hasAccess) return { ...group, items: [] };

            // Granular filtering for financial module
            if (group.module === 'financial' && !perms['financial']) {
                // If main financial toggle is off, but module has access, check sub-permissions
                return {
                    ...group,
                    items: group.items.filter(item => {
                        // Extract slug from URL (e.g. /products -> products)
                        const slug = item.to.replace('/', '');
                        // Map special cases or use exact slug
                        const permKey = `financial_${slug === '' ? 'dashboard' : slug}`;
                        return !!perms[permKey];
                    }),
                };
            }

            // Legacy Operator: limited financial access (if no granular perms set)
            if (group.module === 'financial' && roleName === 'Operador' && perms['financial']) {
                // If main is ON, we usually show everything, but keep legacy operator restriction 
                // as a fallback or if no sub-perms are defined.
                // Actually, if main is ON, it's better to show all unless we want to keep it.
                // Let's prioritize granular perms if any are present.
                const hasAnySubPerms = Object.keys(perms).some(k => k.startsWith('financial_') && perms[k]);
                if (!hasAnySubPerms) {
                    return {
                        ...group,
                        items: group.items.filter(i => i.to === '/orders' || i.to === '/billing'),
                    };
                }
            }

            return group;
        }).filter(g => g.items.length > 0);
    }, [user, roleName]);

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-20 shrink-0 hidden md:flex">

                {/* Logo + Branch Color Accent */}
                <div className="h-16 flex items-center px-5 border-b border-slate-700 shrink-0" style={{ borderLeftColor: themeColor, borderLeftWidth: 4 }}>
                    <div className="w-10 h-10 flex items-center justify-center mr-2 shrink-0 overflow-hidden relative">
                        <img 
                            src="/src/assets/nest-logo.png" 
                            alt="Logo" 
                            className="w-full h-full object-contain z-10 relative" 
                            onLoad={(e) => {
                                const fallback = e.currentTarget.parentElement?.querySelector('.logo-fallback') as HTMLElement;
                                if (fallback) fallback.style.display = 'none';
                            }}
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.parentElement?.querySelector('.logo-fallback') as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                            }} 
                        />
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-lg text-sm logo-fallback absolute inset-0 m-auto"
                            style={{ backgroundColor: themeColor }}>
                            N
                        </div>
                    </div>
                    <div className="truncate">
                        <span className="text-sm font-bold tracking-wide text-white">Nest Coworking</span>
                        {branchName && (
                            <p className="text-[10px] font-bold truncate" style={{ color: themeColor }}>{branchName}</p>
                        )}
                    </div>
                </div>

                {/* Branch + User Header */}
                {branchName && (
                    <div className="px-4 py-2 bg-slate-800/70 border-b border-slate-700 shrink-0">
                        <div className="flex items-center gap-1.5">
                            <Building2 size={11} className="text-slate-400 shrink-0" />
                            <span className="text-[11px] font-bold text-slate-300 truncate">{branchName}</span>
                            <span className="text-slate-600 mx-0.5">·</span>
                            <span className="text-[11px] font-bold truncate" style={{ color: themeColor }}>{roleName}</span>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
                    {filteredNavGroups.map((group) => (
                        <div key={group.label}>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-1">{group.label}</p>
                            <div className="space-y-0.5">
                                {group.items.map((item) => (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        end={(item as any).end}
                                        className={({ isActive }) =>
                                            `flex items-center px-3 py-2.5 rounded-lg transition-all group text-sm ${isActive
                                                ? 'font-semibold text-white'
                                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                            }`
                                        }
                                        style={({ isActive }) => isActive ? { backgroundColor: `${themeColor}30`, color: 'white' } : {}}
                                    >
                                        <item.icon className="w-4 h-4 mr-3 shrink-0" />
                                        {item.label}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* User Card */}
                <div className="p-4 bg-slate-800 border-t border-slate-700 shrink-0">
                    <div className="flex items-center justify-between gap-1 overflow-visible">
                        <div className="flex items-center min-w-0">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-md shrink-0 text-white"
                                style={{ backgroundColor: themeColor }}>
                                {user?.email ? getInitials(user.email) : 'U'}
                            </div>
                            <div className="ml-2 truncate hidden lg:block">
                                <p className="text-sm font-bold text-white truncate">{roleName}</p>
                                <p className="text-[11px] text-slate-400 truncate">{user?.email ?? 'user@nestcoworking.com'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-0.5 shrink-0">
                            <div className="relative">
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-md relative"
                                    title="Notificaciones"
                                >
                                    <Bell size={18} />
                                    {notifications.filter(n => !n.is_read).length > 0 && (
                                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                    )}
                                </button>
                                {showNotifications && (
                                    <div className="absolute bottom-2 left-full ml-5 w-80 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border border-gray-100 overflow-hidden z-[100] text-left animate-in fade-in slide-in-from-left-2 duration-200">
                                        {/* CSS Triangle pointing left */}
                                        <div className="absolute top-auto bottom-5 -left-2 w-4 h-4 bg-white border-l border-b border-gray-100 transform rotate-45"></div>

                                        <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center justify-between">
                                            <span className="text-sm font-bold text-gray-800">Notificaciones</span>
                                            {notifications.filter(n => !n.is_read).length > 0 && (
                                                <span className="bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full text-[10px] font-bold">
                                                    {notifications.filter(n => !n.is_read).length} nuevas
                                                </span>
                                            )}
                                        </div>
                                        <div className="max-h-64 overflow-y-auto bg-slate-50/50">
                                            {notifications.length === 0 ? (
                                                <p className="p-4 text-xs text-gray-500 text-center">No hay notificaciones</p>
                                            ) : (
                                                notifications.map(n => (
                                                    <div key={n.id} onClick={() => { if (!n.is_read) markAsRead(n.id) }} className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-blue-50/50' : ''}`}>
                                                        <div className="flex justify-between items-start mb-1">
                                                            <h4 className={`text-xs ${!n.is_read ? 'font-bold text-gray-800' : 'font-medium text-gray-600'}`}>{n.title}</h4>
                                                            {n.is_read && <span className="text-[10px] text-gray-400">Leído</span>}
                                                        </div>
                                                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{n.message}</p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleLogout}
                                className="text-slate-400 hover:text-red-400 transition-colors p-1.5 rounded-md"
                                title="Cerrar Sesión"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-white">
                {/* Top bar: Sede - Usuario visible on mobile/tablet */}
                <header className="h-12 bg-white border-b px-4 flex items-center justify-between md:hidden shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 flex items-center justify-center overflow-hidden">
                            <img src="/src/assets/nest-logo.png" alt="N" className="w-full h-full object-contain" />
                        </div>
                        {branchName && <span className="font-bold text-sm text-gray-700">{branchName}</span>}
                        <span className="text-gray-300">·</span>
                        <span className="font-medium text-sm text-gray-600">{user?.email}</span>
                    </div>
                    <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 p-1"><LogOut size={16} /></button>
                </header>

                {/* Page header with Sede info for all users */}
                <div className="hidden md:flex items-center justify-end px-6 py-2 bg-white border-b shrink-0" style={{ borderTopColor: themeColor, borderTopWidth: 2 }}>
                    <div className="flex items-center gap-3 text-sm">

                        {canSelectBranch ? (
                            <div className="flex items-center gap-1.5 border border-gray-200 rounded px-2 py-0.5 bg-gray-50">
                                <Building2 size={13} className="text-gray-400" />
                                <select
                                    className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer"
                                    value={selectedBranchId ?? 0}
                                    onChange={(e) => setSelectedBranchId(Number(e.target.value))}
                                >
                                    <option value={0}>Todas las sedes</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                        ) : branchName && (
                            <div className="flex items-center gap-1.5">
                                <Building2 size={14} className="text-gray-400" />
                                <span className="font-bold text-gray-800">{branchName}</span>
                            </div>
                        )}
                        {(canSelectBranch || branchName) && <span className="text-gray-300">|</span>}

                        <span className="font-semibold" style={{ color: themeColor }}>{roleName}</span>
                        <span className="text-gray-500">·</span>
                        <span className="text-gray-600 font-medium">{user?.email}</span>
                    </div>
                </div>

                <Outlet />
            </div>
        </div>
    );
};
