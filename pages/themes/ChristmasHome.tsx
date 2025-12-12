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
    const [visibleTrendingCount, setVisibleTrendingCount] = useState(8);
    const [showAllCategories, setShowAllCategories] = useState(false);

    // State to track expanded product titles
    const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set());

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
        setVisibleTrendingCount(prev => prev + 10);
    };

    const handleShowLessTrending = () => {
        setVisibleTrendingCount(8);
    };

    const handleShowMoreCategories = () => {
        setShowAllCategories(true);
    };

    const toggleProductTitle = (e: React.MouseEvent, id: string) => {
        e.preventDefault(); // Prevent navigation if clicking the title
        e.stopPropagation();
        setExpandedProductIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const displayedTrending = bestSellers.slice(0, visibleTrendingCount);
    const displayedCategories = showAllCategories ? categories : categories.slice(0, 8);

    return (
        <div className="min-h-screen overflow-x-hidden font-serif bg-gradient-to-b from-white via-slate-50 to-white text-[#8B0000]">
            {/* --- Dynamic Snowfall Effect (Darker snow for visibility on white) --- */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                {[...Array(50)].map((_, i) => (
                    <div key={i} className="absolute rounded-full bg-slate-200 opacity-60 animate-snow" style={{
                        left: `${Math.random() * 100}%`,
                        top: `-${Math.random() * 20}%`,
                        width: `${Math.random() * 4 + 2}px`,
                        height: `${Math.random() * 4 + 2}px`,
                        animationDuration: `${Math.random() * 5 + 5}s`,
                        animationDelay: `${Math.random() * 5}s`,
                        filter: 'blur(0.5px)',
                    }} />
                ))}
            </div>

            {/* --- Flying Reindeer Animation (CSS) --- */}
            <div className="fixed top-20 -left-40 z-0 animate-fly-santa opacity-80 pointer-events-none">
                <img src="https://cdn-icons-png.flaticon.com/512/7626/7626666.png" alt="Santa Sleigh" className="w-24 md:w-48 filter drop-shadow-[0_0_5px_rgba(0,0,0,0.1)]" />
            </div>

            {/* --- Hero Section --- */}
            <div className="h-[50vh] md:h-[60vh] flex items-center justify-center relative overflow-hidden">
                {/* Background Image with Gradient */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://www.shutterstock.com/image-photo/christmas-theme-vibrant-red-background-600nw-2558270819.jpg"
                        alt="Christmas Background"
                        className="w-full h-full object-cover opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white"></div>
                </div>

                <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
                    <FadeInUp delay={0.2}>
                        <div className="flex flex-wrap justify-center gap-x-3 md:gap-x-6 mb-4">
                            <h1 className="text-4xl md:text-8xl font-bold drop-shadow-[0_0_25px_rgba(255,215,0,0.8)]" style={{
                                fontFamily: '"Mountains of Christmas", cursive',
                                color: '#FFD700',
                                textShadow: '0 0 20px #FF4500, 0 0 40px #FFD700'
                            }}>
                                <TextReveal text="Merry" />
                            </h1>
                            <h1 className="text-4xl md:text-8xl font-bold drop-shadow-[0_0_25px_rgba(255,215,0,0.8)]" style={{
                                fontFamily: '"Mountains of Christmas", cursive',
                                color: '#FFD700',
                                textShadow: '0 0 20px #FF4500, 0 0 40px #FFD700'
                            }}>
                                <TextReveal text="Christmas" />
                            </h1>
                        </div>
                    </FadeInUp>

                    <FadeInUp delay={0.8}>
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <div className="h-[2px] w-16 bg-[#FFD700] shadow-[0_0_15px_#FFD700]"></div>
                            <p className="text-sm md:text-xl font-bold tracking-[0.3em] text-[#FFD700] uppercase drop-shadow-[0_0_15px_rgba(255,69,0,0.8)]">
                                Season of Wonder
                            </p>
                            <div className="h-[2px] w-16 bg-[#FFD700] shadow-[0_0_15px_#FFD700]"></div>
                        </div>
                    </FadeInUp>

                    <FadeInUp delay={1.2} className="flex justify-center">
                        <MagneticButton>
                            <Link
                                to="/shop?category=christmas"
                                className="group relative inline-flex items-center gap-2 px-8 py-3 rounded-full font-bold text-base transition-all shadow-lg hover:shadow-xl hover:scale-105"
                                style={{
                                    background: 'linear-gradient(135deg, #FFFFFF 0%, #F0F0F0 100%)',
                                    color: '#8B0000',
                                }}
                            >
                                <span className="relative z-10">Shop Now</span>
                                <Icons.ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </MagneticButton>
                    </FadeInUp>
                </div>
            </div>

            {/* --- Santa's Choice Section --- */}
            <section className="py-8 relative z-10">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="relative rounded-[2rem] overflow-hidden bg-white shadow-xl border border-red-100 p-1.5">
                        <div className="grid md:grid-cols-2 gap-0 items-center bg-red-50 rounded-[1.5rem] overflow-hidden">
                            <FadeInUp className="relative h-[300px] md:h-[400px] overflow-hidden group">
                                <img
                                    src="https://hips.hearstapps.com/hmg-prod/images/christmas-themes-1571330675.jpg?crop=0.784xw:1.00xh;0.109xw,0&resize=1200:*"
                                    alt="Santa giving gifts"
                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-red-900/40 via-transparent to-transparent"></div>
                            </FadeInUp>

                            <FadeInUp delay={0.3} className="p-8 text-center md:text-left">
                                <div className="inline-block px-4 py-1.5 rounded-full bg-[#8B0000] text-white text-xs font-black tracking-widest mb-4 shadow-md">
                                    SANTA'S PICK
                                </div>
                                <h2 className="text-3xl md:text-5xl font-bold mb-4 text-[#8B0000]" style={{ fontFamily: '"Mountains of Christmas", cursive' }}>
                                    Magic in Every Box
                                </h2>
                                <p className="text-gray-600 text-base md:text-lg mb-8 leading-relaxed font-medium">
                                    "The best way to spread Christmas cheer is singing loud for all to hear... and giving the perfect gift!"
                                </p>
                                <Link
                                    to="/shop"
                                    className="inline-block border-b-2 border-[#8B0000] text-[#8B0000] font-bold text-lg pb-1 hover:text-[#A52A2A] hover:border-[#A52A2A] transition-all hover:scale-105"
                                >
                                    View Collection
                                </Link>
                            </FadeInUp>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Best Sellers --- */}
            {bestSellers.length > 0 && (
                <section className="py-10 relative z-10">
                    <div className="max-w-7xl mx-auto px-4">
                        <FadeInUp className="flex items-center justify-center gap-4 mb-8">
                            <div className="h-[2px] w-16 bg-[#8B0000]/20"></div>
                            <h2 className="text-4xl md:text-5xl font-bold text-[#8B0000]" style={{ fontFamily: '"Mountains of Christmas", cursive' }}>
                                Trending Gifts
                            </h2>
                            <div className="h-[2px] w-16 bg-[#8B0000]/20"></div>
                        </FadeInUp>

                        <StaggerChildren key={visibleTrendingCount} className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
                            {displayedTrending.map((product) => (
                                <StaggerItem key={product.id}>
                                    <Link to={`/product/${product.slug}`}>
                                        <div className="group relative rounded-2xl overflow-hidden bg-white border border-red-100 hover:border-[#8B0000] hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                                            {/* Gift Tag Badge */}
                                            <div className="absolute top-3 right-3 z-10 bg-[#FF0000] text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md">
                                                HOT ITEM
                                            </div>

                                            <div className="aspect-[3/4] overflow-hidden relative">
                                                <img
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                            </div>
                                            <div className="p-4 text-center">
                                                <div className="cursor-pointer">
                                                    <h3 className="font-bold text-[#8B0000] text-sm mb-1 transition-all group-hover:text-[#A52A2A]">
                                                        {product.name}
                                                    </h3>
                                                </div>
                                                <p className="text-[#B8860B] font-black text-lg">₹{product.sale_price || product.price}</p>
                                            </div>
                                        </div>
                                    </Link>
                                </StaggerItem>
                            ))}
                        </StaggerChildren>

                        {bestSellers.length > 8 && (
                            <FadeInUp className="text-center">
                                {visibleTrendingCount < bestSellers.length ? (
                                    <button
                                        onClick={handleShowMoreTrending}
                                        className="inline-block px-8 py-3 rounded-full bg-[#8B0000] text-white hover:bg-[#A52A2A] transition-all duration-300 font-bold text-base shadow-lg hover:shadow-xl hover:scale-105"
                                    >
                                        Show More Gifts
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleShowLessTrending}
                                        className="inline-block px-8 py-3 rounded-full bg-white text-[#8B0000] border-2 border-[#8B0000] hover:bg-red-50 transition-all duration-300 font-bold text-base shadow-lg hover:shadow-xl hover:scale-105"
                                    >
                                        Show Less
                                    </button>
                                )}
                            </FadeInUp>
                        )}
                    </div>
                </section>
            )}

            {/* --- Decorative Banner (New Image) --- */}
            <ParallaxSection className="h-[30vh] md:h-[40vh] relative overflow-hidden my-8">
                <div className="absolute inset-0">
                    <img
                        src="https://media.istockphoto.com/id/1285529790/photo/new-year-theme-with-spruce-twigs-and-berries-with-copy-space.jpg?s=612x612&w=0&k=20&c=tKq_TdEPUg6J4aFpSYDveQikVQfamgkMS_OIoFg6SuY="
                        alt="Christmas Decorations"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-white/10"></div>
                </div>
                <div className="relative z-10 h-full flex items-center justify-center text-center px-4">
                    <FadeInUp>
                        <h2 className="text-4xl md:text-6xl font-bold text-[#8B0000] drop-shadow-lg" style={{ fontFamily: '"Mountains of Christmas", cursive' }}>
                            Spread the Joy
                        </h2>
                    </FadeInUp>
                </div>
            </ParallaxSection>

            {/* --- Curated Collections --- */}
            <section className="py-8 pb-20 relative z-10">
                <div className="max-w-7xl mx-auto px-4">
                    <FadeInUp className="text-center mb-12">
                        <h2 className="text-4xl md:text-5xl font-bold text-[#8B0000] mb-3" style={{ fontFamily: '"Mountains of Christmas", cursive' }}>
                            Magical Collections
                        </h2>
                        <p className="text-gray-600 text-base font-medium tracking-wide">Find the perfect category for everyone on your list</p>
                    </FadeInUp>

                    <StaggerChildren key={showAllCategories ? 'all' : 'limited'} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
                        {displayedCategories.map((cat) => (
                            <StaggerItem key={cat.id}>
                                <Link to={`/shop?category=${cat.slug}`}>
                                    <HoverCard className="h-[180px] rounded-2xl overflow-hidden shadow-lg border border-red-100 group hover:border-[#8B0000]">
                                        <img
                                            src={cat.imageUrl}
                                            alt={cat.name}
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-90 group-hover:opacity-80 transition-opacity"></div>
                                        <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                                            <div className="inline-block px-3 py-1 border-2 border-white rounded-full bg-white/20 backdrop-blur-md mb-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 duration-500">
                                                <span className="text-white text-[10px] font-black tracking-widest uppercase drop-shadow-md">Explore</span>
                                            </div>
                                            <h3 className="text-lg font-bold !text-white group-hover:text-[#FFD700] transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{cat.name}</h3>
                                        </div>
                                    </HoverCard>
                                </Link>
                            </StaggerItem>
                        ))}
                    </StaggerChildren>

                    {!showAllCategories && categories.length > 8 && (
                        <FadeInUp className="text-center">
                            <button
                                onClick={handleShowMoreCategories}
                                className="inline-block px-8 py-3 rounded-full bg-[#8B0000] text-white hover:bg-[#A52A2A] transition-all duration-300 font-bold text-base shadow-lg hover:shadow-xl hover:scale-105"
                            >
                                Show All Collections
                            </button>
                        </FadeInUp>
                    )}
                </div>
            </section>

            <style>{`
                @keyframes snow {
                    0% { transform: translateY(0) rotate(0deg); opacity: 0; }
                    20% { opacity: 1; }
                    100% { transform: translateY(100vh) rotate(360deg); opacity: 0.2; }
                }
                .animate-snow {
                    animation-name: snow;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                }
                @keyframes fly-santa {
                    0% { transform: translate(0, 0) rotate(5deg); }
                    100% { transform: translate(120vw, -20vh) rotate(-5deg); }
                }
                .animate-fly-santa {
                    animation: fly-santa 20s linear infinite;
                }
            `}</style>
        </div>
    );
};
