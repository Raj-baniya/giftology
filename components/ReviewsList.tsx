
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../components/ui/Icons';
import { store } from '../services/store';
import { useAuth } from '../contexts/AuthContext';
import { useCustomAlert } from '../components/CustomAlert';

interface ReviewsListProps {
    productId: string;
    refreshTrigger?: number;
}

export const ReviewsList: React.FC<ReviewsListProps> = ({ productId, refreshTrigger = 0 }) => {
    const { user } = useAuth();
    const { alertState, showAlert, closeAlert } = useCustomAlert();
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
    const [editComment, setEditComment] = useState('');
    const [editRating, setEditRating] = useState(5);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Extracted state for likes to avoid re-rendering entire list
    const [likes, setLikes] = useState<{ [key: string]: number }>({});
    const [userLikes, setUserLikes] = useState<{ [key: string]: boolean }>({});

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
    }, [productId, refreshTrigger]);

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

    useEffect(() => {
        const fetchLikes = async () => {
            if (reviews.length === 0) return;

            const likeCounts: { [key: string]: number } = {};
            const userLikedStatus: { [key: string]: boolean } = {};

            await Promise.all(reviews.map(async (review) => {
                try {
                    const count = await store.getReviewLikeCount(review.id);
                    likeCounts[review.id] = count;

                    if (user) {
                        const hasLiked = await store.hasUserLikedReview(review.id, user.id);
                        userLikedStatus[review.id] = hasLiked;
                    }
                } catch (error) {
                    console.error(`Error fetching likes for review ${review.id}:`, error);
                }
            }));

            setLikes(prev => ({ ...prev, ...likeCounts }));
            if (user) {
                setUserLikes(prev => ({ ...prev, ...userLikedStatus }));
            }
        };

        fetchLikes();
    }, [reviews, user]);

    const handleLike = async (reviewId: string) => {
        if (!user) {
            showAlert('Login Required', 'Please login to like reviews', 'info');
            return;
        }

        // Optimistic update
        const isLiked = userLikes[reviewId];
        const currentCount = likes[reviewId] || 0;

        setUserLikes(prev => ({ ...prev, [reviewId]: !isLiked }));
        setLikes(prev => ({ ...prev, [reviewId]: isLiked ? Math.max(0, currentCount - 1) : currentCount + 1 }));

        try {
            await store.toggleReviewLike(reviewId, user.id);
        } catch (error) {
            // Revert on error
            setUserLikes(prev => ({ ...prev, [reviewId]: isLiked }));
            setLikes(prev => ({ ...prev, [reviewId]: currentCount }));
            console.error('Failed to toggle like:', error);
            showAlert('Error', 'Failed to update like status', 'error');
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
                                    <p className="text-white leading-relaxed text-sm mb-6 font-medium italic">"{review.comment}"</p>

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
                                                        <img
                                                            src={url}
                                                            alt="Review media"
                                                            loading="lazy"
                                                            decoding="async"
                                                            className="w-full h-full object-cover"
                                                        />
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
                                        <button
                                            onClick={() => showAlert('Coming Soon', 'Replies are currently disabled.', 'info')}
                                            className="text-gray-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
                                        >
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
