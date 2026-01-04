/**
 * Image and Video Compression Utility
 * Automatically compresses oversized images and videos before upload
 */

// Configuration for compression
const IMAGE_CONFIG = {
    maxWidth: 1200,           // Max width in pixels
    maxHeight: 1200,          // Max height in pixels
    quality: 0.8,             // JPEG/WebP quality (0-1)
    thumbnailWidth: 400,      // Thumbnail width
    thumbnailHeight: 300,     // Thumbnail height
    thumbnailQuality: 0.7,    // Thumbnail quality
    maxFileSizeMB: 2,        // Max file size in MB
};

const VIDEO_CONFIG = {
    maxFileSizeMB: 50,       // Max video size in MB (warn only, can't compress in browser)
};

/**
 * Compress an image file
 * @param file - The image file to compress
 * @param options - Optional compression options
 * @returns Promise with compressed image as base64 string
 */
export async function compressImage(
    file: File,
    options?: {
        maxWidth?: number;
        maxHeight?: number;
        quality?: number;
    }
): Promise<string> {
    const config = {
        maxWidth: options?.maxWidth || IMAGE_CONFIG.maxWidth,
        maxHeight: options?.maxHeight || IMAGE_CONFIG.maxHeight,
        quality: options?.quality || IMAGE_CONFIG.quality,
    };

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;

                // Only resize if image is larger than max dimensions
                if (width > config.maxWidth || height > config.maxHeight) {
                    const ratio = Math.min(
                        config.maxWidth / width,
                        config.maxHeight / height
                    );
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                    console.log(`📸 Resizing image from ${img.width}x${img.height} to ${width}x${height}`);
                }

                // Create canvas and draw resized image
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }

                // Use high quality image rendering
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to JPEG/WebP with quality setting
                const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
                const compressed = canvas.toDataURL(mimeType, config.quality);

                // Calculate compression stats
                const originalSize = file.size / 1024;
                const compressedSize = (compressed.length * 0.75) / 1024; // Base64 is ~33% larger
                console.log(`📸 Compressed: ${originalSize.toFixed(1)}KB → ${compressedSize.toFixed(1)}KB (${((1 - compressedSize / originalSize) * 100).toFixed(0)}% reduction)`);

                resolve(compressed);
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = event.target?.result as string;
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Create a thumbnail from an image file
 * @param file - The image file
 * @returns Promise with thumbnail as base64 string
 */
export async function createThumbnail(file: File): Promise<string> {
    return compressImage(file, {
        maxWidth: IMAGE_CONFIG.thumbnailWidth,
        maxHeight: IMAGE_CONFIG.thumbnailHeight,
        quality: IMAGE_CONFIG.thumbnailQuality,
    });
}

/**
 * Compress multiple images
 * @param files - Array of image files
 * @returns Promise with array of compressed images as base64 strings
 */
export async function compressImages(files: File[]): Promise<string[]> {
    console.log(`📸 Compressing ${files.length} image(s)...`);
    const compressed = await Promise.all(files.map(file => compressImage(file)));
    console.log(`📸 All ${files.length} image(s) compressed successfully`);
    return compressed;
}

/**
 * Check if video file size is acceptable
 * @param file - The video file
 * @returns Object with isValid boolean and message
 */
export function checkVideoSize(file: File): { isValid: boolean; message: string; sizeMB: number } {
    const sizeMB = file.size / (1024 * 1024);

    if (sizeMB > VIDEO_CONFIG.maxFileSizeMB) {
        return {
            isValid: false,
            message: `Video is too large (${sizeMB.toFixed(1)}MB). Maximum allowed size is ${VIDEO_CONFIG.maxFileSizeMB}MB. Please compress the video before uploading.`,
            sizeMB,
        };
    }

    return {
        isValid: true,
        message: `Video size: ${sizeMB.toFixed(1)}MB`,
        sizeMB,
    };
}

/**
 * Convert video file to base64 (with size warning)
 * Note: Browser-based video compression is not practical, so we just convert and warn about size
 * @param file - The video file
 * @returns Promise with video as base64 string
 */
export async function processVideo(file: File): Promise<{ data: string; warning?: string }> {
    const sizeCheck = checkVideoSize(file);

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            resolve({
                data: base64,
                warning: sizeCheck.isValid ? undefined : sizeCheck.message,
            });
        };

        reader.onerror = () => reject(new Error('Failed to read video file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Get file size in human readable format
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Check if a file is an image
 */
export function isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
}

/**
 * Check if a file is a video
 */
export function isVideoFile(file: File): boolean {
    return file.type.startsWith('video/');
}
