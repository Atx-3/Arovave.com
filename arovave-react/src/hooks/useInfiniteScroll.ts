import { useState, useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions<T> {
    /** Initial page size (default: 12) */
    pageSize?: number;
    /** Function to fetch data - receives offset and limit, returns items */
    fetchFn: (offset: number, limit: number) => Promise<T[]>;
    /** Optional dependencies to refetch when changed */
    dependencies?: any[];
}

interface UseInfiniteScrollResult<T> {
    /** All loaded items */
    items: T[];
    /** Whether currently loading */
    isLoading: boolean;
    /** Whether there are more items to load */
    hasMore: boolean;
    /** Error if any */
    error: Error | null;
    /** Ref to attach to the scroll sentinel element */
    sentinelRef: React.RefObject<HTMLDivElement>;
    /** Manually trigger load more */
    loadMore: () => void;
    /** Reset and reload from beginning */
    reset: () => void;
    /** Total count of loaded items */
    loadedCount: number;
}

/**
 * useInfiniteScroll - Custom hook for infinite scroll pagination
 * 
 * Usage:
 * ```tsx
 * const { items, isLoading, hasMore, sentinelRef } = useInfiniteScroll({
 *   pageSize: 12,
 *   fetchFn: async (offset, limit) => {
 *     const { data } = await supabase.from('products').select('*').range(offset, offset + limit - 1);
 *     return data || [];
 *   }
 * });
 * 
 * return (
 *   <>
 *     {items.map(item => <ProductCard key={item.id} product={item} />)}
 *     <div ref={sentinelRef} /> {/* This triggers loading more when visible *​/}
 *     {isLoading && <Loader />}
 *   </>
 * );
 * ```
 */
export function useInfiniteScroll<T>({
    pageSize = 12,
    fetchFn,
    dependencies = []
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollResult<T> {
    const [items, setItems] = useState<T[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [offset, setOffset] = useState(0);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const isLoadingRef = useRef(false);

    const loadMore = useCallback(async () => {
        // Prevent duplicate loads
        if (isLoadingRef.current || !hasMore) return;

        isLoadingRef.current = true;
        setIsLoading(true);
        setError(null);

        try {
            console.log(`📦 Loading items ${offset} to ${offset + pageSize - 1}...`);
            const newItems = await fetchFn(offset, pageSize);

            if (newItems.length < pageSize) {
                setHasMore(false);
                console.log('📦 No more items to load');
            }

            if (newItems.length > 0) {
                setItems(prev => [...prev, ...newItems]);
                setOffset(prev => prev + newItems.length);
                console.log(`📦 Loaded ${newItems.length} items, total: ${offset + newItems.length}`);
            }
        } catch (err) {
            console.error('❌ Error loading items:', err);
            setError(err instanceof Error ? err : new Error('Failed to load items'));
        } finally {
            setIsLoading(false);
            isLoadingRef.current = false;
        }
    }, [offset, pageSize, hasMore, fetchFn]);

    const reset = useCallback(() => {
        setItems([]);
        setOffset(0);
        setHasMore(true);
        setError(null);
        isLoadingRef.current = false;
    }, []);

    // Initial load
    useEffect(() => {
        reset();
        // Small delay to ensure reset completes
        const timer = setTimeout(() => {
            loadMore();
        }, 0);
        return () => clearTimeout(timer);
    }, [...dependencies]);

    // Intersection Observer for infinite scroll
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting && hasMore && !isLoadingRef.current) {
                    loadMore();
                }
            },
            {
                rootMargin: '200px', // Start loading 200px before sentinel is visible
                threshold: 0.1
            }
        );

        observer.observe(sentinel);

        return () => observer.disconnect();
    }, [hasMore, loadMore]);

    return {
        items,
        isLoading,
        hasMore,
        error,
        sentinelRef,
        loadMore,
        reset,
        loadedCount: items.length
    };
}

export default useInfiniteScroll;
