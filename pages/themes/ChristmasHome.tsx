import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../../components/ui/Icons';
import { store } from '../../services/store';
import { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
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

export const ChristmasHome = () => {
    const [categories, setCategories] = useState<any[]>([]);
    const [bestSellers, setBestSellers] = useState<Product[]>([]);

    // Pagination State
    const [visibleTrending, setVisibleTrending] = useState(4);
    const [visibleCategories, setVisibleCategories] = useState(8);

    const { addToCart } = useCart();

    useEffect(() => {
        const fetchData = async () => {
            const [allCategories, allProducts] = await Promise.all([
                store.getCategories(),
                store.getProducts()
            ]);
            setCategories(allCategories);
            // Show trending products as Best Sellers
            setBestSellers(allProducts.filter(p => p.trending));
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
        <div className="min-h-screen overflow-x-hidden font-serif bg-black text-white selection:bg-purple-500 selection:text-white">
            {/* --- Live Aurora Background --- */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-black"></div>
                <div className="absolute inset-0 opacity-40 animate-aurora mix-blend-screen"
                    style={{
                        background: 'linear-gradient(120deg, #000000 0%, #1a0b2e 20%, #004d40 40%, #1a0b2e 60%, #000000 100%)',
                        backgroundSize: '400% 400%'
                    }}>
                </div>
                {/* Stars/Snow for texture */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
            </div>

            {/* --- Dynamic Snowfall Effect (Kept as subtle texture) --- */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                {[...Array(30)].map((_, i) => (
                    <div key={i} className="absolute rounded-full bg-white opacity-60 animate-snow" style={{
                        left: `${Math.random() * 100}%`,
                        top: `-${Math.random() * 20}%`,
                        width: `${Math.random() * 2 + 1}px`,
                        height: `${Math.random() * 2 + 1}px`,
                        animationDuration: `${Math.random() * 10 + 10}s`,
                        animationDelay: `${Math.random() * 5}s`,
                    }} />
                ))}
            </div>

            {/* --- Hero Section --- */}
            <ParallaxSection className="h-[60vh] md:h-[70vh] flex items-center justify-center relative overflow-hidden">
                <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
                    <FadeInUp delay={0.2}>
                        <div className="flex flex-wrap justify-center gap-x-4 md:gap-x-8 mb-6">
                            <h1 className="text-5xl md:text-8xl font-bold drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" style={{
                                fontFamily: '"Playfair Display", serif',
                                color: '#FFFFFF',
                            }}>
                                <TextReveal text="Merry" />
                            </h1>
                            <h1 className="text-5xl md:text-8xl font-bold drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" style={{
                                fontFamily: '"Playfair Display", serif',
                                color: '#FFFFFF',
                            }}>
                                <TextReveal text="Christmas" />
                            </h1>
                        </div>
                    </FadeInUp>

                    <FadeInUp delay={0.8}>
                        <div className="flex items-center justify-center gap-6 mb-8">
                            <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-white/60"></div>
                            <p className="text-lg md:text-2xl font-light tracking-[0.3em] text-gray-200 uppercase drop-shadow-md leading-relaxed">
                                Season of Giving
                            </p>
                            <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-white/60"></div>
                        </div>
                    </FadeInUp>

                    <FadeInUp delay={1.2} className="flex justify-center">
                        <MagneticButton>
                            <Link
                                to="/shop?category=christmas"
                                className="group relative inline-flex items-center gap-3 px-12 py-4 rounded-full font-bold text-base md:text-lg transition-all border border-white/30 hover:border-white/80 bg-white/10 backdrop-blur-md hover:bg-white/20"
                            >
                                <span className="relative z-10 text-white group-hover:text-white">Shop Collection</span>
                                <Icons.ArrowRight className="w-5 h-5 relative z-10 text-white group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </MagneticButton>
                    </FadeInUp>
                </div>
            </ParallaxSection>

            {/* --- Santa's Choice Section --- */}
            <section className="py-12 relative z-10">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="relative rounded-3xl overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 p-1 shadow-2xl">
                        <div className="grid md:grid-cols-2 gap-10 items-center bg-black/40 rounded-[1.3rem] overflow-hidden">
                            <FadeInUp className="relative h-[400px] md:h-[500px] overflow-hidden group">
                                <img
                                    src="https://imgs.search.brave.com/r4_YugodAlGz5rFlvWoHSNQ9CFKqKOkse3xR4WlzgDU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvNDg1/MTI0MzA0L3Bob3Rv/L3JlYWwtc2FudGEt/d2l0aC1iYWctb2Yt/Z2lmdHMuanBnP3M9/NjEyeDYxMiZ3PTAm/az0yMCZjPUxabjdX/VTVGbTlzSE1jZUdL/SllTdnRkZ2xnWFQx/OXFYTHJjSnFZY0hp/bEk9"
                                    alt="Santa giving gifts"
                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                            </FadeInUp>

                            <FadeInUp delay={0.3} className="p-10 text-center md:text-left">
                                <div className="inline-block px-4 py-1 rounded-full border border-white/30 text-white/80 text-xs font-bold tracking-[0.2em] mb-6">
                                    SANTA'S FAVORITES
                                </div>
                                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white leading-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
                                    The Joy of Giving
                                </h2>
                                <p className="text-gray-300 text-lg mb-10 leading-relaxed font-light">
                                    "Christmas isn't just a day, it's a frame of mind." <br />
                                    Discover our handpicked selection of gifts that bring warmth, joy, and magic to your loved ones this holiday season.
                                </p>
                                <Link
                                    to="/shop"
                                    className="inline-block border-b border-white pb-1 text-white text-lg hover:text-gray-300 hover:border-gray-300 transition-all font-light tracking-wide"
                                >
                                    Explore the Collection
                                </Link>
                            </FadeInUp>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Best Sellers --- */}
            {bestSellers.length > 0 && (
                <section className="py-20 relative z-10">
                    <div className="max-w-7xl mx-auto px-4">
                        <FadeInUp className="flex items-center justify-center gap-6 mb-16">
                            <h2 className="text-4xl md:text-6xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ fontFamily: '"Playfair Display", serif' }}>
                                Trending Gifts
                            </h2>
                        </FadeInUp>

                        <StaggerChildren className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-16">
                            {displayedTrending.map((product) => (
                                <StaggerItem key={product.id}>
                                    <Link to={`/product/${product.slug}`}>
                                        <div className="group relative rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/40 transition-all duration-500 hover:-translate-y-2">
                                            {/* Gift Tag Badge - Made SMALLER per request */}
                                            <div className="absolute top-3 right-3 z-10 bg-white text-black text-[10px] font-bold px-2 py-0.5 rounded-sm tracking-wide shadow-lg">
                                                BEST SELLER
                                            </div>

                                            <div className="aspect-square overflow-hidden relative">
                                                <img
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500"></div>
                                            </div>
                                            <div className="p-4 text-center relative">
                                                <h3 className="font-medium text-gray-200 text-sm mb-2 line-clamp-1 group-hover:text-white transition-colors">{product.name}</h3>
                                                <p className="text-white font-bold text-lg">₹{product.sale_price || product.price}</p>
                                            </div>
                                        </div>
                                    </Link>
                                </StaggerItem>
                            ))}
                        </StaggerChildren>

                        {bestSellers.length > visibleTrending && (
                            <div className="text-center mt-8 relative z-50">
                                <button
                                    onClick={handleShowMoreTrending}
                                    className="relative z-50 inline-block px-10 py-3 rounded-full border border-white/30 text-white hover:bg-white hover:text-black transition-all duration-300 font-medium text-sm tracking-widest uppercase cursor-pointer backdrop-blur-sm bg-black/30"
                                >
                                    Show More Trending
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* --- Curated Collections --- */}
            <section className="py-20 pb-40 relative z-10">
                <div className="max-w-7xl mx-auto px-4">
                    <FadeInUp className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>
                            Magical Collections
                        </h2>
                        <p className="text-gray-400 text-lg font-light tracking-wide">Find the perfect category for everyone on your list</p>
                    </FadeInUp>

                    <StaggerChildren className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 mb-12">
                        {displayedCategories.map((cat) => (
                            <StaggerItem key={cat.id}>
                                <Link to={`/shop?category=${cat.slug}`}>
                                    <HoverCard className="h-[200px] rounded-xl overflow-hidden shadow-lg border border-white/10 group hover:border-white/40">
                                        <img
                                            src={cat.imageUrl}
                                            alt={cat.name}
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                                        <div className="absolute bottom-0 left-0 right-0 p-5 text-center">
                                            <div className="inline-block px-3 py-1 border border-white/50 rounded-full bg-black/40 backdrop-blur-md mb-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 duration-500">
                                                <span className="text-white text-[10px] font-bold tracking-widest">EXPLORE</span>
                                            </div>
                                            <h3 className="text-lg font-medium text-gray-200 group-hover:text-white transition-colors">{cat.name}</h3>
                                        </div>
                                    </HoverCard>
                                </Link>
                            </StaggerItem>
                        ))}
                    </StaggerChildren>

                    {categories.length > visibleCategories && (
                        <div className="text-center mt-12 relative z-50">
                            <button
                                onClick={handleShowMoreCategories}
                                className="relative z-50 inline-block px-10 py-3 rounded-full border border-white/30 text-white hover:bg-white hover:text-black transition-all duration-300 font-medium text-sm tracking-widest uppercase cursor-pointer backdrop-blur-sm bg-black/30"
                            >
                                Show More Collections
                            </button>
                        </div>
                    )}
                </div>
            </section>

            <style>{`
                @keyframes aurora {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-aurora {
                    animation: aurora 20s ease infinite;
                }
                @keyframes snow {
                    0% { transform: translateY(0) rotate(0deg); opacity: 0; }
                    20% { opacity: 1; }
                    100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
                }
                .animate-snow {
                    animation-name: snow;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                }
            `}</style>
        </div>
    );
};
