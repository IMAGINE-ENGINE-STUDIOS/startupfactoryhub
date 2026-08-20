import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { translations, type LanguageCode, type TranslationKey, LANGUAGES } from '@/translations';
import { signTranslations } from '@/translations/sign';
import { geniusTranslations } from '@/translations/genius';


interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved as LanguageCode) || 'en';
  });

  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('app-language', lang);
    // Let non-React consumers (AI call sites, embedded editors) react instantly.
    window.dispatchEvent(new CustomEvent('app-language-changed', { detail: lang }));
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = useCallback((key: string, fallback?: string): string => {
    const langTranslations = translations[language] as Record<string, string> | undefined;
    const enTranslations = translations['en'] as Record<string, string>;
    const langSign = signTranslations[language] as Record<string, string> | undefined;
    const enSign = signTranslations['en'] as Record<string, string>;
    const langGenius = (geniusTranslations as Record<string, Record<string, string>>)[language];
    const enGenius = (geniusTranslations as Record<string, Record<string, string>>)['en'];
    return (
      langTranslations?.[key] ||
      langSign?.[key] ||
      langGenius?.[key] ||
      enTranslations?.[key] ||
      enSign?.[key] ||
      enGenius?.[key] ||
      fallback ||
      key
    );
  }, [language]);


  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}

// Re-export Language as alias for backwards compat
export type Language = LanguageCode;
export { LANGUAGES, type LanguageCode, type TranslationKey };
