export interface ProductVariant {
  id: string;
  product_id: string;
  color: string;
  size: string;
  size_type: string;
  stock_quantity: number;
  images: string[];
  description?: string; // Per-variant description
}

export interface Product {
  id: string;
  name: string;
  slug?: string;
  price: number;
  category: string;
  subcategory?: string;
  color?: string; // Color name for this product variant (e.g., "Red", "Blue")
  colorVariantGroup?: string; // UUID linking products that are color variants of each other
  imageUrl: string;
  description: string;
  trending?: boolean;
  isFeatured?: boolean; // Mark as Best Seller
  stock?: number;
  images?: string[];
  marketPrice?: number;
  costPrice?: number; // Admin-only cost price for profit calculation
  variants?: ProductVariant[];
  rating?: number;
  reviewCount?: number;
}


export interface CartItem extends Product {
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  selectedVariantId?: string;
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
  readableId?: number; // Auto-incrementing ID for display
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
  deliverySpeed?: 'standard' | 'fast';
  giftWrapping?: string;
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

export interface PlayVideo {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  userId: string;
  createdAt: string;
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  isLiked?: boolean; // For current user
}

export interface PlayComment {
  id: string;
  videoId: string;
  userId: string;
  userName?: string; // Joined
  content: string;
  createdAt: string;
}

export interface PlayLike {
  id: string;
  videoId: string;
  userId: string;
}