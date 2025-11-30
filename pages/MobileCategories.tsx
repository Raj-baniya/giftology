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
            <div className="flex h-[calc(100vh-130px)] items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-130px)] bg-white">
            {/* Left Sidebar - Main Categories */}
            <div className="w-1/3 bg-gray-50 overflow-y-auto border-r border-gray-200 no-scrollbar">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat)}
                        className={`w-full p-4 text-left text-xs font-medium border-l-4 transition-all ${selectedCategory?.id === cat.id
                            ? 'bg-white border-primary text-primary shadow-sm'
                            : 'border-transparent text-gray-500 hover:bg-gray-100'
                            }`}
                    >
                        <div className="flex flex-col items-center gap-2 text-center">
                            {cat.imageUrl ? (
                                <img src={cat.imageUrl} alt={cat.name} className="w-10 h-10 rounded-full object-cover shadow-sm" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-200" />
                            )}
                            <span className="line-clamp-2">{cat.name}</span>
                        </div>
                    </button>
                ))}
            </div>

            {/* Right Content - Subcategories */}
            <div className="w-2/3 p-4 overflow-y-auto">
                <div className="mb-6 sticky top-0 bg-white z-10 pb-2 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">{selectedCategory?.name}</h2>
                    <p className="text-xs text-gray-500">Explore all {selectedCategory?.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-20">
                    {selectedCategory?.subcategories?.map((sub: any, index: number) => (
                        <div
                            key={sub.id || index}
                            onClick={() => navigate(`/shop?category=${selectedCategory.slug}&subcategory=${sub.slug}`)}
                            className="flex flex-col items-center gap-2 cursor-pointer group"
                        >
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 overflow-hidden shadow-sm group-hover:shadow-md transition-all">
                                {sub.imageUrl ? (
                                    <img src={sub.imageUrl} alt={sub.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xs">{sub.name[0]}</span>
                                )}
                            </div>
                            <span className="text-xs text-center text-gray-700 font-medium group-hover:text-primary transition-colors">{sub.name}</span>
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
