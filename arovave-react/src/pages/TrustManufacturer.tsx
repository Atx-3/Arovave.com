import { Link } from 'react-router-dom';
import { Handshake, ArrowLeft, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';

export function TrustManufacturer() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const benefits = [
        { title: 'Clarity from Day One', desc: 'You know who is manufacturing your product before production begins. There is no ambiguity about the source.' },
        { title: 'Control Without Complexity', desc: 'Direct factory access allows you to control product specifications, formulation, packaging, branding, lead times, and batch wise quality checks.' },
        { title: 'Faster Decisions', desc: 'Without intermediaries, pricing approvals, sampling, revisions, and confirmations move faster with fewer misunderstandings.' }
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
                            <Handshake className="w-8 h-8" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-widest text-zinc-400">Why Trust Arovave</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight mb-6">
                        Direct Manufacturer Access
                    </h1>
                    <p className="text-xl text-zinc-300 max-w-3xl leading-relaxed">
                        What Happens When You Work with Arovave
                    </p>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-5xl mx-auto px-6 py-16">
                <div className="prose prose-lg max-w-none mb-12">
                    <p className="text-xl text-zinc-600 leading-relaxed">
                        When you raise an enquiry on Arovave, your requirement does not circulate through traders or agents. It is evaluated, mapped, and sent directly to factories that already match your product category, volume, compliance needs, and export requirements.
                    </p>
                </div>

                {/* Benefits Grid */}
                <div className="grid md:grid-cols-3 gap-8 mb-16">
                    {benefits.map((benefit, idx) => (
                        <div key={idx} className="bg-white border-2 border-zinc-100 rounded-3xl p-8 hover:border-black hover:shadow-xl transition-all">
                            <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center font-black text-xl mb-6">
                                {idx + 1}
                            </div>
                            <h3 className="text-xl font-black mb-4">{benefit.title}</h3>
                            <p className="text-zinc-500 leading-relaxed">{benefit.desc}</p>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div className="text-center bg-zinc-50 rounded-3xl p-12">
                    <h3 className="text-2xl font-black mb-4">Ready to Connect Directly with Manufacturers?</h3>
                    <p className="text-zinc-500 mb-8">Submit your requirement and get matched with verified factories.</p>
                    <Link to="/catalog" className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-colors">
                        Browse Products
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
