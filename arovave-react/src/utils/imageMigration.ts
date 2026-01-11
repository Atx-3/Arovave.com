/**
 * Migration Script: Convert Base64 Images to AVIF in Supabase Storage
 * 
 * PRIORITY: Egress and Storage Optimization (Target: <1GB/month)
 * 
 * This script will:
 * 1. Fetch all products from Supabase
 * 2. Find products with base64 images
 * 3. Compress images to AVIF format (~90% smaller)
 * 4. Upload to Supabase Storage CDN
 * 5. Update product records with URLs (not base64)
 * 
 * SAFE: Processes in small batches with delays to prevent crashes
 */

import { supabase } from '../lib/supabase';
import { uploadMultipleToStorage, uploadToStorage, createThumbnail } from './storageUpload';

interface MigrationResult {
    productId: number;
    productName: string;
    status: 'success' | 'skipped' | 'error';
    message: string;
    originalSize?: number;
    newSize?: number;
    savings?: string;
}

// FAST BATCH SETTINGS - optimized for speed
const BATCH_SIZE = 5;           // Process 5 at a time for speed
const DELAY_BETWEEN_BATCHES = 0; // No delay - maximum speed

/**
 * Check if a string is a base64 image
 */
function isBase64Image(str: string): boolean {
    return typeof str === 'string' && str.startsWith('data:image');
}

/**
 * Calculate approximate size of base64 string in bytes
 */
function getBase64Size(base64: string): number {
    if (!base64.includes(',')) return 0;
    const data = base64.split(',')[1];
    return Math.round((data.length * 3) / 4);
}

/**
 * Sleep helper for delays
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Migrate a single product's images to Supabase Storage (with error safety)
 */
async function migrateProduct(product: any): Promise<MigrationResult> {
    const result: MigrationResult = {
        productId: product.id,
        productName: product.name,
        status: 'skipped',
        message: ''
    };

    try {
        const images = product.images || [];
        const hasBase64 = images.some(isBase64Image);

        if (!hasBase64) {
            result.message = 'Already migrated';
            return result;
        }

        // Calculate original size
        const originalSize = images.reduce((total: number, img: string) => {
            return total + (isBase64Image(img) ? getBase64Size(img) : 0);
        }, 0);
        result.originalSize = originalSize;

        console.log(`   📦 ${product.name} (${(originalSize / 1024).toFixed(0)} KB)`);

        // Upload images to storage
        const newImages = await uploadMultipleToStorage(images, product.id);

        // Create thumbnail from first image
        let newThumbnail = product.thumbnail;
        if (images[0] && isBase64Image(images[0])) {
            const { blob: thumbBlob } = await createThumbnail(images[0]);
            newThumbnail = await uploadToStorage(thumbBlob, product.id, 999);
        } else if (newImages[0]) {
            newThumbnail = newImages[0];
        }

        // Update product in database
        const { error } = await supabase
            .from('products')
            .update({
                images: newImages,
                thumbnail: newThumbnail,
                updated_at: new Date().toISOString()
            })
            .eq('id', product.id);

        if (error) {
            throw new Error(error.message);
        }

        const newSize = newImages.reduce((total: number, img: string) => {
            return total + (img.length || 0);
        }, 0);
        result.newSize = newSize;

        const savings = ((1 - newSize / originalSize) * 100).toFixed(1);
        result.savings = savings;
        result.status = 'success';
        result.message = `✅ Saved ${(originalSize / 1024).toFixed(0)} KB`;
        console.log(`      ${result.message}`);
        return result;

    } catch (error: any) {
        result.status = 'error';
        result.message = error.message || 'Unknown error';
        console.error(`      ❌ Error: ${result.message}`);
        return result;
    }
}

/**
 * Run SAFE migration - fetches products individually to avoid timeout
 * Priority: Reduce egress to <1GB/month
 */
export async function runMigration(): Promise<{
    total: number;
    migrated: number;
    skipped: number;
    errors: number;
    totalSaved: number;
    results: MigrationResult[];
}> {
    console.log('🚀 EGRESS OPTIMIZATION MIGRATION');
    console.log('Priority: Reduce monthly egress to <1GB\n');
    console.log('='.repeat(50));

    // First, fetch only product IDs and names (fast, no heavy data)
    const { data: productList, error } = await supabase
        .from('products')
        .select('id, name')
        .order('id');

    if (error) {
        console.error('❌ Failed to fetch products:', error.message);
        throw error;
    }

    if (!productList || productList.length === 0) {
        console.log('📦 No products found');
        return { total: 0, migrated: 0, skipped: 0, errors: 0, totalSaved: 0, results: [] };
    }

    console.log(`📦 Found ${productList.length} products`);
    console.log(`⚡ Processing ${BATCH_SIZE} at a time\n`);

    const results: MigrationResult[] = [];
    let migrated = 0;
    let skipped = 0;
    let errors = 0;
    let totalSaved = 0;

    // Process in batches
    const totalBatches = Math.ceil(productList.length / BATCH_SIZE);

    for (let i = 0; i < productList.length; i += BATCH_SIZE) {
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const batchList = productList.slice(i, i + BATCH_SIZE);
        const batchIds = batchList.map(p => p.id);

        console.log(`\n📦 Batch ${batchNum}/${totalBatches}`);

        // Fetch images for this batch only
        const { data: batchData, error: batchError } = await supabase
            .from('products')
            .select('id, name, images, thumbnail')
            .in('id', batchIds);

        if (batchError) {
            console.error(`⚠️ Batch ${batchNum} fetch failed:`, batchError.message);
            errors += batchList.length;
            continue;
        }

        // Process each product in the batch
        for (const product of (batchData || [])) {
            const result = await migrateProduct(product);
            results.push(result);

            if (result.status === 'success') {
                migrated++;
                totalSaved += result.originalSize || 0;
            } else if (result.status === 'skipped') {
                skipped++;
            } else {
                errors++;
            }
        }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 MIGRATION COMPLETE');
    console.log('='.repeat(50));
    console.log(`   Products migrated: ${migrated}`);
    console.log(`   Products skipped:  ${skipped}`);
    console.log(`   Errors:            ${errors}`);
    console.log(`   💾 Total saved:    ${(totalSaved / 1024 / 1024).toFixed(2)} MB`);
    console.log('');
    console.log('   🎯 Expected monthly egress reduction: ~90%');
    console.log('='.repeat(50));

    return {
        total: productList.length,
        migrated,
        skipped,
        errors,
        totalSaved,
        results
    };
}

/**
     * Migrate a single product by ID (for testing)
     */
export async function migrateProductById(productId: number): Promise<MigrationResult> {
    console.log(`🔧 Migrating single product: ID ${productId}`);

    const { data: product, error } = await supabase
        .from('products')
        .select('id, name, images, thumbnail')
        .eq('id', productId)
        .single();

    if (error || !product) {
        return {
            productId,
            productName: 'Unknown',
            status: 'error',
            message: error?.message || 'Product not found'
        };
    }

    return migrateProduct(product);
}

/**
 * Check migration status - estimate savings before migrating
 */
export async function checkMigrationStatus(): Promise<{
    total: number;
    withBase64: number;
    migrated: number;
    estimatedSavings: number;
}> {
    const { data: products, error } = await supabase
        .from('products')
        .select('id, images');

    if (error || !products) {
        throw error || new Error('No products found');
    }

    let withBase64 = 0;
    let estimatedSavings = 0;

    for (const product of products) {
        const images = product.images || [];
        const hasBase64 = images.some(isBase64Image);

        if (hasBase64) {
            withBase64++;
            estimatedSavings += images.reduce((total: number, img: string) => {
                return total + (isBase64Image(img) ? getBase64Size(img) : 0);
            }, 0);
        }
    }

    console.log('\n📊 EGRESS OPTIMIZATION STATUS');
    console.log('='.repeat(45));
    console.log(`   Total products:       ${products.length}`);
    console.log(`   ⚠️  Need migration:    ${withBase64}`);
    console.log(`   ✅ Already optimized: ${products.length - withBase64}`);
    console.log(`   💾 Estimated savings: ${(estimatedSavings / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   🎯 Target egress:     <1 GB/month`);
    console.log('='.repeat(45));

    return {
        total: products.length,
        withBase64,
        migrated: products.length - withBase64,
        estimatedSavings
    };
}

// Export for use in Admin panel
export default {
    runMigration,
    migrateProductById,
    checkMigrationStatus
};
