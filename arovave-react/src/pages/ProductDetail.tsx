import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Package, BadgeCheck, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation, useEnquiry } from '../context';
import { products as initialProducts } from '../data';
import type { Product } from '../types';

// Get products from localStorage or use initial
const getStoredProducts = (): Product[] => {
    const saved = localStorage.getItem('arovaveProducts');
    return saved ? JSON.parse(saved) : initialProducts;
};

export function ProductDetail() {
    const { id } = useParams();
    const t = useTranslation();
    const { addToCart } = useEnquiry();
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [isVideo, setIsVideo] = useState(false);
    const [products, setProducts] = useState<Product[]>(getStoredProducts);

    // Reload products on mount to catch any updates
    useEffect(() => {
        setProducts(getStoredProducts());
    }, []);

    const product = products.find(p => p.id === Number(id));

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
        <div className="page-enter max-w-7xl mx-auto px-6 py-12">
            {/* Breadcrumb */}
            <Link to="/catalog" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-black transition-colors mb-8 inline-block">
                ← Back to Catalog
            </Link>

            <div className="grid lg:grid-cols-2 gap-16">
                {/* Media Gallery */}
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

                {/* Product Info */}
                <div>
                    <span className="inline-block px-4 py-2 bg-zinc-100 text-xs font-black uppercase tracking-widest rounded-full mb-4">
                        {product.cat}
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">{product.name}</h1>
                    <p className="text-zinc-400 text-sm font-bold mb-6">HSN Code: {product.hsn}</p>

                    <div className="bg-zinc-50 rounded-2xl p-6 mb-8">
                        <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">Indicative Price Range</p>
                        <p className="text-3xl font-black text-black">{product.priceRange}</p>
                        <p className="text-xs text-zinc-400 mt-2">Final price depends on volume and specifications</p>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-xs font-black uppercase tracking-widest mb-4">Description</h3>
                        <p className="text-zinc-600 leading-relaxed">{product.description}</p>
                    </div>

                    <div className="flex items-center gap-4 mb-8 p-4 border-2 border-zinc-100 rounded-xl">
                        <Package className="w-8 h-8 text-zinc-400" />
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Minimum Order Quantity</p>
                            <p className="text-xl font-black">{product.moq}</p>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-xs font-black uppercase tracking-widest mb-4">Certifications</h3>
                        <div className="flex flex-wrap gap-2">
                            {product.certifications.map(cert => (
                                <span key={cert} className="px-4 py-2 bg-green-50 text-green-700 text-xs font-bold rounded-full flex items-center gap-2">
                                    <BadgeCheck className="w-4 h-4" />
                                    {cert}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={() => addToCart(product)}
                            className="w-full py-5 bg-black text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-zinc-800 transition-colors"
                        >
                            {t('addToEnquiry')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Specifications */}
            <div className="mt-16 pt-16 border-t border-zinc-100">
                <h2 className="text-2xl font-black uppercase tracking-tighter mb-8">Technical Specifications</h2>
                <div className="grid md:grid-cols-2 gap-4">
                    {product.specs.map(spec => (
                        <div key={spec.label} className="flex justify-between items-center p-4 bg-zinc-50 rounded-xl">
                            <span className="text-xs font-black uppercase tracking-widest text-zinc-400">{spec.label}</span>
                            <span className="font-bold">{spec.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
