import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Icons } from '../../components/ui/Icons';
import { store } from '../../services/store';
import { Product } from '../../types';

export const ChristmasHome = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const [allProducts, allCategories] = await Promise.all([
                store.getProducts(),
                store.getCategories()
            ]);
            setProducts(allProducts);
            setCategories(allCategories);
        };
        fetchData();
    }, []);

    return (
        <div className="min-h-screen bg-red-50 overflow-x-hidden font-serif">
            {/* Snow Effect Overlay (CSS animation could be added here) */}
            <div className="fixed inset-0 pointer-events-none z-50 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/snow.png')]"></div>

            {/* Hero Section */}
            <section className="relative h-[90vh] w-full overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1543589077-47d81606c1bf?auto=format&fit=crop&w=1920&q=80"
                        alt="Christmas Background"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-red-900/60 to-green-900/60" />
                </div>

                <div className="relative z-10 text-center text-white px-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-6xl md:text-8xl font-bold mb-4 drop-shadow-lg text-yellow-300" style={{ fontFamily: 'Mountains of Christmas, cursive' }}>
                            Merry Christmas
                        </h1>
                        <p className="text-xl md:text-3xl mb-8 font-light tracking-wide">
                            Spread Joy with the Perfect Gift
                        </p>
                        <Link
                            to="/shop?category=christmas"
                            className="inline-block bg-white text-red-700 px-10 py-4 rounded-full font-bold text-xl hover:bg-green-700 hover:text-white transition-all shadow-xl transform hover:scale-105"
                        >
                            Shop Christmas Gifts
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Curated Collections - Same as Default Theme */}
            <section id="categories" className="py-12 md:py-24 bg-background">
                <div className="max-w-7xl mx-auto">
                    <div className="px-4 mb-8 flex justify-between items-end">
                        <div>
                            <h2 className="font-serif text-3xl md:text-4xl font-bold text-textMain mb-2">Curated Collections</h2>
                            <div className="w-16 h-1 bg-accent rounded-full"></div>
                        </div>

                        {/* Desktop Navigation Controls */}
                        <div className="hidden md:flex gap-2">
                            <button onClick={() => {
                                const container = document.getElementById('categories-scroll');
                                if (container) container.scrollBy({ left: -300, behavior: 'smooth' });
                            }} className="p-2 rounded-full border border-gray-300 hover:bg-white hover:shadow-md transition-all">
                                <Icons.ChevronLeft className="w-5 h-5" />
                            </button>
                            <button onClick={() => {
                                const container = document.getElementById('categories-scroll');
                                if (container) container.scrollBy({ left: 300, behavior: 'smooth' });
                            }} className="p-2 rounded-full border border-gray-300 hover:bg-white hover:shadow-md transition-all">
                                <Icons.ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Scroll Container */}
                    <div
                        id="categories-scroll"
                        className="flex overflow-x-auto snap-x snap-mandatory gap-4 px-4 pb-8"
                        style={{ scrollbarWidth: 'auto', msOverflowStyle: 'auto' }}
                    >
                        {categories.map((cat, index) => (
                            <motion.div
                                key={cat.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 }}
                                className="snap-start shrink-0 w-[220px] md:w-[280px] lg:w-[320px]"
                            >
                                <Link
                                    to={`/shop?category=${cat.slug}`}
                                    className="block group relative overflow-hidden rounded-2xl aspect-[3/4] shadow-md hover:shadow-xl smooth-transition-slow card-hover"
                                >
                                    <img
                                        src={cat.imageUrl}
                                        alt={cat.name}
                                        className="w-full h-full object-cover smooth-transition-slow group-hover:scale-110 group-hover:-translate-y-2"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />
                                    <div className="absolute bottom-0 left-0 right-0 p-5 transform translate-y-1 group-hover:translate-y-0 smooth-transition">
                                        <h3 className="text-white font-serif text-xl md:text-2xl font-bold mb-1">{cat.name}</h3>
                                        <span className="text-primary text-sm font-bold flex items-center gap-1 opacity-80 group-hover:opacity-100 smooth-transition">
                                            Explore <Icons.ChevronRight className="w-3 h-3 smooth-transition" />
                                        </span>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                        {/* Padding spacer for end of scroll */}
                        <div className="shrink-0 w-4" />
                    </div>
                </div>
            </section>

            {/* Christmas Sale Banner */}
            <section className="py-16 bg-gradient-to-r from-blue-900 to-blue-700 text-white text-center">
                <div className="max-w-4xl mx-auto px-4">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-orange-400" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>Holiday Special Sale!</h2>
                    <p className="text-xl mb-8 text-white">Get up to 50% off on selected items. Make this Christmas unforgettable.</p>
                    <Link to="/shop" className="inline-block bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-4 rounded-full font-bold hover:from-red-600 hover:to-red-700 transition-all transform hover:scale-105 shadow-lg">
                        View Offers
                    </Link>
                </div>
            </section>
        </div>
    );
};
