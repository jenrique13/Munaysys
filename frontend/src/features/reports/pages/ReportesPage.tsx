import React, { useState } from 'react';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { reportsService } from '../services/reportsService';
import {
  FileBarChart2, Download, CalendarDays, TrendingUp, Wallet, AlertCircle, Loader2, FileText
} from 'lucide-react';

// ── helpers ──────────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

const CRM_ROLES = new Set(['Gerente', 'Ventas', 'Super Admin']);
const FINANCIAL_ADMIN_ROLES = new Set(['Gerente', 'Coordinador', 'Super Admin']);

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
  color: string;
}

const ReportCard: React.FC<ReportCardProps> = ({ icon: Icon, title, description, loading, onDownload, color }) => (
  <div className="flex items-start gap-4 p-5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
    <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
      <Icon size={20} style={{ color }} />
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="font-semibold text-slate-800 text-sm truncate">{title}</h4>
      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>
    </div>
    <button
      onClick={onDownload}
      disabled={loading}
      className="shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all disabled:opacity-50"
      style={{ background: `${color}15`, color }}
    >
      {loading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
      {loading ? 'Generando…' : 'Descargar'}
    </button>
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

  // Daily
  const [dailyDate, setDailyDate] = useState(today);
  const [loadingDaily, setLoadingDaily] = useState(false);

  // Sales / CRM range
  const [rangeStart, setRangeStart] = useState(monthStart);
  const [rangeEnd, setRangeEnd] = useState(today);
  const [loadingSales, setLoadingSales] = useState(false);
  const [loadingCrm, setLoadingCrm] = useState(false);

  // Expenses range
  const [expStart, setExpStart] = useState(monthStart);
  const [expEnd, setExpEnd] = useState(today);
  const [loadingExp, setLoadingExp] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');

  const handleDownload = async (
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
              // blob response – parse json
              const text = await (err.response.data as Blob).text();
              const json = JSON.parse(text);
              return json.detail ?? 'Error al generar el reporte.';
            } catch {
              return 'Error al generar el reporte.';
            }
          })()
        : 'Error al generar el reporte.';
      setErrorMsg(msg);
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
              onDownload={() => handleDownload(setLoadingDaily, () => reportsService.downloadDailyReport(dailyDate))}
            />
          </div>
        </section>

        {/* ── Reporte CRM / Ventas ───────────────────────────────────────── */}
        {canSeeCrm && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-emerald-500" />
              <h2 className="font-bold text-slate-800 text-base">Reportes de Ventas y CRM</h2>
              <span className="ml-2 text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full uppercase tracking-wide">Ventas · Gerencia · Super Admin</span>
            </div>

            {/* Range Picker */}
            <div className="flex items-end gap-4 mb-4">
              <DateInput label="Desde" value={rangeStart} onChange={setRangeStart} />
              <DateInput label="Hasta" value={rangeEnd} onChange={setRangeEnd} />
              <p className="text-[11px] text-slate-400 pb-2">Seleccionar rango de fechas para los reportes de ventas y CRM.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <ReportCard
                icon={TrendingUp}
                title="Reporte de Ventas Totales"
                description="Resumen de ingresos del período seleccionado, ventas por categoría de ítem (productos, salas, servicios) y detalle de órdenes."
                loading={loadingSales}
                color="#10B981"
                onDownload={() => handleDownload(setLoadingSales, () => reportsService.downloadSalesReport(rangeStart, rangeEnd))}
              />
              <ReportCard
                icon={FileBarChart2}
                title="Reporte CRM"
                description="Leads captados, oportunidades por etapa del pipeline, tasa de conversión y detalle de prospectos en el período."
                loading={loadingCrm}
                color="#0EA5E9"
                onDownload={() => handleDownload(setLoadingCrm, () => reportsService.downloadCrmReport(rangeStart, rangeEnd))}
              />
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
                onDownload={() => handleDownload(setLoadingExp, () => reportsService.downloadExpensesReport(expStart, expEnd))}
              />
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

export default ReportesPage;
