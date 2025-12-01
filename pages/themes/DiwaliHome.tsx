import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Icons } from '../../components/ui/Icons';
import { store } from '../../services/store';
import { Product } from '../../types';

export const DiwaliHome = () => {
    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const allCategories = await store.getCategories();
            setCategories(allCategories || []);
        };
        fetchData();
    }, []);

    return (
        <div className="min-h-screen bg-orange-50 overflow-x-hidden font-sans">
            {/* Hero Section */}
            <section className="relative h-[90vh] w-full overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1513273266180-2d88b83f36f9?auto=format&fit=crop&w=1920&q=80"
                        alt="Diwali Background"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-900/80 to-purple-900/60" />
                </div>

                <div className="relative z-10 text-center text-white px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-6xl md:text-8xl font-bold mb-4 text-yellow-400 drop-shadow-xl">
                            Happy Diwali
                        </h1>
                        <p className="text-xl md:text-3xl mb-8 font-medium text-orange-100">
                            Light up your life with the joy of gifting
                        </p>
                        <Link
                            to="/shop?category=diwali"
                            className="inline-block bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-12 py-4 rounded-full font-bold text-xl hover:shadow-2xl hover:scale-105 transition-all border-2 border-yellow-300"
                        >
                            Explore Diwali Gifts
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Decorative Divider */}
            <div className="h-16 bg-[url('https://www.transparenttextures.com/patterns/diagonales-decalees.png')] bg-orange-600 opacity-20"></div>

            {/* Categories */}
            <section className="py-20 bg-[#FFF3E0]">
                <div className="max-w-7xl mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center text-orange-800 mb-12">Celebrate with Tradition</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {categories.map((cat, idx) => (
                            <motion.div
                                key={cat.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <Link to={`/shop?category=${cat.slug}`} className="block bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all group">
                                    <div className="h-48 overflow-hidden">
                                        <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                    <div className="p-4 text-center">
                                        <h3 className="text-xl font-bold text-orange-900 mb-2">{cat.name}</h3>
                                        <span className="text-orange-600 font-semibold text-sm">View Collection &rarr;</span>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};
