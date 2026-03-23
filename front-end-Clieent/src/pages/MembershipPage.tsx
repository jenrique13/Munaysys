import React, { useEffect } from 'react';
import { useClientStore } from '../store/clientStore';
import { Sparkles, Calendar, Clock, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const MembershipPage: React.FC = () => {
  const { memberships, fetchMemberships } = useClientStore();

  useEffect(() => {
    fetchMemberships();
  }, [fetchMemberships]);

  const activeMem = memberships.find(m => m.status === 'active');

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tu Membresía</h1>
           <p className="text-slate-500 font-medium">Gestiona tu suscripción y beneficios.</p>
        </div>
      </div>

      {activeMem ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-indigo-600 p-8 text-white relative">
            <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[120%] bg-white/10 rounded-full blur-[80px]" />
            <div className="flex items-center justify-between relative z-10">
               <div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white uppercase tracking-wider mb-2">Plan Activo</span>
                  <h2 className="text-4xl font-bold">{activeMem.plan_name}</h2>
               </div>
               <Sparkles size={48} className="text-white/40" />
            </div>
          </div>
          
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-6">
                <div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Detalles del Período</p>
                   <div className="flex items-center space-x-2 text-slate-700 font-medium">
                      <Calendar size={18} className="text-slate-400" />
                      <span>Inició el {format(new Date(activeMem.start_date), 'dd/MM/yyyy')}</span>
                   </div>
                   {activeMem.end_date && (
                     <div className="flex items-center space-x-2 text-slate-700 font-medium mt-2">
                        <Clock size={18} className="text-slate-400" />
                        <span>Próxima renovación: {format(new Date(activeMem.end_date), 'dd/MM/yyyy')}</span>
                     </div>
                   )}
                </div>

                <div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Facturación</p>
                   <div className="flex items-center space-x-2 text-slate-700 font-medium">
                      <CreditCard size={18} className="text-slate-400" />
                      <span>Costo mensual: <span className="font-bold font-mono">${activeMem.price.toLocaleString()}</span></span>
                   </div>
                </div>
             </div>

             <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Consumo de Horas</p>
                <div className="flex justify-between items-end mb-2">
                   <p className="text-3xl font-bold text-slate-900">{activeMem.hours_used}<span className="text-sm font-medium text-slate-500">h</span></p>
                   <p className="text-sm font-medium text-slate-500">de {activeMem.hours_included || '∞'}h</p>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                   <div 
                     className="bg-indigo-600 h-full rounded-full transition-all duration-1000" 
                     style={{ width: `${Math.min(((activeMem.hours_used) / (activeMem.hours_included || 1)) * 100, 100)}%` }} 
                   />
                </div>
                {activeMem.hours_included > 0 && activeMem.hours_used >= activeMem.hours_included && (
                  <p className="text-[10px] text-red-500 font-bold mt-2 flex items-center">
                    <AlertCircle size={12} className="mr-1" /> Has agotado tus horas incluidas. Se aplicará tarifa adicional.
                  </p>
                )}
             </div>
          </div>
          
          <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end">
             <button className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">Solicitar cambio de plan</button>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-100 text-center">
           <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
              <AlertCircle size={40} />
           </div>
           <h2 className="text-xl font-bold text-slate-900 mb-2">No tienes membresía activa</h2>
           <p className="text-slate-500 max-w-sm mx-auto mb-8">Parece que no cuentas con una membresía vigente. Contacta a administración para activar tu suscripción.</p>
           <button className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-bold text-sm shadow-xl shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all">Ver Planes Disponibles</button>
        </div>
      )}

      {memberships.length > 1 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Historial de Planes</h2>
          <div className="space-y-3">
             {memberships.filter(m => m.status !== 'active').map(m => (
               <div key={m.id} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors">
                  <div className="flex items-center space-x-4">
                     <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                        <CheckCircle2 size={20} />
                     </div>
                     <div>
                        <p className="font-bold text-slate-900">{m.plan_name}</p>
                        <p className="text-xs text-slate-500">{format(new Date(m.start_date), 'dd MMM yyyy')} - {m.end_date ? format(new Date(m.end_date), 'dd MMM yyyy') : 'Finalizado'}</p>
                     </div>
                  </div>
                  <span className="text-xs font-bold text-slate-400 tracking-wide uppercase">Finalizada</span>
               </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
};
