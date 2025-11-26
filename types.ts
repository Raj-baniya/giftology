export interface Product {
  id: string;
  name: string;
  slug?: string;
  price: number;
  category: string;
  imageUrl: string;
  description: string;
  trending?: boolean;
  stock?: number;
  images?: string[];
  marketPrice?: number;
  costPrice?: number; // Admin-only cost price for profit calculation
}

export interface CartItem extends Product {
  quantity: number;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  joinDate: string;
  role: 'user' | 'admin';
}

export interface Order {
  id: string;
  userId: string | null; // Allow null for guests
  date: string;
  items: CartItem[];
  total: number;
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  // New Fields
  customerName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  deliveryDate?: string;
  deliveryTime?: string;
  deliveryType?: string;
  paymentMethod?: 'upi' | 'cod';
  screenshot?: string; // Base64 string for UPI
  shippingAddress?: any;
  guestInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
}