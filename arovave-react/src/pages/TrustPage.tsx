import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Handshake, Award, TrendingDown, Calendar, Factory, FileCheck, Camera, Utensils, Pill, FlaskConical, Gift } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context';

// Trust section content
const trustContent = {
    middleman: {
        icon: Handshake,
        title: 'No Middlemen',
        subtitle: 'Direct Factory-to-Door Access',
        content: [
            {
                heading: 'Direct Manufacturer Relationships',
                text: 'We have established direct partnerships with India\'s largest and most reputable manufacturers across pharma, food processing, glass packaging, and promotional goods industries.'
            },
            {
                heading: 'Transparent Pricing',
                text: 'By eliminating brokers and agents, we ensure you get factory-direct prices without hidden markups. Our pricing is transparent, competitive, and negotiable for bulk orders.'
            },
            {
                heading: 'Quality Control at Source',
                text: 'Our team conducts regular on-site audits and quality checks at manufacturing facilities, ensuring every product meets international standards before shipment.'
            },
            {
                heading: 'Faster Turnaround',
                text: 'Direct communication with factories means faster order processing, real-time updates, and quicker delivery times compared to traditional import channels.'
            }
        ]
    },
    certificate: {
        icon: Award,
        title: 'Verified Quality',
        subtitle: 'International Certifications & Standards',
        content: [
            {
                heading: 'WHO-GMP Compliance',
                text: 'All pharmaceutical products come from WHO-GMP certified facilities, ensuring adherence to the highest global manufacturing practices.'
            },
            {
                heading: 'ISO 9001:2015 Certified',
                text: 'Our partner facilities maintain ISO 9001:2015 certification for quality management systems, guaranteeing consistent product quality.'
            },
            {
                heading: 'FSSAI Approved',
                text: 'All food products are FSSAI certified, meeting Indian food safety standards that align with international requirements.'
            },
            {
                heading: 'Third-Party Lab Testing',
                text: 'Every batch undergoes independent laboratory testing with full documentation including Certificates of Analysis (CoA) provided with shipments.'
            }
        ],
        hasCategories: true  // Special flag for this section
    },
    rates: {
        icon: TrendingDown,
        title: 'Best Rates',
        subtitle: 'Factory-Direct Pricing Advantage',
        content: [
            {
                heading: 'Bulk Order Discounts',
                text: 'Significant price reductions on large volume orders. The more you order, the better your per-unit pricing becomes.'
            },
            {
                heading: 'No Brokerage Fees',
                text: 'Unlike traditional import channels, we don\'t charge brokerage or agent commissions. Our margin structure is simple and transparent.'
            },
            {
                heading: 'Competitive MOQs',
                text: 'We work with manufacturers to offer flexible Minimum Order Quantities that suit businesses of all sizes, from startups to large enterprises.'
            },
            {
                heading: 'Long-term Partnership Benefits',
                text: 'Returning clients enjoy preferential pricing, priority order processing, and dedicated account management services.'
            }
        ]
    },
    history: {
        icon: Calendar,
        title: '25+ Years Trust',
        subtitle: 'A Quarter Century of Excellence',
        content: [
            {
                heading: 'Established Legacy',
                text: 'Founded in 1999, Arovave has grown from a small trading house to one of India\'s most trusted B2B export platforms with a presence in 50+ countries.'
            },
            {
                heading: 'Proven Track Record',
                text: 'Over 10,000 successful shipments, $100M+ in annual trade volume, and zero major quality disputes in our entire operational history.'
            },
            {
                heading: 'Industry Recognition',
                text: 'Multiple awards for export excellence from FIEO, APEDA, and state export councils. Recognized by the Ministry of Commerce for outstanding contribution to Indian exports.'
            },
            {
                heading: 'Trusted by Global Brands',
                text: 'We serve Fortune 500 companies, national pharmacy chains, international food distributors, and leading promotional merchandise importers worldwide.'
            }
        ]
    }
};

// Categories for Verified Quality page
const qualityCategories = [
    { id: 'food', name: 'Processed Food', icon: Utensils },
    { id: 'pharma', name: 'Generic Medicines', icon: Pill },
    { id: 'glass', name: 'Glass Bottles', icon: FlaskConical },
    { id: 'promo', name: 'Promotional Items', icon: Gift }
];

export function TrustPage() {
    const { section } = useParams();
    const { isAuthenticated } = useAuth();
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [categoryContent, setCategoryContent] = useState<Record<string, any[]>>({});

    useEffect(() => {
        // Scroll to top on mount
        window.scrollTo(0, 0);

        // Load category content from localStorage
        const saved = localStorage.getItem('arovaveQualityContent');
        if (saved) {
            setCategoryContent(JSON.parse(saved));
        } else {
            // Default content for each category
            const defaultContent: Record<string, any[]> = {
                food: [
                    { id: 1, type: 'certificate', title: 'FSSAI License', image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400' },
                    { id: 2, type: 'plant', title: 'Our Processing Facility', image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400' },
                    { id: 3, type: 'sample', title: 'Premium Rice Samples', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' }
                ],
                pharma: [
                    { id: 1, type: 'certificate', title: 'WHO-GMP Certificate', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400' },
                    { id: 2, type: 'plant', title: 'Pharma Manufacturing Unit', image: 'https://images.unsplash.com/photo-1563213126-a4273aed2016?w=400' },
                    { id: 3, type: 'sample', title: 'Product Quality Testing', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400' }
                ],
                glass: [
                    { id: 1, type: 'certificate', title: 'ISO 9001 Certification', image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400' },
                    { id: 2, type: 'plant', title: 'Glass Manufacturing Plant', image: 'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=400' },
                    { id: 3, type: 'sample', title: 'Amber Bottle Samples', image: 'https://images.unsplash.com/photo-1602928321679-560bb453f190?w=400' }
                ],
                promo: [
                    { id: 1, type: 'certificate', title: 'SEDEX Certification', image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400' },
                    { id: 2, type: 'plant', title: 'Production Facility', image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400' },
                    { id: 3, type: 'sample', title: 'Custom Merchandise Samples', image: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=400' }
                ]
            };
            setCategoryContent(defaultContent);
            localStorage.setItem('arovaveQualityContent', JSON.stringify(defaultContent));
        }
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

    return (
        <div className="page-enter">
            {/* Header */}
            <div className="bg-zinc-50 py-16">
                <div className="max-w-7xl mx-auto px-6">
                    <Link to="/" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-black transition-colors mb-8 inline-flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>
                    <div className="flex items-center gap-6 mt-6">
                        <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center">
                            <Icon className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tighter">{data.title}</h1>
                            <p className="text-xl text-zinc-500 mt-2">{data.subtitle}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="grid md:grid-cols-2 gap-8">
                    {data.content.map((item, idx) => (
                        <div key={idx} className="bg-white rounded-2xl border border-zinc-100 p-8 hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center mb-6">
                                <span className="text-2xl font-black text-zinc-400">{idx + 1}</span>
                            </div>
                            <h3 className="text-xl font-black mb-4">{item.heading}</h3>
                            <p className="text-zinc-600 leading-relaxed">{item.text}</p>
                        </div>
                    ))}
                </div>

                {/* Categories for Verified Quality */}
                {'hasCategories' in data && data.hasCategories && (
                    <div className="mt-20">
                        <h2 className="text-3xl font-black uppercase tracking-tighter mb-8">Quality Proof by Category</h2>

                        {/* Category Tabs */}
                        <div className="flex flex-wrap gap-4 mb-12">
                            {qualityCategories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                                    className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all ${selectedCategory === cat.id
                                        ? 'bg-black text-white'
                                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                                        }`}
                                >
                                    <cat.icon className="w-5 h-5" />
                                    {cat.name}
                                </button>
                            ))}
                        </div>

                        {/* Category Content */}
                        {selectedCategory && categoryContent[selectedCategory] && (
                            <div className="bg-zinc-50 rounded-3xl p-8">
                                <h3 className="text-2xl font-black mb-6">
                                    {qualityCategories.find(c => c.id === selectedCategory)?.name} - Quality Documentation
                                </h3>

                                <div className="grid md:grid-cols-3 gap-6">
                                    {categoryContent[selectedCategory].map((item: any) => (
                                        <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                            <div className="aspect-[4/3] overflow-hidden">
                                                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="p-4">
                                                <span className={`text-[9px] font-bold uppercase tracking-widest ${item.type === 'certificate' ? 'text-green-600' :
                                                    item.type === 'plant' ? 'text-blue-600' : 'text-purple-600'
                                                    }`}>
                                                    {item.type === 'certificate' ? 'Certificate' :
                                                        item.type === 'plant' ? 'Manufacturing Plant' : 'Product Sample'}
                                                </span>
                                                <h4 className="font-bold mt-1">{item.title}</h4>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Admin notice */}
                                {isAuthenticated && (
                                    <div className="mt-6 p-4 bg-yellow-50 rounded-xl text-center">
                                        <p className="text-sm text-yellow-700">
                                            <span className="font-bold">Admin:</span> You can manage this content from the Admin Panel → Quality Content section.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
