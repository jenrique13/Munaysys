import React, { useMemo, useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/hooks/useAuthStore';
import { useConfigurationStore } from '../../features/configuration/hooks/useConfigurationStore';
import {
    LayoutDashboard, Users, LayoutGrid, DoorOpen, CalendarDays,
    TrendingUp, LogOut, Landmark, ShoppingBag, Wallet, Receipt,
    Users2, FileText, Shield, Building2, Package, Sparkles, SprayCan, BookOpen, Bell, Activity, Lock, BarChart, Settings, FileBarChart2, Globe, BarChart2, List
} from 'lucide-react';
import { useSystemStore } from '../../features/system/hooks/useSystemStore';
import { X, Info, Menu } from 'lucide-react';
import logo from '../../assets/nest-logo.png';
import { useSessionManager } from '../../features/auth/hooks/useSessionManager';
// Helper: get initials from email
const getInitials = (email: string) => email.substring(0, 2).toUpperCase();


export const MainLayout: React.FC = () => {
    useSessionManager();
    const { user, logout, selectedBranchId, setSelectedBranchId } = useAuthStore();
    const { branches, fetchBranches } = useConfigurationStore();
    const navigate = useNavigate();
    const location = useLocation();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const { notifications, fetchNotifications, markAsRead } = useSystemStore();

    // Cerrar menú móvil al navegar
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (branches.length === 0) fetchBranches();
    }, [fetchBranches, branches.length]);

    const [lastSeenNotifId, setLastSeenNotifId] = useState<number>(0);
    const [activeToasts, setActiveToasts] = useState<any[]>([]);

    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Polling cada 60 segundos
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        }
    }, [user, fetchNotifications]);

    // Detectar nuevas notificaciones para mostrar Toasts
    useEffect(() => {
        if (notifications.length > 0) {
            const unread = notifications.filter(n => !n.is_read);
            const newNotifs = unread.filter(n => n.id > lastSeenNotifId);

            if (newNotifs.length > 0) {
                // Solo mostrar Toasts para notificaciones de tipo "Recordatorio" o similares
                // En este caso, mostraremos todas las nuevas "unread" que lleguen por polling
                setActiveToasts(prev => [...prev, ...newNotifs]);
                const maxId = Math.max(...newNotifs.map(n => n.id));
                setLastSeenNotifId(maxId);
            } else if (unread.length > 0 && lastSeenNotifId === 0) {
                // Inicializar el ID más alto al cargar por primera vez para no mostrar 
                // Toasts de notificaciones viejas al entrar
                const maxId = Math.max(...unread.map(n => n.id));
                setLastSeenNotifId(maxId);
            }
        }
    }, [notifications, lastSeenNotifId]);

    const dismissToast = (id: number) => {
        setActiveToasts(prev => prev.filter(t => t.id !== id));
        markAsRead(id);
    };

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
                { to: '/management-dashboard', icon: LayoutDashboard, label: 'Dashboard Gerencial' },
                { to: '/reportes-gerencia', icon: BarChart2, label: 'Reporte Ejecutivo' },
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
                { to: '/amenity-templates', icon: List, label: 'Plantillas de Amenidades' },
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
                { to: '/client-portal', icon: Globe, label: 'Portal Coworker' },
                { to: '/catalogos', icon: Settings, label: 'Catálogos' },
            ],
        },
    ];

    // Merge direct user permissions with Role permissions
    const filteredNavGroups = useMemo(() => {
        return navGroups.map(group => {
            if (group.module === null) return group; // General always shown
            if (!user) return { ...group, items: [] };
            if (user.is_superuser) return group;

            // Merge: Role permissions + User overrides
            const perms = {
                ...(user.role?.permissions_json || {}),
                ...(user.access_permissions || {})
            };

            // Special handling for management module
            if (group.module === 'management') {
                const isManager = roleName === 'Gerente' || roleName === 'Super Admin' || user.is_superuser;
                return isManager ? group : { ...group, items: [] };
            }

            // Reports module is visible to all authenticated users
            if (group.module === 'reports') return group;

            // Check if user has main access to the group module
            const hasMainAccess = !!perms[group.module];

            // If no main access, we might still have granular sub-module access
            // (especially relevant for 'financial' which has many sub-toggles)
            const visibleItems = group.items.filter(item => {
                const slug = item.to.replace('/', '');
                const permKey = `${group.module}_${slug === '' ? 'dashboard' : slug}`;

                const mapping: Record<string, string> = {
                    // Financial
                    'caja': 'financial_cashflow',
                    'proveedores': 'financial_vendors',
                    'cuentas-por-cobrar': 'financial_receivables',
                    'cuentas-por-pagar': 'financial_payables',
                    'purchases': 'financial_purchases',
                    'orders': 'financial_orders',
                    'billing': 'financial_billing',
                    'dashboard': 'financial_dashboard',
                    // Operative
                    'clients': 'operative_clients',
                    'espacios': 'operative_espacios',
                    'rooms': 'operative_rooms',
                    'bookings': 'operative_bookings',
                    'memberships': 'operative_memberships'
                };

                const finalKey = mapping[slug] || permKey;

                // Si el permiso granular existe explícitamente (true o false), se respeta la granularidad
                if (perms[finalKey] !== undefined) {
                    return !!perms[finalKey];
                }

                // De lo contrario, heredar el permiso de la categoría padre (ej. 'crm', 'configuration')
                let allowed = hasMainAccess;

                // Explicit restriction for amenity-templates
                if (item.to === '/amenity-templates') {
                    const isAllowed = user.is_superuser || roleName === 'Gerente' || roleName === 'Coordinador' || roleName === 'Super Admin';
                    if (!isAllowed) allowed = false;
                }

                return allowed;
            });

            // Special fallback for legacy Operator role
            if (group.module === 'financial' && roleName === 'Operador' && visibleItems.length === 0) {
                return {
                    ...group,
                    items: group.items.filter(i => i.to === '/orders' || i.to === '/billing'),
                };
            }

            return { ...group, items: visibleItems };
        }).filter(g => g.items.length > 0);
    }, [user, roleName]);

    return (
        <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
            {/* Backdrop para móviles */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                bg-slate-900 text-white flex flex-col shadow-xl z-50 shrink-0
                fixed inset-y-0 left-0 w-72 transform md:translate-x-0 md:static md:w-64 md:flex
                transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>

                {/* Logo + Branch Color Accent */}
                <div className="h-16 flex items-center justify-between px-5 border-b border-slate-700 shrink-0" style={{ borderLeftColor: themeColor, borderLeftWidth: 4 }}>
                    <div className="flex items-center min-w-0">
                        <div className="w-10 h-10 flex items-center justify-center mr-2 shrink-0 overflow-hidden relative">
                            <img
                                src={logo}
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
                    {/* Botón de cerrar en móvil */}
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
                        title="Cerrar menú"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Branch selector inside mobile menu */}
                {canSelectBranch && (
                    <div className="px-4 py-2.5 bg-slate-800/50 border-b border-slate-700/50 md:hidden shrink-0">
                        <div className="flex items-center gap-1.5 border border-slate-700 rounded px-2.5 py-1.5 bg-slate-850">
                            <Building2 size={13} className="text-slate-400" />
                            <select
                                className="bg-transparent text-xs font-bold text-slate-200 outline-none cursor-pointer w-full"
                                value={selectedBranchId ?? 0}
                                onChange={(e) => setSelectedBranchId(Number(e.target.value))}
                            >
                                <option value={0} className="bg-slate-900 text-white">Todas las sedes</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id} className="bg-slate-900 text-white">{b.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

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
                            <div className="ml-2 truncate min-w-0">
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
            <div className="flex-1 flex flex-col min-w-0 bg-base relative pb-16 md:pb-0">
                {/* Top bar: Sede - Usuario visible on mobile/tablet */}
                <header className="h-14 bg-white border-b px-4 flex items-center justify-between md:hidden shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 flex items-center justify-center overflow-hidden shrink-0">
                                <img src={logo} alt="N" className="w-full h-full object-contain" />
                            </div>
                            <span className="font-bold text-sm text-gray-800 truncate">
                                {activeBranch ? activeBranch.name : 'Nest Coworking'}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 p-2 rounded-lg transition-colors"><LogOut size={18} /></button>
                    </div>
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

                <div className="flex-1 overflow-y-auto">
                    <Outlet />
                </div>

                {/* Toast Container */}
                <div className="fixed bottom-6 right-6 z-[110] flex flex-col gap-3 pointer-events-none">
                    {activeToasts.map((toast) => (
                        <div
                            key={toast.id}
                            className="bg-white border-l-4 border-blue-600 shadow-2xl rounded-lg p-4 flex items-start gap-3 w-80 pointer-events-auto animate-in slide-in-from-right-10 duration-500"
                        >
                            <div className="bg-blue-100 p-2 rounded-full text-blue-600 shrink-0">
                                <Info size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-gray-900 truncate">{toast.title}</h4>
                                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                                    {toast.message}
                                </p>
                            </div>
                            <button
                                onClick={() => dismissToast(toast.id)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Bottom Navigation para móviles */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-40 pb-safe">
                    <NavLink to="/" end className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-brand-accent' : 'text-gray-500 hover:text-gray-900'}`}>
                        <LayoutDashboard size={20} />
                        <span className="text-[10px] font-medium">Inicio</span>
                    </NavLink>
                    <NavLink to="/orders" className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-brand-accent' : 'text-gray-500 hover:text-gray-900'}`}>
                        <Landmark size={20} />
                        <span className="text-[10px] font-medium">POS</span>
                    </NavLink>
                    <NavLink to="/bookings" className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-brand-accent' : 'text-gray-500 hover:text-gray-900'}`}>
                        <CalendarDays size={20} />
                        <span className="text-[10px] font-medium">Reservas</span>
                    </NavLink>
                    <button onClick={() => setIsMobileMenuOpen(true)} className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-500 hover:text-gray-900">
                        <Menu size={20} />
                        <span className="text-[10px] font-medium">Menú</span>
                    </button>
                </nav>
            </div>
        </div>
    );
};
