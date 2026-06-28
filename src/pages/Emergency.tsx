import { useEffect } from 'react';
import { GlobalResourcesMap } from '@/components/GlobalResourcesMap';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { EmergencyAITips } from '@/components/emergency/EmergencyAITips';
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

      {/* World ATLAS — futuristic top-center title */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[80] pointer-events-none">
        <div className="px-6 py-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
          <h1
            className="text-sm md:text-base font-bold uppercase tracking-[0.35em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-cyan-300"
            style={{
              fontFamily: "'Orbitron', 'Space Grotesk', sans-serif",
              textShadow: '0 0 20px rgba(6,182,212,0.4)',
            }}
          >
            World ATLAS
          </h1>
        </div>
      </div>

      <div className="absolute top-3 right-16 z-[70] flex flex-row items-center gap-2">
        <EmergencyAITips />
        <div className="rounded-full bg-background/80 backdrop-blur-md border border-border shadow-lg">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
};

export default Emergency;
