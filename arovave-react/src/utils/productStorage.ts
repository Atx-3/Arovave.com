import { supabase } from '../lib/supabase';
import { products as initialProducts } from '../data';
import type { Product } from '../types';

// Fallback to localStorage if Supabase is not available
const LOCAL_STORAGE_KEY = 'arovaveProducts';
const TRENDING_STORAGE_KEY = 'arovaveTrendingProducts';

/**
 * Fetch all products from Supabase
 * Falls back to localStorage if Supabase fails or has no data
 */
export const fetchProducts = async (): Promise<Product[]> => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('id');

        if (error) {
            console.error('Error fetching products from Supabase:', error);
            return getLocalProducts();
        }

        if (data && data.length > 0) {
            // Transform Supabase data to Product type
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

            // Cache to localStorage for offline access
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(products));

            // Update trending products cache
            const trendingIds = products.filter(p => p.isTrending).map(p => p.id);
            localStorage.setItem(TRENDING_STORAGE_KEY, JSON.stringify(trendingIds));

            return products;
        }

        // No data in Supabase, check localStorage or use initial products
        return getLocalProducts();
    } catch (err) {
        console.error('Error connecting to Supabase:', err);
        return getLocalProducts();
    }
};

/**
 * Get products from localStorage or initial data
 */
export const getLocalProducts = (): Product[] => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
        return JSON.parse(saved);
    }
    return [...initialProducts];
};

/**
 * Save a product to Supabase
 * Checks for duplicates and shows error if product with same name exists
 */
export const saveProduct = async (product: Product, isNew: boolean = false): Promise<{ success: boolean; product?: Product; error?: string }> => {
    try {
        // Check for duplicate product name when adding new product
        if (isNew) {
            const { data: existingProducts, error: checkError } = await supabase
                .from('products')
                .select('id, name')
                .ilike('name', product.name.trim());

            if (checkError) {
                console.error('Error checking for duplicates:', checkError);
            } else if (existingProducts && existingProducts.length > 0) {
                // Product with same name already exists
                return {
                    success: false,
                    error: 'Same product already exists'
                };
            }
        }

        // Transform Product to Supabase format
        // Auto-add $ sign to price if not already present
        let formattedPrice = product.priceRange || '';
        if (formattedPrice && !formattedPrice.startsWith('$')) {
            formattedPrice = '$' + formattedPrice;
        }

        const supabaseProduct = {
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
            // Insert new product
            const { data, error } = await supabase
                .from('products')
                .insert([supabaseProduct])
                .select()
                .single();

            if (error) {
                console.error('Error inserting product:', error);
                // Don't fallback to localStorage - product should only be in Supabase
                return { success: false, error: 'Failed to save product to database. Please try again.' };
            }

            result = data;
        } else {
            // Update existing product
            const { data, error } = await supabase
                .from('products')
                .update(supabaseProduct)
                .eq('id', product.id)
                .select()
                .single();

            if (error) {
                console.error('Error updating product:', error);
                // Fallback to localStorage
                return saveToLocalStorage(product, isNew);
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

        // Update localStorage cache
        await refreshLocalCache();

        console.log('Product saved to Supabase:', savedProduct.id);
        return { success: true, product: savedProduct };
    } catch (err) {
        console.error('Error saving product:', err);
        return saveToLocalStorage(product, isNew);
    }
};

/**
 * Delete a product from Supabase
 */
export const deleteProduct = async (productId: number): Promise<{ success: boolean; error?: string }> => {
    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId);

        if (error) {
            console.error('Error deleting product from Supabase:', error);
            // Fallback to localStorage deletion
            deleteFromLocalStorage(productId);
            return { success: true };
        }

        // Update localStorage cache
        await refreshLocalCache();

        console.log('Product deleted from Supabase:', productId);
        return { success: true };
    } catch (err) {
        console.error('Error deleting product:', err);
        deleteFromLocalStorage(productId);
        return { success: true };
    }
};

/**
 * Refresh localStorage cache from Supabase
 */
export const refreshLocalCache = async (): Promise<void> => {
    const products = await fetchProducts();
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(products));

    const trendingIds = products.filter(p => p.isTrending).map(p => p.id);
    localStorage.setItem(TRENDING_STORAGE_KEY, JSON.stringify(trendingIds));
};

/**
 * Save/Update product in localStorage (fallback)
 */
const saveToLocalStorage = (product: Product, isNew: boolean): { success: boolean; product: Product; error?: string } => {
    const products = getLocalProducts();

    if (isNew) {
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        const newProduct = { ...product, id: newId };
        products.push(newProduct);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(products));

        const trendingIds = products.filter(p => p.isTrending).map(p => p.id);
        localStorage.setItem(TRENDING_STORAGE_KEY, JSON.stringify(trendingIds));

        console.log('Product saved to localStorage (fallback):', newId);
        return { success: true, product: newProduct, error: 'Saved to local storage only - Supabase unavailable' };
    } else {
        const index = products.findIndex(p => p.id === product.id);
        if (index >= 0) {
            products[index] = product;
        }
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(products));

        const trendingIds = products.filter(p => p.isTrending).map(p => p.id);
        localStorage.setItem(TRENDING_STORAGE_KEY, JSON.stringify(trendingIds));

        console.log('Product updated in localStorage (fallback):', product.id);
        return { success: true, product, error: 'Saved to local storage only - Supabase unavailable' };
    }
};

/**
 * Delete product from localStorage
 */
const deleteFromLocalStorage = (productId: number): void => {
    const products = getLocalProducts();
    const updated = products.filter(p => p.id !== productId);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

    const trendingIds = updated.filter(p => p.isTrending).map(p => p.id);
    localStorage.setItem(TRENDING_STORAGE_KEY, JSON.stringify(trendingIds));

    console.log('Product deleted from localStorage:', productId);
};

/**
 * Sync initial products to Supabase (one-time setup or force resync)
 * Call this if the products table is empty or you want to reset to initial data
 */
export const syncInitialProductsToSupabase = async (forceResync: boolean = false): Promise<{ success: boolean; error?: string }> => {
    try {
        // Check if products table already has data
        const { data: existing, error: checkError } = await supabase
            .from('products')
            .select('id')
            .limit(1);

        if (checkError) {
            console.error('Error checking products:', checkError);
            return { success: false, error: checkError.message };
        }

        // If forceResync is true, delete all existing products first
        if (forceResync && existing && existing.length > 0) {
            console.log('Force resync: Deleting all existing products...');
            const { error: deleteError } = await supabase
                .from('products')
                .delete()
                .neq('id', 0); // Delete all

            if (deleteError) {
                console.error('Error deleting products:', deleteError);
                return { success: false, error: deleteError.message };
            }
        } else if (!forceResync && existing && existing.length > 0) {
            console.log('Products already exist in Supabase');
            return { success: true };
        }

        // Upload initial products
        const productsToInsert = initialProducts.map(p => ({
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

        const { error: insertError } = await supabase
            .from('products')
            .insert(productsToInsert);

        if (insertError) {
            console.error('Error syncing products:', insertError);
            return { success: false, error: insertError.message };
        }

        console.log('Initial products synced to Supabase:', productsToInsert.length, 'products');

        // Clear localStorage cache so it gets fresh data from Supabase
        clearLocalCache();

        return { success: true };
    } catch (err) {
        console.error('Error syncing products:', err);
        return { success: false, error: String(err) };
    }
};

/**
 * Clear localStorage cache for products
 * This forces the app to fetch fresh data from Supabase
 */
export const clearLocalCache = (): void => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(TRENDING_STORAGE_KEY);
    console.log('Product localStorage cache cleared');
};
