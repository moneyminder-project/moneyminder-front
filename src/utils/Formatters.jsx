export const formatNumber = (num) => {
    if (num === null || num === undefined || num === '') {
        return '–';
    }

    if (typeof num === 'string') {
        num = num.replace(/\./g, '').replace(',', '.');
        num = parseFloat(num);
    }

    if (isNaN(num)) {
        return '–';
    }

    return new Intl.NumberFormat('es-ES', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true,
    }).format(num);
};

export const formatDate = (dateString) => {
    if (dateString) {
        const [year, month, day] = dateString.split('-');
        return `${day}-${month}-${year}`;
    }
    return null;
};

export const formatInteger = (value) => {
    if (value === null || value === undefined || value === '') {
        return '–';
    }

    if (typeof value === 'string') {
        value = value.replace(/\./g, '');
        value = parseInt(value, 10);
    }

    if (isNaN(value)) {
        return '–';
    }

    return new Intl.NumberFormat('es-ES', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        useGrouping: true,
    }).format(value);
};
