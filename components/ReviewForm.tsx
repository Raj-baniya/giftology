
import React, { useState } from 'react';
import { Icons } from '../components/ui/Icons';
import { store } from '../services/store';
import { useAuth } from '../contexts/AuthContext';
import { CustomAlert, useCustomAlert } from '../components/CustomAlert';

interface ReviewFormProps {
    productId: string;
    onReviewAdded: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ productId, onReviewAdded }) => {
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
