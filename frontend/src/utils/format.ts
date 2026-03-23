export const formatCurrency = (value: number | undefined | null): string => {
    const safeValue = value || 0;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(safeValue);
};

export const formatBs = (valueUsd: number | undefined | null, rate: number | null): string => {
    const safeValue = valueUsd || 0;
    if (!rate) return "Bs. 0,00"; // fallback
    
    return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: 'VES',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(safeValue * rate);
};
