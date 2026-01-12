
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../components/ui/Icons';
import { store } from '../services/store';
import { useCart } from '../contexts/CartContext';
import { Product } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { CustomAlert, useCustomAlert } from '../components/CustomAlert';
import { Toast } from '../components/Toast';
import { calculatePointsEarned } from '../utils/rewards';
import { AuthRequiredModal } from '../components/AuthRequiredModal';
import { ReviewForm } from '../components/ReviewForm';
import { ReviewsList } from '../components/ReviewsList';

export const ProductDetail = () => {
    const { slug } = useParams<{ slug: string }>();

    // Guest Lead State
    // Auth Modal State
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { user } = useAuth();
    const { alertState, showAlert, closeAlert } = useCustomAlert();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string>('');
    const [reviewsRefreshKey, setReviewsRefreshKey] = useState(0);
    const [direction, setDirection] = useState(0);
    const [isAdding, setIsAdding] = useState(false);
    const [hasBeenAdded, setHasBeenAdded] = useState(false);
    const [showFullScreen, setShowFullScreen] = useState(false);
    const [isBuying, setIsBuying] = useState(false);

    // Variant State
    const [selectedColor, setSelectedColor] = useState<string>('');
    const [selectedSize, setSelectedSize] = useState<string>('');
    const [currentStock, setCurrentStock] = useState<number>(0);
    const [linkedVariants, setLinkedVariants] = useState<Product[]>([]);

    // Touch/Swipe State
    const [touchStart, setTouchStart] = useState<number>(0);
    const [touchEnd, setTouchEnd] = useState<number>(0);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        const fetchProduct = async () => {
            if (!slug) return;
            try {
                setLoading(true);
                const data = await store.getProductBySlug(slug);
                if (data) {
                    setProduct(data);

                    // Fetch Linked Variants if group ID exists
                    if (data.colorVariantGroup) {
                        try {
                            const variants = await store.getProductsByVariantGroup(data.colorVariantGroup);
                            // Filter out current product and ensure unique colors
                            const otherVariants = variants.filter(v => v.id !== data.id);
                            setLinkedVariants(otherVariants);
                        } catch (err) {
                            console.error("Failed to fetch linked variants", err);
                        }
                    }

                    // Initialize Variants (Legacy + New System)
                    if (data.color) {
                        setSelectedColor(data.color);
                    }

                    if (data.variants && data.variants.length > 0) {
                        const uniqueColors = Array.from(new Set(data.variants.map(v => v.color).filter(Boolean)));
                        if (uniqueColors.length > 0) {
                            const defaultColor = uniqueColors[0];
                            if (!data.color) setSelectedColor(defaultColor);

                            // Set initial image based on color
                            const variantWithImage = data.variants.find(v => v.color === defaultColor && v.images && v.images.length > 0);
                            if (variantWithImage) {
                                setSelectedImage(variantWithImage.images[0]);
                            } else {
                                setSelectedImage(data.imageUrl);
                            }

                            // Set available sizes for default color
                            const sizes = data.variants
                                .filter(v => v.color === defaultColor)
                                .map(v => v.size)
                                .filter(Boolean);

                            // Auto-select first size if available
                            if (sizes.length > 0) {
                                setSelectedSize(sizes[0]);
                                const variant = data.variants.find(v => v.color === defaultColor && v.size === sizes[0]);
                                setCurrentStock(variant ? variant.stock_quantity : 0);
                            } else {
                                // If no sizes (color only), set stock based on color variant
                                const variant = data.variants.find(v => v.color === defaultColor);
                                setCurrentStock(variant ? variant.stock_quantity : 0);
                            }
                        } else {
                            // No colors, maybe just sizes?
                            const uniqueSizes = Array.from(new Set(data.variants.map(v => v.size).filter(Boolean)));
                            if (uniqueSizes.length > 0) {
                                setSelectedSize(uniqueSizes[0]);
                                const variant = data.variants.find(v => v.size === uniqueSizes[0]);
                                setCurrentStock(variant ? variant.stock_quantity : 0);
                            }
                        }
                    } else {
                        setSelectedImage(data.imageUrl);
                        setCurrentStock(data.stock || 0);
                    }
                } else {
                    navigate('/shop');
                }
            } catch (error) {
                console.error('Failed to fetch product:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [slug, navigate]);

    // Update stock when selection changes
    useEffect(() => {
        if (!product || !product.variants || product.variants.length === 0) return;

        let variant;
        if (selectedColor && selectedSize) {
            variant = product.variants.find(v => v.color === selectedColor && v.size === selectedSize);
        } else if (selectedColor) {
            variant = product.variants.find(v => v.color === selectedColor);
        } else if (selectedSize) {
            variant = product.variants.find(v => v.size === selectedSize);
        }

        if (variant) {
            setCurrentStock(variant.stock_quantity);
        }
    }, [selectedColor, selectedSize, product]);

    // Reset "Added" state after 1 second
    useEffect(() => {
        if (hasBeenAdded) {
            const timer = setTimeout(() => {
                setHasBeenAdded(false);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [hasBeenAdded]);

    const handleColorSelect = (color: string) => {
        if (!product || !product.variants) return;
        setSelectedColor(color);

        // Update images
        const variantWithImage = product.variants.find(v => v.color === color && v.images && v.images.length > 0);
        if (variantWithImage) {
            setSelectedImage(variantWithImage.images[0]);
        }

        // Update available sizes
        const sizes = product.variants
            .filter(v => v.color === color)
            .map(v => v.size)
            .filter(Boolean);

        // Reset size if current selection not available
        if (selectedSize && !sizes.includes(selectedSize)) {
            setSelectedSize(sizes.length > 0 ? sizes[0] : '');
        } else if (!selectedSize && sizes.length > 0) {
            setSelectedSize(sizes[0]);
        }
    };

    const handleAddToCart = async () => {
        // Guest User Logic
        // Auth Check
        if (!user) {
            setIsAuthModalOpen(true);
            return;
        }

        if (!product || isAdding) return;

        setIsAdding(true);

        const cartItem = {
            ...product,
            selectedColor,
            selectedSize,
            selectedVariantId: product.variants?.find(v =>
                (selectedColor ? v.color === selectedColor : true) &&
                (selectedSize ? v.size === selectedSize : true)
            )?.id
        };

        addToCart(cartItem, false); // Don't open cart
        setToastMessage(`${product.name} added to cart!`);
        setShowToast(true);
        setHasBeenAdded(true);
        setIsAdding(false);
    };

    const handleBuyNow = () => {
        if (!user) {
            setIsAuthModalOpen(true);
            return;
        }

        if (!product) return;

        const cartItem: Product = {
            ...product,
            selectedColor: selectedColor || undefined,
            selectedSize: selectedSize || undefined,
        };

        addToCart(cartItem, false);
        navigate('/checkout');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background relative">
                <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    <p className="text-textMain font-black tracking-widest uppercase text-xs animate-pulse">Loading Product...</p>
                </div>
            </div>
        );
    }

    if (!product) return null;

    const isOutOfStock = currentStock <= 0;
    const discountPercentage = product.marketPrice && product.marketPrice > product.price
        ? Math.round(((product.marketPrice - product.price) / product.marketPrice) * 100)
        : 0;

    // Derived state for UI
    const uniqueColors = product.variants ? Array.from(new Set(product.variants.map(v => v.color).filter(Boolean))) : [];
    const availableSizes = product.variants ? Array.from(new Set(product.variants.map(v => v.size).filter(Boolean))) : [];
    const hasVariants = product.variants && product.variants.length > 0;

    // Update images array based on selection if variants have specific images
    let displayImages: string[] = [];

    // If a color is selected and variants exist, show ONLY that color's images
    if (selectedColor && product.variants && product.variants.length > 0) {
        const variantImages = Array.from(new Set(
            product.variants
                .filter(v => v.color === selectedColor)
                .flatMap(v => v.images || [])
                .filter(Boolean)
        )) as string[];
        if (variantImages.length > 0) {
            displayImages = variantImages;
        } else {
            // Fallback to product main image if color variant has no images
            displayImages = [product.imageUrl];
        }
    } else {
        // No color selected or no variants - use product-level images
        displayImages = product.images && product.images.length > 0 ? product.images : [product.imageUrl];
    }

    const images = displayImages;

    return (
        <>
            <div className="min-h-screen bg-background text-textMain relative overflow-x-hidden font-sans">
                <div className="max-w-7xl mx-auto px-3 py-4 md:py-8 relative z-10">
                    {/* Mobile Back Button - Redesigned for Space */}
                    <div className="lg:hidden fixed top-3 left-3 z-50">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2.5 bg-white/80 backdrop-blur-md rounded-full text-textMain border border-textMain/10 shadow-xl active:scale-90 transition-all hover:bg-white"
                        >
                            <Icons.ChevronLeft className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="max-w-[1440px] mx-auto pt-0 lg:pt-6 px-1.5 lg:px-8">
                        {/* Product Header - Above Image & Info */}
                        <div className="px-3 lg:px-0 mb-4">
                            <div className="mb-2">
                                <span className="inline-flex items-center gap-1.5 bg-primary/5 border border-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                                    <Icons.Sparkles className="w-3 h-3" />
                                    {product.category.replace('-', ' ')}
                                </span>
                            </div>
                            <h1 className="font-serif text-lg lg:text-3xl font-black text-textMain mb-1 uppercase tracking-wider leading-[1.1]">
                                {product.name}
                            </h1>
                            <div className="h-1 w-16 bg-primary rounded-full mt-2"></div>
                        </div>

                        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-0 lg:gap-12">
                            {/* Image Section - Left Side */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="relative group lg:sticky lg:top-24 h-[50vh] sm:h-[60vh] lg:h-[70vh]"
                            >
                                {/* Main Display Image */}
                                <div className="w-full h-full relative overflow-hidden bg-white/40 backdrop-blur-sm lg:rounded-2xl border-b lg:border border-textMain/5 shadow-sm">
                                    {images.length > 1 ? (
                                        <div
                                            className="relative w-full h-full"
                                            onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
                                            onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
                                            onTouchEnd={() => {
                                                if (touchStart - touchEnd > 75) {
                                                    const currentIndex = images.indexOf(selectedImage);
                                                    const nextIndex = (currentIndex + 1) % images.length;
                                                    setDirection(1);
                                                    setSelectedImage(images[nextIndex]);
                                                }
                                                if (touchStart - touchEnd < -75) {
                                                    const currentIndex = images.indexOf(selectedImage);
                                                    const prevIndex = (currentIndex - 1 + images.length) % images.length;
                                                    setDirection(-1);
                                                    setSelectedImage(images[prevIndex]);
                                                }
                                            }}
                                        >
                                            <AnimatePresence mode="wait" initial={false} custom={direction}>
                                                <motion.img
                                                    key={selectedImage || images[0]}
                                                    src={selectedImage || (images.length > 0 ? images[0] : '')}
                                                    custom={direction}
                                                    variants={{
                                                        enter: (direction: number) => ({
                                                            x: direction > 0 ? 300 : -300,
                                                            opacity: 0
                                                        }),
                                                        center: {
                                                            zIndex: 1,
                                                            x: 0,
                                                            opacity: 1
                                                        },
                                                        exit: (direction: number) => ({
                                                            zIndex: 0,
                                                            x: direction < 0 ? 300 : -300,
                                                            opacity: 0
                                                        })
                                                    }}
                                                    initial="enter"
                                                    animate="center"
                                                    exit="exit"
                                                    transition={{
                                                        x: { type: "spring", stiffness: 300, damping: 30 },
                                                        opacity: { duration: 0.2 }
                                                    }}
                                                    alt={product.name}
                                                    className="w-full h-full object-contain p-2 lg:p-4 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] cursor-pointer"
                                                    onClick={() => setShowFullScreen(true)}
                                                />
                                            </AnimatePresence>

                                            {discountPercentage > 0 && (
                                                <motion.div
                                                    initial={{ x: -100 }}
                                                    animate={{ x: 0 }}
                                                    className="absolute top-4 left-4 bg-primary text-white px-3 py-1.5 rounded-full text-[10px] font-black shadow-lg flex items-center gap-1.5 z-10"
                                                >
                                                    <Icons.Zap className="w-3 h-3" />
                                                    {discountPercentage}% LUXE OFFER
                                                </motion.div>
                                            )}
                                        </div>
                                    ) : (
                                        // Single image fallback
                                        <div className="relative w-full h-full">
                                            <img
                                                src={selectedImage || (images.length > 0 ? images[0] : '')}
                                                alt={product.name}
                                                className="w-full h-full object-contain p-2 lg:p-4 drop-shadow-2xl cursor-pointer"
                                                onClick={() => setShowFullScreen(true)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Product Info - Right Side */}
                            <div className="flex flex-col p-4 lg:p-0">

                                {/* Price Section */}
                                <div className="bg-white/80 backdrop-blur-md rounded-xl p-5 mb-4 border border-textMain/5 shadow-xl">
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-2xl lg:text-4xl font-black text-green-600" style={{ fontFamily: 'Arial, sans-serif' }}>
                                            &#8377;{product.price.toLocaleString()}
                                        </span>
                                        {product.marketPrice && product.marketPrice > product.price && (
                                            <>
                                                <span className="text-sm sm:text-lg text-gray-400 line-through" style={{ fontFamily: 'Arial, sans-serif' }}>
                                                    &#8377;{product.marketPrice.toLocaleString()}
                                                </span>
                                                <span className="bg-green-50 text-green-600 border border-green-100 px-2 py-0.5 rounded-full text-xs font-bold" style={{ fontFamily: 'Arial, sans-serif' }}>
                                                    Save &#8377;{(product.marketPrice - product.price).toLocaleString()}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Rewards Badge */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.55 }}
                                    className="mb-4 flex items-center gap-2"
                                >
                                    <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-900 font-bold text-sm flex items-center gap-1.5 shadow-sm">
                                        <Icons.Star className="w-4 h-4 fill-current" />
                                        <span>Earn {calculatePointsEarned(product.price)} Points</span>
                                    </div>
                                    <span className="text-xs text-gray-500 font-medium">with this purchase</span>
                                </motion.div>

                                {/* Description */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                    className="mb-3 sm:mb-6"
                                >
                                    <h3 className="text-sm sm:text-base font-black text-textMain mb-2 flex items-center gap-2 uppercase tracking-widest">
                                        <Icons.Package className="w-4 h-4 text-primary" />
                                        Product Information
                                    </h3>
                                    <div className="text-gray-600 leading-relaxed text-xs sm:text-sm space-y-3">
                                        {product.description.split('\n').filter(para => para.trim()).map((paragraph, index) => (
                                            <p key={index}>{paragraph}</p>
                                        ))}
                                    </div>
                                </motion.div>

                                {/* Features Grid */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.7 }}
                                    className="grid grid-cols-2 gap-1.5 sm:gap-3 mb-3 sm:mb-6"
                                >
                                    <div className="flex items-center gap-1.5 sm:gap-3 p-2 sm:p-3 bg-white rounded-lg border border-textMain/5 shadow-sm transition-shadow">
                                        <div className={`p-2 rounded-full shadow-sm ${isOutOfStock ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                                            {isOutOfStock ? <Icons.X className="w-3 h-3 sm:w-4 sm:h-4" /> : <Icons.Check className="w-3 h-3 sm:w-4 sm:h-4" />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-xs sm:text-sm text-textMain">
                                                {isOutOfStock ? 'Out of Stock' : 'In Stock'}
                                            </span>
                                            {currentStock > 0 && currentStock < 10 && (
                                                <span className="text-[10px] sm:text-xs text-primary font-black">Only {currentStock} Left</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-white rounded-lg border border-textMain/5 shadow-sm transition-shadow">
                                        <div className="p-2 bg-blue-50 rounded-full text-blue-500 shadow-sm">
                                            <Icons.Truck className="w-3 h-3 sm:w-4 sm:h-4" />
                                        </div>
                                        <span className="font-bold text-xs sm:text-sm text-textMain">Free Delivery</span>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-white rounded-lg border border-textMain/5 shadow-sm transition-shadow">
                                        <div className="p-2 bg-purple-50 rounded-full text-purple-500 shadow-sm">
                                            <Icons.Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                                        </div>
                                        <span className="font-bold text-xs sm:text-sm text-textMain">Secure Payment</span>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-white rounded-lg border border-textMain/5 shadow-sm transition-shadow">
                                        <div className="p-2 bg-primary/10 rounded-full text-primary shadow-sm">
                                            <Icons.Gift className="w-3 h-3 sm:w-4 sm:h-4" />
                                        </div>
                                        <span className="font-bold text-xs sm:text-sm text-textMain">Gift Wrapping</span>
                                    </div>
                                </motion.div>

                                {/* Variant Selectors */}
                                {hasVariants && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.75 }}
                                        className="mb-3 sm:mb-6 space-y-3 sm:space-y-4"
                                    >
                                        {/* Colors (Linked Products + Internal Variants) */}
                                        {(linkedVariants.length > 0 || uniqueColors.length > 0) && (
                                            <div>
                                                <div className="flex justify-between items-center mb-2 sm:mb-3">
                                                    <h3 className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-widest">Select Color</h3>
                                                    <span className="text-xs sm:text-sm text-primary font-black uppercase tracking-tighter">{selectedColor || product.color}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {/* Current Product Swatch (if it has a color) */}
                                                    {product.color && (
                                                        <button
                                                            className="relative w-16 h-20 rounded-xl border-2 border-gray-900 shadow-md transition-all overflow-hidden"
                                                            title={product.color}
                                                        >
                                                            <img
                                                                src={product.imageUrl}
                                                                alt={product.color}
                                                                loading="lazy"
                                                                decoding="async"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </button>
                                                    )}

                                                    {/* Linked Variants Swatches */}
                                                    {linkedVariants.map(variant => (
                                                        <button
                                                            key={variant.id}
                                                            onClick={() => navigate(`/product/${variant.slug}`)}
                                                            className="relative w-16 h-20 rounded-xl border-2 border-gray-200 hover:border-gray-300 cursor-pointer transition-all overflow-hidden"
                                                            title={variant.color}
                                                        >
                                                            <img
                                                                src={variant.imageUrl}
                                                                alt={variant.color}
                                                                loading="lazy"
                                                                decoding="async"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </button>
                                                    ))}

                                                    {/* Legacy Internal Variants Swatches */}
                                                    {uniqueColors.map((color: string) => {
                                                        // Skip if this color is already handled by main product or linked variants
                                                        if (color === product.color || linkedVariants.some(v => v.color === color)) return null;

                                                        // Find the first variant with this color to get its image
                                                        const variant = product.variants?.find(v => v.color === color);
                                                        const colorImage = variant?.images?.[0] || product.imageUrl;

                                                        // Check if this color has any stock
                                                        const colorVariants = product.variants?.filter(v => v.color === color) || [];
                                                        const hasStock = colorVariants.some(v => v.stock_quantity > 0);

                                                        return (
                                                            <button
                                                                key={color}
                                                                onClick={() => hasStock && handleColorSelect(color)}
                                                                disabled={!hasStock}
                                                                className={`relative w-16 h-20 rounded-xl border-2 transition-all overflow-hidden ${!hasStock
                                                                    ? 'border-textMain/5 opacity-40 cursor-not-allowed grayscale'
                                                                    : selectedColor === color
                                                                        ? 'border-primary shadow-lg scale-105'
                                                                        : 'border-textMain/10 hover:border-textMain/30 cursor-pointer'
                                                                    }`}
                                                                title={!hasStock ? `${color} - Out of Stock` : color}
                                                            >
                                                                <img
                                                                    src={colorImage}
                                                                    alt={color}
                                                                    loading="lazy"
                                                                    decoding="async"
                                                                    className="w-full h-full object-cover"
                                                                />
                                                                {!hasStock && (
                                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                                        <span className="text-white text-[8px] font-bold">OUT</span>
                                                                    </div>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Sizes */}
                                        {availableSizes.length > 0 && (
                                            <div>
                                                <div className="flex justify-between items-center mb-2 sm:mb-3">
                                                    <h3 className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-widest">Select Size</h3>
                                                    <button className="text-[10px] sm:text-xs text-blue-400 font-black uppercase tracking-widest hover:text-blue-300">
                                                        Size Guide
                                                    </button>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {availableSizes.map(size => {
                                                        // Check stock for this size with current color
                                                        let hasStock = false;
                                                        if (selectedColor) {
                                                            const variant = product.variants?.find(v => v.color === selectedColor && v.size === size);
                                                            hasStock = (variant?.stock_quantity || 0) > 0;
                                                        } else {
                                                            const variant = product.variants?.find(v => v.size === size);
                                                            hasStock = (variant?.stock_quantity || 0) > 0;
                                                        }

                                                        return (
                                                            <button
                                                                key={size}
                                                                onClick={() => hasStock && setSelectedSize(size)}
                                                                disabled={!hasStock}
                                                                className={`min-w-[3.5rem] h-12 px-4 rounded-xl border transition-all duration-300 font-bold text-sm flex items-center justify-center ${!hasStock
                                                                    ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                                                    : selectedSize === size
                                                                        ? 'bg-primary text-white border-primary shadow-lg scale-105 z-10'
                                                                        : 'bg-white border-textMain/10 text-textMain hover:border-primary hover:text-primary'
                                                                    }`}
                                                            >
                                                                <span>
                                                                    {size}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                                    {/* Add to Cart Button - White */}
                                    <button
                                        onClick={handleAddToCart}
                                        disabled={isOutOfStock || isAdding}
                                        className={`flex-1 py-4 px-6 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-500 border-2 ${isOutOfStock
                                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                            : hasBeenAdded
                                                ? 'bg-green-500 text-white border-green-500 shadow-lg'
                                                : 'bg-primary text-white border-primary hover:bg-primary/90 hover:shadow-xl active:scale-95'
                                            }`}
                                    >
                                        <AnimatePresence mode="wait">
                                            {isAdding ? (
                                                <motion.div
                                                    key="loading"
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    className="flex items-center gap-2"
                                                >
                                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-900"></div>
                                                    Adding...
                                                </motion.div>
                                            ) : hasBeenAdded ? (
                                                <motion.div
                                                    key="added"
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Icons.Check className="w-5 h-5" />
                                                    Added
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="default"
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Icons.ShoppingCart className="w-5 h-5" />
                                                    {isOutOfStock ? 'Out of Stock' : 'Add to cart'}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </button>

                                    {/* Buy Now Button - Yellow */}
                                    <button
                                        onClick={handleBuyNow}
                                        disabled={isOutOfStock || isBuying}
                                        className={`flex-1 py-4 px-6 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${isOutOfStock
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-yellow-400 text-gray-900 hover:bg-yellow-500 hover:shadow-lg active:scale-95'
                                            }`}
                                        style={{ backgroundColor: isOutOfStock ? undefined : '#FFC107' }}
                                    >
                                        {isBuying ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-900"></div>
                                                Buying...
                                            </>
                                        ) : (
                                            <>
                                                <span style={{ fontFamily: 'Arial, sans-serif' }} className="font-bold">
                                                    Buy at <span className="text-green-700">&#8377;{product.price.toLocaleString()}</span>
                                                </span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Labels & Reviews */}
                <div className="relative z-10">
                    {/* Reviews Section */}
                    <div className="bg-white/80 backdrop-blur-md py-16 px-4 sm:px-6 lg:px-8 mt-12 border-t border-textMain/5 shadow-2xl">
                        <div className="max-w-7xl mx-auto">
                            <h2 className="text-3xl font-serif font-black text-textMain mb-8 text-center uppercase tracking-widest">Customer Reviews</h2>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Review Form */}
                                <div className="lg:col-span-1">
                                    <ReviewForm productId={product.id} onReviewAdded={() => setReviewsRefreshKey(prev => prev + 1)} />
                                </div>

                                {/* Reviews List */}
                                <div className="lg:col-span-2">
                                    <ReviewsList productId={product.id} refreshTrigger={reviewsRefreshKey} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <AuthRequiredModal
                        isOpen={isAuthModalOpen}
                        onClose={() => setIsAuthModalOpen(false)}
                        message="Please login to add items to your cart or make a purchase."
                    />
                </div>
            </div>

            {/* Fullscreen Image Modal - Re-added */}
            <AnimatePresence>
                {showFullScreen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-lg flex items-center justify-center p-4"
                        onClick={() => setShowFullScreen(false)}
                    >
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={() => setShowFullScreen(false)}
                            className="absolute top-6 right-6 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 rounded-full transition-all border border-white/20"
                        >
                            <Icons.X className="w-6 h-6 text-white" />
                        </motion.button>

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: "spring", damping: 25 }}
                            className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={selectedImage}
                                alt={product?.name}
                                className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-lg"
                            />
                        </motion.div>

                        {/* Image navigation arrows for multiple images */}
                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const currentIndex = images.indexOf(selectedImage);
                                        const prevIndex = (currentIndex - 1 + images.length) % images.length;
                                        setSelectedImage(images[prevIndex]);
                                    }}
                                    className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-md p-4 rounded-full transition-all border border-white/20"
                                >
                                    <Icons.ChevronLeft className="w-6 h-6 text-white" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const currentIndex = images.indexOf(selectedImage);
                                        const nextIndex = (currentIndex + 1) % images.length;
                                        setSelectedImage(images[nextIndex]);
                                    }}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-md p-4 rounded-full transition-all border border-white/20"
                                >
                                    <Icons.ChevronRight className="w-6 h-6 text-white" />
                                </button>

                                {/* Image counter */}
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                                    <span className="text-white text-sm font-bold">
                                        {images.indexOf(selectedImage) + 1} / {images.length}
                                    </span>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

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

            {/* Toast Notification */}
            <Toast
                message={toastMessage}
                isVisible={showToast}
                onClose={() => setShowToast(false)}
                type="success"
            />
        </>
    );
};
