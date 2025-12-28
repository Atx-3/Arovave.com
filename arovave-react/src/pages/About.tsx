import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, Target, Heart, Users, Calendar, Factory, Shield, Award, Handshake } from 'lucide-react';
import { useEffect } from 'react';

export function About() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const values = [
        { icon: Handshake, title: 'Trust', desc: 'Built through years of consistent delivery and transparent operations.' },
        { icon: Target, title: 'Accountability', desc: 'Every commitment is tracked, documented, and fulfilled.' },
        { icon: Heart, title: 'Integrity', desc: 'Honest pricing, verified sourcing, no hidden markups.' },
        { icon: Award, title: 'Excellence', desc: 'Quality is proven through process, not promises.' }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-white">
            {/* Hero Section */}
            <div className="bg-black text-white py-20">
                <div className="max-w-5xl mx-auto px-6">
                    <Link to="/profile" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Profile
                    </Link>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-white text-black rounded-2xl flex items-center justify-center">
                            <Building2 className="w-8 h-8" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-widest text-zinc-400">About Arovave Global</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight mb-6">
                        Who We Are
                    </h1>
                    <p className="text-xl text-zinc-300 max-w-3xl leading-relaxed">
                        Arovave Global is a structured manufacturing access platform that connects international buyers directly to verified Indian factories with control, documentation, and accountability built in.
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-6 py-16">
                {/* Company Overview */}
                <div className="mb-16">
                    <h2 className="text-3xl font-black uppercase tracking-tight mb-6">Our Story</h2>
                    <div className="prose prose-lg max-w-none">
                        <p className="text-xl text-zinc-600 leading-relaxed mb-6">
                            Arovave Global is not entering the global market as a newcomer. We are stepping onto the international stage backed by over 25 years of proven manufacturing, sourcing, and execution experience in India.
                        </p>
                        <p className="text-lg text-zinc-600 leading-relaxed">
                            Our roots lie in businesses that have operated consistently, responsibly, and successfully across changing markets, technologies, and client expectations. This long-standing foundation gives us the confidence to serve global buyers with clarity, control, and accountability.
                        </p>
                    </div>
                </div>

                {/* Founding Companies */}
                <div className="grid md:grid-cols-2 gap-8 mb-16">
                    <div className="bg-white border-2 border-zinc-100 rounded-3xl p-8 hover:border-black hover:shadow-xl transition-all">
                        <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center mb-6">
                            <Factory className="w-7 h-7" />
                        </div>
                        <h3 className="text-2xl font-black mb-2">Raj Prints</h3>
                        <p className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">25+ Years in Printing & Production</p>
                        <p className="text-zinc-600 leading-relaxed">
                            Raj Prints represents over 25 years of continuous operation in the printing and production sector. Key strengths include high-volume production handling, process-driven quality checks, deadline-focused execution, and long-term client retention through reliability.
                        </p>
                    </div>

                    <div className="bg-white border-2 border-zinc-100 rounded-3xl p-8 hover:border-black hover:shadow-xl transition-all">
                        <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center mb-6">
                            <Shield className="w-7 h-7" />
                        </div>
                        <h3 className="text-2xl font-black mb-2">Vigilant Life Sciences Pvt. Ltd.</h3>
                        <p className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">Compliance-Driven Pharmaceutical Experience</p>
                        <p className="text-zinc-600 leading-relaxed">
                            Our journey into pharmaceuticals through Vigilant Life Sciences added regulatory discipline, compliance awareness, documentation accuracy, verified sourcing, and zero tolerance for quality lapses to our operations.
                        </p>
                    </div>
                </div>

                {/* Mission & Vision */}
                <div className="bg-black text-white rounded-3xl p-8 md:p-12 mb-16">
                    <div className="grid md:grid-cols-2 gap-12">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <Target className="w-6 h-6" />
                                <h3 className="text-xl font-black uppercase tracking-widest">Our Mission</h3>
                            </div>
                            <p className="text-zinc-300 leading-relaxed">
                                To provide global buyers with structured, reliable access to Indian manufacturing capabilities — eliminating uncertainty, ensuring quality, and building lasting trade relationships based on transparency and accountability.
                            </p>
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <Calendar className="w-6 h-6" />
                                <h3 className="text-xl font-black uppercase tracking-widest">Our Vision</h3>
                            </div>
                            <p className="text-zinc-300 leading-relaxed">
                                To become the most trusted bridge between Indian manufacturers and international markets — setting new standards for sourcing transparency, quality assurance, and export reliability.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Core Values */}
                <div className="mb-16">
                    <h2 className="text-3xl font-black uppercase tracking-tight mb-8 text-center">Our Core Values</h2>
                    <div className="grid md:grid-cols-4 gap-6">
                        {values.map((value, idx) => {
                            const Icon = value.icon;
                            return (
                                <div key={idx} className="text-center p-6 bg-zinc-50 rounded-2xl">
                                    <div className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Icon className="w-7 h-7" />
                                    </div>
                                    <h4 className="font-black text-lg mb-2">{value.title}</h4>
                                    <p className="text-sm text-zinc-500">{value.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Leadership */}
                <div className="mb-16">
                    <h2 className="text-3xl font-black uppercase tracking-tight mb-8">Leadership</h2>
                    <div className="bg-white border-2 border-zinc-100 rounded-3xl p-8">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center">
                                <Users className="w-10 h-10 text-zinc-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black mb-1">Family-Led Enterprise</h3>
                                <p className="text-zinc-500">Over two decades of hands-on manufacturing experience</p>
                            </div>
                        </div>
                        <p className="mt-6 text-zinc-600 leading-relaxed">
                            Arovave Global is led by a family with deep roots in Indian manufacturing. For more than two decades, our team has worked directly at the production level, understanding manufacturing not just as a service — but as a responsibility. This experience shapes how we evaluate factories, manage quality, meet deadlines, and maintain long-term relationships.
                        </p>
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center bg-zinc-50 rounded-3xl p-12">
                    <h3 className="text-2xl font-black mb-4">Partner With Us</h3>
                    <p className="text-zinc-500 mb-8">Experience the difference of working with a trusted Indian sourcing partner.</p>
                    <Link to="/catalog" className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-colors">
                        Explore Our Catalog
                    </Link>
                </div>
            </div>
        </div>
    );
}
