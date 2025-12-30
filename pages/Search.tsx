import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { store } from '../services/store';
import { Product } from '../types';
import { useCart } from '../contexts/CartContext';
import { Icons } from '../components/ui/Icons';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useCustomAlert, CustomAlert } from '../components/CustomAlert';
import { Toast } from '../components/Toast';

export const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { showAlert } = useCustomAlert();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const all = await store.getProducts();
      if (query) {
        const lowerQuery = query.toLowerCase();
        const filtered = all.filter(p =>
          p.name.toLowerCase().includes(lowerQuery) ||
          p.category.toLowerCase().includes(lowerQuery) ||
          (p.description && p.description.toLowerCase().includes(lowerQuery))
        );
        setProducts(filtered);
      } else {
        setProducts([]);
      }
      setLoading(false);
    };
    load();
  }, [query]);

  return (
    <div className="min-h-screen bg-background pt-10 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="font-serif text-3xl font-bold text-textMain">
            Search Results for "{query}"
          </h1>
          <p className="text-textMuted mt-2">
            {loading ? 'Searching...' : `Found ${products.length} items`}
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E94E77]"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Icons.Search className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-textMain mb-2">No matches found</h2>
            <p className="text-textMuted">Try checking your spelling or use different keywords.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group border border-gray-100"
              >
                <div className="relative aspect-square overflow-hidden bg-gray-50 rounded-full">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 rounded-full"
                  />
                </div>
                <div className="p-6 flex flex-col h-48">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 mb-1 leading-tight">{product.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{product.category.replace('-', ' ')}</p>
                  </div>
                  <div className="flex justify-between items-end mt-4">
                    <div className="flex flex-col">
                      <span className="text-sm md:text-xl font-bold text-gray-900" style={{ fontFamily: 'Arial, sans-serif' }}>&#8377;{product.price}</span>
                      {product.marketPrice && product.marketPrice > product.price && (
                        <span className="text-xs text-gray-400 line-through" style={{ fontFamily: 'Arial, sans-serif' }}>&#8377;{product.marketPrice}</span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (!user) {
                          showAlert(
                            'Sign In Required',
                            'Please sign in to add items to your cart! \n\n🎉 Sign up now to get ₹50 (500 Points) worth of rewards instantly on your first order!',
                            'warning',
                            {
                              confirmText: 'Login / Sign Up',
                              onConfirm: () => navigate('/login'),
                              cancelText: 'Cancel'
                            }
                          );
                          return;
                        }
                        addToCart(product, false); // Don't open cart
                        setToastMessage(`${product.name} added to cart!`);
                        setShowToast(true);
                      }}
                      className="bg-[#E94E77] text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-[#D63D65] transition-all shadow-lg hover:shadow-[#E94E77]/30 transform active:scale-95"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        type="success"
      />
      <CustomAlert
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        confirmText={alertState.confirmText}
        onConfirm={alertState.onConfirm}
        cancelText={alertState.cancelText}
      />
    </div>
  );
};