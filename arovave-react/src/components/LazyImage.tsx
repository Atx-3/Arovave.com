import { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
    src: string;
    alt: string;
    className?: string;
    placeholderClassName?: string;
    priority?: boolean; // If true, load immediately without waiting for viewport
}

/**
 * LazyImage - Optimized progressive loading image component
 * - Higher priority images load immediately
 * - Others preload 300px before visible (increased from 100px)
 * - Uses native lazy loading + decoding async for performance
 */
export function LazyImage({ src, alt, className = '', placeholderClassName = '', priority = false }: LazyImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(priority); // Priority images start in view
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef<HTMLDivElement>(null);

    // Preload image in background for faster display
    useEffect(() => {
        if (priority && src) {
            const img = new Image();
            img.src = src;
        }
    }, [priority, src]);

    useEffect(() => {
        if (priority || !imgRef.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            {
                rootMargin: '300px', // Start loading 300px before visible (increased for faster loading)
                threshold: 0.01
            }
        );

        observer.observe(imgRef.current);

        return () => observer.disconnect();
    }, [priority]);

    const handleLoad = () => {
        setIsLoaded(true);
    };

    const handleError = () => {
        setHasError(true);
        setIsLoaded(true);
    };

    // Don't render anything if no src
    if (!src) {
        return (
            <div className={`relative overflow-hidden bg-zinc-100 ${className}`}>
                <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-8 h-8 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
            </div>
        );
    }

    return (
        <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
            {/* Skeleton placeholder - smooth shimmer effect */}
            {!isLoaded && (
                <div className={`absolute inset-0 bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-100 animate-pulse ${placeholderClassName}`}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skeleton-shimmer" />
                </div>
            )}

            {/* Actual image - load when in viewport or priority */}
            {isInView && (
                <img
                    src={hasError ? '/placeholder.png' : src}
                    alt={alt}
                    className={`w-full h-full object-cover transition-opacity duration-200 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={handleLoad}
                    onError={handleError}
                    loading={priority ? 'eager' : 'lazy'}
                    decoding="async"
                    fetchPriority={priority ? 'high' : 'auto'}
                />
            )}

            {/* Error state */}
            {hasError && isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-100">
                    <div className="text-center text-zinc-400">
                        <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs">No image</span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default LazyImage;

