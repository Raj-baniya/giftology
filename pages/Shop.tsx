import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { store } from '../services/store';
import { Product, Category } from '../types';
import { useCart } from '../contexts/CartContext';
import { Icons } from '../components/ui/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingSpinner } from '../components/ui/LoadingAnimations';
import { ProductInfiniteMenu } from '../components/ProductInfiniteMenu';
import { Toast } from '../components/Toast';

export const Shop = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const categoryFilter = searchParams.get('category');
    const searchParam = searchParams.get('search'); // Get search parameter from URL

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(searchParam || ''); // Initialize with URL search param
    const [priceRange, setPriceRange] = useState(5000);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'infinite'>('grid'); // Toggle between grid and infinite menu
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const { addToCart } = useCart();

    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const [allProducts, allCategories] = await Promise.all([
                    store.getProducts(),
                    store.getCategories()
                ]);

                setCategories(allCategories);
                console.log('All Products:', allProducts);

                let filtered = allProducts;

                if (categoryFilter && categoryFilter !== 'all') {
                    if (categoryFilter === 'trending') {
                        filtered = filtered.filter(p => p.trending === true);
                    } else {
                        filtered = filtered.filter(p => p.category === categoryFilter);
                    }
                }

                // Handle search from URL parameter or local state
                const activeSearch = searchParam || searchQuery;
                if (activeSearch) {
                    filtered = filtered.filter(p => p.name.toLowerCase().includes(activeSearch.toLowerCase()));
                }

                filtered = filtered.filter(p => p.price <= priceRange);

                setProducts(filtered);
            } catch (error) {
                console.error('Failed to load shop data:', error);
                // Optionally set an error state here
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [categoryFilter, searchQuery, searchParam, priceRange]);

    const handleCategoryClick = (slug: string) => {
        if (slug === 'all') {
            searchParams.delete('category');
            setSearchParams(searchParams);
        } else {
            setSearchParams({ category: slug });
        }
        setShowMobileFilters(false);
    };

    const categoriesList = [
        { id: 'all', name: 'All', slug: 'all' },
        { id: 'trending', name: 'Trending Now', slug: 'trending' },
        ...categories
    ];

    return (
        <div className="min-h-screen bg-transparent">
            {/* Header Banner Removed */}
            <div className="pt-0"></div>

            <div className="max-w-[1600px] mx-auto px-1.5 py-6 md:py-12">

                {/* Mobile Filter Toggle - Fixed Position */}
                <button
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className="lg:hidden w-full mb-6 bg-white/5 backdrop-blur-md border border-white/10 py-3 rounded-lg font-black text-white flex items-center justify-center gap-2 shadow-sm px-4 z-40 smooth-transition hover-lift btn-animated uppercase tracking-widest text-xs"
                >
                    <Icons.Menu className="w-4 h-4" />
                    {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
                </button>

                {/* View Mode Toggle */}
                <div className="mb-6 flex justify-center gap-2">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`px-6 py-3 rounded-xl font-black flex items-center gap-2 smooth-transition uppercase tracking-widest text-[10px] ${viewMode === 'grid'
                            ? 'bg-[#E60000] text-white shadow-[0_0_15px_rgba(230,0,0,0.4)]'
                            : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                            }`}
                    >
                        <Icons.Filter className="w-4 h-4" />
                        Grid View
                    </button>
                    <button
                        onClick={() => setViewMode('infinite')}
                        className={`px-6 py-3 rounded-xl font-black flex items-center gap-2 smooth-transition uppercase tracking-widest text-[10px] ${viewMode === 'infinite'
                            ? 'bg-[#E60000] text-white shadow-[0_0_15px_rgba(230,0,0,0.4)]'
                            : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                            }`}
                    >
                        <Icons.Sparkles className="w-4 h-4" />
                        Interactive View
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Sidebar Filters */}
                    <AnimatePresence>
                        {(showMobileFilters || window.innerWidth >= 1024) && (
                            <motion.aside
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="w-full lg:w-64 flex-shrink-0 space-y-6 lg:block overflow-hidden"
                            >
                                <div className="bg-white/5 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl">
                                    <div className="mb-6">
                                        <h4 className="font-black text-[10px] mb-2 text-gray-400 uppercase tracking-widest">Search Products</h4>
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                placeholder="Search gifts..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#E60000] smooth-transition placeholder:text-gray-600 font-bold"
                                            />
                                            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <h4 className="font-black text-[10px] mb-3 text-gray-400 uppercase tracking-widest">Categories</h4>
                                        <div className="relative">
                                            <select
                                                value={categoryFilter || 'all'}
                                                onChange={(e) => handleCategoryClick(e.target.value)}
                                                className="w-full appearance-none bg-white/5 border border-white/10 text-white py-3 px-4 pr-10 rounded-xl leading-tight focus:outline-none focus:ring-1 focus:ring-[#E60000] smooth-transition cursor-pointer text-xs font-black uppercase tracking-widest"
                                            >
                                                {categoriesList.map(cat => (
                                                    <option key={cat.id} value={cat.slug} className="bg-[#1A1A2E] text-white">
                                                        {cat.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#E60000]">
                                                <Icons.ChevronDown className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-black text-[10px] text-gray-400 uppercase tracking-widest">Price Range</h4>
                                            <span className="text-[10px] font-black bg-[#E60000] text-white px-2 py-1 rounded shadow-lg shadow-[#E60000]/20 tracking-wider font-sans">&#8377;{priceRange}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="5000"
                                            value={priceRange}
                                            onChange={(e) => setPriceRange(Number(e.target.value))}
                                            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#E60000]"
                                        />
                                        <div className="flex justify-between text-[10px] text-gray-600 font-black mt-2 font-sans">
                                            <span>&#8377;0</span>
                                            <span>&#8377;5000</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.aside>
                        )}
                    </AnimatePresence>

                    {/* Product Display - Grid or Infinite Menu */}
                    <div className="flex-1">
                        {loading ? (
                            <div className="flex justify-center py-20">
                                <LoadingSpinner size="lg" />
                            </div>
                        ) : viewMode === 'infinite' ? (
                            <div className="w-full h-[65vh] rounded-2xl overflow-hidden shadow-2xl bg-transparent mb-8">
                                <ProductInfiniteMenu products={products} />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                                {products.map((product) => (
                                    <motion.div
                                        key={product.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        whileHover={{ y: -5 }}
                                        onClick={() => navigate(`/product/${product.slug || product.id}`)}
                                        className="bg-white/5 backdrop-blur-xl rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 group border border-white/10 flex flex-col relative cursor-pointer hover:shadow-[0_0_40px_rgba(230,0,0,0.15)]"
                                    >
                                        <div className="relative aspect-square overflow-hidden bg-gray-50">
                                            <img
                                                src={product.imageUrl}
                                                alt={product.name}
                                                className="w-full h-full object-contain smooth-transition-slow md:group-hover:scale-110 p-2"
                                            />
                                            {product.marketPrice && product.marketPrice > product.price && (
                                                <div className="absolute top-2 right-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md flex items-center gap-1 z-10">
                                                    {Math.round(((product.marketPrice - product.price) / product.marketPrice) * 100)}% OFF
                                                </div>
                                            )}
                                            {(!product.stock || product.stock <= 0) && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                                                    <span className="bg-white text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Out of Stock</span>
                                                </div>
                                            )}
                                            {/* Review Badge */}
                                            {product.reviewCount && product.reviewCount > 0 ? (
                                                <div className="absolute top-2 left-2 z-10 flex items-center gap-1">
                                                    <div className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm">
                                                        <span>{product.rating}</span>
                                                        <Icons.Star className="w-2.5 h-2.5 fill-current" />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-gray-500 bg-white/80 px-1 rounded backdrop-blur-sm">
                                                        ({product.reviewCount})
                                                    </span>
                                                </div>
                                            ) : null}
                                        </div>
                                        <div className="p-3 md:p-5 flex flex-col flex-1">
                                            <div className="flex-1 min-h-[60px]">
                                                <p className="text-[10px] md:text-xs text-gray-500 font-black uppercase tracking-widest mb-1 truncate">{product.category.replace('-', ' ')}</p>
                                                <h3 className="font-black text-sm md:text-lg text-white leading-tight line-clamp-2 uppercase tracking-tight group-hover:text-[#E60000] transition-colors">{product.name}</h3>
                                            </div>
                                            <div className="flex flex-col md:flex-row md:items-end justify-between mt-3 gap-2">
                                                <div className="flex flex-col">
                                                    <span className="text-sm md:text-xl font-black text-white" style={{ fontFamily: 'Arial, sans-serif' }}>&#8377;{product.price}</span>
                                                    {product.marketPrice && product.marketPrice > product.price && (
                                                        <span className="text-xs text-gray-500 font-bold line-through italic" style={{ fontFamily: 'Arial, sans-serif' }}>&#8377;{product.marketPrice}</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-end gap-1 min-h-[32px] justify-center">
                                                    {(!product.stock || product.stock <= 0) ? (
                                                        <div className="flex items-center gap-1 text-[10px] font-black text-gray-500 bg-white/5 border border-white/10 px-2 py-1 rounded-full uppercase tracking-tighter">
                                                            <span>Sold Out</span>
                                                        </div>
                                                    ) : product.id.length % 2 === 0 ? (
                                                        <div className="flex items-center gap-1 text-[10px] font-black text-green-400 bg-green-950/30 border border-green-500/20 px-2 py-1 rounded-full uppercase tracking-tighter">
                                                            <Icons.Truck className="w-3 h-3" />
                                                            <span>Free Delivery</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1 text-[10px] font-black text-purple-400 bg-purple-950/30 border border-purple-500/20 px-2 py-1 rounded-full uppercase tracking-tighter">
                                                            <Icons.Gift className="w-3 h-3" />
                                                            <span>Gift Wrapping</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Toast Notification */}
            <Toast
                message={toastMessage}
                isVisible={showToast}
                onClose={() => setShowToast(false)}
                type="success"
            />
        </div>
    );
};