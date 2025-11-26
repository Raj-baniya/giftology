import { supabase } from './supabaseClient';
import { INITIAL_PRODUCTS, CATEGORIES } from './mockData';

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
        .select('*, categories(name, slug)')
        // .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }
    console.log('Fetched products:', data);
    return data;
};

export const getAdminProducts = async () => {
    console.log('Fetching admin products...');
    const { data, error } = await supabase
        .from('products')
        .select('*, categories(name, slug)')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching admin products:', error);
        return [];
    }
    console.log('Fetched admin products:', data?.length);
    return data;
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
        .select('*, categories(name, slug)')
        .eq('slug', slug)
        .single();

    if (error) {
        console.error('Error fetching product:', error);
        return null;
    }
    return data;
};

// --- Categories ---

export const getCategories = async () => {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

    if (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
    return data;
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
    // 1. Create the order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

    if (orderError) {
        console.error('Error creating order:', orderError);
        return { success: false, error: orderError };
    }

    // 2. Prepare order items with the new order_id
    const itemsWithOrderId = orderItems.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price
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
        .select('*, order_items(*, products(name, images)), profiles(full_name, email, phone_number)')
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
    // Note: You might need to adjust this depending on your exact DB schema vs Frontend types
    const dbProduct = {
        name: product.name,
        slug: slug,
        description: product.description,
        price: product.price,
        market_price: product.marketPrice, // Map frontend marketPrice to DB market_price
        stock_quantity: product.stock !== undefined ? product.stock : 100, // Use provided stock or default
        images: product.images || [product.imageUrl], // Support multiple images
        category_id: product.category_id, // This needs to be resolved from category slug/name if not provided
        is_featured: product.trending || false,
        is_active: true
    };

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
    return data;
};

export const updateProduct = async (id: string, updates: any) => {
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.description) dbUpdates.description = updates.description;
    if (updates.price) dbUpdates.price = updates.price;
    if (updates.marketPrice) dbUpdates.market_price = updates.marketPrice;
    if (updates.images) dbUpdates.images = updates.images;
    else if (updates.imageUrl) dbUpdates.images = [updates.imageUrl];
    if (updates.trending !== undefined) dbUpdates.is_featured = updates.trending;
    if (updates.stock !== undefined) dbUpdates.stock_quantity = updates.stock;

    // Resolve category slug to ID if category is updated
    if (updates.category) {
        const { data: cat } = await supabase.from('categories').select('id').eq('slug', updates.category).single();
        if (cat) {
            dbUpdates.category_id = cat.id;
        }
    }

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

    // 1. Seed Categories
    for (const cat of CATEGORIES) {
        // Try to insert only if it doesn't exist (manual check to be safe)
        const { data: existing } = await supabase.from('categories').select('id').eq('slug', cat.slug).single();

        if (!existing) {
            const { error } = await supabase
                .from('categories')
                .insert({
                    name: cat.name,
                    slug: cat.slug,
                    image_url: cat.imageUrl,
                    is_active: true
                });

            if (error) {
                console.error(`Error seeding category ${cat.name}:`, error);
                errors.push(`Category ${cat.name}: ${error.message}`);
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
