/**
 * Supabase Storage Upload Utility
 * Handles image uploads with AVIF compression for MAXIMUM egress reduction
 * AVIF provides ~50% better compression than WebP
 */

import { supabase } from '../lib/supabase';

const BUCKET_NAME = 'product-images';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit

// BALANCED COMPRESSION: Good quality with reasonable file size (100-200KB)
const COMPRESSION_SETTINGS = {
    maxWidth: 800,       // Larger for better quality
    maxHeight: 800,
    quality: 0.75,       // Higher quality = clearer images
    thumbnailWidth: 300,
    thumbnailHeight: 225,
    thumbnailQuality: 0.60  // Better thumbnail quality
};

/**
 * Generate a unique filename for storage
 */
function generateFileName(productId: number | string, index: number, extension: string = 'avif'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${productId}/${timestamp}-${index}-${random}.${extension}`;
}

/**
 * Get public URL for a stored image
 */
export function getPublicUrl(path: string): string {
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
    return data.publicUrl;
}

/**
 * Check if browser supports AVIF
 */
function supportsAVIF(): Promise<boolean> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img.width > 0 && img.height > 0);
        img.onerror = () => resolve(false);
        img.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKBzgABpAQ0AIyD0QzZQAAABRqASMCZNyCeAAU1H36mCE=';
    });
}

/**
 * Compress image to AVIF format (falls back to WebP if AVIF not supported)
 * AVIF provides ~50% better compression than WebP
 */
export async function compressToAVIF(
    file: File | Blob,
    options: {
        maxWidth?: number;
        maxHeight?: number;
        quality?: number;
    } = {}
): Promise<{ blob: Blob; format: 'avif' | 'webp' }> {
    const {
        maxWidth = COMPRESSION_SETTINGS.maxWidth,
        maxHeight = COMPRESSION_SETTINGS.maxHeight,
        quality = COMPRESSION_SETTINGS.quality
    } = options;

    // Check AVIF support
    const canUseAVIF = await supportsAVIF();
    const format = canUseAVIF ? 'avif' : 'webp';
    const mimeType = canUseAVIF ? 'image/avif' : 'image/webp';

    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
            // Calculate dimensions
            let { width, height } = img;

            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
                console.log(`📸 Resizing: ${img.width}x${img.height} → ${width}x${height}`);
            }

            // Create canvas
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to AVIF/WebP
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const originalKB = file.size / 1024;
                        const compressedKB = blob.size / 1024;
                        const reduction = ((1 - compressedKB / originalKB) * 100).toFixed(0);
                        console.log(`📸 Compressed (${format.toUpperCase()}): ${originalKB.toFixed(0)}KB → ${compressedKB.toFixed(0)}KB (${reduction}% smaller)`);
                        resolve({ blob, format });
                    } else {
                        reject(new Error('Failed to compress image'));
                    }
                },
                mimeType,
                quality
            );
        };

        img.onerror = () => reject(new Error('Failed to load image'));

        // Read file as data URL
        if (file instanceof File) {
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target?.result as string;
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        } else {
            const url = URL.createObjectURL(file);
            img.src = url;
        }
    });
}

/**
 * Convert base64 string to Blob
 */
function base64ToBlob(base64: string): Blob {
    // Handle URLs (not base64)
    if (!base64.startsWith('data:')) {
        throw new Error('Not a base64 string');
    }

    const parts = base64.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

/**
 * Upload a single image to Supabase Storage with AVIF compression
 * Returns the public URL of the uploaded image
 */
export async function uploadToStorage(
    imageData: File | Blob | string,
    productId: number | string,
    index: number = 0
): Promise<string> {
    // If it's already a URL (not base64), return as is
    if (typeof imageData === 'string' && !imageData.startsWith('data:')) {
        console.log(`📸 Image ${index}: Already a URL, skipping upload`);
        return imageData;
    }

    // Convert base64 to Blob if needed
    let blob: Blob;
    if (typeof imageData === 'string') {
        try {
            blob = base64ToBlob(imageData);
        } catch {
            return imageData; // Return as-is if not valid base64
        }
    } else {
        blob = imageData;
    }

    // Check file size
    if (blob.size > MAX_FILE_SIZE) {
        throw new Error(`Image too large: ${(blob.size / 1024 / 1024).toFixed(1)}MB. Max: 50MB`);
    }

    try {
        // Compress to AVIF (or WebP fallback)
        const { blob: compressed, format } = await compressToAVIF(blob);
        const fileName = generateFileName(productId, index, format);
        const contentType = format === 'avif' ? 'image/avif' : 'image/webp';

        console.log(`📤 Uploading ${fileName} (${(compressed.size / 1024).toFixed(0)}KB)...`);

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, compressed, {
                contentType,
                cacheControl: '31536000', // Cache for 1 year (reduces repeat requests)
                upsert: true
            });

        if (error) {
            console.error(`❌ Upload failed:`, error.message);
            throw error;
        }

        // Get public URL
        const publicUrl = getPublicUrl(data.path);
        console.log(`✅ Uploaded: ${publicUrl}`);
        return publicUrl;
    } catch (error) {
        console.error('❌ Upload error:', error);
        // Fallback: return base64 if upload fails
        if (typeof imageData === 'string') {
            console.warn('⚠️ Upload failed, falling back to base64');
            return imageData;
        }
        throw error;
    }
}

/**
 * Upload multiple images to Supabase Storage
 * Returns array of public URLs
 */
export async function uploadMultipleToStorage(
    images: (File | Blob | string)[],
    productId: number | string
): Promise<string[]> {
    console.log(`📤 Uploading ${images.length} images with AVIF compression...`);

    const urls = await Promise.all(
        images.map((img, index) => uploadToStorage(img, productId, index))
    );

    console.log(`✅ All ${urls.length} images uploaded`);
    return urls;
}

/**
 * Create a small thumbnail from an image (extra compressed for fast loading)
 */
export async function createThumbnail(imageData: File | Blob | string): Promise<{ blob: Blob; format: 'avif' | 'webp' }> {
    let blob: Blob;

    if (typeof imageData === 'string') {
        if (imageData.startsWith('data:')) {
            blob = base64ToBlob(imageData);
        } else {
            // Fetch URL and convert to blob
            const response = await fetch(imageData);
            blob = await response.blob();
        }
    } else {
        blob = imageData;
    }

    return compressToAVIF(blob, {
        maxWidth: COMPRESSION_SETTINGS.thumbnailWidth,
        maxHeight: COMPRESSION_SETTINGS.thumbnailHeight,
        quality: COMPRESSION_SETTINGS.thumbnailQuality
    });
}

/**
 * Delete an image from storage
 */
export async function deleteFromStorage(path: string): Promise<void> {
    // Extract path from full URL if needed
    const pathMatch = path.match(/product-images\/(.+)$/);
    const storagePath = pathMatch ? pathMatch[1] : path;

    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([storagePath]);

    if (error) {
        console.error('❌ Delete failed:', error);
    } else {
        console.log(`🗑️ Deleted: ${storagePath}`);
    }
}

// Legacy export for compatibility
export const compressToWebP = compressToAVIF;

export default {
    uploadToStorage,
    uploadMultipleToStorage,
    compressToAVIF,
    createThumbnail,
    getPublicUrl,
    deleteFromStorage
};
