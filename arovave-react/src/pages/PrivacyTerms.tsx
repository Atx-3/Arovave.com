import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, FileCheck, Cookie, Eye, Server, Key, AlertTriangle, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export function PrivacyTerms() {
    const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'security' | 'cookies'>('privacy');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const tabs = [
        { id: 'privacy', label: 'Privacy Policy', icon: Eye },
        { id: 'terms', label: 'Terms of Service', icon: FileCheck },
        { id: 'security', label: 'Security', icon: Lock },
        { id: 'cookies', label: 'Cookies', icon: Cookie }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-white">
            {/* Hero Section */}
            <div className="bg-black text-white py-16">
                <div className="max-w-5xl mx-auto px-6">
                    <Link to="/profile" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Profile
                    </Link>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-white text-black rounded-2xl flex items-center justify-center">
                            <Shield className="w-8 h-8" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-widest text-zinc-400">Legal & Security</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-4">
                        Privacy & Terms
                    </h1>
                    <p className="text-lg text-zinc-300">
                        Your data security and privacy are our highest priority. Last updated: December 2024
                    </p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-zinc-200 bg-white sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="flex gap-1 overflow-x-auto">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-4 py-4 text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${activeTab === tab.id
                                        ? 'text-black border-b-2 border-black'
                                        : 'text-zinc-400 hover:text-zinc-600'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-6 py-12">
                {/* Privacy Policy Tab */}
                {activeTab === 'privacy' && (
                    <div className="space-y-8">
                        {/* Header Alert */}
                        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 flex items-start gap-4">
                            <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-bold text-green-800 mb-2">Your Data is Protected</h3>
                                <p className="text-green-700">We use industry-standard encryption and never sell your personal information to third parties.</p>
                            </div>
                        </div>

                        {/* Section 1 */}
                        <div className="bg-white border-2 border-zinc-100 rounded-2xl p-8">
                            <h3 className="text-xl font-black uppercase tracking-tight mb-4">Information We Collect</h3>
                            <p className="text-zinc-600 mb-4">We collect information you provide directly to us when you:</p>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <span className="w-2 h-2 bg-black rounded-full mt-2 shrink-0"></span>
                                    <span className="text-zinc-700"><strong>Account Creation</strong> – Name, email, phone number, country</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-2 h-2 bg-black rounded-full mt-2 shrink-0"></span>
                                    <span className="text-zinc-700"><strong>Enquiries</strong> – Product requests and quote submissions</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-2 h-2 bg-black rounded-full mt-2 shrink-0"></span>
                                    <span className="text-zinc-700"><strong>Support</strong> – Messages sent to our support team</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-2 h-2 bg-black rounded-full mt-2 shrink-0"></span>
                                    <span className="text-zinc-700"><strong>Newsletter</strong> – Email subscription preferences</span>
                                </li>
                            </ul>
                        </div>

                        {/* Section 2 */}
                        <div className="bg-white border-2 border-zinc-100 rounded-2xl p-8">
                            <h3 className="text-xl font-black uppercase tracking-tight mb-4">How We Use Your Information</h3>
                            <p className="text-zinc-600 mb-4">We use the information we collect to:</p>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <span className="w-2 h-2 bg-black rounded-full mt-2 shrink-0"></span>
                                    <span className="text-zinc-700">Process and respond to your enquiries</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-2 h-2 bg-black rounded-full mt-2 shrink-0"></span>
                                    <span className="text-zinc-700">Communicate with you about products and services</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-2 h-2 bg-black rounded-full mt-2 shrink-0"></span>
                                    <span className="text-zinc-700">Improve our platform and user experience</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-2 h-2 bg-black rounded-full mt-2 shrink-0"></span>
                                    <span className="text-zinc-700">Comply with legal obligations</span>
                                </li>
                            </ul>
                        </div>

                        {/* Section 3 */}
                        <div className="bg-white border-2 border-zinc-100 rounded-2xl p-8">
                            <h3 className="text-xl font-black uppercase tracking-tight mb-4">Data Storage & Protection</h3>
                            <p className="text-zinc-600 mb-6">Your data is stored securely using:</p>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-zinc-50 rounded-xl p-4">
                                    <p className="font-bold text-black mb-1">Supabase</p>
                                    <p className="text-sm text-zinc-500">Enterprise-grade PostgreSQL database with row-level security</p>
                                </div>
                                <div className="bg-zinc-50 rounded-xl p-4">
                                    <p className="font-bold text-black mb-1">SSL/TLS Encryption</p>
                                    <p className="text-sm text-zinc-500">All data transmitted is encrypted in transit</p>
                                </div>
                                <div className="bg-zinc-50 rounded-xl p-4">
                                    <p className="font-bold text-black mb-1">Secure Authentication</p>
                                    <p className="text-sm text-zinc-500">OTP-based verification and encrypted passwords</p>
                                </div>
                                <div className="bg-zinc-50 rounded-xl p-4">
                                    <p className="font-bold text-black mb-1">Regular Backups</p>
                                    <p className="text-sm text-zinc-500">Automated backups to prevent data loss</p>
                                </div>
                            </div>
                        </div>

                        {/* Section 4 - Data Sharing & Analytics */}
                        <div className="bg-zinc-900 text-white rounded-2xl p-8">
                            <h3 className="text-xl font-black uppercase tracking-tight mb-4">Data Sharing & Analytics</h3>
                            <p className="text-zinc-300 mb-4 font-semibold">We use the following third-party services:</p>
                            <ul className="space-y-3 mb-6">
                                <li className="flex items-start gap-3">
                                    <span className="text-blue-400 font-bold">●</span>
                                    <span className="text-zinc-300"><strong>Google Analytics</strong> – To understand how users interact with our website and improve user experience</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-blue-400 font-bold">●</span>
                                    <span className="text-zinc-300"><strong>Google Ads</strong> – To display relevant advertisements based on your interests</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-blue-400 font-bold">●</span>
                                    <span className="text-zinc-300"><strong>Meta Ads (Facebook/Instagram)</strong> – To show you personalized ads on Meta platforms</span>
                                </li>
                            </ul>
                            <p className="text-zinc-300 mb-4 font-semibold">We DO NOT:</p>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <span className="text-red-400 font-bold">✕</span>
                                    <span className="text-zinc-300">Sell your personal information to third parties</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-red-400 font-bold">✕</span>
                                    <span className="text-zinc-300">Share your contact details (email, phone) with advertisers</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-red-400 font-bold">✕</span>
                                    <span className="text-zinc-300">Use your data for purposes other than stated</span>
                                </li>
                            </ul>
                        </div>

                        {/* Section 5 - Your Rights */}
                        <div className="bg-white border-2 border-zinc-100 rounded-2xl p-8">
                            <h3 className="text-xl font-black uppercase tracking-tight mb-4">Your Rights</h3>
                            <p className="text-zinc-600 mb-6">You have the right to:</p>
                            <div className="grid md:grid-cols-2 gap-4 mb-6">
                                <div className="flex items-start gap-3 p-4 bg-zinc-50 rounded-xl">
                                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-black">Access</p>
                                        <p className="text-sm text-zinc-500">Request a copy of your personal data</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-4 bg-zinc-50 rounded-xl">
                                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-black">Correction</p>
                                        <p className="text-sm text-zinc-500">Update or correct your information</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-4 bg-zinc-50 rounded-xl">
                                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-black">Deletion</p>
                                        <p className="text-sm text-zinc-500">Request deletion of your account and data</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-4 bg-zinc-50 rounded-xl">
                                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-black">Portability</p>
                                        <p className="text-sm text-zinc-500">Export your data in a standard format</p>
                                    </div>
                                </div>
                            </div>
                            <p className="text-zinc-600">
                                To exercise these rights, contact us at <a href="mailto:privacy@arovave.com" className="text-black font-bold underline">privacy@arovave.com</a>
                            </p>
                        </div>

                        {/* Section 6 - Data Retention */}
                        <div className="bg-white border-2 border-zinc-100 rounded-2xl p-8">
                            <h3 className="text-xl font-black uppercase tracking-tight mb-4">Data Retention</h3>
                            <p className="text-zinc-600 leading-relaxed">
                                We retain your personal data only for as long as necessary to fulfill the purposes for which it was collected, including legal, accounting, or reporting requirements. <strong>Inactive accounts may be deleted after 24 months of inactivity.</strong>
                            </p>
                        </div>
                    </div>
                )}

                {/* Terms of Service Tab */}
                {activeTab === 'terms' && (
                    <div className="space-y-8">
                        {/* Header Alert */}
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 flex items-start gap-4">
                            <FileCheck className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-bold text-blue-800 mb-2">Terms of Service</h3>
                                <p className="text-blue-700">By using Arovave Global, you agree to these terms. Please read carefully.</p>
                            </div>
                        </div>

                        {/* Section 1 */}
                        <div className="bg-white border-2 border-zinc-100 rounded-2xl p-8">
                            <h3 className="text-xl font-black uppercase tracking-tight mb-4">Acceptance of Terms</h3>
                            <p className="text-zinc-600 leading-relaxed">
                                By accessing or using Arovave Global's website and services, you agree to be bound by these Terms of Service. <strong>If you do not agree to these terms, please do not use our services.</strong>
                            </p>
                        </div>

                        {/* Section 2 */}
                        <div className="bg-white border-2 border-zinc-100 rounded-2xl p-8">
                            <h3 className="text-xl font-black uppercase tracking-tight mb-4">Description of Services</h3>
                            <p className="text-zinc-600 mb-4">Arovave Global provides a platform connecting international buyers with verified Indian manufacturers. Our services include:</p>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <span className="w-2 h-2 bg-black rounded-full mt-2 shrink-0"></span>
                                    <span className="text-zinc-700">Product catalog and enquiry management</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-2 h-2 bg-black rounded-full mt-2 shrink-0"></span>
                                    <span className="text-zinc-700">Direct manufacturer connections</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-2 h-2 bg-black rounded-full mt-2 shrink-0"></span>
                                    <span className="text-zinc-700">Quality verification assistance</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-2 h-2 bg-black rounded-full mt-2 shrink-0"></span>
                                    <span className="text-zinc-700">Export documentation support</span>
                                </li>
                            </ul>
                        </div>

                        {/* Section 3 */}
                        <div className="bg-white border-2 border-zinc-100 rounded-2xl p-8">
                            <h3 className="text-xl font-black uppercase tracking-tight mb-4">User Accounts</h3>
                            <p className="text-zinc-600 mb-4">You are responsible for:</p>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <span className="w-2 h-2 bg-black rounded-full mt-2 shrink-0"></span>
                                    <span className="text-zinc-700">Providing <strong>accurate and complete</strong> registration information</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-2 h-2 bg-black rounded-full mt-2 shrink-0"></span>
                                    <span className="text-zinc-700">Maintaining the <strong>security</strong> of your account credentials</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-2 h-2 bg-black rounded-full mt-2 shrink-0"></span>
                                    <span className="text-zinc-700"><strong>All activities</strong> that occur under your account</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-2 h-2 bg-black rounded-full mt-2 shrink-0"></span>
                                    <span className="text-zinc-700">Notifying us <strong>immediately</strong> of any unauthorized access</span>
                                </li>
                            </ul>
                        </div>

                        {/* Section 4 - Prohibited Uses */}
                        <div className="bg-zinc-900 text-white rounded-2xl p-8">
                            <h3 className="text-xl font-black uppercase tracking-tight mb-4">Prohibited Uses</h3>
                            <p className="text-zinc-300 mb-4">You agree <strong>NOT</strong> to:</p>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <span className="text-red-400 font-bold">✕</span>
                                    <span className="text-zinc-300">Use our services for any unlawful purpose</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-red-400 font-bold">✕</span>
                                    <span className="text-zinc-300">Submit false or misleading information</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-red-400 font-bold">✕</span>
                                    <span className="text-zinc-300">Attempt to gain unauthorized access to our systems</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-red-400 font-bold">✕</span>
                                    <span className="text-zinc-300">Interfere with or disrupt our services</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-red-400 font-bold">✕</span>
                                    <span className="text-zinc-300">Violate any applicable laws or regulations</span>
                                </li>
                            </ul>
                        </div>

                        {/* Section 5 */}
                        <div className="bg-white border-2 border-zinc-100 rounded-2xl p-8">
                            <h3 className="text-xl font-black uppercase tracking-tight mb-4">Intellectual Property</h3>
                            <p className="text-zinc-600 leading-relaxed">
                                All content on the Arovave Global platform, including <strong>logos, text, images, and software</strong>, is the property of Arovave Global or its licensors and is protected by intellectual property laws.
                            </p>
                        </div>

                        {/* Section 6 */}
                        <div className="bg-white border-2 border-zinc-100 rounded-2xl p-8">
                            <h3 className="text-xl font-black uppercase tracking-tight mb-4">Limitation of Liability</h3>
                            <p className="text-zinc-600 mb-4">Arovave Global acts as a facilitator between buyers and manufacturers. We are <strong>not responsible</strong> for:</p>
                            <ul className="space-y-3 mb-4">
                                <li className="flex items-start gap-3">
                                    <span className="w-2 h-2 bg-zinc-400 rounded-full mt-2 shrink-0"></span>
                                    <span className="text-zinc-700">Quality issues with products from third-party manufacturers</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-2 h-2 bg-zinc-400 rounded-full mt-2 shrink-0"></span>
                                    <span className="text-zinc-700">Delays caused by shipping or customs</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-2 h-2 bg-zinc-400 rounded-full mt-2 shrink-0"></span>
                                    <span className="text-zinc-700">Losses resulting from transactions with manufacturers</span>
                                </li>
                            </ul>
                            <p className="text-zinc-600 font-semibold">Our liability is limited to the amount paid for our services.</p>
                        </div>

                        {/* Section 7 */}
                        <div className="bg-white border-2 border-zinc-100 rounded-2xl p-8">
                            <h3 className="text-xl font-black uppercase tracking-tight mb-4">Governing Law</h3>
                            <p className="text-zinc-600 leading-relaxed">
                                These Terms shall be governed by and construed in accordance with the <strong>laws of India</strong>. Any disputes shall be subject to the exclusive jurisdiction of the courts in <strong>Lucknow, Uttar Pradesh, India</strong>.
                            </p>
                        </div>

                        {/* Section 8 */}
                        <div className="bg-white border-2 border-zinc-100 rounded-2xl p-8">
                            <h3 className="text-xl font-black uppercase tracking-tight mb-4">Changes to Terms</h3>
                            <p className="text-zinc-600 leading-relaxed">
                                We reserve the right to modify these terms at any time. <strong>Continued use of our services after changes constitutes acceptance of the modified terms.</strong>
                            </p>
                        </div>
                    </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                    <div className="space-y-8">
                        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 flex items-start gap-4">
                            <Lock className="w-6 h-6 text-green-600 shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-bold text-green-800 mb-2">Enterprise-Grade Security</h3>
                                <p className="text-green-700">Your data is protected with industry-leading security measures.</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-white border-2 border-zinc-100 rounded-2xl p-6">
                                <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center mb-4">
                                    <Lock className="w-6 h-6" />
                                </div>
                                <h3 className="font-black text-lg mb-2">SSL/TLS Encryption</h3>
                                <p className="text-zinc-600 text-sm leading-relaxed">All data transmitted between your browser and our servers is encrypted using <strong>TLS 1.3</strong>, the latest security protocol.</p>
                            </div>

                            <div className="bg-white border-2 border-zinc-100 rounded-2xl p-6">
                                <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center mb-4">
                                    <Key className="w-6 h-6" />
                                </div>
                                <h3 className="font-black text-lg mb-2">Secure Authentication</h3>
                                <p className="text-zinc-600 text-sm leading-relaxed"><strong>8-digit OTP verification</strong>, bcrypt password hashing, and optional two-factor authentication protect your account.</p>
                            </div>

                            <div className="bg-white border-2 border-zinc-100 rounded-2xl p-6">
                                <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center mb-4">
                                    <Server className="w-6 h-6" />
                                </div>
                                <h3 className="font-black text-lg mb-2">Secure Infrastructure</h3>
                                <p className="text-zinc-600 text-sm leading-relaxed">Hosted on <strong>Supabase</strong> with PostgreSQL database, row-level security, and automatic backups in secure data centers.</p>
                            </div>

                            <div className="bg-white border-2 border-zinc-100 rounded-2xl p-6">
                                <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center mb-4">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <h3 className="font-black text-lg mb-2">Data Protection</h3>
                                <p className="text-zinc-600 text-sm leading-relaxed">Personal data is encrypted at rest and in transit. We follow <strong>GDPR-compliant</strong> data handling practices.</p>
                            </div>
                        </div>

                        <div className="bg-zinc-900 text-white rounded-2xl p-8">
                            <h3 className="font-black text-xl mb-6 flex items-center gap-3">
                                <AlertTriangle className="w-6 h-6 text-yellow-400" />
                                Security Tips for Users
                            </h3>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-4">
                                    <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                                    <span className="text-zinc-300">Use a <strong className="text-white">strong, unique password</strong> for your Arovave account</span>
                                </li>
                                <li className="flex items-start gap-4">
                                    <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                                    <span className="text-zinc-300"><strong className="text-white">Never share your OTP codes</strong> with anyone</span>
                                </li>
                                <li className="flex items-start gap-4">
                                    <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                                    <span className="text-zinc-300">Always verify you're on <strong className="text-white">arovave.com</strong> before entering credentials</span>
                                </li>
                                <li className="flex items-start gap-4">
                                    <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                                    <span className="text-zinc-300">Report suspicious activity to <strong className="text-white">security@arovave.com</strong></span>
                                </li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* Cookies Tab */}
                {activeTab === 'cookies' && (
                    <div className="space-y-8">
                        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 flex items-start gap-4">
                            <Cookie className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-bold text-amber-800 mb-2">Cookie Policy</h3>
                                <p className="text-amber-700">We use essential cookies for functionality, plus analytics and advertising cookies for Google & Meta ads.</p>
                            </div>
                        </div>

                        <div className="bg-white border-2 border-zinc-100 rounded-2xl p-8">
                            <h3 className="text-xl font-black uppercase tracking-tight mb-4">What Are Cookies?</h3>
                            <p className="text-zinc-600 leading-relaxed">
                                Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences and improve your experience.
                            </p>
                        </div>

                        <div className="bg-white border-2 border-zinc-100 rounded-2xl p-8">
                            <h3 className="text-xl font-black uppercase tracking-tight mb-6">Essential Cookies (Required)</h3>
                            <p className="text-zinc-600 mb-4">These cookies are necessary for the website to function properly:</p>
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="bg-zinc-50 rounded-xl p-4">
                                    <p className="font-bold text-black mb-1">Authentication</p>
                                    <p className="text-sm text-zinc-500">Keeps you logged in during your session</p>
                                </div>
                                <div className="bg-zinc-50 rounded-xl p-4">
                                    <p className="font-bold text-black mb-1">Security</p>
                                    <p className="text-sm text-zinc-500">Helps prevent unauthorized access</p>
                                </div>
                                <div className="bg-zinc-50 rounded-xl p-4">
                                    <p className="font-bold text-black mb-1">Language</p>
                                    <p className="text-sm text-zinc-500">Remembers your language preference</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border-2 border-zinc-100 rounded-2xl p-8">
                            <h3 className="text-xl font-black uppercase tracking-tight mb-4">Analytics Cookies (Optional)</h3>
                            <p className="text-zinc-600 mb-4">With your consent, we may use anonymous analytics to:</p>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <span className="w-2 h-2 bg-black rounded-full mt-2 shrink-0"></span>
                                    <span className="text-zinc-700">Understand how visitors use our website</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-2 h-2 bg-black rounded-full mt-2 shrink-0"></span>
                                    <span className="text-zinc-700">Improve our services and user experience</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-2 h-2 bg-black rounded-full mt-2 shrink-0"></span>
                                    <span className="text-zinc-700">Measure the effectiveness of our content</span>
                                </li>
                            </ul>
                        </div>

                        <div className="bg-zinc-900 text-white rounded-2xl p-8">
                            <h3 className="text-xl font-black uppercase tracking-tight mb-4">Advertising & Analytics Cookies</h3>
                            <p className="text-zinc-300 mb-4 font-semibold">We use the following tracking technologies:</p>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <span className="text-blue-400 font-bold">●</span>
                                    <span className="text-zinc-300"><strong>Google Analytics</strong> – Tracks website usage and behavior</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-blue-400 font-bold">●</span>
                                    <span className="text-zinc-300"><strong>Google Ads Pixel</strong> – Helps measure ad effectiveness and remarketing</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-blue-400 font-bold">●</span>
                                    <span className="text-zinc-300"><strong>Meta Pixel (Facebook)</strong> – Powers targeted ads on Facebook and Instagram</span>
                                </li>
                            </ul>
                            <p className="text-zinc-400 mt-4 text-sm">These cookies help us show you relevant ads and improve our marketing. You can opt out via your browser settings or ad preferences.</p>
                        </div>

                        <div className="bg-white border-2 border-zinc-100 rounded-2xl p-8">
                            <h3 className="text-xl font-black uppercase tracking-tight mb-4">Managing Cookies</h3>
                            <p className="text-zinc-600 mb-4 leading-relaxed">
                                You can control cookies through your browser settings. Note that disabling essential cookies may affect website functionality.
                            </p>
                            <p className="text-zinc-600">
                                Questions about our cookie policy? Email us at <a href="mailto:privacy@arovave.com" className="text-black font-bold underline">privacy@arovave.com</a>
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
