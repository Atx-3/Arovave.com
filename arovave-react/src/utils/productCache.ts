/**
 * Smart Product Cache Helper
 * Handles localStorage quota limits by storing products WITHOUT heavy image data
 * Images are always fetched fresh from Supabase in Phase 2
 */

import type { Product } from '../types';

const CACHE_KEY = 'arovaveProducts_v2';

// Store product metadata only (no images) to stay under localStorage 5MB limit
interface CachedProduct {
    id: number;
    name: string;
    cat: string;
    subcategory?: string;
    hsn: string;
    moq: string;
    priceRange: string;
    description: string;
    certifications: string[];
    isTrending: boolean;
    specs?: any[];
    keySpecs?: any[];
}

/**
 * Save products to cache WITHOUT image data to avoid quota issues
 * Images will be loaded from Supabase in Phase 2 anyway
 */
export function cacheProducts(products: Product[]): boolean {
    try {
        // Strip heavy image data before caching
        const lightProducts: CachedProduct[] = products.map(p => ({
            id: p.id,
            name: p.name,
            cat: p.cat,
            subcategory: p.subcategory,
            hsn: p.hsn,
            moq: p.moq,
            priceRange: p.priceRange,
            description: p.description,
            certifications: p.certifications,
            isTrending: p.isTrending,
            specs: p.specs,
            keySpecs: p.keySpecs
        }));

        const cacheData = JSON.stringify(lightProducts);

        // Check size before saving (rough estimate)
        const sizeInMB = (cacheData.length * 2) / (1024 * 1024);
        if (sizeInMB > 4) {
            console.warn('⚠️ Cache data too large:', sizeInMB.toFixed(2), 'MB - skipping cache');
            return false;
        }

        localStorage.setItem(CACHE_KEY, cacheData);
        console.log(`✅ Cached ${products.length} products (${sizeInMB.toFixed(2)} MB)`);
        return true;
    } catch (e: any) {
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            console.error('❌ localStorage quota exceeded! Clearing old cache...');
            // Clear the cache and try again
            try {
                localStorage.removeItem(CACHE_KEY);
                localStorage.removeItem('arovaveProducts'); // Old key
                console.log('🧹 Old cache cleared');
            } catch (clearError) {
                console.error('Failed to clear cache:', clearError);
            }
        } else {
            console.warn('Could not cache products:', e.message);
        }
        return false;
    }
}

/**
 * Load products from cache (text only, no images)
 */
export function loadCachedProducts(): Product[] {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && Array.isArray(parsed) && parsed.length > 0) {
                // Convert back to full Product format with empty images
                const products: Product[] = parsed.map((p: CachedProduct) => ({
                    id: p.id,
                    name: p.name,
                    cat: p.cat,
                    subcategory: p.subcategory || '',
                    hsn: p.hsn,
                    moq: p.moq,
                    priceRange: p.priceRange,
                    description: p.description,
                    certifications: p.certifications || [],
                    isTrending: p.isTrending || false,
                    specs: p.specs || [],
                    keySpecs: p.keySpecs || [],
                    images: [],
                    thumbnail: '',
                    video: undefined
                }));
                console.log(`⚡ Loaded ${products.length} products from cache (text only)`);
                return products;
            }
        }
    } catch (e) {
        console.warn('Could not read cache:', e);
    }
    return [];
}

/**
 * Clear the product cache
 */
export function clearProductCache(): void {
    try {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem('arovaveProducts');
        console.log('🧹 Product cache cleared');
    } catch (e) {
        console.warn('Could not clear cache');
    }
}

/**
 * Get cache size info
 */
export function getCacheInfo(): { sizeKB: number; count: number } {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached);
            return {
                sizeKB: Math.round(cached.length * 2 / 1024),
                count: Array.isArray(parsed) ? parsed.length : 0
            };
        }
    } catch (e) { }
    return { sizeKB: 0, count: 0 };
}
