import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { MobileNumberModal } from './components/MobileNumberModal';

import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { Login } from './pages/Login';
import { Account } from './pages/Account';
import { Admin } from './pages/Admin';
import { Checkout } from './pages/Checkout';
import { Search } from './pages/Search';
import { AdminLogin } from './pages/AdminLogin';
import { ProductDetail } from './pages/ProductDetail';
import { AdminProductForm } from './pages/AdminProductForm';
import { GiftGuide } from './pages/GiftGuide';
import { SalesAnalytics } from './pages/SalesAnalytics';
import MobileNavbar from './components/MobileNavbar';
import MobileSearchBar from './components/MobileSearchBar';
import MobileCategories from './pages/MobileCategories';
import Play from './pages/Play';
import { Cart } from './pages/Cart';

// Scroll to top component
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const App = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <CartProvider>
          <div className="flex flex-col min-h-screen bg-background font-sans text-textMain pb-16 md:pb-0">
            <div className="hidden md:block">
              <Navbar />
            </div>
            <MobileSearchBar />
            <MobileNavbar />
            <MobileNumberModal />

            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/search" element={<Search />} />
                <Route path="/gift-guide" element={<GiftGuide />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/account" element={<Account />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/products/new" element={<AdminProductForm />} />
                <Route path="/admin/products/edit/:id" element={<AdminProductForm />} />
                <Route path="/admin/sales" element={<SalesAnalytics />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/product/:slug" element={<ProductDetail />} />
                <Route path="/categories" element={<MobileCategories />} />
                <Route path="/play" element={<Play />} />


                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <footer className="bg-white py-8 border-t border-gray-100">
              <div className="max-w-7xl mx-auto px-4 text-center text-textMuted text-sm flex flex-col items-center gap-4">
                <img src="/logo.png" alt="Giftology" className="h-8 w-auto opacity-50 grayscale hover:grayscale-0 transition-all" />
                <p>&copy; 2025 Giftology. All rights reserved.</p>
              </div>
            </footer>
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;