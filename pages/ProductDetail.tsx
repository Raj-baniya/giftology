import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../components/ui/Icons';
import { store } from '../services/store';
import { useCart } from '../contexts/CartContext';
import { Product } from '../types';
import { LightRays } from '../components/ui/LightRays';
import { useAuth } from '../contexts/AuthContext';
import { CustomAlert, useCustomAlert } from '../components/CustomAlert';
import { Toast } from '../components/Toast';
import { calculatePointsForPrice } from '../utils/rewardUtils';

export const ProductDetail = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { addToCart, cartCount } = useCart();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string>('');
    const [isAdding, setIsAdding] = useState(false);
    const [hasBeenAdded, setHasBeenAdded] = useState(false);
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
        if (!product) return;

        const cartItem: Product = {
            ...product,
            selectedColor: selectedColor || undefined,
            selectedSize: selectedSize || undefined,
        };

        addToCart(cartItem, false);
        navigate('/checkout');
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: product?.name,
                    text: product?.description,
                    url: window.location.href,
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            alert('Link copied to clipboard!');
            navigator.clipboard.writeText(window.location.href);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-purple-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-rose-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading amazing gift...</p>
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
            {/* Light Rays Background */}
            <LightRays />

            <div className="min-h-screen pt-0 sm:pt-20 pb-3 sm:pb-16">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 md:pt-0">
                    {/* Desktop Back Button */}
                    <motion.button
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => navigate(-1)}
                        className="hidden md:inline-flex items-center gap-1.5 sm:gap-2 bg-white hover:bg-gradient-to-r hover:from-rose-50 hover:to-purple-50 text-gray-700 hover:text-rose-600 px-3 sm:px-6 py-1.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold shadow-md hover:shadow-xl border border-gray-100 hover:border-rose-200 transition-all duration-300 group mb-1.5 sm:mb-8 text-sm sm:text-base"
                    >
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-100 group-hover:bg-rose-100 flex items-center justify-center transition-colors">
                            <Icons.ChevronLeft className="w-3.5 h-3.5 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
                        </div>
                        <span className="hidden xs:inline">Back to Shop</span>
                    </motion.button>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-8 lg:gap-12">
                        {/* Image Gallery - Left Side */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="relative"
                        >
                            {/* Stacked Image Gallery */}
                            <div
                                className="relative h-[260px] sm:h-[450px] lg:h-[600px] flex items-center justify-center pt-0 sm:pt-8"
                                onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
                                onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
                                onTouchEnd={() => {
                                    if (touchStart - touchEnd > 75) {
                                        // Swiped left - next image
                                        const currentIndex = images.indexOf(selectedImage);
                                        const nextIndex = (currentIndex + 1) % images.length;
                                        setSelectedImage(images[nextIndex]);
                                    }
                                    if (touchStart - touchEnd < -75) {
                                        // Swiped right - previous image
                                        const currentIndex = images.indexOf(selectedImage);
                                        const prevIndex = (currentIndex - 1 + images.length) % images.length;
                                        setSelectedImage(images[prevIndex]);
                                    }
                                }}
                            >
                                {/* Decorative gradient blob */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-rose-200/30 to-purple-200/30 rounded-full blur-3xl -z-0"></div>

                                {images.length > 1 ? (
                                    <div className="relative w-full h-full group">
                                        {/* Stacked Cards */}
                                        {images.map((img, index) => {
                                            const isSelected = selectedImage === img;
                                            const totalImages = images.length;
                                            const reverseIndex = totalImages - 1 - index;

                                            const handleCardClick = () => {
                                                // Find current index and go to next
                                                const currentIndex = images.indexOf(selectedImage);
                                                const nextIndex = (currentIndex + 1) % images.length;
                                                setSelectedImage(images[nextIndex]);
                                            };

                                            return (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{
                                                        opacity: 1,
                                                        scale: isSelected ? 1 : 0.95 - (reverseIndex * 0.05),
                                                        y: isSelected ? 0 : reverseIndex * -15,
                                                        x: isSelected ? 0 : reverseIndex * 10,
                                                        zIndex: isSelected ? 50 : totalImages - index,
                                                        rotateZ: isSelected ? 0 : reverseIndex * -2,
                                                    }}
                                                    transition={{
                                                        type: "spring",
                                                        stiffness: 300,
                                                        damping: 30,
                                                    }}
                                                    onClick={handleCardClick}
                                                    className={`absolute inset-0 cursor-pointer ${isSelected ? '' : 'hover:scale-[0.98] transition-transform'
                                                        }`}
                                                    style={{
                                                        transformOrigin: 'center center',
                                                    }}
                                                >
                                                    <div className={`relative w-full h-full bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden ${isSelected ? 'ring-2 sm:ring-4 ring-rose-400' : ''
                                                        }`}>
                                                        <img
                                                            src={img}
                                                            alt={`${product.name} ${index + 1}`}
                                                            className="w-full h-full object-contain p-4 hover:scale-105 transition-transform duration-500"
                                                        />

                                                        {/* Discount Badge - Only on first image */}
                                                        {index === 0 && discountPercentage > 0 && (
                                                            <motion.div
                                                                initial={{ scale: 0, rotate: -180 }}
                                                                animate={{ scale: 1, rotate: 0 }}
                                                                transition={{ delay: 0.4, type: "spring" }}
                                                                className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-gradient-to-br from-rose-500 to-rose-600 text-white px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold shadow-xl flex items-center gap-1 sm:gap-2 z-10"
                                                            >
                                                                <Icons.TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                                                                {discountPercentage}% OFF
                                                            </motion.div>
                                                        )}

                                                        {/* Trending Badge - Only on first image */}
                                                        {index === 0 && product.trending && (
                                                            <motion.div
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                transition={{ delay: 0.5, type: "spring" }}
                                                                className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-gradient-to-br from-orange-400 to-orange-500 text-white px-2.5 py-1 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold shadow-lg z-10"
                                                            >
                                                                🔥 TRENDING
                                                            </motion.div>
                                                        )}

                                                        {/* Image indicator */}
                                                        {!isSelected && (
                                                            <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                                                                {index + 1}/{totalImages}
                                                            </div>
                                                        )}

                                                        {/* Swipe hint for mobile, click hint for desktop */}
                                                        {isSelected && (
                                                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold backdrop-blur-sm flex items-center gap-1.5 sm:gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Icons.ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                                                <span className="hidden sm:inline">Click to see next</span>
                                                                <span className="sm:hidden">Swipe</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    // Single image fallback
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="relative w-full h-full"
                                    >
                                        <div className="relative w-full h-full bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden p-2 sm:p-4">
                                            <img
                                                src={selectedImage}
                                                alt={product.name}
                                                className="w-full h-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                                            />

                                            {discountPercentage > 0 && (
                                                <motion.div
                                                    initial={{ scale: 0, rotate: -180 }}
                                                    animate={{ scale: 1, rotate: 0 }}
                                                    transition={{ delay: 0.4, type: "spring" }}
                                                    className="absolute top-4 left-4 bg-gradient-to-br from-rose-500 to-rose-600 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-xl flex items-center gap-2"
                                                >
                                                    <Icons.TrendingUp className="w-4 h-4" />
                                                    {discountPercentage}% OFF
                                                </motion.div>
                                            )}

                                            {product.trending && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ delay: 0.5, type: "spring" }}
                                                    className="absolute top-4 right-4 bg-gradient-to-br from-orange-400 to-orange-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg"
                                                >
                                                    🔥 TRENDING
                                                </motion.div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Navigation Dots */}
                                {images.length > 1 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6 }}
                                        className="absolute -bottom-6 sm:-bottom-8 left-1/2 transform -translate-x-1/2 flex gap-1.5 sm:gap-2 bg-white/80 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-3 rounded-full shadow-lg"
                                    >
                                        {images.map((img, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setSelectedImage(img)}
                                                className={`transition-all duration-300 rounded-full ${selectedImage === img
                                                    ? 'w-6 sm:w-8 h-2 sm:h-3 bg-gradient-to-r from-rose-500 to-purple-500'
                                                    : 'w-2 sm:w-3 h-2 sm:h-3 bg-gray-300 hover:bg-gray-400'
                                                    }`}
                                                aria-label={`View image ${index + 1}`}
                                            />
                                        ))}
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>

                        {/* Product Info - Right Side */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-col"
                        >
                            {/* Category Badge */}
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="mb-1.5 sm:mb-4"
                            >
                                <span className="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-rose-100 to-purple-100 text-rose-700 px-2.5 py-1 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-sm font-bold uppercase tracking-wide sm:tracking-wider shadow-sm">
                                    <Icons.Gift className="w-3 h-3 sm:w-4 sm:h-4" />
                                    {product.category.replace('-', ' ')}
                                </span>
                            </motion.div>

                            {/* Product Name */}
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="font-serif text-lg sm:text-3xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-2 sm:mb-6 leading-tight bg-gradient-to-r from-gray-900 via-rose-900 to-purple-900 bg-clip-text text-transparent"
                            >
                                {product.name}
                            </motion.h1>

                            {/* Price Section */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="bg-gradient-to-br from-white to-rose-50 rounded-xl sm:rounded-2xl p-2.5 sm:p-6 mb-2.5 sm:mb-6 shadow-lg border border-rose-100"
                            >
                                <div className="flex items-baseline gap-2 sm:gap-4 flex-wrap">
                                    <span className="text-2xl sm:text-4xl lg:text-5xl font-bold text-rose-600" style={{ fontFamily: 'Arial, sans-serif' }}>
                                        &#8377;{product.price.toLocaleString()}
                                    </span>
                                    {product.marketPrice && product.marketPrice > product.price && (
                                        <>
                                            <span className="text-lg sm:text-2xl text-gray-400 line-through" style={{ fontFamily: 'Arial, sans-serif' }}>
                                                &#8377;{product.marketPrice.toLocaleString()}
                                            </span>
                                            <span className="bg-green-100 text-green-700 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-bold" style={{ fontFamily: 'Arial, sans-serif' }}>
                                                Save &#8377;{(product.marketPrice - product.price).toLocaleString()}
                                            </span>
                                        </>
                                    )}
                                </div>
                                <div className="mt-3 flex items-center gap-2 text-sm font-medium text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg w-fit">
                                    <Icons.Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                                    <span>Earn {calculatePointsForPrice(product.price)} Reward Points</span>
                                </div>
                            </motion.div>

                            {/* Description */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="mb-3 sm:mb-8"
                            >
                                <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-1.5 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                                    <Icons.Package className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
                                    Product Description
                                </h3>
                                <div className="text-gray-600 leading-relaxed text-sm sm:text-base lg:text-lg space-y-2 sm:space-y-4">
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
                                className="grid grid-cols-2 gap-1.5 sm:gap-3 mb-3 sm:mb-8"
                            >
                                <div className="flex items-center gap-1.5 sm:gap-3 p-2 sm:p-4 bg-gradient-to-br from-white to-gray-50 rounded-lg sm:rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className={`p-2 sm:p-3 rounded-full shadow-sm ${isOutOfStock ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                        {isOutOfStock ? <Icons.X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Icons.Check className="w-4 h-4 sm:w-5 sm:h-5" />}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-xs sm:text-sm text-gray-900">
                                            {isOutOfStock ? 'Out of Stock' : 'In Stock'}
                                        </span>
                                        {currentStock > 0 && currentStock < 10 && (
                                            <span className="text-[10px] sm:text-xs text-orange-600 font-bold animate-pulse">Only {currentStock} left!</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg sm:rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="p-2 sm:p-3 bg-blue-100 rounded-full text-blue-600 shadow-sm">
                                        <Icons.Truck className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <span className="font-bold text-xs sm:text-sm text-gray-900">Fast Delivery</span>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-4 bg-gradient-to-br from-purple-50 to-white rounded-lg sm:rounded-xl border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="p-2 sm:p-3 bg-purple-100 rounded-full text-purple-600 shadow-sm">
                                        <Icons.Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <span className="font-bold text-xs sm:text-sm text-gray-900">Secure Payment</span>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-4 bg-gradient-to-br from-orange-50 to-white rounded-lg sm:rounded-xl border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="p-2 sm:p-3 bg-orange-100 rounded-full text-orange-600 shadow-sm">
                                        <Icons.Gift className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <span className="font-bold text-xs sm:text-sm text-gray-900">Free Gift Wrapping</span>
                                </div>
                            </motion.div>

                            {/* Variant Selectors */}
                            {hasVariants && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.75 }}
                                    className="mb-3 sm:mb-8 space-y-3 sm:space-y-6"
                                >
                                    {/* Colors (Linked Products + Internal Variants) */}
                                    {(linkedVariants.length > 0 || uniqueColors.length > 0) && (
                                        <div>
                                            <div className="flex justify-between items-center mb-2 sm:mb-3">
                                                <h3 className="text-xs sm:text-sm font-semibold text-gray-900">Select Color</h3>
                                                <span className="text-xs sm:text-sm text-rose-600 font-medium">{selectedColor || product.color}</span>
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
                                                                ? 'border-gray-200 opacity-40 cursor-not-allowed grayscale'
                                                                : selectedColor === color
                                                                    ? 'border-gray-900 shadow-md'
                                                                    : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                                                                }`}
                                                            title={!hasStock ? `${color} - Out of Stock` : color}
                                                        >
                                                            <img
                                                                src={colorImage}
                                                                alt={color}
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
                                                <h3 className="text-xs sm:text-sm font-semibold text-gray-900">Select Size</h3>
                                                <button className="text-[10px] sm:text-xs text-blue-600 font-semibold hover:underline">
                                                    Size Chart
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
                                                            className={`min-w-[2.5rem] sm:min-w-[3rem] px-3 sm:px-4 py-2 sm:py-2.5 rounded-full border transition-all font-medium text-xs sm:text-sm ${!hasStock
                                                                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                                                                : selectedSize === size
                                                                    ? 'bg-gray-900 text-white border-gray-900'
                                                                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400 cursor-pointer'
                                                                }`}
                                                        >
                                                            {size}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* Action Buttons */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                                className="flex flex-col sm:flex-row gap-3 mt-auto"
                            >
                                {/* Add to Cart Button - White */}
                                <button
                                    onClick={handleAddToCart}
                                    disabled={isOutOfStock || isAdding}
                                    className={`flex-1 py-4 px-6 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-500 border-2 ${isOutOfStock
                                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                        : hasBeenAdded
                                            ? 'bg-green-500 text-white border-green-500 shadow-lg'
                                            : 'bg-white text-gray-900 border-gray-300 hover:border-gray-900 hover:shadow-lg active:scale-95'
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
                                            Buy at &#8377;{product.price.toLocaleString()}
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8 mt-12">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl font-serif font-bold text-gray-900 mb-8 text-center">Customer Reviews</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Review Form */}
                        <div className="lg:col-span-1">
                            <ReviewForm productId={product.id} onReviewAdded={() => window.location.reload()} />
                        </div>

                        {/* Reviews List */}
                        <div className="lg:col-span-2">
                            <ReviewsList productId={product.id} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

// Review Form Component
const ReviewForm = ({ productId, onReviewAdded }: { productId: string, onReviewAdded: () => void }) => {
    const { user } = useAuth();
    const { alertState, showAlert, closeAlert } = useCustomAlert();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [userName, setUserName] = useState('');
    const [mediaFiles, setMediaFiles] = useState<FileList | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            showAlert(
                'Login Required',
                'Please login to submit a review.',
                'warning',
                { confirmText: 'OK' }
            );
            return;
        }

        setSubmitting(true);
        setMessage('');

        try {
            // Upload media
            const mediaUrls: string[] = [];
            if (mediaFiles && mediaFiles.length > 0) {
                for (let i = 0; i < mediaFiles.length; i++) {
                    const file = mediaFiles[i];
                    try {
                        const url = await store.uploadReviewMedia(file);
                        if (url) mediaUrls.push(url);
                    } catch (error) {
                        console.error(`Failed to upload file ${file.name}:`, error);
                        showAlert(
                            'Upload Failed',
                            `Failed to upload image: ${file.name}. Please ensure the 'reviews' storage bucket exists in Supabase.`,
                            'error'
                        );
                    }
                }
            }

            await store.addReview({
                product_id: productId,
                user_name: userName || (user.email ? user.email.split('@')[0] : 'Anonymous'),
                rating,
                comment,
                media_urls: mediaUrls,
                user_id: user.id
            });

            setMessage('Review submitted successfully! Pending approval.');
            setComment('');
            setUserName('');
            setRating(5);
            setMediaFiles(null);
            // Reset file input
            const fileInput = document.getElementById('review-file-input') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

            setTimeout(onReviewAdded, 2000);
        } catch (error) {
            console.error('Error submitting review:', error);
            setMessage('Failed to submit review. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold mb-4">Write a Review</h3>
                {message && <div className={`p-3 rounded mb-4 text-sm ${message.includes('Success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{message}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-1">Your Name</label>
                        <input
                            type="text"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-rose-500 outline-none"
                            placeholder={user ? (user.email?.split('@')[0] || "Your Name") : "Login to review"}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Rating</label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className={`text-2xl transition-colors ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Review</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-rose-500 outline-none"
                            rows={4}
                            placeholder="Share your experience..."
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Add Photos/Video (Optional)</label>
                        <input
                            id="review-file-input"
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            onChange={(e) => setMediaFiles(e.target.files)}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors"
                    >
                        {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                </form>
            </div>

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
        </>
    );
};

// Reviews List Component
const ReviewsList = ({ productId }: { productId: string }) => {
    const { user } = useAuth();
    const { alertState, showAlert, closeAlert } = useCustomAlert();
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
    const [editComment, setEditComment] = useState('');
    const [editRating, setEditRating] = useState(5);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const fetchReviews = async () => {
        try {
            const data = await store.getProductReviews(productId);
            setReviews(data || []);
        } catch (error) {
            console.error('Failed to load reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [productId]);

    const handleDelete = async (reviewId: string) => {
        showAlert(
            'Delete Review',
            'Are you sure you want to delete your review?',
            'warning',
            {
                confirmText: 'Delete',
                cancelText: 'Cancel',
                onConfirm: async () => {
                    try {
                        await store.deleteReview(reviewId);
                        await fetchReviews();
                        showAlert('Success', 'Review deleted successfully!', 'success');
                    } catch (error: any) {
                        console.error('Failed to delete review:', error);
                        showAlert(
                            'Delete Failed',
                            error.message || 'Please ensure you have permission to delete this review.',
                            'error'
                        );
                    }
                }
            }
        );
    };

    const handleEdit = (review: any) => {
        setEditingReviewId(review.id);
        setEditComment(review.comment);
        setEditRating(review.rating);
        setOpenMenuId(null);
    };

    const handleSaveEdit = async (reviewId: string) => {
        try {
            await store.updateReview(reviewId, editRating, editComment);
            setEditingReviewId(null);
            await fetchReviews(); // Refresh to show updated review
            showAlert('Success', 'Review updated successfully!', 'success');
        } catch (error: any) {
            console.error('Failed to update review:', error);
            showAlert(
                'Update Failed',
                error.message || 'Failed to update review. Please try again.',
                'error'
            );
        }
    };

    const handleCancelEdit = () => {
        setEditingReviewId(null);
        setEditComment('');
        setEditRating(5);
    };

    const [likes, setLikes] = useState<Record<string, number>>({});
    const [userLikes, setUserLikes] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (reviews.length > 0) {
            reviews.forEach(async (review) => {
                const count = await store.getReviewLikeCount(review.id);
                setLikes(prev => ({ ...prev, [review.id]: count }));

                if (user) {
                    const hasLiked = await store.hasUserLikedReview(review.id, user.id);
                    setUserLikes(prev => ({ ...prev, [review.id]: hasLiked }));
                }
            });
        }
    }, [reviews, user]);

    const handleLike = async (reviewId: string) => {
        if (!user) {
            showAlert('Login Required', 'Please login to like reviews', 'info');
            return;
        }

        // Optimistic update
        const isLiked = userLikes[reviewId];
        setUserLikes(prev => ({ ...prev, [reviewId]: !isLiked }));
        setLikes(prev => ({ ...prev, [reviewId]: (prev[reviewId] || 0) + (isLiked ? -1 : 1) }));

        try {
            await store.toggleReviewLike(reviewId, user.id);
        } catch (error) {
            // Revert on error
            setUserLikes(prev => ({ ...prev, [reviewId]: isLiked }));
            setLikes(prev => ({ ...prev, [reviewId]: (prev[reviewId] || 0) + (isLiked ? 1 : -1) }));
            console.error('Failed to toggle like:', error);
        }
    };

    if (loading) return <div className="text-center py-10">Loading reviews...</div>;

    if (reviews.length === 0) {
        return (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
                <Icons.Star className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-900">No reviews yet</h3>
                <p className="text-gray-500">Be the first to review this product!</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                {reviews.map((review) => {
                    const isOwner = user && user.id === review.user_id;
                    const isEditing = editingReviewId === review.id;
                    const isLiked = userLikes[review.id];
                    const likeCount = likes[review.id] || 0;

                    return (
                        <div key={review.id} className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative group ${isOwner ? 'pt-14' : ''}`}>
                            {/* Your Review Badge and Menu */}
                            <div className="absolute top-4 left-4 flex items-center gap-2">
                                {isOwner && (
                                    <>
                                        <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                            Your Review
                                        </span>
                                        <div className="relative">
                                            <button
                                                onClick={() => setOpenMenuId(openMenuId === review.id ? null : review.id)}
                                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                                title="Review options"
                                            >
                                                <Icons.MoreVertical className="w-5 h-5 text-gray-600" />
                                            </button>
                                            {openMenuId === review.id && (
                                                <div className="absolute left-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                                    <button
                                                        onClick={() => handleEdit(review)}
                                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                                    >
                                                        <Icons.Edit className="w-4 h-4" />
                                                        Edit Review
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setOpenMenuId(null);
                                                            handleDelete(review.id);
                                                        }}
                                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2"
                                                    >
                                                        <Icons.Trash2 className="w-4 h-4" />
                                                        Delete Review
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {isEditing ? (
                                /* Edit Mode */
                                <div className="space-y-4 mt-8">
                                    <div>
                                        <label className="block text-sm font-bold mb-2">Rating</label>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setEditRating(star)}
                                                    className={`text-2xl ${star <= editRating ? 'text-yellow-400' : 'text-gray-300'}`}
                                                >
                                                    ★
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-2">Comment</label>
                                        <textarea
                                            value={editComment}
                                            onChange={(e) => setEditComment(e.target.value)}
                                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-rose-500 outline-none"
                                            rows={4}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleSaveEdit(review.id)}
                                            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                                        >
                                            Save Changes
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* View Mode */
                                <>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-gray-900">{review.user_name}</h4>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span>{new Date(review.created_at).toLocaleDateString()}</span>
                                                {review.verified_purchase && (
                                                    <span className="text-green-600 font-bold flex items-center gap-1">
                                                        <Icons.CheckCircle className="w-3 h-3" /> Verified Purchase
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex text-yellow-400 text-sm">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-gray-700 mb-4">{review.comment}</p>
                                    {review.media_urls && review.media_urls.length > 0 && (
                                        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
                                            {review.media_urls.map((url: string, i: number) => (
                                                <div
                                                    key={i}
                                                    className="w-20 h-20 rounded-lg overflow-hidden border border-gray-100 shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => setPreviewImage(url)}
                                                >
                                                    {url.match(/\.(mp4|webm)$/i) ? (
                                                        <video src={url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <img src={url} alt="Review media" className="w-full h-full object-cover" />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Like Button */}
                                    <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
                                        <button
                                            onClick={() => handleLike(review.id)}
                                            className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${isLiked ? 'text-rose-600' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            <Icons.Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                                            <span>{likeCount > 0 ? likeCount : 'Helpful'}</span>
                                        </button>
                                        <button className="text-gray-500 hover:text-gray-700 text-sm font-medium">
                                            Reply
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}

                {/* Image Preview Modal */}
                <AnimatePresence>
                    {previewImage && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setPreviewImage(null)}
                            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-zoom-out"
                        >
                            <motion.div
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.9 }}
                                className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => setPreviewImage(null)}
                                    className="absolute -top-10 right-0 text-white hover:text-gray-300"
                                >
                                    <Icons.X className="w-8 h-8" />
                                </button>

                                {previewImage.match(/\.(mp4|webm)$/i) ? (
                                    <video src={previewImage} className="max-w-full max-h-full rounded-lg" controls autoPlay />
                                ) : (
                                    <img src={previewImage} alt="Full size preview" className="max-w-full max-h-full object-contain rounded-lg" />
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

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
