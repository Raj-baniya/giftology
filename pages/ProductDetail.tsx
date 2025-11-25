import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../components/ui/Icons';
import { store } from '../services/store';
import { useCart } from '../contexts/CartContext';
import { Product } from '../types';
import { LightRays } from '../components/ui/LightRays';

export const ProductDetail = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string>('');
    const [isAdding, setIsAdding] = useState(false);
    const [hasBeenAdded, setHasBeenAdded] = useState(false);
    const [flyingImage, setFlyingImage] = useState<{ show: boolean; startPos?: DOMRect; endPos?: DOMRect }>({ show: false });
    const imageRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const fetchProduct = async () => {
            if (!slug) return;
            try {
                setLoading(true);
                const data = await store.getProductBySlug(slug);
                if (data) {
                    setProduct(data);
                    setSelectedImage(data.imageUrl);
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

    const handleAddToCart = async () => {
        if (!product || isAdding) return;

        setIsAdding(true);

        // Get the position of the product image and button
        const imageElement = imageRef.current;
        const buttonElement = buttonRef.current;

        if (imageElement && buttonElement) {
            const imageRect = imageElement.getBoundingClientRect();
            const buttonRect = buttonElement.getBoundingClientRect();
            setFlyingImage({ show: true, startPos: imageRect, endPos: buttonRect });

            // Wait for animation to complete
            setTimeout(() => {
                addToCart(product);
                setFlyingImage({ show: false });
                setHasBeenAdded(true);
                setIsAdding(false);
            }, 1500); // Increased from 1000ms to 1500ms for slower animation
        } else {
            // Fallback if ref is not available
            addToCart(product);
            setHasBeenAdded(true);
            setIsAdding(false);
        }
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

    const images = product.images && product.images.length > 0 ? product.images : [product.imageUrl];
    const discountPercentage = product.marketPrice && product.marketPrice > product.price
        ? Math.round(((product.marketPrice - product.price) / product.marketPrice) * 100)
        : 0;

    const isOutOfStock = !product.stock || product.stock <= 0;

    return (
        <>
            {/* Light Rays Background */}
            <LightRays />

            <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Breadcrumb / Back */}
                    <motion.button
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 bg-white hover:bg-gradient-to-r hover:from-rose-50 hover:to-purple-50 text-gray-700 hover:text-rose-600 px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-xl border border-gray-100 hover:border-rose-200 transition-all duration-300 group mb-8"
                    >
                        <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-rose-100 flex items-center justify-center transition-colors">
                            <Icons.ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </div>
                        <span>Back to Shop</span>
                    </motion.button>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                        {/* Image Gallery - Left Side */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="relative mt-8"
                        >
                            {/* Stacked Image Gallery */}
                            <div className="relative h-[500px] lg:h-[600px] flex items-center justify-center pt-8">
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
                                                    ref={index === 0 ? imageRef : null}
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
                                                    <div className={`relative w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden ${isSelected ? 'ring-4 ring-rose-400' : ''
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
                                                                className="absolute top-4 left-4 bg-gradient-to-br from-rose-500 to-rose-600 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-xl flex items-center gap-2 z-10"
                                                            >
                                                                <Icons.TrendingUp className="w-4 h-4" />
                                                                {discountPercentage}% OFF
                                                            </motion.div>
                                                        )}

                                                        {/* Trending Badge - Only on first image */}
                                                        {index === 0 && product.trending && (
                                                            <motion.div
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                transition={{ delay: 0.5, type: "spring" }}
                                                                className="absolute top-4 right-4 bg-gradient-to-br from-orange-400 to-orange-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg z-10"
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

                                                        {/* Click to cycle hint */}
                                                        {isSelected && (
                                                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-xs font-bold backdrop-blur-sm flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Icons.ArrowRight className="w-3 h-3" />
                                                                Click to see next
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
                                        ref={imageRef}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="relative w-full h-full"
                                    >
                                        <div className="relative w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden p-4">
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
                                        className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 bg-white/80 backdrop-blur-sm px-4 py-3 rounded-full shadow-lg"
                                    >
                                        {images.map((img, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setSelectedImage(img)}
                                                className={`transition-all duration-300 rounded-full ${selectedImage === img
                                                    ? 'w-8 h-3 bg-gradient-to-r from-rose-500 to-purple-500'
                                                    : 'w-3 h-3 bg-gray-300 hover:bg-gray-400'
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
                                className="mb-4"
                            >
                                <span className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-100 to-purple-100 text-rose-700 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider shadow-sm">
                                    <Icons.Gift className="w-4 h-4" />
                                    {product.category.replace('-', ' ')}
                                </span>
                            </motion.div>

                            {/* Product Name */}
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="font-serif text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-6 leading-tight bg-gradient-to-r from-gray-900 via-rose-900 to-purple-900 bg-clip-text text-transparent"
                            >
                                {product.name}
                            </motion.h1>

                            {/* Price Section */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="bg-gradient-to-br from-white to-rose-50 rounded-2xl p-6 mb-6 shadow-lg border border-rose-100"
                            >
                                <div className="flex items-baseline gap-4 flex-wrap">
                                    <span className="text-5xl font-bold text-rose-600" style={{ fontFamily: 'Arial, sans-serif' }}>
                                        &#8377;{product.price.toLocaleString()}
                                    </span>
                                    {product.marketPrice && product.marketPrice > product.price && (
                                        <>
                                            <span className="text-2xl text-gray-400 line-through" style={{ fontFamily: 'Arial, sans-serif' }}>
                                                &#8377;{product.marketPrice.toLocaleString()}
                                            </span>
                                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold" style={{ fontFamily: 'Arial, sans-serif' }}>
                                                Save &#8377;{(product.marketPrice - product.price).toLocaleString()}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </motion.div>

                            {/* Description */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="mb-8"
                            >
                                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <Icons.Package className="w-5 h-5 text-rose-500" />
                                    Product Description
                                </h3>
                                <p className="text-gray-600 leading-relaxed text-lg">{product.description}</p>
                            </motion.div>

                            {/* Features Grid */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                                className="grid grid-cols-2 gap-3 mb-8"
                            >
                                <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className={`p-3 rounded-full shadow-sm ${isOutOfStock ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                        {isOutOfStock ? <Icons.X className="w-5 h-5" /> : <Icons.Check className="w-5 h-5" />}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-gray-900">
                                            {isOutOfStock ? 'Out of Stock' : 'In Stock'}
                                        </span>
                                        {product.stock && product.stock > 0 && product.stock < 10 && (
                                            <span className="text-xs text-orange-600 font-bold animate-pulse">Only {product.stock} left!</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="p-3 bg-blue-100 rounded-full text-blue-600 shadow-sm">
                                        <Icons.Truck className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold text-sm text-gray-900">Fast Delivery</span>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="p-3 bg-purple-100 rounded-full text-purple-600 shadow-sm">
                                        <Icons.Shield className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold text-sm text-gray-900">Secure Payment</span>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-orange-50 to-white rounded-xl border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="p-3 bg-orange-100 rounded-full text-orange-600 shadow-sm">
                                        <Icons.Gift className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold text-sm text-gray-900">Gift Ready</span>
                                </div>
                            </motion.div>

                            {/* Action Buttons */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                                className="flex gap-4 mt-auto"
                            >
                                <button
                                    ref={buttonRef}
                                    onClick={handleAddToCart}
                                    disabled={isOutOfStock || isAdding}
                                    className={`flex-1 py-5 px-8 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all transform relative overflow-hidden shadow-xl ${isOutOfStock
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : hasBeenAdded
                                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:shadow-2xl hover:shadow-green-200 hover:-translate-y-1 active:scale-95'
                                            : isAdding
                                                ? 'bg-gradient-to-r from-rose-400 to-rose-500 text-white'
                                                : 'bg-gradient-to-r from-rose-500 to-purple-600 text-white hover:from-rose-600 hover:to-purple-700 hover:shadow-2xl hover:shadow-rose-300 hover:-translate-y-1 active:scale-95'
                                        }`}
                                >
                                    <AnimatePresence mode="wait">
                                        {isAdding ? (
                                            <motion.div
                                                key="loading"
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                className="flex items-center gap-3"
                                            >
                                                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                                                Adding...
                                            </motion.div>
                                        ) : hasBeenAdded ? (
                                            <motion.div
                                                key="added"
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                className="flex items-center gap-3"
                                            >
                                                <Icons.Check className="w-6 h-6" />
                                                Product Added
                                                <div className="ml-2 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                                                    <Icons.Plus className="w-5 h-5" />
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="default"
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                className="flex items-center gap-3"
                                            >
                                                <Icons.ShoppingCart className="w-6 h-6" />
                                                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </button>
                                <button
                                    onClick={handleShare}
                                    className="w-16 h-16 rounded-2xl border-2 border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-all hover:scale-110 active:scale-95 shadow-lg"
                                    title="Share Product"
                                >
                                    <Icons.ArrowRight className="w-6 h-6 -rotate-45" />
                                </button>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Flying Cart Animation */}
            <AnimatePresence>
                {flyingImage.show && flyingImage.startPos && flyingImage.endPos && (
                    <motion.div
                        initial={{
                            position: 'fixed',
                            left: flyingImage.startPos.left + flyingImage.startPos.width / 2 - 30,
                            top: flyingImage.startPos.top + flyingImage.startPos.height / 2 - 30,
                            width: 60,
                            height: 60,
                            zIndex: 9999,
                            opacity: 1,
                        }}
                        animate={{
                            left: [
                                flyingImage.startPos.left + flyingImage.startPos.width / 2 - 30,
                                (flyingImage.startPos.left + flyingImage.endPos.left) / 2,
                                flyingImage.endPos.left + flyingImage.endPos.width / 2 - 20,
                            ],
                            top: [
                                flyingImage.startPos.top + flyingImage.startPos.height / 2 - 30,
                                Math.min(flyingImage.startPos.top, flyingImage.endPos.top) - 100,
                                flyingImage.endPos.top + flyingImage.endPos.height / 2 - 20,
                            ],
                            width: [60, 80, 40],
                            height: [60, 80, 40],
                            opacity: [1, 1, 0],
                            rotate: [0, 15, 360],
                            scale: [1, 1.2, 0.3],
                        }}
                        transition={{
                            duration: 1.5,
                            ease: [0.34, 1.56, 0.64, 1],
                            times: [0, 0.5, 1],
                        }}
                        className="pointer-events-none"
                    >
                        <div className="relative w-full h-full">
                            <img
                                src={selectedImage}
                                alt="Flying to cart"
                                className="w-full h-full object-contain rounded-xl shadow-2xl"
                                style={{
                                    filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))',
                                }}
                            />
                            {/* Sparkle effect */}
                            <motion.div
                                className="absolute inset-0 rounded-xl"
                                animate={{
                                    boxShadow: [
                                        '0 0 0px rgba(236, 72, 153, 0)',
                                        '0 0 20px rgba(236, 72, 153, 0.6)',
                                        '0 0 0px rgba(236, 72, 153, 0)',
                                    ],
                                }}
                                transition={{
                                    duration: 0.5,
                                    repeat: 2,
                                }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
