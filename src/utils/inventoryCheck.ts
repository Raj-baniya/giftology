export const isLowStock = (qty: number, threshold = 5): boolean => qty > 0 && qty <= threshold;
