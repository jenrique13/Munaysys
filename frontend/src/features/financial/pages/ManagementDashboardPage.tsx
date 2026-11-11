import React, { useEffect, useState } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
    PieChart, Pie, Cell 
} from 'recharts';
import { 
    TrendingUp, Users, DollarSign, PieChart as PieIcon, 
    Building2, Calendar, Filter, ChevronDown, Download,
    ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { useFinancialStore } from '../hooks/useFinancialStore';
import { useAuthStore } from '../../auth/hooks/useAuthStore';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const formatCurrency = (val: number) => 
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val);

const ManagementDashboardPage: React.FC = () => {
    const { managementDashboard, fetchManagementDashboard, isLoading } = useFinancialStore();
    const { user } = useAuthStore();
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        fetchManagementDashboard(selectedMonth, selectedYear);
    }, [selectedMonth, selectedYear]);

    const pivotPerformance = () => {
        if (!managementDashboard?.mayor_nest_performance) return [];
        
        const branchNames = Object.keys(managementDashboard.mayor_nest_performance);
        const pivot = [];
        
        for (let mIdx = 1; mIdx <= 12; mIdx++) {
            const monthName = months[mIdx - 1];
            const row: any = { month: monthName, branches: {} };
            
            branchNames.forEach(branch => {
                const monthData = managementDashboard.mayor_nest_performance[branch].find((p: any) => p.month_idx === mIdx);
                row.branches[branch] = monthData || { income: 0, expenses: 0, balance: 0, profitability: 0 };
            });
            pivot.push(row);
        }
        return pivot;
    };

    const performanceData = pivotPerformance();
    const branchNames = Object.keys(managementDashboard?.mayor_nest_performance || {});

    if (isLoading && !managementDashboard) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }


    const handleExportPDF = () => {
        const element = document.createElement('div');
        // A4 landscape is ~297mm. At 96dpi, that's ~1122px. 
        // We'll use 1080px to be safe with margins.
        element.style.width = '1080px';
        element.className = 'p-12 bg-white space-y-10';
        
        // Add Print-specific CSS
        const style = document.createElement('style');
        style.innerHTML = `
            @page { size: landscape; margin: 0; }
            .pdf-report { font-family: "Inter", sans-serif; color: #111; line-height: 1.4; }
            .pdf-report h1 { color: #111; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.05em; }
            .pdf-report table { width: 100%; border-collapse: collapse; font-size: 8px !important; margin-bottom: 20px; }
            .pdf-report th, .pdf-report td { border: 1px solid #e2e8f0; padding: 6px 4px !important; }
            .pdf-report .sticky { position: static !important; }
            .pdf-report .bg-gray-50 { background-color: #f8fafc !important; }
            .pdf-report .bg-gray-900 { background-color: #0f172a !important; color: white !important; }
            .pdf-report .shadow-xl, .pdf-report .shadow-sm, .pdf-report .shadow-md { box-shadow: none !important; }
            
            /* Breakdown Cards Grid */
            .pdf-breakdown-grid { 
                display: flex; 
                flex-wrap: wrap; 
                gap: 20px; 
                width: 100%;
            }
            .pdf-breakdown-card { 
                width: calc(33.33% - 14px); /* 3 cards per row */
                min-width: 320px;
                page-break-inside: avoid; 
                border: 1px solid #e2e8f0 !important; 
                border-radius: 12px;
                overflow: hidden;
            }
            @media (max-width: 1000px) {
                .pdf-breakdown-card { width: calc(50% - 10px); }
            }

            .pdf-report .text-2xl { font-size: 20px !important; }
            .pdf-report .text-xl { font-size: 16px !important; }
            .pdf-report .text-sm { font-size: 10px !important; }
            .pdf-report .text-xs { font-size: 9px !important; }
            .pdf-report .tabular-nums { font-variant-numeric: tabular-nums; }
            .pdf-report * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        `;
        element.appendChild(style);
        element.classList.add('pdf-report');
        
        // Add Title
        const header = document.createElement('div');
        header.className = 'text-center border-b-4 border-indigo-600 pb-6 mb-8';
        header.innerHTML = `
            <h1 style="font-size: 28px; font-weight: 900; margin-bottom: 8px;">REPORTE FINANCIERO GERENCIAL</h1>
            <p style="font-size: 14px; color: #64748b; font-weight: 600;">Balance Anual y Desglose Operativo - Gestión ${selectedYear}</p>
        `;
        element.appendChild(header);

        // Clone Annual Table
        const tableSection = document.getElementById('annual-balance-report')?.cloneNode(true) as HTMLElement;
        if (tableSection) {
            const h2 = document.createElement('h2');
            h2.innerHTML = '<span style="color: #4f46e5;">01.</span> MAYOR NEST COWORKING - BALANCE ANUAL';
            h2.className = 'text-xl font-black mb-6 flex items-center gap-2';
            element.appendChild(h2);
            
            const scrollDiv = tableSection.querySelector('.overflow-x-auto');
            if (scrollDiv) scrollDiv.className = 'w-full';
            
            // Adjust table for PDF - possibly scale down if too many columns
            const table = tableSection.querySelector('table');
            if (table) {
                table.style.width = '100%';
                table.style.tableLayout = 'fixed';
                // If many branches, scale down further
                if (branchNames.length > 3) {
                    table.style.fontSize = '7px';
                }
            }

            tableSection.querySelectorAll('.sticky').forEach(el => {
                (el as HTMLElement).style.position = 'static';
                (el as HTMLElement).style.backgroundColor = '#f8fafc';
            });

            element.appendChild(tableSection);
        }

        // Clone Breakdown
        const breakdownSection = document.getElementById('detailed-breakdown-report')?.cloneNode(true) as HTMLElement;
        if (breakdownSection) {
            const pageBreak = document.createElement('div');
            pageBreak.style.pageBreakBefore = 'always';
            element.appendChild(pageBreak);

            const h2 = document.createElement('h2');
            h2.innerHTML = '<span style="color: #4f46e5;">02.</span> DESGLOSE DETALLADO POR SEDE';
            h2.className = 'text-xl font-black mb-6 mt-10';
            element.appendChild(h2);
            
            // Layout cards in a clean grid
            const gridContainer = document.createElement('div');
            gridContainer.className = 'pdf-breakdown-grid';
            
            const cards = breakdownSection.querySelectorAll('[class*="min-w-"]');
            cards.forEach(card => {
                const pdfCard = card.cloneNode(true) as HTMLElement;
                pdfCard.className = 'pdf-breakdown-card bg-white';
                pdfCard.style.minWidth = 'auto';
                pdfCard.style.flexShrink = '0';
                // Remove snap and scroll classes
                pdfCard.classList.remove('snap-center', 'flex-shrink-0');
                gridContainer.appendChild(pdfCard);
            });

            element.appendChild(gridContainer);
        }

        const opt = {
            margin:       [0, 0, 0, 0] as [number, number, number, number],
            filename:     `REPORTE_GERENCIAL_MUNAYSYS_${selectedYear}.pdf`,
            image:        { type: 'jpeg' as const, quality: 1.0 },
            html2canvas:  { 
                scale: 2, 
                useCORS: true,
                letterRendering: true,
                width: 1080
            },
            jsPDF:        { unit: 'px', format: [1080, 1527] as [number, number], orientation: 'landscape' as const }
        };

        html2pdf().set(opt).from(element).save();
    };

    if (!managementDashboard) return null;


    return (
        <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard Gerencial</h1>
                    <p className="text-gray-500">Visión global y balance general del negocio</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 px-4 border-r border-gray-100">
                            <Calendar className="w-4 h-4 text-indigo-500" />
                            <select 
                                value={selectedYear} 
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="bg-transparent border-none text-sm font-bold focus:ring-0 cursor-pointer"
                            >
                                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <button 
                            onClick={handleExportPDF}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
                        >
                            <Download className="w-4 h-4" />
                            Exportar PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Income Trend Bar Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-500" />
                            Ingresos Mensuales por Sede
                        </h3>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={managementDashboard.income_trend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    cursor={{fill: '#f9fafb'}}
                                />
                                <Legend iconType="circle" />
                                {Object.keys(managementDashboard.income_trend[0] || {})
                                    .filter(k => k !== 'month')
                                    .map((branch, i) => (
                                        <Bar key={branch} dataKey={branch} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
                                    ))
                                }
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Orders Distribution Pie Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <PieIcon className="w-5 h-5 text-indigo-500" />
                            Órdenes por Sede
                        </h3>
                    </div>
                    <div className="h-80 flex flex-col items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={managementDashboard.orders_by_branch}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="count"
                                    nameKey="branch"
                                >
                                    {managementDashboard.orders_by_branch.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend layout="vertical" align="right" verticalAlign="middle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-indigo-600 rounded-full"></div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">MAYOR NEST COWORKING - BALANCE ANUAL {selectedYear}</h2>
                </div>

                <div id="annual-balance-report" className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th rowSpan={2} className="sticky left-0 z-20 bg-gray-50 px-6 py-6 font-black text-gray-900 uppercase tracking-wider border-r border-gray-200 min-w-[150px]">
                                        Mes
                                    </th>
                                    {branchNames.map((branch, i) => (
                                        <th key={branch} colSpan={4} className={`px-6 py-4 text-center font-black uppercase tracking-widest border-r border-gray-200 ${i % 2 === 0 ? 'text-indigo-600 bg-indigo-50/30' : 'text-emerald-600 bg-emerald-50/30'}`}>
                                            <div className="flex items-center justify-center gap-2">
                                                <Building2 className="w-4 h-4" />
                                                {branch}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                                <tr className="bg-gray-50/50">
                                    {branchNames.map((branch) => (
                                        <React.Fragment key={branch}>
                                            <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase text-right bg-white/50">Ingresos</th>
                                            <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase text-right bg-white/50">Egresos</th>
                                            <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase text-right bg-white/50">Balance</th>
                                            <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase text-center border-r border-gray-200 bg-white/50">% Rent.</th>
                                        </React.Fragment>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {performanceData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-indigo-50/30 transition-colors group">
                                        <td className="sticky left-0 z-10 bg-white group-hover:bg-indigo-50/30 font-bold text-gray-700 px-6 py-4 border-r border-gray-100 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] transition-colors">
                                            {row.month}
                                        </td>
                                        {branchNames.map((branch) => {
                                            const data = row.branches[branch];
                                            return (
                                                <React.Fragment key={branch}>
                                                    <td className="px-4 py-4 text-right text-emerald-600 font-bold tabular-nums">{formatCurrency(data.income)}</td>
                                                    <td className="px-4 py-4 text-right text-rose-500 font-medium tabular-nums">{formatCurrency(data.expenses)}</td>
                                                    <td className={`px-4 py-4 text-right font-black tabular-nums ${data.balance >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                                                        {formatCurrency(data.balance)}
                                                    </td>
                                                    <td className="px-4 py-4 text-center border-r border-gray-100">
                                                        <span className={`inline-flex items-center justify-center w-12 py-1 rounded-lg text-[10px] font-black ${
                                                            data.profitability > 30 ? 'bg-emerald-100 text-emerald-700' : 
                                                            data.profitability > 10 ? 'bg-blue-100 text-blue-700' : 
                                                            'bg-rose-100 text-rose-700'
                                                        }`}>
                                                            {data.profitability}%
                                                        </span>
                                                    </td>
                                                </React.Fragment>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-900 text-white font-black">
                                <tr>
                                    <td className="sticky left-0 z-10 bg-gray-900 px-6 py-6 uppercase text-xs tracking-widest border-r border-gray-800">TOTALES</td>
                                    {branchNames.map((branch) => {
                                        const branchData = performanceData.map(r => r.branches[branch]);
                                        const totalInc = branchData.reduce((s, r) => s + r.income, 0);
                                        const totalExp = branchData.reduce((s, r) => s + r.expenses, 0);
                                        const totalBal = totalInc - totalExp;
                                        const totalRent = totalInc > 0 ? (totalBal / totalInc * 100) : 0;
                                        
                                        return (
                                            <React.Fragment key={branch}>
                                                <td className="px-4 py-6 text-right text-emerald-400 tabular-nums">{formatCurrency(totalInc)}</td>
                                                <td className="px-4 py-6 text-right text-rose-300 tabular-nums">{formatCurrency(totalExp)}</td>
                                                <td className="px-4 py-6 text-right text-indigo-200 tabular-nums">{formatCurrency(totalBal)}</td>
                                                <td className="px-4 py-6 text-center border-r border-gray-800 tabular-nums">{Math.round(totalRent)}%</td>
                                            </React.Fragment>
                                        );
                                    })}
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>

            {/* MONTHLY DETAILED TABLES */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-1 bg-emerald-500 rounded-full"></div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Desglose Detallado por Sede</h2>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 px-3">
                            <Calendar className="w-4 h-4 text-emerald-500" />
                            <select 
                                value={selectedMonth} 
                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                className="bg-transparent border-none text-sm font-black focus:ring-0 cursor-pointer"
                            >
                                {months.map((m, i) => <option key={i+1} value={i+1}>{m} {selectedYear}</option>)}
                            </select>
                        </div>
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition shadow-md shadow-indigo-100">
                            <Download className="w-3.5 h-3.5" />
                            Exportar
                        </button>
                    </div>
                </div>

                <div id="detailed-breakdown-report" className="flex flex-row overflow-x-auto gap-8 pb-6 snap-x">
                    {managementDashboard.monthly_details.map((detail, idx) => (
                        <div key={idx} className="min-w-[380px] flex-shrink-0 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden snap-center">
                            <div className="p-5 border-b border-gray-50 bg-gradient-to-r from-indigo-50 to-white flex items-center justify-between">
                                <h3 className="font-black text-indigo-900 text-lg uppercase tracking-tight flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-indigo-600" />
                                    {detail.branch_name}
                                </h3>
                                <div className="bg-emerald-500 w-2 h-2 rounded-full animate-pulse"></div>
                            </div>
                            
                            <div className="p-6 space-y-8">
                                {/* Income Section */}
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Activity className="w-3 h-3 text-emerald-500" />
                                            Ingresos por Categoría
                                        </h4>
                                        <div className="space-y-2">
                                            {detail.income_by_category.map((c: any, i: number) => (
                                                <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                                                    <span className="text-xs font-bold text-gray-500">{c.category}</span>
                                                    <span className="text-sm font-black text-gray-900 tabular-nums">{formatCurrency(c.amount)}</span>
                                                </div>
                                            ))}
                                            {detail.income_by_category.length === 0 && <p className="text-xs italic text-gray-400 p-2 text-center">Sin ingresos este periodo</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <DollarSign className="w-3 h-3 text-blue-500" />
                                            Métodos de Ingreso
                                        </h4>
                                        <div className="space-y-2">
                                            {detail.income_by_method.map((m: any, i: number) => (
                                                <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-blue-50/30 hover:bg-blue-50/50 transition-colors">
                                                    <span className="text-xs font-bold text-blue-600/70 uppercase">{m.method}</span>
                                                    <span className="text-sm font-black text-blue-900 tabular-nums">{formatCurrency(m.amount)}</span>
                                                </div>
                                            ))}
                                            {detail.income_by_method.length === 0 && <p className="text-xs italic text-gray-400 p-2 text-center">Sin métodos registrados</p>}
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent"></div>

                                {/* Expenses Section */}
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <h4 className="text-[10px] font-black text-rose-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <ArrowDownRight className="w-3 h-3 text-rose-500" />
                                            Egresos por Categoría
                                        </h4>
                                        <div className="space-y-2">
                                            {detail.expenses_by_category.map((c: any, i: number) => (
                                                <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-rose-50/20 hover:bg-rose-50/40 transition-colors">
                                                    <span className="text-xs font-bold text-rose-700/60">{c.category}</span>
                                                    <span className="text-sm font-black text-rose-900 tabular-nums">{formatCurrency(c.amount)}</span>
                                                </div>
                                            ))}
                                            {detail.expenses_by_category.length === 0 && <p className="text-xs italic text-gray-400 p-2 text-center">Sin egresos este periodo</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-[10px] font-black text-rose-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Filter className="w-3 h-3 text-orange-500" />
                                            Métodos de Egreso
                                        </h4>
                                        <div className="space-y-2">
                                            {detail.expenses_by_method.map((m: any, i: number) => (
                                                <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-gray-50/50 hover:bg-gray-100 transition-colors">
                                                    <span className="text-xs font-bold text-gray-500 uppercase">{m.method}</span>
                                                    <span className="text-sm font-black text-gray-900 tabular-nums">{formatCurrency(m.amount)}</span>
                                                </div>
                                            ))}
                                            {detail.expenses_by_method.length === 0 && <p className="text-xs italic text-gray-400 p-2 text-center">Sin métodos registrados</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ManagementDashboardPage;
