import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { store } from '../services/store';
import { Icons } from '../components/ui/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { calculatePointsEarned } from '../utils/rewards';

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
        <div className="min-h-screen pb-24 md:pb-0 relative bg-transparent font-sans">

            {/* Header */}
            <div className="relative z-10 bg-transparent backdrop-blur-xl p-4 flex items-center gap-4 border-b border-white/10 sticky top-0">
                <h2 className="text-2xl font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                    <Icons.ShoppingBag className="w-6 h-6 text-[#E60000]" />
                    My Cart
                </h2>
            </div>

            <div className="max-w-3xl mx-auto">
                {/* Address Section */}
                {user && (
                    <div className="relative z-10 bg-white/5 backdrop-blur-md p-4 mb-4 border border-white/10 rounded-2xl md:mt-6 shadow-2xl">
                        <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <Icons.MapPin className="w-4 h-4 text-[#E60000]" />
                                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Deliver To:</span>
                                    <span className="bg-[#E60000] text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest shadow-[0_0_10px_rgba(230,0,0,0.3)]">
                                        {address?.zipCode || 'HOME'}
                                    </span>
                                </div>
                                <h4 className="font-black text-white text-sm uppercase tracking-wider mb-1">
                                    {address?.firstName || user.displayName || 'User'}
                                </h4>
                                <p className="text-xs text-gray-400 font-medium line-clamp-2 italic">
                                    {address ? (
                                        `${address.address}, ${address.city}, ${address.state}`
                                    ) : (
                                        'Add delivery address to proceed'
                                    )}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAddressModal(true)}
                                className="text-white text-[10px] font-black uppercase tracking-widest border border-white/20 px-4 py-2 rounded-xl hover:bg-white/10 transition-all hover:border-[#E60000] ml-4"
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
                                animate={{ opacity: 0.8 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowAddressModal(false)}
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                            />
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-2xl border-t border-white/10 rounded-t-[2.5rem] z-[110] max-h-[90vh] overflow-y-auto p-8 pb-32 md:max-w-lg md:left-1/2 md:-translate-x-1/2 md:bottom-20 md:rounded-[2.5rem] md:h-fit md:pb-8"
                            >
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-xl font-black text-white uppercase tracking-[0.2em]">{isAddingNew ? 'New Address' : 'Select Address'}</h3>
                                    <button onClick={() => setShowAddressModal(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all text-white">
                                        <Icons.X className="w-6 h-6" />
                                    </button>
                                </div>

                                {isAddingNew ? (
                                    <form onSubmit={handleSaveAddress} className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <input required placeholder="First Name" value={newAddress.firstName} onChange={e => setNewAddress({ ...newAddress, firstName: e.target.value })} className="bg-white/5 border border-white/10 p-4 rounded-2xl w-full text-white placeholder:text-gray-600 focus:ring-2 focus:ring-[#E60000] outline-none" />
                                            <input required placeholder="Last Name" value={newAddress.lastName} onChange={e => setNewAddress({ ...newAddress, lastName: e.target.value })} className="bg-white/5 border border-white/10 p-4 rounded-2xl w-full text-white placeholder:text-gray-600 focus:ring-2 focus:ring-[#E60000] outline-none" />
                                        </div>
                                        <input required placeholder="Phone Number" value={newAddress.phone} onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })} className="bg-white/5 border border-white/10 p-4 rounded-2xl w-full text-white placeholder:text-gray-600 focus:ring-2 focus:ring-[#E60000] outline-none" />
                                        <input required placeholder="Flat, House no., Building, Company" value={newAddress.address} onChange={e => setNewAddress({ ...newAddress, address: e.target.value })} className="bg-white/5 border border-white/10 p-4 rounded-2xl w-full text-white placeholder:text-gray-600 focus:ring-2 focus:ring-[#E60000] outline-none" />
                                        <div className="grid grid-cols-2 gap-4">
                                            <input required placeholder="City" value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} className="bg-white/5 border border-white/10 p-4 rounded-2xl w-full text-white placeholder:text-gray-600 focus:ring-2 focus:ring-[#E60000] outline-none" />
                                            <input required placeholder="State" value={newAddress.state} onChange={e => setNewAddress({ ...newAddress, state: e.target.value })} className="bg-white/5 border border-white/10 p-4 rounded-2xl w-full text-white placeholder:text-gray-600 focus:ring-2 focus:ring-[#E60000] outline-none" />
                                        </div>
                                        <input required placeholder="Zip Code" value={newAddress.zipCode} onChange={e => setNewAddress({ ...newAddress, zipCode: e.target.value })} className="bg-white/5 border border-white/10 p-4 rounded-2xl w-full text-white placeholder:text-gray-600 focus:ring-2 focus:ring-[#E60000] outline-none" />

                                        <div className="flex gap-4 pt-4">
                                            <button type="button" onClick={() => setIsAddingNew(false)} className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-black uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all">Cancel</button>
                                            <button type="submit" className="flex-1 py-4 bg-[#E60000] text-white rounded-2xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(230,0,0,0.3)] hover:scale-[1.02] transition-all">Save Address</button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="space-y-4">
                                        {savedAddresses.map((addr, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => handleAddressSelect(addr)}
                                                className={`p-5 border-2 rounded-[1.5rem] cursor-pointer transition-all ${JSON.stringify(addr) === JSON.stringify(address)
                                                    ? 'border-[#E60000] bg-[#E60000]/5 shadow-[0_0_15px_rgba(230,0,0,0.2)]'
                                                    : 'border-white/5 bg-white/5 hover:border-white/20'}`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="font-black text-white uppercase tracking-widest">{addr.firstName} {addr.lastName}</span>
                                                    <span className="bg-[#E60000] text-white text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-widest">Selected</span>
                                                </div>
                                                <p className="text-xs text-gray-400 font-medium leading-relaxed italic">{addr.address}, {addr.city}, {addr.state} - {addr.zipCode}</p>
                                                <p className="text-xs text-[#E60000] mt-2 font-black tracking-widest">PHONE: {addr.phone}</p>
                                            </div>
                                        ))}

                                        <button
                                            onClick={() => setIsAddingNew(true)}
                                            className="w-full py-6 border-2 border-dashed border-white/10 rounded-[1.5rem] text-gray-500 font-black uppercase tracking-widest hover:border-[#E60000] hover:text-[#E60000] hover:bg-[#E60000]/5 transition-all flex items-center justify-center gap-3"
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
                    <div className="relative z-10 flex flex-col items-center justify-center pt-6 pb-32">
                        <div className="relative mb-8">
                            <Icons.ShoppingBag className="w-24 h-24 text-white" />
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className="absolute inset-0 bg-[#E60000] blur-3xl -z-10 rounded-full"
                            />
                        </div>
                        <p className="text-xl font-black text-white uppercase tracking-[0.2em] mb-4">Your Cart is Empty</p>
                        <p className="text-gray-500 text-sm italic mb-8">No items added to your cart yet.</p>
                        <button
                            onClick={() => navigate('/shop')}
                            className="bg-[#E60000] text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(230,0,0,0.3)] hover:scale-105 transition-all"
                        >
                            Shop Now
                        </button>
                    </div>
                ) : (
                    <div className="relative z-10 space-y-4 md:mt-6">
                        {cart.map((item) => {
                            const discount = item.marketPrice ? Math.round(((item.marketPrice - item.price) / item.marketPrice) * 100) : 0;

                            return (
                                <div key={item.id} className="bg-white/5 backdrop-blur-md p-4 border border-white/10 rounded-2xl shadow-2xl transition-all hover:bg-white/10">
                                    <div className="flex gap-5 mb-5 cursor-pointer" onClick={() => navigate(`/product/${item.slug}`)}>
                                        {/* Image */}
                                        <div className="w-24 h-24 shrink-0 bg-white/5 rounded-2xl border border-white/10 p-2 shadow-inner group">
                                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain transition-transform group-hover:scale-110" />
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-black text-white uppercase tracking-wider line-clamp-2 mb-2">{item.name}</h3>
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {item.selectedColor && (
                                                    <span className="text-[10px] bg-white/5 text-gray-300 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-white/10">
                                                        {item.selectedColor}
                                                    </span>
                                                )}
                                                {item.selectedSize && (
                                                    <span className="text-[10px] bg-white/5 text-gray-300 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-white/10">
                                                        Size: {item.selectedSize}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Price */}
                                            <div className="flex items-center gap-3">
                                                <span className="font-black text-xl text-white">&#8377;{(item.price * item.quantity).toLocaleString()}</span>
                                                {item.marketPrice && item.marketPrice > item.price && (
                                                    <>
                                                        <span className="text-xs text-gray-500 line-through">&#8377;{(item.marketPrice * item.quantity).toLocaleString()}</span>
                                                        <span className="text-xs text-[#E60000] font-black uppercase tracking-tighter">{discount}% OFF</span>
                                                    </>
                                                )}
                                            </div>

                                            {/* Rewards */}
                                            <div className="flex items-center gap-2 mt-2">
                                                <Icons.Star className="w-3 h-3 text-[#E60000] fill-current shadow-[0_0_5px_rgba(230,0,0,0.5)]" />
                                                <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.15em]">
                                                    +{calculatePointsEarned(item.price * item.quantity)} POINTS
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                                        <div className="flex items-center bg-black/40 rounded-xl border border-white/10 p-1">
                                            <button
                                                onClick={() => updateQuantity(item.id, -1, item.selectedSize, item.selectedColor)}
                                                className="w-10 h-10 flex items-center justify-center font-black text-white hover:bg-white/10 rounded-lg transition-all"
                                            >
                                                <Icons.Minus className="w-4 h-4" />
                                            </button>
                                            <span className="w-10 text-center font-black text-white text-sm">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, 1, item.selectedSize, item.selectedColor)}
                                                className="w-10 h-10 flex items-center justify-center font-black text-white hover:bg-white/10 rounded-lg transition-all"
                                            >
                                                <Icons.Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.id, item.selectedSize, item.selectedColor)}
                                            className="flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-[#E60000] border border-white/10 hover:border-[#E60000]/30 rounded-xl transition-all"
                                        >
                                            Remove from Cart
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Price Details */}
                        <div className="bg-white/5 backdrop-blur-md p-4 border border-white/10 rounded-2xl shadow-2xl">
                            <h3 className="font-black text-gray-500 text-[10px] mb-6 uppercase tracking-[0.3em]">Price Details</h3>
                            <div className="space-y-4 text-xs">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 font-bold uppercase tracking-widest">Items ({cart.reduce((acc, item) => acc + item.quantity, 0)})</span>
                                    <span className="text-white font-black">&#8377;{marketPriceTotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-[#E60000]">
                                    <span className="font-bold uppercase tracking-widest">Discount</span>
                                    <span className="font-black">-&#8377;{totalSavings.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 font-bold uppercase tracking-widest">Delivery Charges</span>
                                    <span className="text-green-500 font-black uppercase tracking-widest">FREE</span>
                                </div>
                                <div className="h-px bg-white/5 my-4"></div>
                                <div className="flex justify-between items-center text-lg">
                                    <span className="text-white font-black uppercase tracking-[0.2em]">Total Amount</span>
                                    <span className="text-white font-black text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">&#8377;{finalAmount.toLocaleString()}</span>
                                </div>
                            </div>
                            {totalSavings > 0 && (
                                <div className="mt-6 bg-[#E60000]/10 border border-[#E60000]/20 p-3 rounded-xl text-[#E60000] text-[10px] font-black uppercase tracking-widest text-center animate-pulse">
                                    You are saving &#8377;{totalSavings.toLocaleString()} on this order
                                </div>
                            )}
                        </div>

                        {/* Continue Button */}
                        <div className="p-2 md:rounded-2xl">
                            <button
                                onClick={() => navigate('/checkout')}
                                className="w-full bg-[#E60000] text-white py-3.5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(230,0,0,0.4)] hover:shadow-[0_0_50px_rgba(230,0,0,0.6)] hover:scale-[1.01] active:scale-95 transition-all group overflow-hidden relative"
                            >
                                <span className="relative z-10">Place Order</span>
                                <motion.div
                                    className="absolute inset-0 bg-white/20 -z-1"
                                    initial={{ x: '-100%' }}
                                    whileHover={{ x: '100%' }}
                                    transition={{ duration: 0.6 }}
                                />
                            </button>
                        </div>

                        {/* Secure Badge */}
                        <div className="p-6 flex items-center gap-4 bg-white/5 border border-white/10 md:rounded-2xl">
                            <div className="p-3 bg-white/5 rounded-full border border-white/10">
                                <Icons.Shield className="w-8 h-8 text-[#E60000]" />
                            </div>
                            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest leading-relaxed">
                                Safe and secure payments. Easy returns. 100% Authentic products.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Sticky Bottom Bar */}
            {cart.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-3xl border-t border-white/10 p-5 flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-[100] md:hidden">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest line-through">&#8377;{marketPriceTotal.toLocaleString()}</span>
                        <span className="font-black text-2xl text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">&#8377;{finalAmount.toLocaleString()}</span>
                    </div>
                    <button
                        onClick={() => navigate('/checkout')}
                        className="bg-[#E60000] text-white px-10 py-3 rounded-xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(230,0,0,0.4)] hover:shadow-[0_0_40px_rgba(230,0,0,0.6)] active:scale-95 transition-all"
                    >
                        Continue
                    </button>
                </div>
            )}
        </div>
    );
};
