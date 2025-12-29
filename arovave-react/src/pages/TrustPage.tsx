import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Handshake, Award, TrendingUp, Calendar, Utensils, Pill, FlaskConical, Gift, FileCheck, Factory, Package, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { categories } from '../data';
import { supabase } from '../lib/supabase';

// Trust section content with comprehensive professional copy
const trustContent = {
    middleman: {
        icon: Handshake,
        title: 'Direct Manufacturer Access',
        subtitle: 'What Happens When You Work with Arovave',
        intro: 'When you raise an enquiry on Arovave, your requirement does not circulate through traders or agents. It is evaluated, mapped, and sent directly to factories that already match your product category, volume, compliance needs, and export requirements.',
        secondaryIntro: 'You communicate through one professional interface, but the production decisions come from the factory floor itself. This eliminates confusion and keeps responsibility clear.',
        content: [
            {
                heading: 'Clarity from Day One',
                text: 'You know who is manufacturing your product before production begins. There is no ambiguity about the source. Factories are selected after verifying their production capacity, quality consistency, certifications, export readiness, and ethical practices. Only manufacturers that pass this process are onboarded.'
            },
            {
                heading: 'Control Without Complexity',
                text: 'Direct factory access allows you to control important variables such as product specifications, formulation or material selection, packaging and branding, lead times, and batch wise quality checks. Everything is discussed, approved, and documented before execution. No assumptions. No shortcuts.'
            },
            {
                heading: 'Faster, Cleaner Decisions',
                text: 'Without intermediaries, pricing approvals, sampling, revisions, and confirmations move faster and with fewer misunderstandings. This helps you plan launches, shipments, and market entry with confidence.'
            },
            {
                heading: 'Dedicated Account Manager',
                text: 'Your personal Arovave representative coordinates all communications between you and multiple manufacturers seamlessly, ensuring nothing falls through the cracks.'
            }
        ]
    },
    certificate: {
        icon: Award,
        title: 'Certificates & Verified Quality',
        subtitle: 'Quality Is a Process, Not a Promise',
        intro: 'At Arovave, quality is not communicated through claims. It is demonstrated through process, documentation, and inspection.',
        secondaryIntro: 'Every manufacturing partner operates under recognized national and international quality frameworks such as WHO GMP, ISO standards, FSSAI where applicable, and destination specific export certifications. Only certified and audit ready units are part of the Arovave ecosystem.',
        hasCategories: true,
        qualityStages: [
            {
                title: 'Before Production',
                desc: 'Raw materials, formulations, specifications, and packaging standards are verified and approved before production begins. This ensures alignment between buyer expectations and factory execution.'
            },
            {
                title: 'During Production',
                desc: 'Manufacturing is monitored to ensure batch consistency, adherence to approved samples, and compliance with technical specifications. This reduces variability and production risk.'
            },
            {
                title: 'Before Dispatch',
                desc: 'Finished goods are inspected to confirm quantity accuracy, labeling correctness, packaging integrity, and export readiness. Only approved batches move forward for shipment.'
            }
        ],
        documentation: [
            'Certificates of Analysis',
            'Test Reports (where applicable)',
            'Compliance Declarations',
            'Batch and Lot Traceability'
        ]
    },
    rates: {
        icon: TrendingUp,
        title: 'Factory Direct Pricing',
        subtitle: 'Pricing Built on Visibility',
        intro: 'Arovave pricing is designed to be clear, structured, and predictable. There are no brokers, trading chains, or commission based markups involved.',
        secondaryIntro: 'Prices are shared directly from factory quotations, allowing buyers to understand the real cost of manufacturing.',
        content: [
            {
                heading: 'How Pricing Works for Buyers',
                text: 'Bulk orders benefit from manufacturing efficiency and competitive rates. Repeat sourcing allows for structured pricing and long term cost planning. Each quotation clearly outlines manufacturing, packaging, compliance requirements, and export coordination. There are no hidden charges or unexpected additions.'
            },
            {
                heading: 'Transparent Cost Structure',
                text: 'See complete cost breakdowns including manufacturing, packaging, testing, and shipping. No hidden fees or surprise charges at any stage of the process.'
            },
            {
                heading: 'Volume Based Advantages',
                text: 'The more you order, the better your price. We negotiate bulk discounts on your behalf and pass the savings directly to you, maintaining complete transparency throughout.'
            },
            {
                heading: 'Trade Friendly Payment Terms',
                text: 'Arovave supports practical trade needs through payment options such as T/T, L/C, advance payments, and trade credit for approved partners. Payment planning is aligned with buyer cash cycles to support repeat and scalable sourcing.'
            }
        ]
    },
    history: {
        icon: Calendar,
        title: 'Decades of Industrial Experience',
        subtitle: 'Built on Real Industry Exposure',
        intro: 'Arovave is backed by more than 25 years of hands on experience within Indian manufacturing, especially across pharmaceuticals, packaging, printing, glass, and promotional industries.',
        secondaryIntro: 'This experience allows us to evaluate factories realistically, not theoretically. We understand where quality usually fails, where delays occur, and how production behaves under scale.',
        content: [
            {
                heading: 'Responsible Growth in Exports',
                text: 'Exports at Arovave are approached carefully and step by step. We work with factories that already understand export requirements and global quality expectations. Growth is built on execution and compliance, not aggressive promises.'
            },
            {
                heading: 'Long Term Factory Relationships',
                text: 'Arovave works with a select group of manufacturers with whom relationships have been built over years. Factories are evaluated on performance, not potential. The focus is always on long term partnerships rather than short term transactions.'
            },
            {
                heading: 'Proven Track Record',
                text: 'Over 10,000 successful shipments delivered worldwide. Our repeat customer rate exceeds 85%, a testament to our reliability and consistent execution.'
            },
            {
                heading: 'Industry Expertise',
                text: 'Deep knowledge of pharmaceutical regulations, food safety standards, glass packaging requirements, and promotional goods production. We know which factories deliver the best quality for each product type.'
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
    const [managedCategories, setManagedCategories] = useState<{ id: string; name: string; subcategories: { id: string; name: string }[] }[]>([]);

    useEffect(() => {
        window.scrollTo(0, 0);

        // Load categories from Supabase
        const fetchCategories = async () => {
            try {
                const { data, error } = await supabase
                    .from('categories')
                    .select('*')
                    .order('id');

                if (!error && data) {
                    setManagedCategories(data.map((cat: any) => ({
                        id: cat.id,
                        name: cat.name,
                        subcategories: cat.subcategories || []
                    })));
                } else {
                    // Fallback to static categories
                    setManagedCategories(categories.map(cat => ({
                        id: cat.id,
                        name: cat.name,
                        subcategories: cat.subcategories || []
                    })));
                }
            } catch (err) {
                console.error('Error fetching categories:', err);
                // Fallback to static categories
                setManagedCategories(categories.map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    subcategories: cat.subcategories || []
                })));
            }
        };

        // Load content from Supabase
        const fetchQualityContent = async () => {
            try {
                const { data, error } = await supabase
                    .from('quality_uploads')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (!error && data) {
                    // Group by key (category_subcategory_contentType)
                    const grouped: Record<string, any[]> = {};
                    data.forEach((item: any) => {
                        const key = `${item.category_id}_${item.subcategory_id}_${item.content_type}`;
                        if (!grouped[key]) grouped[key] = [];
                        grouped[key].push({
                            id: item.id,
                            title: item.title,
                            image: item.image_url,
                            description: item.description
                        });
                    });
                    setQualityContent(grouped);
                } else {
                    // Fallback to localStorage if Supabase fails
                    const saved = localStorage.getItem('arovaveQualityUploads');
                    if (saved) {
                        setQualityContent(JSON.parse(saved));
                    }
                }
            } catch (err) {
                console.error('Error fetching quality content:', err);
                // Fallback to localStorage
                const saved = localStorage.getItem('arovaveQualityUploads');
                if (saved) {
                    setQualityContent(JSON.parse(saved));
                }
            }
        };

        fetchCategories();
        fetchQualityContent();
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
    const currentCategory = managedCategories.find(c => c.id === selectedCategory);

    // Get uploads for current selection
    const getUploads = () => {
        if (!selectedCategory || !selectedSubcategory) return [];
        const key = `${selectedCategory}_${selectedSubcategory}_${selectedContentType}`;
        return qualityContent[key] || [];
    };

    return (
        <div className="page-enter">
            {/* Header */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 text-white py-16 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <Link to="/" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors mb-6 inline-flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>
                    <div className="flex items-center gap-6 mt-4">
                        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                            <Icon className="w-10 h-10 text-black" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tighter">{data.title}</h1>
                            <p className="text-lg text-zinc-300 mt-2">{data.subtitle}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Intro Section - Hide when category is selected on certificate page */}
            {!('hasCategories' in data && data.hasCategories && selectedCategory) && (
                <div className="bg-zinc-50 py-12">
                    <div className="max-w-4xl mx-auto px-6">
                        <p className="text-xl text-zinc-800 leading-relaxed mb-4">{data.intro}</p>
                        {'secondaryIntro' in data && (
                            <p className="text-zinc-600 leading-relaxed">{data.secondaryIntro}</p>
                        )}
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-16">
                {'hasCategories' in data && data.hasCategories ? (
                    // Certificates & Verified Quality - Category Flow
                    <div>
                        {/* FIRST: Category Browser at TOP */}
                        {!selectedCategory ? (
                            // Step 1: Show Categories
                            <div className="mb-16">
                                <h2 className="text-xl font-black uppercase tracking-widest mb-8">Browse Documentation by Category</h2>
                                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {managedCategories.map(cat => {
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
                        ) : null}

                        {/* SECOND: Quality Control Stages - shown when no category selected */}
                        {'qualityStages' in data && data.qualityStages && !selectedCategory && (
                            <div className="mb-16">
                                <h2 className="text-2xl font-black uppercase tracking-tight mb-8">Quality Control at Every Stage</h2>
                                <div className="grid md:grid-cols-3 gap-6">
                                    {data.qualityStages.map((stage, idx) => (
                                        <div key={idx} className="bg-white border border-zinc-100 rounded-2xl p-8 hover:border-black hover:shadow-lg transition-all">
                                            <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center font-black text-xl mb-6">
                                                {idx + 1}
                                            </div>
                                            <h3 className="text-xl font-black mb-3">{stage.title}</h3>
                                            <p className="text-zinc-600 leading-relaxed">{stage.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* THIRD: Documentation Transparency - shown when no category selected */}
                        {'documentation' in data && data.documentation && !selectedCategory && (
                            <div className="mb-16 bg-gradient-to-br from-zinc-50 to-white rounded-3xl border border-zinc-100 p-8 md:p-12">
                                <h2 className="text-2xl font-black uppercase tracking-tight mb-6">Complete Documentation Transparency</h2>
                                <p className="text-zinc-600 mb-8 max-w-3xl">
                                    Buyers receive full quality documentation. This supports smooth customs clearance, regulatory approval, and long term buyer confidence. What you approve is what you receive.
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {data.documentation.map((doc, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-white rounded-xl p-4 border border-zinc-100">
                                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                                            <span className="font-medium text-sm">{doc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Subcategory Selection - when category is selected but not subcategory */}
                        {selectedCategory && !selectedSubcategory && (
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
                        )}

                        {/* Content Type Tabs + Uploads - ONLY when both category AND subcategory are selected */}
                        {selectedCategory && selectedSubcategory && (
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
                                            <div key={idx} className="bg-white border border-zinc-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all">
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
                            <div key={idx} className="bg-white border border-zinc-100 rounded-3xl p-8 hover:border-black hover:shadow-lg transition-all">
                                <h3 className="text-xl font-black mb-4">{item.heading}</h3>
                                <p className="text-zinc-600 leading-relaxed">{item.text}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* CTA Section */}
            <div className="bg-black text-white py-16">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-black mb-4">Ready to Source with Confidence?</h2>
                    <p className="text-zinc-400 mb-8">
                        Submit your enquiry and experience structured manufacturing access.
                    </p>
                    <Link
                        to="/catalog"
                        className="inline-block px-10 py-4 bg-white text-black font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-zinc-100 transition-colors"
                    >
                        Browse Products
                    </Link>
                </div>
            </div>
        </div>
    );
}
