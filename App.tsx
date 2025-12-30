import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { MobileNumberModal } from './components/MobileNumberModal';
import { CustomAlert, useCustomAlert } from './components/CustomAlert';
import './styles/christmas-theme.css';

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
import { SnowEffect } from './components/SnowEffect';
import { SantaCartAnimation } from './components/SantaCartAnimation';

// Scroll to top component
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const AppContent = () => {
  const location = useLocation();
  const isPlayPage = location.pathname === '/play';
  const { currentTheme } = useTheme();
  const { alertState, showAlert, closeAlert } = useCustomAlert();

  useEffect(() => {
    const showBonus = sessionStorage.getItem('showSignupBonus');
    if (showBonus === 'true') {
      showAlert(
        "You've received 500 free points! 🎁",
        'Use them on your first order to get a discount.',
        'success',
        { confirmText: 'Awesome!' }
      );
      sessionStorage.removeItem('showSignupBonus');
    }
  }, [showAlert, location]);

  // Listen for stock alert events from CartContext
  useEffect(() => {
    const handleStockAlert = (e: CustomEvent) => {
      const stock = e.detail?.stock;
      showAlert(
        'Out of Stock! 📦',
        `Sorry! Only ${stock} items available in stock.`,
        'warning',
        { confirmText: 'OK' }
      );
    };

    window.addEventListener('showStockAlert', handleStockAlert as EventListener);
    return () => window.removeEventListener('showStockAlert', handleStockAlert as EventListener);
  }, [showAlert]);

  return (
    <div className={`flex flex-col min-h-screen bg-background font-sans text-textMain pb-16 md:pb-0 theme-${currentTheme}`}>
      {/* Christmas effects - only if theme is christmas */}
      {currentTheme === 'christmas' && (
        <>
          <SnowEffect />
          <SantaCartAnimation />
        </>
      )}

      {!isPlayPage && (
        <>
          <div className="hidden md:block">
            <Navbar />
          </div>
          <MobileSearchBar />
          <MobileNavbar />
        </>
      )}
      <MobileNumberModal />
      <CustomAlert
        isOpen={alertState.isOpen}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onClose={closeAlert}
        onConfirm={alertState.onConfirm}
        confirmText={alertState.confirmText}
        cancelText={alertState.cancelText}
      />

      <main className={`flex-grow ${isPlayPage ? 'h-screen overflow-hidden' : ''}`}>
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
      {!isPlayPage && (
        <footer className="bg-white py-8 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 text-center text-textMuted text-sm flex flex-col items-center gap-4">
            <img src="/logo.png" alt="Giftology" className="h-8 w-auto opacity-50 grayscale hover:grayscale-0 transition-all" />
            <p>&copy; 2025 Giftology. All rights reserved.</p>
          </div>
        </footer>
      )}
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;