import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { store } from '../services/store';
import { getContactMessages, seedDatabase } from '../services/supabaseService';
import { supabase } from '../services/supabaseClient';
import { Product, Order, Category } from '../types';
import { Icons } from '../components/ui/Icons';
import { CustomAlert, useCustomAlert } from '../components/CustomAlert';
import { ProductAnalyticsModal } from '../components/ProductAnalyticsModal';
import { CategoryManagement } from './CategoryManagement';
import { useTheme } from '../contexts/ThemeContext';

export const Admin = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { alertState, showAlert, closeAlert } = useCustomAlert();
    const { currentTheme, setTheme } = useTheme();

    // State
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [leads, setLeads] = useState<any[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'leads' | 'reviews' | 'categories' | 'themes' | 'users'>('inventory');
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
    const [sbUser, setSbUser] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [seeding, setSeeding] = useState(false);

    // Form


    // --- Auth Check ---
    useEffect(() => {
        const checkAdminAuth = async () => {
            try {
                // Add a timeout to the auth check
                const timeout = new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Auth timeout')), 5000)
                );

                const checkPromise = (async () => {
                    // 1. Check SessionStorage Fallback
                    const isFallbackAuth = sessionStorage.getItem('giftology_admin_auth') === 'true';

                    // 2. Check Supabase Session
                    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                    if (sessionError) console.error('Admin: Session error:', sessionError);

                    const ADMIN_EMAILS = ['giftology.in01@gmail.com', 'giftology.in02@gmail.com', 'giftology.in14@gmail.com', 'rajbaniya81083@gmail.com'];
                    const currentEmail = session?.user?.email;
                    setSbUser(currentEmail || 'NOT AUTHENTICATED');

                    const isSupabaseAdmin = currentEmail && ADMIN_EMAILS.includes(currentEmail);

                    if (isFallbackAuth || isSupabaseAdmin) {
                        console.log("Admin auth verified. Fallback:", isFallbackAuth, "SB:", isSupabaseAdmin);
                        return true;
                    }
                })();

                const result = await Promise.race([checkPromise, timeout]);
                setIsAdmin(!!result);
            } catch (e) {
                console.error("Auth check failed or timed out:", e);
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
            const { data: { session } } = await supabase.auth.getSession();
            console.log('Admin: Supabase Session:', session ? 'ACTIVE' : 'NONE');
            console.log('Admin: Supabase User:', session?.user?.email || 'N/A');

            // Log total orders in DB (ignoring errors for count)
            const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true });
            console.log('Admin: Total orders in table (ignoring RLS filter):', count);

            // Fetch Categories
            try {
                console.log('Admin: Fetching categories...');
                const catData = await store.getCategories();
                console.log('Admin: Categories loaded:', catData?.length || 0);
                setCategories(catData || []);
            } catch (e) {
                console.error('Failed to load categories:', e);
            }

            // Fetch Products
            try {
                console.log('Admin: Fetching products...');
                const productData = await store.getAdminProducts();
                console.log('Admin: Products loaded:', productData?.length || 0);
                setProducts(productData || []);
            } catch (e) {
                console.error('Failed to load products:', e);
                setError('Failed to load products. Check console for details.');
            }

            // Fetch Orders
            try {
                console.log('Admin: Fetching orders...');
                const result = await store.getOrders();
                console.log('Admin: Orders fetched result count:', result?.length || 0);

                setOrders((result || []).sort((a, b) => {
                    if (a.deliveryType === 'Fast Delivery' && b.deliveryType !== 'Fast Delivery') return -1;
                    if (a.deliveryType !== 'Fast Delivery' && b.deliveryType === 'Fast Delivery') return 1;
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
                }));
            } catch (e: any) {
                console.error('Failed to load orders:', e);
                setError(`Order Error: ${e.message || JSON.stringify(e)}`);
            }

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
                {/* ULTIMATE CACHE TEST BANNER */}
                <div className="bg-red-600 text-white p-4 rounded-xl mb-6 shadow-2xl">
                    <h2 className="font-bold text-lg">⚠️ ADMIN SYSTEM DIAGNOSTICS</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div className="bg-black/20 p-2 rounded">
                            <p className="font-bold border-b border-white/20 mb-1">AUTH STATUS</p>
                            <p className="text-xs">Browser Emulated Admin: <span className={isAdmin ? "text-green-300 font-bold" : "text-yellow-300"}>{isAdmin ? "YES" : "NO"}</span></p>
                            <p className="text-xs">Supabase Authenticated: <span className={sbUser && sbUser !== 'NOT AUTHENTICATED' ? "text-green-300 font-bold" : "text-yellow-300"}>{sbUser || "CHECKING..."}</span></p>
                        </div>
                        <div className="bg-black/20 p-2 rounded text-[10px] leading-tight">
                            <p className="font-bold border-b border-white/20 mb-1">TROUBLESHOOTING</p>
                            <p>1. If SB AUTH says "NOT AUTHENTICATED", order fetching WILL fail due to RLS.</p>
                            <p>2. Solution: Click "CLEAR & LOGOUT", then log in with <b>rajbaniya81083@gmail.com</b>.</p>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button onClick={() => {
                            sessionStorage.clear();
                            localStorage.clear();
                            supabase.auth.signOut();
                            window.location.reload();
                        }} className="bg-white text-red-600 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-gray-100 transition-colors">
                            Clear Everything & Re-Login
                        </button>
                        <button onClick={() => window.location.reload()} className="bg-red-800 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-red-900 transition-colors border border-white/20">
                            Hard Refresh
                        </button>
                    </div>
                </div>

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="font-black text-xl text-textMain uppercase tracking-widest">Admin Dashboard</h1>
                        <p className="text-textMuted mt-1 text-xs font-bold uppercase tracking-tight">Manage products and view orders</p>
                        <div className="text-xs text-gray-400 mt-2">
                            Debug: Products: {products.length}, Loading: {isLoadingAuth ? 'Yes' : 'No'}, Admin: {isAdmin ? 'Yes' : 'No'}
                            <br />User: {user?.email || 'None'}
                            {error && <div className="bg-red-100 text-red-700 p-2 rounded mt-2 text-xs font-mono">{error}</div>}
                        </div>
                    </div>
                    <div className="flex gap-3 flex-wrap w-full md:w-auto">
                        <button onClick={loadData} className="px-3 py-2 bg-white border border-gray-200 text-black rounded-xl hover:bg-gray-50 transition-colors text-xs font-bold shadow-sm">
                            Force Refresh
                        </button>
                        <button
                            onClick={() => window.location.href = '/admin/sales'}
                            className="flex-1 md:flex-none bg-black text-white px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-gray-800 shadow-lg transition-all duration-200 active:scale-95 min-h-[40px]"
                        >
                            <Icons.TrendingUp className="w-4 h-4" />
                            <span className="hidden sm:inline">Sales Analytics</span>
                            <span className="sm:hidden">Sales</span>
                        </button>
                        <button
                            onClick={loadData}
                            className="bg-white text-black border border-gray-200 px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-gray-50 shadow-sm transition-all duration-200 active:scale-95 min-h-[40px]"
                            title="Refresh Data"
                        >
                            <Icons.RefreshCw className="w-4 h-4" />
                            <span className="hidden sm:inline">Refresh</span>
                            <span className="sm:hidden">Refresh</span>
                        </button>
                        <button
                            onClick={handleLogout}
                            className="bg-white text-red-600 border border-red-200 px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-red-50 shadow-sm transition-all duration-200 active:scale-95 min-h-[40px]"
                        >
                            <Icons.LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Logout</span>
                            <span className="sm:hidden">Logout</span>
                        </button>
                        <button
                            onClick={handleSeed}
                            disabled={seeding}
                            className="flex-1 md:flex-none bg-white text-green-700 border border-green-200 px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-green-50 shadow-sm transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px]"
                        >
                            {seeding ? <Icons.RefreshCw className="w-4 h-4 animate-spin" /> : <Icons.Package className="w-4 h-4" />}
                            {seeding ? 'Seeding...' : <span className="hidden sm:inline">Seed Database</span>}
                            {!seeding && <span className="sm:hidden">Seed DB</span>}
                        </button>
                        {activeTab === 'inventory' && (
                            <button
                                onClick={() => navigate('/admin/products/new')}
                                className="flex-1 md:flex-none px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 bg-charcoal text-white hover:bg-black shadow-lg transition-all duration-200 active:scale-95 relative z-10 min-h-[40px]"
                            >
                                <Icons.Plus className="w-4 h-4" /> Add Product
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 md:gap-4 mb-6 border-b-2 border-gray-200 overflow-x-auto pb-0">
                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={`pb-4 px-4 font-black uppercase tracking-widest text-[11px] transition-all duration-200 whitespace-nowrap ${activeTab === 'inventory'
                            ? 'border-b-4 border-primary text-primary -mb-0.5'
                            : 'text-textMuted hover:text-textMain'
                            }`}
                    >
                        Product Inventory
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`pb-4 px-4 font-black uppercase tracking-widest text-[11px] transition-all duration-200 whitespace-nowrap ${activeTab === 'orders'
                            ? 'border-b-4 border-primary text-primary -mb-0.5'
                            : 'text-textMuted hover:text-textMain'
                            }`}
                    >
                        Order Management
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`pb-4 px-4 font-black uppercase tracking-widest text-[11px] transition-all duration-200 whitespace-nowrap ${activeTab === 'users'
                            ? 'border-b-4 border-primary text-primary -mb-0.5'
                            : 'text-textMuted hover:text-textMain'
                            }`}
                    >
                        Users & Rewards
                    </button>
                    <button
                        onClick={() => setActiveTab('leads')}
                        className={`pb-4 px-4 font-black uppercase tracking-widest text-[11px] transition-all duration-200 whitespace-nowrap ${activeTab === 'leads'
                            ? 'border-b-4 border-primary text-primary -mb-0.5'
                            : 'text-textMuted hover:text-textMain'
                            }`}
                    >
                        Leads & Messages
                    </button>
                    <button
                        onClick={() => setActiveTab('reviews')}
                        className={`pb-4 px-4 font-black uppercase tracking-widest text-[11px] transition-all duration-200 whitespace-nowrap ${activeTab === 'reviews'
                            ? 'border-b-4 border-primary text-primary -mb-0.5'
                            : 'text-textMuted hover:text-textMain'
                            }`}
                    >
                        Reviews
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`pb-4 px-4 font-black uppercase tracking-widest text-[11px] transition-all duration-200 whitespace-nowrap ${activeTab === 'categories'
                            ? 'border-b-4 border-primary text-primary -mb-0.5'
                            : 'text-textMuted hover:text-textMain'
                            }`}
                    >
                        Categories
                    </button>
                    <button
                        onClick={() => setActiveTab('themes')}
                        className={`pb-4 px-4 font-black uppercase tracking-widest text-[11px] transition-all duration-200 whitespace-nowrap ${activeTab === 'themes'
                            ? 'border-b-4 border-primary text-primary -mb-0.5'
                            : 'text-textMuted hover:text-textMain'
                            }`}
                    >
                        Themes
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
                                                    <h3 className="font-bold text-gray-900 line-clamp-2 mb-1 pr-2" style={{ fontSize: '12px', fontFamily: 'Times New Roman, serif' }}>{product.name}</h3>
                                                    {product.trending && <Icons.TrendingUp className="w-4 h-4 text-orange-500 shrink-0" />}
                                                </div>
                                                <p className="text-gray-500 uppercase font-bold mb-1" style={{ fontSize: '10px', fontFamily: 'Times New Roman, serif' }}>{product.category.replace('-', ' ')} {product.subcategory ? `> ${product.subcategory.replace('-', ' ')}` : ''}</p>
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

                                        <div className="flex gap-2 pt-2 border-t border-gray-100 mt-2" onClick={(e) => e.stopPropagation()}>
                                            <a
                                                href={`/admin/products/edit/${product.id}`}
                                                className="flex-1 flex items-center justify-center gap-1 bg-blue-600 text-white py-2 rounded-xl font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-md min-h-[36px] no-underline"
                                                style={{ fontSize: '12px', fontFamily: 'Times New Roman, serif' }}
                                            >
                                                <Icons.Edit2 className="w-4 h-4" /> Edit
                                            </a>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    deleteProduct(product.id);
                                                }}
                                                className="flex-1 flex items-center justify-center gap-1 bg-red-600 text-white py-2 rounded-xl font-bold hover:bg-red-700 active:scale-95 transition-all shadow-md min-h-[36px]"
                                                style={{ fontSize: '12px', fontFamily: 'Times New Roman, serif' }}
                                            >
                                                <Icons.Trash2 className="w-4 h-4" /> Delete
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
                ) : activeTab === 'themes' ? (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-xl font-bold mb-4">Homepage Theme</h2>
                            <p className="text-gray-600 mb-6">Select a theme for the homepage. This will change the look and feel of the main landing page.</p>

                            <button
                                onClick={async () => {
                                    showAlert('Testing...', 'Checking connection to "settings" table...', 'info');
                                    try {
                                        const { data, error } = await supabase.from('settings').select('*');
                                        if (error) {
                                            closeAlert();
                                            showAlert('Connection Failed', `Error: ${error.message}\nDetail: ${error.details || ''}\nHint: ${error.hint || ''}`, 'error');
                                        } else {
                                            closeAlert();
                                            showAlert('Connection Success', `Found ${data.length} settings rows.\nCurrent value: ${data.find(r => r.key === 'current_theme')?.value}`, 'success');
                                        }
                                    } catch (e: any) {
                                        closeAlert();
                                        showAlert('Connection Error', `Exception: ${e.message}`, 'error');
                                    }
                                }}
                                className="mb-6 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-bold hover:bg-gray-700"
                            >
                                🛠️ Test Database Connection
                            </button>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Sparkling Normal Theme */}
                                <div
                                    onClick={async () => {
                                        showAlert('Updating Theme', 'Applying New Year Theme...', 'info');
                                        const result = await setTheme('sparkling');
                                        if (result.success) {
                                            setTimeout(() => {
                                                closeAlert();
                                                showAlert('Success', 'Theme updated to New Year Theme', 'success');
                                            }, 500);
                                        } else {
                                            closeAlert();
                                            showAlert('Error', `Failed to update theme: ${result.error?.message || 'Unknown error'}`, 'error');
                                        }
                                    }}
                                    className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${currentTheme === 'sparkling' || currentTheme === 'default' ? 'border-black ring-2 ring-black ring-offset-2' : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                    <div className="h-40 bg-gray-100 flex items-center justify-center">
                                        <span className="text-4xl">✨</span>
                                    </div>
                                    <div className="p-4 bg-white">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-bold text-lg">New Year Theme</h3>
                                            {(currentTheme === 'sparkling' || currentTheme === 'default') && <Icons.Check className="w-5 h-5 text-green-500" />}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">Elegant Blue & Gold Celebration</p>
                                    </div>
                                </div>

                                {/* Christmas Theme */}
                                <div
                                    onClick={async () => {
                                        showAlert('Updating Theme', 'Applying Christmas theme...', 'info');
                                        const result = await setTheme('christmas');
                                        if (result.success) {
                                            setTimeout(() => {
                                                closeAlert();
                                                showAlert('Success', 'Theme updated to Christmas', 'success');
                                            }, 500);
                                        } else {
                                            closeAlert();
                                            showAlert('Error', `Failed to update theme: ${result.error?.message || 'Unknown error'}`, 'error');
                                        }
                                    }}
                                    className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${currentTheme === 'christmas' ? 'border-red-600 ring-2 ring-red-600 ring-offset-2' : 'border-gray-200 hover:border-red-200'}`}
                                >
                                    <div className="h-40 bg-red-50 flex items-center justify-center">
                                        <span className="text-4xl">🎄</span>
                                    </div>
                                    <div className="p-4 bg-white">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-bold text-lg text-red-700">Christmas</h3>
                                            {currentTheme === 'christmas' && <Icons.Check className="w-5 h-5 text-green-500" />}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">Festive red & green design with snow</p>
                                    </div>
                                </div>

                                {/* Diwali Theme */}
                                <div
                                    onClick={async () => {
                                        showAlert('Updating Theme', 'Applying Diwali theme...', 'info');
                                        const result = await setTheme('diwali');
                                        if (result.success) {
                                            setTimeout(() => {
                                                closeAlert();
                                                showAlert('Success', 'Theme updated to Diwali', 'success');
                                            }, 500);
                                        } else {
                                            closeAlert();
                                            showAlert('Error', `Failed to update theme: ${result.error?.message || 'Unknown error'}`, 'error');
                                        }
                                    }}
                                    className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${currentTheme === 'diwali' ? 'border-orange-500 ring-2 ring-orange-500 ring-offset-2' : 'border-gray-200 hover:border-orange-200'}`}
                                >
                                    <div className="h-40 bg-orange-50 flex items-center justify-center">
                                        <span className="text-4xl">🪔</span>
                                    </div>
                                    <div className="p-4 bg-white">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-bold text-lg text-orange-700">Diwali</h3>
                                            {currentTheme === 'diwali' && <Icons.Check className="w-5 h-5 text-green-500" />}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">Bright orange & gold design with lamps</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                ) : activeTab === 'users' ? (
                    /* Users Tab */
                    <UsersTab />
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
        </>
    );

};

const UsersTab = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { showAlert } = useCustomAlert();

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                // Fetch profiles with enriched stats
                const data = await store.getAllUsersWithStats();
                setUsers(data || []);
            } catch (error) {
                console.error('Error fetching users:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const updateUserPoints = async (userId: string, currentPoints: number) => {
        // Simple prompt for now
        const points = prompt('Enter new points balance:', currentPoints.toString());
        if (points === null) return;
        const newPoints = parseInt(points);
        if (isNaN(newPoints)) return;

        try {
            // 1. Attempt to get session (Silent Recovery)
            let { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                console.log('[Admin] Session missing, attempting silent refresh...');
                const { data: refreshData } = await supabase.auth.refreshSession();
                session = refreshData.session;
            }

            // 2. Fetch User Details for Debugging (User Request)
            const { data: { user } } = await supabase.auth.getUser();
            console.log('[Admin] Update Points Action - Current State:');
            console.log(' - Session ID:', session?.access_token ? 'Present' : 'Missing');
            console.log(' - User Email:', user?.email || 'Unknown');
            console.log(' - User Role:', user?.role || 'Unknown');

            // 3. Execute RPC regardless of client-side doubts (Server decides)
            console.log('[Admin] Invoking update_user_points...');
            // Use RPC for secure admin update
            const { data, error } = await supabase.rpc('update_user_points', {
                target_user_id: userId,
                new_points: newPoints
            });

            if (error) throw error;

            // Optimistic update
            setUsers(users.map(u => u.id === userId ? { ...u, reward_points: newPoints } : u));
            alert('Points updated successfully!');
        } catch (error: any) {
            console.error('Update failed:', error);
            alert('Failed: ' + (error.message || error.details || 'Unknown error'));
        }
    };

    if (loading) return <div className="text-center py-10">Loading users...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-bold">Registered Users ({users.length})</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-4 font-bold border-b">User</th>
                            <th className="p-4 font-bold border-b text-center">Reward Points</th>
                            <th className="p-4 font-bold border-b text-center">Coupons (Active)</th>
                            <th className="p-4 font-bold border-b text-center">Coupons (Used)</th>
                            <th className="p-4 font-bold border-b text-right">Total Spent</th>
                            <th className="p-4 font-bold border-b text-right">Joined</th>
                            <th className="p-4 font-bold border-b text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50/50">
                                <td className="p-4">
                                    <div className="font-bold text-gray-900">{user.full_name || user.display_name || 'No Name'}</div>
                                    <div className="text-xs text-gray-500">{user.email || 'No Email (Auth check needed)'}</div>
                                    <div className="text-[10px] text-gray-400 font-mono mt-1">{user.id}</div>
                                </td>
                                <td className="p-4 text-center">
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold">
                                        <Icons.Star className="w-3.5 h-3.5 fill-current" />
                                        {user.reward_points || 0}
                                    </div>
                                </td>
                                <td className="p-4 text-center">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        {user.coupons_active || 0}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        {user.coupons_used || 0}
                                    </span>
                                </td>
                                <td className="p-4 text-right font-mono">
                                    &#8377;{(user.total_spent || 0).toLocaleString()}
                                </td>
                                <td className="p-4 text-right text-gray-500">
                                    {new Date(user.created_at || user.updated_at || Date.now()).toLocaleDateString()}
                                </td>
                                <td className="p-4 text-right">
                                    <button
                                        onClick={() => updateUserPoints(user.id, user.reward_points || 0)}
                                        className="text-blue-600 hover:text-blue-800 text-xs font-bold border border-blue-200 px-3 py-1.5 rounded hover:bg-blue-50 transition-colors"
                                    >
                                        Edit Points
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};