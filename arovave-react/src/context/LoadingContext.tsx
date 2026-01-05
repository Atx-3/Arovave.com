import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ProductLoader } from '../components/ProductLoader';

interface LoadingContextType {
    isLoading: boolean;
    loadingMessage: string;
    showLoading: (message?: string) => void;
    hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Loading...');

    const showLoading = (message = 'Loading...') => {
        setLoadingMessage(message);
        setIsLoading(true);
    };

    const hideLoading = () => {
        setIsLoading(false);
    };

    return (
        <LoadingContext.Provider value={{ isLoading, loadingMessage, showLoading, hideLoading }}>
            {children}
            {isLoading && (
                <div className="fixed inset-0 z-[9999] bg-white/95 backdrop-blur-sm flex items-center justify-center">
                    <ProductLoader message={loadingMessage} />
                </div>
            )}
        </LoadingContext.Provider>
    );
}

export function useLoading() {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
}
