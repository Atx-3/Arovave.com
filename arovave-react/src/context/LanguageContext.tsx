import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { translations } from '../data';

type Language = 'en' | 'hi' | 'es' | 'fr' | 'ar' | 'zh' | 'pt' | 'de' | 'ja' | 'ko' | 'ru' | 'it' | 'tr' | 'nl' | 'id' | 'vi' | 'th' | 'pl' | 'el' | 'sv' | 'he' | 'uk' | 'bn' | 'ta' | 'ms' | 'fil' | 'sw';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>('en');

    const t = (key: string): string => {
        return translations[language]?.[key] || translations.en[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

export function useTranslation() {
    const { t } = useLanguage();
    return t;
}
