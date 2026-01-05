export const formatINR = (amount: number): string => `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
export const calculateTax = (subtotal: number, rate = 0.18): number => Math.round(subtotal * rate);
