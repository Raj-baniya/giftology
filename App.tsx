
import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { MobileNumberModal } from './components/MobileNumberModal';
import { CustomAlert, useCustomAlert } from './components/CustomAlert';
import './styles/christmas-theme.css';
import './styles/space-theme.css';
// SpaceBackground removed for Modern Luxe theme

import { Navbar } from './components/Navbar';
import MobileNavbar from './components/MobileNavbar';
import MobileSearchBar from './components/MobileSearchBar';
import { CartDrawer } from './components/CartDrawer';
import { SnowEffect } from './components/SnowEffect';
import { SantaCartAnimation } from './components/SantaCartAnimation';

// Lazy Load Pages
const Home = lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const Shop = lazy(() => import('./pages/Shop').then(module => ({ default: module.Shop })));
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Account = lazy(() => import('./pages/Account').then(module => ({ default: module.Account })));
const Admin = lazy(() => import('./pages/Admin').then(module => ({ default: module.Admin })));
const Checkout = lazy(() => import('./pages/Checkout').then(module => ({ default: module.Checkout })));
const Search = lazy(() => import('./pages/Search').then(module => ({ default: module.Search })));
const AdminLogin = lazy(() => import('./pages/AdminLogin').then(module => ({ default: module.AdminLogin })));
const ProductDetail = lazy(() => import('./pages/ProductDetail').then(module => ({ default: module.ProductDetail })));
const AdminProductForm = lazy(() => import('./pages/AdminProductForm').then(module => ({ default: module.AdminProductForm })));
const GiftGuide = lazy(() => import('./pages/GiftGuide').then(module => ({ default: module.GiftGuide })));
const SalesAnalytics = lazy(() => import('./pages/SalesAnalytics').then(module => ({ default: module.SalesAnalytics })));
const MobileCategories = lazy(() => import('./pages/MobileCategories'));

const Cart = lazy(() => import('./pages/Cart').then(module => ({ default: module.Cart })));

// Scroll to top component
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-transparent gap-4">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E60000]"></div>
    <p className="text-white font-black tracking-widest uppercase text-xs animate-pulse">Loading...</p>
  </div>
);

const AppContent = () => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
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
    <>
      <div className="galaxy-background" />
      <div className={`flex flex-col min-h-screen font-sans text-textMain pb-20 md:pb-0`}>
        {/* Christmas effects - only if theme is christmas */}
        {
          currentTheme === 'christmas' && (
            <>
              <SnowEffect />
              <SantaCartAnimation />
            </>
          )
        }

        {/* Global Background (Light/Cream) */}

        {
          true && (
            <>
              <div className="hidden md:block">
                <Navbar />
              </div>
              <MobileSearchBar />
              {/* MobileNavbar moved to root level for fixed positioning safety */}
            </>
          )
        }
        <MobileNumberModal />
        <CartDrawer />
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

        <main className={`flex-grow`}>
          <Suspense fallback={<PageLoader />}>
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

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
        {
          true && (
            <footer className="py-8 border-t border-black/5 relative z-10 bg-background">
              <div className="max-w-7xl mx-auto px-4 text-center text-textMuted text-xs font-semibold tracking-wide flex flex-col items-center gap-6">
                <img src="/logo.png" alt="Giftology" className="h-10 w-auto hover:scale-110 transition-all duration-500" />
                <p className="">&copy; 2025 Giftology. Handcrafted with Care.</p>
              </div>
            </footer>
          )
        }
      </div>
      {/* Mobile Navbar - Root Level for Z-Index Safety */}
      {!isAdminPage && <MobileNavbar />}
    </>
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