import { Link, useNavigate } from 'react-router-dom';
import { Utensils, Pill, FlaskConical, Gift, Handshake, Award, TrendingUp, Calendar, ArrowRight, MessageCircle, X } from 'lucide-react';
import { useTranslation, useEnquiry, useAuth } from '../context';
import { products, categories } from '../data';
import { useState, useEffect } from 'react';
import { AuthModal } from '../components/auth/AuthModal';
import { getVideoFromDB } from '../utils/storage';

export function Home() {
    const t = useTranslation();
    const { submitGeneralEnquiry, submitProductEnquiry } = useEnquiry();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [pendingProduct, setPendingProduct] = useState<number | null>(null);
    const [showPopup, setShowPopup] = useState(false);
    const [trendingProducts, setTrendingProducts] = useState(products.filter(p => p.isTrending).slice(0, 4));
    const [videoUrl, setVideoUrl] = useState(localStorage.getItem('arovaveVideoUrl') || 'https://cdn.pixabay.com/video/2020/05/25/40130-424930032_large.mp4');

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Load video from IndexedDB
    useEffect(() => {
        const loadVideo = async () => {
            const saved = await getVideoFromDB();
            if (saved) {
                setVideoUrl(saved);
            }
        };
        loadVideo();
        // Check periodically for changes
        const interval = setInterval(loadVideo, 2000);
        return () => clearInterval(interval);
    }, []);

    // Auto-close popup after 3 seconds
    useEffect(() => {
        if (showPopup) {
            const timer = setTimeout(() => setShowPopup(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [showPopup]);

    // After login, submit pending enquiry
    useEffect(() => {
        if (isAuthenticated && pendingProduct) {
            const product = products.find(p => p.id === pendingProduct);
            if (product) {
                submitProductEnquiry(product);
                setShowPopup(true);
                setTimeout(() => navigate('/enquiries'), 2000);
            }
            setPendingProduct(null);
        }
    }, [isAuthenticated, pendingProduct]);

    // Refresh trending products from localStorage
    useEffect(() => {
        const checkTrending = () => {
            // Get products from localStorage
            const savedProducts = localStorage.getItem('arovaveProducts');
            const allProducts = savedProducts ? JSON.parse(savedProducts) : products;

            const savedTrending = localStorage.getItem('arovaveTrendingProducts');
            if (savedTrending) {
                const trendingIds = JSON.parse(savedTrending) as number[];
                const trending = allProducts.filter((p: any) => trendingIds.includes(p.id)).slice(0, 4);
                if (trending.length > 0) {
                    setTrendingProducts(trending);
                    return;
                }
            }
            // Fallback to isTrending property
            const trending = allProducts.filter((p: any) => p.isTrending).slice(0, 4);
            setTrendingProducts(trending.length > 0 ? trending : allProducts.slice(0, 4));
        };
        checkTrending();
        // Check every second for updates
        const interval = setInterval(checkTrending, 1000);
        return () => clearInterval(interval);
    }, []);

    const trustCards = [
        { id: 'middleman', icon: Handshake, title: 'Direct Manufacturer Access', desc: t('trust_middleman_desc') },
        { id: 'certificate', icon: Award, title: 'Certificates and Verified Quality', desc: t('trust_certificate_desc') },
        { id: 'rates', icon: TrendingUp, title: 'Factory Direct Pricing', desc: t('trust_rates_desc') },
        { id: 'history', icon: Calendar, title: 'Decades of Industrial Experience', desc: t('trust_history_desc') }
    ];

    const categoryNav = [
        { id: 'food', name: 'Processed Food', icon: Utensils },
        { id: 'pharma', name: 'Generic Medicines', icon: Pill },
        { id: 'glass', name: 'Glass Bottles', icon: FlaskConical },
        { id: 'promo', name: 'Promotional Items', icon: Gift }
    ];

    const globalPresenceCountries = [
        'USA', 'UK', 'UAE', 'Germany', 'Australia',
        'Japan', 'Canada', 'Singapore', 'France', 'Italy',
        'European Union', 'South Africa', 'Saudi Arabia', 'Russia', 'Vietnam',
        'Netherlands', 'Spain', 'Mexico', 'Thailand', 'Malaysia'
    ];

    const handleContactUs = () => {
        if (!isAuthenticated) {
            setShowAuthModal(true);
            return;
        }
        submitGeneralEnquiry();
        setShowPopup(true);
        setTimeout(() => navigate('/enquiries'), 2000);
    };

    const handleProductEnquiry = (productId: number) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        if (!isAuthenticated) {
            setPendingProduct(productId);
            setShowAuthModal(true);
            return;
        }
        submitProductEnquiry(product);
        setShowPopup(true);
        setTimeout(() => navigate('/enquiries'), 2000);
    };

    const displayProducts = trendingProducts.length > 0 ? trendingProducts : products.slice(0, 4);

    return (
        <div className="page-enter">
            {/* Success Popup */}
            {showPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-3xl p-8 max-w-sm mx-4 text-center shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-black mb-2">Enquiry Submitted!</h3>
                        <p className="text-zinc-500 mb-6">Our team will contact you shortly.</p>
                        <button
                            onClick={() => {
                                setShowPopup(false);
                                navigate('/enquiries');
                            }}
                            className="px-8 py-3 bg-black text-white font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-colors"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            {/* Category Navigation Bar - Hidden on mobile */}
            <div className="hidden md:block border-b border-zinc-100 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex justify-center gap-8 py-4 overflow-x-auto">
                        {categoryNav.map(cat => (
                            <Link
                                key={cat.id}
                                to={`/catalog?category=${cat.id}`}
                                className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 hover:text-black transition-colors whitespace-nowrap"
                            >
                                {cat.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Hero Section with Video Background */}
            <section className="hero-area min-h-[80vh] flex items-center justify-center relative">
                <video
                    className="hero-video"
                    autoPlay
                    muted
                    loop
                    playsInline
                    src={videoUrl}
                />
                <div className="hero-overlay" />

                <div className="relative z-10 text-center px-6 py-20">
                    <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9] mb-8">
                        <span className="block">Global Export.</span>
                        <span className="block">Trusted Supply.</span>
                    </h1>

                    <p className="text-lg md:text-xl text-zinc-700 font-medium max-w-2xl mx-auto mb-16">
                        Connecting international buyers with India's most
                        <br className="hidden md:block" />
                        certified manufacturing plants.
                    </p>

                    <div className="flex flex-col items-center">
                        <p className="text-sm font-bold text-black uppercase tracking-[0.3em] mb-6">
                            Still Confused?
                        </p>
                        <button
                            onClick={handleContactUs}
                            className="px-12 py-4 bg-black text-white font-bold text-sm uppercase tracking-[0.2em] rounded-full hover:bg-zinc-800 transition-colors"
                        >
                            Contact Us
                        </button>
                    </div>
                </div>
            </section>

            {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

            {/* Why Trust Arovave */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-center mb-12">
                        {t('whyTrust')}
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {trustCards.map(card => (
                            <Link
                                key={card.id}
                                to={`/trust/${card.id}`}
                                className="trust-card group"
                            >
                                <card.icon className="w-10 h-10 mb-6 text-zinc-400 group-hover:text-black transition-colors" />
                                <h3 className="font-black text-lg mb-3">{card.title}</h3>
                                <p className="text-zinc-500 text-sm leading-relaxed">{card.desc}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="py-20 bg-zinc-50">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-center mb-12">
                        {t('categories')}
                    </h2>
                    <div className="grid md:grid-cols-4 gap-6">
                        {categories.map(cat => {
                            const navCat = categoryNav.find(c => c.id === cat.id);
                            const Icon = navCat?.icon || Utensils;
                            return (
                                <Link
                                    key={cat.id}
                                    to={`/catalog?category=${cat.id}`}
                                    className="category-box rounded-3xl p-8 text-center group cursor-pointer"
                                >
                                    <Icon className="w-12 h-12 mx-auto mb-4" />
                                    <h3 className="font-bold text-sm uppercase tracking-widest">{cat.name}</h3>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Trending Products */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex justify-between items-center mb-12">
                        <h2 className="text-3xl font-black uppercase tracking-tighter">
                            Trending Products
                        </h2>
                        <Link to="/catalog?filter=trending" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-black transition-colors">
                            View All <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {displayProducts.map(product => (
                            <div key={product.id} className="bg-zinc-50 rounded-3xl overflow-hidden group">
                                <Link to={`/product/${product.id}`}>
                                    <div className="aspect-square overflow-hidden">
                                        <img
                                            src={product.images[0]}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                </Link>
                                <div className="p-6">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                                        {product.cat}
                                    </span>
                                    <h3 className="font-bold text-lg mt-1 mb-3">{product.name}</h3>
                                    <p className="text-sm font-bold text-zinc-600 mb-4">{product.priceRange}</p>
                                    <div className="flex gap-2">
                                        <Link
                                            to={`/product/${product.id}`}
                                            className="flex-1 py-3 border-2 border-zinc-200 rounded-xl text-center text-[9px] font-black uppercase tracking-widest hover:border-black transition-colors"
                                        >
                                            {t('viewDetails')}
                                        </Link>
                                        <button
                                            onClick={() => handleProductEnquiry(product.id)}
                                            className="px-4 py-3 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                                        >
                                            Enquire
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Global Presence */}
            <section className="py-20 bg-zinc-50">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-center mb-4">
                        Global Presence
                    </h2>
                    <p className="text-center text-zinc-500 mb-16">
                        Operating in over 40+ major trade nations across 5 continents.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {globalPresenceCountries.map(country => (
                            <div
                                key={country}
                                className="py-4 px-6 text-center border-2 border-zinc-200 rounded-xl font-black text-sm uppercase tracking-widest text-black hover:border-black hover:bg-white transition-all cursor-default"
                            >
                                {country}
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
