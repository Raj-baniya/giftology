import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { store } from '../services/store';
import { Icons } from '../components/ui/Icons';
import { motion, AnimatePresence } from 'framer-motion';

export const Cart = () => {
    const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [address, setAddress] = useState<any>(null);
    const [ratings, setRatings] = useState<Record<string, { rating: number, count: number }>>({});

    // Fetch ratings for cart items
    useEffect(() => {
        const fetchRatings = async () => {
            const newRatings: Record<string, { rating: number, count: number }> = {};
            await Promise.all(cart.map(async (item) => {
                try {
                    const reviews = await store.getProductReviews(item.id);
                    if (reviews && reviews.length > 0) {
                        const total = reviews.reduce((sum: number, r: any) => sum + r.rating, 0);
                        newRatings[item.id] = {
                            rating: Number((total / reviews.length).toFixed(1)),
                            count: reviews.length
                        };
                    } else {
                        newRatings[item.id] = { rating: 0, count: 0 };
                    }
                } catch (e) {
                    console.error("Error fetching rating for", item.id, e);
                    newRatings[item.id] = { rating: 0, count: 0 };
                }
            }));
            setRatings(newRatings);
        };

        if (cart.length > 0) {
            fetchRatings();
        }
    }, [cart]);

    // Address Modal State
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newAddress, setNewAddress] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: ''
    });

    // Fetch user address
    useEffect(() => {
        if (user) {
            store.getUserAddresses(user.id).then(addresses => {
                setSavedAddresses(addresses || []);
                if (addresses && addresses.length > 0) {
                    setAddress(addresses[0]);
                }
            });
        }
    }, [user]);

    const handleAddressSelect = (selectedAddr: any) => {
        setAddress(selectedAddr);
        setShowAddressModal(false);
    };

    const handleSaveAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            const updatedAddresses = await store.saveUserAddress(user.id, newAddress);
            setSavedAddresses(updatedAddresses);
            setAddress(newAddress);
            setIsAddingNew(false);
            setShowAddressModal(false);
            // Reset form
            setNewAddress({
                firstName: '',
                lastName: '',
                phone: '',
                address: '',
                city: '',
                state: '',
                zipCode: ''
            });
        } catch (error) {
            console.error('Failed to save address:', error);
        }
    };

    // Calculate totals
    const marketPriceTotal = cart.reduce((sum, item) => {
        const marketPrice = item.marketPrice || item.price;
        return sum + (marketPrice * item.quantity);
    }, 0);
    const totalSavings = marketPriceTotal - cartTotal;
    const deliveryCharges = 0;
    const finalAmount = cartTotal + deliveryCharges;

    return (
        <div className="min-h-screen bg-gray-50 pb-24 md:pb-0 relative">
            {/* Header - Back button removed as requested (MobileSearchBar has one) */}
            <div className="bg-white p-4 flex items-center gap-4 shadow-sm sticky top-0 z-10">
                <h2 className="font-bold text-lg ml-2">My Cart</h2>
            </div>

            <div className="max-w-3xl mx-auto">
                {/* Address Section */}
                {user && (
                    <div className="bg-white p-4 mb-2 md:rounded-xl md:mt-4 md:shadow-sm">
                        <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm text-gray-600">Deliver to:</span>
                                    <span className="font-bold text-sm">
                                        {address?.firstName || user.displayName || 'User'}, {address?.zipCode || ''}
                                    </span>
                                    <span className="bg-gray-100 text-xs px-1 rounded text-gray-500">HOME</span>
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-2">
                                    {address ? (
                                        `${address.address}, ${address.city}, ${address.state}`
                                    ) : (
                                        'Add an address to proceed'
                                    )}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAddressModal(true)}
                                className="text-blue-600 text-sm font-bold border border-gray-200 px-3 py-1 rounded hover:bg-blue-50 transition-colors ml-2 shrink-0"
                            >
                                Change
                            </button>
                        </div>
                    </div>
                )}

                {/* Address Selection Modal */}
                <AnimatePresence>
                    {showAddressModal && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.5 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowAddressModal(false)}
                                className="fixed inset-0 bg-black z-[60]"
                            />
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-[110] max-h-[85vh] overflow-y-auto p-6 pb-32 md:max-w-md md:left-1/2 md:-translate-x-1/2 md:top-1/2 md:-translate-y-1/2 md:rounded-2xl md:h-fit md:pb-6"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-lg">{isAddingNew ? 'Add New Address' : 'Select Delivery Address'}</h3>
                                    <button onClick={() => setShowAddressModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                        <Icons.X className="w-5 h-5" />
                                    </button>
                                </div>

                                {isAddingNew ? (
                                    <form onSubmit={handleSaveAddress} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <input required placeholder="First Name" value={newAddress.firstName} onChange={e => setNewAddress({ ...newAddress, firstName: e.target.value })} className="border p-3 rounded-lg w-full" />
                                            <input required placeholder="Last Name" value={newAddress.lastName} onChange={e => setNewAddress({ ...newAddress, lastName: e.target.value })} className="border p-3 rounded-lg w-full" />
                                        </div>
                                        <input required placeholder="Phone Number" value={newAddress.phone} onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })} className="border p-3 rounded-lg w-full" />
                                        <input required placeholder="Address (House No, Building, Street)" value={newAddress.address} onChange={e => setNewAddress({ ...newAddress, address: e.target.value })} className="border p-3 rounded-lg w-full" />
                                        <div className="grid grid-cols-2 gap-4">
                                            <input required placeholder="City" value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} className="border p-3 rounded-lg w-full" />
                                            <input required placeholder="State" value={newAddress.state} onChange={e => setNewAddress({ ...newAddress, state: e.target.value })} className="border p-3 rounded-lg w-full" />
                                        </div>
                                        <input required placeholder="Zip Code" value={newAddress.zipCode} onChange={e => setNewAddress({ ...newAddress, zipCode: e.target.value })} className="border p-3 rounded-lg w-full" />

                                        <div className="flex gap-3 pt-2">
                                            <button type="button" onClick={() => setIsAddingNew(false)} className="flex-1 py-3 border rounded-lg font-bold">Cancel</button>
                                            <button type="submit" className="flex-1 py-3 bg-black text-white rounded-lg font-bold">Save Address</button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="space-y-4">
                                        {savedAddresses.map((addr, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => handleAddressSelect(addr)}
                                                className={`p-4 border rounded-xl cursor-pointer hover:border-primary transition-colors ${JSON.stringify(addr) === JSON.stringify(address) ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold">{addr.firstName} {addr.lastName}</span>
                                                    <span className="bg-gray-100 text-xs px-2 py-0.5 rounded text-gray-600">HOME</span>
                                                </div>
                                                <p className="text-sm text-gray-600">{addr.address}, {addr.city}, {addr.state} - {addr.zipCode}</p>
                                                <p className="text-sm text-gray-600 mt-1">Phone: {addr.phone}</p>
                                            </div>
                                        ))}

                                        <button
                                            onClick={() => setIsAddingNew(true)}
                                            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Icons.Plus className="w-5 h-5" />
                                            Add New Address
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Cart Items */}
                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-textMuted">
                        <Icons.ShoppingBag className="w-16 h-16 mb-4 text-accent animate-float" />
                        <p className="text-lg">Your cart is empty</p>
                        <button
                            onClick={() => navigate('/shop')}
                            className="mt-4 text-primary font-semibold hover:underline"
                        >
                            Start Shopping
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2 md:space-y-4 md:mt-4">
                        {cart.map((item) => {
                            const discount = item.marketPrice ? Math.round(((item.marketPrice - item.price) / item.marketPrice) * 100) : 0;

                            return (
                                <div key={item.id} className="bg-white p-4 md:rounded-xl md:shadow-sm">
                                    <div className="flex gap-4 mb-4 cursor-pointer" onClick={() => navigate(`/product/${item.slug}`)}>
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

                                            {/* Rating */}
                                            <div className="flex items-center gap-1 mb-2">
                                                {ratings[item.id]?.count > 0 ? (
                                                    <>
                                                        <div className="bg-green-600 text-white text-[10px] px-1 rounded flex items-center gap-0.5">
                                                            {ratings[item.id].rating} <Icons.Star className="w-2 h-2 fill-current" />
                                                        </div>
                                                        <span className="text-xs text-gray-500">({ratings[item.id].count})</span>
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-gray-400">No reviews yet</span>
                                                )}
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
                        <div className="bg-white p-4 mt-2 md:rounded-xl md:shadow-sm">
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
                        <div className="p-4 bg-white mt-2 md:rounded-xl md:shadow-sm">
                            <button
                                onClick={() => navigate('/checkout')}
                                className="w-full bg-yellow-400 text-black py-3 rounded-lg font-bold hover:bg-yellow-500 transition-colors"
                            >
                                Continue to Checkout
                            </button>
                        </div>

                        {/* Safe Payments Badge */}
                        <div className="p-4 flex items-center gap-3 text-xs text-gray-500 bg-white mt-2 md:rounded-xl md:shadow-sm">
                            <Icons.Shield className="w-8 h-8 text-gray-400" />
                            <p>Safe and secure payments. Easy returns. 100% Authentic products.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Sticky Bottom Bar */}
            {cart.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-3 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20 md:hidden">
                    <div>
                        <p className="text-xs text-gray-500 line-through">&#8377;{marketPriceTotal.toLocaleString()}</p>
                        <p className="font-bold text-lg">&#8377;{finalAmount.toLocaleString()}</p>
                    </div>
                    <button
                        onClick={() => navigate('/checkout')}
                        className="bg-yellow-400 text-black px-8 py-3 rounded font-bold text-sm hover:bg-yellow-500 transition-colors"
                    >
                        Place order
                    </button>
                </div>
            )}
        </div>
    );
};
