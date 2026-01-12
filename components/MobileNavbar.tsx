import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { useCart } from '../contexts/CartContext';

const MobileNavbar = () => {
    const location = useLocation();
    const { cartCount, setCartOpen } = useCart();

    const isActive = (path: string) => location.pathname === path;

    const navItems = [
        { name: 'Home', path: '/', icon: Icons.Compass },
        { name: 'Play', path: '/play', icon: Icons.PlayCircle },
        { name: 'Categories', path: '/categories', icon: Icons.LayoutGrid },
        { name: 'Cart', path: '/cart', icon: Icons.ShoppingBag, badge: cartCount, isCart: true },
        { name: 'Account', path: '/account', icon: Icons.User },
    ];

    if (location.pathname.startsWith('/admin')) return null;

    return (
        <div className="mobile-navbar fixed bottom-0 left-0 right-0 w-full z-[9999] shadow-[0_-5px_20px_rgba(0,0,0,0.1)] block lg:hidden"
            style={{
                backgroundColor: 'rgba(15, 23, 42, 0.98)', /* More opaque for "stuck" feel */
                borderTop: '1px solid rgba(255,255,255,0.1)',
                paddingBottom: 'env(safe-area-inset-bottom)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                transform: 'translateZ(0)', /* Force hardware acceleration */
                height: '70px' /* Fixed height for stability */
            }}>
            <div className="flex justify-around items-center h-full w-full px-2">
                {navItems.map((item) => {
                    const Content = (
                        <div
                            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-all relative cursor-pointer py-2 ${isActive(item.path) ? 'text-primary' : 'text-gray-400'
                                }`}
                        >
                            <div className="relative p-1">
                                <item.icon
                                    className="w-6 h-6"
                                    strokeWidth={isActive(item.path) ? 2.5 : 2}
                                />
                                {item.badge ? (
                                    <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-[#FAF9F6]">
                                        {item.badge}
                                    </span>
                                ) : null}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-tight`}>{item.name}</span>
                        </div>
                    );

                    if (item.isCart) {
                        return (
                            <button
                                key={item.name}
                                onClick={() => setCartOpen(true)}
                                className="w-full h-full flex items-center justify-center"
                            >
                                {Content}
                            </button>
                        );
                    }

                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            onClick={() => setCartOpen(false)}
                            className="w-full h-full flex items-center justify-center"
                        >
                            {Content}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default MobileNavbar;
