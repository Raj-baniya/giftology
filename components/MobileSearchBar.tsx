import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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
    const [isMenuOpen, setIsMenuOpen] = useState(false);
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

    // Lock body scroll when menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isMenuOpen]);

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
        const mockTerm = file.name.split('.')[0].replace(/[-_]/g, ' ');
        setQuery(mockTerm);
        saveRecentSearch(mockTerm);
        navigate(`/shop?search=${encodeURIComponent(mockTerm)}`);
        setShowCamera(false);
    };

    // Helper to handle link clicks and close drawer
    const handleLinkClick = () => {
        setIsMenuOpen(false);
    };

    return (
        <>
            {/* Side Drawer Overlay and Menu */}
            <div className={`fixed inset-0 bg-black/60 z-[999] transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMenuOpen(false)} />

            <div className={`fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[1000] shadow-2xl transition-transform duration-300 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Drawer Header */}
                <div className="p-5 flex justify-between items-center border-b border-gray-100 bg-[#9B1B30] text-white">
                    <div>
                        <h2 className="font-bold text-xl tracking-wide">Menu</h2>
                        <p className="text-xs text-white/80">Giftology</p>
                    </div>
                    <button onClick={() => setIsMenuOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                        <Icons.X className="w-6 h-6" />
                    </button>
                </div>

                {/* Navigation Links */}
                <div className="p-4 space-y-2 overflow-y-auto h-[calc(100%-80px)]">
                    <Link to="/" onClick={handleLinkClick} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 text-gray-700 font-medium transition-colors">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <Icons.Home className="w-4 h-4" />
                        </div>
                        <span className="text-sm">Home</span>
                    </Link>
                    <Link to="/account" onClick={handleLinkClick} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 text-gray-700 font-medium transition-colors">
                        <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                            <Icons.User className="w-4 h-4" />
                        </div>
                        <span className="text-sm">Account</span>
                    </Link>
                    <Link to="/cart" onClick={handleLinkClick} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 text-gray-700 font-medium transition-colors">
                        <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                            <Icons.ShoppingBag className="w-4 h-4" />
                        </div>
                        <span className="text-sm">Cart</span>
                    </Link>
                    <Link to="/categories" onClick={handleLinkClick} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 text-gray-700 font-medium transition-colors">
                        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                            <Icons.LayoutGrid className="w-4 h-4" />
                        </div>
                        <span className="text-sm">Categories</span>
                    </Link>

                    <div className="my-2 border-t border-gray-100"></div>

                    <a href="/#about-us" onClick={handleLinkClick} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 text-gray-700 font-medium transition-colors">
                        <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-pink-600">
                            <Icons.Info className="w-4 h-4" />
                        </div>
                        <span className="text-sm">About Us</span>
                    </a>
                    <a href="/#contact" onClick={handleLinkClick} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 text-gray-700 font-medium transition-colors">
                        <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                            <Icons.Phone className="w-4 h-4" />
                        </div>
                        <span className="text-sm">Contact Us</span>
                    </a>
                </div>
            </div>

            <div ref={searchRef} className="relative z-50 md:hidden sticky top-0 bg-white/95 backdrop-blur-md px-4 py-3 shadow-md border-b border-gray-100">
                <div className="flex items-center gap-3">
                    {/* Hamburger Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors order-first"
                    >
                        <Icons.Menu className="w-6 h-6" />
                    </button>

                    {showBackButton && (
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <Icons.ChevronLeft className="w-6 h-6" />
                        </button>
                    )}
                    <form onSubmit={handleSearch} className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Search for gifts..."
                            className="w-full py-2.5 pl-16 pr-20 !bg-white !text-black !placeholder-gray-500 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#E60000]/20 transition-all outline-none shadow-sm"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => setShowRecent(true)}
                        />
                        <Icons.Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />

                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <button
                                type="button"
                                onClick={handleVoiceSearch}
                                className={`p-1.5 rounded-full hover:bg-gray-100 transition-colors ${isListening ? 'text-[#E60000] animate-pulse' : 'text-gray-500'}`}
                            >
                                <Icons.Mic className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowCamera(true)}
                                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
                            >
                                <Icons.Camera className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </div>

                {/* Recent Searches Dropdown */}
                {showRecent && recentSearches.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 mx-4 z-50">
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                            Recent Searches
                        </div>
                        {recentSearches.map((term, index) => (
                            <button
                                key={index}
                                onClick={() => handleRecentClick(term)}
                                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-50 last:border-0 transition-colors"
                            >
                                <Icons.Clock className="w-3.5 h-3.5 text-gray-400" />
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
