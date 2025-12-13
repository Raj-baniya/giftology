import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Product } from '../types';

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

  // Helper function to match cart items including variants
  const matchesItem = (item: CartItem, id: string, size?: string, color?: string) => {
    return item.id === id &&
      item.selectedSize === size &&
      item.selectedColor === color;
  };

  const addToCart = (product: Product, openSidebar: boolean = true) => {
    setCart(prev => {
      // Find existing item with same id AND same size/color combination
      const existing = prev.find(item =>
        matchesItem(item, product.id, product.selectedSize, product.selectedColor)
      );

      if (existing) {
        // Same product with same variant - increment quantity
        return prev.map(item =>
          matchesItem(item, product.id, product.selectedSize, product.selectedColor)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      // New product or different variant - add as new line item
      return [...prev, { ...product, quantity: 1 }];
    });

    // Trigger Santa animation for Christmas theme
    window.dispatchEvent(new CustomEvent('itemAddedToCart'));

    if (openSidebar) {
      setCartOpen(true);
    }
  };

  const removeFromCart = (productId: string, selectedSize?: string, selectedColor?: string) => {
    setCart(prev => prev.filter(item => !matchesItem(item, productId, selectedSize, selectedColor)));
  };

  const updateQuantity = (productId: string, delta: number, selectedSize?: string, selectedColor?: string) => {
    setCart(prev => prev.map(item => {
      if (matchesItem(item, productId, selectedSize, selectedColor)) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
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
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};