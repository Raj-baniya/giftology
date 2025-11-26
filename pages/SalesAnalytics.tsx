import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSalesAnalytics, SalesAnalytics as SalesData } from '../services/supabaseService';
import { Icons } from '../components/ui/Icons';
import { LoadingSpinner } from '../components/ui/LoadingAnimations';
import { motion } from 'framer-motion';

export const SalesAnalytics = () => {
    const navigate = useNavigate();
    const [analytics, setAnalytics] = useState<SalesData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        setLoading(true);
        const data = await getSalesAnalytics();
        setAnalytics(data);
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const formatCurrency = (amount: number) => {
        // Using number formatting with explicit Rupee prefix
        const formatted = amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        return `₹${formatted}`;
    };

    const formatPercentage = (value: number) => {
        return `${value.toFixed(1)}%`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20 pb-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/admin')}
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                    >
                        <Icons.ChevronLeft className="w-5 h-5" />
                        <span className="font-semibold">Back to Admin</span>
                    </button>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Sales Analytics</h1>
                    <p className="text-gray-600">Track your revenue, costs, and profitability</p>
                </div>

                {/* Analytics Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {/* Total Revenue Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <Icons.TrendingUp className="w-6 h-6 text-green-600" />
                            </div>
                            <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                Revenue
                            </span>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-1">
                            {formatCurrency(analytics?.totalRevenue || 0)}
                        </h3>
                        <p className="text-sm text-gray-500">Total Sales Revenue</p>
                    </motion.div>

                    {/* Total Cost Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                <Icons.ShoppingBag className="w-6 h-6 text-orange-600" />
                            </div>
                            <span className="text-sm font-medium text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                                Cost
                            </span>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-1">
                            {formatCurrency(analytics?.totalCost || 0)}
                        </h3>
                        <p className="text-sm text-gray-500">Total Cost of Goods</p>
                    </motion.div>

                    {/* Total Profit Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg p-6 text-white"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <Icons.Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                                Profit
                            </span>
                        </div>
                        <h3 className="text-3xl font-bold mb-1">
                            {formatCurrency(analytics?.totalProfit || 0)}
                        </h3>
                        <p className="text-sm text-white/80">
                            Net Profit ({formatPercentage(analytics?.profitMargin || 0)} margin)
                        </p>
                    </motion.div>
                </div>

                {/* Secondary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Total Orders Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Icons.ShoppingBag className="w-7 h-7 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-gray-900">
                                    {analytics?.totalOrders || 0}
                                </h3>
                                <p className="text-sm text-gray-500">Total Orders</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Average Order Value Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Icons.TrendingUp className="w-7 h-7 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-gray-900">
                                    {formatCurrency(analytics?.averageOrderValue || 0)}
                                </h3>
                                <p className="text-sm text-gray-500">Average Order Value</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Info Note */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4"
                >
                    <div className="flex gap-3">
                        <Icons.Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <p className="font-semibold mb-1">How profit is calculated:</p>
                            <p>Profit = Total Revenue - (Cost Price × Quantity Sold). Make sure to set cost prices for all products in the Admin Dashboard for accurate profit calculations.</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
