export interface Coupon { code: string; discountPercent: number; minSpend: number; maxDiscount?: number; }
export const validateCoupon = (c: Coupon, subtotal: number): { valid: boolean; discount: number; error?: string } => {
  if (subtotal < c.minSpend) return { valid: false, discount: 0, error: `Minimum order value ₹${c.minSpend} required` };
  let d = (subtotal * c.discountPercent) / 100;
  if (c.maxDiscount && d > c.maxDiscount) d = c.maxDiscount;
  return { valid: true, discount: Math.round(d) };
};
