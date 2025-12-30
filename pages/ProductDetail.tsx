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
import { calculatePointsEarned } from '../utils/rewards';
import { AuthRequiredModal } from '../components/AuthRequiredModal';

export const ProductDetail = () => {
    const { slug } = useParams<{ slug: string }>();

    // Guest Lead State
    // Auth Modal State
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    const navigate = useNavigate();
    const { addToCart, cartCount } = useCart();
    const { user } = useAuth();
    const { alertState, showAlert, closeAlert } = useCustomAlert(); // Fix: Destructure all properties
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string>('');
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

    // Handle guest actions is removed as we now force redirect/modal

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
            <div className="min-h-screen flex items-center justify-center bg-transparent relative">
                <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E60000]"></div>
                    <p className="text-white font-black tracking-widest uppercase text-xs animate-pulse">Loading Product...</p>
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
                <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-2xl">
                    <h3 className="text-xl font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                        <Icons.Edit className="w-5 h-5 text-[#E60000]" />
                        Review This Product
                    </h3>
                    {message && (
                        <div className={`p-4 rounded-xl mb-6 text-sm font-bold border ${message.includes('Success')
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : 'bg-[#E60000]/10 text-red-400 border-[#E60000]/20'}`}>
                            {message}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Your Name</label>
                            <input
                                type="text"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-[#E60000] outline-none transition-all placeholder:text-gray-600"
                                placeholder={user ? (user.email?.split('@')[0] || "Your Name") : "Login to review"}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Rating</label>
                            <div className="flex gap-2 bg-white/5 p-3 rounded-xl border border-white/10">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className={`text-2xl transition-all hover:scale-125 ${star <= rating ? 'text-[#E60000] drop-shadow-[0_0_10px_rgba(230,0,0,0.5)]' : 'text-gray-700'}`}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Review Content</label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-[#E60000] outline-none transition-all placeholder:text-gray-600 min-h-[120px]"
                                placeholder="Share your experience with the cosmos..."
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Photos / Videos (Optional)</label>
                            <div className="relative group">
                                <input
                                    id="review-file-input"
                                    type="file"
                                    accept="image/*,video/*"
                                    multiple
                                    onChange={(e) => setMediaFiles(e.target.files)}
                                    className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-[#E60000] file:text-white hover:file:opacity-90 file:cursor-pointer p-2 bg-white/5 rounded-xl border border-white/10"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-[#E60000] text-white py-4 rounded-xl font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(230,0,0,0.4)] disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                            ) : 'Submit Review'}
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

        const [likes, setLikes] = useState<{ [key: string]: number }>({});
        const [userLikes, setUserLikes] = useState<{ [key: string]: boolean }>({});

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
                            <div key={review.id} className={`bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 relative group shadow-xl ${isOwner ? 'pt-14' : ''}`}>
                                {/* Your Review Badge and Menu */}
                                <div className="absolute top-4 left-4 flex items-center gap-2">
                                    {isOwner && (
                                        <>
                                            <span className="text-[10px] font-black bg-[#E60000] text-white px-3 py-1 rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(230,0,0,0.3)]">
                                                Your Review
                                            </span>
                                            <div className="relative">
                                                <button
                                                    onClick={() => setOpenMenuId(openMenuId === review.id ? null : review.id)}
                                                    className="p-1.5 hover:bg-white/10 rounded-full transition-all text-white/70"
                                                    title="Review options"
                                                >
                                                    <Icons.MoreVertical className="w-5 h-5" />
                                                </button>
                                                {openMenuId === review.id && (
                                                    <div className="absolute left-0 mt-2 w-48 bg-black/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 py-2 z-20">
                                                        <button
                                                            onClick={() => handleEdit(review)}
                                                            className="w-full px-4 py-2 text-left text-xs font-black uppercase tracking-widest hover:bg-white/10 text-white flex items-center gap-2"
                                                        >
                                                            <Icons.Edit className="w-4 h-4 text-[#E60000]" />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setOpenMenuId(null);
                                                                handleDelete(review.id);
                                                            }}
                                                            className="w-full px-4 py-2 text-left text-xs font-black uppercase tracking-widest hover:bg-white/10 text-[#E60000] flex items-center gap-2"
                                                        >
                                                            <Icons.Trash2 className="w-4 h-4" />
                                                            Delete
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
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Update Rating</label>
                                            <div className="flex gap-2 bg-white/5 p-2 rounded-lg border border-white/10">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onClick={() => setEditRating(star)}
                                                        className={`text-xl transition-all ${star <= editRating ? 'text-[#E60000]' : 'text-gray-700'}`}
                                                    >
                                                        ★
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Edit Review</label>
                                            <textarea
                                                value={editComment}
                                                onChange={(e) => setEditComment(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-[#E60000] outline-none transition-all placeholder:text-gray-600"
                                                rows={4}
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleSaveEdit(review.id)}
                                                className="px-6 py-2 bg-[#E60000] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:shadow-[0_0_15px_rgba(230,0,0,0.3)] transition-all"
                                            >
                                                Update
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                className="px-6 py-2 bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-all"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* View Mode */
                                    <>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="font-black text-white uppercase tracking-widest text-sm">{review.user_name}</h4>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter opacity-70">
                                                        {new Date(review.created_at).toLocaleDateString()}
                                                    </span>
                                                    {review.verified_purchase && (
                                                        <span className="text-[#E60000] text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                                            <Icons.CheckCircle className="w-3 h-3" /> Verified Purchase
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex text-[#E60000] text-sm drop-shadow-[0_0_5px_rgba(230,0,0,0.3)]">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <span key={i} className="transition-all hover:scale-125 cursor-default">{i < review.rating ? '★' : '☆'}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-gray-300 leading-relaxed text-sm mb-6 font-medium italic">"{review.comment}"</p>

                                        {review.media_urls && review.media_urls.length > 0 && (
                                            <div className="flex gap-3 overflow-x-auto pb-4 mb-4 custom-scrollbar">
                                                {review.media_urls.map((url: string, i: number) => (
                                                    <div
                                                        key={i}
                                                        className="w-24 h-24 rounded-xl overflow-hidden border border-white/10 shrink-0 cursor-pointer hover:border-[#E60000]/50 transition-all hover:scale-105 shadow-lg shadow-black/40"
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
                                        <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                                            <button
                                                onClick={() => handleLike(review.id)}
                                                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${isLiked ? 'text-[#E60000] drop-shadow-[0_0_8px_rgba(230,0,0,0.4)]' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                <Icons.Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                                                <span>{likeCount > 0 ? `${likeCount} Helpful` : 'Helpful'}</span>
                                            </button>
                                            <button className="text-gray-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all">
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
            </>
        );
    };

    return (
        <>
            <div className="min-h-screen bg-transparent text-white relative overflow-x-hidden font-sans">
                <div className="max-w-7xl mx-auto px-1.5 py-8 md:py-16 relative z-10">
                    {/* Mobile Back Button - Redesigned for Space */}
                    <div className="lg:hidden fixed top-4 left-4 z-50">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10 shadow-xl active:scale-90 transition-all"
                        >
                            <Icons.ChevronLeft className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="max-w-[1440px] mx-auto pt-0 lg:pt-12 px-1.5 lg:px-8">
                        {/* Product Header - Above Image & Info */}
                        <div className="px-6 lg:px-0 mb-8">
                            <div className="mb-4">
                                <span className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-[#E60000] px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
                                    <Icons.Sparkles className="w-4 h-4" />
                                    {product.category.replace('-', ' ')}
                                </span>
                            </div>
                            <h1 className="font-serif text-xl lg:text-3xl xl:text-4xl font-black text-white mb-2 uppercase tracking-wider leading-[1.1]">
                                {product.name}
                            </h1>
                            <div className="h-1 w-20 bg-[#E60000] rounded-full mt-4"></div>
                        </div>

                        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-0 lg:gap-16">
                            {/* Image Section - Left Side */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="relative group lg:sticky lg:top-24 h-[60vh] sm:h-[70vh] lg:h-[80vh]"
                            >
                                {/* Main Display Image */}
                                <div className="w-full h-full relative overflow-hidden bg-white/5 backdrop-blur-sm lg:rounded-3xl border-b lg:border border-white/10">
                                    {images.length > 1 ? (
                                        <div
                                            className="relative w-full h-full"
                                            onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
                                            onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
                                            onTouchEnd={() => {
                                                if (touchStart - touchEnd > 75) {
                                                    const currentIndex = images.indexOf(selectedImage);
                                                    const nextIndex = (currentIndex + 1) % images.length;
                                                    setSelectedImage(images[nextIndex]);
                                                }
                                                if (touchStart - touchEnd < -75) {
                                                    const currentIndex = images.indexOf(selectedImage);
                                                    const prevIndex = (currentIndex - 1 + images.length) % images.length;
                                                    setSelectedImage(images[prevIndex]);
                                                }
                                            }}
                                        >
                                            <AnimatePresence mode="wait">
                                                <motion.img
                                                    key={selectedImage}
                                                    src={selectedImage}
                                                    alt={product.name}
                                                    initial={{ opacity: 0, scale: 1.1 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                                    className="w-full h-full object-contain p-4 lg:p-8 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] cursor-pointer"
                                                    onClick={() => setShowFullScreen(true)}
                                                />
                                            </AnimatePresence>

                                            {discountPercentage > 0 && (
                                                <motion.div
                                                    initial={{ x: -100 }}
                                                    animate={{ x: 0 }}
                                                    className="absolute top-6 left-6 bg-[#E60000] text-white px-4 py-2 rounded-full text-xs font-black shadow-[0_0_15px_rgba(230,0,0,0.5)] flex items-center gap-2 z-10 active-blood-sparkle"
                                                >
                                                    <Icons.Zap className="w-3 h-3" />
                                                    {discountPercentage}% SPECIAL OFF
                                                </motion.div>
                                            )}
                                        </div>
                                    ) : (
                                        // Single image fallback
                                        <div className="relative w-full h-full">
                                            <img
                                                src={selectedImage}
                                                alt={product.name}
                                                className="w-full h-full object-contain p-4 lg:p-8 drop-shadow-2xl cursor-pointer"
                                                onClick={() => setShowFullScreen(true)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Product Info - Right Side */}
                            <div className="flex flex-col p-6 lg:p-0">

                                {/* Price Section */}
                                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/10 shadow-2xl">
                                    <div className="flex items-baseline gap-4">
                                        <span className="text-2xl lg:text-4xl font-black text-green-500 active-blood-sparkle" style={{ fontFamily: 'Arial, sans-serif' }}>
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
                                </div>

                                {/* Rewards Badge */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.55 }}
                                    className="mb-6 flex items-center gap-2"
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
                                    className="mb-3 sm:mb-8"
                                >
                                    <h3 className="text-sm sm:text-lg font-black text-white mb-3 flex items-center gap-2 uppercase tracking-widest">
                                        <Icons.Package className="w-5 h-5 text-[#E60000]" />
                                        Product Information
                                    </h3>
                                    <div className="text-gray-400 leading-relaxed text-sm lg:text-base space-y-4">
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
                                    <div className="flex items-center gap-1.5 sm:gap-3 p-2 sm:p-4 bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl border border-white/10 shadow-sm hover:shadow-md transition-shadow">
                                        <div className={`p-2 sm:p-3 rounded-full shadow-sm ${isOutOfStock ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                            {isOutOfStock ? <Icons.X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Icons.Check className="w-4 h-4 sm:w-5 sm:h-5" />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-xs sm:text-sm text-white">
                                                {isOutOfStock ? 'Out of Stock' : 'In Stock'}
                                            </span>
                                            {currentStock > 0 && currentStock < 10 && (
                                                <span className="text-[10px] sm:text-xs text-[#E60000] font-black animate-pulse">Only {currentStock} Left</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-4 bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl border border-white/10 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="p-2 sm:p-3 bg-blue-500/10 rounded-full text-blue-400 shadow-sm">
                                            <Icons.Truck className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </div>
                                        <span className="font-bold text-xs sm:text-sm text-white">Free Delivery</span>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-4 bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl border border-white/10 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="p-2 sm:p-3 bg-purple-500/10 rounded-full text-purple-400 shadow-sm">
                                            <Icons.Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </div>
                                        <span className="font-bold text-xs sm:text-sm text-white">Secure Payment</span>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-4 bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl border border-white/10 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="p-2 sm:p-3 bg-[#E60000]/10 rounded-full text-[#E60000] shadow-sm">
                                            <Icons.Gift className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </div>
                                        <span className="font-bold text-xs sm:text-sm text-white">Gift Wrapping</span>
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
                                                    <h3 className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-widest">Select Color</h3>
                                                    <span className="text-xs sm:text-sm text-[#E60000] font-black uppercase tracking-tighter">{selectedColor || product.color}</span>
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
                                                                    ? 'border-white/5 opacity-40 cursor-not-allowed grayscale'
                                                                    : selectedColor === color
                                                                        ? 'border-[#E60000] shadow-[0_0_15px_rgba(230,0,0,0.5)] scale-105'
                                                                        : 'border-white/10 hover:border-white/30 cursor-pointer'
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
                                                                className={`min-w-[3rem] px-5 py-3 rounded-xl border transition-all font-black text-xs uppercase tracking-widest ${!hasStock
                                                                    ? 'bg-black/20 border-white/5 text-gray-600 cursor-not-allowed'
                                                                    : selectedSize === size
                                                                        ? 'bg-[#E60000] text-white border-[#E60000] shadow-[0_0_20px_rgba(230,0,0,0.4)] active-blood-sparkle'
                                                                        : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/30'
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
                                <div className="flex flex-col sm:flex-row gap-4 mt-8">
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
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Labels & Reviews */}
                <div className="relative z-10">
                    {/* Reviews Section */}
                    <div className="bg-black/40 backdrop-blur-md py-16 px-4 sm:px-6 lg:px-8 mt-12 border-t border-white/10">
                        <div className="max-w-7xl mx-auto">
                            <h2 className="text-3xl font-serif font-black text-white mb-8 text-center uppercase tracking-widest">Customer Reviews</h2>
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
