import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { store } from '../services/store';
import { Product } from '../types';
import { useCart } from '../contexts/CartContext';
import { Icons } from '../components/ui/Icons';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Toast } from '../components/Toast';
import { CustomAlert, useCustomAlert } from '../components/CustomAlert';

export const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { alertState, showAlert, closeAlert } = useCustomAlert();
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
    <div className="min-h-screen bg-background py-12 px-4 relative text-charcoal">
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-16 text-center">
          <h1 className="text-4xl font-serif font-black text-charcoal uppercase tracking-[0.2em] mb-4">
            Search Results: <span className="text-primary">{query}</span>
          </h1>
          <div className="inline-block px-6 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {loading ? 'Searching...' : `Found ${products.length} Products`}
            </p>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[2.5rem] border border-charcoal/10 shadow-xl">
            <Icons.Search className="w-20 h-20 text-gray-200 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-charcoal mb-3 uppercase tracking-widest">No Matches Found</h2>
            <p className="text-gray-400 font-bold uppercase tracking-tighter italic">Try different keywords or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2rem] overflow-hidden border border-charcoal/5 group hover:shadow-xl transition-all duration-500"
              >
                <div className="relative aspect-square overflow-hidden bg-white/5">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-8 flex flex-col h-56">
                  <div className="flex-1">
                    <h3 className="font-serif font-black text-xl text-charcoal mb-2 uppercase tracking-tight leading-tight group-hover:text-primary transition-colors">{product.name}</h3>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{product.category.replace('-', ' ')}</p>
                  </div>
                  <div className="flex justify-between items-end mt-4">
                    <div className="flex flex-col">
                      <span className="text-2xl font-black text-charcoal">&#8377;{product.price.toLocaleString()}</span>
                      {product.marketPrice && product.marketPrice > product.price && (
                        <span className="text-[10px] text-gray-500 font-black line-through uppercase tracking-tighter">&#8377;{product.marketPrice.toLocaleString()}</span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (!user) {
                          showAlert(
                            'Sign In Required',
                            'Please sign in to add items to your cart! \n\n🎉 Sign up now to get 500 reward points instantly.',
                            'warning',
                            {
                              confirmText: 'Sign In',
                              onConfirm: () => navigate('/login')
                            }
                          );
                          return;
                        }
                        addToCart(product, false);
                        setToastMessage(`${product.name} Added to Cart`);
                        setShowToast(true);
                      }}
                      className="bg-primary text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:shadow-lg active:scale-95 transition-all"
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