import React, { useState } from 'react';
import { Home, Search, Grid, User, ShoppingCart } from 'lucide-react';

const BottomNav = () => {
    const [activeTab, setActiveTab] = useState('Home');

    const navItems = [
        { name: 'Home', icon: Home },
        { name: 'Explore', icon: Search },
        { name: 'Categories', icon: Grid },
        { name: 'Account', icon: User },
        { name: 'Cart', icon: ShoppingCart, badge: 4 },
    ];

    // Dummy Content Components
    const HomeContent = () => (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-gray-800">Home Feed</h1>
                <p className="text-gray-500">Welcome back to Giftology.</p>
            </header>
            {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="h-40 bg-gray-100 rounded-xl mb-4 w-full"></div>
                    <h3 className="font-bold text-lg mb-2">Featured Gift #{i + 1}</h3>
                    <p className="text-gray-500 text-sm">Scroll down to see the sticky navbar in action.</p>
                </div>
            ))}
        </div>
    );

    const ExploreContent = () => (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-800">Explore</h1>
            <input type="text" placeholder="Search gifts..." className="w-full p-4 rounded-xl border border-gray-200 bg-white" />
            <div className="grid grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-blue-50 h-32 rounded-xl flex items-center justify-center text-blue-500 font-bold">Category {i + 1}</div>
                ))}
            </div>
        </div>
    );

    const CategoriesContent = () => (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-800">All Categories</h1>
            {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg"></div>
                    <span className="font-medium">Gift Category {i + 1}</span>
                </div>
            ))}
        </div>
    );

    const AccountContent = () => (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
                <div>
                    <h2 className="text-xl font-bold">John Doe</h2>
                    <p className="text-gray-500">Premium Member</p>
                </div>
            </div>
            <div className="space-y-2">
                <div className="bg-white p-4 rounded-xl border border-gray-100">My Orders</div>
                <div className="bg-white p-4 rounded-xl border border-gray-100">Wishlist</div>
                <div className="bg-white p-4 rounded-xl border border-gray-100">Settings</div>
            </div>
        </div>
    );

    const CartContent = () => (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-800">Your Cart (4)</h1>
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 flex gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg"></div>
                    <div>
                        <h3 className="font-bold">Premium Gift Item</h3>
                        <p className="text-blue-600 font-bold">$49.99</p>
                    </div>
                </div>
            ))}
            <button className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl mt-4">Checkout</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative w-full">
            {/* Main Content Area with padding for bottom nav */}
            <div className="flex-1 pb-24 px-4 pt-6 w-full max-w-md mx-auto">
                {activeTab === 'Home' && <HomeContent />}
                {activeTab === 'Explore' && <ExploreContent />}
                {activeTab === 'Categories' && <CategoriesContent />}
                {activeTab === 'Account' && <AccountContent />}
                {activeTab === 'Cart' && <CartContent />}
            </div>

            {/* Persistent Bottom Navigation Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] h-16 z-50">
                <div className="h-full max-w-md mx-auto flex justify-between items-center px-6">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.name;

                        return (
                            <button
                                key={item.name}
                                onClick={() => setActiveTab(item.name)}
                                className="relative flex flex-col items-center justify-center w-full h-full space-y-1 group"
                            >
                                <div className="relative p-1">
                                    <Icon
                                        className={`w-6 h-6 transition-colors duration-200 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                                            }`}
                                    />

                                    {/* Notification Badge */}
                                    {item.badge && (
                                        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                                            {item.badge}
                                        </span>
                                    )}
                                </div>
                                <span
                                    className={`text-[10px] font-medium transition-colors duration-200 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                                        }`}
                                >
                                    {item.name}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default BottomNav;
