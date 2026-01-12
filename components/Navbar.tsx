import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icons } from './ui/Icons';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

export const Navbar = () => {
  const { cartCount, setCartOpen } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsSearchOpen(false);
      setIsMenuOpen(false);
    }
  };

  return (
    <nav className="main-navbar sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-accent/30 shadow-sm transition-all duration-300 animate-fade-in-down">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20 gap-2 md:gap-4">

          {/* Logo */}
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <img src="/logo.png" alt="Giftology" className="h-10 md:h-12 w-auto object-contain" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center space-x-8 flex-shrink-0">
            <Link to="/gift-guide" className="flex items-center gap-1.5 text-textMain hover:text-primary font-medium smooth-transition hover-lift">
              <Icons.Sparkles className="w-4 h-4 smooth-transition" />
              Gift Guide
            </Link>
            <Link to="/shop" className="flex items-center gap-1.5 text-textMain hover:text-primary font-medium smooth-transition hover-lift">
              <Icons.ShoppingBag className="w-4 h-4 smooth-transition" />
              Shop
            </Link>
            <Link to="/shop?category=trending" className="flex items-center gap-1.5 text-textMain hover:text-primary font-medium smooth-transition hover-lift">
              <Icons.TrendingUp className="w-4 h-4 smooth-transition" />
              Trending Now
            </Link>

            {user?.role === 'admin' && (
              <Link to="/admin" className="flex items-center gap-1.5 text-red-500 font-bold hover:text-red-600">
                <Icons.Shield className="w-4 h-4" />
                Admin
              </Link>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 md:gap-3 flex-shrink-0">

            {/* Search Toggle */}
            <div className="relative">
              {isSearchOpen ? (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center bg-white rounded-full shadow-lg border border-gray-100 overflow-hidden w-[200px] md:w-[300px]">
                  <form onSubmit={handleSearch} className="w-full flex">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full py-2 pl-4 pr-2 text-sm focus:outline-none"
                      onBlur={() => !searchQuery && setIsSearchOpen(false)}
                    />
                    <button type="submit" className="p-2 text-primary"><Icons.Search className="w-4 h-4" /></button>
                  </form>
                </div>
              ) : (
                <button onClick={() => setIsSearchOpen(true)} className="p-2 hover:bg-gray-100 rounded-full smooth-transition hover-scale">
                  <Icons.Search className="w-5 h-5 md:w-6 md:h-6 text-textMain smooth-transition" />
                </button>
              )}
            </div>

            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 hover:bg-gray-100 rounded-full smooth-transition hover-scale"
            >
              <Icons.ShoppingBag className="w-5 h-5 md:w-6 md:h-6 text-textMain smooth-transition" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold w-4 h-4 md:w-5 md:h-5 flex items-center justify-center rounded-full animate-heartbeat shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            {user ? (
              <div className="relative ml-1 group">
                <button
                  className="flex items-center gap-2 text-sm font-medium hover:text-primary focus:outline-none"
                >
                  <div className="w-8 h-8 md:w-9 md:h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 font-bold border border-gray-200 transition-colors group-hover:border-primary">
                    {user.displayName ? user.displayName.substring(0, 2).toUpperCase() : 'U'}
                  </div>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                  <div className="px-4 py-2 border-b border-gray-50">
                    <p className="text-sm font-bold text-gray-900 truncate">{user.displayName}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>

                  <Link to="/account" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary">
                    <Icons.User className="w-4 h-4" />
                    My Account
                  </Link>

                  {user.role === 'admin' && (
                    <Link to="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                      <Icons.Shield className="w-4 h-4" />
                      Admin Panel
                    </Link>
                  )}

                  <button
                    onClick={() => logout()}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 text-left"
                  >
                    <Icons.LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="hidden md:block ml-2 px-4 py-2 bg-black text-white rounded-full text-sm font-bold hover:bg-gray-800 smooth-transition hover-lift btn-animated">
                Sign In
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 ml-1"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <Icons.X className="w-6 h-6" /> : <Icons.Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-background border-t border-gray-100 animate-slide-in-top absolute w-full z-40 shadow-xl">
          <div className="px-4 pt-4 pb-6 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Link to="/gift-guide" className="stagger-item flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover-lift" onClick={() => setIsMenuOpen(false)}>
                <Icons.Sparkles className="w-6 h-6 text-primary mb-2" />
                <span className="text-sm font-bold">Gift Guide</span>
              </Link>
              <Link to="/shop" className="stagger-item flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover-lift" onClick={() => setIsMenuOpen(false)}>
                <Icons.ShoppingBag className="w-6 h-6 text-primary mb-2" />
                <span className="text-sm font-bold">Shop</span>
              </Link>
              <Link to="/shop?category=trending" className="stagger-item flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover-lift" onClick={() => setIsMenuOpen(false)}>
                <Icons.TrendingUp className="w-6 h-6 text-primary mb-2" />
                <span className="text-sm font-bold">Trending</span>
              </Link>
            </div>

            <Link to="/" className="block py-3 text-base font-medium border-b border-gray-100" onClick={() => setIsMenuOpen(false)}>Home</Link>
            <Link to="/shop" className="block py-3 text-base font-medium border-b border-gray-100" onClick={() => setIsMenuOpen(false)}>Explore All Gifts</Link>

            {user ? (
              <>
                <Link to="/account" className="block py-3 text-base font-medium border-b border-gray-100" onClick={() => setIsMenuOpen(false)}>My Account</Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className="block py-3 text-red-500 font-bold border-b border-gray-100" onClick={() => setIsMenuOpen(false)}>Admin Panel</Link>
                )}
                <button onClick={() => { logout(); setIsMenuOpen(false); }} className="block w-full text-left py-3 text-base text-textMuted">Sign Out</button>
              </>
            ) : (
              <Link to="/login" className="block w-full text-center py-3 mt-2 bg-black text-white rounded-lg font-bold" onClick={() => setIsMenuOpen(false)}>Sign In / Sign Up</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};