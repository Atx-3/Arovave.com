/**
 * Comprehensive Analytics Utility
 * Tracks: Page views, scroll depth, product views, enquiries, time on page
 * Supports: Google Analytics 4, Facebook Pixel, Google Ads Remarketing
 * 
 * Dynamic Product Remarketing - shows exact products users viewed in their ads!
 */

// Get IDs from environment variables (add to .env file)
const GA4_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID || '';
const FB_PIXEL_ID = import.meta.env.VITE_FB_PIXEL_ID || '';
const GOOGLE_ADS_ID = import.meta.env.VITE_GOOGLE_ADS_ID || '';

// Type declarations for global objects
declare global {
    interface Window {
        gtag: (...args: any[]) => void;
        dataLayer: any[];
        fbq: (...args: any[]) => void;
        _fbq: any;
    }
}

/**
 * Initialize Google Analytics 4
 */
export function initGA4(): void {
    if (!GA4_MEASUREMENT_ID) {
        console.log('📊 GA4 not configured - add VITE_GA4_MEASUREMENT_ID to .env');
        return;
    }

    // Load GA4 script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: any[]) {
        window.dataLayer.push(args);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA4_MEASUREMENT_ID, {
        send_page_view: false, // We'll send manually for SPA
        cookie_flags: 'SameSite=None;Secure'
    });

    // Enable enhanced measurement
    window.gtag('config', GA4_MEASUREMENT_ID, {
        enhanced_measurement: true
    });

    console.log('📊 Google Analytics 4 initialized');
}

/**
 * Initialize Facebook Pixel (for Meta Ads Dynamic Remarketing)
 */
export function initFacebookPixel(): void {
    if (!FB_PIXEL_ID) {
        console.log('📱 Facebook Pixel not configured - add VITE_FB_PIXEL_ID to .env');
        return;
    }

    // Facebook Pixel base code
    (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
        if (f.fbq) return;
        n = f.fbq = function (...args: any[]) {
            n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    window.fbq('init', FB_PIXEL_ID);
    window.fbq('track', 'PageView');

    console.log('📱 Facebook Pixel initialized');
}

/**
 * Initialize Google Ads Remarketing (optional)
 */
export function initGoogleAds(): void {
    if (!GOOGLE_ADS_ID) {
        console.log('🎯 Google Ads Remarketing not configured - add VITE_GOOGLE_ADS_ID to .env');
        return;
    }

    window.gtag('config', GOOGLE_ADS_ID);
    console.log('🎯 Google Ads Remarketing initialized');
}

/**
 * Initialize all analytics
 */
export function initAnalytics(): void {
    console.log('🚀 Initializing analytics...');
    initGA4();
    initFacebookPixel();
    initGoogleAds();
}

/**
 * Track page view (call on route change)
 */
export function trackPageView(path: string, title: string): void {
    // GA4
    if (GA4_MEASUREMENT_ID && window.gtag) {
        window.gtag('event', 'page_view', {
            page_path: path,
            page_title: title,
            page_location: window.location.href
        });
    }

    // Facebook
    if (FB_PIXEL_ID && window.fbq) {
        window.fbq('track', 'PageView');
    }

    console.log(`📄 Page view: ${path}`);
}

/**
 * Set user properties when they log in
 * THIS LETS YOU SEE USER DETAILS IN GA4!
 */
export function setUserProperties(user: {
    id: string;
    email?: string;
    name?: string;
    country?: string;
    phone?: string;
}): void {
    if (GA4_MEASUREMENT_ID && window.gtag) {
        // Set user ID for cross-device tracking
        window.gtag('config', GA4_MEASUREMENT_ID, {
            user_id: user.id
        });

        // Set user properties (visible in GA4 User Explorer)
        window.gtag('set', 'user_properties', {
            user_email: user.email || '',
            user_name: user.name || '',
            user_country: user.country || '',
            user_phone: user.phone || ''
        });

        console.log(`👤 User set: ${user.name || user.email}`);
    }

    // Facebook - Advanced Matching
    if (FB_PIXEL_ID && window.fbq) {
        window.fbq('init', FB_PIXEL_ID, {
            em: user.email?.toLowerCase() || '',
            ph: user.phone || '',
            country: user.country?.toLowerCase() || ''
        });
    }
}

/**
 * Track product view (for dynamic remarketing)
 * THIS IS KEY FOR SHOWING PRODUCT ADS!
 */
export function trackProductView(product: {
    id: number | string;
    name: string;
    category: string;
    price?: string;
    thumbnail?: string;
}): void {
    // GA4 - Enhanced Ecommerce
    if (GA4_MEASUREMENT_ID && window.gtag) {
        window.gtag('event', 'view_item', {
            currency: 'USD',
            value: 0,
            items: [{
                item_id: String(product.id),
                item_name: product.name,
                item_category: product.category,
                price: product.price
            }]
        });
    }

    // Facebook Pixel - ViewContent (enables dynamic ads!)
    if (FB_PIXEL_ID && window.fbq) {
        window.fbq('track', 'ViewContent', {
            content_ids: [String(product.id)],
            content_name: product.name,
            content_category: product.category,
            content_type: 'product',
            value: 0,
            currency: 'USD'
        });
    }

    // Google Ads Remarketing
    if (GOOGLE_ADS_ID && window.gtag) {
        window.gtag('event', 'view_item', {
            send_to: GOOGLE_ADS_ID,
            dynx_itemid: String(product.id),
            dynx_pagetype: 'offerdetail',
            dynx_totalvalue: 0
        });
    }

    console.log(`📦 Product view: ${product.name}`);
}

/**
 * Track enquiry submission (Lead conversion)
 */
export function trackEnquiry(data: {
    products: Array<{ id: number | string; name: string }>;
    email?: string;
    phone?: string;
    country?: string;
}): void {
    const productIds = data.products.map(p => String(p.id));
    const productNames = data.products.map(p => p.name);

    // GA4
    if (GA4_MEASUREMENT_ID && window.gtag) {
        window.gtag('event', 'generate_lead', {
            currency: 'USD',
            value: 0,
            items: data.products.map(p => ({
                item_id: String(p.id),
                item_name: p.name
            }))
        });

        // Custom event with more details
        window.gtag('event', 'enquiry_submit', {
            product_ids: productIds.join(','),
            product_names: productNames.join(', '),
            user_email: data.email || 'not_provided',
            user_country: data.country || 'unknown'
        });
    }

    // Facebook Pixel - Lead event (tracks conversions)
    if (FB_PIXEL_ID && window.fbq) {
        window.fbq('track', 'Lead', {
            content_ids: productIds,
            content_name: productNames.join(', '),
            content_type: 'product',
            value: 0,
            currency: 'USD'
        });
    }

    // Google Ads Conversion
    if (GOOGLE_ADS_ID && window.gtag) {
        window.gtag('event', 'conversion', {
            send_to: GOOGLE_ADS_ID,
            dynx_itemid: productIds,
            dynx_pagetype: 'conversionintent'
        });
    }

    console.log(`🛒 Enquiry tracked: ${productNames.join(', ')}`);
}

/**
 * Track search query
 */
export function trackSearch(query: string): void {
    if (GA4_MEASUREMENT_ID && window.gtag) {
        window.gtag('event', 'search', {
            search_term: query
        });
    }

    if (FB_PIXEL_ID && window.fbq) {
        window.fbq('track', 'Search', {
            search_string: query
        });
    }

    console.log(`🔍 Search: ${query}`);
}

/**
 * Track scroll depth (call from scroll handler)
 */
export function trackScrollDepth(percentage: number): void {
    if (GA4_MEASUREMENT_ID && window.gtag) {
        window.gtag('event', 'scroll_depth', {
            percent_scrolled: percentage
        });
    }
    console.log(`📜 Scroll depth: ${percentage}%`);
}

/**
 * Track category filter
 */
export function trackCategoryFilter(category: string, subcategory?: string): void {
    if (GA4_MEASUREMENT_ID && window.gtag) {
        window.gtag('event', 'select_content', {
            content_type: 'category',
            category: category,
            subcategory: subcategory || ''
        });
    }
    console.log(`📁 Category filter: ${category} ${subcategory ? '> ' + subcategory : ''}`);
}

/**
 * Track outbound link clicks
 */
export function trackOutboundLink(url: string, label: string): void {
    if (GA4_MEASUREMENT_ID && window.gtag) {
        window.gtag('event', 'click', {
            event_category: 'outbound',
            event_label: label,
            transport_type: 'beacon',
            event_callback: () => {
                window.location.href = url;
            }
        });
    }
    console.log(`🔗 Outbound click: ${label}`);
}

/**
 * Track WhatsApp click
 */
export function trackWhatsAppClick(): void {
    if (GA4_MEASUREMENT_ID && window.gtag) {
        window.gtag('event', 'contact', {
            method: 'whatsapp'
        });
    }

    if (FB_PIXEL_ID && window.fbq) {
        window.fbq('track', 'Contact', {
            method: 'whatsapp'
        });
    }

    console.log(`📱 WhatsApp click tracked`);
}

/**
 * Track time spent on page (call on unmount)
 */
export function trackTimeOnPage(seconds: number, pagePath: string): void {
    if (GA4_MEASUREMENT_ID && window.gtag) {
        window.gtag('event', 'timing_complete', {
            name: 'time_on_page',
            value: seconds,
            metric_id: pagePath
        });
    }
    console.log(`⏱️ Time on ${pagePath}: ${seconds}s`);
}

/**
 * Add to cart (enquiry cart)
 */
export function trackAddToCart(product: {
    id: number | string;
    name: string;
    category: string;
}): void {
    if (GA4_MEASUREMENT_ID && window.gtag) {
        window.gtag('event', 'add_to_cart', {
            currency: 'USD',
            value: 0,
            items: [{
                item_id: String(product.id),
                item_name: product.name,
                item_category: product.category
            }]
        });
    }

    if (FB_PIXEL_ID && window.fbq) {
        window.fbq('track', 'AddToCart', {
            content_ids: [String(product.id)],
            content_name: product.name,
            content_type: 'product',
            value: 0,
            currency: 'USD'
        });
    }

    console.log(`🛒 Add to cart: ${product.name}`);
}

export default {
    initAnalytics,
    trackPageView,
    setUserProperties,
    trackProductView,
    trackEnquiry,
    trackSearch,
    trackScrollDepth,
    trackCategoryFilter,
    trackOutboundLink,
    trackWhatsAppClick,
    trackTimeOnPage,
    trackAddToCart
};
