/**
 * Global Product Store - SESSION-ONLY caching
 * Products are stored in memory for the current session only
 * Cache is cleared when browser/tab is closed
 */

import { supabase } from '../lib/supabase';
import type { Product } from '../types';

// In-memory cache for INSTANT access
let memoryCache: Product[] = [];
let isInitialized = false;
let isFetching = false;

// Database to App product converter
function dbToProduct(db: any): Product {
    return {
        id: db.id,
        name: db.name || '',
        cat: db.cat || 'food',
        subcategory: db.subcategory || '',
        hsn: db.hsn || '',
        moq: db.moq || '',
        priceRange: db.price_range || '',
        description: db.description || '',
        certifications: db.certifications || [],
        images: db.images || [],
        video: db.video || undefined,
        thumbnail: db.thumbnail || (db.images?.[0] || ''),
        specs: db.specs || [],
        keySpecs: db.key_specs || [],
        isTrending: db.is_trending || false,
        tabDescription: db.tab_description || undefined,
        tabSpecifications: db.tab_specifications || undefined,
        tabAdvantage: db.tab_advantage || undefined,
        tabBenefit: db.tab_benefit || undefined
    };
}

/**
 * Clear old localStorage cache on startup (one-time migration)
 */
function clearOldCache() {
    try {
        localStorage.removeItem('arovaveProducts');
        localStorage.removeItem('arovaveProductsTimestamp');
        console.log('🧹 Cleared old localStorage cache');
    } catch (e) {
        // Ignore
    }
}

/**
 * Initialize the product store - fetches fresh data from Supabase
 * No old cache is used - always starts fresh each session
 */
export async function initProductStore(): Promise<Product[]> {
    // Clear old localStorage cache
    clearOldCache();

    // Fetch fresh products immediately
    return fetchFreshProducts();
}

/**
 * Get products from memory
 * If no products yet, triggers fetch
 */
export function getProducts(): Product[] {
    // If not initialized and not fetching, start fetch
    if (!isInitialized && !isFetching) {
        fetchFreshProducts();
    }
    return memoryCache;
}

/**
 * Fetch fresh products from Supabase
 */
async function fetchFreshProducts(): Promise<Product[]> {
    if (isFetching) return memoryCache;

    isFetching = true;

    try {
        console.log('🔄 Fetching fresh products from Supabase...');
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase error:', error);
            isFetching = false;
            return memoryCache;
        }

        if (data) {
            memoryCache = data.map(dbToProduct);
            isInitialized = true;
            console.log('✅ Fresh products loaded:', memoryCache.length);

            // Notify listeners
            notifyListeners();
        }

        isFetching = false;
        return memoryCache;
    } catch (e) {
        console.error('Fetch error:', e);
        isFetching = false;
        return memoryCache;
    }
}

/**
 * Force refresh products from Supabase
 */
export async function refreshProducts(): Promise<Product[]> {
    return fetchFreshProducts();
}

// Listeners for product updates
type ProductListener = (products: Product[]) => void;
const listeners: Set<ProductListener> = new Set();

export function subscribeToProducts(listener: ProductListener): () => void {
    listeners.add(listener);
    // Immediately call with current data
    listener(memoryCache);
    return () => listeners.delete(listener);
}

function notifyListeners() {
    listeners.forEach(listener => listener(memoryCache));
}

/**
 * Add or update a product
 */
export async function saveProduct(product: Product, isNew: boolean): Promise<{ success: boolean; product?: Product; error?: string }> {
    try {
        const dbData = {
            name: product.name,
            cat: product.cat,
            subcategory: product.subcategory,
            hsn: product.hsn,
            moq: product.moq,
            price_range: product.priceRange,
            description: product.description,
            certifications: product.certifications,
            images: product.images,
            video: product.video || null,
            thumbnail: product.thumbnail || product.images[0] || '',
            specs: product.specs || [],
            key_specs: product.keySpecs || [],
            is_trending: product.isTrending || false,
            tab_description: product.tabDescription || null,
            tab_specifications: product.tabSpecifications || null,
            tab_advantage: product.tabAdvantage || null,
            tab_benefit: product.tabBenefit || null
        };

        if (isNew) {
            // Check for duplicate
            const { data: existing } = await supabase
                .from('products')
                .select('id')
                .ilike('name', product.name.trim());

            if (existing && existing.length > 0) {
                return { success: false, error: 'Same product already exists' };
            }

            const { data, error } = await supabase
                .from('products')
                .insert([dbData])
                .select()
                .single();

            if (error) return { success: false, error: error.message };

            const savedProduct = dbToProduct(data);
            memoryCache = [savedProduct, ...memoryCache];
            notifyListeners();

            return { success: true, product: savedProduct };
        } else {
            const { data, error } = await supabase
                .from('products')
                .update(dbData)
                .eq('id', product.id)
                .select()
                .single();

            if (error) return { success: false, error: error.message };

            const savedProduct = dbToProduct(data);
            memoryCache = memoryCache.map(p => p.id === savedProduct.id ? savedProduct : p);
            notifyListeners();

            return { success: true, product: savedProduct };
        }
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/**
 * Delete a product
 */
export async function deleteProduct(id: number): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Delete error:', error);
            return false;
        }

        memoryCache = memoryCache.filter(p => p.id !== id);
        notifyListeners();

        return true;
    } catch (e) {
        console.error('Delete error:', e);
        return false;
    }
}

// Initialize on module load - fetch fresh data immediately
initProductStore();
