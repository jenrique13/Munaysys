export const formatCurrency = (value: number | undefined | null): string => {
    const safeValue = value || 0;
    return new Intl.NumberFormat('en-DE', {
        style: 'currency',
        currency: 'EUR'
    }).format(safeValue);
};

export const formatBs = (valueBase: number | undefined | null, rate: number | null): string => {
    const safeValue = valueBase || 0;
    if (!rate) return "Bs. 0,00"; // fallback
    
    return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: 'VES',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(safeValue * rate);
};

export const formatMixedCurrency = (eur: number, usd: number): string => {
    const eurStr = formatCurrency(eur);
    if (usd === 0) return eurStr;
    const usdStr = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(usd);
    if (eur === 0) return usdStr;
    return `${eurStr} + ${usdStr}`;
};

export const formatDate = (date: string | Date): string => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
};


