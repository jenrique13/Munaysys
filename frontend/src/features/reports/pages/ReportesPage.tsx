import React, { useState } from 'react';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { reportsService } from '../services/reportsService';
import {
  FileBarChart2, Download, CalendarDays, TrendingUp, Wallet, AlertCircle, Loader2, FileText, Landmark, ArrowUpCircle, ArrowDownCircle, Eye
} from 'lucide-react';
import ReportPreviewModal from '../components/ReportPreviewModal';

// ── helpers ──────────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

const CRM_ROLES = new Set(['Gerente', 'Ventas', 'Super Admin']);
const FINANCIAL_ADMIN_ROLES = new Set(['Gerente', 'Coordinador', 'Super Admin']);
const ADVANCED_SALES_ROLES = new Set(['Ventas', 'Coordinador', 'Gerente', 'Super Admin']);

function getRoleName(user: any): string {
  if (user?.is_superuser) return 'Super Admin';
  return user?.role?.name ?? '';
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface ReportCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  loading: boolean;
  onDownload: () => void;
  onPreview?: () => void;
  color: string;
}

const ReportCard: React.FC<ReportCardProps> = ({ icon: Icon, title, description, loading, onDownload, onPreview, color }) => (
  <div className="flex items-start gap-4 p-5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
    <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110" style={{ backgroundColor: `${color}18` }}>
      <Icon size={20} style={{ color }} />
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="font-semibold text-slate-800 text-sm truncate">{title}</h4>
      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>
    </div>
    <div className="flex flex-col gap-2 shrink-0">
      <button
        onClick={onPreview}
        disabled={loading}
        className="flex items-center justify-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all border border-transparent hover:border-current disabled:opacity-50"
        style={{ color }}
      >
        <Eye size={12} />
        Vista Previa
      </button>
      <button
        onClick={onDownload}
        disabled={loading}
        className="flex items-center justify-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 text-white"
        style={{ background: color }}
      >
        {loading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
        {loading ? 'Generando…' : 'Descargar'}
      </button>
    </div>
  </div>
);

// ── Date Pickers ──────────────────────────────────────────────────────────────

const DateInput: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{label}</label>
    <input
      type="date"
      value={value}
      onChange={e => onChange(e.target.value)}
      className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
    />
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────

const ReportesPage: React.FC = () => {
  const { user } = useAuthStore();
  const roleName = getRoleName(user);
  const canSeeCrm = user?.is_superuser || CRM_ROLES.has(roleName);
  const canSeeFinancialAdmin = user?.is_superuser || FINANCIAL_ADMIN_ROLES.has(roleName);
  const canSeeAdvancedSales = user?.is_superuser || ADVANCED_SALES_ROLES.has(roleName);

  // Daily
  const [dailyDate, setDailyDate] = useState(today);
  const [loadingDaily, setLoadingDaily] = useState(false);

  // Sales / CRM range
  const [rangeStart, setRangeStart] = useState(monthStart);
  const [rangeEnd, setRangeEnd] = useState(today);
  const [loadingSales, setLoadingSales] = useState(false);
  const [loadingAdvancedSales, setLoadingAdvancedSales] = useState(false);
  const [loadingCrm, setLoadingCrm] = useState(false);

  // Expenses range
  const [expStart, setExpStart] = useState(monthStart);
  const [expEnd, setExpEnd] = useState(today);
  const [loadingExp, setLoadingExp] = useState(false);

  // Cash Flow range
  const [cfStart, setCfStart] = useState(monthStart);
  const [cfEnd, setCfEnd] = useState(today);
  const [loadingCfIncome, setLoadingCfIncome] = useState(false);
  const [loadingCfExpense, setLoadingCfExpense] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');

  // Preview Modal State
  const [previewConfig, setPreviewConfig] = useState<{
    isOpen: boolean;
    title: string;
    type: 'daily' | 'sales' | 'sales_advanced' | 'crm' | 'expenses' | 'cf_income' | 'cf_expense';
    data: any;
    onDownload: () => void;
  }>({
    isOpen: false,
    title: '',
    type: 'daily',
    data: null,
    onDownload: () => {},
  });

  const handleAction = async (
    setter: (v: boolean) => void,
    action: () => Promise<void>
  ) => {
    setter(true);
    setErrorMsg('');
    try {
      await action();
    } catch (err: any) {
      const msg = err?.response?.data
        ? await (async () => {
            try {
              if (err.response.data instanceof Blob) {
                const text = await err.response.data.text();
                const json = JSON.parse(text);
                return json.detail ?? 'Error al procesar la solicitud.';
              }
              return err.response.data.detail ?? 'Error al procesar la solicitud.';
            } catch {
              return 'Error al procesar la solicitud.';
            }
          })()
        : 'Error al procesar la solicitud.';
      setErrorMsg(msg);
    } finally {
      setter(false);
    }
  };

  const openPreview = async (
    setter: (v: boolean) => void,
    title: string,
    type: any,
    fetchData: () => Promise<any>,
    onDownload: () => void
  ) => {
    setter(true);
    setErrorMsg('');
    try {
      const data = await fetchData();
      setPreviewConfig({
        isOpen: true,
        title,
        type,
        data,
        onDownload,
      });
    } catch (err: any) {
      setErrorMsg('Error al cargar la vista previa.');
    } finally {
      setter(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-auto bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b px-8 py-5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-50">
            <FileBarChart2 size={20} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Reportes</h1>
            <p className="text-xs text-slate-500 mt-0.5">Genera y descarga reportes en PDF según el período deseado</p>
          </div>
          <div className="ml-auto">
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
              {roleName}
            </span>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="mx-8 mt-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
          <button className="ml-auto text-red-400 hover:text-red-600" onClick={() => setErrorMsg('')}>✕</button>
        </div>
      )}

      <div className="flex-1 px-8 py-6 space-y-8">

        {/* ── Reporte Diario (todos los roles) ─────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays size={16} className="text-indigo-500" />
            <h2 className="font-bold text-slate-800 text-base">Reporte Diario</h2>
            <span className="ml-2 text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wide">Todos los roles</span>
          </div>

          {/* Date Picker */}
          <div className="flex items-end gap-4 mb-4">
            <DateInput label="Fecha del reporte" value={dailyDate} onChange={setDailyDate} />
          </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <ReportCard
                icon={FileText}
                title="Reporte Diario de Ventas"
                description="Ventas del día seleccionado: ingresos por método de pago, por categoría de item, detalle de órdenes y clientes con saldo pendiente."
                loading={loadingDaily}
                color="#4F46E5"
                onPreview={() => openPreview(
                  setLoadingDaily, 
                  "Reporte Diario de Ventas", 
                  "daily", 
                  () => reportsService.getDailyReportData(dailyDate),
                  () => reportsService.downloadDailyReport(dailyDate)
                )}
                onDownload={() => handleAction(setLoadingDaily, () => reportsService.downloadDailyReport(dailyDate))}
              />
            </div>
          </section>

          {/* ── Reporte CRM / Ventas ───────────────────────────────────────── */}
          {(canSeeCrm || canSeeAdvancedSales) && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-emerald-500" />
                <h2 className="font-bold text-slate-800 text-base">Reportes de Ventas y CRM</h2>
                <span className="ml-2 text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full uppercase tracking-wide">Ventas · Coordinador · Gerencia · Super Admin</span>
              </div>

              {/* Range Picker */}
              <div className="flex items-end gap-4 mb-4">
                <DateInput label="Desde" value={rangeStart} onChange={setRangeStart} />
                <DateInput label="Hasta" value={rangeEnd} onChange={setRangeEnd} />
                <p className="text-[11px] text-slate-400 pb-2">Seleccionar rango de fechas para los reportes de ventas y CRM.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {canSeeCrm && (
                  <ReportCard
                    icon={TrendingUp}
                    title="Reporte de Ventas Totales"
                    description="Resumen de ingresos del período seleccionado, ventas por categoría de ítem (productos, salas, servicios) y detalle de órdenes."
                    loading={loadingSales}
                    color="#10B981"
                    onPreview={() => openPreview(
                      setLoadingSales,
                      "Reporte de Ventas Totales",
                      "sales",
                      () => reportsService.getSalesReportData(rangeStart, rangeEnd),
                      () => reportsService.downloadSalesReport(rangeStart, rangeEnd)
                    )}
                    onDownload={() => handleAction(setLoadingSales, () => reportsService.downloadSalesReport(rangeStart, rangeEnd))}
                  />
                )}
                {canSeeAdvancedSales && (
                  <ReportCard
                    icon={TrendingUp}
                    title="Reporte Avanzado Ventas por Sede"
                    description="Acumulado de ventas por sede segmentado en: Oficina Privada, Escritorios Fijos, Espacios Compartidos, Salas y Servicios."
                    loading={loadingAdvancedSales}
                    color="#8B5CF6"
                    onPreview={() => openPreview(
                      setLoadingAdvancedSales,
                      "Reporte Avanzado de Ventas",
                      "sales_advanced",
                      () => reportsService.getAdvancedSalesReportData(rangeStart, rangeEnd),
                      () => reportsService.downloadAdvancedSalesReport(rangeStart, rangeEnd)
                    )}
                    onDownload={() => handleAction(setLoadingAdvancedSales, () => reportsService.downloadAdvancedSalesReport(rangeStart, rangeEnd))}
                  />
                )}
                {canSeeCrm && (
                <ReportCard
                  icon={FileBarChart2}
                  title="Reporte CRM"
                  description="Leads captados, oportunidades por etapa del pipeline, tasa de conversión y detalle de prospectos en el período."
                  loading={loadingCrm}
                  color="#0EA5E9"
                  onPreview={() => openPreview(
                    setLoadingCrm,
                    "Reporte CRM",
                    "crm",
                    () => reportsService.getCrmReportData(rangeStart, rangeEnd),
                    () => reportsService.downloadCrmReport(rangeStart, rangeEnd)
                  )}
                  onDownload={() => handleAction(setLoadingCrm, () => reportsService.downloadCrmReport(rangeStart, rangeEnd))}
                />
                )}
              </div>
            </section>
          )}

          {/* ── Reporte Gastos / Compras / CxP ────────────────────────────── */}
          {canSeeFinancialAdmin && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Wallet size={16} className="text-orange-500" />
                <h2 className="font-bold text-slate-800 text-base">Reportes de Gastos y Cuentas por Pagar</h2>
                <span className="ml-2 text-[10px] font-bold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full uppercase tracking-wide">Coordinador · Gerencia · Super Admin</span>
              </div>

              {/* Range Picker */}
              <div className="flex items-end gap-4 mb-4">
                <DateInput label="Desde" value={expStart} onChange={setExpStart} />
                <DateInput label="Hasta" value={expEnd} onChange={setExpEnd} />
                <p className="text-[11px] text-slate-400 pb-2">Rango de fechas para los reportes de gastos y compras.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <ReportCard
                  icon={Wallet}
                  title="Reporte de Gastos, Compras y CxP"
                  description="Resumen de egresos del período: gastos por categoría, detalle de compras a proveedores y cuentas por pagar pendientes."
                  loading={loadingExp}
                  color="#F59E0B"
                  onPreview={() => openPreview(
                    setLoadingExp,
                    "Reporte de Gastos, Compras y CxP",
                    "expenses",
                    () => reportsService.getExpensesReportData(expStart, expEnd),
                    () => reportsService.downloadExpensesReport(expStart, expEnd)
                  )}
                  onDownload={() => handleAction(setLoadingExp, () => reportsService.downloadExpensesReport(expStart, expEnd))}
                />
              </div>
            </section>
          )}

          {/* ── Reporte Flujo de Caja ───────────────────────────────────────── */}
          {canSeeFinancialAdmin && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Landmark size={16} className="text-blue-500" />
                <h2 className="font-bold text-slate-800 text-base">Reportes de Flujo de Caja</h2>
                <span className="ml-2 text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-wide">Finanzas · Gerencia · Super Admin</span>
              </div>

              {/* Range Picker */}
              <div className="flex items-end gap-4 mb-4">
                <DateInput label="Desde" value={cfStart} onChange={setCfStart} />
                <DateInput label="Hasta" value={cfEnd} onChange={setCfEnd} />
                <p className="text-[11px] text-slate-400 pb-2">Rango de fechas para reportes detallados de ingresos y egresos de caja.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <ReportCard
                  icon={ArrowUpCircle}
                  title="Reporte de Ingresos de Caja"
                  description="Listado detallado de todos los ingresos registrados en el flujo de caja para el período seleccionado."
                  loading={loadingCfIncome}
                  color="#10B981"
                  onPreview={() => openPreview(
                    setLoadingCfIncome,
                    "Reporte de Ingresos de Caja",
                    "cf_income",
                    () => reportsService.getCashFlowIncomeData(cfStart, cfEnd),
                    () => reportsService.downloadCashFlowIncomeReport(cfStart, cfEnd)
                  )}
                  onDownload={() => handleAction(setLoadingCfIncome, () => reportsService.downloadCashFlowIncomeReport(cfStart, cfEnd))}
                />
                <ReportCard
                  icon={ArrowDownCircle}
                  title="Reporte de Egresos de Caja"
                  description="Listado detallado de todos los egresos y gastos registrados en el flujo de caja para el período seleccionado."
                  loading={loadingCfExpense}
                  color="#EF4444"
                  onPreview={() => openPreview(
                    setLoadingCfExpense,
                    "Reporte de Egresos de Caja",
                    "cf_expense",
                    () => reportsService.getCashFlowExpenseData(cfStart, cfEnd),
                    () => reportsService.downloadCashFlowExpenseReport(cfStart, cfEnd)
                  )}
                  onDownload={() => handleAction(setLoadingCfExpense, () => reportsService.downloadCashFlowExpenseReport(cfStart, cfEnd))}
                />
              </div>
            </section>
          )}

        </div>

        {/* Modal Vista Previa */}
        <ReportPreviewModal
          {...previewConfig}
          onClose={() => setPreviewConfig(prev => ({ ...prev, isOpen: false }))}
        />

      </div>
  );
};

export default ReportesPage;
