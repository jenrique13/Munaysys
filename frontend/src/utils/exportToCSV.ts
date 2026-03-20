export const exportToCSV = (data: any[], filename: string) => {
    if (!data || !data.length) return;

    // Get headers from first object
    const headers = Object.keys(data[0]);

    // Convert to CSV string
    const csvContent = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header => {
                const value = row[header];
                // Escape quotes and wrap in quotes if contains comma
                if (typeof value === 'string') {
                    const escaped = value.replace(/"/g, '""');
                    if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
                        return `"${escaped}"`;
                    }
                    return escaped;
                }
                return value !== null && value !== undefined ? value : '';
            }).join(',')
        )
    ].join('\n');

    // Create Blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
