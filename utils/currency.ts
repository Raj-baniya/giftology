// Currency formatting utility for Indian Rupee
export const formatIndianCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    })}`;
};

export const formatIndianCurrencyWithDecimals = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
};

// Rupee symbol constant
export const RUPEE_SYMBOL = '₹';

// HTML entity for Rupee (for use in HTML)
export const RUPEE_HTML = '&#8377;';
