
import React, { useEffect, useState, useMemo } from 'react';
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
    const searchParam = searchParams.get('search');

    // Data State (Master List)
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [datasetLoaded, setDatasetLoaded] = useState(false);

    // UI/Filter State
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(searchParam || '');
    const [priceRange, setPriceRange] = useState(5000);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'infinite'>('grid');
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const { addToCart } = useCart();

    // Initial Data Fetch (Runs interactions only once)
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [productsData, categoriesData] = await Promise.all([
                    store.getProducts(),
                    store.getCategories()
                ]);
                setAllProducts(productsData);
                setCategories(categoriesData);
                setDatasetLoaded(true);
            } catch (error) {
                console.error('Failed to load shop data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Filter Logic (Runs whenever filters or master data changes)
    const filteredProducts = useMemo(() => {
        if (!datasetLoaded) return [];

        let filtered = allProducts;

        // 1. Category Filter
        if (categoryFilter && categoryFilter !== 'all') {
            if (categoryFilter === 'trending') {
                filtered = filtered.filter(p => p.trending === true);
            } else {
                filtered = filtered.filter(p => p.category === categoryFilter);
            }
        }

        // 2. Search Filter (URL or Input)
        const activeSearch = searchParam || searchQuery;
        if (activeSearch) {
            const term = activeSearch.toLowerCase();
            filtered = filtered.filter(p => p.name.toLowerCase().includes(term));
        }

        // 3. Price Filter
        filtered = filtered.filter(p => p.price <= priceRange);

        return filtered;
    }, [allProducts, datasetLoaded, categoryFilter, searchParam, searchQuery, priceRange]);

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
        <div className="min-h-screen bg-background">
            {/* Header Banner Removed */}
            <div className="pt-0"></div>

            <div className="max-w-[1600px] mx-auto px-1.5 py-6 md:py-12">

                {/* Mobile Filter Toggle - Fixed Position */}
                <button
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className="lg:hidden w-full mb-3 bg-white border border-gray-100 py-2.5 rounded-xl font-bold text-textMain flex items-center justify-center gap-2 shadow-sm px-4 z-40 smooth-transition uppercase tracking-widest text-[9px]"
                >
                    <Icons.Menu className="w-3.5 h-3.5" />
                    {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
                </button>

                {/* View Mode Toggle */}
                <div className="mb-4 flex justify-center gap-1.5">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 smooth-transition uppercase tracking-widest text-[9px] ${viewMode === 'grid'
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'bg-white text-textMuted border border-gray-100 hover:bg-gray-50'
                            }`}
                    >
                        <Icons.Filter className="w-3 h-3" />
                        Grid View
                    </button>
                    <button
                        onClick={() => setViewMode('infinite')}
                        className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 smooth-transition uppercase tracking-widest text-[9px] ${viewMode === 'infinite'
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'bg-white text-textMuted border border-gray-100 hover:bg-gray-50'
                            }`}
                    >
                        <Icons.Sparkles className="w-3 h-3" />
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
                                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl">
                                    <div className="mb-6">
                                        <h4 className="font-bold text-[10px] mb-3 text-textMuted uppercase tracking-widest">Search Products</h4>
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                placeholder="Search gifts..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full bg-[#FAF9F6] border border-gray-100 rounded-xl py-3 pl-10 pr-4 text-sm text-textMain focus:outline-none focus:border-primary smooth-transition placeholder:text-gray-400 font-medium"
                                            />
                                            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <h4 className="font-bold text-[10px] mb-3 text-textMuted uppercase tracking-widest">Categories</h4>
                                        <div className="relative">
                                            <select
                                                value={categoryFilter || 'all'}
                                                onChange={(e) => handleCategoryClick(e.target.value)}
                                                className="w-full appearance-none bg-[#FAF9F6] border border-gray-100 text-textMain py-3 px-4 pr-10 rounded-xl leading-tight focus:outline-none focus:border-primary smooth-transition cursor-pointer text-xs font-bold uppercase tracking-widest"
                                            >
                                                {categoriesList.map(cat => (
                                                    <option key={cat.id} value={cat.slug} className="bg-white text-textMain">
                                                        {cat.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-primary">
                                                <Icons.ChevronDown className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-bold text-[10px] text-textMuted uppercase tracking-widest">Price Range</h4>
                                            <span className="text-[10px] font-bold bg-green-600 text-white px-2 py-1 rounded shadow-lg shadow-green-200 tracking-wider font-sans">₹{priceRange}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="5000"
                                            value={priceRange}
                                            onChange={(e) => setPriceRange(Number(e.target.value))}
                                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                        <div className="flex justify-between text-[10px] text-textMuted font-bold mt-2 font-sans">
                                            <span>₹0</span>
                                            <span>₹5000</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.aside>
                        )}
                    </AnimatePresence>

                    {/* Product Display - Grid or Infinite Menu */}
                    <div className="flex-1">
                        {loading && !datasetLoaded ? (
                            <div className="flex justify-center py-20">
                                <LoadingSpinner size="lg" />
                            </div>
                        ) : viewMode === 'infinite' ? (
                            <div className="w-full h-[65vh] rounded-2xl overflow-hidden shadow-2xl bg-transparent mb-8">
                                <ProductInfiniteMenu products={filteredProducts} />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-6">
                                {filteredProducts.map((product) => (
                                    <motion.div
                                        key={product.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        whileHover={{ y: -5 }}
                                        onClick={() => navigate(`/product/${product.slug || product.id}`)}
                                        className="bg-white rounded-2xl md:rounded-[2rem] overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 group border border-gray-100 flex flex-col relative cursor-pointer"
                                    >
                                        <div className="relative aspect-[4/5] overflow-hidden bg-[#FAF9F6]">
                                            <img
                                                src={product.imageUrl}
                                                alt={product.name}
                                                loading="lazy"
                                                decoding="async"
                                                className="w-full h-full object-cover smooth-transition-slow md:group-hover:scale-105"
                                            />
                                            {product.marketPrice && product.marketPrice > product.price && (
                                                <div className="absolute top-3 right-3 bg-primary text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg z-10 tracking-widest">
                                                    {Math.round(((product.marketPrice - product.price) / product.marketPrice) * 100)}% OFF
                                                </div>
                                            )}
                                            {(!product.stock || product.stock <= 0) && (
                                                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-20">
                                                    <span className="bg-textMain text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest">Currently Unavailable</span>
                                                </div>
                                            )}
                                            {/* Review Badge */}
                                            {product.reviewCount && product.reviewCount > 0 ? (
                                                <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
                                                    <div className="bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm border border-gray-100">
                                                        <Icons.Star className="w-3 h-3 text-accent fill-current" />
                                                        <span>{product.rating}</span>
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>
                                        <div className="p-2.5 md:p-5 flex flex-col flex-1 bg-white">
                                            <div className="flex-1 min-h-[45px]">
                                                <p className="text-[8px] text-textMuted font-bold uppercase tracking-[0.2em] mb-0.5">{product.category.replace('-', ' ')}</p>
                                                <h3 className="font-bold text-[11px] md:text-sm text-textMain leading-snug line-clamp-2 uppercase tracking-wide group-hover:text-primary transition-colors">{product.name}</h3>
                                            </div>
                                            <div className="flex flex-col md:flex-row md:items-end justify-between mt-2 gap-1.5">
                                                <div className="flex flex-col">
                                                    <span className="text-xs md:text-lg font-bold text-green-600">₹{product.price}</span>
                                                    {product.marketPrice && product.marketPrice > product.price && (
                                                        <span className="text-[9px] text-textMuted font-medium line-through">₹{product.marketPrice}</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-end gap-1 min-h-[24px] justify-center">
                                                    {(!product.stock || product.stock <= 0) ? (
                                                        <div className="flex items-center gap-1 text-[8px] font-bold text-textMuted bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-full uppercase tracking-widest">
                                                            <span>Out of Stock</span>
                                                        </div>
                                                    ) : product.id.length % 2 === 0 ? (
                                                        <div className="flex items-center gap-1 text-[8px] font-bold text-green-600 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded-full uppercase tracking-widest">
                                                            <Icons.Truck className="w-2.5 h-2.5" />
                                                            <span>Express</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1 text-[8px] font-bold text-primary bg-primary/5 border border-primary/10 px-1.5 py-0.5 rounded-full uppercase tracking-widest">
                                                            <Icons.Gift className="w-2.5 h-2.5" />
                                                            <span>Luxe</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                        {/* Fallback for no results */}
                        {filteredProducts.length === 0 && !loading && datasetLoaded && (
                            <div className="text-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-xl">
                                <Icons.Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-textMain uppercase tracking-widest mb-2">No Products Found</h3>
                                <p className="text-textMuted text-sm">Try adjusting your filters or search query.</p>
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