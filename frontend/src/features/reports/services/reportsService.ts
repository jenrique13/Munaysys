import api from '../../../services/api';

async function downloadBlob(url: string, filename: string) {
  const response = await api.get(`/reports${url}`, {
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

async function getReportData(url: string) {
  const response = await api.get(`/reports${url}${url.includes('?') ? '&' : '?'}preview=true`);
  return response.data;
}

export const reportsService = {
  // Download methods
  downloadDailyReport: (date: string) =>
    downloadBlob(`/daily?report_date=${date}`, `reporte_diario_${date}.pdf`),

  downloadSalesReport: (start: string, end: string) =>
    downloadBlob(`/sales?start=${start}&end=${end}`, `reporte_ventas_${start}_${end}.pdf`),

  downloadAdvancedSalesReport: (start: string, end: string) =>
    downloadBlob(`/sales-advanced?start=${start}&end=${end}`, `reporte_ventas_avanzado_${start}_${end}.pdf`),

  downloadCrmReport: (start: string, end: string) =>
    downloadBlob(`/crm?start=${start}&end=${end}`, `reporte_crm_${start}_${end}.pdf`),

  downloadExpensesReport: (start: string, end: string) =>
    downloadBlob(`/expenses?start=${start}&end=${end}`, `reporte_gastos_${start}_${end}.pdf`),

  downloadCashFlowIncomeReport: (start: string, end: string) =>
    downloadBlob(`/cashflow/income?start=${start}&end=${end}`, `reporte_ingresos_caja_${start}_${end}.pdf`),

  downloadCashFlowExpenseReport: (start: string, end: string) =>
    downloadBlob(`/cashflow/expense?start=${start}&end=${end}`, `reporte_egresos_caja_${start}_${end}.pdf`),

  // Preview methods
  getDailyReportData: (date: string) =>
    getReportData(`/daily?report_date=${date}`),

  getSalesReportData: (start: string, end: string) =>
    getReportData(`/sales?start=${start}&end=${end}`),

  getAdvancedSalesReportData: (start: string, end: string) =>
    getReportData(`/sales-advanced?start=${start}&end=${end}`),

  getCrmReportData: (start: string, end: string) =>
    getReportData(`/crm?start=${start}&end=${end}`),

  getExpensesReportData: (start: string, end: string) =>
    getReportData(`/expenses?start=${start}&end=${end}`),

  getCashFlowIncomeData: (start: string, end: string) =>
    getReportData(`/cashflow/income?start=${start}&end=${end}`),

  getCashFlowExpenseData: (start: string, end: string) =>
    getReportData(`/cashflow/expense?start=${start}&end=${end}`),
};
