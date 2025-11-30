import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { useCart } from '../contexts/CartContext';

const MobileNavbar = () => {
    const location = useLocation();
    const { cartCount, setCartOpen } = useCart();

    const isActive = (path: string) => location.pathname === path;

    const handleCartClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setCartOpen(true);
    };

    const handleNavClick = () => {
        setCartOpen(false);
    };

    const navItems = [
        { name: 'Home', icon: Icons.Home, path: '/', onClick: handleNavClick },
        { name: 'Play', icon: Icons.PlayCircle, path: '/play', onClick: handleNavClick },
        { name: 'Categories', icon: Icons.LayoutGrid, path: '/categories', onClick: handleNavClick },
        { name: 'Account', icon: Icons.User, path: '/account', onClick: handleNavClick },
        { name: 'Cart', icon: Icons.ShoppingCart, path: '/cart', badge: cartCount, onClick: handleNavClick },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[100] pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => (
                    <Link
                        key={item.name}
                        to={item.path}
                        onClick={item.onClick}
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${isActive(item.path) ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        <div className="relative">
                            <item.icon
                                className={`w-6 h-6 ${isActive(item.path) ? 'fill-current' : 'stroke-current'}`}
                                strokeWidth={isActive(item.path) ? 0 : 2}
                            />
                            {item.badge ? (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                                    {item.badge}
                                </span>
                            ) : null}
                        </div>
                        <span className={`text-[10px] font-medium ${isActive(item.path) ? 'font-bold' : ''}`}>{item.name}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default MobileNavbar;
