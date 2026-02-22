import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Globe, User, ShoppingBag, Menu, X, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useLanguage, useTranslation, useAuth, useEnquiry } from '../../context';
import { products, categories } from '../../data';
import { formatPrice } from '../../utils/formatPrice';
import { supabase } from '../../lib/supabase';

// Category type for managed categories
type Category = {
    id: string;
    name: string;
    subcategories: { id: string; name: string }[];
};

export function Header() {
    const { language, setLanguage } = useLanguage();
    const t = useTranslation();
    const { isAuthenticated, currentUser } = useAuth();
    const { allEnquiries } = useEnquiry();
    const location = useLocation();
    const navigate = useNavigate();
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
    const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>(null);
    const [managedCategories, setManagedCategories] = useState<Category[]>([]);
    const langMenuRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const mobileSearchRef = useRef<HTMLDivElement>(null);

    // Get user's enquiry count for current month (resets on 1st of each month)
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const userEnquiryCount = allEnquiries.filter(e => {
        if (!currentUser || e.user.email !== currentUser.email) return false;
        const enquiryDate = new Date(e.date);
        return enquiryDate.getFullYear() === currentYear &&
            enquiryDate.getMonth() === currentMonth;
    }).length;

    // Get search suggestions
    const suggestions = searchQuery.trim().length >= 1
        ? products.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.cat.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.hsn.includes(searchQuery)
        ).slice(0, 5)
        : [];

    // Close menus when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
                setShowLangMenu(false);
            }
            if (searchRef.current && !searchRef.current.contains(event.target as Node) &&
                mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }

        function handleScroll() {
            // Only close search suggestions on scroll, not the language menu
            setShowSuggestions(false);
        }

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Fetch categories from Supabase
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data, error } = await supabase
                    .from('categories')
                    .select('*')
                    .order('id');

                if (!error && data && data.length > 0) {
                    setManagedCategories(data.map((cat: any) => ({
                        id: cat.id,
                        name: cat.name,
                        subcategories: cat.subcategories || []
                    })));
                } else {
                    // Fallback to local categories
                    setManagedCategories(categories.map(cat => ({
                        id: cat.id,
                        name: cat.name,
                        subcategories: cat.subcategories || []
                    })));
                }
            } catch (err) {
                console.error('Error fetching categories:', err);
                // Fallback to local categories
                setManagedCategories(categories.map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    subcategories: cat.subcategories || []
                })));
            }
        };

        fetchCategories();
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
        setMobileProductsOpen(false);
        setExpandedMobileCategory(null);
    }, [location.pathname]);

    const languages = [
        { code: 'en', name: 'English', short: 'EN' },
        { code: 'hi', name: 'हिंदी', short: 'HI' },
        { code: 'es', name: 'Español', short: 'ES' },
        { code: 'fr', name: 'Français', short: 'FR' },
        { code: 'ar', name: 'العربية', short: 'AR' },
        { code: 'zh', name: '中文', short: 'ZH' },
        { code: 'pt', name: 'Português', short: 'PT' },
        { code: 'de', name: 'Deutsch', short: 'DE' },
        { code: 'ja', name: '日本語', short: 'JA' },
        { code: 'ko', name: '한국어', short: 'KO' },
        { code: 'ru', name: 'Русский', short: 'RU' },
        { code: 'it', name: 'Italiano', short: 'IT' },
        { code: 'tr', name: 'Türkçe', short: 'TR' },
        { code: 'nl', name: 'Nederlands', short: 'NL' },
        { code: 'id', name: 'Bahasa ID', short: 'ID' },
        { code: 'vi', name: 'Tiếng Việt', short: 'VI' },
        { code: 'th', name: 'ไทย', short: 'TH' },
        { code: 'pl', name: 'Polski', short: 'PL' },
        { code: 'el', name: 'Ελληνικά', short: 'EL' },
        { code: 'sv', name: 'Svenska', short: 'SV' },
        { code: 'he', name: 'עברית', short: 'HE' },
        { code: 'uk', name: 'Українська', short: 'UK' },
        { code: 'bn', name: 'বাংলা', short: 'BN' },
        { code: 'ta', name: 'தமிழ்', short: 'TA' },
        { code: 'ms', name: 'Bahasa MY', short: 'MS' },
        { code: 'fil', name: 'Filipino', short: 'FIL' },
        { code: 'sw', name: 'Kiswahili', short: 'SW' }
    ];

    const isActive = (path: string) => location.pathname === path;

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
            setShowSuggestions(false);
            setSearchQuery('');
        }
    };

    const handleSuggestionClick = (productId: number) => {
        navigate(`/product/${productId}`);
        setSearchQuery('');
        setShowSuggestions(false);
    };

    return (
        <header className="header-sticky border-b border-zinc-100">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
                {/* Desktop Header */}
                <div className="hidden md:flex items-center justify-between gap-6">
                    {/* Logo */}
                    <Link to="/" className="flex-shrink-0">
                        <img src="/logo.png" alt="Arovave Global" className="h-12 w-auto" />
                    </Link>

                    {/* Search - Desktop */}
                    <div className="flex-1 max-w-xl relative" ref={searchRef}>
                        <div className="flex items-center bg-zinc-50 rounded-2xl px-5 py-3">
                            <Search className="w-4 h-4 text-zinc-400 mr-3 flex-shrink-0" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                onKeyDown={handleSearch}
                                placeholder="Search by product name, category or HSN code..."
                                className="bg-transparent text-sm font-medium w-full focus:outline-none"
                            />
                        </div>

                        {/* Suggestions Dropdown */}
                        {showSuggestions && searchQuery.trim().length >= 1 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden z-50">
                                {suggestions.length > 0 ? (
                                    suggestions.map(product => (
                                        <button
                                            key={product.id}
                                            onClick={() => handleSuggestionClick(product.id)}
                                            className="w-full flex items-center gap-4 p-4 hover:bg-zinc-50 transition-colors text-left"
                                        >
                                            <img src={product.images[0]} alt={product.name} className="w-12 h-12 rounded-xl object-cover" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm truncate">{product.name}</p>
                                                <p className="text-xs text-zinc-400 uppercase">{product.cat}</p>
                                            </div>
                                            <span className="text-xs font-bold text-zinc-400">{formatPrice(product.priceRange)}</span>
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-6 text-center">
                                        <p className="text-zinc-400 font-medium">Nothing found</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Desktop Nav */}
                    <nav className="flex items-center gap-6">
                        <div className="relative" ref={langMenuRef}>
                            <button onClick={() => setShowLangMenu(!showLangMenu)} className="flex items-center gap-2 text-zinc-400 hover:text-black transition-colors">
                                <Globe className="w-4 h-4" />
                                <span className="text-xs font-bold">{language.toUpperCase()}</span>
                            </button>
                            {showLangMenu && (
                                <div
                                    className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-zinc-100 py-2 z-50 w-48"
                                    style={{ maxHeight: '320px', overflowY: 'auto' }}
                                    onWheel={(e) => e.stopPropagation()}
                                >
                                    {languages.map(lang => (
                                        <button
                                            key={lang.code}
                                            onClick={() => { setLanguage(lang.code as any); setShowLangMenu(false); }}
                                            className={`w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-zinc-50 flex items-center justify-between gap-3 ${language === lang.code ? 'bg-zinc-50 text-black' : 'text-zinc-500'}`}
                                        >
                                            <span>{lang.name}</span>
                                            <span className="text-[10px] font-bold text-zinc-300">{lang.short}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <Link to="/enquiries" className={`relative transition-colors ${isActive('/enquiries') ? 'text-black' : 'text-zinc-400 hover:text-black'}`}>
                            <ShoppingBag className="w-5 h-5" />
                            {userEnquiryCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{userEnquiryCount}</span>
                            )}
                        </Link>
                        <a href="/profile" className={`p-2 rounded-full transition-colors ${isAuthenticated ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}>
                            <User className="w-4 h-4" />
                        </a>
                    </nav>
                </div>

                {/* Mobile Header */}
                <div className="md:hidden">
                    {/* Top Row: Logo + Hamburger */}
                    <div className="flex items-center justify-between mb-3">
                        <Link to="/" className="flex-shrink-0">
                            <img src="/logo.png" alt="Arovave Global" className="h-10 w-auto" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <Link to="/enquiries" className={`relative transition-colors ${isActive('/enquiries') ? 'text-black' : 'text-zinc-400'}`}>
                                <ShoppingBag className="w-5 h-5" />
                                {userEnquiryCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{userEnquiryCount}</span>
                                )}
                            </Link>
                            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-zinc-600">
                                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>

                    {/* Search Bar - Always Visible & Centered */}
                    <div className="relative" ref={mobileSearchRef}>
                        <div className="flex items-center bg-zinc-50 rounded-2xl px-4 py-2.5">
                            <Search className="w-4 h-4 text-zinc-400 mr-3" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                                onFocus={() => setShowSuggestions(true)}
                                onKeyDown={handleSearch}
                                placeholder="Search products..."
                                className="bg-transparent text-sm font-medium w-full focus:outline-none"
                            />
                        </div>
                        {/* Mobile Suggestions */}
                        {showSuggestions && searchQuery.trim().length >= 1 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden z-50">
                                {suggestions.length > 0 ? (
                                    suggestions.map(product => (
                                        <button key={product.id} onClick={() => handleSuggestionClick(product.id)} className="w-full flex items-center gap-3 p-3 hover:bg-zinc-50 text-left">
                                            <img src={product.images[0]} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm truncate">{product.name}</p>
                                                <p className="text-xs text-zinc-400">{formatPrice(product.priceRange)}</p>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-zinc-400 text-sm">Nothing found</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Dropdown */}
                    {mobileMenuOpen && (
                        <div className="mt-4 pt-4 border-t border-zinc-100 max-h-[70vh] overflow-y-auto">
                            <div className="space-y-1">
                                <Link to="/" className="block px-4 py-3 rounded-xl text-sm font-bold hover:bg-zinc-50">Home</Link>

                                {/* Products Section - Collapsible */}
                                <div>
                                    <button
                                        onClick={() => setMobileProductsOpen(!mobileProductsOpen)}
                                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold hover:bg-zinc-50"
                                    >
                                        <span>Products</span>
                                        <ChevronDown className={`w-4 h-4 transition-transform ${mobileProductsOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {mobileProductsOpen && (
                                        <div className="ml-2 mt-1 border-l-2 border-zinc-100 pl-4">
                                            <Link
                                                to="/catalog"
                                                className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-zinc-50"
                                            >
                                                All Products
                                            </Link>

                                            {/* Dynamic Categories with Subcategories */}
                                            {managedCategories.map(cat => (
                                                <div key={cat.id}>
                                                    <button
                                                        onClick={() => {
                                                            if (cat.subcategories && cat.subcategories.length > 0) {
                                                                setExpandedMobileCategory(expandedMobileCategory === cat.id ? null : cat.id);
                                                            } else {
                                                                navigate(`/catalog?category=${cat.id}`);
                                                                setMobileMenuOpen(false);
                                                            }
                                                        }}
                                                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium hover:bg-zinc-50"
                                                    >
                                                        <span>{cat.name}</span>
                                                        {cat.subcategories && cat.subcategories.length > 0 && (
                                                            <ChevronDown className={`w-3 h-3 transition-transform ${expandedMobileCategory === cat.id ? 'rotate-180' : ''}`} />
                                                        )}
                                                    </button>

                                                    {/* Subcategories */}
                                                    {expandedMobileCategory === cat.id && cat.subcategories && cat.subcategories.length > 0 && (
                                                        <div className="ml-3 mt-1 border-l-2 border-zinc-100 pl-3 space-y-1">
                                                            <Link
                                                                to={`/catalog?category=${cat.id}`}
                                                                className="block px-2 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                                                            >
                                                                All {cat.name}
                                                            </Link>
                                                            {cat.subcategories.map(sub => (
                                                                <Link
                                                                    key={sub.id}
                                                                    to={`/catalog?category=${cat.id}&subcategory=${sub.id}`}
                                                                    className="block px-2 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                                                                >
                                                                    {sub.name}
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <a href="/profile" className="block px-4 py-3 rounded-xl text-sm font-bold hover:bg-zinc-50">Profile</a>
                            </div>

                            {/* Language Section */}
                            <div className="px-4 py-3 mt-2 border-t border-zinc-100">
                                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Language</p>
                                <div className="flex flex-wrap gap-2">
                                    {languages.map(lang => (
                                        <button
                                            key={lang.code}
                                            onClick={() => setLanguage(lang.code as any)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold ${language === lang.code ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-600'}`}
                                        >
                                            {lang.short}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
