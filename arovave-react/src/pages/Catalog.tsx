import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Utensils, Pill, FlaskConical, Gift, ChevronDown, Check } from 'lucide-react';
import { useTranslation, useEnquiry, useAuth } from '../context';
import { products as initialProducts, categories } from '../data';
import { AuthModal } from '../components/auth/AuthModal';
import type { Product } from '../types';

// Category type for managed categories
type Category = {
    id: string;
    name: string;
    subcategories: { id: string; name: string; }[];
};

// Get products from localStorage or use initial
const getStoredProducts = (): Product[] => {
    const saved = localStorage.getItem('arovaveProducts');
    if (saved) {
        return JSON.parse(saved);
    }
    return [...initialProducts];
};

// Get categories from localStorage or use initial
const getStoredCategories = (): Category[] => {
    const saved = localStorage.getItem('arovaveCategories');
    if (saved) {
        return JSON.parse(saved);
    }
    return categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        subcategories: cat.subcategories || []
    }));
};

export function Catalog() {
    const t = useTranslation();
    const { submitProductEnquiry } = useEnquiry();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedCategory = searchParams.get('category');
    const selectedSubcategory = searchParams.get('subcategory');
    const searchQuery = searchParams.get('search')?.toLowerCase() || '';
    const filterType = searchParams.get('filter');
    const [expandedCategory, setExpandedCategory] = useState<string | null>(selectedCategory);
    const [products, setProducts] = useState<Product[]>(getStoredProducts);
    const [managedCategories, setManagedCategories] = useState<Category[]>(getStoredCategories);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
    const [showPopup, setShowPopup] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        const checkData = () => {
            setProducts(getStoredProducts());
            setManagedCategories(getStoredCategories());
        };
        const interval = setInterval(checkData, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (selectedCategory) setExpandedCategory(selectedCategory);
    }, [selectedCategory]);

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
            submitProductEnquiry(pendingProduct);
            setShowPopup(true);
            setPendingProduct(null);
            setTimeout(() => navigate('/enquiries'), 2000);
        }
    }, [isAuthenticated, pendingProduct]);

    const handleEnquire = (product: Product) => {
        if (!isAuthenticated) {
            setPendingProduct(product);
            setShowAuthModal(true);
            return;
        }
        submitProductEnquiry(product);
        setShowPopup(true);
        setTimeout(() => navigate('/enquiries'), 2000);
    };

    let filteredProducts = products;

    if (filterType === 'trending') {
        const trendingIds = JSON.parse(localStorage.getItem('arovaveTrendingProducts') || '[]');
        filteredProducts = filteredProducts.filter(p => p.isTrending || trendingIds.includes(p.id));
    }

    if (selectedCategory) {
        filteredProducts = filteredProducts.filter(p => p.cat === selectedCategory);
    }

    if (selectedSubcategory) {
        filteredProducts = filteredProducts.filter(p => p.subcategory === selectedSubcategory);
    }

    if (searchQuery) {
        filteredProducts = filteredProducts.filter(p =>
            p.name.toLowerCase().includes(searchQuery) ||
            p.cat.toLowerCase().includes(searchQuery) ||
            p.hsn.includes(searchQuery) ||
            p.description.toLowerCase().includes(searchQuery)
        );
    }

    const categoryIcons: Record<string, typeof Utensils> = {
        food: Utensils,
        pharma: Pill,
        glass: FlaskConical,
        promo: Gift
    };

    const currentCategory = managedCategories.find(c => c.id === selectedCategory);

    return (
        <div className="page-enter">
            {/* Success Popup */}
            {showPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-3xl p-8 max-w-sm mx-4 text-center shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="w-8 h-8 text-green-600" />
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

            {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

            {/* Category Navigation - Hidden on mobile (in hamburger) and when trending filter */}
            {filterType !== 'trending' && (
                <div className="hidden md:block sticky top-[73px] z-40 bg-white/95 backdrop-blur-sm border-b border-zinc-100 shadow-sm">
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        <div className="flex items-center justify-center gap-4 overflow-x-auto scrollbar-hide">
                            {!selectedCategory && (
                                <button
                                    onClick={() => { setSearchParams({}); setExpandedCategory(null); }}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap bg-black text-white"
                                >
                                    All Products
                                </button>
                            )}
                            {managedCategories.map(cat => {
                                const Icon = categoryIcons[cat.id];
                                const hasSubcategories = cat.subcategories && cat.subcategories.length > 0;
                                const isExpanded = expandedCategory === cat.id;
                                return (
                                    <div key={cat.id} className="relative">
                                        <button
                                            onClick={() => {
                                                setSearchParams({ category: cat.id });
                                                if (hasSubcategories) setExpandedCategory(isExpanded ? null : cat.id);
                                            }}
                                            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${selectedCategory === cat.id ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {cat.name}
                                            {hasSubcategories && <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {currentCategory && currentCategory.subcategories && currentCategory.subcategories.length > 0 && (
                            <div className="flex items-center justify-center gap-6 mt-4 overflow-x-auto scrollbar-hide py-2">
                                <button
                                    onClick={() => setSearchParams({ category: currentCategory.id })}
                                    className={`px-6 py-2.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${!selectedSubcategory ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                                >
                                    All {currentCategory.name}
                                </button>
                                {currentCategory.subcategories.map(sub => (
                                    <button
                                        key={sub.id}
                                        onClick={() => setSearchParams({ category: currentCategory.id, subcategory: sub.id })}
                                        className={`px-6 py-2.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${selectedSubcategory === sub.id ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                                    >
                                        {sub.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-black uppercase tracking-tighter">
                        {filterType === 'trending'
                            ? 'Trending Products'
                            : selectedSubcategory
                                ? currentCategory?.subcategories?.find(s => s.id === selectedSubcategory)?.name
                                : selectedCategory
                                    ? categories.find(c => c.id === selectedCategory)?.name
                                    : 'All Products'}
                    </h1>
                    <span className="text-sm text-zinc-400 font-bold">
                        {filteredProducts.length} products
                    </span>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="bg-white rounded-3xl border border-zinc-100 overflow-hidden group hover:shadow-lg transition-shadow">
                            <Link to={`/product/${product.id}`}>
                                <div className="aspect-[4/3] overflow-hidden">
                                    <img src={product.thumbnail || product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>
                            </Link>
                            <div className="p-6">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                                    {categories.find(c => c.id === product.cat)?.name || product.cat}
                                </span>
                                <h3 className="font-bold text-xl mt-2 mb-2">{product.name}</h3>
                                <p className="text-sm text-zinc-500 mb-4 line-clamp-2">{product.description}</p>
                                <div className="flex items-center justify-between mb-4">
                                    <p className="font-bold text-black">{product.priceRange}</p>
                                    <p className="text-xs text-zinc-400">MOQ: {product.moq}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Link to={`/product/${product.id}`} className="flex-1 py-3 border-2 border-zinc-200 rounded-xl text-center text-xs font-bold uppercase tracking-widest hover:border-black transition-colors">
                                        {t('viewDetails')}
                                    </Link>
                                    <button
                                        onClick={() => handleEnquire(product)}
                                        className="px-5 py-3 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                                    >
                                        Enquire
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredProducts.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-zinc-400 text-lg">No products found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
