import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../../components/ui/Icons';
import { store } from '../../services/store';
import { submitContactMessage } from '../../services/supabaseService';
import { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useCustomAlert } from '../../components/CustomAlert';
import {
    FadeInUp,
    StaggerChildren,
    StaggerItem,
    ParallaxSection,
    TextReveal,
    MagneticButton,
    HoverCard,
    ShimmerBorder
} from '../../components/christmas/ChristmasAnimations';
import { AIProductAssistant } from '../../components/AIProductAssistant';

export const SparklingHome = () => {
    const [categories, setCategories] = useState<any[]>([]);
    const [bestSellers, setBestSellers] = useState<Product[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    // Pagination State
    const [visibleTrending, setVisibleTrending] = useState(4);
    const [visibleCategories, setVisibleCategories] = useState(8);

    const { addToCart } = useCart();
    const { showAlert } = useCustomAlert();

    // Contact Form State
    const [contactForm, setContactForm] = useState({ name: '', phone: '', message: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [allCategories, allProducts] = await Promise.all([
                    store.getCategories(),
                    store.getProducts()
                ]);
                setCategories(allCategories);
                setProducts(allProducts); // Store all products for AI Assistant
                setCategories(allCategories); // Intentionally kept to minimize diff from ChristmasHome

                // Show trending products as Best Sellers, but include ALL products for 'Show More'
                const trending = allProducts.filter(p => p.trending);
                const nonTrending = allProducts.filter(p => !p.trending);

                if (trending.length > 0) {
                    setBestSellers([...trending, ...nonTrending]);
                } else {
                    setBestSellers(allProducts);
                }
            } catch (error) {
                console.error('Failed to fetch home data:', error);
            }
        };
        fetchData();
    }, []);

    const handleShowMoreTrending = () => {
        setVisibleTrending(prev => prev + 12);
    };

    const handleShowMoreCategories = () => {
        setVisibleCategories(prev => prev + 12);
    };

    const displayedTrending = bestSellers.slice(0, visibleTrending);
    const displayedCategories = categories.slice(0, visibleCategories);

    return (
        <div className="min-h-screen overflow-x-hidden font-serif bg-transparent text-[#F4E6D0] selection:bg-purple-500 selection:text-white">


            {/* --- Hero Section --- */}
            <ParallaxSection className="h-auto md:h-[50vh] pt-12 pb-16 flex items-center justify-center relative overflow-hidden">
                <div className="relative z-10 text-center px-3 max-w-5xl mx-auto">
                    <FadeInUp delay={0.2}>
                        <div className="flex flex-wrap justify-center gap-x-4 md:gap-x-8 mb-2">
                            <h1 className="text-4xl md:text-7xl font-bold drop-shadow-[0_0_15px_rgba(232,201,207,0.5)]" style={{
                                fontFamily: '"Playfair Display", serif',
                                color: '#F4E6D0',
                            }}>
                                <TextReveal text="Giftology" />
                            </h1>
                        </div>
                    </FadeInUp>

                    <FadeInUp delay={0.8}>
                        <div className="flex items-center justify-center gap-4 mb-2">
                            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#F4E6D0]/60"></div>
                            <p className="text-base md:text-xl font-light tracking-[0.3em] text-[#F4E6D0] uppercase drop-shadow-md leading-relaxed">
                                Unwrap Happiness
                            </p>
                            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#F4E6D0]/60"></div>
                        </div>
                    </FadeInUp>

                    <FadeInUp delay={1.2} className="flex justify-center mt-6 md:mt-8">
                        <MagneticButton>
                            <Link
                                to="/shop"
                                className="group relative inline-flex items-center gap-2 px-6 py-2.5 md:px-8 md:py-3 rounded-full font-bold text-xs md:text-base transition-all border-2 animate-space-glow bg-black/40 backdrop-blur-md overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <span className="relative z-10 text-[#F4E6D0] tracking-[0.1em] uppercase drop-shadow-lg">Explore Collection</span>
                                <Icons.Compass className="w-4 h-4 md:w-5 md:h-5 relative z-10 text-[#F4E6D0] group-hover:rotate-180 transition-transform duration-1000" />

                                {/* Inner glow for that "space" feel */}
                                <div className="absolute inset-0 rounded-full opacity-50 group-hover:opacity-80 transition-opacity blur-md bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full duration-1000"></div>
                            </Link>
                        </MagneticButton>
                    </FadeInUp>
                </div>
            </ParallaxSection>

            {/* --- Best Sellers --- */}
            {bestSellers.length > 0 && (
                <section className="pt-[0.4cm] pb-4 md:py-12 relative z-10">
                    <div className="max-w-7xl mx-auto px-4">
                        <FadeInUp className="flex items-center justify-center gap-6 mb-8">
                            <h2 className="text-4xl md:text-6xl font-bold animate-gradient-text drop-shadow-md" style={{
                                fontFamily: '"Playfair Display", serif',
                                background: 'linear-gradient(to right, #F4E6D0, #FFD700, #E94560, #F4E6D0)',
                                backgroundSize: '300% auto',
                                WebkitBackgroundClip: 'text',
                                backgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                color: 'transparent', // Fallback
                            }}>
                                Best Sellers
                            </h2>
                        </FadeInUp>

                        <StaggerChildren key={`${visibleTrending}-${displayedTrending.length}`} className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-16">
                            {displayedTrending.map((product) => (
                                <StaggerItem key={product.id}>
                                    <Link to={`/product/${product.slug}`}>
                                        <div className="group relative rounded-xl overflow-hidden bg-[#1A1A2E]/50 border border-[#FFD700]/30 hover:border-[#FFD700] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                                            {/* Gift Tag Badge */}
                                            <div className="absolute top-3 right-3 z-10 bg-[#FFD700] text-black text-xs font-bold px-3 py-1 rounded shadow-lg shadow-black/50 tracking-wider">
                                                BEST SELLER
                                            </div>

                                            <div className="aspect-square overflow-hidden relative">
                                                <img
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A2E] via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500"></div>
                                            </div>
                                            <div className="p-5 text-center relative bg-[#1A1A2E]">
                                                <h3 className="font-bold text-[#F4E6D0] text-base mb-2 line-clamp-1 group-hover:text-white transition-colors drop-shadow-sm">{product.name}</h3>
                                                <p className="text-[#FFD700] font-bold text-xl drop-shadow-md">₹{product.sale_price || product.price}</p>
                                            </div>
                                        </div>
                                    </Link>
                                </StaggerItem>
                            ))}
                        </StaggerChildren>

                        <div className="text-center mt-8 relative z-50">
                            {/* Render button if there are more items OR if we have expanded (to allow showing less) */}
                            {(bestSellers.length > 4) && (
                                <button
                                    onClick={() => {
                                        if (visibleTrending >= bestSellers.length) {
                                            setVisibleTrending(4); // Show Less
                                        } else {
                                            handleShowMoreTrending(); // Show More
                                        }
                                    }}
                                    className="relative z-50 inline-block px-10 py-3 rounded-full border border-[#F4E6D0]/30 text-[#F4E6D0] hover:bg-[#F4E6D0] hover:text-black transition-all duration-300 font-medium text-sm tracking-widest uppercase cursor-pointer backdrop-blur-sm bg-black/30"
                                >
                                    {visibleTrending >= bestSellers.length ? 'Show Less' : 'Show More Trending'}
                                </button>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* --- Curated/Featured Section (Replaces Santa) --- */}
            <section className="py-2 relative z-10">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="relative rounded-3xl overflow-hidden bg-[#F4E6D0]/5 backdrop-blur-xl border border-[#F4E6D0]/10 p-1 shadow-2xl">
                        <div className="grid md:grid-cols-2 gap-0 md:gap-10 items-center bg-black/40 rounded-[1.3rem] overflow-hidden">
                            <FadeInUp className="relative h-[400px] md:h-[500px] overflow-hidden group">
                                <img
                                    src="https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=800&q=80"
                                    alt="Personalized Gifts"
                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                            </FadeInUp>

                            <FadeInUp delay={0.3} className="px-6 pb-6 pt-3 md:p-8 text-center md:text-left">
                                <div className="inline-block px-4 py-1 rounded-full border border-[#F4E6D0]/30 text-[#F4E6D0]/80 text-xs font-bold tracking-[0.2em] mb-3">
                                    HANDPICKED FOR YOU
                                </div>
                                <h2 className="text-3xl md:text-5xl font-bold mb-3 text-[#F4E6D0] leading-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
                                    Memorable Moments
                                </h2>
                                <p className="text-[#F4E6D0]/80 text-base md:text-lg mb-5 leading-relaxed font-light">
                                    Every gift tells a story. Discover our curated collection designed to make every occasion unforgettable.
                                </p>
                                <Link
                                    to="/shop"
                                    className="inline-block border-b border-[#F4E6D0] pb-1 text-[#F4E6D0] text-lg hover:text-white hover:border-white transition-all font-light tracking-wide"
                                >
                                    Explore the Collection
                                </Link>
                            </FadeInUp>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Curated Collections --- */}
            <section className="py-20 pb-10 relative z-10">
                <div className="max-w-7xl mx-auto px-4">
                    <FadeInUp className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-[#F4E6D0] mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>
                            Our Collections
                        </h2>
                        <p className="text-[#F4E6D0]/70 text-lg font-light tracking-wide">Find the perfect category for everyone on your list</p>
                    </FadeInUp>

                    <StaggerChildren key={`${visibleCategories}-${displayedCategories.length}`} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 mb-12">
                        {displayedCategories.map((cat) => (
                            <StaggerItem key={cat.id}>
                                <Link to={`/shop?category=${cat.slug}`}>
                                    <HoverCard className="h-[200px] rounded-xl overflow-hidden shadow-lg border border-[#F4E6D0]/10 group hover:border-[#F4E6D0]/40">
                                        <img
                                            src={cat.imageUrl}
                                            alt={cat.name}
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                                        <div className="absolute bottom-0 left-0 right-0 p-5 text-center">
                                            <div className="inline-block px-3 py-1 border border-[#F4E6D0]/50 rounded-full bg-black/40 backdrop-blur-md mb-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 duration-500">
                                                <span className="text-[#F4E6D0] text-[10px] font-bold tracking-widest">EXPLORE</span>
                                            </div>
                                            <h3 className="text-lg font-medium text-[#F4E6D0]/90 group-hover:text-white transition-colors">{cat.name}</h3>
                                        </div>
                                    </HoverCard>
                                </Link>
                            </StaggerItem>
                        ))}
                    </StaggerChildren>

                    <div className="text-center mt-8 relative z-50">
                        {(categories.length > 8) && (
                            <button
                                onClick={() => {
                                    if (visibleCategories >= categories.length) {
                                        setVisibleCategories(8); // Show Less
                                    } else {
                                        handleShowMoreCategories(); // Show More
                                    }
                                }}
                                className="relative z-50 inline-block px-10 py-3 rounded-full border border-[#F4E6D0]/30 text-[#F4E6D0] hover:bg-[#F4E6D0] hover:text-black transition-all duration-300 font-medium text-sm tracking-widest uppercase cursor-pointer backdrop-blur-sm bg-black/30"
                            >
                                {visibleCategories >= categories.length ? 'Show Less' : 'Show More Collections'}
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {/* --- AI Product Assistant --- */}
            <AIProductAssistant products={products} />

            {/* --- Contact Us Section --- */}
            <section className="py-24 relative z-10">
                <div className="max-w-4xl mx-auto px-4">
                    <FadeInUp className="text-center mb-12">
                        <div className="inline-block px-4 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-bold tracking-[0.2em] mb-4">
                            GET IN TOUCH
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>
                            Questions? We're Here
                        </h2>
                        <p className="text-gray-400 text-lg font-light">Let us help you find the perfect gift</p>
                    </FadeInUp>

                    <FadeInUp delay={0.3} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                if (!contactForm.name || !contactForm.phone) {
                                    showAlert('Error', 'Please enter your name and phone number.', 'error');
                                    return;
                                }
                                setSubmitting(true);
                                try {
                                    const { success } = await submitContactMessage({
                                        name: contactForm.name,
                                        phone: contactForm.phone,
                                        message: contactForm.message,
                                        source: 'homepage_sparkling'
                                    });
                                    if (success) {
                                        showAlert('Message Sent', 'We will get back to you shortly!', 'success');
                                        setContactForm({ name: '', phone: '', message: '' });
                                    } else {
                                        throw new Error('Failed to send message');
                                    }
                                } catch (error) {
                                    showAlert('Error', 'Failed to send message. Please call us directly.', 'error');
                                } finally {
                                    setSubmitting(false);
                                }
                            }}
                            className="grid md:grid-cols-2 gap-6"
                        >
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 ml-1">Your Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter your name"
                                    value={contactForm.name}
                                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-gray-600 border-opacity-20"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 ml-1">Phone Number</label>
                                <input
                                    type="tel"
                                    placeholder="your phone"
                                    value={contactForm.phone}
                                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-gray-600 border-opacity-20"
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-sm font-medium text-gray-300 ml-1">Message (Optional)</label>
                                <textarea
                                    placeholder="How can we help?"
                                    rows={4}
                                    value={contactForm.message}
                                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-gray-600 resize-none border-opacity-20"
                                />
                            </div>
                            <div className="md:col-span-2 mt-4 text-center">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex items-center gap-2 px-10 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-full transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {submitting ? <Icons.Loader2 className="w-5 h-5 animate-spin" /> : 'Send Message'}
                                    {!submitting && <Icons.ArrowRight className="w-5 h-5" />}
                                </button>
                                <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-6 pt-8 border-t border-white/5">
                                    <div className="text-center">
                                        <div className="text-purple-400 mb-2 flex justify-center"><Icons.Phone className="w-5 h-5" /></div>
                                        <p className="text-sm text-gray-400">+91 9137645161</p>
                                        <p className="text-sm text-gray-400">+91 8108303255</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-purple-400 mb-2 flex justify-center"><Icons.Mail className="w-5 h-5" /></div>
                                        <p className="text-sm text-gray-400 break-all">giftology.in14@gmail.com</p>
                                    </div>
                                    <div className="text-center col-span-2 md:col-span-1">
                                        <div className="text-purple-400 mb-2 flex justify-center"><Icons.MapPin className="w-5 h-5" /></div>
                                        <p className="text-sm text-gray-400">Mumbai, India</p>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </FadeInUp>
                </div>
            </section>

        </div>
    );
};
