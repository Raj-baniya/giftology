import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { store } from '../services/store';
import { getContactMessages, seedDatabase } from '../services/supabaseService';
import { supabase } from '../services/supabaseClient';
import { Product, Order, Category } from '../types';
import { Icons } from '../components/ui/Icons';
import { CustomAlert, useCustomAlert } from '../components/CustomAlert';
import { ProductAnalyticsModal } from '../components/ProductAnalyticsModal';
import { CategoryManagement } from './CategoryManagement';

export const Admin = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { alertState, showAlert, closeAlert } = useCustomAlert();

    // State
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [leads, setLeads] = useState<any[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'leads' | 'reviews' | 'categories' | 'play'>('inventory');
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

    // Filter & Search State
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');

    // Modal State


    // Analytics Modal State
    const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
    const [selectedProductAnalytics, setSelectedProductAnalytics] = useState<any>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    // Auth & Loading State
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [seeding, setSeeding] = useState(false);

    // Form


    // --- Auth Check ---
    useEffect(() => {
        const checkAdminAuth = async () => {
            try {
                // 1. Check Supabase Session
                const { data: { session } } = await supabase.auth.getSession();
                const ADMIN_EMAILS = ['giftology.in01@gmail.com', 'giftology.in02@gmail.com', 'giftology.in14@gmail.com'];
                const isSupabaseAdmin = session?.user?.email && ADMIN_EMAILS.includes(session.user.email);

                // 2. Check SessionStorage Fallback
                const isFallbackAuth = sessionStorage.getItem('giftology_admin_auth') === 'true';

                if (isSupabaseAdmin || isFallbackAuth) {
                    setIsAdmin(true);
                } else {
                    setIsAdmin(false);
                }
            } catch (e) {
                console.error("Auth check failed:", e);
                setIsAdmin(false);
            } finally {
                setIsLoadingAuth(false);
            }
        };
        checkAdminAuth();
    }, []);

    // --- Data Loading ---
    const loadData = async () => {
        try {
            setError(null);
            // Fetch Categories
            try {
                const catData = await store.getCategories();
                setCategories(catData || []);
            } catch (e) {
                console.error('Failed to load categories:', e);
            }

            // Fetch Products
            try {
                const productData = await store.getAdminProducts();
                console.log('Admin Product Data:', productData);
                setProducts(productData || []);
            } catch (e) {
                console.error('Failed to load products:', e);
                setError('Failed to load products. Check console for details.');
            }

            const orderData = await store.getOrders();
            console.log('Admin Orders Data:', orderData); // Debugging
            setOrders((orderData || []).sort((a, b) => {
                // 1. Fast Delivery First
                if (a.deliveryType === 'Fast Delivery' && b.deliveryType !== 'Fast Delivery') return -1;
                if (a.deliveryType !== 'Fast Delivery' && b.deliveryType === 'Fast Delivery') return 1;
                // 2. Newest Date First
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            }));

            const leadsData = await getContactMessages();
            setLeads(leadsData || []);
        } catch (err: any) {
            console.error('Failed to load admin data:', err);
            setError(`Failed to load data: ${err.message || 'Unknown error'}`);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            loadData();

            // Realtime Subscription
            const channel = supabase
                .channel('admin-orders-changes')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'orders' },
                    (payload) => {
                        console.log('Realtime update received:', payload);
                        loadData();
                    }
                )
                .subscribe();

            // Polling Fallback
            const intervalId = setInterval(() => {
                loadData();
            }, 10000); // Increased to 10s to reduce load

            return () => {
                supabase.removeChannel(channel);
                clearInterval(intervalId);
            };
        }
    }, [isAdmin]);

    // --- Actions ---
    const handleSeed = async () => {
        showAlert(
            'Seed Database',
            'Are you sure you want to seed the database? This will add initial products.',
            'warning',
            {
                confirmText: 'Yes, Seed Database',
                onConfirm: async () => {
                    setSeeding(true);
                    const result = await seedDatabase();
                    if (result.success) {
                        await loadData();
                        showAlert('Success', 'Database seeded successfully!', 'success');
                    } else {
                        showAlert('Error', 'Seeding completed with errors:\n' + result.errors.join('\n'), 'error');
                        await loadData();
                    }
                    setSeeding(false);
                },
                cancelText: 'Cancel'
            }
        );
    };

    const handleLogout = async () => {
        showAlert(
            'Logout',
            'Are you sure you want to logout?',
            'warning',
            {
                confirmText: 'Logout',
                onConfirm: () => {
                    setTimeout(async () => {
                        await supabase.auth.signOut();
                        sessionStorage.removeItem('giftology_admin_auth');
                        window.location.href = '/login';
                    }, 0);
                },
                cancelText: 'Cancel'
            }
        );
    };

    const deleteProduct = async (id: string) => {
        showAlert(
            'Delete Product',
            'Are you sure you want to delete this product?',
            'warning',
            {
                confirmText: 'Delete',
                onConfirm: async () => {
                    try {
                        await store.deleteProduct(id);
                        await loadData();
                        showAlert('Success', 'Product deleted successfully.', 'success');
                    } catch (e) {
                        showAlert('Error', 'Failed to delete product', 'error');
                    }
                },
                cancelText: 'Cancel'
            }
        );
    };

    const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
        try {
            await store.updateOrderStatus(orderId, newStatus);
            await loadData();
        } catch (e: any) {
            console.error(e);
            showAlert('Error', `Failed to update order status: ${e.message || e.error_description || JSON.stringify(e)}`, 'error');
        }
    };

    // --- Variant Logic ---
    // Sync first color image to main imageUrl when colors exist


    // --- Render ---

    if (isLoadingAuth) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!isAdmin && (!user || user.role !== 'admin')) {
        return <Navigate to="/admin-login" />;
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
                    <Icons.X className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button onClick={loadData} className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800">Retry</button>
                </div>
            </div>
        );
    }



    const toggleProductExpansion = (productId: string) => {
        if (expandedProductId === productId) {
            setExpandedProductId(null);
        } else {
            setExpandedProductId(productId);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
            {/* Analytics Modal Removed */}

            <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">Admin Dashboard</h1>
                        <p className="text-gray-600 text-base md:text-lg mt-1">Manage products and view orders</p>
                        <div className="text-xs text-gray-400 mt-2">
                            Debug: Products: {products.length}, Loading: {isLoadingAuth ? 'Yes' : 'No'}, Admin: {isAdmin ? 'Yes' : 'No'}
                            {error && <div className="text-red-500">Error: {error}</div>}
                        </div>
                    </div>
                    <div className="flex gap-3 flex-wrap w-full md:w-auto">
                        <button
                            onClick={() => window.location.href = '/admin/sales'}
                            className="flex-1 md:flex-none bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:from-purple-700 hover:to-pink-700 shadow-lg transition-all duration-200 active:scale-95 min-h-[48px]"
                        >
                            <Icons.TrendingUp className="w-5 h-5" />
                            <span className="hidden sm:inline">Sales Analytics</span>
                            <span className="sm:hidden">Sales</span>
                        </button>
                        <button
                            onClick={loadData}
                            className="bg-white text-gray-700 px-5 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 shadow-md border-2 border-gray-200 transition-all duration-200 active:scale-95 min-h-[48px]"
                            title="Refresh Data"
                        >
                            <Icons.RefreshCw className="w-5 h-5" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        <button
                            onClick={handleLogout}
                            className="bg-red-600 text-white px-5 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 shadow-lg transition-all duration-200 active:scale-95 min-h-[48px]"
                        >
                            <Icons.LogOut className="w-5 h-5" />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                        <button
                            onClick={handleSeed}
                            disabled={seeding}
                            className="flex-1 md:flex-none bg-green-600 text-white px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
                        >
                            {seeding ? <Icons.RefreshCw className="w-5 h-5 animate-spin" /> : <Icons.Package className="w-5 h-5" />}
                            {seeding ? 'Seeding...' : <span className="hidden sm:inline">Seed Database</span>}
                            {!seeding && <span className="sm:hidden">Seed DB</span>}
                        </button>
                        {activeTab === 'inventory' && (
                            <button
                                onClick={() => navigate('/admin/products/new')}
                                className="flex-1 md:flex-none bg-black text-white px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 shadow-lg transition-all duration-200 active:scale-95 relative z-10 min-h-[48px]"
                            >
                                <Icons.Plus className="w-5 h-5" /> Add Product
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 md:gap-4 mb-6 border-b-2 border-gray-200 overflow-x-auto pb-0">
                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={`pb-4 px-4 text-sm md:text-base font-bold transition-all duration-200 whitespace-nowrap ${activeTab === 'inventory'
                            ? 'border-b-4 border-black text-black -mb-0.5'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        Product Inventory
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`pb-4 px-4 text-sm md:text-base font-bold transition-all duration-200 whitespace-nowrap ${activeTab === 'orders'
                            ? 'border-b-4 border-black text-black -mb-0.5'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        Order Management
                    </button>
                    <button
                        onClick={() => setActiveTab('leads')}
                        className={`pb-4 px-4 text-sm md:text-base font-bold transition-all duration-200 whitespace-nowrap ${activeTab === 'leads'
                            ? 'border-b-4 border-black text-black -mb-0.5'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        Leads & Messages
                    </button>
                    <button
                        onClick={() => setActiveTab('reviews')}
                        className={`pb-4 px-4 text-sm md:text-base font-bold transition-all duration-200 whitespace-nowrap ${activeTab === 'reviews'
                            ? 'border-b-4 border-black text-black -mb-0.5'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        Reviews
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`pb-4 px-4 text-sm md:text-base font-bold transition-all duration-200 whitespace-nowrap ${activeTab === 'categories'
                            ? 'border-b-4 border-black text-black -mb-0.5'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        Categories
                    </button>
                    <button
                        onClick={() => setActiveTab('play')}
                        className={`pb-4 px-4 text-sm md:text-base font-bold transition-all duration-200 whitespace-nowrap ${activeTab === 'play'
                            ? 'border-b-4 border-black text-black -mb-0.5'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        Play Management
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'inventory' ? (
                    <>
                        {/* Filter & Search Bar */}
                        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                {/* Category Filter */}
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Filter by Category</label>
                                    <select
                                        value={categoryFilter}
                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary outline-none bg-white text-gray-900"
                                    >
                                        <option value="all">All Categories</option>
                                        {categories.map(cat => <option key={cat.id} value={cat.slug}>{cat.name}</option>)}
                                    </select>
                                </div>
                                {/* Search Input */}
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Search Products</label>
                                    <div className="relative">
                                        <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search by name..."
                                            className="w-full border border-gray-300 rounded-lg p-2.5 pl-10 focus:ring-2 focus:ring-primary outline-none bg-white text-gray-900"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Desktop Table */}
                        <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="p-4 font-semibold text-gray-600">Image</th>
                                        <th className="p-4 font-semibold text-gray-600">Name</th>
                                        <th className="p-4 font-semibold text-gray-600">Category</th>
                                        <th className="p-4 font-semibold text-gray-600">Subcategory</th>
                                        <th className="p-4 font-semibold text-gray-600">Price</th>
                                        <th className="p-4 font-semibold text-gray-600">Cost Price</th>
                                        <th className="p-4 font-semibold text-gray-600">Stock</th>
                                        <th className="p-4 font-semibold text-gray-600">Status</th>
                                        <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {products
                                        .filter(product => {
                                            // Category filter
                                            if (categoryFilter !== 'all' && product.category !== categoryFilter) return false;
                                            // Search filter
                                            if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                                            return true;
                                        })
                                        .map(product => (
                                            <React.Fragment key={product.id}>
                                                <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleProductExpansion(product.id)}>
                                                    <td className="p-4"><img src={product.imageUrl} alt={product.name} className="w-12 h-12 rounded-md object-cover bg-gray-200" /></td>
                                                    <td className="p-4 font-medium">
                                                        <div className="flex items-center gap-2">
                                                            {expandedProductId === product.id ? <Icons.ChevronDown className="w-4 h-4" /> : <Icons.ChevronRight className="w-4 h-4" />}
                                                            {product.name}
                                                        </div>
                                                    </td>
                                                    <td className="p-4"><span className="bg-primary/20 text-primary-dark px-2 py-1 rounded text-xs font-bold uppercase">{product.category.replace('-', ' ')}</span></td>
                                                    <td className="p-4"><span className="text-xs text-gray-500 uppercase">{product.subcategory?.replace('-', ' ') || '-'}</span></td>
                                                    <td className="p-4" style={{ fontFamily: 'Arial, sans-serif' }}>&#8377;{product.price.toLocaleString()}</td>
                                                    <td className="p-4 text-gray-600" style={{ fontFamily: 'Arial, sans-serif' }}>
                                                        {product.costPrice ? `₹${product.costPrice.toLocaleString()}` : '-'}
                                                    </td>
                                                    <td className="p-4 font-medium">{product.stock ?? 0}</td>
                                                    <td className="p-4">{product.trending && <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-full"><Icons.TrendingUp className="w-3 h-3" /> Trending</span>}</td>
                                                    <td className="p-4 text-right space-x-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); navigate(`/admin/products/edit/${product.id}`); }}
                                                            className="text-blue-600 hover:bg-blue-50 p-3 rounded-lg transition-colors"
                                                            title="Edit Product"
                                                        >
                                                            <Icons.Edit2 className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); deleteProduct(product.id); }}
                                                            className="text-red-600 hover:bg-red-50 p-3 rounded-lg transition-colors"
                                                            title="Delete Product"
                                                        >
                                                            <Icons.Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                                {expandedProductId === product.id && (
                                                    <tr>
                                                        <td colSpan={9} className="bg-gray-50 p-6 border-b shadow-inner">
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                                {/* Basic Info */}
                                                                <div>
                                                                    <h4 className="font-bold text-sm uppercase text-gray-500 mb-3">Product Details</h4>
                                                                    <div className="space-y-2 text-sm">
                                                                        <p><span className="font-semibold">ID:</span> {product.id}</p>
                                                                        <p><span className="font-semibold">Slug:</span> {product.slug}</p>
                                                                        <p><span className="font-semibold">Category:</span> {product.category}</p>
                                                                        <p><span className="font-semibold">Subcategory:</span> {product.subcategory || 'N/A'}</p>
                                                                        <p><span className="font-semibold">Color Variant Group:</span> {product.colorVariantGroup || 'None'}</p>
                                                                        <p><span className="font-semibold">Description:</span> <span className="text-gray-600">{product.description}</span></p>
                                                                    </div>
                                                                </div>

                                                                {/* Variants */}
                                                                <div>
                                                                    <h4 className="font-bold text-sm uppercase text-gray-500 mb-3">Variants & Stock</h4>
                                                                    {product.variants && product.variants.length > 0 ? (
                                                                        <div className="bg-white rounded-lg border overflow-hidden">
                                                                            <table className="w-full text-sm text-left">
                                                                                <thead className="bg-gray-100">
                                                                                    <tr>
                                                                                        <th className="p-2">Color</th>
                                                                                        <th className="p-2">Size</th>
                                                                                        <th className="p-2">Stock</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y">
                                                                                    {product.variants.map((v, idx) => (
                                                                                        <tr key={idx}>
                                                                                            <td className="p-2">{v.color || '-'}</td>
                                                                                            <td className="p-2">{v.size || '-'}</td>
                                                                                            <td className="p-2 font-mono">{v.stock_quantity}</td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-sm text-gray-500">No variants defined. Main stock: {product.stock}</p>
                                                                    )}
                                                                </div>

                                                                {/* Images */}
                                                                <div>
                                                                    <h4 className="font-bold text-sm uppercase text-gray-500 mb-3">Images</h4>
                                                                    {(() => {
                                                                        const colorImages: Record<string, string[]> = {};
                                                                        let hasColorImages = false;

                                                                        if (product.variants && product.variants.length > 0) {
                                                                            product.variants.forEach(v => {
                                                                                if (v.color && v.images && v.images.length > 0) {
                                                                                    if (!colorImages[v.color]) {
                                                                                        colorImages[v.color] = v.images;
                                                                                        hasColorImages = true;
                                                                                    }
                                                                                }
                                                                            });
                                                                        }

                                                                        if (hasColorImages) {
                                                                            return (
                                                                                <div className="space-y-4">
                                                                                    {Object.entries(colorImages).map(([color, images]) => (
                                                                                        <div key={color}>
                                                                                            <p className="text-xs font-bold text-gray-700 mb-1 capitalize">{color}</p>
                                                                                            <div className="flex flex-wrap gap-2">
                                                                                                {images.map((img, idx) => (
                                                                                                    <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className="block w-16 h-16 rounded-lg overflow-hidden border hover:opacity-75">
                                                                                                        <img src={img} alt={`${color} ${idx}`} className="w-full h-full object-cover" />
                                                                                                    </a>
                                                                                                ))}
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            );
                                                                        } else {
                                                                            return (
                                                                                <div className="flex flex-wrap gap-2">
                                                                                    {product.images && product.images.length > 0 ? (
                                                                                        product.images.map((img, idx) => (
                                                                                            <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className="block w-20 h-20 rounded-lg overflow-hidden border hover:opacity-75">
                                                                                                <img src={img} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                                                                                            </a>
                                                                                        ))
                                                                                    ) : (
                                                                                        <p className="text-sm text-gray-500">No images available</p>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        }
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Mobile List */}
                        <div className="md:hidden space-y-4">
                            {products
                                .filter(product => {
                                    // Category filter
                                    if (categoryFilter !== 'all' && product.category !== categoryFilter) return false;
                                    // Search filter
                                    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                                    return true;
                                })
                                .map(product => (
                                    <div key={product.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer active:scale-[0.99] transition-transform" onClick={() => toggleProductExpansion(product.id)}>
                                        <div className="flex gap-4 mb-3">
                                            <img src={product.imageUrl} alt={product.name} className="w-20 h-20 rounded-lg object-cover bg-gray-100 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-bold text-gray-900 line-clamp-2 mb-1 pr-2">{product.name}</h3>
                                                    {product.trending && <Icons.TrendingUp className="w-4 h-4 text-orange-500 shrink-0" />}
                                                </div>
                                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">{product.category.replace('-', ' ')} {product.subcategory ? `> ${product.subcategory.replace('-', ' ')}` : ''}</p>
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-bold text-lg text-gray-900" style={{ fontFamily: 'Arial, sans-serif' }}>&#8377;{product.price.toLocaleString()}</p>
                                                        {product.costPrice && (
                                                            <p className="text-xs text-gray-500" style={{ fontFamily: 'Arial, sans-serif' }}>
                                                                Cost: ₹{product.costPrice.toLocaleString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600">Stock: {product.stock ?? 0}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {expandedProductId === product.id && (
                                            <div className="border-t pt-3 mt-3 text-sm space-y-3">
                                                <div>
                                                    <span className="font-bold text-gray-700">Description:</span>
                                                    <p className="text-gray-600 mt-1">{product.description}</p>
                                                </div>
                                                {product.variants && product.variants.length > 0 && (
                                                    <div>
                                                        <span className="font-bold text-gray-700">Variants:</span>
                                                        <div className="mt-2 space-y-1">
                                                            {product.variants.map((v, idx) => (
                                                                <div key={idx} className="flex justify-between bg-gray-50 p-2 rounded">
                                                                    <span>{v.color} - {v.size}</span>
                                                                    <span className="font-mono">Qty: {v.stock_quantity}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex gap-3 pt-3 border-t border-gray-100 mt-3">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); navigate(`/admin/products/edit/${product.id}`); }}
                                                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-blue-700 active:scale-95 transition-all shadow-md min-h-[48px]"
                                            >
                                                <Icons.Edit2 className="w-5 h-5" /> Edit
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteProduct(product.id); }}
                                                className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-red-700 active:scale-95 transition-all shadow-md min-h-[48px]"
                                            >
                                                <Icons.Trash2 className="w-5 h-5" /> Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </>
                ) : activeTab === 'orders' ? (
                    <>
                        {/* Order Status Filter */}
                        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Filter by Status</label>
                            <select
                                value={orderStatusFilter}
                                onChange={(e) => setOrderStatusFilter(e.target.value)}
                                className="w-full md:w-64 border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary outline-none bg-white text-gray-900"
                            >
                                <option value="all">All Orders</option>
                                <option value="priority">🔥 Highest Priority (Fast Delivery)</option>
                                <option value="processing">⏳ Processing</option>
                                <option value="shipped">📦 Shipped</option>
                                <option value="delivered">✅ Delivered</option>
                                <option value="cancelled">❌ Cancelled</option>
                            </select>
                        </div>

                        {orders.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-xl shadow-sm">
                                <Icons.Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                <h2 className="text-xl font-bold text-textMain">No orders found</h2>
                                <p className="text-textMuted">Orders placed by customers will appear here.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Desktop Orders */}
                                <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="p-4 font-semibold text-gray-600">Order ID / Date</th>
                                                <th className="p-4 font-semibold text-gray-600">Customer</th>
                                                <th className="p-4 font-semibold text-gray-600">Address</th>
                                                <th className="p-4 font-semibold text-gray-600">Items</th>
                                                <th className="p-4 font-semibold text-gray-600">Payment</th>
                                                <th className="p-4 font-semibold text-gray-600">Total</th>
                                                <th className="p-4 font-semibold text-gray-600">Delivery</th>
                                                <th className="p-4 font-semibold text-gray-600">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {orders
                                                .filter(order => {
                                                    if (orderStatusFilter === 'all') return true;
                                                    if (orderStatusFilter === 'priority') return order.deliveryType === 'Fast Delivery';
                                                    return order.status.toLowerCase() === orderStatusFilter;
                                                })
                                                .map(order => (
                                                    <React.Fragment key={order.id}>
                                                        <tr
                                                            onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                                                            className={`hover:bg-gray-50 cursor-pointer transition-colors ${order.deliveryType === 'Fast Delivery' ? 'bg-red-50/50' : ''}`}
                                                        >
                                                            <td className="p-4">
                                                                <div className="font-mono text-sm font-bold flex items-center gap-2">
                                                                    {expandedOrderId === order.id ? <Icons.ChevronDown className="w-4 h-4" /> : <Icons.ChevronRight className="w-4 h-4" />}
                                                                    #{order.readableId || order.id.slice(0, 8)}
                                                                    {order.deliveryType === 'Fast Delivery' && <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-yellow-200">FAST</span>}
                                                                </div>
                                                                <div className="text-xs text-gray-500 pl-6">{new Date(order.date).toLocaleDateString()}</div>
                                                            </td>
                                                            <td className="p-4">
                                                                <div className="font-bold text-sm">{order.customerName || 'Guest'}</div>
                                                                <div className="text-xs text-gray-500">{order.phone}</div>
                                                                <div className="text-xs text-blue-500">{order.email}</div>
                                                            </td>
                                                            <td className="p-4 text-sm max-w-xs truncate" title={order.address}>{order.address || 'N/A'}</td>
                                                            <td className="p-4 max-w-xs">
                                                                <p className="text-sm truncate">{order.items.length} items</p>
                                                            </td>
                                                            <td className="p-4">
                                                                <div className="uppercase text-xs font-bold bg-gray-100 px-2 py-1 rounded w-fit mb-1">{order.paymentMethod || 'N/A'}</div>
                                                                {order.screenshot && <a href={order.screenshot} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><Icons.Image className="w-3 h-3" /> View Proof</a>}
                                                            </td>
                                                            <td className="p-4 font-bold" style={{ fontFamily: 'Arial, sans-serif' }}>&#8377;{order.total.toLocaleString()}</td>
                                                            <td className="p-4">
                                                                <span className={`text-xs font-bold px-2 py-1 rounded ${order.deliveryType === 'Fast Delivery' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                                                    {order.deliveryType || 'Standard'}
                                                                </span>
                                                            </td>
                                                            <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                                                <select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value as any)} className={`border-none text-sm font-bold rounded-lg px-3 py-1.5 cursor-pointer outline-none ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' : order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' : order.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                                    <option value="processing">Processing</option>
                                                                    <option value="shipped">Shipped</option>
                                                                    <option value="delivered">Delivered</option>
                                                                    <option value="cancelled">Cancelled</option>
                                                                </select>
                                                            </td>
                                                        </tr>
                                                        {expandedOrderId === order.id && (
                                                            <tr>
                                                                <td colSpan={8} className="bg-gray-50 p-4 border-b shadow-inner">
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                        <div>
                                                                            <h4 className="font-bold text-sm mb-3 text-gray-700 uppercase tracking-wide">Order Items</h4>
                                                                            <div className="space-y-3">
                                                                                {order.items.map((item: any, idx: number) => (
                                                                                    <div key={idx} className="flex items-center gap-4 bg-white p-3 rounded-lg border border-gray-100">
                                                                                        {item.imageUrl ? (
                                                                                            <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded object-cover bg-gray-100" />
                                                                                        ) : (
                                                                                            <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                                                                                                <Icons.Package className="w-6 h-6" />
                                                                                            </div>
                                                                                        )}
                                                                                        <div className="flex-1">
                                                                                            <p className="font-medium text-sm text-gray-900">{item.name}</p>
                                                                                            <p className="text-xs text-gray-500">Qty: {item.quantity} x <span style={{ fontFamily: 'Arial, sans-serif' }}>&#8377;{item.price.toLocaleString()}</span></p>
                                                                                        </div>
                                                                                        <p className="font-bold text-sm" style={{ fontFamily: 'Arial, sans-serif' }}>&#8377;{(item.price * item.quantity).toLocaleString()}</p>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <h4 className="font-bold text-sm mb-3 text-gray-700 uppercase tracking-wide">Shipping Details</h4>
                                                                            <div className="bg-white p-4 rounded-lg border border-gray-100 space-y-2 text-sm">
                                                                                <p><span className="text-gray-500">Name:</span> <span className="font-medium">{order.customerName}</span></p>
                                                                                <p><span className="text-gray-500">Address:</span> <span className="font-medium">{order.address}</span></p>
                                                                                <p><span className="text-gray-500">Phone:</span> <span className="font-medium">{order.phone}</span></p>
                                                                                <p><span className="text-gray-500">Email:</span> <span className="font-medium">{order.email}</span></p>
                                                                                <div className="border-t pt-2 mt-2">
                                                                                    <p><span className="text-gray-500">City:</span> <span className="font-medium">{order.city || 'N/A'}</span></p>
                                                                                    <p><span className="text-gray-500">State:</span> <span className="font-medium">{order.state || 'N/A'}</span></p>
                                                                                    <p><span className="text-gray-500">Zip:</span> <span className="font-medium">{order.zipCode || 'N/A'}</span></p>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Mobile Orders */}
                                <div className="md:hidden space-y-4">
                                    {orders
                                        .filter(order => {
                                            if (orderStatusFilter === 'all') return true;
                                            if (orderStatusFilter === 'priority') return order.deliveryType === 'Fast Delivery';
                                            return order.status.toLowerCase() === orderStatusFilter;
                                        })
                                        .map(order => (
                                            <div key={order.id} className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${order.deliveryType === 'Fast Delivery' ? 'border-l-4 border-l-red-500' : ''}`}>
                                                <div
                                                    onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                                                    className="p-5 cursor-pointer"
                                                >
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                                                {expandedOrderId === order.id ? <Icons.ChevronDown className="w-4 h-4" /> : <Icons.ChevronRight className="w-4 h-4" />}
                                                                Order #{order.readableId || order.id.slice(0, 8)}
                                                                {order.deliveryType === 'Fast Delivery' && <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-yellow-200">FAST</span>}
                                                            </h3>
                                                            <p className="text-xs text-gray-500 pl-6">{new Date(order.date).toLocaleDateString()}</p>
                                                        </div>
                                                        <span className="font-bold text-lg" style={{ fontFamily: 'Arial, sans-serif' }}>&#8377;{order.total.toLocaleString()}</span>
                                                    </div>

                                                    <div className="flex items-center justify-between gap-4 mt-2 pl-6">
                                                        <span className="text-sm font-bold text-gray-600">Status:</span>
                                                        <div onClick={(e) => e.stopPropagation()} className="flex-1 text-right">
                                                            <select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value as any)} className={`appearance-none font-bold text-sm bg-transparent outline-none cursor-pointer ${order.status === 'Delivered' ? 'text-green-600' : order.status === 'Shipped' ? 'text-blue-600' : order.status === 'Cancelled' ? 'text-red-600' : 'text-yellow-600'}`}>
                                                                <option value="processing">Processing</option>
                                                                <option value="shipped">Shipped</option>
                                                                <option value="delivered">Delivered</option>
                                                                <option value="cancelled">Cancelled</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>

                                                {expandedOrderId === order.id && (
                                                    <div className="bg-gray-50 p-5 border-t border-gray-100">
                                                        <h4 className="font-bold text-xs uppercase text-gray-500 mb-3">Order Items</h4>
                                                        <div className="space-y-3 mb-4">
                                                            {order.items.map((item: any, idx: number) => (
                                                                <div key={idx} className="flex items-center gap-3 bg-white p-2 rounded border border-gray-100">
                                                                    {item.imageUrl ? (
                                                                        <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded object-cover bg-gray-100" />
                                                                    ) : (
                                                                        <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                                                                            <Icons.Package className="w-5 h-5" />
                                                                        </div>
                                                                    )}
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-medium text-sm text-gray-900 truncate">{item.name}</p>
                                                                        <div className="flex gap-2 mt-1">
                                                                            {item.selectedColor && (
                                                                                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                                                                                    {item.selectedColor}
                                                                                </span>
                                                                            )}
                                                                            {item.selectedSize && (
                                                                                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                                                                                    Size: {item.selectedSize}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-xs text-gray-500 mt-1">x{item.quantity}</p>
                                                                    </div>
                                                                    <span className="font-bold text-sm" style={{ fontFamily: 'Arial, sans-serif' }}>&#8377;{(item.price * item.quantity).toLocaleString()}</span>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <h4 className="font-bold text-xs uppercase text-gray-500 mb-2">Customer</h4>
                                                        <div className="text-sm text-gray-700 space-y-1 bg-white p-3 rounded border border-gray-100">
                                                            <p className="font-bold">{order.customerName}</p>
                                                            <p>{order.address}</p>
                                                            <p>{order.city}, {order.state} {order.zipCode}</p>
                                                            <p className="text-blue-600">{order.phone}</p>
                                                        </div>

                                                        <h4 className="font-bold text-xs uppercase text-gray-500 mb-2 mt-4">Order Details</h4>
                                                        <div className="text-sm text-gray-700 space-y-2 bg-white p-3 rounded border border-gray-100">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Email</p>
                                                                    <p className="font-medium">{order.email}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Payment Method</p>
                                                                    <p className="font-medium capitalize">{order.paymentMethod}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Delivery Speed</p>
                                                                    <p className={`font-medium ${order.deliveryType === 'Fast Delivery' ? 'text-purple-600' : 'text-gray-700'}`}>
                                                                        {order.deliveryType}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Expected Delivery</p>
                                                                    <p className="font-medium">
                                                                        {(() => {
                                                                            if (!order.deliveryDate) return 'TBD';
                                                                            const date = new Date(order.deliveryDate);
                                                                            if (order.deliveryType !== 'Fast Delivery') {
                                                                                date.setDate(date.getDate() + 1);
                                                                            }
                                                                            return date.toLocaleDateString('en-IN', {
                                                                                weekday: 'short',
                                                                                year: 'numeric',
                                                                                month: 'short',
                                                                                day: 'numeric'
                                                                            });
                                                                        })()}
                                                                    </p>
                                                                </div>
                                                                <div className="md:col-span-2">
                                                                    <p className="text-xs text-gray-500">Gift Wrapping</p>
                                                                    <p className="font-medium">
                                                                        {order.giftWrapping === 'none' ? 'No Wrapping' :
                                                                            order.giftWrapping === 'plastic' ? 'Designer Plastic Wrapping' :
                                                                                order.giftWrapping === 'paper' ? 'Designer Paper Wrapping' :
                                                                                    order.giftWrapping === 'box-plastic' ? 'Box + Plastic Wrapping' :
                                                                                        order.giftWrapping === 'box-paper' ? 'Box + Paper Wrapping' : order.giftWrapping || 'None'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : activeTab === 'leads' ? (
                    /* Leads Tab */
                    <>
                        {leads.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-xl shadow-sm">
                                <Icons.Mail className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                <h2 className="text-xl font-bold text-textMain">No leads found</h2>
                                <p className="text-textMuted">Contact form submissions will appear here.</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                {/* Desktop Table */}
                                <div className="hidden md:block">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="p-4 font-semibold text-gray-600">Date</th>
                                                <th className="p-4 font-semibold text-gray-600">Name</th>
                                                <th className="p-4 font-semibold text-gray-600">Contact</th>
                                                <th className="p-4 font-semibold text-gray-600">Source</th>
                                                <th className="p-4 font-semibold text-gray-600">Message</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {leads.map((lead) => (
                                                <tr key={lead.id} className="hover:bg-gray-50">
                                                    <td className="p-4 text-sm text-gray-500">{new Date(lead.created_at).toLocaleDateString()}<div className="text-xs">{new Date(lead.created_at).toLocaleTimeString()}</div></td>
                                                    <td className="p-4 font-medium">{lead.name}</td>
                                                    <td className="p-4">
                                                        <div className="flex flex-col gap-1">
                                                            {lead.phone && <span className="flex items-center gap-2 text-sm"><Icons.Phone className="w-3 h-3 text-gray-400" />{lead.phone}</span>}
                                                            {lead.email && <span className="flex items-center gap-2 text-sm text-blue-600"><Icons.Mail className="w-3 h-3" /><a href={`mailto:${lead.email}`} className="hover:underline">{lead.email}</a></span>}
                                                        </div>
                                                    </td>
                                                    <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${lead.source === 'mobile_modal' ? 'bg-purple-100 text-purple-700' : lead.source === 'feedback_modal' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{lead.source === 'mobile_modal' ? 'Popup' : lead.source === 'feedback_modal' ? 'Feedback Form' : lead.source || 'Web'}</span></td>
                                                    <td className="p-4 text-sm text-gray-600 max-w-xs truncate">{lead.message}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile List */}
                                <div className="md:hidden divide-y">
                                    {leads.map((lead) => (
                                        <div key={lead.id} className="p-4 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-gray-900">{lead.name}</h3>
                                                    <p className="text-xs text-gray-500">{new Date(lead.created_at).toLocaleDateString()} at {new Date(lead.created_at).toLocaleTimeString()}</p>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${lead.source === 'mobile_modal' ? 'bg-purple-100 text-purple-700' : lead.source === 'feedback_modal' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                                    {lead.source === 'mobile_modal' ? 'Popup' : lead.source === 'feedback_modal' ? 'Feedback' : lead.source || 'Web'}
                                                </span>
                                            </div>

                                            <div className="space-y-1">
                                                {lead.phone && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Icons.Phone className="w-4 h-4 text-gray-400" />
                                                        {lead.phone}
                                                    </div>
                                                )}
                                                {lead.email && (
                                                    <div className="flex items-center gap-2 text-sm text-blue-600">
                                                        <Icons.Mail className="w-4 h-4" />
                                                        <a href={`mailto:${lead.email}`} className="hover:underline">{lead.email}</a>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700">
                                                {lead.message}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : activeTab === 'reviews' ? (
                    /* Reviews Tab */
                    <ReviewsTab />
                ) : activeTab === 'categories' ? (
                    /* Categories Tab */
                    <CategoryManagement />
                ) : activeTab === 'play' ? (
                    /* Play Management Tab */
                    <PlayManagement />
                ) : null}
            </div>

            {/* Modal */}


            {/* Custom Alert */}
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
        </div >
    );
};

// Play Management Component
const PlayManagement = () => {
    const [videos, setVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [caption, setCaption] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [statusLogs, setStatusLogs] = useState<string[]>([]);
    const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<{ show: boolean; commentId: string | null }>({ show: false, commentId: null });
    const { user } = useAuth();
    const { alertState, showAlert, closeAlert } = useCustomAlert();

    const addLog = (msg: string) => {
        console.log(msg);
        setStatusLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
    };

    useEffect(() => {
        loadVideos();
    }, []);

    const loadVideos = async () => {
        setLoading(true);
        try {
            const data = await store.getPlayVideos();
            setVideos(data);
        } catch (e) {
            console.error('Failed to load videos:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async () => {
        addLog('--- Starting Upload Process ---');

        if (!file) {
            addLog('Error: No file selected');
            showAlert('Error', 'Please select a video file', 'error');
            return;
        }

        if (!user) {
            addLog('Error: User not logged in');
            showAlert('Error', 'You must be logged in', 'error');
            return;
        }

        setUploading(true);
        try {
            addLog(`File selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

            // 1. Upload File (Directly, skipping bucket check to avoid RLS issues)
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            addLog(`Generated filename: ${fileName}`);

            addLog('Uploading to Supabase Storage...');
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('videos')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                addLog(`Upload failed: ${uploadError.message}`);
                if (uploadError.message.includes('Bucket not found')) {
                    addLog('TIP: Please create a public bucket named "videos" in your Supabase dashboard.');
                }
                throw uploadError;
            }
            addLog('File uploaded successfully');

            // 3. Get Public URL
            const { data: urlData } = supabase.storage
                .from('videos')
                .getPublicUrl(fileName);

            const publicUrl = urlData.publicUrl;
            addLog(`Public URL generated: ${publicUrl}`);

            // 4. Create DB Record
            addLog('Creating database record...');
            const { data: dbData, error: dbError } = await supabase
                .from('play_videos')
                .insert({
                    video_url: publicUrl,
                    caption,
                    user_id: user.id
                })
                .select()
                .single();

            if (dbError) {
                addLog(`Database insert failed: ${dbError.message}`);
                throw dbError;
            }

            addLog('Database record created successfully!');
            showAlert('Success', 'Video uploaded successfully!', 'success');

            // Reset form
            setCaption('');
            setFile(null);
            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

            loadVideos();

        } catch (e: any) {
            console.error('Upload process failed:', e);
            addLog(`FATAL ERROR: ${e.message || JSON.stringify(e)}`);
            showAlert('Error', 'Upload failed. Check logs below.', 'error');
        } finally {
            setUploading(false);
            addLog('--- Process Finished ---');
        }
    };

    const loadComments = async (videoId: string) => {
        setSelectedVideoId(videoId);
        setLoadingComments(true);
        try {
            const data = await store.getVideoComments(videoId);
            setComments(data);
        } catch (e) {
            console.error('Failed to load comments:', e);
            showAlert('Error', 'Failed to load comments', 'error');
        } finally {
            setLoadingComments(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        setConfirmDelete({ show: true, commentId });
    };

    const confirmDeleteComment = async () => {
        if (!confirmDelete.commentId) return;

        try {
            await store.deleteComment(confirmDelete.commentId);
            showAlert('Success', 'Comment deleted', 'success');
            // Refresh comments list
            if (selectedVideoId) {
                loadComments(selectedVideoId);
            }
        } catch (e) {
            showAlert('Error', 'Failed to delete comment', 'error');
        } finally {
            setConfirmDelete({ show: false, commentId: null });
        }
    };

    return (
        <div className="space-y-8">
            {/* Upload Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold mb-4">Upload New Video</h2>

                {/* Status Logs */}
                {statusLogs.length > 0 && (
                    <div className="mb-4 p-3 bg-gray-900 text-green-400 text-xs font-mono rounded-lg max-h-40 overflow-y-auto">
                        {statusLogs.map((log, i) => (
                            <div key={i}>{log}</div>
                        ))}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Video File</label>
                        <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => {
                                const selectedFile = e.target.files?.[0] || null;
                                setFile(selectedFile);
                                if (selectedFile) addLog(`Selected file: ${selectedFile.name}`);
                            }}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
                        <textarea
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                            rows={3}
                            placeholder="Write a catchy caption..."
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleUpload}
                        disabled={uploading || !file}
                        className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
                    >
                        {uploading ? (
                            <>
                                <Icons.Loader2 className="w-5 h-5 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Icons.Upload className="w-5 h-5" />
                                Post Video
                            </>
                        )}
                    </button>
                </div>
            </div>


            {/* Videos List */}
            < div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100" >
                <h2 className="text-lg font-bold mb-4">Manage Videos</h2>
                {
                    loading ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {videos.map(video => (
                                <div key={video.id} className="border rounded-lg overflow-hidden">
                                    <video src={video.videoUrl} className="w-full h-48 object-cover bg-black" controls />
                                    <div className="p-4">
                                        <p className="font-medium truncate mb-2">{video.caption || 'No caption'}</p>
                                        <div className="flex justify-between text-sm text-gray-500 mb-4">
                                            <span>❤️ {video.likesCount}</span>
                                            <span>💬 {video.commentsCount}</span>
                                            <span>↗️ {video.sharesCount}</span>
                                        </div>
                                        <button
                                            onClick={() => loadComments(video.id)}
                                            className="w-full border border-gray-200 py-2 rounded hover:bg-gray-50 text-sm font-medium"
                                        >
                                            Manage Comments
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                }
            </div>

            {/* Comments Modal */}
            {selectedVideoId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedVideoId(null)}>
                    <div className="bg-white rounded-xl p-4 max-w-lg w-full mx-4 max-h-[70vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-3 pb-2 border-b">
                            <h3 className="text-base font-bold">Manage Comments</h3>
                            <button onClick={() => setSelectedVideoId(null)} className="text-gray-400 hover:text-gray-600">
                                <Icons.X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {loadingComments ? (
                                <div className="text-center py-6 text-sm text-gray-500">Loading...</div>
                            ) : comments.length === 0 ? (
                                <div className="text-center py-6 text-sm text-gray-400">No comments yet</div>
                            ) : (
                                <div className="space-y-2">
                                    {comments.map(comment => (
                                        <div key={comment.id} className="flex gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center font-bold text-xs shrink-0">
                                                {comment.userName?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs leading-relaxed">
                                                    <span className="font-bold">{comment.userName || 'User'}</span>
                                                    <span className="ml-1.5 text-gray-700">{comment.content}</span>
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-0.5">
                                                    {new Date(comment.createdAt).toLocaleString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteComment(comment.id)}
                                                className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded shrink-0 transition-colors"
                                                title="Delete comment"
                                            >
                                                <Icons.Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Dialog */}
            {confirmDelete.show && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={() => setConfirmDelete({ show: false, commentId: null })}>
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-2">Delete Comment?</h3>
                        <p className="text-gray-600 mb-6">Are you sure you want to delete this comment? This action cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setConfirmDelete({ show: false, commentId: null })}
                                className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteComment}
                                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 font-medium"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Alert Component */}
            <CustomAlert
                isOpen={alertState.isOpen}
                type={alertState.type}
                title={alertState.title}
                message={alertState.message}
                onClose={closeAlert}
            />
        </div>
    );
};

// Reviews Tab Component
const ReviewsTab = () => {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { alertState, showAlert, closeAlert } = useCustomAlert();

    useEffect(() => {
        loadReviews();
    }, []);

    const loadReviews = async () => {
        try {
            setLoading(true);
            const data = await store.getAllReviews();
            setReviews(data || []);
        } catch (e) {
            console.error('Failed to load reviews:', e);
        } finally {
            setLoading(false);
        }
    };

    const toggleApproval = async (id: string, currentStatus: boolean) => {
        try {
            await store.updateReviewStatus(id, !currentStatus);
            await loadReviews();
            showAlert('Success', `Review ${!currentStatus ? 'approved' : 'unapproved'} successfully.`, 'success');
        } catch (e) {
            showAlert('Error', 'Failed to update review status.', 'error');
        }
    };

    const deleteReview = async (id: string) => {
        showAlert(
            'Delete Review',
            'Are you sure you want to delete this review?',
            'warning',
            {
                confirmText: 'Delete',
                onConfirm: async () => {
                    try {
                        await store.deleteReview(id);
                        await loadReviews();
                        showAlert('Success', 'Review deleted successfully.', 'success');
                    } catch (e) {
                        showAlert('Error', 'Failed to delete review.', 'error');
                    }
                },
                cancelText: 'Cancel'
            }
        );
    };

    if (loading) return <div className="text-center py-10">Loading reviews...</div>;

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {reviews.length === 0 ? (
                    <div className="text-center py-20">
                        <Icons.Star className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-textMain">No reviews found</h2>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="p-4 font-semibold text-gray-600 w-32">Date</th>
                                        <th className="p-4 font-semibold text-gray-600 w-48">Product</th>
                                        <th className="p-4 font-semibold text-gray-600 w-32">User</th>
                                        <th className="p-4 font-semibold text-gray-600 w-24">Rating</th>
                                        <th className="p-4 font-semibold text-gray-600 min-w-[200px]">Comment</th>
                                        <th className="p-4 font-semibold text-gray-600 w-32">Media</th>
                                        <th className="p-4 font-semibold text-gray-600 w-24">Status</th>
                                        <th className="p-4 font-semibold text-gray-600 text-right w-24">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {reviews.map((review) => (
                                        <tr key={review.id} className="hover:bg-gray-50">
                                            <td className="p-4 text-sm text-gray-500 whitespace-nowrap">{new Date(review.created_at).toLocaleDateString()}</td>
                                            <td className="p-4 font-medium text-sm">
                                                <div className="line-clamp-2" title={review.products?.name}>{review.products?.name || 'Unknown'}</div>
                                            </td>
                                            <td className="p-4 text-sm whitespace-nowrap">{review.user_name}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded w-fit">
                                                    <span className="font-bold text-yellow-700">{review.rating}</span>
                                                    <Icons.Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm">
                                                <p className="line-clamp-3 text-gray-600" title={review.comment}>{review.comment}</p>
                                            </td>
                                            <td className="p-4">
                                                {review.media_urls && review.media_urls.length > 0 ? (
                                                    <div className="flex -space-x-2 hover:space-x-1 transition-all">
                                                        {review.media_urls.map((url: string, i: number) => (
                                                            <div key={i} className="w-10 h-10 rounded-lg border-2 border-white bg-gray-100 overflow-hidden shadow-sm hover:scale-110 transition-transform z-0 hover:z-10 relative cursor-pointer" onClick={() => window.open(url, '_blank')}>
                                                                {url.match(/\.(mp4|webm)$/i) ? (
                                                                    <video src={url} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <img src={url} alt="Review" className="w-full h-full object-cover" />
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : <span className="text-gray-400 text-xs italic">No media</span>}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${review.is_approved ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                                                    {review.is_approved ? 'Approved' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => toggleApproval(review.id, review.is_approved)}
                                                        className={`p-2 rounded-lg transition-colors ${review.is_approved ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'}`}
                                                        title={review.is_approved ? 'Unapprove' : 'Approve'}
                                                    >
                                                        {review.is_approved ? <Icons.XCircle className="w-5 h-5" /> : <Icons.CheckCircle className="w-5 h-5" />}
                                                    </button>
                                                    <button
                                                        onClick={() => deleteReview(review.id)}
                                                        className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Icons.Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile List */}
                        <div className="md:hidden divide-y">
                            {reviews.map((review) => (
                                <div key={review.id} className="p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-gray-900 line-clamp-1">{review.products?.name || 'Unknown Product'}</h3>
                                            <p className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString()} • {review.user_name}</p>
                                        </div>
                                        <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded">
                                            <span className="font-bold text-yellow-700 text-sm">{review.rating}</span>
                                            <Icons.Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{review.comment}</p>

                                    {review.media_urls && review.media_urls.length > 0 && (
                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                            {review.media_urls.map((url: string, i: number) => (
                                                <div key={i} className="w-16 h-16 rounded-lg border bg-gray-100 overflow-hidden shrink-0" onClick={() => window.open(url, '_blank')}>
                                                    {url.match(/\.(mp4|webm)$/i) ? (
                                                        <video src={url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <img src={url} alt="Review" className="w-full h-full object-cover" />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center pt-2">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${review.is_approved ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                                            {review.is_approved ? 'Approved' : 'Pending'}
                                        </span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => toggleApproval(review.id, review.is_approved)}
                                                className={`p-2 rounded-lg bg-gray-50 ${review.is_approved ? 'text-yellow-600' : 'text-green-600'}`}
                                            >
                                                {review.is_approved ? <Icons.XCircle className="w-5 h-5" /> : <Icons.CheckCircle className="w-5 h-5" />}
                                            </button>
                                            <button
                                                onClick={() => deleteReview(review.id)}
                                                className="text-red-600 bg-red-50 p-2 rounded-lg"
                                            >
                                                <Icons.Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>



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
        </>
    );
};