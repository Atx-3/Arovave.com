import { supabase } from '../lib/supabase';
import { products as initialProducts } from '../data';
import type { Product } from '../types';

// Storage keys
const LOCAL_STORAGE_KEY = 'arovaveProducts';
const TRENDING_STORAGE_KEY = 'arovaveTrendingProducts';

/**
 * Fetch all products from Supabase database
 * This is the main function to get products for display
 */
export const fetchProducts = async (): Promise<Product[]> => {
    try {
        console.log('📦 Fetching products from Supabase...');

        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('id');

        if (error) {
            console.error('❌ Supabase error:', error.message);
            // Return cached data on error
            return getLocalProducts();
        }

        if (!data || data.length === 0) {
            console.log('📦 No products found in database');
            return [];
        }

        console.log('✅ Got', data.length, 'products from Supabase');

        // Transform database format to app format
        const products: Product[] = data.map((item: any) => ({
            id: item.id,
            name: item.name,
            cat: item.cat,
            subcategory: item.subcategory,
            images: item.images || [],
            thumbnail: item.thumbnail,
            video: item.video,
            description: item.description,
            specs: item.specs || [],
            keySpecs: item.key_specs || [],
            moq: item.moq,
            priceRange: item.price_range,
            hsn: item.hsn,
            certifications: item.certifications || [],
            isTrending: item.is_trending || false,
            tabDescription: item.tab_description,
            tabSpecifications: item.tab_specifications,
            tabAdvantage: item.tab_advantage,
            tabBenefit: item.tab_benefit
        }));

        // Save to localStorage cache
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(products));

        // Update trending cache
        const trendingIds = products.filter(p => p.isTrending).map(p => p.id);
        localStorage.setItem(TRENDING_STORAGE_KEY, JSON.stringify(trendingIds));

        return products;

    } catch (err) {
        console.error('❌ Network error:', err);
        return getLocalProducts();
    }
};

/**
 * Get products from localStorage cache
 */
export const getLocalProducts = (): Product[] => {
    try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
            const products = JSON.parse(saved);
            console.log('📦 Loaded', products.length, 'products from cache');
            return products;
        }
    } catch (e) {
        console.error('Error reading cache:', e);
    }
    return [];
};

/**
 * Save a product to Supabase
 */
export const saveProduct = async (product: Product, isNew: boolean = false): Promise<{ success: boolean; product?: Product; error?: string }> => {
    try {
        // Check for duplicate name when adding new
        if (isNew) {
            const { data: existing } = await supabase
                .from('products')
                .select('id')
                .ilike('name', product.name.trim());

            if (existing && existing.length > 0) {
                return { success: false, error: 'Same product already exists' };
            }
        }

        // Format price with $ if needed
        let formattedPrice = product.priceRange || '';
        if (formattedPrice && !formattedPrice.startsWith('$')) {
            formattedPrice = '$' + formattedPrice;
        }

        const dbProduct = {
            name: product.name.trim(),
            cat: product.cat,
            subcategory: product.subcategory || null,
            images: product.images,
            thumbnail: product.thumbnail || null,
            video: product.video || null,
            description: product.description,
            specs: product.specs,
            key_specs: product.keySpecs || [],
            moq: product.moq,
            price_range: formattedPrice,
            hsn: product.hsn,
            certifications: product.certifications,
            is_trending: product.isTrending || false,
            tab_description: product.tabDescription || null,
            tab_specifications: product.tabSpecifications || null,
            tab_advantage: product.tabAdvantage || null,
            tab_benefit: product.tabBenefit || null,
            updated_at: new Date().toISOString()
        };

        let result;

        if (isNew) {
            const { data, error } = await supabase
                .from('products')
                .insert([dbProduct])
                .select()
                .single();

            if (error) {
                console.error('Insert error:', error);
                return { success: false, error: 'Failed to save product' };
            }
            result = data;
        } else {
            const { data, error } = await supabase
                .from('products')
                .update(dbProduct)
                .eq('id', product.id)
                .select()
                .single();

            if (error) {
                console.error('Update error:', error);
                return { success: false, error: 'Failed to update product' };
            }
            result = data;
        }

        // Transform back to Product type
        const savedProduct: Product = {
            id: result.id,
            name: result.name,
            cat: result.cat,
            subcategory: result.subcategory,
            images: result.images || [],
            thumbnail: result.thumbnail,
            video: result.video,
            description: result.description,
            specs: result.specs || [],
            keySpecs: result.key_specs || [],
            moq: result.moq,
            priceRange: result.price_range,
            hsn: result.hsn,
            certifications: result.certifications || [],
            isTrending: result.is_trending || false,
            tabDescription: result.tab_description,
            tabSpecifications: result.tab_specifications,
            tabAdvantage: result.tab_advantage,
            tabBenefit: result.tab_benefit
        };

        console.log('✅ Product saved:', savedProduct.id);
        return { success: true, product: savedProduct };

    } catch (err) {
        console.error('Save error:', err);
        return { success: false, error: 'Failed to save product' };
    }
};

/**
 * Delete a product from Supabase
 */
export const deleteProduct = async (productId: number): Promise<{ success: boolean; error?: string }> => {
    try {
        console.log('🗑️ Deleting product:', productId);

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId);

        if (error) {
            console.error('Delete error:', error);
            return { success: false, error: error.message };
        }

        console.log('✅ Product deleted:', productId);
        return { success: true };

    } catch (err: any) {
        console.error('Delete error:', err);
        return { success: false, error: err.message || 'Failed to delete' };
    }
};

/**
 * Refresh localStorage cache from Supabase
 */
export const refreshLocalCache = async (): Promise<void> => {
    await fetchProducts();
};

/**
 * Clear localStorage cache
 */
export const clearLocalCache = (): void => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(TRENDING_STORAGE_KEY);
    console.log('🗑️ Cache cleared');
};

/**
 * Sync initial products to Supabase (only if table is empty)
 */
export const syncInitialProductsToSupabase = async (forceResync: boolean = false): Promise<{ success: boolean; error?: string }> => {
    try {
        // Check if products exist
        const { data: existing } = await supabase
            .from('products')
            .select('id')
            .limit(1);

        if (!forceResync && existing && existing.length > 0) {
            console.log('📦 Products already exist in Supabase');
            return { success: true };
        }

        // Only sync if initialProducts has data
        if (initialProducts.length === 0) {
            console.log('📦 No initial products to sync');
            return { success: true };
        }

        // Delete all if force resync
        if (forceResync && existing && existing.length > 0) {
            await supabase.from('products').delete().neq('id', 0);
        }

        // Upload initial products
        const toInsert = initialProducts.map(p => ({
            name: p.name,
            cat: p.cat,
            subcategory: p.subcategory || null,
            images: p.images,
            thumbnail: p.thumbnail || null,
            video: p.video || null,
            description: p.description,
            specs: p.specs,
            key_specs: p.keySpecs || [],
            moq: p.moq,
            price_range: p.priceRange,
            hsn: p.hsn,
            certifications: p.certifications,
            is_trending: p.isTrending || false,
            tab_description: p.tabDescription || null,
            tab_specifications: p.tabSpecifications || null,
            tab_advantage: p.tabAdvantage || null,
            tab_benefit: p.tabBenefit || null
        }));

        const { error } = await supabase.from('products').insert(toInsert);

        if (error) {
            console.error('Sync error:', error);
            return { success: false, error: error.message };
        }

        console.log('✅ Synced', toInsert.length, 'products');
        clearLocalCache();
        return { success: true };

    } catch (err) {
        console.error('Sync error:', err);
        return { success: false, error: String(err) };
    }
};
