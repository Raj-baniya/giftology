import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { store } from '../services/store';
import { getContactMessages, seedDatabase } from '../services/supabaseService';
import { supabase } from '../services/supabaseClient';
import { Product, Order, Category } from '../types';
import { Icons } from '../components/ui/Icons';
import { useForm } from 'react-hook-form';
import { CustomAlert, useCustomAlert } from '../components/CustomAlert';

export const Admin = () => {
    const { user } = useAuth();
    const { alertState, showAlert, closeAlert } = useCustomAlert();

    // State
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [leads, setLeads] = useState<any[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'leads'>('inventory');
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    // Filter & Search State
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auth & Loading State
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [seeding, setSeeding] = useState(false);

    // Form
    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Omit<Product, 'id'> & { additionalImages?: string }>({
        defaultValues: {
            name: '',
            price: 0,
            description: '',
            imageUrl: '',
            category: '',
            trending: false,
            stock: 0,
            additionalImages: ''
        }
    });

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

    // --- Modal Logic ---
    const openModal = (product?: Product) => {
        try {
            if (product) {
                setEditingId(product.id);
                setValue('name', product.name);
                setValue('price', product.price);
                setValue('marketPrice', product.marketPrice);
                setValue('category', product.category);
                setValue('imageUrl', product.imageUrl);
                setValue('additionalImages', product.images?.slice(1).join(', ') || '');
                setValue('description', product.description);
                setValue('trending', product.trending || false);
                setValue('stock', product.stock || 0);
            } else {
                setEditingId(null);
                reset({
                    name: '',
                    price: 0,
                    description: '',
                    imageUrl: '',
                    category: categories.length > 0 ? categories[0].slug : '',
                    trending: false,
                    stock: 0,
                    additionalImages: ''
                });
            }
            setIsModalOpen(true);
        } catch (err) {
            console.error("Error opening modal:", err);
            showAlert('Error', "Failed to open product form.", 'error');
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        reset();
    };

    const onSubmit = async (data: any) => {
        try {
            setIsSubmitting(true);
            const productData = {
                ...data,
                price: Number(data.price),
                marketPrice: data.marketPrice ? Number(data.marketPrice) : undefined,
                images: [
                    data.imageUrl,
                    ...(data.additionalImages ? data.additionalImages.split(',').map((url: string) => url.trim()).filter((url: string) => url) : [])
                ],
                trending: Boolean(data.trending),
                stock: Number(data.stock)
            };

            if (editingId) {
                await store.updateProduct(editingId, productData);
            } else {
                await store.addProduct(productData);
            }
            await loadData();
            closeModal();
            showAlert('Success', 'Product saved successfully!', 'success');
        } catch (error: any) {
            console.error("Error saving product:", error);
            showAlert('Error', `Failed to save product: ${error.message || error.error_description || 'Unknown error'}`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

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

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-serif font-bold">Admin Dashboard</h1>
                        <p className="text-textMuted text-sm md:text-base">Manage products and view orders</p>
                        <div className="text-xs text-gray-400 mt-1">
                            Debug: Products: {products.length}, Loading: {isLoadingAuth ? 'Yes' : 'No'}, Admin: {isAdmin ? 'Yes' : 'No'}
                            {error && <div className="text-red-500">Error: {error}</div>}
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <button onClick={() => window.location.href = '/admin/sales'} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:from-purple-700 hover:to-pink-700 shadow-lg transition-transform active:scale-95">
                            <Icons.TrendingUp className="w-5 h-5" /> Sales Analytics
                        </button>
                        <button onClick={loadData} className="bg-white text-gray-700 px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-50 shadow-sm border border-gray-200 transition-transform active:scale-95" title="Refresh Data">
                            <Icons.RefreshCw className="w-5 h-5" />
                        </button>
                        <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-red-700 shadow-lg transition-transform active:scale-95">
                            <Icons.LogOut className="w-5 h-5" /> Logout
                        </button>
                        <button onClick={handleSeed} disabled={seeding} className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-green-700 shadow-lg transition-transform active:scale-95 disabled:opacity-50">
                            {seeding ? 'Seeding...' : 'Seed Database'}
                        </button>
                        {activeTab === 'inventory' && (
                            <button onClick={() => openModal()} className="bg-black text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-800 shadow-lg transition-transform active:scale-95 relative z-10">
                                <Icons.Plus className="w-5 h-5" /> Add Product
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-gray-200 overflow-x-auto">
                    <button onClick={() => setActiveTab('inventory')} className={`pb-3 px-2 text-sm md:text-base font-bold transition-colors ${activeTab === 'inventory' ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-gray-600'}`}>Product Inventory</button>
                    <button onClick={() => setActiveTab('orders')} className={`pb-3 px-2 text-sm md:text-base font-bold transition-colors ${activeTab === 'orders' ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-gray-600'}`}>Order Management</button>
                    <button onClick={() => setActiveTab('leads')} className={`pb-3 px-2 text-sm md:text-base font-bold transition-colors ${activeTab === 'leads' ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-gray-600'}`}>Leads & Messages</button>
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
                                        <th className="p-4 font-semibold text-gray-600">Price</th>
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
                                            <tr key={product.id} className="hover:bg-gray-50">
                                                <td className="p-4"><img src={product.imageUrl} alt={product.name} className="w-12 h-12 rounded-md object-cover bg-gray-200" /></td>
                                                <td className="p-4 font-medium">{product.name}</td>
                                                <td className="p-4"><span className="bg-primary/20 text-primary-dark px-2 py-1 rounded text-xs font-bold uppercase">{product.category.replace('-', ' ')}</span></td>
                                                <td className="p-4" style={{ fontFamily: 'Arial, sans-serif' }}>&#8377;{product.price.toLocaleString()}</td>
                                                <td className="p-4 font-medium">{product.stock ?? 0}</td>
                                                <td className="p-4">{product.trending && <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-full"><Icons.TrendingUp className="w-3 h-3" /> Trending</span>}</td>
                                                <td className="p-4 text-right space-x-2">
                                                    <button onClick={() => openModal(product)} className="text-blue-600 hover:bg-blue-50 p-2 rounded"><Icons.Edit2 className="w-4 h-4" /></button>
                                                    <button onClick={() => deleteProduct(product.id)} className="text-red-600 hover:bg-red-50 p-2 rounded"><Icons.Trash2 className="w-4 h-4" /></button>
                                                </td>
                                            </tr>
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
                                    <div key={product.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                        <div className="flex gap-4 mb-3">
                                            <img src={product.imageUrl} alt={product.name} className="w-20 h-20 rounded-lg object-cover bg-gray-100 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-bold text-gray-900 line-clamp-2 mb-1 pr-2">{product.name}</h3>
                                                    {product.trending && <Icons.TrendingUp className="w-4 h-4 text-orange-500 shrink-0" />}
                                                </div>
                                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">{product.category.replace('-', ' ')}</p>
                                                <div className="flex justify-between items-center">
                                                    <p className="font-bold text-lg text-gray-900" style={{ fontFamily: 'Arial, sans-serif' }}>&#8377;{product.price.toLocaleString()}</p>
                                                    <p className="text-sm text-gray-600">Stock: {product.stock ?? 0}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 pt-3 border-t border-gray-50">
                                            <button onClick={() => openModal(product)} className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-700 py-2.5 rounded-lg font-bold text-sm active:bg-blue-100 transition-colors"><Icons.Edit2 className="w-4 h-4" /> Edit</button>
                                            <button onClick={() => deleteProduct(product.id)} className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-700 py-2.5 rounded-lg font-bold text-sm active:bg-red-100 transition-colors"><Icons.Trash2 className="w-4 h-4" /> Delete</button>
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
                                                                    {order.id.slice(0, 8)}...
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
                                                                Order #{order.id}
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
                                                                        <p className="text-xs text-gray-500">x{item.quantity}</p>
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
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
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
                        )}
                    </>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">{editingId ? 'Edit Product' : 'New Product'}</h2>
                            <button onClick={closeModal}><Icons.X /></button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">Product Name</label>
                                <input {...register('name', { required: 'Name is required' })} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none bg-white text-gray-900" />
                                {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold mb-1">Price (<span style={{ fontFamily: 'Arial, sans-serif' }}>&#8377;</span>)</label>
                                    <input type="number" {...register('price', { required: 'Price is required', min: 0 })} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none bg-white text-gray-900" />
                                    {errors.price && <span className="text-red-500 text-xs">{errors.price.message}</span>}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">Market Price (<span style={{ fontFamily: 'Arial, sans-serif' }}>&#8377;</span>)</label>
                                    <input type="number" {...register('marketPrice', { min: 0 })} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none bg-white text-gray-900" placeholder="Optional" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold mb-1 flex items-center gap-2">
                                        Cost Price (<span style={{ fontFamily: 'Arial, sans-serif' }}>&#8377;</span>)
                                        <span className="text-xs font-normal text-gray-500">(For profit calc)</span>
                                    </label>
                                    <input type="number" {...register('costPrice', { min: 0 })} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none bg-purple-50 text-gray-900" placeholder="Optional" />
                                    <p className="text-xs text-gray-500 mt-1">Admin only - not visible to customers</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">Stock Quantity</label>
                                    <input type="number" {...register('stock', { required: 'Stock is required', min: 0 })} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none bg-white text-gray-900" />
                                    {errors.stock && <span className="text-red-500 text-xs">{errors.stock.message}</span>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Category</label>
                                <select {...register('category', { required: true })} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none bg-white text-gray-900">
                                    {categories.map(cat => <option key={cat.id} value={cat.slug}>{cat.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Image URL</label>
                                <input {...register('imageUrl', { required: 'Image URL is required' })} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none bg-white text-gray-900" placeholder="https://..." />
                                {errors.imageUrl && <span className="text-red-500 text-xs">{errors.imageUrl.message}</span>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Additional Images (Comma separated)</label>
                                <textarea {...register('additionalImages')} className="w-full border rounded-lg p-2 h-20 focus:ring-2 focus:ring-primary outline-none bg-white text-gray-900" placeholder="https://image2.jpg, https://image3.jpg"></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Description</label>
                                <textarea {...register('description', { required: 'Description is required' })} className="w-full border rounded-lg p-2 h-24 focus:ring-2 focus:ring-primary outline-none bg-white text-gray-900" placeholder="Enter product details..."></textarea>
                                {errors.description && <span className="text-red-500 text-xs">{errors.description.message}</span>}
                            </div>
                            <div className="flex items-center gap-3 mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <input type="checkbox" id="trending" {...register('trending')} className="w-5 h-5 accent-primary cursor-pointer" />
                                <label htmlFor="trending" className="text-sm font-bold cursor-pointer flex items-center gap-2"><Icons.TrendingUp className="w-4 h-4 text-orange-500" /> Mark as Trending</label>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className={`px-6 py-2 bg-black text-white rounded-lg font-bold hover:bg-gray-800 flex items-center gap-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    {isSubmitting && <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>}
                                    {isSubmitting ? 'Saving...' : 'Save Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
        </div>
    );
};