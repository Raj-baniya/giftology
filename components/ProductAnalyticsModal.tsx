import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './ui/Icons';

interface ProductAnalyticsModalProps {
    isOpen: boolean;
    onClose: () => void;
    analytics: any;
    loading: boolean;
}

export const ProductAnalyticsModal: React.FC<ProductAnalyticsModalProps> = ({ isOpen, onClose, analytics, loading }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Product Analytics</h2>
                        {analytics && <p className="text-gray-500">{analytics.productName}</p>}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <Icons.X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-500">Loading analytics...</p>
                        </div>
                    ) : analytics ? (
                        <div className="space-y-8">
                            {/* Key Metrics Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <div className="flex items-center gap-2 mb-2 text-blue-700 font-medium">
                                        <Icons.ShoppingBag className="w-4 h-4" /> Units Sold
                                    </div>
                                    <p className="text-2xl font-bold text-blue-900">{analytics.totalUnitsSold}</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                    <div className="flex items-center gap-2 mb-2 text-green-700 font-medium">
                                        <Icons.DollarSign className="w-4 h-4" /> Total Revenue
                                    </div>
                                    <p className="text-2xl font-bold text-green-900">₹{analytics.totalRevenue.toLocaleString()}</p>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                    <div className="flex items-center gap-2 mb-2 text-purple-700 font-medium">
                                        <Icons.TrendingUp className="w-4 h-4" /> Total Profit
                                    </div>
                                    <p className="text-2xl font-bold text-purple-900">₹{analytics.totalProfit.toLocaleString()}</p>
                                </div>
                                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                                    <div className="flex items-center gap-2 mb-2 text-orange-700 font-medium">
                                        <Icons.Percent className="w-4 h-4" /> Profit Margin
                                    </div>
                                    <p className="text-2xl font-bold text-orange-900">{analytics.profitMargin.toFixed(1)}%</p>
                                </div>
                            </div>

                            {/* Detailed Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Icons.Tag className="w-5 h-5 text-gray-500" /> Pricing Details
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                                            <span className="text-gray-600">Selling Price</span>
                                            <span className="font-bold">₹{analytics.sellingPrice?.toLocaleString() || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                                            <span className="text-gray-600">Cost Price</span>
                                            <span className="font-bold text-gray-700">₹{analytics.costPrice?.toLocaleString() || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-white rounded-lg border-l-4 border-green-500">
                                            <span className="text-gray-600">Profit Per Unit</span>
                                            <span className="font-bold text-green-600">
                                                ₹{((analytics.sellingPrice || 0) - (analytics.costPrice || 0)).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Icons.Box className="w-5 h-5 text-gray-500" /> Inventory Status
                                    </h3>
                                    <div className="flex flex-col items-center justify-center h-full pb-4">
                                        <div className="text-4xl font-bold text-gray-900 mb-2">{analytics.currentStock}</div>
                                        <div className={`px-3 py-1 rounded-full text-sm font-bold ${analytics.currentStock > 10 ? 'bg-green-100 text-green-700' :
                                                analytics.currentStock > 0 ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                            }`}>
                                            {analytics.currentStock > 10 ? 'In Stock' :
                                                analytics.currentStock > 0 ? 'Low Stock' : 'Out of Stock'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Orders Table */}
                            <div>
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Icons.Clock className="w-5 h-5 text-gray-500" /> Recent Orders Containing This Item
                                </h3>
                                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="p-3 font-semibold text-gray-600">Order ID</th>
                                                <th className="p-3 font-semibold text-gray-600">Date</th>
                                                <th className="p-3 font-semibold text-gray-600">Customer</th>
                                                <th className="p-3 font-semibold text-gray-600">Qty</th>
                                                <th className="p-3 font-semibold text-gray-600">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {analytics.recentOrders && analytics.recentOrders.length > 0 ? (
                                                analytics.recentOrders.map((order: any) => (
                                                    <tr key={order.orderId} className="hover:bg-gray-50">
                                                        <td className="p-3 font-mono text-gray-500">#{order.orderId.slice(0, 8)}</td>
                                                        <td className="p-3">{new Date(order.date).toLocaleDateString()}</td>
                                                        <td className="p-3 font-medium">{order.customerName}</td>
                                                        <td className="p-3">{order.quantity}</td>
                                                        <td className="p-3">
                                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                                                    order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                                                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                                            'bg-yellow-100 text-yellow-700'
                                                                }`}>
                                                                {order.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                                        No orders found for this product yet.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20 text-gray-500">
                            Failed to load analytics data.
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
