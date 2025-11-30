import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { store } from '../services/store';
import { Product } from '../types';
import { CATEGORIES } from '../data/categories';
import { Icons } from '../components/ui/Icons';
import { CustomAlert, useCustomAlert } from '../components/CustomAlert';

export const AdminProductForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { alertState, showAlert, closeAlert } = useCustomAlert();
    const isEditing = !!id;

    // Loading States
    const [isLoading, setIsLoading] = useState(isEditing);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);

    // Feature Toggles
    const [hasColors, setHasColors] = useState(false);
    const [hasSizes, setHasSizes] = useState(false);

    // Variant Data
    const [colors, setColors] = useState<string[]>([]);
    const [sizes, setSizes] = useState<string[]>([]);
    const [sizeType, setSizeType] = useState<string>('UK');
    const [generatedVariants, setGeneratedVariants] = useState<any[]>([]);

    // Image Data
    const [colorImages, setColorImages] = useState<Record<string, string>>({});
    const [colorAdditionalImages, setColorAdditionalImages] = useState<Record<string, string>>({});

    // Temporary Inputs
    const [tempColor, setTempColor] = useState('');
    const [tempSize, setTempSize] = useState('');

    const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<Omit<Product, 'id'> & { additionalImages?: string }>({
        defaultValues: {
            name: '',
            price: 0,
            marketPrice: 0,
            costPrice: 0,
            description: '',
            imageUrl: '',
            category: '',
            subcategory: '',
            color: '',
            colorVariantGroup: '',
            trending: false,
            stock: 0,
            additionalImages: ''
        }
    });

    const selectedCategorySlug = watch('category');
    const selectedCategory = categories.find(c => c.slug === selectedCategorySlug);

    // --- Data Loading ---
    useEffect(() => {
        const loadData = async () => {
            try {
                setCategories(CATEGORIES);

                if (isEditing && id) {
                    const product = await store.getProductById(id);
                    if (!product) {
                        showAlert('Error', 'Product not found', 'error');
                        navigate('/admin');
                        return;
                    }

                    // 1. Set Basic Fields
                    setValue('name', product.name);
                    setValue('price', product.price);
                    setValue('marketPrice', product.marketPrice);
                    setValue('costPrice', product.costPrice);
                    setValue('category', product.category);
                    setValue('subcategory', product.subcategory || '');
                    setValue('color', product.color || '');
                    setValue('colorVariantGroup', product.colorVariantGroup || '');
                    setValue('imageUrl', product.imageUrl);
                    setValue('additionalImages', product.images?.slice(1).join(', ') || '');
                    setValue('description', product.description);
                    setValue('trending', product.trending || false);
                    setValue('stock', product.stock || 0);

                    // 2. Set Variant State
                    if (product.variants && product.variants.length > 0) {
                        const uniqueColors = Array.from(new Set(product.variants.map(v => v.color).filter(Boolean) as string[]));
                        const uniqueSizes = Array.from(new Set(product.variants.map(v => v.size).filter(Boolean) as string[]));

                        setHasColors(uniqueColors.length > 0);
                        setHasSizes(uniqueSizes.length > 0);
                        setColors(uniqueColors);
                        setSizes(uniqueSizes);

                        if (product.variants[0].size_type) {
                            setSizeType(product.variants[0].size_type);
                        }

                        setGeneratedVariants(product.variants.map(v => ({
                            ...v,
                            tempId: Math.random().toString(36).substr(2, 9)
                        })));

                        // Extract Images
                        const cImages: Record<string, string> = {};
                        const cAddImages: Record<string, string> = {};
                        uniqueColors.forEach(color => {
                            const variant = product.variants?.find(v => v.color === color);
                            if (variant?.images?.length) {
                                cImages[color] = variant.images[0];
                                cAddImages[color] = variant.images.slice(1).join(', ');
                            }
                        });
                        setColorImages(cImages);
                        setColorAdditionalImages(cAddImages);
                    }
                }
            } catch (e) {
                console.error(e);
                showAlert('Error', 'Failed to load data', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [id, isEditing, navigate, setValue, showAlert]);

    // --- Variant Logic ---

    const handleGenerateVariants = () => {
        const newVariants: any[] = [];

        // Helper to find existing variant to preserve stock/id
        const findExisting = (c?: string, s?: string) => {
            return generatedVariants.find(v => v.color === c && v.size === s);
        };

        if (hasColors && hasSizes) {
            colors.forEach(color => {
                sizes.forEach(size => {
                    const existing = findExisting(color, size);
                    newVariants.push(existing || {
                        color,
                        size,
                        stock_quantity: 0,
                        tempId: Math.random().toString(36).substr(2, 9)
                    });
                });
            });
        } else if (hasColors) {
            colors.forEach(color => {
                const existing = findExisting(color, undefined);
                newVariants.push(existing || {
                    color,
                    stock_quantity: 0,
                    tempId: Math.random().toString(36).substr(2, 9)
                });
            });
        } else if (hasSizes) {
            sizes.forEach(size => {
                const existing = findExisting(undefined, size);
                newVariants.push(existing || {
                    size,
                    stock_quantity: 0,
                    tempId: Math.random().toString(36).substr(2, 9)
                });
            });
        }

        setGeneratedVariants(newVariants);
    };

    // Auto-update total stock when variants change
    useEffect(() => {
        if ((hasColors || hasSizes) && generatedVariants.length > 0) {
            const total = generatedVariants.reduce((sum, v) => sum + (Number(v.stock_quantity) || 0), 0);
            setValue('stock', total);
        }
    }, [generatedVariants, hasColors, hasSizes, setValue]);

    // Auto-update main image from first color
    useEffect(() => {
        if (hasColors && colors.length > 0 && colorImages[colors[0]]) {
            setValue('imageUrl', colorImages[colors[0]]);
        }
    }, [colorImages, colors, hasColors, setValue]);


    // --- Handlers ---

    const addColor = () => {
        if (tempColor && !colors.includes(tempColor)) {
            setColors([...colors, tempColor]);
            setTempColor('');
        }
    };

    const removeColor = (color: string) => {
        setColors(colors.filter(c => c !== color));
        // Also remove from generated variants? No, let user regenerate.
    };

    const addSize = () => {
        if (tempSize && !sizes.includes(tempSize)) {
            setSizes([...sizes, tempSize]);
            setTempSize('');
        }
    };

    const removeSize = (size: string) => {
        setSizes(sizes.filter(s => s !== size));
    };

    const onSubmit = async (data: any) => {
        try {
            setIsSubmitting(true);

            // Prepare Variants
            let finalVariants: any[] = [];
            if (hasColors || hasSizes) {
                finalVariants = generatedVariants.map(v => ({
                    color: hasColors ? v.color : undefined,
                    size: hasSizes ? v.size : undefined,
                    size_type: hasSizes ? sizeType : undefined,
                    stock_quantity: Number(v.stock_quantity),
                    images: (hasColors && v.color) ? [
                        colorImages[v.color] || data.imageUrl,
                        ...(colorAdditionalImages[v.color] ? colorAdditionalImages[v.color].split(',').map(u => u.trim()).filter(Boolean) : [])
                    ] : [data.imageUrl]
                }));
            }

            const productData = {
                ...data,
                price: Number(data.price),
                marketPrice: data.marketPrice ? Number(data.marketPrice) : undefined,
                costPrice: data.costPrice ? Number(data.costPrice) : undefined,
                stock: Number(data.stock),
                trending: Boolean(data.trending),
                images: [
                    data.imageUrl,
                    ...(data.additionalImages ? data.additionalImages.split(',').map((u: string) => u.trim()).filter(Boolean) : [])
                ],
                variants: finalVariants
            };

            if (isEditing && id) {
                await store.updateProduct(id, productData);
                showAlert('Success', 'Product updated successfully!', 'success');
            } else {
                await store.addProduct(productData);
                showAlert('Success', 'Product created successfully!', 'success');
            }

            setTimeout(() => navigate('/admin'), 1500);
        } catch (error: any) {
            console.error("Save error:", error);
            showAlert('Error', error.message || 'Failed to save product', 'error');
        } finally {
            setIsSubmitting(false);
        }
        if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

        return (
            <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
                <div className="max-w-4xl mx-auto pt-4 md:pt-8 px-2 md:px-4">
                    <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6 px-2">
                        <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                            <Icons.ChevronLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-xl md:text-2xl font-bold">{isEditing ? 'Edit Product' : 'Add New Product'}</h1>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 md:space-y-8">

                            {/* Basic Info */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold border-b pb-2">Basic Information</h3>
                                <div>
                                    <label className="block text-sm font-bold mb-1.5">Product Name</label>
                                    <input {...register('name', { required: 'Name is required' })} className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-black outline-none text-base" placeholder="e.g. Tropical Trekker Low" />
                                    {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold mb-1.5">Category</label>
                                        <select
                                            {...register('category', { required: 'Category is required' })}
                                            onChange={(e) => {
                                                register('category').onChange(e);
                                                setValue('subcategory', '');
                                            }}
                                            className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-black outline-none bg-white text-base"
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map(cat => <option key={cat.id} value={cat.slug}>{cat.name}</option>)}
                                        </select>
                                        {errors.category && <span className="text-red-500 text-xs">{errors.category.message}</span>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-1.5">Subcategory</label>
                                        <select
                                            {...register('subcategory')}
                                            className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-black outline-none bg-white text-base"
                                            disabled={!selectedCategory?.subcategories?.length}
                                        >
                                            <option value="">Select Subcategory</option>
                                            {selectedCategory?.subcategories?.map((sub: any) => (
                                                <option key={sub.slug} value={sub.slug}>{sub.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold mb-1.5">Price (₹)</label>
                                        <input type="number" {...register('price', { required: true, min: 0 })} className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-black outline-none text-base" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-1.5">Market Price (₹)</label>
                                        <input type="number" {...register('marketPrice', { min: 0 })} className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-black outline-none text-base" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-1.5">Cost Price (₹) <span className="text-xs font-normal text-gray-500">(Admin)</span></label>
                                        <input type="number" {...register('costPrice', { min: 0 })} className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-black outline-none bg-gray-50 text-base" />
                                    </div>
                                </div>
                            </div>

                            {/* Variants */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold border-b pb-2">Variants & Stock</h3>

                                <div className="flex gap-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={hasColors} onChange={(e) => setHasColors(e.target.checked)} className="w-5 h-5 accent-black" />
                                        <span className="font-medium">Has Colors</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={hasSizes} onChange={(e) => setHasSizes(e.target.checked)} className="w-5 h-5 accent-black" />
                                        <span className="font-medium">Has Sizes</span>
                                    </label>
                                </div>

                                {/* Colors Input */}
                                {hasColors && (
                                    <div className="bg-gray-50 p-4 rounded-lg border">
                                        <label className="block text-sm font-bold mb-2">Colors</label>
                                        <div className="flex gap-2 mb-3">
                                            <input
                                                value={tempColor}
                                                onChange={(e) => setTempColor(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
                                                placeholder="Type color and press Enter"
                                                className="flex-1 border rounded p-2 text-base"
                                            />
                                            <button type="button" onClick={addColor} className="bg-black text-white px-4 py-2 rounded font-bold">Add</button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {colors.map(c => (
                                                <span key={c} className="bg-white border px-3 py-1 rounded-full text-sm flex items-center gap-2 shadow-sm">
                                                    {c} <button type="button" onClick={() => removeColor(c)} className="hover:text-red-500"><Icons.X className="w-3 h-3" /></button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Sizes Input */}
                                {hasSizes && (
                                    <div className="bg-gray-50 p-4 rounded-lg border">
                                        <label className="block text-sm font-bold mb-2">Sizes</label>
                                        <div className="flex gap-2 mb-3">
                                            <select value={sizeType} onChange={(e) => setSizeType(e.target.value)} className="border rounded p-2 bg-white text-base">
                                                <option value="UK">UK</option>
                                                <option value="US">US</option>
                                                <option value="EU">EU</option>
                                                <option value="S/M/L">S/M/L</option>
                                            </select>
                                            <input
                                                value={tempSize}
                                                onChange={(e) => setTempSize(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
                                                placeholder="Type size and press Enter"
                                                className="flex-1 border rounded p-2 text-base"
                                            />
                                            <button type="button" onClick={addSize} className="bg-black text-white px-4 py-2 rounded font-bold">Add</button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {sizes.map(s => (
                                                <span key={s} className="bg-white border px-3 py-1 rounded-full text-sm flex items-center gap-2 shadow-sm">
                                                    {s} <button type="button" onClick={() => removeSize(s)} className="hover:text-red-500"><Icons.X className="w-3 h-3" /></button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Generate Button */}
                                {(hasColors || hasSizes) && (
                                    <button
                                        type="button"
                                        onClick={handleGenerateVariants}
                                        className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors"
                                    >
                                        Generate Variants Table
                                    </button>
                                )}

                                {/* Variants Table */}
                                {generatedVariants.length > 0 && (hasColors || hasSizes) && (
                                    <div className="border rounded-lg overflow-hidden">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="p-3">Variant</th>
                                                    <th className="p-3">Stock</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {generatedVariants.map((v, idx) => (
                                                    <tr key={v.tempId || idx} className="bg-white">
                                                        <td className="p-3 font-medium">
                                                            {v.color} {v.size ? `- ${v.size}` : ''}
                                                        </td>
                                                        <td className="p-3">
                                                            <input
                                                                type="number"
                                                                value={v.stock_quantity}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    setGeneratedVariants(prev => prev.map((item, i) =>
                                                                        i === idx ? { ...item, stock_quantity: val } : item
                                                                    ));
                                                                }}
                                                                className="border rounded p-1 w-24 text-base"
                                                                min="0"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Global Stock (if no variants) */}
                                {!hasColors && !hasSizes && (
                                    <div>
                                        <label className="block text-sm font-bold mb-1.5">Total Stock</label>
                                        <input type="number" {...register('stock', { min: 0 })} className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-black outline-none text-base" />
                                    </div>
                                )}
                            </div>

                            {/* Images */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold border-b pb-2">Images</h3>

                                {!hasColors && (
                                    <div>
                                        <label className="block text-sm font-bold mb-1.5">Main Image URL</label>
                                        <input {...register('imageUrl', { required: !hasColors })} className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-black outline-none text-base" placeholder="https://..." />
                                    </div>
                                )}

                                {hasColors && colors.length > 0 && (
                                    <div className="space-y-4">
                                        {colors.map((color, idx) => (
                                            <div key={color} className="border p-4 rounded-lg bg-gray-50">
                                                <h4 className="font-bold mb-2 flex items-center gap-2">
                                                    <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: color.toLowerCase() }}></span>
                                                    {color} Images
                                                </h4>
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500 uppercase">Main Image (Required)</label>
                                                        <input
                                                            value={colorImages[color] || ''}
                                                            onChange={(e) => setColorImages({ ...colorImages, [color]: e.target.value })}
                                                            className="w-full border rounded p-2 text-sm text-base"
                                                            placeholder="Main image URL"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500 uppercase">Additional Images (Optional)</label>
                                                        <input
                                                            value={colorAdditionalImages[color] || ''}
                                                            onChange={(e) => setColorAdditionalImages({ ...colorAdditionalImages, [color]: e.target.value })}
                                                            className="w-full border rounded p-2 text-sm text-base"
                                                            placeholder="Comma separated URLs"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {!hasColors && (
                                    <div>
                                        <label className="block text-sm font-bold mb-1.5">Additional Images</label>
                                        <textarea {...register('additionalImages')} className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-black outline-none text-base" rows={3} placeholder="Comma separated URLs" />
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-bold mb-1.5">Description</label>
                                <textarea {...register('description')} className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-black outline-none text-base" rows={5} />
                            </div>

                            {/* Extra */}
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="trending" {...register('trending')} className="w-5 h-5 accent-black" />
                                <label htmlFor="trending" className="font-bold cursor-pointer">Mark as Trending</label>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-4 pt-6 border-t">
                                <button type="button" onClick={() => navigate('/admin')} className="px-6 py-3 rounded-xl font-bold border hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50">
                                    {isSubmitting ? 'Saving...' : 'Save Product'}
                                </button>
                            </div>

                        </form>
                    </div>
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
            </div>
        );
    };
