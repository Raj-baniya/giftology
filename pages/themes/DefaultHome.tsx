import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Icons } from '../../components/ui/Icons';
import { ProductInfiniteMenu } from '../../components/ProductInfiniteMenu';
import { store } from '../../services/store';
import { Product } from '../../types';

export const DefaultHome = () => {
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);

    // Fetch products and categories
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [allProducts, allCategories] = await Promise.all([
                    store.getProducts(),
                    store.getCategories()
                ]);
                setProducts(allProducts);
                setCategories(allCategories);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoadingProducts(false);
            }
        };
        fetchData();
    }, []);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 300;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-background overflow-x-hidden">
            {/* Hero Section */}
            <section className="relative h-[100dvh] w-full overflow-hidden">

                {/* Background Image with Animation */}
                <div className="absolute inset-0 w-full h-full">
                    <div className="absolute inset-0 bg-black/40 z-10" /> {/* Overlay for readability */}
                    <div
                        className="w-full h-full bg-cover bg-center animate-slow-zoom"
                        style={{
                            backgroundImage: 'url(https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=1920&q=80)',
                            willChange: 'transform'
                        }}
                    />
                </div>

                {/* Content */}
                <div className="relative z-20 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center text-center text-white pb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.2 }}
                    >
                        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-tight mb-6 tracking-tight drop-shadow-lg">
                            Gifting Has <br />
                            <span className="text-primary italic">Never Been</span> <br />
                            Easier
                        </h1>

                        <p className="text-gray-200 text-lg sm:text-xl md:text-2xl leading-relaxed mb-8 max-w-2xl mx-auto font-sans drop-shadow-md px-2">
                            Whether it’s a birthday, wedding, or any special occasion, Giftology helps you find unique and thoughtful gifts for everyone on your list.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center px-4 w-full sm:w-auto">
                            <Link
                                to="/shop"
                                className="inline-flex items-center justify-center px-8 py-4 bg-white text-black text-lg font-bold rounded-full hover:bg-primary hover:text-black smooth-transition hover-lift btn-animated shadow-xl w-full sm:w-auto"
                            >
                                Explore Gifts
                                <Icons.Gift className="ml-2 w-5 h-5 smooth-transition" />
                            </Link>
                            <button
                                onClick={() => scrollToSection('about-us')}
                                className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-white text-white text-lg font-bold rounded-full hover:bg-white/10 smooth-transition hover-scale w-full sm:w-auto"
                            >
                                About Us
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Product Infinite Menu - Fun Way to Explore Products */}
            {!loadingProducts && products.length > 0 && (
                <section className="py-12 md:py-20 bg-gradient-to-b from-background to-[#FFF8E1]">
                    <div className="max-w-7xl mx-auto px-4">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-8"
                        >
                            <h2 className="font-serif text-3xl md:text-5xl font-bold text-textMain mb-3">
                                Explore Products in a <span className="text-primary italic">Fun Way</span>
                            </h2>
                            <p className="text-textMuted text-lg max-w-2xl mx-auto">
                                Spin, explore, and discover our amazing collection in 3D!
                            </p>
                        </motion.div>

                        <div className="w-full h-[65vh] rounded-2xl overflow-hidden shadow-2xl bg-black">
                            <ProductInfiniteMenu products={products} />
                        </div>

                        <div className="text-center mt-8">
                            <p className="text-sm text-textMuted mb-4">
                                <Icons.Info className="inline w-4 h-4 mr-1" />
                                Drag to rotate • Click the arrow to view product details
                            </p>
                        </div>
                    </div>
                </section>
            )}

            {/* Categories - Mobile Horizontal Scroll */}
            <section id="categories" className="py-12 md:py-24 bg-background">
                <div className="max-w-7xl mx-auto">
                    <div className="px-4 mb-8 flex justify-between items-end">
                        <div>
                            <h2 className="font-serif text-3xl md:text-4xl font-bold text-textMain mb-2">Curated Collections</h2>
                            <div className="w-16 h-1 bg-accent rounded-full"></div>
                        </div>

                        {/* Desktop Navigation Controls */}
                        <div className="hidden md:flex gap-2">
                            <button onClick={() => scroll('left')} className="p-2 rounded-full border border-gray-300 hover:bg-white hover:shadow-md transition-all">
                                <Icons.ChevronLeft className="w-5 h-5" />
                            </button>
                            <button onClick={() => scroll('right')} className="p-2 rounded-full border border-gray-300 hover:bg-white hover:shadow-md transition-all">
                                <Icons.ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Scroll Container */}
                    <div
                        ref={scrollContainerRef}
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

            {/* About Us Section */}
            <section id="about-us" className="py-20 bg-[#FFF8E1]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">

                    {/* Block 1: Intro */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="order-2 md:order-1"
                        >
                            <h2 className="font-serif text-5xl font-bold text-textMain mb-4 text-purple-900">About Us</h2>
                            <h3 className="font-sans text-2xl font-bold text-black mb-6">Think Different. Gift Different.</h3>
                            <p className="text-lg text-gray-700 leading-relaxed">
                                In a world cluttered with ordinary gifts, we saw an opportunity for the extraordinary. At Giftology, we didn’t just want to revolutionize gifting; we wanted to redefine it. For us, a gift is not just a product but an experience, a moment, a connection.
                            </p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="order-1 md:order-2"
                        >
                            <img
                                src="https://images.pexels.com/photos/3775119/pexels-photo-3775119.jpeg?auto=compress&cs=tinysrgb&w=800"
                                alt="Woman holding a gift"
                                className="rounded-xl shadow-2xl w-full object-cover h-[400px]"
                            />
                        </motion.div>
                    </div>

                    {/* Block 2: Center Text */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center max-w-3xl mx-auto py-10"
                    >
                        <h2 className="font-serif text-4xl md:text-5xl font-bold text-textMain mb-4">Designed In Mumbai</h2>
                        <h3 className="font-sans text-xl font-bold text-gray-800 mb-6">Loved Everywhere</h3>
                        <p className="text-lg text-gray-700 leading-relaxed">
                            Rooted in the heart of Mumbai, our journey began with a simple yet profound idea: to make gifting meaningful again. We meticulously curate every item, ensuring that it not only meets but exceeds the highest standards of quality, creativity, and innovation.
                        </p>
                    </motion.div>

                    {/* Block 3: Art of Gifting */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                        >
                            <img
                                src="https://images.pexels.com/photos/1666067/pexels-photo-1666067.jpeg?auto=compress&cs=tinysrgb&w=800"
                                alt="Artistic Gift Wrapping"
                                className="rounded-xl shadow-2xl w-full object-cover h-[400px]"
                            />
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="text-center md:text-left"
                        >
                            <h3 className="font-serif text-3xl font-bold text-textMain mb-6">The Art of Gifting</h3>
                            <p className="text-lg text-gray-700 leading-relaxed">
                                Rooted in the heart of Mumbai, our journey began with a simple yet profound idea: to make gifting meaningful again. We meticulously curate every item, ensuring that it not only meets but exceeds the highest standards of quality, creativity, and innovation.
                            </p>
                        </motion.div>
                    </div>

                    {/* Block 4: Tech Meets Tradition */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center bg-[#E0F2F1] rounded-3xl overflow-hidden">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="h-full"
                        >
                            <img
                                src="https://images.pexels.com/photos/3602258/pexels-photo-3602258.jpeg?auto=compress&cs=tinysrgb&w=800"
                                alt="3D Gift Box"
                                className="w-full h-full object-cover min-h-[400px]"
                            />
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="p-8 md:p-12 text-center md:text-right"
                        >
                            <h3 className="font-serif text-3xl font-bold text-textMain mb-6">Technology Meets Tradition</h3>
                            <p className="text-lg text-gray-700 leading-relaxed">
                                Our state-of-the-art recommendation engine is a blend of cutting-edge technology and deep cultural understanding. We've harnessed the power of machine learning and semantic SEO to understand not just what you want, but why you want it, ensuring that every gift you give is a masterpiece.
                            </p>
                        </motion.div>
                    </div>

                </div>
            </section>

            {/* Contact Us Section */}
            <section id="contact" className="py-16 bg-white border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="font-serif text-4xl font-bold text-textMain mb-12">Get in Touch</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                        {/* Phone */}
                        <div className="flex flex-col items-center p-6 bg-gray-50 rounded-2xl hover:shadow-lg smooth-transition hover-lift">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 smooth-transition hover-scale">
                                <Icons.Phone className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="font-bold text-lg mb-2">Call Us</h3>
                            <p className="text-gray-600 font-medium">+91 9137645161</p>
                            <p className="text-gray-600 font-medium">+91 8108303255</p>
                        </div>

                        {/* Email */}
                        <div
                            onClick={() => {
                                const event = new CustomEvent('openFeedbackModal', {
                                    detail: { title: 'Contact Us' }
                                });
                                window.dispatchEvent(event);
                            }}
                            className="bg-gray-50 p-8 rounded-2xl text-center hover:shadow-lg smooth-transition cursor-pointer group hover-lift"
                        >
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 smooth-transition">
                                <Icons.Mail className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="font-serif text-xl font-bold mb-2">Email Us</h3>
                            <p className="text-gray-600 text-xs sm:text-base">giftology.in01@gmail.com</p>
                        </div>

                        {/* Instagram */}
                        <a
                            href="https://www.instagram.com/giftology.in_?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center p-6 bg-gray-50 rounded-2xl hover:shadow-lg smooth-transition group cursor-pointer hover-lift"
                        >
                            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-pink-200 smooth-transition">
                                <Icons.Instagram className="w-8 h-8 text-pink-600" />
                            </div>
                            <h3 className="font-bold text-lg mb-2 group-hover:text-pink-600 smooth-transition">Follow Us</h3>
                            <p className="text-gray-600">@giftology.in_</p>
                        </a>

                    </div>
                </div>
            </section>
        </div>
    );
};
