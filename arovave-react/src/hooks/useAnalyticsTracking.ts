import { useEffect, useRef } from 'react';
import { trackScrollDepth, trackTimeOnPage } from '../utils/analytics';

/**
 * useAnalyticsTracking - Tracks scroll depth and time on page
 * Use this hook on pages where you want detailed engagement tracking
 * 
 * Tracks:
 * - Scroll depth: 25%, 50%, 75%, 90%, 100%
 * - Time on page: Sent when user leaves the page
 */
export function useAnalyticsTracking(pagePath: string) {
    const startTimeRef = useRef(Date.now());
    const scrollMilestonesRef = useRef<Set<number>>(new Set());

    useEffect(() => {
        // Reset tracking for this page
        startTimeRef.current = Date.now();
        scrollMilestonesRef.current = new Set();

        // SCROLL DEPTH TRACKING
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;

            if (docHeight <= 0) return;

            const scrollPercent = Math.round((scrollTop / docHeight) * 100);

            // Track milestones: 25%, 50%, 75%, 90%, 100%
            const milestones = [25, 50, 75, 90, 100];

            for (const milestone of milestones) {
                if (scrollPercent >= milestone && !scrollMilestonesRef.current.has(milestone)) {
                    scrollMilestonesRef.current.add(milestone);
                    trackScrollDepth(milestone);
                }
            }
        };

        // Throttle scroll events for performance
        let ticking = false;
        const throttledScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', throttledScroll, { passive: true });

        // TIME ON PAGE TRACKING - when user leaves
        const handleBeforeUnload = () => {
            const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
            trackTimeOnPage(timeSpent, pagePath);
        };

        // Also track when navigating away (SPA)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
                trackTimeOnPage(timeSpent, pagePath);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            // Track time when component unmounts (navigation)
            const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
            if (timeSpent > 2) { // Only track if > 2 seconds
                trackTimeOnPage(timeSpent, pagePath);
            }

            window.removeEventListener('scroll', throttledScroll);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [pagePath]);
}

export default useAnalyticsTracking;
