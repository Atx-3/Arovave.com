/**
 * Global Product Store - SMART CACHING
 * 
 * Strategy:
 * 1. Load from localStorage cache immediately (fast initial display)
 * 2. Fetch fresh data from Supabase in background
 * 3. Clear cache if older than 24 hours (not stale beyond 1 day)
 */

import { supabase } from '../lib/supabase';
import type { Product } from '../types';

// In-memory cache for INSTANT access
let memoryCache: Product[] = [];
let isInitialized = false;
let isFetching = false;

// Cache settings
const CACHE_KEY = 'arovaveProducts_v2';
const CACHE_TIMESTAMP_KEY = 'arovaveProductsTime_v2';
const MAX_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 hours - clear cache older than this

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
 * Clean up old cache versions
 */
function cleanOldCacheVersions() {
    try {
        // Remove old cache keys from previous versions
        localStorage.removeItem('arovaveProducts');
        localStorage.removeItem('arovaveProductsTimestamp');
    } catch (e) {
        // Ignore
    }
}

/**
 * Check if cache is still valid (within 24 hours)
 */
function isCacheValid(): boolean {
    try {
        const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
        if (!timestamp) return false;

        const age = Date.now() - parseInt(timestamp);
        return age < MAX_CACHE_AGE;
    } catch (e) {
        return false;
    }
}

/**
 * Load products from localStorage cache
 */
function loadFromCache(): Product[] {
    try {
        if (!isCacheValid()) {
            console.log('📦 Cache expired or missing, will fetch fresh');
            return [];
        }

        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const products = JSON.parse(cached);
            console.log('⚡ Loaded', products.length, 'products from cache (instant!)');
            return products;
        }
    } catch (e) {
        console.error('Cache load error:', e);
    }
    return [];
}

/**
 * Save products to localStorage cache
 */
function saveToCache(products: Product[]) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(products));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
        console.log('💾 Saved', products.length, 'products to cache');
    } catch (e) {
        console.error('Cache save error:', e);
    }
}

/**
 * Initialize the product store
 * 1. Load from cache immediately
 * 2. Fetch fresh data in background
 */
export function initProductStore(): Product[] {
    // Clean up old versions
    cleanOldCacheVersions();

    // Load from cache for instant display
    const cached = loadFromCache();
    if (cached.length > 0) {
        memoryCache = cached;
        isInitialized = true;
        notifyListeners();
    }

    // Always fetch fresh data in background
    fetchFreshProducts();

    return memoryCache;
}

/**
 * Get products from memory
 */
export function getProducts(): Product[] {
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

            // Save to cache for next session
            saveToCache(memoryCache);

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
            saveToCache(memoryCache);
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
            saveToCache(memoryCache);
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
        saveToCache(memoryCache);
        notifyListeners();

        return true;
    } catch (e) {
        console.error('Delete error:', e);
        return false;
    }
}

// Initialize on module load
initProductStore();
