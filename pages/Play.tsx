import React, { useEffect, useState } from 'react';
import { store } from '../services/store';
import * as Icons from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Play = () => {
    const [reviews, setReviews] = useState<any[]>([]);
    const { user } = useAuth();

    useEffect(() => {
        loadReviews();
    }, []);

    const loadReviews = async () => {
        const allReviews = await store.getAllReviews();
        // Filter for reviews with images or long text to make it interesting
        const interestingReviews = allReviews.filter(r => r.images?.length > 0 || r.comment.length > 50);
        setReviews(interestingReviews);
    };

    const handleLike = async (reviewId: string) => {
        if (!user) return; // Prompt login
        await store.toggleReviewLike(reviewId, user.id);
        // Optimistically update UI or reload
        // For now, just reload to keep it simple
        loadReviews();
    };

    return (
        <div className="h-[calc(100vh-112px)] bg-black overflow-y-scroll snap-y snap-mandatory">
            {reviews.map((review) => (
                <div key={review.id} className="h-full w-full snap-start relative flex items-center justify-center bg-gray-900">
                    {review.images?.[0] ? (
                        <img src={review.images[0]} alt="Review" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-blue-900 opacity-60" />
                    )}

                    <div className="relative z-10 p-8 text-white w-full max-w-md">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
                                {review.user_name?.[0] || 'U'}
                            </div>
                            <div>
                                <h3 className="font-bold">{review.user_name || 'Anonymous'}</h3>
                                <div className="flex text-yellow-400">
                                    {[...Array(5)].map((_, i) => (
                                        <Icons.Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-gray-400'}`} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <p className="text-lg font-medium mb-6 leading-relaxed">
                            "{review.comment}"
                        </p>

                        <div className="flex items-center justify-between">
                            <div className="flex flex-col items-center gap-1">
                                <button
                                    onClick={() => handleLike(review.id)}
                                    className="p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all"
                                >
                                    <Icons.Heart className="w-6 h-6 text-white" />
                                </button>
                                <span className="text-xs">Like</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <button className="p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all">
                                    <Icons.MessageCircle className="w-6 h-6 text-white" />
                                </button>
                                <span className="text-xs">Comment</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <button className="p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all">
                                    <Icons.Share2 className="w-6 h-6 text-white" />
                                </button>
                                <span className="text-xs">Share</span>
                            </div>
                        </div>

                        <div className="mt-8 pt-4 border-t border-white/20">
                            <p className="text-sm text-gray-300">Review for: <span className="font-bold text-white">{review.products?.name}</span></p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Play;
