import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Package, BadgeCheck, Play, ChevronLeft, ChevronRight, Check, Clock, Shield, CheckCircle2, FileText } from 'lucide-react';
import { useTranslation, useEnquiry, useAuth } from '../context';
import { products as initialProducts } from '../data';
import { AuthModal } from '../components/auth/AuthModal';
import type { Product } from '../types';

// Get products from localStorage or use initial
const getStoredProducts = (): Product[] => {
    const saved = localStorage.getItem('arovaveProducts');
    return saved ? JSON.parse(saved) : initialProducts;
};

export function ProductDetail() {
    const { id } = useParams();
    const t = useTranslation();
    const navigate = useNavigate();
    const { submitProductEnquiry } = useEnquiry();
    const { isAuthenticated } = useAuth();
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [isVideo, setIsVideo] = useState(false);
    const [products, setProducts] = useState<Product[]>(getStoredProducts);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showPopup, setShowPopup] = useState(false);

    // Reload products on mount to catch any updates
    useEffect(() => {
        setProducts(getStoredProducts());
    }, []);

    // Auto-close popup after 3 seconds
    useEffect(() => {
        if (showPopup) {
            const timer = setTimeout(() => setShowPopup(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [showPopup]);

    // After login, submit pending enquiry
    useEffect(() => {
        if (isAuthenticated && showAuthModal) {
            setShowAuthModal(false);
            // User just logged in, submit the enquiry
            if (product) {
                submitProductEnquiry(product);
                setShowPopup(true);
                setTimeout(() => navigate('/enquiries'), 2000);
            }
        }
    }, [isAuthenticated]);

    const product = products.find(p => p.id === Number(id));

    const handleEnquire = () => {
        if (!product) return;

        if (!isAuthenticated) {
            setShowAuthModal(true);
            return;
        }
        submitProductEnquiry(product);
        setShowPopup(true);
        setTimeout(() => navigate('/enquiries'), 2000);
    };

    if (!product) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-20 text-center">
                <h1 className="text-3xl font-black mb-4">Product Not Found</h1>
                <Link to="/catalog" className="text-zinc-500 hover:text-black">← Back to Catalog</Link>
            </div>
        );
    }

    const totalMedia = product.images.length + (product.video ? 1 : 0);

    const handlePrev = () => {
        const newIndex = (currentMediaIndex - 1 + totalMedia) % totalMedia;
        setCurrentMediaIndex(newIndex);
        setIsVideo(newIndex >= product.images.length);
    };

    const handleNext = () => {
        const newIndex = (currentMediaIndex + 1) % totalMedia;
        setCurrentMediaIndex(newIndex);
        setIsVideo(newIndex >= product.images.length);
    };

    const selectMedia = (index: number, video = false) => {
        setCurrentMediaIndex(index);
        setIsVideo(video);
    };

    return (
        <div className="page-enter">
            {/* Success Popup */}
            {showPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-3xl p-8 max-w-sm mx-4 text-center shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-black mb-2">Enquiry Submitted!</h3>
                        <p className="text-zinc-500 mb-6">Our team will contact you shortly.</p>
                        <button
                            onClick={() => {
                                setShowPopup(false);
                                navigate('/enquiries');
                            }}
                            className="px-8 py-3 bg-black text-white font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-colors"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

            {/* Product Overview Section */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Breadcrumb */}
                <Link to="/catalog" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-black transition-colors mb-8 inline-flex items-center gap-2">
                    <ChevronLeft className="w-4 h-4" />
                    Back to Catalog
                </Link>

                <div className="grid lg:grid-cols-2 gap-16 mt-8">
                    {/* Product Overview - Clear Visuals */}
                    <div>
                        <div className="aspect-square bg-zinc-100 rounded-3xl overflow-hidden mb-4 relative">
                            {isVideo && product.video ? (
                                <video
                                    src={product.video}
                                    className="w-full h-full object-cover"
                                    controls
                                    autoPlay
                                    muted
                                />
                            ) : (
                                <img
                                    src={product.images[currentMediaIndex]}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                            )}
                            {totalMedia > 1 && (
                                <>
                                    <button
                                        onClick={handlePrev}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={handleNext}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Thumbnails */}
                        <div className="flex gap-3 flex-wrap">
                            {product.images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => selectMedia(idx, false)}
                                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors ${!isVideo && currentMediaIndex === idx ? 'border-black' : 'border-transparent hover:border-black'
                                        }`}
                                >
                                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                            {product.video && (
                                <button
                                    onClick={() => selectMedia(product.images.length, true)}
                                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 bg-zinc-900 flex items-center justify-center relative transition-colors ${isVideo ? 'border-black' : 'border-transparent hover:border-black'
                                        }`}
                                >
                                    <Play className="w-8 h-8 text-white" />
                                    <span className="absolute bottom-1 left-1 text-[8px] text-white font-bold uppercase">Video</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Product Info - Clear Hierarchy */}
                    <div>
                        {/* Category Badge */}
                        <span className="inline-block px-4 py-2 bg-zinc-100 text-xs font-black uppercase tracking-widest rounded-full mb-4">
                            {product.cat}
                        </span>

                        {/* Product Name */}
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-3">{product.name}</h1>

                        {/* HSN Code */}
                        <p className="text-zinc-400 text-sm font-bold mb-6">HSN Code: {product.hsn}</p>

                        {/* Short Description - Buyer Focused */}
                        <p className="text-lg text-zinc-600 leading-relaxed mb-8">
                            {product.description}
                        </p>

                        {/* Key Specifications - Highlighted */}
                        <div className="bg-gradient-to-br from-zinc-50 to-white rounded-2xl border border-zinc-100 p-6 mb-8">
                            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Key Specifications
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-3">
                                    <Package className="w-5 h-5 text-zinc-400" />
                                    <div>
                                        <p className="text-xs text-zinc-400">Min. Order</p>
                                        <p className="font-bold">{product.moq}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-zinc-400" />
                                    <div>
                                        <p className="text-xs text-zinc-400">Lead Time</p>
                                        <p className="font-bold">{product.leadTime || '15-30 Days'}</p>
                                    </div>
                                </div>
                                {product.material && (
                                    <div className="flex items-center gap-3">
                                        <Shield className="w-5 h-5 text-zinc-400" />
                                        <div>
                                            <p className="text-xs text-zinc-400">Material</p>
                                            <p className="font-bold">{product.material}</p>
                                        </div>
                                    </div>
                                )}
                                {product.packagingOptions && (
                                    <div className="flex items-center gap-3">
                                        <Package className="w-5 h-5 text-zinc-400" />
                                        <div>
                                            <p className="text-xs text-zinc-400">Packaging</p>
                                            <p className="font-bold">{product.packagingOptions}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Price Range */}
                        <div className="bg-zinc-900 text-white rounded-2xl p-6 mb-8">
                            <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">Indicative Price Range</p>
                            <p className="text-3xl font-black">{product.priceRange}</p>
                            <p className="text-xs text-zinc-400 mt-2">Final price depends on volume and specifications</p>
                        </div>

                        {/* Certifications */}
                        <div className="mb-8">
                            <h3 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Certifications & Compliance
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {product.certifications.map(cert => (
                                    <span key={cert} className="px-4 py-2 bg-green-50 text-green-700 text-xs font-bold rounded-full flex items-center gap-2">
                                        <BadgeCheck className="w-4 h-4" />
                                        {cert}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* CTA Button */}
                        <button
                            onClick={handleEnquire}
                            className="w-full py-5 bg-black text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-zinc-800 transition-colors"
                        >
                            {t('addToEnquiry')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Technical Specifications - Full Details */}
            <div className="bg-zinc-50 py-16">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-2xl font-black uppercase tracking-tighter mb-8">Technical Specifications</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {product.specs.map(spec => (
                            <div key={spec.label} className="flex justify-between items-center p-5 bg-white rounded-xl border border-zinc-100">
                                <span className="text-xs font-black uppercase tracking-widest text-zinc-400">{spec.label}</span>
                                <span className="font-bold">{spec.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Why This Product - Clear, Factual, Practical */}
            <div className="py-16">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-2xl font-black uppercase tracking-tighter mb-8">Why This Product</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-white border border-zinc-100 rounded-2xl p-6 hover:border-black transition-all">
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                                <CheckCircle2 className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="font-black text-lg mb-2">Verified Manufacturing</h3>
                            <p className="text-zinc-500 text-sm leading-relaxed">
                                Produced in certified facilities with documented quality processes.
                            </p>
                        </div>
                        <div className="bg-white border border-zinc-100 rounded-2xl p-6 hover:border-black transition-all">
                            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4">
                                <Shield className="w-6 h-6 text-green-600" />
                            </div>
                            <h3 className="font-black text-lg mb-2">Export Ready</h3>
                            <p className="text-zinc-500 text-sm leading-relaxed">
                                Compliant with international standards and export documentation.
                            </p>
                        </div>
                        <div className="bg-white border border-zinc-100 rounded-2xl p-6 hover:border-black transition-all">
                            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
                                <Package className="w-6 h-6 text-purple-600" />
                            </div>
                            <h3 className="font-black text-lg mb-2">Custom Packaging</h3>
                            <p className="text-zinc-500 text-sm leading-relaxed">
                                Private labeling and custom packaging options available.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-black text-white py-16">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-black mb-4">Ready to Place an Order?</h2>
                    <p className="text-zinc-400 mb-8">
                        Submit an enquiry and our team will provide detailed quotations.
                    </p>
                    <button
                        onClick={handleEnquire}
                        className="inline-block px-10 py-4 bg-white text-black font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-zinc-100 transition-colors"
                    >
                        Request Quote
                    </button>
                </div>
            </div>
        </div>
    );
}
