import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { store } from '../services/store';
import { Icons } from './ui/Icons';
import { calculatePointsForPrice, calculateCartRewardPoints } from '../utils/rewardUtils';

export const CartDrawer = () => {
  const { cart, isCartOpen, setCartOpen, removeFromCart, updateQuantity, cartTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState<any>(null);

  // Fetch user address
  useEffect(() => {
    if (user && isCartOpen) {
      store.getUserAddresses(user.id).then(addresses => {
        if (addresses && addresses.length > 0) {
          setAddress(addresses[0]);
        }
      });
    }
  }, [user, isCartOpen]);

  // Calculate totals
  const marketPriceTotal = cart.reduce((sum, item) => {
    const marketPrice = item.marketPrice || item.price;
    return sum + (marketPrice * item.quantity);
  }, 0);
  const totalSavings = marketPriceTotal - cartTotal;
  const deliveryCharges = cartTotal > 500 ? 0 : 40;
  const finalAmount = cartTotal + deliveryCharges;

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 bg-black z-[60]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full md:max-w-md bg-gray-50 z-[70] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="bg-white p-4 flex items-center gap-4 shadow-sm z-10">
              <button onClick={() => setCartOpen(false)} className="p-1">
                <Icons.ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="font-bold text-lg">My Cart</h2>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pb-24">
              {/* Address Section */}
              {user && (
                <div className="bg-white p-4 mb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-gray-600">Deliver to:</span>
                        <span className="font-bold text-sm">{user.displayName || 'User'}, {address?.zipCode || ''}</span>
                        <span className="bg-gray-100 text-xs px-1 rounded text-gray-500">HOME</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate max-w-[250px]">
                        {address ? `${address.address}, ${address.city}, ${address.state}` : 'Add an address to proceed'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setCartOpen(false);
                        navigate('/account');
                      }}
                      className="text-blue-600 text-sm font-bold border border-gray-200 px-3 py-1 rounded"
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}

              {/* Cart Items */}
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-textMuted">
                  <Icons.ShoppingBag className="w-16 h-16 mb-4 text-accent animate-float" />
                  <p className="text-lg">Your cart is empty</p>
                  <button
                    onClick={() => setCartOpen(false)}
                    className="mt-4 text-primary font-semibold hover:underline"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item) => {
                    const discount = item.marketPrice ? Math.round(((item.marketPrice - item.price) / item.marketPrice) * 100) : 0;

                    return (
                      <div key={item.id} className="bg-white p-4">
                        <div className="flex gap-4 mb-4">
                          {/* Image */}
                          <div className="w-20 h-20 shrink-0 border border-gray-100 rounded p-1">
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{item.name}</h3>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {item.selectedColor && (
                                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium border border-gray-200">
                                  {item.selectedColor}
                                </span>
                              )}
                              {item.selectedSize && (
                                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium border border-gray-200">
                                  Size: {item.selectedSize}
                                </span>
                              )}
                            </div>

                            {/* Rating placeholder */}
                            <div className="flex items-center gap-1 mb-2">
                              <div className="bg-green-600 text-white text-[10px] px-1 rounded flex items-center gap-0.5">
                                4.2 <Icons.Star className="w-2 h-2 fill-current" />
                              </div>
                              <span className="text-xs text-gray-500">(5)</span>
                            </div>

                            {/* Price */}
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg">&#8377;{(item.price * item.quantity).toLocaleString()}</span>
                              {item.marketPrice && item.marketPrice > item.price && (
                                <>
                                  <span className="text-xs text-gray-500 line-through">&#8377;{(item.marketPrice * item.quantity).toLocaleString()}</span>
                                  <span className="text-xs text-green-600 font-bold">{discount}% off</span>
                                </>
                              )}
                            </div>
                            <div className="text-xs text-amber-600 font-medium mt-1 flex items-center gap-1">
                              <Icons.Star className="w-3 h-3 fill-amber-500" />
                              Earn {calculatePointsForPrice(item.price) * item.quantity} pts
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex border-t border-gray-100 pt-3 gap-4">
                          <div className="flex items-center gap-3 border border-gray-200 rounded px-2 py-1">
                            <button onClick={() => updateQuantity(item.id, -1, item.selectedSize, item.selectedColor)} className="w-6 h-6 flex items-center justify-center font-bold text-gray-600">-</button>
                            <span className="text-sm font-bold">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1, item.selectedSize, item.selectedColor)} className="w-6 h-6 flex items-center justify-center font-bold text-gray-600">+</button>
                          </div>
                          <button onClick={() => removeFromCart(item.id, item.selectedSize, item.selectedColor)} className="flex-1 text-sm font-medium text-gray-900 border border-gray-200 rounded py-1 hover:bg-gray-50">Remove</button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Price Details */}
                  <div className="bg-white p-4 mt-2">
                    <h3 className="font-bold text-gray-500 text-sm mb-4 uppercase">Price Details</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>Price ({cart.reduce((acc, item) => acc + item.quantity, 0)} items)</span>
                        <span>&#8377;{marketPriceTotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-&#8377;{totalSavings.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery Charges</span>
                        <span>
                          {deliveryCharges === 0 ? (
                            <span className="text-green-600">Free</span>
                          ) : (
                            <span>&#8377;{deliveryCharges}</span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-amber-600 font-medium">
                        <span>Reward Points to Earn</span>
                        <span>+{calculateCartRewardPoints(cart)} pts</span>
                      </div>
                      <div className="border-t border-dashed border-gray-200 my-2"></div>
                      <div className="flex justify-between font-bold text-base">
                        <span>Total Amount</span>
                        <span>&#8377;{finalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                    {totalSavings > 0 && (
                      <div className="mt-3 text-green-600 text-sm font-medium border-t border-gray-100 pt-3">
                        You will save &#8377;{totalSavings.toLocaleString()} on this order
                      </div>
                    )}
                  </div>

                  {/* Continue to Checkout Button (In-list) */}
                  <div className="p-4 bg-white mt-2">
                    <button
                      onClick={() => {
                        setCartOpen(false);
                        navigate('/checkout');
                      }}
                      className="w-full bg-yellow-400 text-black py-3 rounded-lg font-bold hover:bg-yellow-500 transition-colors"
                    >
                      Continue to Checkout
                    </button>
                  </div>

                  {/* Safe Payments Badge */}
                  <div className="p-4 flex items-center gap-3 text-xs text-gray-500 bg-white mt-2">
                    <Icons.Shield className="w-8 h-8 text-gray-400" />
                    <p>Safe and secure payments. Easy returns. 100% Authentic products.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Bottom Bar */}
            {cart.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-3 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20">
                <div>
                  <p className="text-xs text-gray-500 line-through">&#8377;{marketPriceTotal.toLocaleString()}</p>
                  <p className="font-bold text-lg">&#8377;{finalAmount.toLocaleString()}</p>
                </div>
                <button
                  onClick={() => {
                    setCartOpen(false);
                    navigate('/checkout');
                  }}
                  className="bg-yellow-400 text-black px-8 py-3 rounded font-bold text-sm hover:bg-yellow-500 transition-colors"
                >
                  Place order
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};