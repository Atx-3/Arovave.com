/**
 * Global Product Store - ULTRA-FAST CACHING
 * 
 * Strategy:
 * 1. INSTANT: Load from localStorage cache immediately (no waiting ever)
 * 2. BACKGROUND: Fetch fresh data from Supabase silently
 * 3. LONG CACHE: Keep cache for 7 days (stale-while-revalidate pattern)
 * 4. OPTIMIZED QUERIES: Only fetch essential columns for speed
 */

import { supabase } from '../lib/supabase';
import type { Product } from '../types';

// In-memory cache for INSTANT access
let memoryCache: Product[] = [];
let isInitialized = false;
let isFetching = false;
let lastFetchTime = 0;

// Cache settings - AGGRESSIVE caching for instant loading
const CACHE_KEY = 'arovaveProducts_v2';  // Keep v2 for backward compatibility
const CACHE_TIMESTAMP_KEY = 'arovaveProductsTime_v2';
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days - long cache for instant loading
const MIN_FETCH_INTERVAL = 30 * 1000; // 30 seconds - don't fetch too frequently

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
 * Clean up old cache versions - only remove v1 keys
 */
function cleanOldCacheVersions() {
    try {
        // Remove only v1 cache keys
        localStorage.removeItem('arovaveProducts');
        localStorage.removeItem('arovaveProductsTimestamp');
        // Also clean up v3 if it exists
        localStorage.removeItem('arovaveProducts_v3');
        localStorage.removeItem('arovaveProductsTime_v3');
        // Clear other large items that might be taking space
        localStorage.removeItem('arovaveQualityUploads');
    } catch (e) {
        // Ignore
    }
}

/**
 * Check if cache exists (we ALWAYS use cache if it exists - stale-while-revalidate)
 */
function hasCacheData(): boolean {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        return cached !== null && cached.length > 2; // Not empty array "[]"
    } catch (e) {
        return false;
    }
}

/**
 * Check if cache is fresh (within 7 days)
 */
function isCacheFresh(): boolean {
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
 * Load products from localStorage cache - ALWAYS returns data if available
 */
function loadFromCache(): Product[] {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const products = JSON.parse(cached);
            if (products.length > 0) {
                console.log('⚡ INSTANT: Loaded', products.length, 'products from cache');
                return products;
            }
        }
    } catch (e) {
        console.error('Cache load error:', e);
    }
    return [];
}

/**
 * Save products to localStorage cache - with quota handling
 */
function saveToCache(products: Product[]) {
    try {
        // Create a lightweight version for caching (remove heavy tab content)
        const lightProducts = products.map(p => ({
            ...p,
            tabDescription: undefined,
            tabSpecifications: undefined,
            tabAdvantage: undefined,
            tabBenefit: undefined
        }));
        localStorage.setItem(CACHE_KEY, JSON.stringify(lightProducts));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
        console.log('💾 Cached', products.length, 'products');
    } catch (e: any) {
        // Handle quota exceeded error
        if (e?.name === 'QuotaExceededError' || e?.code === 22) {
            console.warn('⚠️ localStorage quota exceeded, clearing old data...');
            try {
                // Clear other cached data to make room
                localStorage.removeItem('arovaveQualityUploads');
                localStorage.removeItem('arovaveCategories');
                localStorage.removeItem('arovaveVideoUrl');
                // Try saving again with minimal data
                const minimalProducts = products.map(p => ({
                    id: p.id,
                    name: p.name,
                    cat: p.cat,
                    subcategory: p.subcategory,
                    thumbnail: p.thumbnail,
                    priceRange: p.priceRange,
                    moq: p.moq,
                    isTrending: p.isTrending
                }));
                localStorage.setItem(CACHE_KEY, JSON.stringify(minimalProducts));
                console.log('💾 Cached minimal product data');
            } catch (e2) {
                console.error('❌ Failed to cache even minimal data:', e2);
            }
        } else {
            console.error('Cache save error:', e);
        }
    }
}

/**
 * Initialize the product store - ALWAYS shows cached data instantly
 * Never blocks on network requests
 */
export function initProductStore(): Product[] {
    // Clean up old versions
    cleanOldCacheVersions();

    // INSTANT: Load from cache first (no waiting)
    const cached = loadFromCache();
    if (cached.length > 0) {
        memoryCache = cached;
        isInitialized = true;
        // Notify immediately with cached data
        setTimeout(() => notifyListeners(), 0);
    }

    // BACKGROUND: Fetch fresh data silently (don't block)
    if (!isCacheFresh() || cached.length === 0) {
        fetchFreshProducts();
    } else {
        // Even if cache is fresh, refresh in background after a delay
        setTimeout(() => fetchFreshProducts(), 5000);
    }

    return memoryCache;
}

/**
 * Get products from memory - INSTANT, never async
 */
export function getProducts(): Product[] {
    // If memory is empty but cache exists, load from cache
    if (memoryCache.length === 0 && hasCacheData()) {
        memoryCache = loadFromCache();
    }
    return memoryCache;
}

/**
 * Fetch fresh products from Supabase - BACKGROUND operation
 * Uses optimized query to reduce response time
 */
async function fetchFreshProducts(): Promise<Product[]> {
    // Don't fetch if already fetching
    if (isFetching) return memoryCache;

    // Don't fetch too frequently
    if (Date.now() - lastFetchTime < MIN_FETCH_INTERVAL) {
        return memoryCache;
    }

    isFetching = true;
    lastFetchTime = Date.now();

    try {
        console.log('🔄 Background: Fetching fresh products...');
        const startTime = Date.now();

        // OPTIMIZED query - only essential display columns (no heavy tab content)
        // Tab content is fetched separately when needed
        const { data, error } = await supabase
            .from('products')
            .select('id, name, cat, subcategory, hsn, moq, price_range, description, certifications, images, video, thumbnail, specs, key_specs, is_trending, created_at')
            .order('created_at', { ascending: false });

        const elapsed = Date.now() - startTime;

        if (error) {
            console.error('❌ Supabase error:', error.message);
            isFetching = false;
            return memoryCache;
        }

        if (data && data.length > 0) {
            memoryCache = data.map(dbToProduct);
            isInitialized = true;

            // Save to cache for next session
            saveToCache(memoryCache);

            console.log(`✅ Loaded ${memoryCache.length} products in ${elapsed}ms`);

            // Notify listeners with fresh data
            notifyListeners();
        }

        isFetching = false;
        return memoryCache;
    } catch (e: any) {
        console.error('❌ Fetch error:', e.message || e);
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
