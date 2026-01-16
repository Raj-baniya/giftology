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
import { ProductInfiniteMenu } from '../../components/ProductInfiniteMenu';

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
        <div className="min-h-screen overflow-x-hidden font-sans bg-background text-textMain selection:bg-primary/10 selection:text-primary">


            {/* --- Hero Section --- */}
            <ParallaxSection className="h-auto md:h-[50vh] pt-6 pb-6 flex items-center justify-center relative overflow-hidden">
                <div className="relative z-10 text-center px-3 max-w-5xl mx-auto">
                    <FadeInUp delay={0.2}>
                        <div className="flex flex-wrap justify-center gap-x-4 md:gap-x-8 mb-4">
                            <h1 className="text-5xl md:text-8xl font-bold tracking-tight" style={{
                                fontFamily: '"Playfair Display", serif',
                                color: '#9B1B30',
                            }}>
                                Giftology
                            </h1>
                        </div>
                    </FadeInUp>

                    <FadeInUp delay={0.8}>
                        <div className="flex items-center justify-center gap-6 mb-4">
                            <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-primary"></div>
                            <p className="text-sm md:text-lg font-bold tracking-[0.4em] text-textMuted uppercase leading-relaxed">
                                Unwrap Happiness
                            </p>
                            <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-primary"></div>
                        </div>
                    </FadeInUp>

                    <FadeInUp delay={1.2} className="flex justify-center mt-3">
                        <MagneticButton>
                            <Link
                                to="/shop"
                                className="group relative inline-flex items-center gap-3 px-8 py-3.5 md:px-10 md:py-4 rounded-full font-bold text-sm md:text-base transition-all bg-primary text-white hover:bg-[#7A1526] shadow-xl hover:shadow-primary/20 overflow-hidden"
                            >
                                <span className="relative z-10 tracking-[0.1em] uppercase">Explore Collection</span>
                                <Icons.ArrowRight className="w-4 h-4 md:w-5 md:h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </MagneticButton>
                    </FadeInUp>
                </div>
            </ParallaxSection>

            {/* --- Best Sellers --- */}
            {bestSellers.length > 0 && (
                <section className="pt-[0.4cm] pb-4 md:py-12 relative z-10">
                    <div className="max-w-7xl mx-auto px-4">
                        <FadeInUp className="flex items-center justify-center gap-6 mb-3">
                            <h2 className="text-3xl md:text-5xl font-bold text-primary" style={{
                                fontFamily: '"Playfair Display", serif',
                            }}>
                                Best Sellers
                            </h2>
                        </FadeInUp>

                        <StaggerChildren key={`${visibleTrending}-${displayedTrending.length}`} className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-6">
                            {displayedTrending.map((product) => (
                                <StaggerItem key={product.id}>
                                    <Link to={`/product/${product.slug}`}>
                                        <div className="group relative rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
                                            {/* Luxury Badge */}
                                            <div className="absolute top-4 right-4 z-10 bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg tracking-[0.2em] uppercase">
                                                BEST SELLER
                                            </div>

                                            <div className="aspect-[4/5] overflow-hidden relative">
                                                <img
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                                />
                                            </div>
                                            <div className="p-6 text-center bg-white">
                                                <h3 className="font-bold text-textMain text-sm mb-2 line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>
                                                <p className="text-primary font-bold text-lg">₹{product.sale_price || product.price}</p>
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
                                    className="relative z-50 inline-block px-12 py-3.5 rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all duration-500 font-bold text-xs tracking-[0.2em] uppercase cursor-pointer bg-transparent"
                                >
                                    {visibleTrending >= bestSellers.length ? 'Show Less' : 'Show More Collection'}
                                </button>
                            )}
                        </div>

                        {/* Interactive Space View */}
                        <div className="mt-12 w-full h-[60vh] rounded-[2rem] overflow-hidden shadow-2xl relative z-40 border border-white/10 bg-[#030014]/50 backdrop-blur-sm">
                            <div className="absolute top-4 left-4 z-10 bg-primary/20 backdrop-blur-md text-primary border border-primary/20 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                                Interactive Space View
                            </div>
                            <ProductInfiniteMenu products={products} />
                        </div>
                    </div>
                </section>
            )}

            {/* --- Curated/Featured Section (Replaces Santa) --- */}
            <section className="py-2 relative z-10">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="relative rounded-[2rem] overflow-hidden bg-white shadow-2xl border border-gray-100">
                        <div className="grid md:grid-cols-2 gap-0 md:gap-0 items-center bg-white rounded-[2rem] overflow-hidden">
                            <FadeInUp className="relative h-[400px] md:h-[600px] overflow-hidden group">
                                <img
                                    src="https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=800&q=80"
                                    alt="Personalized Gifts"
                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                />
                            </FadeInUp>

                            <FadeInUp delay={0.3} className="px-6 pb-6 pt-3 md:p-8 text-center md:text-left">
                                <div className="inline-block px-5 py-1.5 rounded-full bg-primary/5 text-primary text-[10px] font-black tracking-[0.3em] mb-6 uppercase">
                                    Bespoke Selection
                                </div>
                                <h2 className="text-3xl md:text-6xl font-bold mb-6 text-textMain leading-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
                                    Crafting <br /> Memorable <br /> Moments
                                </h2>
                                <p className="text-textMuted text-base md:text-lg mb-8 leading-relaxed font-medium">
                                    Every gift tells a unique story. Discover our artisan-curated collection designed to make every occasion deeply personal.
                                </p>
                                <Link
                                    to="/shop"
                                    className="inline-flex items-center gap-2 text-primary font-bold text-lg hover:gap-4 transition-all"
                                >
                                    Explore Our Story <Icons.ArrowRight className="w-5 h-5" />
                                </Link>
                            </FadeInUp>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Curated Collections --- */}
            <section className="py-6 pb-4 relative z-10">
                <div className="max-w-7xl mx-auto px-4">
                    <FadeInUp className="text-center mb-4">
                        <h2 className="text-3xl md:text-5xl font-bold text-primary mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>
                            Curated Categories
                        </h2>
                        <p className="text-textMuted text-lg font-medium">Find the perfect expression for everyone in your life</p>
                    </FadeInUp>

                    <StaggerChildren key={`${visibleCategories}-${displayedCategories.length}`} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 mb-12">
                        {displayedCategories.map((cat) => (
                            <StaggerItem key={cat.id}>
                                <Link to={`/shop?category=${cat.slug}`}>
                                    <HoverCard className="h-[250px] rounded-[1.5rem] overflow-hidden shadow-md border border-gray-100 group hover:border-primary/20">
                                        <img
                                            src={cat.imageUrl}
                                            alt={cat.name}
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                        <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
                                            <div className="inline-block px-5 py-1.5 border border-white/30 rounded-full bg-white/10 backdrop-blur-md mb-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 duration-500">
                                                <span className="text-white text-[10px] font-black tracking-[0.2em]">VIEW ALL</span>
                                            </div>
                                            <h3 className="text-xl font-bold text-white transition-colors">{cat.name}</h3>
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
                                className="relative z-50 inline-block px-12 py-3.5 rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all duration-500 font-bold text-xs tracking-[0.2em] uppercase cursor-pointer bg-transparent"
                            >
                                {visibleCategories >= categories.length ? 'Show Less' : 'Explore All Collections'}
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {/* --- AI Product Assistant Header --- */}
            <section className="pt-12 pb-2 relative z-10">
                <div className="max-w-4xl mx-auto px-4">
                    <FadeInUp className="text-center">
                        <div className="inline-block px-5 py-2 rounded-full bg-primary/5 text-primary text-[10px] font-black tracking-[0.3em] mb-4 uppercase">
                            Bespoke Concierge
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-textMain mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>
                            Personalized Assistance
                        </h2>
                        <p className="text-textMuted text-lg font-medium">Allow us to curate the perfect gift experience for you</p>
                    </FadeInUp>
                </div>
            </section>

            {/* --- AI Product Assistant --- */}
            <AIProductAssistant products={products} />

            {/* --- Contact Us Section --- */}
            <section className="py-8 relative z-10">
                <div className="max-w-4xl mx-auto px-4">


                    <FadeInUp delay={0.3} className="bg-white rounded-[2.5rem] p-8 md:p-16 shadow-2xl border border-gray-100">
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                if (!contactForm.name || !contactForm.phone) {
                                    showAlert('Error', 'Please provide your name and contact details.', 'error');
                                    return;
                                }
                                setSubmitting(true);
                                try {
                                    const { success } = await submitContactMessage({
                                        name: contactForm.name,
                                        phone: contactForm.phone,
                                        message: contactForm.message,
                                        source: 'homepage_luxe'
                                    });
                                    if (success) {
                                        showAlert('Registration Successful', 'Our specialist will contact you shortly.', 'success');
                                        setContactForm({ name: '', phone: '', message: '' });
                                    } else {
                                        throw new Error('Submission Failed');
                                    }
                                } catch (error) {
                                    showAlert('Submission Failed', 'Please contact our concierge directly at +91 9137645161.', 'error');
                                } finally {
                                    setSubmitting(false);
                                }
                            }}
                            className="grid md:grid-cols-2 gap-8"
                        >
                            <div className="space-y-3">
                                <label className="text-xs font-black text-textMain uppercase tracking-widest ml-1">Full Name</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Alexander Pierce"
                                    value={contactForm.name}
                                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                                    className="w-full bg-[#FAF9F6] border border-gray-200 rounded-2xl px-6 py-4 text-textMain focus:outline-none focus:border-primary transition-all placeholder:text-gray-400 font-medium"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-black text-textMain uppercase tracking-widest ml-1">Private Contact</label>
                                <input
                                    type="tel"
                                    placeholder="+91 XXX XXX XXXX"
                                    value={contactForm.phone}
                                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                                    className="w-full bg-[#FAF9F6] border border-gray-200 rounded-2xl px-6 py-4 text-textMain focus:outline-none focus:border-primary transition-all placeholder:text-gray-400 font-medium"
                                />
                            </div>
                            <div className="md:col-span-2 space-y-3">
                                <label className="text-xs font-black text-textMain uppercase tracking-widest ml-1">Inquiry Details (Optional)</label>
                                <textarea
                                    placeholder="Describe your requirement..."
                                    rows={4}
                                    value={contactForm.message}
                                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                                    className="w-full bg-[#FAF9F6] border border-gray-200 rounded-2xl px-6 py-4 text-textMain focus:outline-none focus:border-primary transition-all placeholder:text-gray-400 font-medium resize-none"
                                />
                            </div>
                            <div className="md:col-span-2 mt-6 text-center">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex items-center gap-3 px-14 py-5 bg-primary hover:bg-[#7A1526] text-white font-black rounded-full transition-all active:scale-95 disabled:opacity-50 shadow-2xl hover:shadow-primary/30 uppercase tracking-[0.2em] text-xs"
                                >
                                    {submitting ? <Icons.Loader2 className="w-5 h-5 animate-spin" /> : 'Request Assistance'}
                                    {!submitting && <Icons.ArrowRight className="w-5 h-5" />}
                                </button>
                                <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-8 pt-12 border-t border-gray-100">
                                    <div className="text-center group cursor-pointer">
                                        <div className="text-primary mb-3 flex justify-center group-hover:scale-110 transition-transform"><Icons.Phone className="w-6 h-6" /></div>
                                        <p className="text-xs font-bold text-textMain tracking-wide">+91 9137645161</p>
                                        <p className="text-xs text-textMuted">Private Line</p>
                                    </div>
                                    <div className="text-center group cursor-pointer">
                                        <div className="text-primary mb-3 flex justify-center group-hover:scale-110 transition-transform"><Icons.Mail className="w-6 h-6" /></div>
                                        <p className="text-xs font-bold text-textMain tracking-wide">concierge@giftology.in</p>
                                        <p className="text-xs text-textMuted">Priority Intake</p>
                                    </div>
                                    <div className="text-center col-span-2 md:col-span-1 group cursor-pointer">
                                        <div className="text-primary mb-3 flex justify-center group-hover:scale-110 transition-transform"><Icons.MapPin className="w-6 h-6" /></div>
                                        <p className="text-xs font-bold text-textMain tracking-wide">Mumbai Headquarters</p>
                                        <p className="text-xs text-textMuted">By Appointment Only</p>
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
