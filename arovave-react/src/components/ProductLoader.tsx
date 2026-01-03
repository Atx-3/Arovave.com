import { Ship, Package, Globe, Truck, Plane } from 'lucide-react';
import '../styles/ProductLoader.css';

interface ProductLoaderProps {
    message?: string;
}

export function ProductLoader({ message = "Loading products..." }: ProductLoaderProps) {
    return (
        <div className="product-loader">
            <div className="loader-container">
                {/* Animated Ship */}
                <div className="ship-animation">
                    <div className="ocean">
                        <div className="wave wave1"></div>
                        <div className="wave wave2"></div>
                        <div className="wave wave3"></div>
                    </div>
                    <div className="ship">
                        <Ship size={48} strokeWidth={1.5} />
                    </div>
                    {/* Floating packages */}
                    <div className="floating-icons">
                        <div className="float-icon icon1">
                            <Package size={24} />
                        </div>
                        <div className="float-icon icon2">
                            <Globe size={20} />
                        </div>
                        <div className="float-icon icon3">
                            <Plane size={22} />
                        </div>
                    </div>
                </div>

                {/* Loading text */}
                <div className="loader-text">
                    <p className="loader-message">{message}</p>
                    <div className="loading-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>

                {/* Tagline */}
                <p className="loader-tagline">Connecting you to global trade</p>
            </div>
        </div>
    );
}
