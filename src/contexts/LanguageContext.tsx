import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'es' | 'ja';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.features': 'Features',
    'nav.blog': 'Community Blog',
    'nav.guidelines': 'Guidelines',
    'nav.sponsorship': 'Sponsorship Program',
    'nav.profile': 'Profile',
    // Footer
    'footer.quickLinks': 'Quick Links',
    'footer.resources': 'Resources',
    'footer.legal': 'Legal',
    'footer.helpCenter': 'Help Center',
    'footer.documentation': 'Documentation',
    'footer.contactSupport': 'Contact Support',
    'footer.privacyPolicy': 'Privacy Policy',
    'footer.termsOfService': 'Terms of Service',
    'footer.cookiePolicy': 'Cookie Policy',
    'footer.copyright': '© 2025 Startup Factory Hub. All rights reserved.',
    'footer.builtWith': 'Built with ❤️ for the startup community',
    'footer.language': 'Language',
    // Common
    'common.selectLanguage': 'Select Language',
    'common.english': 'English',
    'common.spanish': 'Spanish',
    'common.japanese': 'Japanese',
  },
  es: {
    // Navigation
    'nav.home': 'Inicio',
    'nav.about': 'Acerca de',
    'nav.features': 'Características',
    'nav.blog': 'Blog Comunitario',
    'nav.guidelines': 'Directrices',
    'nav.sponsorship': 'Programa de Patrocinio',
    'nav.profile': 'Perfil',
    // Footer
    'footer.quickLinks': 'Enlaces Rápidos',
    'footer.resources': 'Recursos',
    'footer.legal': 'Legal',
    'footer.helpCenter': 'Centro de Ayuda',
    'footer.documentation': 'Documentación',
    'footer.contactSupport': 'Contactar Soporte',
    'footer.privacyPolicy': 'Política de Privacidad',
    'footer.termsOfService': 'Términos de Servicio',
    'footer.cookiePolicy': 'Política de Cookies',
    'footer.copyright': '© 2025 Startup Factory Hub. Todos los derechos reservados.',
    'footer.builtWith': 'Hecho con ❤️ para la comunidad startup',
    'footer.language': 'Idioma',
    // Common
    'common.selectLanguage': 'Seleccionar Idioma',
    'common.english': 'Inglés',
    'common.spanish': 'Español',
    'common.japanese': 'Japonés',
  },
  ja: {
    // Navigation
    'nav.home': 'ホーム',
    'nav.about': '概要',
    'nav.features': '機能',
    'nav.blog': 'コミュニティブログ',
    'nav.guidelines': 'ガイドライン',
    'nav.sponsorship': 'スポンサーシッププログラム',
    'nav.profile': 'プロフィール',
    // Footer
    'footer.quickLinks': 'クイックリンク',
    'footer.resources': 'リソース',
    'footer.legal': '法的情報',
    'footer.helpCenter': 'ヘルプセンター',
    'footer.documentation': 'ドキュメント',
    'footer.contactSupport': 'サポートに連絡',
    'footer.privacyPolicy': 'プライバシーポリシー',
    'footer.termsOfService': '利用規約',
    'footer.cookiePolicy': 'クッキーポリシー',
    'footer.copyright': '© 2025 Startup Factory Hub. 全著作権所有。',
    'footer.builtWith': 'スタートアップコミュニティのために❤️で構築',
    'footer.language': '言語',
    // Common
    'common.selectLanguage': '言語を選択',
    'common.english': '英語',
    'common.spanish': 'スペイン語',
    'common.japanese': '日本語',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app-language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

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
