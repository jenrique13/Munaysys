import React, { useEffect } from 'react';
import { useClientStore } from '../store/clientStore';
import { CreditCard, ArrowDownRight, ArrowUpRight, FileText, Landmark } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const StatementPage: React.FC = () => {
  const { statement, fetchStatement } = useClientStore();

  useEffect(() => {
    fetchStatement();
  }, [fetchStatement]);

  const transactions = statement 
    ? [
        ...statement.orders.map(o => ({ ...o, type: 'order', date: o.date || o.created_at })),
        ...statement.receipts.map(r => ({ ...r, type: 'receipt', date: r.date }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Estado de Cuenta</h1>
           <p className="text-slate-500 font-medium">Historial de facturación y pagos realizados.</p>
        </div>
        <button className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-xl shadow-slate-900/10 flex items-center">
           <FileText size={18} className="mr-2" /> Descargar PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Facturado</p>
            <p className="text-3xl font-bold text-slate-900 font-mono">${statement?.total_charges.toLocaleString() || '0.00'}</p>
         </div>
         <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Pagado</p>
            <p className="text-3xl font-bold text-green-600 font-mono">${statement?.total_paid.toLocaleString() || '0.00'}</p>
         </div>
         <div className="bg-indigo-600 p-6 rounded-3xl shadow-lg shadow-indigo-600/20 text-white">
            <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-1">Saldo a Pagar</p>
            <p className="text-3xl font-bold font-mono">${statement?.balance.toLocaleString() || '0.00'}</p>
         </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
         <div className="px-8 py-6 border-b border-slate-100 flex items-center space-x-2">
            <Landmark size={20} className="text-slate-400" />
            <h2 className="text-lg font-bold text-slate-800">Transacciones Recientes</h2>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-50/50">
                     <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Fecha</th>
                     <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Descripción</th>
                     <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Monto</th>
                     <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Estado</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {transactions.length > 0 ? (
                    transactions.map((t: any, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-4 text-sm font-medium text-slate-600">
                          {format(new Date(t.date), 'dd MMM yyyy')}
                        </td>
                        <td className="px-8 py-4">
                           <div className="flex items-center">
                              {t.type === 'order' ? (
                                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center mr-3 shrink-0">
                                   <ArrowUpRight size={16} />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center mr-3 shrink-0">
                                   <ArrowDownRight size={16} />
                                </div>
                              )}
                              <div>
                                 <p className="text-sm font-bold text-slate-900">
                                    {t.type === 'order' ? `Orden #${t.id}` : `Pago / ${t.payment_method}`}
                                 </p>
                                 <p className="text-xs text-slate-400 truncate max-w-[200px]">
                                    {t.type === 'order' ? `Consumo de servicios/salas` : t.reference || 'Referencia no disponible'}
                                 </p>
                              </div>
                           </div>
                        </td>
                        <td className="px-4 py-4 text-sm font-bold font-mono text-slate-900">
                          {t.type === 'order' ? '-' : '+'}${t.amount || t.total || 0}
                        </td>
                        <td className="px-8 py-4 text-right">
                           <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                             t.status === 'paid' ? 'bg-green-100 text-green-700' : 
                             t.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                             t.type === 'receipt' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                           }`}>
                             {t.status || 'Completado'}
                           </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                       <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic text-sm">
                          No hay transacciones registradas.
                       </td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};
