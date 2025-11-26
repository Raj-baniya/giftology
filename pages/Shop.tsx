import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { store } from '../services/store';
import { Product, Category } from '../types';
import { useCart } from '../contexts/CartContext';
import { Icons } from '../components/ui/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingSpinner } from '../components/ui/LoadingAnimations';
import { ProductInfiniteMenu } from '../components/ProductInfiniteMenu';

export const Shop = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const categoryFilter = searchParams.get('category');

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [priceRange, setPriceRange] = useState(5000);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'infinite'>('grid'); // Toggle between grid and infinite menu

    const { addToCart } = useCart();

    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        const load = async () => {
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

            if (searchQuery) {
                filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
            }

            filtered = filtered.filter(p => p.price <= priceRange);

            setProducts(filtered);
            setLoading(false);
        };
        load();
    }, [categoryFilter, searchQuery, priceRange]);

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

            {/* Enhanced Header Banner - Compact height on mobile */}
            <div className="relative h-[200px] md:h-[350px] w-full flex items-center overflow-hidden">
                {/* Background Image */}
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-105"
                    style={{
                        backgroundImage: "url('https://images.pexels.com/photos/5414005/pexels-photo-5414005.jpeg?auto=compress&cs=tinysrgb&w=1600')",
                    }}
                />

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/40" />

                {/* Content */}
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center md:text-left"
                    >
                        <h1 className="font-serif text-3xl md:text-6xl font-bold text-white mb-2 md:mb-4 drop-shadow-lg leading-tight">
                            Explore Our <br />
                            <span className="text-primary italic">Collection</span>
                        </h1>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-4 py-6 md:py-12">

                {/* Mobile Filter Toggle */}
                <button
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className="lg:hidden w-full mb-6 bg-white border border-gray-200 py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm sticky top-16 z-30 smooth-transition hover-lift btn-animated"
                >
                    <Icons.Menu className="w-4 h-4" />
                    {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
                </button>

                {/* View Mode Toggle */}
                <div className="mb-6 flex justify-center gap-2">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 smooth-transition ${viewMode === 'grid'
                            ? 'bg-black text-white'
                            : 'bg-white text-black border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        <Icons.Filter className="w-4 h-4" />
                        Grid View
                    </button>
                    <button
                        onClick={() => setViewMode('infinite')}
                        className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 smooth-transition ${viewMode === 'infinite'
                            ? 'bg-black text-white'
                            : 'bg-white text-black border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        <Icons.Sparkles className="w-4 h-4" />
                        Fun View
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
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                    <div className="mb-6">
                                        <h4 className="font-bold text-sm mb-2 text-textMuted">Search</h4>
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                placeholder="Product name..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full border border-gray-200 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary smooth-transition"
                                            />
                                            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <h4 className="font-bold text-sm mb-3 text-textMuted">Categories</h4>
                                        <div className="relative">
                                            <select
                                                value={categoryFilter || 'all'}
                                                onChange={(e) => handleCategoryClick(e.target.value)}
                                                className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 pr-10 rounded-lg leading-tight focus:outline-none focus:ring-1 focus:ring-primary smooth-transition cursor-pointer text-sm font-medium"
                                            >
                                                {categoriesList.map(cat => (
                                                    <option key={cat.id} value={cat.slug}>
                                                        {cat.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                                <Icons.ChevronDown className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-bold text-sm text-textMuted">Max Price</h4>
                                            <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded" style={{ fontFamily: 'Arial, sans-serif' }}>&#8377;{priceRange}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="5000"
                                            value={priceRange}
                                            onChange={(e) => setPriceRange(Number(e.target.value))}
                                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#E94E77]"
                                        />
                                        <div className="flex justify-between text-xs text-gray-400 mt-2" style={{ fontFamily: 'Arial, sans-serif' }}>
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
                            <div className="w-full h-[600px] md:h-[700px] lg:h-[800px] rounded-2xl overflow-hidden shadow-2xl bg-black mb-8">
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
                                        className="bg-white rounded-lg md:rounded-xl overflow-hidden shadow-sm hover:shadow-xl smooth-transition-slow group border border-gray-100 flex flex-col relative cursor-pointer card-hover"
                                    >
                                        <div className="relative aspect-square overflow-hidden bg-gray-50">
                                            <img
                                                src={product.imageUrl}
                                                alt={product.name}
                                                className="w-full h-full object-contain smooth-transition-slow md:group-hover:scale-110 p-2"
                                            />
                                            {product.trending && (
                                                <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md flex items-center gap-1 z-10">
                                                    <Icons.TrendingUp className="w-3 h-3" /> Trending
                                                </div>
                                            )}
                                            {(!product.stock || product.stock <= 0) && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                                                    <span className="bg-white text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Out of Stock</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3 md:p-5 flex flex-col flex-1">
                                            <div className="flex-1 min-h-[60px]">
                                                <p className="text-[10px] md:text-xs text-gray-400 capitalize mb-1 truncate">{product.category.replace('-', ' ')}</p>
                                                <h3 className="font-bold text-sm md:text-lg text-gray-900 leading-tight line-clamp-2">{product.name}</h3>
                                            </div>
                                            <div className="flex flex-col md:flex-row md:items-end justify-between mt-3 gap-2">
                                                <div className="flex flex-col">
                                                    <span className="text-sm md:text-xl font-bold text-gray-900" style={{ fontFamily: 'Arial, sans-serif' }}>&#8377;{product.price}</span>
                                                    {product.marketPrice && product.marketPrice > product.price && (
                                                        <span className="text-xs text-gray-400 line-through" style={{ fontFamily: 'Arial, sans-serif' }}>&#8377;{product.marketPrice}</span>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        addToCart(product);
                                                    }}
                                                    disabled={!product.stock || product.stock <= 0}
                                                    className={`w-full md:w-auto px-3 py-2 md:px-4 md:py-2 rounded-md text-xs md:text-sm font-bold smooth-transition flex items-center justify-center gap-1.5 btn-animated ${!product.stock || product.stock <= 0
                                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                        : 'bg-[#E94E77] text-white active:bg-[#D63D65] hover-lift'
                                                        }`}
                                                >
                                                    <Icons.ShoppingBag className="w-3 h-3 md:w-4 md:h-4" />
                                                    {(!product.stock || product.stock <= 0) ? 'Sold' : 'Add'}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};