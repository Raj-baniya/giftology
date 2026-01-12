import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { CameraSearch } from './CameraSearch';

const MobileSearchBar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [query, setQuery] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [showRecent, setShowRecent] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const searchRef = useRef<HTMLDivElement>(null);

    // Check if we should show the back button
    const showBackButton = location.pathname !== '/' && !location.pathname.startsWith('/admin');

    useEffect(() => {
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            setRecentSearches(JSON.parse(saved));
        }

        // Click outside to close recent searches
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowRecent(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const saveRecentSearch = (term: string) => {
        if (!term.trim()) return;
        const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            saveRecentSearch(query);
            navigate(`/shop?search=${encodeURIComponent(query)}`);
            setShowRecent(false);
        }
    };

    const handleRecentClick = (term: string) => {
        setQuery(term);
        saveRecentSearch(term);
        navigate(`/shop?search=${encodeURIComponent(term)}`);
        setShowRecent(false);
    };

    const handleVoiceSearch = () => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setQuery(transcript);
                saveRecentSearch(transcript);
                navigate(`/shop?search=${encodeURIComponent(transcript)}`);
            };

            recognition.start();
        } else {
            alert('Voice search is not supported in this browser.');
        }
    };

    const handleCameraSearch = (file: File) => {
        // In a real app, you would upload this file to an API to get search terms
        // For now, we'll just use the filename as a mock search
        const mockTerm = file.name.split('.')[0].replace(/[-_]/g, ' ');
        setQuery(mockTerm);
        saveRecentSearch(mockTerm);
        navigate(`/shop?search=${encodeURIComponent(mockTerm)}`);
        setShowCamera(false);
    };

    return (
        <>
            <div ref={searchRef} className="relative z-50 md:hidden sticky top-0 bg-black/80 backdrop-blur-md px-4 py-3 shadow-lg border-b border-white/10">
                <div className="flex items-center gap-3">
                    {showBackButton && (
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors"
                        >
                            <Icons.ChevronLeft className="w-6 h-6" />
                        </button>
                    )}
                    <form onSubmit={handleSearch} className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Search for gifts..."
                            className="w-full py-2.5 pl-10 pr-20 bg-white/10 border border-white/5 rounded-xl text-sm text-white placeholder:text-gray-500 focus:ring-2 focus:ring-[#E60000]/50 transition-all outline-none"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => setShowRecent(true)}
                        />
                        <Icons.Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />

                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <button
                                type="button"
                                onClick={handleVoiceSearch}
                                className={`p-1.5 rounded-full hover:bg-white/10 transition-colors ${isListening ? 'text-[#E60000] animate-pulse' : 'text-gray-400'}`}
                            >
                                <Icons.Mic className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowCamera(true)}
                                className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-gray-400"
                            >
                                <Icons.Camera className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </div>

                {/* Recent Searches Dropdown */}
                {showRecent && recentSearches.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] rounded-xl shadow-2xl border border-white/10 overflow-hidden animate-in fade-in slide-in-from-top-2 mx-4 z-50">
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white/5">
                            Recent Searches
                        </div>
                        {recentSearches.map((term, index) => (
                            <button
                                key={index}
                                onClick={() => handleRecentClick(term)}
                                className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-3 border-b border-white/5 last:border-0 transition-colors"
                            >
                                <Icons.Clock className="w-3.5 h-3.5 text-gray-600" />
                                {term}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Camera Search Overlay */}
            {showCamera && (
                <CameraSearch
                    onClose={() => setShowCamera(false)}
                    onSearch={handleCameraSearch}
                />
            )}
        </>
    );
};

export default MobileSearchBar;
