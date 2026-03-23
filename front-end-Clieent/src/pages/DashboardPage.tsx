import React, { useEffect } from 'react';
import { useClientStore } from '../store/clientStore';
import { Sparkles, Calendar, Clock, CreditCard, ChevronRight, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const DashboardPage: React.FC = () => {
  const { profile, statement, memberships, fetchStatement, fetchMemberships } = useClientStore();

  useEffect(() => {
    fetchStatement();
    fetchMemberships();
  }, [fetchStatement, fetchMemberships]);

  const activeMem = memberships.find(m => m.status === 'active');

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 tracking-tight">¡Hola, {profile?.name.split(' ')[0]}!</h1>
           <p className="text-slate-500 font-medium">Bienvenido a tu portal de Nest Coworking.</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100">
          <Calendar size={18} className="text-indigo-600" />
          <span className="text-sm font-bold text-indigo-700">{format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Membership Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-default">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Sparkles size={80} className="text-indigo-600" />
           </div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Membresía Actual</p>
           {activeMem ? (
             <>
               <h3 className="text-2xl font-bold text-slate-900 mb-1">{activeMem.plan_name}</h3>
               <p className="text-sm font-medium text-slate-500 flex items-center">
                 <Clock size={14} className="mr-1" /> Expira em {format(new Date(activeMem.end_date || new Date()), 'dd/MM/yyyy')}
               </p>
               <div className="mt-6 flex items-center justify-between">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 uppercase tracking-wide">Activa</span>
                  <button className="text-indigo-600 text-xs font-bold flex items-center hover:underline">Ver detalles <ChevronRight size={14} /></button>
               </div>
             </>
           ) : (
             <div className="py-4">
                <p className="text-sm text-slate-500 font-medium">No tienes una membresía activa actualmente.</p>
                <button className="mt-4 text-indigo-600 font-bold text-sm">Explorar Planes</button>
             </div>
           )}
        </div>

        {/* Balance Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 group hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Saldo Pendiente</p>
           <h3 className="text-4xl font-bold text-slate-900 mb-2">${statement?.balance.toLocaleString() || '0.00'}</h3>
           <p className="text-sm font-medium text-slate-500 flex items-center">
             <CreditCard size={14} className="mr-1" /> Corte al {format(new Date(), 'dd/MM/yyyy')}
           </p>
           <div className="mt-6">
              <button className="w-full bg-slate-900 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-slate-800 transition-colors">Pagar Ahora</button>
           </div>
        </div>

        {/* Activity Summary */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 group hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Uso de Salas</p>
           <div className="flex items-center justify-between mb-4">
              <div>
                 <p className="text-2xl font-bold text-slate-900">{activeMem?.hours_used || 0}h</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Consumidas</p>
              </div>
              <div className="w-1.5 h-8 bg-slate-100 rounded-full mx-2" />
              <div className="text-right">
                 <p className="text-2xl font-bold text-indigo-600">{activeMem?.hours_included || 0}h</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter text-right">Incluidas</p>
              </div>
           </div>
           
           <div className="mt-4 bg-slate-100 h-2 rounded-full overflow-hidden">
               <div 
                 className="bg-indigo-600 h-full transition-all duration-1000" 
                 style={{ width: `${Math.min(((activeMem?.hours_used || 0) / (activeMem?.hours_included || 1)) * 100, 100)}%` }} 
               />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Bookings */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
           <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Próximas Reservas</h2>
              <Activity size={20} className="text-slate-300" />
           </div>
           
           <div className="space-y-4">
              <p className="text-center py-10 text-slate-400 text-sm italic font-medium">No tienes reservas pendientes.</p>
              <button className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 font-bold text-sm hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all">
                + Nueva Reserva
              </button>
           </div>
        </div>

        <div className="bg-indigo-600 p-8 rounded-3xl shadow-lg shadow-indigo-600/20 text-white relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-white/10 rounded-full blur-[80px]" />
            <h2 className="text-2xl font-bold mb-2 relative z-10">¿Necesitas una sala?</h2>
            <p className="text-indigo-100 mb-8 max-w-xs relative z-10">Reserva salas de reuniones o cabinas privadas directamente desde aquí.</p>
            <button className="bg-white text-indigo-600 py-3.5 px-8 rounded-2xl font-bold text-sm shadow-xl hover:scale-105 active:scale-95 transition-all relative z-10">
              Ir a Reservas
            </button>
        </div>
      </div>
    </div>
  );
};
