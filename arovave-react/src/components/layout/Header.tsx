import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Globe, User, ShoppingBag, Menu, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useLanguage, useTranslation, useAuth, useEnquiry } from '../../context';
import { products } from '../../data';

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
    const langMenuRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    // Get user's enquiry count
    const userEnquiryCount = allEnquiries.filter(e =>
        currentUser && e.user.email === currentUser.email
    ).length;

    // Get search suggestions
    const suggestions = searchQuery.trim().length >= 1
        ? products.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.cat.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.hsn.includes(searchQuery)
        ).slice(0, 5)
        : [];

    // Close menus when clicking outside OR scrolling
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
                setShowLangMenu(false);
            }
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }

        function handleScroll() {
            setShowLangMenu(false);
            setShowSuggestions(false);
        }

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    const languages = [
        { code: 'en', name: 'English', short: 'EN' },
        { code: 'hi', name: 'हिंदी', short: 'HI' },
        { code: 'es', name: 'Español', short: 'ES' },
        { code: 'fr', name: 'Français', short: 'FR' }
    ];

    const isActive = (path: string) => location.pathname === path;

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (productId: number) => {
        navigate(`/product/${productId}`);
        setSearchQuery('');
        setShowSuggestions(false);
    };

    return (
        <header className="header-sticky border-b border-zinc-100">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
                <div className="flex items-center justify-between gap-4 md:gap-6">
                    {/* Logo */}
                    <Link to="/" className="flex-shrink-0">
                        <img
                            src="/logo.png"
                            alt="Arovave"
                            className="h-10 md:h-12 w-auto"
                        />
                    </Link>

                    {/* Search - Desktop Only */}
                    <div className="hidden md:block flex-1 max-w-xl relative" ref={searchRef}>
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
                                            <img
                                                src={product.images[0]}
                                                alt={product.name}
                                                className="w-12 h-12 rounded-xl object-cover"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm truncate">{product.name}</p>
                                                <p className="text-xs text-zinc-400 uppercase">{product.cat}</p>
                                            </div>
                                            <span className="text-xs font-bold text-zinc-400">{product.priceRange}</span>
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-6 text-center">
                                        <p className="text-zinc-400 font-medium">Nothing found</p>
                                        <p className="text-xs text-zinc-400 mt-1">Try a different search term</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-6">
                        {/* Language */}
                        <div className="relative" ref={langMenuRef}>
                            <button
                                onClick={() => setShowLangMenu(!showLangMenu)}
                                className="flex items-center gap-2 text-zinc-400 hover:text-black transition-colors"
                            >
                                <Globe className="w-4 h-4" />
                                <span className="text-xs font-bold">{language.toUpperCase()}</span>
                            </button>

                            {showLangMenu && (
                                <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-zinc-100 py-2 z-50">
                                    {languages.map(lang => (
                                        <button
                                            key={lang.code}
                                            onClick={() => {
                                                setLanguage(lang.code as 'en' | 'hi' | 'es' | 'fr');
                                                setShowLangMenu(false);
                                            }}
                                            className={`w-full px-4 py-2 text-left text-sm font-medium hover:bg-zinc-50 ${language === lang.code ? 'text-black' : 'text-zinc-500'}`}
                                        >
                                            {lang.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Enquiries with count */}
                        <Link
                            to="/enquiries"
                            className={`relative transition-colors ${isActive('/enquiries') ? 'text-black' : 'text-zinc-400 hover:text-black'}`}
                        >
                            <ShoppingBag className="w-5 h-5" />
                            {userEnquiryCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                    {userEnquiryCount}
                                </span>
                            )}
                        </Link>

                        {/* Profile */}
                        <Link
                            to="/profile"
                            className={`p-2 rounded-full transition-colors ${isAuthenticated ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                        >
                            <User className="w-4 h-4" />
                        </Link>
                    </nav>

                    {/* Mobile Nav Icons */}
                    <div className="flex md:hidden items-center gap-4">
                        {/* Enquiries */}
                        <Link
                            to="/enquiries"
                            className={`relative transition-colors ${isActive('/enquiries') ? 'text-black' : 'text-zinc-400 hover:text-black'}`}
                        >
                            <ShoppingBag className="w-5 h-5" />
                            {userEnquiryCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                    {userEnquiryCount}
                                </span>
                            )}
                        </Link>

                        {/* Hamburger Menu */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 text-zinc-600 hover:text-black transition-colors"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden mt-4 pt-4 border-t border-zinc-100">
                        {/* Mobile Search */}
                        <div className="flex items-center bg-zinc-50 rounded-2xl px-4 py-3 mb-4">
                            <Search className="w-4 h-4 text-zinc-400 mr-3" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && searchQuery.trim()) {
                                        navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
                                        setMobileMenuOpen(false);
                                    }
                                }}
                                placeholder="Search products..."
                                className="bg-transparent text-sm font-medium w-full focus:outline-none"
                            />
                        </div>

                        {/* Mobile Menu Links */}
                        <div className="space-y-2">
                            <Link
                                to="/"
                                className="block px-4 py-3 rounded-xl text-sm font-bold hover:bg-zinc-50 transition-colors"
                            >
                                Home
                            </Link>
                            <Link
                                to="/catalog"
                                className="block px-4 py-3 rounded-xl text-sm font-bold hover:bg-zinc-50 transition-colors"
                            >
                                Catalog
                            </Link>
                            <Link
                                to="/profile"
                                className="block px-4 py-3 rounded-xl text-sm font-bold hover:bg-zinc-50 transition-colors"
                            >
                                Profile
                            </Link>

                            {/* Language Selector */}
                            <div className="px-4 py-3">
                                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Language</p>
                                <div className="flex flex-wrap gap-2">
                                    {languages.map(lang => (
                                        <button
                                            key={lang.code}
                                            onClick={() => {
                                                setLanguage(lang.code as 'en' | 'hi' | 'es' | 'fr');
                                            }}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${language === lang.code ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-600'}`}
                                        >
                                            {lang.short}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
