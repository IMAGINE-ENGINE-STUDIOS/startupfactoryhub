import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share, Smartphone, Monitor, Apple, Chrome } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallApp = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) {
      setPlatform('ios');
    } else if (/Android/.test(ua)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-8 text-center">
        <div className="space-y-4">
          <div className="mx-auto w-24 h-24 rounded-2xl overflow-hidden shadow-lg">
            <img src="/pwa-192x192.png" alt="Startup Factory Hub" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Install Startup Factory Hub</h1>
          <p className="text-muted-foreground">
            Get the full app experience on your device — fast, reliable, and works offline.
          </p>
        </div>

        {isInstalled ? (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 space-y-2">
            <Smartphone className="mx-auto h-8 w-8 text-primary" />
            <p className="text-primary font-semibold">App is already installed!</p>
            <p className="text-sm text-muted-foreground">Open it from your home screen.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Android / Chrome — native install prompt */}
            {deferredPrompt && (
              <Button onClick={handleInstall} size="lg" className="w-full gap-2 text-lg py-6">
                <Download className="h-5 w-5" />
                Install App
              </Button>
            )}

            {/* iOS instructions */}
            {platform === 'ios' && (
              <div className="bg-card border border-border rounded-xl p-6 space-y-4 text-left">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <Apple className="h-5 w-5" />
                  Install on iPhone / iPad
                </div>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">1</span>
                    <span>Tap the <Share className="inline h-4 w-4 mx-1" /> <strong>Share</strong> button in Safari</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">2</span>
                    <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">3</span>
                    <span>Tap <strong>"Add"</strong> to confirm</span>
                  </li>
                </ol>
              </div>
            )}

            {/* Android fallback (if no prompt) */}
            {platform === 'android' && !deferredPrompt && (
              <div className="bg-card border border-border rounded-xl p-6 space-y-4 text-left">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <Chrome className="h-5 w-5" />
                  Install on Android
                </div>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">1</span>
                    <span>Tap the <strong>⋮ menu</strong> in Chrome</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">2</span>
                    <span>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></span>
                  </li>
                </ol>
              </div>
            )}

            {/* Desktop */}
            {platform === 'desktop' && !deferredPrompt && (
              <div className="bg-card border border-border rounded-xl p-6 space-y-4 text-left">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <Monitor className="h-5 w-5" />
                  Install on Desktop
                </div>
                <p className="text-sm text-muted-foreground">
                  Look for the <strong>install icon</strong> (⊕) in your browser's address bar, or open the browser menu and select <strong>"Install Startup Factory Hub"</strong>.
                </p>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Works on Chrome, Safari, Edge, and Firefox. No app store needed.
        </p>
      </div>
    </div>
  );
};

export default InstallApp;
