import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Product } from '../types';
import { Toast } from '../components/Toast';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, openSidebar?: boolean) => void;
  removeFromCart: (productId: string, selectedSize?: string, selectedColor?: string) => void;
  updateQuantity: (productId: string, delta: number, selectedSize?: string, selectedColor?: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  isCartOpen: boolean;
  setCartOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children?: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; isVisible: boolean }>({
    message: '',
    type: 'success',
    isVisible: false
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type, isVisible: true });
  };

  // Helper function to match cart items including variants
  const matchesItem = (item: CartItem, id: string, size?: string, color?: string) => {
    return item.id === id &&
      item.selectedSize === size &&
      item.selectedColor === color;
  };

  const getStockLimit = (product: Product, size?: string, color?: string): number => {
    if (product.variants && product.variants.length > 0) {
      const variant = product.variants.find(v =>
        (color ? v.color === color : true) &&
        (size ? v.size === size : true)
      );
      return variant ? variant.stock_quantity : 0;
    }
    return product.stock || 0;
  };

  const addToCart = (product: Product, openSidebar: boolean = true) => {
    const p = product as any;
    const stockLimit = getStockLimit(product, p.selectedSize, p.selectedColor);

    // Check against current cart state
    const existing = cart.find(item =>
      matchesItem(item, product.id, p.selectedSize, p.selectedColor)
    );

    const currentQty = existing ? existing.quantity : 0;

    if (currentQty + 1 > stockLimit) {
      showToast(`Only ${stockLimit} items available in stock`, 'error');
      return;
    }

    setCart(prev => {
      if (existing) {
        return prev.map(item =>
          matchesItem(item, product.id, p.selectedSize, p.selectedColor)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });

    window.dispatchEvent(new CustomEvent('itemAddedToCart'));

    if (openSidebar) {
      setCartOpen(true);
    }
  };

  const removeFromCart = (productId: string, selectedSize?: string, selectedColor?: string) => {
    setCart(prev => prev.filter(item => !matchesItem(item, productId, selectedSize, selectedColor)));
  };

  const updateQuantity = (productId: string, delta: number, selectedSize?: string, selectedColor?: string) => {
    setCart(prev => {
      const item = prev.find(i => matchesItem(i, productId, selectedSize, selectedColor));
      if (!item) return prev;

      const stockLimit = getStockLimit(item, selectedSize, selectedColor);
      const newQty = item.quantity + delta;

      if (newQty > stockLimit) {
        showToast(`Only ${stockLimit} items available in stock`, 'error');
        return prev;
      }

      if (newQty < 1) return prev; // Or remove? Usually min is 1.

      return prev.map(i => {
        if (matchesItem(i, productId, selectedSize, selectedColor)) {
          return { ...i, quantity: newQty };
        }
        return i;
      });
    });
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart, updateQuantity, clearCart,
      cartTotal, cartCount, isCartOpen, setCartOpen
    }}>
      {children}
      <Toast
        message={toast.message}
        isVisible={toast.isVisible}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};