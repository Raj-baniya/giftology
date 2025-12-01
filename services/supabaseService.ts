import { supabase } from './supabaseClient';
import { INITIAL_PRODUCTS, CATEGORIES, SUBCATEGORIES } from './mockData';

// Types
export interface Product {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    market_price?: number;
    sale_price?: number;
    stock_quantity: number;
    images: string[];
    category_id: string;
    is_featured: boolean;
    is_active: boolean;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    image_url?: string;
    parent_id?: string | null;
}

export interface ContactMessage {
    name: string;
    email?: string;
    phone?: string;
    message?: string;
    source?: string;
}

// --- Products ---

export const getProducts = async () => {
    const { data, error } = await supabase
        .from('products')
        .select('*, categories(name, slug), product_variants(*), reviews(rating, is_approved)')
        // .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
    console.log('Fetched products:', data);
    return data || [];
};

export const getAdminProducts = async () => {
    console.log('Fetching admin products...');
    const { data, error } = await supabase
        .from('products')
        .select('*, categories(name, slug), product_variants(*)')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching admin products:', error);
        throw error;
    }
    console.log('Fetched admin products:', data?.length);
    return data || [];
};

export const getFeaturedProducts = async () => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_featured', true)
        .eq('is_active', true)
        .limit(8);

    if (error) {
        console.error('Error fetching featured products:', error);
        return [];
    }
    return data;
};

export const getProductBySlug = async (slug: string) => {
    const { data, error } = await supabase
        .from('products')
        .select('*, categories(name, slug), product_variants(*)')
        .eq('slug', slug)
        .single();

    if (error) {
        console.error('Error fetching product:', error);
        return null;
    }
    return data;
};

export const getProductsByVariantGroup = async (groupId: string) => {
    const { data, error } = await supabase
        .from('products')
        .select(`
            *,
            categories:category_id (name, slug),
            product_variants (*)
        `)
        .eq('color_variant_group', groupId)
        .eq('is_active', true);

    if (error) {
        console.error('Error fetching variant group products:', error);
        return [];
    }
    return data;
};

export const getProductById = async (id: string) => {
    const { data, error } = await supabase
        .from('products')
        .select('*, categories(name, slug), product_variants(*)')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching product by ID:', error);
        return null;
    }
    return data;
};

// --- Categories ---

export const getCategories = async () => {
    const { data, error } = await supabase
        .from('categories')
        .select(`
            *,
            subcategories (*)
        `)
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
    return data;
};

export const getCategoryById = async (id: string) => {
    const { data, error } = await supabase
        .from('categories')
        .select('*, subcategories(*)')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching category:', error);
        return null;
    }
    return data;
};

export const addCategory = async (category: any) => {
    const { data, error } = await supabase
        .from('categories')
        .insert([category])
        .select()
        .single();

    if (error) {
        console.error('Error adding category:', error);
        throw error;
    }
    return data;
};

export const updateCategory = async (id: string, updates: any) => {
    const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating category:', error);
        throw error;
    }
    return data;
};

export const deleteCategory = async (id: string) => {
    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting category:', error);
        throw error;
    }
};

export const addSubcategory = async (subcategory: any) => {
    const { data, error } = await supabase
        .from('subcategories')
        .insert([subcategory])
        .select()
        .single();

    if (error) {
        console.error('Error adding subcategory:', error);
        throw error;
    }
    return data;
};

export const updateSubcategory = async (id: string, updates: any) => {
    const { data, error } = await supabase
        .from('subcategories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating subcategory:', error);
        throw error;
    }
    return data;
};

export const deleteSubcategory = async (id: string) => {
    const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting subcategory:', error);
        throw error;
    }
};
// --- Contact / Mobile Submissions ---

export const submitContactMessage = async (messageData: ContactMessage) => {
    const { data, error } = await supabase
        .from('contact_messages')
        .insert([messageData])
        .select();

    if (error) {
        console.error('Error submitting message:', error);
        return { success: false, error };
    }
    return { success: true, data };
};

// --- Orders ---

export const createOrder = async (orderData: any, orderItems: any[]) => {
    // 1. Add giftWrapping and deliverySpeed to orderData if present
    const enrichedOrderData = {
        ...orderData,
        gift_wrapping: orderData.gift_wrapping || orderData.giftWrapping || 'none',
        delivery_speed: orderData.delivery_speed || orderData.deliverySpeed || 'standard'
    };

    // 1. Create the order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([enrichedOrderData])
        .select()
        .single();

    if (orderError) {
        console.error('Error creating order:', orderError);
        return { success: false, error: orderError };
    }

    // 2. Prepare order items with the new order_id and include variant details
    const itemsWithOrderId = orderItems.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        selected_size: item.selectedSize,
        selected_color: item.selectedColor
    }));

    // 3. Insert order items
    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsWithOrderId);

    if (itemsError) {
        console.error('Error creating order items:', itemsError);
        // Ideally, you would rollback the order here (or use a stored procedure/RPC)
        return { success: false, error: itemsError };
    }

    return { success: true, order };
};

// --- Admin Functions ---

export const getAdminOrders = async () => {
    const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(name, images))')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching admin orders:', error);
        return [];
    }
    return data;
};

export const getUserOrders = async (userId: string) => {
    const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(name, images))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching user orders:', error);
        return [];
    }
    return data;
};

export const getContactMessages = async () => {
    const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching contact messages:', error);
        return [];
    }
    return data;
};

// --- Admin Product Management ---

export const addProduct = async (product: any) => {
    // Generate a slug if not provided
    const slug = product.slug || product.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    // Map frontend product structure to DB structure
    // Note: After running the schema.sql migration, color_variant_group and subcategory will be available
    const dbProduct: any = {
        name: product.name,
        slug: slug,
        description: product.description,
        price: product.price,
        market_price: product.marketPrice,
        cost_price: product.costPrice,
        stock_quantity: product.stock !== undefined ? product.stock : 100,
        images: product.images || [product.imageUrl],
        category_id: product.category_id,
        subcategory: product.subcategory,
        is_featured: product.trending || false,
        is_active: true,
        variants: product.variants || []
    };

    // Add color_variant_group if provided (requires schema migration)
    if (product.colorVariantGroup) {
        dbProduct.color_variant_group = product.colorVariantGroup;
    }
    // If category_id is missing but category slug is present, fetch category_id
    if (!dbProduct.category_id && product.category) {
        const { data: cat } = await supabase.from('categories').select('id').eq('slug', product.category).single();
        if (cat) dbProduct.category_id = cat.id;
    }

    const { data, error } = await supabase
        .from('products')
        .insert([dbProduct])
        .select()
        .single();

    if (error) {
        console.error('Error adding product:', error);
        throw error;
    }

    // Insert variants into product_variants table if provided
    if (product.variants && product.variants.length > 0 && data.id) {
        const variantsData = product.variants.map((v: any) => ({
            product_id: data.id,
            color: v.color,
            size: v.size,
            size_type: v.size_type,
            stock_quantity: v.stock_quantity,
            images: v.images || []
        }));

        const { error: variantError } = await supabase
            .from('product_variants')
            .insert(variantsData);

        if (variantError) {
            console.error('Error adding product variants:', variantError);
            // Don't throw - product was created successfully
        }
    }

    return data;
};

export const updateProduct = async (id: string, updates: any) => {
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.description) dbUpdates.description = updates.description;
    if (updates.price) dbUpdates.price = updates.price;
    if (updates.marketPrice) dbUpdates.market_price = updates.marketPrice;
    if (updates.costPrice) dbUpdates.cost_price = updates.costPrice;
    if (updates.images) dbUpdates.images = updates.images;
    else if (updates.imageUrl) dbUpdates.images = [updates.imageUrl];
    if (updates.trending !== undefined) dbUpdates.is_featured = updates.trending;
    if (updates.trending !== undefined) dbUpdates.is_featured = updates.trending;
    if (updates.stock !== undefined) dbUpdates.stock_quantity = updates.stock;
    if (updates.variants) dbUpdates.variants = updates.variants;

    // Resolve category slug to ID if category is updated
    if (updates.category) {
        const { data: cat } = await supabase.from('categories').select('id').eq('slug', updates.category).single();
        if (cat) {
            dbUpdates.category_id = cat.id;
        }
    }
    if (updates.subcategory) dbUpdates.subcategory = updates.subcategory;
    // Add color_variant_group if provided (requires schema migration)
    if (updates.colorVariantGroup) dbUpdates.color_variant_group = updates.colorVariantGroup;

    const { data, error } = await supabase
        .from('products')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating product:', error);
        throw error;
    }

    // Update Variants if provided
    if (updates.variants) {
        // First delete existing variants (simple strategy for now)
        // A better strategy would be to diff and update, but for this MVP, replace is safer
        await supabase.from('product_variants').delete().eq('product_id', id);

        if (updates.variants.length > 0) {
            const variantsData = updates.variants.map((v: any) => ({
                product_id: id,
                color: v.color,
                size: v.size,
                size_type: v.size_type,
                stock_quantity: v.stock_quantity,
                images: v.images
            }));

            const { error: variantError } = await supabase
                .from('product_variants')
                .insert(variantsData);

            if (variantError) {
                console.error('Error updating variants:', variantError);
            }
        }
    }

    return data;
};

export const deleteProduct = async (id: string) => {
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting product:', error);
        throw error;
    }
};

export const updateOrderStatus = async (id: string, status: string) => {
    const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating order status:', error);
        throw error;
    }
    return data;
};

export const seedDatabase = async () => {
    console.log('Starting database seed...');
    const errors: string[] = [];

    // 1. Seed Categories & Subcategories
    for (const cat of CATEGORIES) {
        // Upsert Category
        const { data: categoryData, error: catError } = await supabase
            .from('categories')
            .upsert({
                name: cat.name,
                slug: cat.slug,
                image_url: cat.imageUrl,
                is_active: true
            }, { onConflict: 'slug' })
            .select('id')
            .single();

        if (catError) {
            console.error(`Error seeding category ${cat.name}:`, catError);
            errors.push(`Category ${cat.name}: ${catError.message}`);
        } else if (categoryData) {
            // Seed Subcategories for this category
            const categorySubcategories = SUBCATEGORIES.filter(sub => sub.category_id === cat.id);

            for (const sub of categorySubcategories) {
                const { error: subError } = await supabase
                    .from('subcategories')
                    .upsert({
                        category_id: categoryData.id,
                        name: sub.name,
                        slug: sub.slug,
                        image_url: sub.imageUrl
                    }, { onConflict: 'category_id, slug' });

                if (subError) {
                    console.error(`Error seeding subcategory ${sub.name}:`, subError);
                    errors.push(`Subcategory ${sub.name}: ${subError.message}`);
                }
            }
        }
    }

    // 2. Seed Products
    for (const prod of INITIAL_PRODUCTS) {
        const { data: catData } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', prod.category)
            .single();

        if (catData) {
            const { data: existingProd } = await supabase.from('products').select('id').eq('slug', prod.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')).single();

            if (!existingProd) {
                const { error } = await supabase
                    .from('products')
                    .insert({
                        name: prod.name,
                        slug: prod.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
                        description: prod.description,
                        price: prod.price,
                        stock_quantity: 50,
                        images: [prod.imageUrl],
                        category_id: catData.id,
                        is_featured: prod.trending || false,
                        is_active: true
                    });

                if (error) {
                    console.error(`Error seeding product ${prod.name}:`, error);
                    errors.push(`Product ${prod.name}: ${error.message}`);
                }
            }
        } else {
            errors.push(`Skipped product ${prod.name}: Category ${prod.category} not found`);
        }
    }

    return { success: errors.length === 0, errors };
};

// --- Profile Management ---

export const getUserProfile = async (userId: string) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
    return data;
};

export const updateUserProfile = async (userId: string, updates: any) => {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    if (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
    return data;
};

// --- Sales Analytics ---

export interface SalesAnalytics {
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    profitMargin: number;
    totalOrders: number;
    averageOrderValue: number;
}

export const getSalesAnalytics = async (): Promise<SalesAnalytics> => {
    try {
        // Fetch all completed orders
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .in('status', ['delivered', 'shipped', 'processing']);

        if (ordersError) {
            console.error('Error fetching orders:', ordersError);
            throw ordersError;
        }

        // Fetch all products with cost_price
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id, cost_price, price');

        if (productsError) {
            console.error('Error fetching products:', productsError);
            throw productsError;
        }

        // Create a map of product ID to cost/price
        const productMap = new Map<string, { costPrice: number; price: number }>(
            products?.map((p: any) => [p.id, { costPrice: p.cost_price || 0, price: p.price }]) || []
        );

        let totalRevenue = 0;
        let totalCost = 0;
        let totalOrders = orders?.length || 0;

        // Calculate revenue and cost from orders
        orders?.forEach(order => {
            // Add order total to revenue
            totalRevenue += order.total || 0;

            // Calculate cost from order items
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach((item: any) => {
                    const productInfo = productMap.get(item.id);
                    if (productInfo) {
                        const quantity = item.quantity || 1;
                        totalCost += productInfo.costPrice * quantity;
                    }
                });
            }
        });

        const totalProfit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        return {
            totalRevenue,
            totalCost,
            totalProfit,
            profitMargin,
            totalOrders,
            averageOrderValue
        };
    } catch (error) {
        console.error('Error calculating sales analytics:', error);
        return {
            totalRevenue: 0,
            totalCost: 0,
            totalProfit: 0,
            profitMargin: 0,
            totalOrders: 0,
            averageOrderValue: 0
        };
    }
};
// --- Reviews ---

export const uploadReviewMedia = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('reviews')
        .upload(filePath, file);

    if (uploadError) {
        console.error('Error uploading review media:', uploadError);
        throw uploadError;
    }

    const { data } = supabase.storage.from('reviews').getPublicUrl(filePath);
    return data.publicUrl;
};

export const addReview = async (review: any) => {
    const { data, error } = await supabase
        .from('reviews')
        .insert([review])
        .select()
        .single();

    if (error) {
        console.error('Error adding review:', error);
        throw error;
    }
    return data;
};

export const getProductReviews = async (productId: string) => {
    const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching product reviews:', error);
        return [];
    }
    return data;
};

export const getAllReviews = async () => {
    const { data, error } = await supabase
        .from('reviews')
        .select('*, products(name)')
        .order('created_at', { ascending: false })
        .limit(50); // Limit to 50 for performance

    if (error) {
        console.error('Error fetching all reviews:', error);
        return [];
    }
    return data;
};

// ... (other functions)

export const getProductAnalytics = async (productId: string) => {
    try {
        // 1. Get product details (Fast)
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (productError) throw productError;

        // 2. Get Aggregates (Fast - No Joins, minimal columns)
        // Fetch all items to calculate total sales/revenue
        const { data: allItems, error: aggError } = await supabase
            .from('order_items')
            .select('quantity, unit_price')
            .eq('product_id', productId);

        if (aggError) throw aggError;

        // Calculate Totals in Memory
        let totalUnitsSold = 0;
        let totalRevenue = 0;

        (allItems || []).forEach((item: any) => {
            const qty = item.quantity || 1;
            const price = item.unit_price || 0;
            totalUnitsSold += qty;
            totalRevenue += (price * qty);
        });

        // 3. Get Recent Orders (Fast - Limited to 10, with Join)
        // Only fetch heavy data (shipping_address) for the few we display
        const { data: recentItems, error: recentError } = await supabase
            .from('order_items')
            .select('quantity, orders(id, created_at, status, shipping_address)')
            .eq('product_id', productId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (recentError) throw recentError;

        const recentOrders = (recentItems || [])
            .filter((item: any) => item.orders) // Ensure order exists
            .map((item: any) => ({
                orderId: item.orders.id,
                date: item.orders.created_at,
                quantity: item.quantity || 1,
                customerName: item.orders.shipping_address?.fullName || 'Unknown',
                status: item.orders.status
            }));

        // Calculate Profit
        const costPrice = product.cost_price || 0;
        const totalCost = costPrice * totalUnitsSold;
        const totalProfit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
        const averageOrderValue = totalUnitsSold > 0 ? totalRevenue / totalUnitsSold : 0;

        return {
            productId,
            productName: product.name,
            totalUnitsSold,
            totalRevenue,
            totalCost,
            totalProfit,
            profitMargin,
            averageOrderValue,
            currentStock: product.stock_quantity,
            costPrice: costPrice,
            sellingPrice: product.price,
            marketPrice: product.market_price,
            recentOrders: recentOrders
        };

    } catch (error) {
        console.error('Error fetching product analytics:', error);
        return null;
    }
};

export const updateReviewStatus = async (id: string, isApproved: boolean) => {
    const { data, error } = await supabase
        .from('reviews')
        .update({ is_approved: isApproved })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating review status:', error);
        throw error;
    }
    return data;
};

export const updateReview = async (id: string, rating: number, comment: string) => {
    const { data, error } = await supabase
        .from('reviews')
        .update({ rating, comment })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating review:', error);
        throw error;
    }
    return data;
};

export const deleteReview = async (id: string) => {
    const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting review:', error);
        throw error;
    }
};

// --- Review Likes ---

export const toggleReviewLike = async (reviewId: string, userId: string) => {
    // 1. Check if like exists
    const { data: existingLike, error: fetchError } = await supabase
        .from('review_likes')
        .select('id')
        .eq('review_id', reviewId)
        .eq('user_id', userId)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error checking review like:', fetchError);
        throw fetchError;
    }

    if (existingLike) {
        // Unlike
        const { error: deleteError } = await supabase
            .from('review_likes')
            .delete()
            .eq('id', existingLike.id);

        if (deleteError) {
            console.error('Error removing like:', deleteError);
            throw deleteError;
        }
        return { liked: false };
    } else {
        // Like
        const { error: insertError } = await supabase
            .from('review_likes')
            .insert({ review_id: reviewId, user_id: userId });

        if (insertError) {
            console.error('Error adding like:', insertError);
            throw insertError;
        }
        return { liked: true };
    }
};

export const getReviewLikeCount = async (reviewId: string) => {
    const { count, error } = await supabase
        .from('review_likes')
        .select('*', { count: 'exact', head: true })
        .eq('review_id', reviewId);

    if (error) {
        console.error('Error fetching like count:', error);
        return 0;
    }
    return count || 0;
};

export const hasUserLikedReview = async (reviewId: string, userId: string) => {
    const { data, error } = await supabase
        .from('review_likes')
        .select('id')
        .eq('review_id', reviewId)
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error checking user like:', error);
        return false;
    }
    return !!data;
};

// Export seedCategories as an alias to seedDatabase for backwards compatibility
export const seedCategories = seedDatabase;


// --- Play Feature ---

export const getPlayVideos = async (userId?: string) => {
    const { data, error } = await supabase
        .from('play_videos')
        .select(`
            *,
            likes:play_likes(count),
            comments:play_comments(count),
            shares:play_shares(count),
            is_liked:play_likes!left(user_id)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching play videos:', error);
        return [];
    }

    return data.map((video: any) => ({
        ...video,
        videoUrl: video.video_url,
        thumbnailUrl: video.thumbnail_url,
        userId: video.user_id,
        createdAt: video.created_at,
        likesCount: video.likes?.[0]?.count || 0,
        commentsCount: video.comments?.[0]?.count || 0,
        sharesCount: video.shares?.[0]?.count || 0,
        isLiked: userId ? video.is_liked?.some((l: any) => l.user_id === userId) : false
    }));
};

export const likeVideo = async (videoId: string, userId: string) => {
    const { error } = await supabase
        .from('play_likes')
        .insert({ video_id: videoId, user_id: userId });
    if (error) throw error;
};

export const unlikeVideo = async (videoId: string, userId: string) => {
    const { error } = await supabase
        .from('play_likes')
        .delete()
        .match({ video_id: videoId, user_id: userId });
    if (error) throw error;
};

export const getVideoComments = async (videoId: string) => {
    const { data, error } = await supabase
        .from('play_comments')
        .select('*')
        .eq('video_id', videoId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching comments:', error);
        throw error;
    }

    console.log('Raw comment data from DB:', data);

    return (data || []).map((c: any) => ({
        id: c.id,
        videoId: c.video_id,
        userId: c.user_id,
        userName: c.user_name || 'Anonymous',
        content: c.content,
        createdAt: c.created_at
    }));
};

export const addComment = async (videoId: string, userId: string, content: string, userName?: string) => {
    const { error } = await supabase
        .from('play_comments')
        .insert({
            video_id: videoId,
            user_id: userId,
            content,
            user_name: userName || 'Anonymous'
        });
    if (error) throw error;
};

export const deleteComment = async (commentId: string) => {
    const { error } = await supabase
        .from('play_comments')
        .delete()
        .eq('id', commentId);
    if (error) throw error;
};

export const shareVideo = async (videoId: string, userId?: string, platform?: string) => {
    const { error } = await supabase
        .from('play_shares')
        .insert({ video_id: videoId, user_id: userId, platform });
    if (error) console.error('Error logging share:', error);
};

export const uploadVideo = async (file: File, caption: string, userId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`; // No subdirectory, just like reviews

    console.log('Uploading video:', { fileName, fileSize: file.size, fileType: file.type });

    const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, file);

    if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
    }

    console.log('Upload successful');

    const { data } = supabase.storage.from('videos').getPublicUrl(filePath);
    const publicUrl = data.publicUrl;

    console.log('Public URL:', publicUrl);

    // Create database record
    const { data: dbData, error: dbError } = await supabase
        .from('play_videos')
        .insert({
            video_url: publicUrl,
            caption,
            user_id: userId
        })
        .select()
        .single();

    if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
    }

    console.log('Video record created:', dbData);
    return dbData;
};



