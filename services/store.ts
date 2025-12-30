import { Product, User, Order } from '../types';
import * as supabaseService from './supabaseService';

class StoreService {
  constructor() {
    // No init needed for Supabase
  }

  // Helper to format IDs
  private formatId(id: string | number): string {
    if (typeof id === 'number' || (typeof id === 'string' && !isNaN(Number(id)))) {
      return String(id).padStart(5, '0');
    }
    return String(id);
  }

  // --- Products ---
  async getProducts(): Promise<Product[]> {
    try {
      const dbProducts = await supabaseService.getProducts();
      // Map DB product to Frontend Product type
      return (dbProducts || []).map((p: any) => {
        return {
          id: this.formatId(p.id), // Format ID
          name: p.name,
          slug: p.slug,
          description: p.description,
          price: p.price,
          marketPrice: p.market_price,
          costPrice: p.cost_price,
          imageUrl: p.images?.[0] || '',
          images: p.images || [],
          category: p.categories?.slug || 'uncategorized',
          subcategory: p.subcategory,
          color: p.color,
          colorVariantGroup: p.color_variant_group,
          trending: p.is_featured,
          stock: p.stock_quantity,
          variants: p.product_variants || [],
          rating: p.rating || 0,
          reviewCount: p.review_count || 0
        };
      });
    } catch (error) {
      console.error('StoreService.getProducts error:', error);
      return [];
    }
  }

  async getAdminProducts(): Promise<Product[]> {
    const dbProducts = await supabaseService.getAdminProducts();
    return (dbProducts || []).map((p: any) => ({
      id: this.formatId(p.id),
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      marketPrice: p.market_price,
      costPrice: p.cost_price,
      imageUrl: p.images?.[0] || '',
      images: p.images || [],
      category: p.categories?.slug || 'uncategorized',
      subcategory: p.subcategory,
      color: p.color,
      colorVariantGroup: p.color_variant_group,
      trending: p.is_featured,
      stock: p.stock_quantity,
      variants: p.product_variants || [],
      rating: p.rating || 0,
      reviewCount: p.review_count || 0
    }));
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const p = await supabaseService.getProductBySlug(slug);
    if (!p) return null;
    return {
      id: this.formatId(p.id),
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      marketPrice: p.market_price,
      costPrice: p.cost_price,
      imageUrl: p.images?.[0] || '',
      images: p.images || [],
      category: p.categories?.slug || 'uncategorized',
      subcategory: p.subcategory,
      color: p.color,
      colorVariantGroup: p.color_variant_group,
      trending: p.is_featured,
      stock: p.stock_quantity,
      variants: p.product_variants || [],
      rating: p.rating || 0,
      reviewCount: p.review_count || 0
    };
  }

  async getProductById(id: string): Promise<Product | null> {
    // Handle padded IDs (e.g. "00005" -> 5)
    // Supabase likely expects the raw integer ID
    const cleanId = id.replace(/^0+/, '');
    const lookupId = cleanId === '' ? '0' : cleanId; // Handle "00000" -> "0"

    console.log(`Store: Looking up product. Input ID: ${id}, Clean ID: ${lookupId}`);

    const p = await supabaseService.getProductById(lookupId);
    if (!p) return null;
    return {
      id: this.formatId(p.id),
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      marketPrice: p.market_price,
      costPrice: p.cost_price,
      imageUrl: p.images?.[0] || '',
      images: p.images || [],
      category: p.categories?.slug || 'uncategorized',
      subcategory: p.subcategory,
      color: p.color,
      colorVariantGroup: p.color_variant_group,
      trending: p.is_featured,
      stock: p.stock_quantity,
      variants: p.product_variants || [],
      rating: p.rating || 0,
      reviewCount: p.review_count || 0
    };
  }


  async getProductsByVariantGroup(groupId: string): Promise<Product[]> {
    const dbProducts = await supabaseService.getProductsByVariantGroup(groupId);
    return (dbProducts || []).map((p: any) => ({
      id: this.formatId(p.id),
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      marketPrice: p.market_price,
      costPrice: p.cost_price,
      imageUrl: p.images?.[0] || '',
      images: p.images || [],
      category: p.categories?.slug || 'uncategorized',
      subcategory: p.subcategory,
      color: p.color,
      colorVariantGroup: p.color_variant_group,
      trending: p.is_featured,
      stock: p.stock_quantity,
      variants: p.product_variants || []
    }));
  }

  async addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    const newProduct = await supabaseService.addProduct(product);
    return {
      id: this.formatId(newProduct.id),
      name: newProduct.name,
      slug: newProduct.slug,
      description: newProduct.description,
      price: newProduct.price,
      marketPrice: newProduct.market_price,
      costPrice: newProduct.cost_price,
      imageUrl: newProduct.images?.[0] || '',
      images: newProduct.images || [],
      category: product.category, // Optimistic
      subcategory: product.subcategory,
      color: newProduct.color,
      colorVariantGroup: newProduct.color_variant_group,
      trending: newProduct.is_featured,
      stock: newProduct.stock_quantity
    };
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    // Strategy: Determine the working ID by checking existence first
    // This separates "ID Mismatch" from "RLS/Permission" issues.

    const possibleIds = [
      id.replace(/^0+/, ''), // Clean ID (5)
      id,                    // Raw ID (00005)
      parseInt(id, 10).toString() // Strict Int (5)
    ];
    // Deduplicate
    const uniqueIds = Array.from(new Set(possibleIds)).filter(i => i && i !== 'NaN');

    console.log(`Store: Update diagnostics. Testing IDs: ${uniqueIds.join(', ')}`);

    let workingId: string | null = null;
    let currentProduct: any = null;

    // 1. Find which ID actually exists
    for (const testId of uniqueIds) {
      // We use supabaseService directly or a simpler internal fetch to check existence
      // But for now, let's reuse getProductById logic roughly
      const exists = await supabaseService.getProductById(testId);
      if (exists) {
        workingId = testId;
        currentProduct = exists;
        console.log(`Store: Found valid product with ID: ${testId}`);
        break;
      }
    }

    if (!workingId) {
      console.error("Store: Product does not exist with any tested ID variation.");
      return null; // Truly not found
    }

    // 2. We have a valid ID. Now try to update it.
    console.log(`Store: Attempting update on proven ID: ${workingId}`);

    // Prepare data
    let imageUrl = updates.imageUrl;
    const productData = {
      ...updates,
      imageUrl
    };

    const updated = await supabaseService.updateProduct(workingId, productData);

    if (!updated) {
      // CRITICAL: Product exists (we found it in step 1), but Update returned null.
      // This implies blocked permissions (RLS).
      console.error("Store: Product exists but Update returned null. Likely RLS/Permission issue.");
      throw new Error(`Permission Denied: Found product ${workingId} but could not update it. Check Database RLS policies.`);
    }

    return {
      id: this.formatId(updated.id),
      name: updated.name,
      slug: updated.slug,
      description: updated.description,
      price: updated.price,
      marketPrice: updated.market_price,
      costPrice: updated.cost_price,
      imageUrl: updated.images?.[0] || '',
      images: updated.images || [],
      category: updates.category || 'uncategorized',
      subcategory: updated.subcategory,
      color: updated.color,
      colorVariantGroup: updated.color_variant_group,
      trending: updated.is_featured,
      stock: updated.stock_quantity
    };
  }

  async deleteProduct(id: string): Promise<void> {
    const cleanId = id.replace(/^0+/, '');
    const lookupId = cleanId === '' ? '0' : cleanId;
    await supabaseService.deleteProduct(lookupId);
    // Note: If delete fails silently for cleanId, we might want to try raw ID, 
    // but usually delete is less critical to confirm than update.
  }

  // --- Users ---
  // Users are handled by Clerk + Supabase Auth, but we keep this for compatibility if used elsewhere
  async getUser(email: string): Promise<User | null> {
    // This is legacy from mock store. Ideally we use useAuth() context.
    return null;
  }

  async createUser(user: Omit<User, 'id' | 'joinDate' | 'role'>): Promise<User> {
    // Legacy
    return {} as User;
  }

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
    // Legacy
    return {} as User;
  }

  // --- Address Management ---
  async getUserAddresses(userId: string): Promise<any[]> {
    const profile = await supabaseService.getUserProfile(userId);
    return profile?.addresses || [];
  }

  async saveUserAddress(userId: string, address: any): Promise<any[]> {
    const currentAddresses = await this.getUserAddresses(userId);
    // Check for duplicates (simple check)
    const exists = currentAddresses.some(a =>
      a.address === address.address &&
      a.city === address.city &&
      a.state === address.state &&
      a.zipCode === address.zipCode
    );

    if (exists) return currentAddresses;

    const newAddresses = [...currentAddresses, address];
    await supabaseService.updateUserProfile(userId, { addresses: newAddresses });
    return newAddresses;
  }

  async deleteUserAddress(userId: string, index: number): Promise<any[]> {
    const currentAddresses = await this.getUserAddresses(userId);
    if (index >= 0 && index < currentAddresses.length) {
      const newAddresses = currentAddresses.filter((_, i) => i !== index);
      await supabaseService.updateUserProfile(userId, { addresses: newAddresses });
      return newAddresses;
    }
    return currentAddresses;
  }

  async updateUserAddress(userId: string, index: number, updatedAddress: any): Promise<any[]> {
    const currentAddresses = await this.getUserAddresses(userId);
    if (index >= 0 && index < currentAddresses.length) {
      currentAddresses[index] = updatedAddress;
      await supabaseService.updateUserProfile(userId, { addresses: currentAddresses });
      return currentAddresses;
    }
    return currentAddresses;
  }

  async createOrder(userId: string | null, items: any[], total: number, details: any): Promise<Order> {
    const orderData: any = {
      total_amount: total,
      status: 'processing',
      payment_method: details.paymentMethod,
      delivery_date: details.deliveryDate,
      // Add customer details
      customer_name: details.customerName,
      customer_phone: details.phone,
      customer_email: details.email,
      // Add delivery and gift wrapping details
      delivery_speed: details.deliverySpeed || 'standard',
      gift_wrapping: details.giftWrapping || 'none',
      // Shipping address
      shipping_address: {
        street: details.shippingAddress.street,
        city: details.shippingAddress.city,
        zipCode: details.shippingAddress.zipCode,
        state: details.shippingAddress.state,
        country: details.shippingAddress.country,
        latitude: details.shippingAddress.latitude,
        longitude: details.shippingAddress.longitude
      },
      points_redeemed: details.pointsRedeemed || 0,
      coupon_code: details.couponCode || null,
      guest_info: !userId ? details.guestInfo : null
    };

    if (userId) {
      orderData.user_id = userId;
    }

    console.log('Creating order with data:', orderData);

    // Sanitize item IDs (strip leading zeros to match DB integer IDs)
    const sanitizedItems = items.map(item => ({
      ...item,
      id: String(item.id).replace(/^0+/, '') || '0'
    }));

    const result = await supabaseService.createOrder(orderData, sanitizedItems);
    if (!result.success) {
      console.error('Supabase createOrder failed:', result.error);
      throw result.error;
    }

    // Return a frontend-compatible Order object
    return {
      id: this.formatId(result.order.id),
      readableId: result.order.readable_id,
      userId: userId || undefined,
      date: result.order.created_at,
      items,
      total,
      status: 'Processing',
      ...details
    };
  }

  async getOrders(userId?: string): Promise<Order[]> {
    let dbOrders;
    if (userId) {
      dbOrders = await supabaseService.getUserOrders(userId);
    } else {
      const result = await supabaseService.getAdminOrders();
      if (result.error) throw result.error;
      dbOrders = result.data;
    }

    return (dbOrders || []).map((o: any) => {
      // Extract details from shipping_address (where we stored them) or guest_info
      let shipping = o.shipping_address || {};

      // Handle case where shipping_address is a string (JSON stringified)
      if (typeof shipping === 'string') {
        try {
          shipping = JSON.parse(shipping);
        } catch (e) {
          console.error('Failed to parse shipping_address:', e);
          shipping = {};
        }
      }

      let guest = o.guest_info || {};
      // Handle case where guest_info is a string
      if (typeof guest === 'string') {
        try {
          guest = JSON.parse(guest);
        } catch (e) {
          guest = {};
        }
      }

      return {
        id: this.formatId(o.id),
        readableId: o.readable_id,
        userId: o.user_id,
        date: o.created_at,
        items: o.order_items.map((i: any) => ({
          id: this.formatId(i.product_id),
          name: i.products?.name || 'Unknown Product',
          price: i.unit_price,
          quantity: i.quantity,
          imageUrl: i.products?.images?.[0] || '',
          selectedSize: i.selected_size,
          selectedColor: i.selected_color
        })),
        total: o.total_amount,
        status: o.status,
        shippingAddress: shipping,

        // Map customer info from new dedicated columns (with fallbacks)
        customerName: o.customer_name || (guest.firstName ? `${guest.firstName} ${guest.lastName}` : 'Unknown'),
        phone: o.customer_phone || guest.phone || '',
        email: o.customer_email || guest.email || '',
        address: `${shipping.street || ''}, ${shipping.city || ''} - ${shipping.zipCode || ''}`,
        city: shipping.city,
        state: shipping.state,
        zipCode: shipping.zipCode,
        paymentMethod: o.payment_method,
        deliveryDate: o.delivery_date,
        deliveryType: o.delivery_speed === 'fast' ? 'Fast Delivery' : 'Standard Delivery',
        giftWrapping: o.gift_wrapping,
        pointsRedeemed: o.points_redeemed || 0
      };
    });
  }

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<Order> {
    const cleanId = String(orderId).replace(/^0+/, '') || '0';
    console.log(`Store: Updating order status. Original: ${orderId}, Cleaned: ${cleanId}`);
    const updated = await supabaseService.updateOrderStatus(cleanId, status);
    return {
      id: this.formatId(updated.id),
      status: updated.status
    } as any;
  }

  // --- Reviews ---
  async addReview(review: any): Promise<any> {
    return await supabaseService.addReview(review);
  }

  async getProductReviews(productId: string): Promise<any[]> {
    return await supabaseService.getProductReviews(productId);
  }

  async getAllReviews(): Promise<any[]> {
    return await supabaseService.getAllReviews();
  }

  async getAllUsersWithStats(): Promise<any[]> {
    return await supabaseService.getAllUsersWithStats();
  }

  async updateReviewStatus(id: string, isApproved: boolean): Promise<any> {
    return await supabaseService.updateReviewStatus(id, isApproved);
  }

  async updateReview(id: string, rating: number, comment: string): Promise<any> {
    return await supabaseService.updateReview(id, rating, comment);
  }

  async deleteReview(id: string): Promise<void> {
    return supabaseService.deleteReview(id);
  }

  async uploadReviewMedia(file: File): Promise<string> {
    return await supabaseService.uploadReviewMedia(file);
  }

  async toggleReviewLike(reviewId: string, userId: string): Promise<{ liked: boolean }> {
    return await supabaseService.toggleReviewLike(reviewId, userId);
  }

  async getReviewLikeCount(reviewId: string): Promise<number> {
    return await supabaseService.getReviewLikeCount(reviewId);
  }

  async hasUserLikedReview(reviewId: string, userId: string): Promise<boolean> {
    return await supabaseService.hasUserLikedReview(reviewId, userId);
  }

  // --- Play Feature ---

  async getPlayVideos(userId?: string): Promise<any[]> {
    return await supabaseService.getPlayVideos(userId);
  }

  async deletePlayVideo(videoId: string): Promise<void> {
    return await supabaseService.deletePlayVideo(videoId);
  }

  async likeVideo(videoId: string, userId: string): Promise<void> {
    return await supabaseService.likeVideo(videoId, userId);
  }

  async unlikeVideo(videoId: string, userId: string): Promise<void> {
    return await supabaseService.unlikeVideo(videoId, userId);
  }

  async getVideoComments(videoId: string): Promise<any[]> {
    return await supabaseService.getVideoComments(videoId);
  }

  async addComment(videoId: string, userId: string, content: string, userName?: string): Promise<void> {
    return await supabaseService.addComment(videoId, userId, content, userName);
  }

  async deleteComment(commentId: string): Promise<void> {
    return await supabaseService.deleteComment(commentId);
  }

  async shareVideo(videoId: string, userId?: string, platform?: string): Promise<void> {
    return await supabaseService.shareVideo(videoId, userId, platform);
  }

  async uploadVideo(file: File, caption: string, userId: string): Promise<void> {
    return await supabaseService.uploadVideo(file, caption, userId);
  }

  // --- Categories ---
  async getCategories(): Promise<any[]> {
    try {
      console.log('store.getCategories() called');
      const result = await supabaseService.getCategories();
      console.log('store.getCategories() result:', result);

      // Map database fields to frontend format
      return (result || []).map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        imageUrl: cat.image_url, // Map image_url to imageUrl
        description: cat.description,
        subcategories: (cat.subcategories || []).map((sub: any) => ({
          id: sub.id,
          name: sub.name,
          slug: sub.slug,
          imageUrl: sub.image_url, // Map subcategory image_url to imageUrl
          description: sub.description,
          category_id: sub.category_id
        }))
      }));
    } catch (error) {
      console.error('StoreService.getCategories error:', error);
      return [];
    }
  }

  async getCategoryById(id: string): Promise<any> {
    return await supabaseService.getCategoryById(id);
  }

  async addCategory(category: any): Promise<any> {
    return await supabaseService.addCategory(category);
  }

  async updateCategory(id: string, data: any): Promise<any> {
    return await supabaseService.updateCategory(id, data);
  }

  async deleteCategory(id: string): Promise<void> {
    await supabaseService.deleteCategory(id);
  }

  async addSubcategory(subcategory: any): Promise<any> {
    return await supabaseService.addSubcategory(subcategory);
  }

  async updateSubcategory(id: string, data: any): Promise<any> {
    return await supabaseService.updateSubcategory(id, data);
  }

  async deleteSubcategory(id: string): Promise<void> {
    await supabaseService.deleteSubcategory(id);
  }

  // --- Analytics ---
  async getProductAnalytics(productId: string): Promise<any> {
    return await supabaseService.getProductAnalytics(productId);
  }

  // --- Seeding ---
  async seedCategories(): Promise<{ success: boolean; errors: string[] }> {
    return await supabaseService.seedCategories();
  }
}

export const store = new StoreService();