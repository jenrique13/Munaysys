import React, { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CreditCard, CalendarDays, User, LogOut, Building2 } from 'lucide-react';
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
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-slate-800" style={{ borderLeftColor: themeColor, borderLeftWidth: 4 }}>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight">Portal Cliente</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Nest Coworking</span>
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2">
          <NavLink to="/" end className={({ isActive }) => `flex items-center px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <LayoutDashboard size={20} className="mr-3" />
            <span className="font-medium">Dashboard</span>
          </NavLink>
          <NavLink to="/membership" className={({ isActive }) => `flex items-center px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <User size={20} className="mr-3" />
            <span className="font-medium">Membresía</span>
          </NavLink>
          <NavLink to="/statement" className={({ isActive }) => `flex items-center px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <CreditCard size={20} className="mr-3" />
            <span className="font-medium">Estado de Cuenta</span>
          </NavLink>
          <NavLink to="/booking" className={({ isActive }) => `flex items-center px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <CalendarDays size={20} className="mr-3" />
            <span className="font-medium">Reservar Sala</span>
          </NavLink>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0">
               <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                  {profile?.name.substring(0, 2).toUpperCase() || 'C'}
               </div>
               <div className="ml-3 truncate">
                  <p className="text-sm font-bold truncate">{profile?.name || 'Cliente'}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
               </div>
            </div>
            <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 p-2">
              <LogOut size={18} />
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
