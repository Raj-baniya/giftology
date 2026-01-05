export interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  variantId?: string;
}
export interface CartSummary {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
}
