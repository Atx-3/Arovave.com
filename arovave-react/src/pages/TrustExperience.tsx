import { Link } from 'react-router-dom';
import { Calendar, ArrowLeft, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';

export function TrustExperience() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const highlights = [
        { title: 'Responsible Growth', desc: 'Exports are approached carefully. We work with factories that already understand export requirements and global quality expectations.' },
        { title: 'Long Term Relationships', desc: 'Factories are evaluated on performance, not potential. Focus is always on long term partnerships rather than short term transactions.' },
        { title: 'Proven Track Record', desc: 'Over 10,000 successful shipments delivered worldwide. Our repeat customer rate exceeds 85%.' }
    ];

    const stats = [
        { value: '25+', label: 'Years Experience' },
        { value: '10,000+', label: 'Shipments Delivered' },
        { value: '85%', label: 'Repeat Customers' },
        { value: '40+', label: 'Countries Served' }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-white">
            {/* Hero Section */}
            <div className="bg-black text-white py-20">
                <div className="max-w-5xl mx-auto px-6">
                    <Link to="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-white text-black rounded-2xl flex items-center justify-center">
                            <Calendar className="w-8 h-8" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-widest text-zinc-400">Why Trust Arovave</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight mb-6">
                        25+ Years Experience
                    </h1>
                    <p className="text-xl text-zinc-300 max-w-3xl leading-relaxed">
                        Built on Real Industry Exposure
                    </p>
                </div>
            </div>

            {/* Stats Section */}
            <div className="bg-zinc-900 text-white py-12">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, idx) => (
                            <div key={idx} className="text-center">
                                <p className="text-4xl md:text-5xl font-black mb-2">{stat.value}</p>
                                <p className="text-sm uppercase tracking-widest text-zinc-400">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-5xl mx-auto px-6 py-16">
                <div className="prose prose-lg max-w-none mb-12">
                    <p className="text-xl text-zinc-600 leading-relaxed">
                        Arovave is backed by more than 25 years of hands on experience within Indian manufacturing, especially across pharmaceuticals, packaging, printing, glass, and promotional industries.
                    </p>
                </div>

                {/* Highlights Grid */}
                <div className="grid md:grid-cols-3 gap-8 mb-16">
                    {highlights.map((highlight, idx) => (
                        <div key={idx} className="bg-white border-2 border-zinc-100 rounded-3xl p-8 hover:border-black hover:shadow-xl transition-all">
                            <h3 className="text-xl font-black mb-4">{highlight.title}</h3>
                            <p className="text-zinc-500 leading-relaxed">{highlight.desc}</p>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div className="text-center bg-zinc-50 rounded-3xl p-12">
                    <h3 className="text-2xl font-black mb-4">Partner with Experience</h3>
                    <p className="text-zinc-500 mb-8">Join thousands of satisfied customers worldwide.</p>
                    <Link to="/products" className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-colors">
                        Get Started
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
