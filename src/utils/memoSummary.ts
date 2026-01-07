import { CartItem, CartSummary } from '../types/cart';
export const computeCartSummary = (items: CartItem[], discount = 0): CartSummary => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.18);
  const total = Math.max(0, subtotal + tax - discount);
  return { subtotal, tax, discount, total };
};
