
import React, { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CreditCard, CalendarDays, User, LogOut, Building2, Settings } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useClientStore } from '../store/clientStore';

export const ClientLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { profile, fetchProfile, isLoading } = useClientStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading && !profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const themeColor = profile?.id ? '#4f46e5' : '#4f46e5'; // Default for client portal

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-[#0a0f1c] text-slate-300 flex flex-col shadow-2xl border-r border-slate-800/60 hidden md:flex relative z-20">
        <div className="h-24 flex items-center px-8 border-b border-slate-800/60 bg-slate-900/40 relative overflow-hidden" style={{ borderLeftColor: themeColor, borderLeftWidth: 4 }}>
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500/10 blur-[30px] rounded-full point-events-none" />
          <div className="flex flex-col relative z-10">
            <span className="font-black text-2xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 drop-shadow-sm">Portal Cliente</span>
            <span className="text-[11px] text-indigo-400/90 uppercase tracking-[0.2em] font-black mt-1">Nest Coworking</span>
          </div>
        </div>

        <nav className="flex-1 py-8 px-5 space-y-2.5 overflow-y-auto no-scrollbar">
          <NavLink to="/" end className={({ isActive }) => `group flex items-center px-4 py-3.5 rounded-2xl transition-all duration-300 ${isActive ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-xl shadow-indigo-500/20 translate-x-1 [&_svg]:text-white [&_svg]:stroke-[2.5px]' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 hover:translate-x-1 [&_svg]:text-slate-500 hover:[&_svg]:text-indigo-400 [&_svg]:stroke-2'}`}>
            <LayoutDashboard size={20} className="mr-3.5 transition-colors" />
            <span className="font-bold text-sm tracking-wide">Dashboard</span>
          </NavLink>
          <NavLink to="/membership" className={({ isActive }) => `group flex items-center px-4 py-3.5 rounded-2xl transition-all duration-300 ${isActive ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-xl shadow-indigo-500/20 translate-x-1 [&_svg]:text-white [&_svg]:stroke-[2.5px]' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 hover:translate-x-1 [&_svg]:text-slate-500 hover:[&_svg]:text-indigo-400 [&_svg]:stroke-2'}`}>
            <User size={20} className="mr-3.5 transition-colors" />
            <span className="font-bold text-sm tracking-wide">Membresía</span>
          </NavLink>
          <NavLink to="/statement" className={({ isActive }) => `group flex items-center px-4 py-3.5 rounded-2xl transition-all duration-300 ${isActive ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-xl shadow-indigo-500/20 translate-x-1 [&_svg]:text-white [&_svg]:stroke-[2.5px]' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 hover:translate-x-1 [&_svg]:text-slate-500 hover:[&_svg]:text-indigo-400 [&_svg]:stroke-2'}`}>
            <CreditCard size={20} className="mr-3.5 transition-colors" />
            <span className="font-bold text-sm tracking-wide">Estado de Cuenta</span>
          </NavLink>
          <NavLink to="/booking" className={({ isActive }) => `group flex items-center px-4 py-3.5 rounded-2xl transition-all duration-300 ${isActive ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-xl shadow-indigo-500/20 translate-x-1 [&_svg]:text-white [&_svg]:stroke-[2.5px]' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 hover:translate-x-1 [&_svg]:text-slate-500 hover:[&_svg]:text-indigo-400 [&_svg]:stroke-2'}`}>
            <CalendarDays size={20} className="mr-3.5 transition-colors" />
            <span className="font-bold text-sm tracking-wide">Reservar Sala</span>
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `group flex items-center px-4 py-3.5 rounded-2xl transition-all duration-300 ${isActive ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-xl shadow-indigo-500/20 translate-x-1 [&_svg]:text-white [&_svg]:stroke-[2.5px]' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 hover:translate-x-1 [&_svg]:text-slate-500 hover:[&_svg]:text-indigo-400 [&_svg]:stroke-2'}`}>
            <Settings size={20} className="mr-3.5 transition-colors" />
            <span className="font-bold text-sm tracking-wide">Mi Perfil</span>
          </NavLink>
        </nav>

        <div className="p-6 border-t border-slate-800/60 bg-slate-900/20 backdrop-blur-md">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:border-slate-600/50 hover:bg-slate-800/60 transition-all duration-300 group">
            <div className="flex items-center min-w-0 cursor-default">
               <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-sm text-white shadow-lg shrink-0 ring-2 ring-slate-800/80 group-hover:scale-105 transition-transform duration-300">
                  {profile?.name.substring(0, 2).toUpperCase() || 'CX'}
               </div>
               <div className="ml-3.5 truncate">
                  <p className="text-sm font-bold text-slate-200 truncate group-hover:text-white transition-colors">{profile?.name || 'Cliente'}</p>
                  <p className="text-[11px] text-slate-500 font-semibold tracking-wide truncate">{user?.email}</p>
               </div>
            </div>
            <button onClick={handleLogout} className="text-slate-500 hover:text-rose-400 p-2.5 rounded-xl hover:bg-rose-400/10 transition-all duration-300 ml-2" title="Cerrar Sesión">
              <LogOut size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 md:hidden">
          <span className="font-bold text-slate-900">Portal Cliente</span>
          <button onClick={handleLogout} className="text-slate-400"><LogOut size={20} /></button>
        </header>

        <div className="p-8 max-w-7xl mx-auto animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
