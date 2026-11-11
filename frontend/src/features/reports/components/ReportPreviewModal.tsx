import { X, Download, FileText, TrendingUp, Users, Wallet, Landmark, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { formatCurrency, formatMixedCurrency } from '../../../utils/format';

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: 'daily' | 'sales' | 'crm' | 'expenses' | 'cf_income' | 'cf_expense' | 'sales_advanced';
  data: any;
  onDownload: () => void;
}

const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({ isOpen, onClose, title, type, data, onDownload }) => {
  if (!isOpen || !data) return null;

  const renderContent = () => {
    switch (type) {
      case 'daily':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-indigo-50 rounded-lg">
                <p className="text-[10px] uppercase font-bold text-indigo-400">Ventas Totales</p>
                <p className="text-lg font-bold text-indigo-700">{formatCurrency(data.totals.sales)}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <p className="text-[10px] uppercase font-bold text-emerald-400">Ingresos (Combinados)</p>
                <p className="text-xs font-bold text-emerald-700 leading-tight">
                    {formatMixedCurrency(data.totals.income_eur, data.totals.income_usd)}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-[10px] uppercase font-bold text-blue-400">Ingresos BS</p>
                <p className="text-lg font-bold text-blue-700">Bs {data.totals.income_bs.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <p className="text-[10px] uppercase font-bold text-orange-400">Deuda Hoy</p>
                <p className="text-lg font-bold text-orange-700">{formatCurrency(data.totals.pending_today)}</p>
              </div>
            </div>

            <div>
              <h5 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                <FileText size={14} className="text-indigo-500" /> Detalle de Ítems Vendidos
              </h5>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-3 py-2 font-bold text-slate-600">Hora</th>
                      <th className="px-3 py-2 font-bold text-slate-600">Cliente</th>
                      <th className="px-3 py-2 font-bold text-slate-600">Descripción</th>
                      <th className="px-3 py-2 font-bold text-slate-600 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.items_detail_list.map((item: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-500">{item.time.split(' - ')[0]}</td>
                        <td className="px-3 py-2 font-medium text-slate-700">{item.client_name}</td>
                        <td className="px-3 py-2 text-slate-600">{item.description}</td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-900">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div>
              <h5 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                <Landmark size={14} className="text-blue-500" /> Ingresos por Caja
              </h5>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-3 py-2 font-bold text-slate-600">Cliente</th>
                      <th className="px-3 py-2 font-bold text-slate-600">Método</th>
                      <th className="px-3 py-2 font-bold text-slate-600">Monto</th>
                      <th className="px-3 py-2 font-bold text-slate-600">Referencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.income_details.map((inc: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-700">{inc.client_name}</td>
                        <td className="px-3 py-2 text-slate-500">{inc.method}</td>
                        <td className="px-3 py-2 font-semibold text-slate-900">{inc.currency === 'USD' ? '$' : '€'}{inc.amount.toLocaleString()}</td>
                        <td className="px-3 py-2 text-slate-500">{inc.reference}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'sales':
        return (
          <div className="space-y-6">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-emerald-500">Total Bruto Ventas</p>
                <p className="text-2xl font-black text-emerald-700">{formatCurrency(data.total_bruto)}</p>
              </div>
              <TrendingUp size={32} className="text-emerald-200" />
            </div>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-bold">#</th>
                    <th className="px-4 py-3 font-bold">Fecha</th>
                    <th className="px-4 py-3 font-bold">Cliente</th>
                    <th className="px-4 py-3 font-bold">Estado</th>
                    <th className="px-4 py-3 font-bold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.orders.map((o: any) => (
                    <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-indigo-600 font-bold">#{o.id}</td>
                      <td className="px-4 py-3 text-slate-500">{o.date}</td>
                      <td className="px-4 py-3 font-medium text-slate-700">{o.client_name}</td>
                      <td className="px-4 py-3 text-slate-500">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${o.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-slate-900">{formatCurrency(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'sales_advanced':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex flex-col justify-center">
                <p className="text-[10px] uppercase font-bold text-indigo-500">Total Generado Global</p>
                <p className="text-2xl font-black text-indigo-700">€{formatCurrency(data.global_total_paid + data.global_total_pending).replace('€', '')}</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex flex-col justify-center">
                <p className="text-[10px] uppercase font-bold text-emerald-500">Facturado / Pagado Global</p>
                <p className="text-2xl font-black text-emerald-700">€{formatCurrency(data.global_total_paid).replace('€', '')}</p>
              </div>
              <div className="p-4 bg-rose-50 rounded-xl border border-rose-100 flex flex-col justify-center">
                <p className="text-[10px] uppercase font-bold text-rose-500">Pendiente Global</p>
                <p className="text-2xl font-black text-rose-700">€{formatCurrency(data.global_total_pending).replace('€', '')}</p>
              </div>
            </div>

            {data.branches.map((b: any, index: number) => (
              <div key={index} className="border border-slate-200 rounded-xl overflow-hidden mb-6">
                <div className="bg-slate-800 px-4 py-2 flex items-center justify-between">
                  <h4 className="text-white font-bold text-sm">{b.name}</h4>
                  <span className="text-slate-300 text-[10px] font-medium">
                    Gen: €{formatCurrency(b.total_paid + b.total_pending).replace('€', '')} | Pag: <span className="text-emerald-400">€{formatCurrency(b.total_paid).replace('€', '')}</span> | Pdt: <span className="text-rose-400">€{formatCurrency(b.total_pending).replace('€', '')}</span>
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b text-slate-600 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-2 font-bold w-2/4">Categoría</th>
                        <th className="px-4 py-2 font-bold text-right w-1/4">Pagado</th>
                        <th className="px-4 py-2 font-bold text-right w-1/4">Pdte</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {['Oficina Privada', 'Escritorios Fijos', 'Espacios Compartidos', 'Salas', 'Servicios', 'Otros'].map(cat => (
                        <tr key={cat} className="hover:bg-slate-50/50">
                          <td className="px-4 py-2 font-medium text-slate-700">{cat}</td>
                          <td className="px-4 py-2 text-right font-semibold text-emerald-600">€{formatCurrency(b.paid_categories[cat]).replace('€', '')}</td>
                          <td className="px-4 py-2 text-right font-semibold text-rose-600">€{formatCurrency(b.pending_categories[cat]).replace('€', '')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {/* Detalle de Órdenes */}
            {data.orders_detail_list && data.orders_detail_list.length > 0 && (
              <div>
                <h5 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                  <FileText size={14} className="text-indigo-500" /> Detalle de las Órdenes
                </h5>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="px-3 py-2 font-bold text-slate-600">Orden</th>
                        <th className="px-3 py-2 font-bold text-slate-600">Fecha</th>
                        <th className="px-3 py-2 font-bold text-slate-600">Cliente</th>
                        <th className="px-3 py-2 font-bold text-slate-600">Descripción</th>
                        <th className="px-3 py-2 font-bold text-slate-600 text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.orders_detail_list.map((o: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-bold text-slate-700">#{o.id}</td>
                          <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{o.date}</td>
                          <td className="px-3 py-2 font-medium text-slate-700">{o.client_name}</td>
                          <td className="px-3 py-2 text-slate-600 text-[10px]">{o.description}</td>
                          <td className="px-3 py-2 text-right font-semibold text-slate-900">{formatCurrency(o.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 font-bold text-slate-800">
                        <td colSpan={4} className="px-3 py-2 text-right">Total Órdenes:</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(data.orders_detail_list.reduce((sum: number, o: any) => sum + o.total, 0))}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Formas de Pago */}
            {data.orders_by_payment_method && Object.keys(data.orders_by_payment_method).length > 0 && (
              <div>
                <h5 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                  <Wallet size={14} className="text-emerald-500" /> Formas de Pago
                </h5>
                <div className="space-y-4">
                  {Object.entries(data.orders_by_payment_method).map(([method, data_item]: [string, any]) => (
                    <div key={method} className="border rounded-lg overflow-hidden">
                      <div className="bg-slate-100 px-3 py-2 font-bold text-slate-700 text-xs">
                        Método: {method}
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b">
                            <tr>
                              <th className="px-3 py-2 font-bold text-slate-600">Orden</th>
                              <th className="px-3 py-2 font-bold text-slate-600">Fecha Pago</th>
                              <th className="px-3 py-2 font-bold text-slate-600">Cliente</th>
                              <th className="px-3 py-2 font-bold text-slate-600 text-right">Monto</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {data_item.payments.map((p: any, i: number) => (
                              <tr key={i} className="hover:bg-slate-50">
                                <td className="px-3 py-2 font-medium text-slate-700">#{p.order_id}</td>
                                <td className="px-3 py-2 text-slate-500">{p.date}</td>
                                <td className="px-3 py-2 text-slate-600">{p.client_name}</td>
                                <td className="px-3 py-2 text-right">
                                  <div className="font-semibold text-emerald-700">Bs {formatCurrency(p.amount_bs).replace('€', '').replace('$', '')}</div>
                                  <div className="text-[9px] text-slate-500">Tasa: {formatCurrency(p.rate).replace('€', '').replace('$', '')}</div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-slate-50 font-bold text-slate-800">
                              <td colSpan={3} className="px-3 py-2 text-right">Total {method}:</td>
                              <td className="px-3 py-2 text-right text-emerald-700">
                                {Object.entries(data_item.totals).map(([curr, total]: [string, any]) => (
                                  <div key={curr}>{curr} {formatCurrency(total).replace('€', '').replace('$', '')}</div>
                                ))}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'crm':
        return (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-blue-500">Leads Captados</p>
                <p className="text-2xl font-black text-blue-700">{data.leads_count}</p>
              </div>
              <Users size={32} className="text-blue-200" />
            </div>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-bold">Nombre</th>
                    <th className="px-4 py-3 font-bold">Email</th>
                    <th className="px-4 py-3 font-bold">Fuente</th>
                    <th className="px-4 py-3 font-bold">Estado</th>
                    <th className="px-4 py-3 font-bold">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.leads.map((l: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">{l.name}</td>
                      <td className="px-4 py-3 text-slate-500">{l.email}</td>
                      <td className="px-4 py-3 text-slate-500">{l.source}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                          {l.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{l.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'expenses':
        return (
          <div className="space-y-6">
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-bold">Fecha</th>
                    <th className="px-4 py-3 font-bold">Categoría</th>
                    <th className="px-4 py-3 font-bold">Descripción</th>
                    <th className="px-4 py-3 font-bold text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.expenses.map((e: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-slate-500">{e.date}</td>
                      <td className="px-4 py-3 font-bold text-slate-700">{e.category}</td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{e.description}</td>
                      <td className="px-4 py-3 text-right font-black text-slate-900">
                        {e.currency === 'eur' ? '€' : '$'}{e.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'cf_income':
      case 'cf_expense':
        return (
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Total {type === 'cf_income' ? 'Ingresos' : 'Egresos'}</p>
                <p className={`text-2xl font-black ${type === 'cf_income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatCurrency(data.total_amount)}
                </p>
              </div>
              {type === 'cf_income' ? <ArrowUpCircle size={32} className="text-emerald-200" /> : <ArrowDownCircle size={32} className="text-rose-200" />}
            </div>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-bold">Fecha</th>
                    <th className="px-4 py-3 font-bold">Categoría</th>
                    <th className="px-4 py-3 font-bold">Entidad</th>
                    <th className="px-4 py-3 font-bold">Método</th>
                    <th className="px-4 py-3 font-bold text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.movements.map((m: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{m.date}</td>
                      <td className="px-4 py-3 font-bold text-slate-700">{m.category}</td>
                      <td className="px-4 py-3 text-slate-600">{m.entity_name}</td>
                      <td className="px-4 py-3 text-slate-500">{m.payment_method}</td>
                      <td className="px-4 py-3 text-right font-black text-slate-900">{formatCurrency(m.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return <div className="p-8 text-center text-slate-400">No hay vista previa disponible para este reporte.</div>;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
              <p className="text-[10px] text-slate-500 font-medium">Vista Previa de Datos • {data.date_range || data.date || ''}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-slate-50 flex items-center justify-between shrink-0">
          <p className="text-[10px] text-slate-400 font-medium">
            Sede: <span className="text-slate-600 font-bold uppercase">{data.branch_name || 'General'}</span>
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={onDownload}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <Download size={14} />
              Descargar PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPreviewModal;
