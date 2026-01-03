import { supabase } from '../lib/supabase';
import type { Product } from '../types';

// =============================================================================
// PRODUCT STORAGE - Handles all product data operations with Supabase
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
        console.warn('Failed to save to cache:', e);
    }
}

/**
 * Get products from localStorage cache
 */
function getFromCache(): Product[] {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (e) {
        console.warn('Failed to read from cache:', e);
    }
    return [];
}

// =============================================================================
// MAIN EXPORT FUNCTIONS
// =============================================================================

/**
 * Fetch all products from Supabase
 * This is the main function to get products for display
 */
export async function fetchProducts(): Promise<Product[]> {
    console.log('📦 fetchProducts: Starting...');

    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('id', { ascending: true });

        if (error) {
            console.error('📦 fetchProducts: Supabase error:', error.message);
            // Return cached data on error
            const cached = getFromCache();
            console.log('📦 fetchProducts: Returning', cached.length, 'cached products');
            return cached;
        }

        if (!data || data.length === 0) {
            console.log('📦 fetchProducts: No products in database');
            saveToCache([]);
            return [];
        }

        // Convert to Product format
        const products = data.map(dbToProduct);
        console.log('📦 fetchProducts: Got', products.length, 'products from Supabase');

        // Update cache
        saveToCache(products);

        return products;

    } catch (err: any) {
        console.error('📦 fetchProducts: Error:', err.message);
        // Return cached data on error
        const cached = getFromCache();
        console.log('📦 fetchProducts: Returning', cached.length, 'cached products (error fallback)');
        return cached;
    }
}

/**
 * Get products from localStorage cache (synchronous)
 */
export function getLocalProducts(): Product[] {
    return getFromCache();
}

/**
 * Save a product to Supabase (create or update)
 */
export async function saveProduct(
    product: Product,
    isNew: boolean = false
): Promise<{ success: boolean; product?: Product; error?: string }> {
    console.log('📦 saveProduct:', isNew ? 'Creating new' : 'Updating', product.name);

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
            // Create new product
            const { data, error } = await supabase
                .from('products')
                .insert([dbData])
                .select()
                .single();

            if (error) {
                console.error('📦 saveProduct: Insert error:', error.message);
                return { success: false, error: error.message };
            }
            result = data;
        } else {
            // Update existing product
            const { data, error } = await supabase
                .from('products')
                .update(dbData)
                .eq('id', product.id)
                .select()
                .single();

            if (error) {
                console.error('📦 saveProduct: Update error:', error.message);
                return { success: false, error: error.message };
            }
            result = data;
        }

        const savedProduct = dbToProduct(result);
        console.log('📦 saveProduct: Success, ID:', savedProduct.id);

        return { success: true, product: savedProduct };

    } catch (err: any) {
        console.error('📦 saveProduct: Error:', err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Delete a product from Supabase
 */
export async function deleteProduct(
    productId: number
): Promise<{ success: boolean; error?: string }> {
    console.log('📦 deleteProduct: Deleting ID', productId);

    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId);

        if (error) {
            console.error('📦 deleteProduct: Error:', error.message);
            return { success: false, error: error.message };
        }

        console.log('📦 deleteProduct: Success');
        return { success: true };

    } catch (err: any) {
        console.error('📦 deleteProduct: Error:', err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Refresh the local cache from Supabase
 */
export async function refreshLocalCache(): Promise<void> {
    console.log('📦 refreshLocalCache: Refreshing...');
    await fetchProducts();
}

/**
 * Clear the local cache
 */
export function clearLocalCache(): void {
    console.log('📦 clearLocalCache: Clearing...');
    try {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(TRENDING_CACHE_KEY);
    } catch (e) {
        console.warn('Failed to clear cache:', e);
    }
}

/**
 * Sync initial products to Supabase (only used for initial setup)
 */
export async function syncInitialProductsToSupabase(): Promise<{ success: boolean; error?: string }> {
    console.log('📦 syncInitialProductsToSupabase: Checking...');

    try {
        // Check if products already exist
        const { data: existing } = await supabase
            .from('products')
            .select('id')
            .limit(1);

        if (existing && existing.length > 0) {
            console.log('📦 syncInitialProductsToSupabase: Products already exist');
            return { success: true };
        }

        console.log('📦 syncInitialProductsToSupabase: No products found');
        return { success: true };

    } catch (err: any) {
        console.error('📦 syncInitialProductsToSupabase: Error:', err.message);
        return { success: false, error: err.message };
    }
}
