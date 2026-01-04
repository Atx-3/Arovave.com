/**
 * Global Product Store - ZERO LAG product access
 * Products are stored in memory for instant access
 */

import { supabase } from '../lib/supabase';
import type { Product } from '../types';

// In-memory cache for INSTANT access
let memoryCache: Product[] = [];
let isInitialized = false;
let initPromise: Promise<Product[]> | null = null;

// Cache keys
const CACHE_KEY = 'arovaveProducts';
const CACHE_TIMESTAMP_KEY = 'arovaveProductsTimestamp';
const CACHE_MAX_AGE = 5 * 60 * 1000; // 5 minutes

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
 * Initialize the product store - call this on app start
 * Loads from localStorage immediately, then fetches fresh data
 */
export function initProductStore(): Promise<Product[]> {
    if (initPromise) return initPromise;

    initPromise = (async () => {
        // Step 1: Load from localStorage IMMEDIATELY (sync)
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                memoryCache = JSON.parse(cached);
                isInitialized = true;
                console.log('⚡ Products loaded from cache:', memoryCache.length);
            }
        } catch (e) {
            console.error('Cache parse error:', e);
        }

        // Step 2: Fetch fresh data in background
        fetchFreshProducts();

        return memoryCache;
    })();

    return initPromise;
}

/**
 * Get products INSTANTLY from memory
 * Never waits, returns cached data immediately
 */
export function getProducts(): Product[] {
    // If not initialized, try to load from localStorage sync
    if (!isInitialized) {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                memoryCache = JSON.parse(cached);
                isInitialized = true;
            }
        } catch (e) {
            // Ignore
        }
    }
    return memoryCache;
}

/**
 * Get products with a background refresh
 * Returns cached data immediately, triggers refresh
 */
export function getProductsWithRefresh(): Product[] {
    const products = getProducts();

    // Check if cache is stale
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    const isStale = !timestamp || (Date.now() - parseInt(timestamp)) > CACHE_MAX_AGE;

    if (isStale) {
        fetchFreshProducts();
    }

    return products;
}

/**
 * Fetch fresh products from Supabase (background)
 */
async function fetchFreshProducts(): Promise<Product[]> {
    try {
        console.log('🔄 Fetching fresh products from Supabase...');
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase error:', error);
            return memoryCache;
        }

        if (data && data.length > 0) {
            memoryCache = data.map(dbToProduct);
            isInitialized = true;

            // Save to localStorage
            localStorage.setItem(CACHE_KEY, JSON.stringify(memoryCache));
            localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());

            console.log('✅ Fresh products loaded:', memoryCache.length);

            // Notify listeners
            notifyListeners();
        }

        return memoryCache;
    } catch (e) {
        console.error('Fetch error:', e);
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
            saveToLocalStorage();
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
            saveToLocalStorage();
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
        saveToLocalStorage();
        notifyListeners();

        return true;
    } catch (e) {
        console.error('Delete error:', e);
        return false;
    }
}

function saveToLocalStorage() {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(memoryCache));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (e) {
        console.error('localStorage save error:', e);
    }
}

// Initialize on module load for fastest possible start
initProductStore();
