import { Link } from 'react-router-dom';
import { TrendingUp, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useEffect } from 'react';

export function TrustPricing() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const points = [
        'Bulk orders benefit from manufacturing efficiency and competitive rates',
        'Repeat sourcing allows for structured pricing and long term cost planning',
        'Each quotation clearly outlines manufacturing, packaging, compliance, and export coordination',
        'Trade friendly payment terms including T/T, L/C, and trade credit for approved partners'
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
                            <TrendingUp className="w-8 h-8" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-widest text-zinc-400">Why Trust Arovave</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight mb-6">
                        Factory Direct Pricing
                    </h1>
                    <p className="text-xl text-zinc-300 max-w-3xl leading-relaxed">
                        Pricing Built on Visibility
                    </p>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-5xl mx-auto px-6 py-16">
                <div className="prose prose-lg max-w-none mb-12">
                    <p className="text-xl text-zinc-600 leading-relaxed">
                        Arovave pricing is designed to be clear, structured, and predictable. There are no brokers, trading chains, or commission based markups involved. Prices are shared directly from factory quotations.
                    </p>
                </div>

                {/* Points Grid */}
                <div className="grid md:grid-cols-2 gap-6 mb-16">
                    {points.map((point, idx) => (
                        <div key={idx} className="flex items-start gap-4 bg-white border-2 border-zinc-100 rounded-2xl p-6 hover:border-black hover:shadow-xl transition-all">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <Check className="w-5 h-5 text-green-600" />
                            </div>
                            <p className="text-lg text-zinc-700 leading-relaxed">{point}</p>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div className="text-center bg-zinc-50 rounded-3xl p-12">
                    <h3 className="text-2xl font-black mb-4">Get Your Quote Today</h3>
                    <p className="text-zinc-500 mb-8">Transparent pricing with no hidden costs.</p>
                    <Link to="/products" className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-colors">
                        Request Quote
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
