import React, { useState, useEffect } from 'react';
import { Icons } from '../components/ui/Icons';
import { store } from '../services/store';
import { CustomAlert, useCustomAlert } from '../components/CustomAlert';

interface Category {
    id: string;
    name: string;
    slug: string;
    image_url?: string;
    subcategories?: Subcategory[];
}

interface Subcategory {
    id: string;
    category_id: string;
    name: string;
    slug: string;
    image_url?: string;
}

export const CategoryManagement = () => {
    const { alertState, showAlert, closeAlert } = useCustomAlert();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    // Form state
    const [categoryForm, setCategoryForm] = useState({ name: '', slug: '', image_url: '' });
    const [subcategoryForm, setSubcategoryForm] = useState({ name: '', slug: '', image_url: '', category_id: '' });

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            setLoading(true);
            console.log('=== CATEGORY LOAD START ===');
            console.log('Calling store.getCategories()...');

            const data = await store.getCategories();

            console.log('=== CATEGORY LOAD RESULT ===');
            console.log('Data received:', data);
            console.log('Is array?', Array.isArray(data));
            console.log('Length:', data?.length || 0);
            console.log('First category:', data?.[0]);

            if (!data || data.length === 0) {
                console.warn('⚠️ No categories returned from database');
                showAlert('Info', 'No categories found in database. You may need to seed categories.', 'info');
            }

            setCategories(data || []);
            console.log('Categories state updated');
        } catch (error) {
            console.error('❌ ERROR loading categories:', error);
            console.error('Error details:', {
                name: (error as any)?.name,
                message: (error as any)?.message,
                stack: (error as any)?.stack
            });
            showAlert('Error', `Failed to load categories: ${(error as any)?.message || 'Unknown error'}`, 'error');
        } finally {
            setLoading(false);
            console.log('=== CATEGORY LOAD END ===');
        }
    };

    const handleAddCategory = () => {
        setSelectedCategory(null);
        setCategoryForm({ name: '', slug: '', image_url: '' });
        setShowCategoryModal(true);
    };

    const handleEditCategory = (category: Category) => {
        setSelectedCategory(category);
        setCategoryForm({
            name: category.name,
            slug: category.slug,
            image_url: category.image_url || ''
        });
        setShowCategoryModal(true);
    };

    const handleSaveCategory = async () => {
        try {
            if (!categoryForm.name || !categoryForm.slug) {
                showAlert('Error', 'Name and slug are required', 'error');
                return;
            }

            if (selectedCategory) {
                await store.updateCategory(selectedCategory.id, categoryForm);
                showAlert('Success', 'Category updated successfully!', 'success');
            } else {
                await store.addCategory(categoryForm);
                showAlert('Success', 'Category created successfully!', 'success');
            }
            setShowCategoryModal(false);
            loadCategories();
        } catch (error: any) {
            showAlert('Error', error.message || 'Failed to save category', 'error');
        }
    };

    const handleDeleteCategory = async (id: string, name: string) => {
        showAlert(
            'Confirm Delete',
            `Are you sure you want to delete "${name}"? This will also delete all subcategories.`,
            'warning',
            {
                confirmText: 'Delete',
                onConfirm: async () => {
                    try {
                        await store.deleteCategory(id);
                        showAlert('Success', 'Category deleted successfully!', 'success');
                        loadCategories();
                    } catch (error: any) {
                        showAlert('Error', error.message || 'Failed to delete category', 'error');
                    }
                },
                cancelText: 'Cancel'
            }
        );
    };

    const handleAddSubcategory = (categoryId: string) => {
        setSelectedSubcategory(null);
        const category = categories.find(c => c.id === categoryId);
        setSubcategoryForm({ name: '', slug: '', image_url: '', category_id: categoryId });
        setShowSubcategoryModal(true);
    };

    const handleEditSubcategory = (subcategory: Subcategory) => {
        setSelectedSubcategory(subcategory);
        setSubcategoryForm({
            name: subcategory.name,
            slug: subcategory.slug,
            image_url: subcategory.image_url || '',
            category_id: subcategory.category_id
        });
        setShowSubcategoryModal(true);
    };

    const handleSaveSubcategory = async () => {
        try {
            if (!subcategoryForm.name || !subcategoryForm.slug) {
                showAlert('Error', 'Name and slug are required', 'error');
                return;
            }

            if (selectedSubcategory) {
                await store.updateSubcategory(selectedSubcategory.id, subcategoryForm);
                showAlert('Success', 'Subcategory updated successfully!', 'success');
            } else {
                await store.addSubcategory(subcategoryForm);
                showAlert('Success', 'Subcategory created successfully!', 'success');
            }
            setShowSubcategoryModal(false);
            loadCategories();
        } catch (error: any) {
            showAlert('Error', error.message || 'Failed to save subcategory', 'error');
        }
    };

    const handleDeleteSubcategory = async (id: string, name: string) => {
        showAlert(
            'Confirm Delete',
            `Are you sure you want to delete subcategory "${name}"?`,
            'warning',
            {
                confirmText: 'Delete',
                onConfirm: async () => {
                    try {
                        await store.deleteSubcategory(id);
                        showAlert('Success', 'Subcategory deleted successfully!', 'success');
                        loadCategories();
                    } catch (error: any) {
                        showAlert('Error', error.message || 'Failed to delete subcategory', 'error');
                    }
                },
                cancelText: 'Cancel'
            }
        );
    };

    const handleSeedCategories = async () => {
        try {
            setLoading(true);
            await store.seedCategories();
            showAlert('Success', 'Categories seeded successfully!', 'success');
            await loadCategories();
        } catch (error: any) {
            showAlert('Error', error.message || 'Failed to seed categories', 'error');
        } finally {
            setLoading(false);
        }
    };

    const generateSlug = (name: string) => {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Category Management</h2>
                <button onClick={handleAddCategory} className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center gap-2">
                    <Icons.Plus className="w-5 h-5" />
                    Add Category
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
                </div>
            ) : (
                /* Categories List */
                <div className="space-y-4">
                    {categories.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                            <Icons.Folder className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-gray-900 mb-2">No Categories Found</h3>
                            <p className="text-gray-500 mb-6">Get started by adding a new category or seeding defaults.</p>
                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={() => setShowCategoryModal(true)}
                                    className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors"
                                >
                                    <Icons.Plus className="w-4 h-4 inline-block mr-2" />
                                    Add Category
                                </button>
                                <button
                                    onClick={handleSeedCategories}
                                    className="bg-white text-gray-700 border border-gray-300 px-6 py-2 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                                >
                                    <Icons.RefreshCw className="w-4 h-4 inline-block mr-2" />
                                    Seed Defaults
                                </button>
                            </div>
                        </div>
                    ) : (
                        categories.map((category) => (
                            <div key={category.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                {/* Category Header */}
                                <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}>
                                        <button
                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            {expandedCategory === category.id ? <Icons.ChevronDown className="w-5 h-5" /> : <Icons.ChevronRight className="w-5 h-5" />}
                                        </button>
                                        {category.image_url && (
                                            <img src={category.image_url} alt={category.name} className="w-16 h-16 object-cover rounded-lg" />
                                        )}
                                        <div>
                                            <h3 className="font-bold text-lg">{category.name}</h3>
                                            <p className="text-sm text-gray-500">Slug: {category.slug} | {category.subcategories?.length || 0} subcategories</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleAddSubcategory(category.id)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors" title="Add Subcategory">
                                            <Icons.Plus className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleEditCategory(category)} className="p-2 hover:bg-yellow-50 text-yellow-600 rounded-lg transition-colors" title="Edit">
                                            <Icons.Edit2 className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDeleteCategory(category.id, category.name)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors" title="Delete">
                                            <Icons.Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Subcategories */}
                                {expandedCategory === category.id && (
                                    <div className="border-t border-gray-200 bg-gray-50 p-4">
                                        {category.subcategories && category.subcategories.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {category.subcategories.map((sub) => (
                                                    <div key={sub.id} className="bg-white rounded-lg p-3 flex items-center justify-between shadow-sm">
                                                        <div className="flex items-center gap-3">
                                                            {sub.image_url && <img src={sub.image_url} alt={sub.name} className="w-12 h-12 object-cover rounded" />}
                                                            <div>
                                                                <p className="font-semibold">{sub.name}</p>
                                                                <p className="text-xs text-gray-500">{sub.slug}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <button onClick={() => handleEditSubcategory(sub)} className="p-1.5 hover:bg-yellow-50 text-yellow-600 rounded" title="Edit">
                                                                <Icons.Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => handleDeleteSubcategory(sub.id, sub.name)} className="p-1.5 hover:bg-red-50 text-red-600 rounded" title="Delete">
                                                                <Icons.Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 text-center py-4">No subcategories. Click + to add one.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Category Modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4">{selectedCategory ? 'Edit Category' : 'New Category'}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">Name *</label>
                                <input
                                    type="text"
                                    value={categoryForm.name}
                                    onChange={(e) => {
                                        setCategoryForm({ ...categoryForm, name: e.target.value, slug: generateSlug(e.target.value) });
                                    }}
                                    className="w-full border rounded-lg p-2"
                                    placeholder="For Him"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Slug *</label>
                                <input
                                    type="text"
                                    value={categoryForm.slug}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                    placeholder="for-him"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Image URL</label>
                                <input
                                    type="url"
                                    value={categoryForm.image_url}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, image_url: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                    placeholder="https://..."
                                />
                            </div>

                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowCategoryModal(false)} className="flex-1 px-4 py-2 border rounded-lg font-bold hover:bg-gray-50">Cancel</button>
                            <button onClick={handleSaveCategory} className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-bold hover:bg-gray-800">Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Subcategory Modal */}
            {showSubcategoryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4">{selectedSubcategory ? 'Edit Subcategory' : 'New Subcategory'}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">Name *</label>
                                <input
                                    type="text"
                                    value={subcategoryForm.name}
                                    onChange={(e) => {
                                        setSubcategoryForm({ ...subcategoryForm, name: e.target.value, slug: generateSlug(e.target.value) });
                                    }}
                                    className="w-full border rounded-lg p-2"
                                    placeholder="Watches"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Slug *</label>
                                <input
                                    type="text"
                                    value={subcategoryForm.slug}
                                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, slug: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                    placeholder="watches"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Image URL</label>
                                <input
                                    type="url"
                                    value={subcategoryForm.image_url}
                                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, image_url: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                    placeholder="https://..."
                                />
                            </div>

                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowSubcategoryModal(false)} className="flex-1 px-4 py-2 border rounded-lg font-bold hover:bg-gray-50">Cancel</button>
                            <button onClick={handleSaveSubcategory} className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-bold hover:bg-gray-800">Save</button>
                        </div>
                    </div>
                </div>
            )}

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
        </div>
    );
};
