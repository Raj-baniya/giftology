import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { CartItem, Product } from '../types';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';
import { store } from '../services/store';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product & { selectedSize?: string; selectedColor?: string }, openSidebar?: boolean) => void;
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
  const { user } = useAuth(); // Get authenticated user

  /* --- STABILITY FIX: Use Ref to track real-time state (Prevent Race Conditions) --- */
  const cartRef = useRef<CartItem[]>([]);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  // Helper to match cart items including variants (handles null/undefined equality)
  const matchesItem = (item: CartItem, id: string, size?: string, color?: string) => {
    const normalize = (val?: string | null) => (!val ? '' : val); // Treat null/undefined/'' as same
    return item.id === id &&
      normalize(item.selectedSize) === normalize(size) &&
      normalize(item.selectedColor) === normalize(color);
  };

  // 1. Fetch Cart on Login
  useEffect(() => {
    if (!user) return;

    const fetchCart = async () => {
      // Step 1: Fetch cart items
      const { data: cartData, error } = await supabase
        .from('cart_items')
        .select('product_id, quantity, selected_size, selected_color')
        .eq('user_id', user.id);

      if (error) {
        console.error('CartContext: Error fetching cart:', error);
        return;
      }

      if (cartData && cartData.length > 0) {
        const allProducts = await store.getProducts();

        // Step 2: Hydrate and Deduplicate
        const uniqueMap = new Map<string, CartItem>();

        cartData.forEach(item => {
          // Find product
          const product = allProducts.find(p =>
            p.id === item.product_id ||
            p.id === item.product_id.replace(/^0+/, '') ||
            p.id.replace(/^0+/, '') === item.product_id.replace(/^0+/, '')
          );

          if (product) {
            const size = item.selected_size || ''; // Normalize null to empty string
            const color = item.selected_color || '';
            const compoundKey = `${product.id}-${size}-${color}`;
            const qty = Number(item.quantity);

            if (uniqueMap.has(compoundKey)) {
              // Merge duplicate
              const existing = uniqueMap.get(compoundKey)!;
              existing.quantity += qty;
            } else {
              uniqueMap.set(compoundKey, {
                ...product,
                quantity: qty,
                selectedSize: item.selected_size,
                selectedColor: item.selected_color,
              } as CartItem);
            }
          }
        });

        /* --- SELF-HEALING: Auto-Correct Invalid Quantities --- */
        const sanitizedItems: CartItem[] = [];

        for (const item of uniqueMap.values()) {
          // Determine Stock Limit
          let stockLimit = (typeof item.stock === 'number') ? item.stock : 0;

          // Variant Override
          if ((item.selectedSize || item.selectedColor) && item.variants?.length) {
            const v = item.variants.find(v =>
              (item.selectedColor ? v.color === item.selectedColor : true) &&
              (item.selectedSize ? v.size === item.selectedSize : true)
            );
            if (v) stockLimit = Number(v.stock_quantity);
          }

          // AUTO-FIX: If quantity exceeds stock, cap it immediately
          if (item.quantity > stockLimit && stockLimit > 0) {
            console.warn(`[CartContext] Auto-Correcting limit breach: ${item.name} (${item.quantity} -> ${stockLimit})`);

            // Fix in DB
            await supabase.from('cart_items')
              .update({ quantity: stockLimit })
              .eq('user_id', user.id)
              .eq('product_id', item.id) // Note: This might need more specific matching if duplicates existed, but dedupe handles memory state
              .is('selected_size', item.selectedSize || null)
              .is('selected_color', item.selectedColor || null);

            item.quantity = stockLimit;
          }

          if (item.quantity > 0) {
            sanitizedItems.push(item);
          }
        }

        setCart(sanitizedItems);
        console.log('CartContext: Cart hydrated, deduplicated, and sanitized');
      } else {
        setCart([]);
      }
    };

    fetchCart();
  }, [user]);

  const addToCart = async (product: Product & { selectedSize?: string; selectedColor?: string }, openSidebar: boolean = true) => {
    // USE REF FOR REAL-TIME STATE (Prevent Click Spamming)
    const currentCart = cartRef.current;

    // Check stock limit before adding
    // Sum up quantity of ALL matching items (to handle potential duplicate rows)
    const matchingItems = currentCart.filter(item =>
      matchesItem(item, product.id, product.selectedSize, product.selectedColor)
    );
    const currentQty = matchingItems.reduce((sum, item) => sum + Number(item.quantity), 0);

    // Determine the specific stock limit
    let stockLimit = typeof product.stock === 'number' ? product.stock : 0;

    // If a variant is selected, use the variant's stock
    if ((product.selectedSize || product.selectedColor) && product.variants && product.variants.length > 0) {
      const variant = product.variants.find(v =>
        (product.selectedColor ? v.color === product.selectedColor : true) &&
        (product.selectedSize ? v.size === product.selectedSize : true)
      );
      if (variant) {
        stockLimit = Number(variant.stock_quantity);
      }
    }

    if (currentQty >= stockLimit) {
      // Dispatch custom event for styled alert (handled by App.tsx)
      console.warn(`CartContext: Stock Limit Reached. Qty: ${currentQty}, Limit: ${stockLimit}`);
      window.dispatchEvent(new CustomEvent('showStockAlert', {
        detail: { stock: stockLimit }
      }));
      return; // Block add
    }

    // 1. Optimistic Update (Local State)
    setCart(prev => {
      const existing = prev.find(item =>
        matchesItem(item, product.id, product.selectedSize, product.selectedColor)
      );
      if (existing) {
        return prev.map(item =>
          matchesItem(item, product.id, product.selectedSize, product.selectedColor)
            ? { ...item, quantity: Math.min(Number(item.quantity) + 1, stockLimit) }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });

    // 2. DB Sync (if user)
    if (user) {
      try {
        const selectedSize = product.selectedSize || null;
        const selectedColor = product.selectedColor || null;

        console.log('CartContext: Saving to DB', { userId: user.id, productId: product.id });

        // First check if it exists to get current quantity
        const { data: existingItem, error: fetchError } = await supabase
          .from('cart_items')
          .select('quantity')
          .eq('user_id', user.id)
          .eq('product_id', product.id)
          .is('selected_size', selectedSize)
          .is('selected_color', selectedColor)
          .maybeSingle();

        if (fetchError) {
          console.error('CartContext: Error checking existing item:', fetchError);
        }

        const newQuantity = (existingItem?.quantity || 0) + 1;

        const { error } = await supabase
          .from('cart_items')
          .upsert({
            user_id: user.id,
            product_id: product.id,
            quantity: newQuantity,
            selected_size: selectedSize,
            selected_color: selectedColor
          }, { onConflict: 'user_id, product_id, selected_size, selected_color' });

        if (error) {
          console.error('Error updating cart in DB:', error);
          alert(`Failed to save cart: ${error.message}`); // Temporary alert to debug
        } else {
          console.log('CartContext: Saved to DB successfully');
        }

      } catch (err: any) {
        console.error('Cart sync error:', err);
        alert(`Cart Error: ${err.message}`);
      }
    }

    // Trigger Santa animation for Christmas theme
    window.dispatchEvent(new CustomEvent('itemAddedToCart'));

    if (openSidebar) {
      setCartOpen(true);
    }
  };

  const removeFromCart = async (productId: string, selectedSize?: string, selectedColor?: string) => {
    // Optimistic Update
    setCart(prev => prev.filter(item => !matchesItem(item, productId, selectedSize, selectedColor)));

    // DB Sync
    if (user) {
      try {
        // Try with raw ID first, then cleaned ID (handle both "00005" and "5")
        const rawId = productId;
        const cleanId = String(productId).replace(/^0+/, '') || '0';

        // Delete using raw ID
        const { error: rawError } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', rawId)
          .is('selected_size', selectedSize || null)
          .is('selected_color', selectedColor || null);

        // If raw ID didn't match, try cleaned ID
        if (rawError || rawId !== cleanId) {
          await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', user.id)
            .eq('product_id', cleanId)
            .is('selected_size', selectedSize || null)
            .is('selected_color', selectedColor || null);
        }

        console.log('CartContext: Removed item from DB');
      } catch (err) {
        console.error('Error deleting from cart DB:', err);
      }
    }
  };

  const updateQuantity = async (productId: string, delta: number, selectedSize?: string, selectedColor?: string) => {
    // Find current item to check quantity
    const currentItem = cart.find(item => matchesItem(item, productId, selectedSize, selectedColor));

    if (!currentItem) return;

    // Ensure numeric values
    const currentQty = Number(currentItem.quantity);
    const numericDelta = Number(delta);
    const newQty = currentQty + numericDelta;

    // Determine the specific stock limit (Variant Aware)
    // Default to 0 if unknown to prevent "infinite" adds bug
    let stockLimit = (typeof currentItem.stock === 'number') ? currentItem.stock : 0;

    // Debug Log
    console.log(`[CartContext] UpdateQty: ${productId} | Current: ${currentQty} | Delta: ${numericDelta} | New: ${newQty} | BaseStock: ${currentItem.stock} -> Limit: ${stockLimit}`);

    if ((selectedSize || selectedColor) && currentItem.variants && currentItem.variants.length > 0) {
      const variant = currentItem.variants.find(v =>
        (selectedColor ? v.color === selectedColor : true) &&
        (selectedSize ? v.size === selectedSize : true)
      );
      if (variant) {
        stockLimit = Number(variant.stock_quantity);
        console.log(`[CartContext] Variant Found: ${variant.color}/${variant.size} | Stock: ${variant.stock_quantity} -> Limit: ${stockLimit}`);
      }
    }

    // If quantity would be 0 or less, remove the item instead
    if (newQty <= 0) {
      await removeFromCart(productId, selectedSize, selectedColor);
      return;
    }

    // Check stock limit when increasing
    if (numericDelta > 0 && newQty > stockLimit) {
      // Dispatch custom event for styled alert (handled by App.tsx)
      console.warn(`CartContext: Stock Limit Reached. Qty: ${newQty}, Limit: ${stockLimit}`);
      window.dispatchEvent(new CustomEvent('showStockAlert', {
        detail: { stock: stockLimit }
      }));
      return; // Don't increase beyond stock
    }

    // Optimistic Update
    setCart(prev => prev.map(item => {
      if (matchesItem(item, productId, selectedSize, selectedColor)) {
        return { ...item, quantity: newQty };
      }
      return item;
    }));

    // DB Sync
    if (user) {
      try {
        const rawId = productId;
        const cleanId = String(productId).replace(/^0+/, '') || '0';

        // Try raw ID first
        const { error: rawError } = await supabase
          .from('cart_items')
          .update({ quantity: newQty })
          .eq('user_id', user.id)
          .eq('product_id', rawId)
          .is('selected_size', selectedSize || null)
          .is('selected_color', selectedColor || null);

        // If raw ID didn't work, try cleaned ID
        if (rawError || rawId !== cleanId) {
          await supabase
            .from('cart_items')
            .update({ quantity: newQty })
            .eq('user_id', user.id)
            .eq('product_id', cleanId)
            .is('selected_size', selectedSize || null)
            .is('selected_color', selectedColor || null);
        }
      } catch (err) {
        console.error('Error updating cart QTY in DB:', err);
      }
    }
  };

  const clearCart = async () => {
    setCart([]);
    if (user) {
      await supabase.from('cart_items').delete().eq('user_id', user.id);
    }
  };

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