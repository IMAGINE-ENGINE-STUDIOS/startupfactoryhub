import { useState, useEffect } from 'react';
import { Download, Smartphone, Monitor, Wifi, WifiOff, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const AppDownloadSection = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    } else {
      navigate('/install');
    }
  };

  const features = [
    { icon: Zap, title: t('app.feature.fast', 'Lightning Fast'), desc: t('app.feature.fast.desc', 'Instant loading with native-like performance') },
    { icon: WifiOff, title: t('app.feature.offline', 'Works Offline'), desc: t('app.feature.offline.desc', 'Access key features without internet') },
    { icon: Smartphone, title: t('app.feature.mobile', 'Any Device'), desc: t('app.feature.mobile.desc', 'Phone, tablet, or desktop — one app for all') },
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium">
              <Download className="w-4 h-4" />
              {t('app.badge', 'Free Download')}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
              {t('app.title', 'Get the Startup Factory Hub App')}
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {t('app.description', 'Install our app directly from your browser — no app store needed. Get instant access to all startup tools, community, and resources right from your home screen.')}
            </p>

            <div className="space-y-4 pt-2">
              {features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{feature.title}</p>
                    <p className="text-muted-foreground text-sm">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleInstall}
              className="mt-4 inline-flex items-center gap-2.5 bg-primary text-primary-foreground px-8 py-3.5 rounded-xl font-semibold text-base hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              <Download className="w-5 h-5" />
              {t('app.download', 'Download the App')}
            </button>
            <p className="text-xs text-muted-foreground">
              {t('app.platforms', 'Available on Android, iOS, Windows, and Mac')}
            </p>
          </div>

          {/* Right: Visual */}
          <div className="relative flex items-center justify-center">
            <div className="relative w-64 h-[460px] rounded-[2.5rem] border-4 border-foreground/10 bg-card shadow-2xl overflow-hidden">
              {/* Phone notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-foreground/10 rounded-b-2xl z-10" />
              {/* Screen content */}
              <div className="absolute inset-3 top-8 rounded-2xl bg-gradient-to-b from-primary/5 to-primary/10 flex flex-col items-center justify-center gap-4 p-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg">
                  <img src="/pwa-192x192.png" alt="App icon" className="w-full h-full object-cover" />
                </div>
                <p className="font-bold text-foreground text-center text-sm">Startup Factory Hub</p>
                <div className="space-y-2 w-full">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-8 rounded-lg bg-primary/10 w-full" />
                  ))}
                </div>
                <div className="flex gap-4 mt-auto">
                  {[Monitor, Smartphone].map((Icon, i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Glow effect */}
            <div className="absolute -z-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppDownloadSection;
