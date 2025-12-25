import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Handshake, Award, TrendingUp, Calendar, Utensils, Pill, FlaskConical, Gift, FileCheck, Factory, Package, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { categories } from '../data';

// Trust section content with updated headings
const trustContent = {
    middleman: {
        icon: Handshake,
        title: 'Direct Manufacturer Access',
        subtitle: 'Connect Directly with Certified Indian Manufacturers',
        content: [
            {
                heading: 'Direct Factory Partnerships',
                text: 'We connect you directly with India\'s largest and most reputable manufacturers. No brokers, no middlemen - just direct access to production facilities.'
            },
            {
                heading: 'Real-Time Communication',
                text: 'Speak directly with factory owners and production managers. Get instant updates on orders, customizations, and delivery schedules.'
            },
            {
                heading: 'Factory Visits Welcome',
                text: 'We arrange factory tours for serious buyers. See production processes firsthand and build lasting relationships with manufacturers.'
            },
            {
                heading: 'Dedicated Account Manager',
                text: 'Your personal Arovave representative coordinates all communications between you and multiple manufacturers seamlessly.'
            }
        ]
    },
    certificate: {
        icon: Award,
        title: 'Certificates & Verified Quality',
        subtitle: 'Browse Quality Documentation by Category',
        hasCategories: true
    },
    rates: {
        icon: TrendingUp,
        title: 'Factory Direct Pricing',
        subtitle: 'Best Prices with Complete Transparency',
        content: [
            {
                heading: 'No Middleman Markup',
                text: 'By eliminating intermediaries, you save 15-40% compared to traditional import channels. Our pricing comes directly from factory quotes.'
            },
            {
                heading: 'Volume-Based Discounts',
                text: 'The more you order, the better your price. We negotiate bulk discounts on your behalf and pass the savings directly to you.'
            },
            {
                heading: 'Transparent Costing',
                text: 'See complete cost breakdowns including manufacturing, packaging, testing, and shipping. No hidden fees or surprise charges.'
            },
            {
                heading: 'Flexible Payment Terms',
                text: 'Multiple payment options including L/C, T/T, and trade credit for established partners. We work within your cash flow needs.'
            }
        ]
    },
    history: {
        icon: Calendar,
        title: 'Decades of Industrial Experience',
        subtitle: '25+ Years Building Trust Across Continents',
        content: [
            {
                heading: '25+ Years in Export Business',
                text: 'Since 1998, we have been connecting international buyers with Indian manufacturers. Our experience spans four industries and 50+ countries.'
            },
            {
                heading: 'Proven Track Record',
                text: 'Over 10,000 successful shipments delivered worldwide. Our repeat customer rate exceeds 85%, a testament to our reliability.'
            },
            {
                heading: 'Industry Expertise',
                text: 'Deep knowledge of pharmaceutical regulations, food safety standards, glass packaging requirements, and promotional goods production.'
            },
            {
                heading: 'Strong Manufacturer Network',
                text: 'Long-term relationships with 200+ certified manufacturers. We know which factories deliver the best quality for each product type.'
            }
        ]
    }
};

// Content type tabs for Verified Quality section
const contentTypes = [
    { id: 'certificate', name: 'Certificates', icon: FileCheck },
    { id: 'plant', name: 'Manufacturing Plant', icon: Factory },
    { id: 'sample', name: 'Product Samples', icon: Package }
];

// Category icons
const categoryIcons: Record<string, any> = {
    food: Utensils,
    pharma: Pill,
    glass: FlaskConical,
    promo: Gift
};

export function TrustPage() {
    const { section } = useParams();
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
    const [selectedContentType, setSelectedContentType] = useState<string>('certificate');
    const [qualityContent, setQualityContent] = useState<Record<string, any>>({});

    useEffect(() => {
        window.scrollTo(0, 0);
        // Load content from localStorage
        const saved = localStorage.getItem('arovaveQualityUploads');
        if (saved) {
            setQualityContent(JSON.parse(saved));
        }
    }, [section]);

    // Reset selections when section changes
    useEffect(() => {
        setSelectedCategory(null);
        setSelectedSubcategory(null);
        setSelectedContentType('certificate');
    }, [section]);

    if (!section || !trustContent[section as keyof typeof trustContent]) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-20 text-center">
                <h1 className="text-3xl font-black mb-4">Page Not Found</h1>
                <Link to="/" className="text-zinc-500 hover:text-black">← Back to Home</Link>
            </div>
        );
    }

    const data = trustContent[section as keyof typeof trustContent];
    const Icon = data.icon;
    const currentCategory = categories.find(c => c.id === selectedCategory);

    // Get uploads for current selection
    const getUploads = () => {
        if (!selectedCategory || !selectedSubcategory) return [];
        const key = `${selectedCategory}_${selectedSubcategory}_${selectedContentType}`;
        return qualityContent[key] || [];
    };

    return (
        <div className="page-enter">
            {/* Header */}
            <div className="bg-zinc-50 py-12">
                <div className="max-w-7xl mx-auto px-6">
                    <Link to="/" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-black transition-colors mb-6 inline-flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>
                    <div className="flex items-center gap-6 mt-4">
                        <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center">
                            <Icon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tighter">{data.title}</h1>
                            <p className="text-lg text-zinc-500 mt-1">{data.subtitle}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                {'hasCategories' in data && data.hasCategories ? (
                    // Certificates & Verified Quality - Category Flow
                    <div>
                        {!selectedCategory ? (
                            // Step 1: Show Categories
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-widest mb-8">Select Category</h2>
                                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {categories.map(cat => {
                                        const CatIcon = categoryIcons[cat.id] || Gift;
                                        return (
                                            <button
                                                key={cat.id}
                                                onClick={() => setSelectedCategory(cat.id)}
                                                className="bg-white border-2 border-zinc-100 rounded-3xl p-8 text-center hover:border-black transition-colors group"
                                            >
                                                <CatIcon className="w-12 h-12 mx-auto mb-4 text-zinc-400 group-hover:text-black transition-colors" />
                                                <h3 className="font-bold text-lg">{cat.name}</h3>
                                                <ChevronRight className="w-5 h-5 mx-auto mt-4 text-zinc-300 group-hover:text-black" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : !selectedSubcategory ? (
                            // Step 2: Show Subcategories
                            <div>
                                <button
                                    onClick={() => setSelectedCategory(null)}
                                    className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-black mb-6 flex items-center gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" /> Back to Categories
                                </button>
                                <h2 className="text-xl font-black uppercase tracking-widest mb-8">
                                    {currentCategory?.name} - Select Subcategory
                                </h2>
                                {currentCategory?.subcategories && currentCategory.subcategories.length > 0 ? (
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {currentCategory.subcategories.map(sub => (
                                            <button
                                                key={sub.id}
                                                onClick={() => setSelectedSubcategory(sub.id)}
                                                className="bg-white border-2 border-zinc-100 rounded-2xl p-6 text-left hover:border-black transition-colors group"
                                            >
                                                <h3 className="font-bold text-lg">{sub.name}</h3>
                                                <p className="text-sm text-zinc-400 mt-1">View certificates, plant photos & samples</p>
                                                <ChevronRight className="w-5 h-5 mt-4 text-zinc-300 group-hover:text-black" />
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    // No subcategories - show "All" option
                                    <button
                                        onClick={() => setSelectedSubcategory('all')}
                                        className="bg-white border-2 border-zinc-100 rounded-2xl p-6 text-left hover:border-black transition-colors group w-full max-w-md"
                                    >
                                        <h3 className="font-bold text-lg">All {currentCategory?.name}</h3>
                                        <p className="text-sm text-zinc-400 mt-1">View certificates, plant photos & samples</p>
                                        <ChevronRight className="w-5 h-5 mt-4 text-zinc-300 group-hover:text-black" />
                                    </button>
                                )}
                            </div>
                        ) : (
                            // Step 3: Show Content Type Tabs + Uploads
                            <div>
                                <button
                                    onClick={() => setSelectedSubcategory(null)}
                                    className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-black mb-6 flex items-center gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" /> Back to Subcategories
                                </button>
                                <h2 className="text-xl font-black uppercase tracking-widest mb-6">
                                    {currentCategory?.name} - {currentCategory?.subcategories?.find(s => s.id === selectedSubcategory)?.name || 'All Products'}
                                </h2>

                                {/* Content Type Tabs */}
                                <div className="flex gap-4 mb-8 overflow-x-auto">
                                    {contentTypes.map(type => {
                                        const TypeIcon = type.icon;
                                        return (
                                            <button
                                                key={type.id}
                                                onClick={() => setSelectedContentType(type.id)}
                                                className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${selectedContentType === type.id
                                                    ? 'bg-black text-white'
                                                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                                                    }`}
                                            >
                                                <TypeIcon className="w-4 h-4" />
                                                {type.name}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Display Uploads */}
                                {getUploads().length > 0 ? (
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {getUploads().map((item: any, idx: number) => (
                                            <div key={idx} className="bg-white border border-zinc-100 rounded-2xl overflow-hidden">
                                                <img src={item.image} alt={item.title} className="w-full aspect-video object-cover" />
                                                <div className="p-4">
                                                    <h4 className="font-bold">{item.title}</h4>
                                                    {item.description && <p className="text-sm text-zinc-500 mt-1">{item.description}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-zinc-50 rounded-3xl p-12 text-center">
                                        <p className="text-zinc-400 text-lg">No {contentTypes.find(t => t.id === selectedContentType)?.name.toLowerCase()} uploaded yet.</p>
                                        <p className="text-sm text-zinc-400 mt-2">Content can be added from the Admin panel.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    // Regular content sections
                    <div className="grid md:grid-cols-2 gap-8">
                        {'content' in data && data.content?.map((item: any, idx: number) => (
                            <div key={idx} className="bg-white border border-zinc-100 rounded-3xl p-8">
                                <h3 className="text-xl font-black mb-4">{item.heading}</h3>
                                <p className="text-zinc-600 leading-relaxed">{item.text}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
