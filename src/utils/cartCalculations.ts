import { CartItem } from '../types/cart';
export const updateItemQty = (items: CartItem[], id: string, delta: number): CartItem[] => {
  return items.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item);
};
