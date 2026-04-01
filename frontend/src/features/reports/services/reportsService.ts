import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function downloadBlob(url: string, filename: string) {
  const response = await axios.get(`${API_BASE}/api/v1/reports${url}`, {
    headers: getAuthHeaders(),
    responseType: 'blob',
  });
  const href = URL.createObjectURL(response.data);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(href);
}

export const reportsService = {
  downloadDailyReport: (date: string) =>
    downloadBlob(`/daily?report_date=${date}`, `reporte_diario_${date}.pdf`),

  downloadSalesReport: (start: string, end: string) =>
    downloadBlob(`/sales?start=${start}&end=${end}`, `reporte_ventas_${start}_${end}.pdf`),

  downloadCrmReport: (start: string, end: string) =>
    downloadBlob(`/crm?start=${start}&end=${end}`, `reporte_crm_${start}_${end}.pdf`),

  downloadExpensesReport: (start: string, end: string) =>
    downloadBlob(`/expenses?start=${start}&end=${end}`, `reporte_gastos_${start}_${end}.pdf`),

  downloadCashFlowIncomeReport: (start: string, end: string) =>
    downloadBlob(`/cashflow/income?start=${start}&end=${end}`, `reporte_ingresos_caja_${start}_${end}.pdf`),

  downloadCashFlowExpenseReport: (start: string, end: string) =>
    downloadBlob(`/cashflow/expense?start=${start}&end=${end}`, `reporte_egresos_caja_${start}_${end}.pdf`),
};
