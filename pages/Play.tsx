import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { store } from '../services/store';
import * as Icons from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PlayVideo, PlayComment } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const Play = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [videos, setVideos] = useState<PlayVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
    const [commentsOpen, setCommentsOpen] = useState(false);
    const [activeComments, setActiveComments] = useState<PlayComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [commentLoading, setCommentLoading] = useState(false);
    const [expandedCaptions, setExpandedCaptions] = useState<Set<string>>(new Set());
    const [showLikeAnimation, setShowLikeAnimation] = useState<string | null>(null);

    // Refs for intersection observer
    const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadVideos();
    }, [user]);

    const loadVideos = async () => {
        setLoading(true);
        try {
            const data = await store.getPlayVideos(user?.id);
            setVideos(data);
            if (data.length > 0) setActiveVideoId(data[0].id);
        } catch (error) {
            console.error('Failed to load videos:', error);
        } finally {
            setLoading(false);
        }
    };

    // Keyboard navigation for desktop
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                const container = containerRef.current;
                if (!container) return;

                const scrollAmount = container.clientHeight;
                if (e.key === 'ArrowDown') {
                    container.scrollBy({ top: scrollAmount, behavior: 'smooth' });
                } else {
                    container.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Handle scroll snap and auto-play
    useEffect(() => {
        const options = {
            root: containerRef.current,
            threshold: 0.6
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const videoId = entry.target.getAttribute('data-id');
                    if (videoId) {
                        setActiveVideoId(videoId);
                        // Play this video, pause others
                        Object.keys(videoRefs.current).forEach(id => {
                            const video = videoRefs.current[id];
                            if (video) {
                                if (id === videoId) {
                                    video.play().catch(e => console.log('Autoplay prevented:', e));
                                } else {
                                    video.pause();
                                    video.currentTime = 0;
                                }
                            }
                        });
                    }
                }
            });
        }, options);

        const elements = document.querySelectorAll('.video-container');
        elements.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, [videos]);

    const handleLike = async (video: PlayVideo) => {
        if (!user) {
            alert('Please login to like videos');
            return;
        }

        // Optimistic update
        const isLiked = video.isLiked;
        const newLikesCount = (video.likesCount || 0) + (isLiked ? -1 : 1);

        setVideos(prev => prev.map(v =>
            v.id === video.id ? { ...v, isLiked: !isLiked, likesCount: newLikesCount } : v
        ));

        try {
            if (isLiked) {
                await store.unlikeVideo(video.id, user.id);
            } else {
                await store.likeVideo(video.id, user.id);
            }
        } catch (error) {
            console.error('Failed to toggle like:', error);
            // Revert on error
            setVideos(prev => prev.map(v =>
                v.id === video.id ? { ...v, isLiked: isLiked, likesCount: video.likesCount } : v
            ));
        }
    };

    const openComments = async (videoId: string) => {
        setCommentsOpen(true);
        setCommentLoading(true);
        try {
            const comments = await store.getVideoComments(videoId);
            console.log('Fetched comments for video', videoId, comments);
            setActiveComments(comments);
            console.log('Active comments count:', comments.length);
        } catch (error) {
            console.error('Failed to load comments:', error);
        } finally {
            setCommentLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!user || !activeVideoId || !newComment.trim()) return;

        const tempId = Math.random().toString();
        const comment: PlayComment = {
            id: tempId,
            videoId: activeVideoId,
            userId: user.id,
            userName: user.displayName,
            content: newComment,
            createdAt: new Date().toISOString()
        };

        // Optimistically add to UI immediately
        setActiveComments(prev => [comment, ...prev]); // Add to top
        setNewComment('');

        try {
            console.log('Adding comment:', { videoId: activeVideoId, userId: user.id, content: comment.content });
            await store.addComment(activeVideoId, user.id, comment.content, user.displayName);

            // Re-fetch to ensure we have server timestamp and ID
            const updated = await store.getVideoComments(activeVideoId);
            console.log('Comments refreshed:', updated);
            setActiveComments(updated);

            // Update comment count locally
            setVideos(prev => prev.map(v =>
                v.id === activeVideoId ? { ...v, commentsCount: (v.commentsCount || 0) + 1 } : v
            ));
        } catch (error) {
            console.error('Failed to add comment:', error);
            alert('Failed to post comment. Please try again.');
            // Revert optimistic update
            setActiveComments(prev => prev.filter(c => c.id !== tempId));
        }
    };

    const handleShare = async (video: PlayVideo) => {
        const url = `${window.location.origin}/play?video=${video.id}`;
        try {
            await navigator.clipboard.writeText(url);
            alert('Link copied to clipboard!');
            if (user) {
                store.shareVideo(video.id, user.id, 'link');
            }
        } catch (error) {
            console.error('Failed to copy link:', error);
        }
    };

    return (
        <div className="relative h-screen bg-black text-white overflow-hidden">
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="absolute top-4 left-4 z-50 p-2 bg-black/20 backdrop-blur-md rounded-full hover:bg-black/40 transition-all"
            >
                <Icons.ArrowLeft className="w-6 h-6 text-white" />
            </button>

            {/* Video Feed */}
            <div
                ref={containerRef}
                className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
            >
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                    </div>
                ) : videos.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                        <Icons.Video className="w-16 h-16 mb-4 text-gray-500" />
                        <h2 className="text-xl font-bold mb-2">No Videos Yet</h2>
                        <p className="text-gray-400">Check back later for awesome content!</p>
                    </div>
                ) : (
                    videos.map((video) => (
                        <div
                            key={video.id}
                            data-id={video.id}
                            className="video-container relative h-full w-full snap-start flex items-center justify-center bg-gray-900"
                        >
                            {/* Video Player */}
                            <video
                                ref={el => {
                                    if (el) {
                                        videoRefs.current[video.id] = el;
                                        el.volume = 1.0; // Set volume to maximum
                                    }
                                }}
                                src={video.videoUrl}
                                poster={video.thumbnailUrl}
                                className="h-full w-full object-cover md:object-contain bg-black"
                                loop
                                playsInline
                                controls={false}
                                onClick={(e) => {
                                    const v = e.currentTarget;
                                    const clickTimeout = (v as any)._clickTimeout;

                                    if (clickTimeout) {
                                        // Double click detected - like the video
                                        clearTimeout(clickTimeout);
                                        (v as any)._clickTimeout = null;
                                        handleLike(video.id);

                                        // Trigger animation
                                        setShowLikeAnimation(video.id);
                                        setTimeout(() => setShowLikeAnimation(null), 800);
                                    } else {
                                        // Single click - set timeout to pause/play
                                        (v as any)._clickTimeout = setTimeout(() => {
                                            v.paused ? v.play() : v.pause();
                                            (v as any)._clickTimeout = null;
                                        }, 250); // 250ms delay to detect double-click
                                    }
                                }}
                            />

                            {/* Like Animation Overlay */}
                            <AnimatePresence>
                                {showLikeAnimation === video.id && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                                        <motion.div
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1.5, opacity: 1, rotate: [0, -15, 15, 0] }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            transition={{ duration: 0.5 }}
                                        >
                                            <Icons.Heart className="w-24 h-24 text-red-500 fill-red-500 drop-shadow-lg" />
                                        </motion.div>
                                    </div>
                                )}
                            </AnimatePresence>

                            {/* Overlay UI */}
                            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-48 pb-20 md:pb-24">
                                <div className="flex items-end justify-between max-w-4xl mx-auto w-full gap-4">
                                    {/* Info */}
                                    <div className="flex-1 max-w-[calc(100%-80px)] md:max-w-[calc(100%-100px)]">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-base shadow-lg">
                                                G
                                            </div>
                                            <a
                                                href="https://www.instagram.com/giftology.in_"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-black text-base md:text-lg hover:text-gray-300 transition-colors cursor-pointer drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                                            >
                                                Giftology Official
                                            </a>
                                        </div>
                                        <p
                                            className="text-sm md:text-base font-bold mb-3 cursor-pointer hover:text-gray-200 transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-relaxed"
                                            onClick={() => {
                                                setExpandedCaptions(prev => {
                                                    const newSet = new Set(prev);
                                                    if (newSet.has(video.id)) {
                                                        newSet.delete(video.id);
                                                    } else {
                                                        newSet.add(video.id);
                                                    }
                                                    return newSet;
                                                });
                                            }}
                                        >
                                            {expandedCaptions.has(video.id)
                                                ? video.caption
                                                : (video.caption.length > 60
                                                    ? <>{video.caption.substring(0, 60)}... <span className="text-blue-400 font-bold">See more</span></>
                                                    : video.caption)
                                            }
                                        </p>
                                        <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-gray-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                            <Icons.Music2 className="w-4 h-4" />
                                            <span>Original Audio</span>
                                        </div>
                                    </div>

                                    {/* Actions Sidebar */}
                                    <div className="flex flex-col items-center gap-5 shrink-0">
                                        <button onClick={() => handleLike(video)} className="flex flex-col items-center gap-1.5 group">
                                            <div className={`p-3 md:p-3.5 rounded-full bg-black/40 backdrop-blur-md group-hover:bg-black/60 transition-all shadow-lg ${video.isLiked ? 'text-red-500' : 'text-white'}`}>
                                                <Icons.Heart className={`w-7 h-7 md:w-8 md:h-8 ${video.isLiked ? 'fill-current' : ''}`} />
                                            </div>
                                            <span className="text-xs md:text-sm font-bold drop-shadow-lg">{video.likesCount}</span>
                                        </button>

                                        <button onClick={() => openComments(video.id)} className="flex flex-col items-center gap-1.5 group">
                                            <div className="p-3 md:p-3.5 rounded-full bg-black/40 backdrop-blur-md group-hover:bg-black/60 transition-all shadow-lg">
                                                <Icons.MessageCircle className="w-7 h-7 md:w-8 md:h-8 text-white" />
                                            </div>
                                            <span className="text-xs md:text-sm font-bold drop-shadow-lg">{video.commentsCount}</span>
                                        </button>

                                        <button onClick={() => handleShare(video)} className="flex flex-col items-center gap-1.5 group">
                                            <div className="p-3 md:p-3.5 rounded-full bg-black/40 backdrop-blur-md group-hover:bg-black/60 transition-all shadow-lg">
                                                <Icons.Share2 className="w-7 h-7 md:w-8 md:h-8 text-white" />
                                            </div>
                                            <span className="text-xs md:text-sm font-bold drop-shadow-lg">{video.sharesCount || 'Share'}</span>
                                        </button>
                                    </div>
                                </div>
                            </div >
                        </div >
                    ))
                )}
            </div >

            {/* Comments Drawer */}
            <AnimatePresence>
                {
                    commentsOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setCommentsOpen(false)}
                                className="absolute inset-0 bg-black/50 z-40"
                            />
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="absolute bottom-0 left-0 right-0 h-[60vh] bg-white text-black rounded-t-2xl z-50 flex flex-col md:max-w-md md:mx-auto"
                            >
                                <div className="p-4 border-b flex justify-between items-center">
                                    <h3 className="font-bold text-center flex-1">Comments</h3>
                                    <button onClick={() => setCommentsOpen(false)}>
                                        <Icons.X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {commentLoading ? (
                                        <div className="flex justify-center py-4">
                                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-black"></div>
                                        </div>
                                    ) : activeComments.length === 0 ? (
                                        <p className="text-center text-gray-500 py-8">No comments yet. Be the first!</p>
                                    ) : (
                                        activeComments.map(comment => (
                                            <div key={comment.id} className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-xs shrink-0">
                                                    {comment.userName?.[0] || 'U'}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm">
                                                        <span className="font-bold mr-2">{comment.userName || 'User'}</span>
                                                        {comment.content}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {new Date(comment.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="p-4 border-t bg-gray-50 pb-8 md:pb-4">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Add a comment..."
                                            className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-black"
                                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                                        />
                                        <button
                                            onClick={handleAddComment}
                                            disabled={!newComment.trim()}
                                            className="text-blue-600 font-bold text-sm disabled:opacity-50 px-2"
                                        >
                                            Post
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )
                }
            </AnimatePresence >
        </div >
    );
};

export default Play;
