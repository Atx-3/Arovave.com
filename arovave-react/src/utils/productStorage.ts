import { supabase } from '../lib/supabase';
import type { Product } from '../types';

// =============================================================================
// FAST PRODUCT LOADING - Shows cached data instantly, fetches fresh in background
// =============================================================================

const CACHE_KEY = 'arovaveProducts';
const TRENDING_CACHE_KEY = 'arovaveTrendingProducts';

/**
 * Convert database product format to app Product format
 */
function dbToProduct(dbProduct: any): Product {
    return {
        id: dbProduct.id,
        name: dbProduct.name,
        cat: dbProduct.cat,
        subcategory: dbProduct.subcategory || undefined,
        images: dbProduct.images || [],
        thumbnail: dbProduct.thumbnail || undefined,
        video: dbProduct.video || undefined,
        description: dbProduct.description || '',
        specs: dbProduct.specs || [],
        keySpecs: dbProduct.key_specs || [],
        moq: dbProduct.moq || '',
        priceRange: dbProduct.price_range || '',
        hsn: dbProduct.hsn || '',
        certifications: dbProduct.certifications || [],
        isTrending: dbProduct.is_trending || false,
        tabDescription: dbProduct.tab_description || undefined,
        tabSpecifications: dbProduct.tab_specifications || undefined,
        tabAdvantage: dbProduct.tab_advantage || undefined,
        tabBenefit: dbProduct.tab_benefit || undefined
    };
}

/**
 * Convert app Product format to database format
 */
function productToDb(product: Product): any {
    return {
        name: product.name?.trim() || '',
        cat: product.cat || '',
        subcategory: product.subcategory || null,
        images: product.images || [],
        thumbnail: product.thumbnail || null,
        video: product.video || null,
        description: product.description || '',
        specs: product.specs || [],
        key_specs: product.keySpecs || [],
        moq: product.moq || '',
        price_range: product.priceRange || '',
        hsn: product.hsn || '',
        certifications: product.certifications || [],
        is_trending: product.isTrending || false,
        tab_description: product.tabDescription || null,
        tab_specifications: product.tabSpecifications || null,
        tab_advantage: product.tabAdvantage || null,
        tab_benefit: product.tabBenefit || null,
        updated_at: new Date().toISOString()
    };
}

/**
 * Save products to localStorage cache
 */
function saveToCache(products: Product[]): void {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(products));
        const trendingIds = products.filter(p => p.isTrending).map(p => p.id);
        localStorage.setItem(TRENDING_CACHE_KEY, JSON.stringify(trendingIds));
    } catch (e) {
        console.warn('Cache save failed:', e);
    }
}

/**
 * Get products from localStorage cache (INSTANT - no network)
 */
function getFromCache(): Product[] {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (e) {
        console.warn('Cache read failed:', e);
    }
    return [];
}

// =============================================================================
// MAIN EXPORT FUNCTIONS
// =============================================================================

/**
 * Get cached products instantly (synchronous - no loading time)
 */
export function getLocalProducts(): Product[] {
    return getFromCache();
}

/**
 * Fetch products from Supabase (for background refresh)
 */
async function fetchFromSupabase(): Promise<Product[]> {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('id', { ascending: true });

        if (error) {
            console.error('📦 Supabase error:', error.message);
            return [];
        }

        if (!data || data.length === 0) {
            return [];
        }

        return data.map(dbToProduct);
    } catch (err: any) {
        console.error('📦 Fetch error:', err.message);
        return [];
    }
}

/**
 * FAST FETCH: Returns cached data immediately, then fetches fresh data
 * Use the callback to get updated products when they arrive
 */
export async function fetchProducts(onUpdate?: (products: Product[]) => void): Promise<Product[]> {
    // STEP 1: Return cached data IMMEDIATELY (no waiting)
    const cached = getFromCache();
    if (cached.length > 0) {
        console.log('📦 Instant: Showing', cached.length, 'cached products');
    }

    // STEP 2: Fetch fresh data in background
    console.log('📦 Background: Fetching fresh products from Supabase...');
    const fresh = await fetchFromSupabase();

    if (fresh.length > 0) {
        console.log('📦 Fresh: Got', fresh.length, 'products from Supabase');
        saveToCache(fresh);

        // If callback provided, update the UI with fresh data
        if (onUpdate) {
            onUpdate(fresh);
        }
        return fresh;
    }

    // If Supabase returned empty but we have cache, keep using cache
    if (cached.length > 0 && fresh.length === 0) {
        console.log('📦 Keeping cached data (Supabase returned empty)');
        return cached;
    }

    return fresh;
}

/**
 * FASTEST FETCH: Just returns cache, starts background refresh
 * Perfect for initial page load
 */
export function fetchProductsFast(onUpdate: (products: Product[]) => void): Product[] {
    // Return cache immediately
    const cached = getFromCache();
    console.log('📦 Fast: Returning', cached.length, 'cached products instantly');

    // Start background refresh (don't await)
    fetchFromSupabase().then(fresh => {
        if (fresh.length > 0) {
            console.log('📦 Background refresh: Got', fresh.length, 'products');
            saveToCache(fresh);
            onUpdate(fresh);
        }
    }).catch(err => {
        console.error('📦 Background refresh failed:', err);
    });

    return cached;
}

/**
 * Save a product to Supabase (create or update)
 */
export async function saveProduct(
    product: Product,
    isNew: boolean = false
): Promise<{ success: boolean; product?: Product; error?: string }> {
    console.log('📦 Saving product:', product.name);

    try {
        // Check for duplicate name when creating new
        if (isNew) {
            const { data: existing } = await supabase
                .from('products')
                .select('id')
                .ilike('name', product.name.trim());

            if (existing && existing.length > 0) {
                return { success: false, error: 'Same product already exists' };
            }
        }

        const dbData = productToDb(product);
        let result;

        if (isNew) {
            const { data, error } = await supabase
                .from('products')
                .insert([dbData])
                .select()
                .single();

            if (error) {
                return { success: false, error: error.message };
            }
            result = data;
        } else {
            const { data, error } = await supabase
                .from('products')
                .update(dbData)
                .eq('id', product.id)
                .select()
                .single();

            if (error) {
                return { success: false, error: error.message };
            }
            result = data;
        }

        const savedProduct = dbToProduct(result);
        console.log('📦 Product saved, ID:', savedProduct.id);

        return { success: true, product: savedProduct };

    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Delete a product from Supabase
 */
export async function deleteProduct(productId: number): Promise<{ success: boolean; error?: string }> {
    console.log('📦 Deleting product:', productId);

    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId);

        if (error) {
            return { success: false, error: error.message };
        }

        console.log('📦 Product deleted');
        return { success: true };

    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Refresh the local cache from Supabase
 */
export async function refreshLocalCache(): Promise<void> {
    const products = await fetchFromSupabase();
    if (products.length > 0) {
        saveToCache(products);
    }
}

/**
 * Clear the local cache
 */
export function clearLocalCache(): void {
    try {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(TRENDING_CACHE_KEY);
    } catch (e) {
        console.warn('Cache clear failed:', e);
    }
}

/**
 * Sync initial products (placeholder for backward compatibility)
 */
export async function syncInitialProductsToSupabase(): Promise<{ success: boolean; error?: string }> {
    return { success: true };
}
