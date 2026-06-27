import { useEffect } from 'react';
import { GlobalResourcesMap } from '@/components/GlobalResourcesMap';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';

const Emergency = () => {
  const { setLanguage, language } = useLanguage();

  // Default the Emergency page to Spanish on first visit (Venezuela Rebuild context)
  useEffect(() => {
    const seeded = localStorage.getItem('emergency-lang-seeded');
    if (!seeded) {
      setLanguage('es');
      localStorage.setItem('emergency-lang-seeded', '1');
    }
  }, [setLanguage]);

  return (
    <div className="relative h-screen w-screen overflow-hidden" lang={language}>
      <GlobalResourcesMap emergencyMode />
      <div className="absolute top-3 right-3 z-[70]">
        <div className="rounded-full bg-background/80 backdrop-blur-md border border-border shadow-lg">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
};

export default Emergency;
