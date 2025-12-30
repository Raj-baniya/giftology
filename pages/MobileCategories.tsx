import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { store } from '../services/store';

const MobileCategories = () => {
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const loadCategories = async () => {
            try {
                setLoading(true);
                const data = await store.getCategories();
                setCategories(data || []);
                if (data && data.length > 0) {
                    setSelectedCategory(data[0]);
                }
            } catch (error) {
                console.error('Failed to load categories', error);
            } finally {
                setLoading(false);
            }
        };
        loadCategories();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-130px)] items-center justify-center bg-transparent relative">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E60000] relative z-10"></div>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-130px)] bg-transparent relative overflow-hidden">

            {/* Left Sidebar - Main Categories */}
            <div className="w-1/3 bg-black/40 backdrop-blur-md overflow-y-auto border-r border-white/10 no-scrollbar relative z-10">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat)}
                        className={`w-full p-4 text-left transition-all border-l-4 ${selectedCategory?.id === cat.id
                            ? 'bg-white/10 border-[#E60000] shadow-[inset_0_0_15px_rgba(230,0,0,0.2)]'
                            : 'border-transparent hover:bg-white/5'
                            }`}
                    >
                        <div className="flex flex-col items-center gap-2 text-center">
                            <div className={`relative ${selectedCategory?.id === cat.id ? 'after:content-[""] after:absolute after:-inset-1 after:rounded-full after:border after:border-[#E60000]/50 after:animate-pulse' : ''}`}>
                                {cat.imageUrl ? (
                                    <img src={cat.imageUrl} alt={cat.name} className={`w-10 h-10 rounded-full object-cover shadow-sm transition-all ${selectedCategory?.id === cat.id ? 'scale-110 brightness-110 ring-2 ring-[#E60000]' : 'opacity-60'}`} />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-white/10" />
                                )}
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-tighter line-clamp-2 transition-all ${selectedCategory?.id === cat.id ? 'active-blood-sparkle scale-105' : 'text-gray-500'}`}>
                                {cat.name}
                            </span>
                        </div>
                    </button>
                ))}
            </div>

            {/* Right Content - Subcategories */}
            <div className="w-2/3 p-4 overflow-y-auto relative z-10">
                <div className="mb-6 sticky top-0 bg-black/60 backdrop-blur-md z-10 pb-2 border-b border-white/10">
                    <h2 className="text-xl font-black text-white uppercase tracking-widest active-blood-sparkle">{selectedCategory?.name}</h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Explore Premium Collection</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-20">
                    {selectedCategory?.subcategories?.map((sub: any, index: number) => (
                        <div
                            key={sub.id || index}
                            onClick={() => navigate(`/shop?category=${selectedCategory.slug}&subcategory=${sub.slug}`)}
                            className="flex flex-col items-center gap-2 cursor-pointer group"
                        >
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-gray-400 overflow-hidden border border-white/5 group-hover:border-[#E60000]/50 group-hover:shadow-[0_0_20px_rgba(230,0,0,0.3)] transition-all">
                                {sub.imageUrl ? (
                                    <img src={sub.imageUrl} alt={sub.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                                ) : (
                                    <span className="text-xs font-black">{sub.name[0]}</span>
                                )}
                            </div>
                            <span className="text-[10px] text-center text-gray-300 font-black uppercase tracking-tighter group-hover:active-blood-sparkle transition-colors">{sub.name}</span>
                        </div>
                    ))}

                    {/* Fallback if no subcategories */}
                    {(!selectedCategory?.subcategories || selectedCategory.subcategories.length === 0) && (
                        <div className="col-span-2 text-center text-gray-400 py-10">
                            No subcategories found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MobileCategories;
