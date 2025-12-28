import { Link } from 'react-router-dom';
import { Calendar, ArrowLeft, ArrowRight, Factory, FileCheck, Target, Handshake, Award, Shield, Clock, TrendingUp } from 'lucide-react';
import { useEffect } from 'react';

export function TrustExperience() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

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
                        25+ Years of Proven Experience
                    </h1>
                    <p className="text-xl text-zinc-300 max-w-3xl leading-relaxed">
                        Arovave Global is not entering the global market as a newcomer. We are stepping onto the international stage backed by over 25 years of proven manufacturing, sourcing, and execution experience in India.
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-6 py-16">
                {/* Foundation Section */}
                <div className="mb-16">
                    <h2 className="text-3xl font-black uppercase tracking-tight mb-6">A Foundation Built Over 25+ Years</h2>
                    <div className="prose prose-lg max-w-none">
                        <p className="text-xl text-zinc-600 leading-relaxed mb-6">
                            Our roots lie in businesses that have operated consistently, responsibly, and successfully across changing markets, technologies, and client expectations. This long-standing foundation gives us the confidence to serve global buyers with clarity, control, and accountability.
                        </p>
                        <p className="text-lg text-zinc-600 leading-relaxed">
                            For more than two decades, our family-led enterprises have worked directly at the production level, understanding manufacturing not just as a service — but as a responsibility. This experience has shaped how we evaluate factories, manage quality, meet deadlines, and maintain long-term relationships. It is this same mindset that now drives Arovave Global's global operations.
                        </p>
                    </div>
                </div>

                {/* Two Pillars Grid */}
                <div className="grid md:grid-cols-2 gap-8 mb-16">
                    {/* Raj Prints */}
                    <div className="bg-white border-2 border-zinc-100 rounded-3xl p-8 hover:border-black hover:shadow-xl transition-all">
                        <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center mb-6">
                            <Factory className="w-7 h-7" />
                        </div>
                        <h3 className="text-2xl font-black mb-2">Raj Prints</h3>
                        <p className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">Decades of Precision, Scale & Reliability</p>
                        <p className="text-zinc-600 leading-relaxed mb-6">
                            Raj Prints represents over 25 years of continuous operation in the printing and production sector, serving clients where quality consistency and delivery timelines are critical.
                        </p>
                        <h4 className="font-bold mb-3">Key strengths developed over the years:</h4>
                        <ul className="space-y-2 text-zinc-600">
                            <li className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-black" />
                                High-volume production handling
                            </li>
                            <li className="flex items-center gap-2">
                                <FileCheck className="w-4 h-4 text-black" />
                                Process-driven quality checks
                            </li>
                            <li className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-black" />
                                Deadline-focused execution
                            </li>
                            <li className="flex items-center gap-2">
                                <Handshake className="w-4 h-4 text-black" />
                                Long-term client retention through reliability
                            </li>
                        </ul>
                        <div className="mt-6 p-4 bg-zinc-50 rounded-xl">
                            <p className="text-sm text-zinc-600 italic">
                                "Surviving and growing in a competitive production industry for 25+ years has instilled one core value: quality is not claimed — it is proven repeatedly."
                            </p>
                        </div>
                    </div>

                    {/* Vigilant Life Sciences */}
                    <div className="bg-white border-2 border-zinc-100 rounded-3xl p-8 hover:border-black hover:shadow-xl transition-all">
                        <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center mb-6">
                            <Shield className="w-7 h-7" />
                        </div>
                        <h3 className="text-2xl font-black mb-2">Vigilant Life Sciences Pvt. Ltd.</h3>
                        <p className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">Experience in Compliance-Driven & Regulated Markets</p>
                        <p className="text-zinc-600 leading-relaxed mb-6">
                            Our journey into pharmaceuticals through Vigilant Life Sciences added another crucial dimension — regulatory discipline.
                        </p>
                        <h4 className="font-bold mb-3">Operating in the pharma and healthcare ecosystem requires:</h4>
                        <ul className="space-y-2 text-zinc-600">
                            <li className="flex items-center gap-2">
                                <FileCheck className="w-4 h-4 text-black" />
                                Compliance awareness
                            </li>
                            <li className="flex items-center gap-2">
                                <FileCheck className="w-4 h-4 text-black" />
                                Documentation accuracy
                            </li>
                            <li className="flex items-center gap-2">
                                <Target className="w-4 h-4 text-black" />
                                Verified sourcing
                            </li>
                            <li className="flex items-center gap-2">
                                <Award className="w-4 h-4 text-black" />
                                Zero tolerance for quality lapses
                            </li>
                        </ul>
                        <div className="mt-6 p-4 bg-zinc-50 rounded-xl">
                            <p className="text-sm text-zinc-600 italic">
                                "This experience has trained our team to work with manufacturers who meet certification standards and export-readiness requirements — skills that directly translate into smoother global trade operations."
                            </p>
                        </div>
                    </div>
                </div>

                {/* Entering Global Market */}
                <div className="bg-black text-white rounded-3xl p-8 md:p-12 mb-16">
                    <h2 className="text-3xl font-black uppercase tracking-tight mb-6">Entering the Global Market — With Confidence, Not Assumptions</h2>
                    <p className="text-lg text-zinc-300 leading-relaxed mb-8">
                        With this combined experience in manufacturing, printing, packaging, and pharmaceuticals, Arovave Global is now expanding into international markets with clarity and confidence.
                    </p>
                    <h3 className="text-xl font-bold mb-4">We understand:</h3>
                    <div className="grid md:grid-cols-2 gap-4 mb-8">
                        <div className="flex items-center gap-3 bg-white/10 rounded-xl p-4">
                            <Factory className="w-5 h-5" />
                            <span>How factories actually operate</span>
                        </div>
                        <div className="flex items-center gap-3 bg-white/10 rounded-xl p-4">
                            <Target className="w-5 h-5" />
                            <span>Where quality risks arise</span>
                        </div>
                        <div className="flex items-center gap-3 bg-white/10 rounded-xl p-4">
                            <Clock className="w-5 h-5" />
                            <span>How timelines fail — and how to prevent it</span>
                        </div>
                        <div className="flex items-center gap-3 bg-white/10 rounded-xl p-4">
                            <TrendingUp className="w-5 h-5" />
                            <span>What global buyers expect beyond pricing</span>
                        </div>
                    </div>
                    <p className="text-zinc-400 font-medium">
                        Our entry into exports is not experimental. It is a calculated expansion backed by decades of hands-on industry exposure.
                    </p>
                </div>

                {/* What This Means */}
                <div className="mb-16">
                    <h2 className="text-3xl font-black uppercase tracking-tight mb-8">What This Means for Our Global Partners</h2>
                    <p className="text-lg text-zinc-600 mb-8">When you work with Arovave Global, you gain access to:</p>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="flex items-start gap-4 p-6 bg-zinc-50 rounded-2xl">
                            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shrink-0">
                                <Factory className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold mb-1">Manufacturing Experience</h4>
                                <p className="text-sm text-zinc-500">A sourcing partner grounded in real manufacturing experience</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-6 bg-zinc-50 rounded-2xl">
                            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shrink-0">
                                <FileCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold mb-1">Verified Networks</h4>
                                <p className="text-sm text-zinc-500">Verified and accountable production networks</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-6 bg-zinc-50 rounded-2xl">
                            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shrink-0">
                                <Target className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold mb-1">Transparent Processes</h4>
                                <p className="text-sm text-zinc-500">Transparent processes and realistic commitments</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-6 bg-zinc-50 rounded-2xl">
                            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shrink-0">
                                <Handshake className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold mb-1">Long-term Partnership</h4>
                                <p className="text-sm text-zinc-500">Long-term partnership thinking, not transactional intent</p>
                            </div>
                        </div>
                    </div>
                    <p className="text-zinc-600 mt-8 leading-relaxed">
                        Every product, shipment, and collaboration is guided by the same values that have sustained our businesses for over 25 years — <strong>trust, consistency, and accountability</strong>.
                    </p>
                </div>

                {/* Our Promise */}
                <div className="text-center bg-zinc-50 rounded-3xl p-12">
                    <h2 className="text-3xl font-black uppercase tracking-tight mb-6">Our Promise</h2>
                    <p className="text-xl text-zinc-600 max-w-3xl mx-auto leading-relaxed mb-4">
                        Arovave Global stands at the intersection of Indian manufacturing strength and global market expectations.
                    </p>
                    <p className="text-lg text-zinc-500 max-w-3xl mx-auto leading-relaxed mb-8">
                        We are entering the global marketplace not to test waters — but to build reliable, scalable, and lasting trade relationships, backed by experience that speaks louder than marketing claims.
                    </p>
                    <Link to="/catalog" className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-colors">
                        Explore Our Products
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
