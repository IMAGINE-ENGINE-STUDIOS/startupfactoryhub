import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share, Smartphone, Monitor, Apple, Chrome, Laptop, TabletSmartphone } from 'lucide-react';

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
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-24 h-24 rounded-2xl overflow-hidden shadow-lg">
            <img src="/pwa-192x192.png" alt="Startup Factory Hub" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Install Startup Factory Hub</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Get the full app experience on your device — fast, reliable, and works offline. No app store needed.
          </p>
        </div>

        {isInstalled ? (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 space-y-2 text-center">
            <Smartphone className="mx-auto h-8 w-8 text-primary" />
            <p className="text-primary font-semibold">App is already installed!</p>
            <p className="text-sm text-muted-foreground">Open it from your home screen.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Quick Install Button (Android/Chrome) */}
            {deferredPrompt && (
              <div className="text-center">
                <Button onClick={handleInstall} size="lg" className="gap-2 text-lg py-6 px-8">
                  <Download className="h-5 w-5" />
                  Install Now
                </Button>
              </div>
            )}

            {/* All platform instructions */}
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
              {/* Android */}
              <div className={`bg-card border rounded-xl p-5 space-y-4 text-left transition-all ${platform === 'android' ? 'border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20' : 'border-border'}`}>
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <TabletSmartphone className="h-4 w-4 text-green-500" />
                  </div>
                  Android
                </div>
                {platform === 'android' && (
                  <span className="inline-block text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Your device</span>
                )}
                <ol className="space-y-2.5 text-sm text-muted-foreground">
                  <li className="flex gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">1</span>
                    <span>Open in <strong>Chrome</strong></span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">2</span>
                    <span>Tap <strong>⋮ menu</strong></span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">3</span>
                    <span>Tap <strong>"Install app"</strong></span>
                  </li>
                </ol>
              </div>

              {/* iOS */}
              <div className={`bg-card border rounded-xl p-5 space-y-4 text-left transition-all ${platform === 'ios' ? 'border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20' : 'border-border'}`}>
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Apple className="h-4 w-4 text-blue-500" />
                  </div>
                  iPhone / iPad
                </div>
                {platform === 'ios' && (
                  <span className="inline-block text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Your device</span>
                )}
                <ol className="space-y-2.5 text-sm text-muted-foreground">
                  <li className="flex gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">1</span>
                    <span>Open in <strong>Safari</strong></span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">2</span>
                    <span>Tap <Share className="inline h-3.5 w-3.5 mx-0.5" /> <strong>Share</strong></span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">3</span>
                    <span><strong>"Add to Home Screen"</strong></span>
                  </li>
                </ol>
              </div>

              {/* Desktop */}
              <div className={`bg-card border rounded-xl p-5 space-y-4 text-left transition-all ${platform === 'desktop' ? 'border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20' : 'border-border'}`}>
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Laptop className="h-4 w-4 text-purple-500" />
                  </div>
                  Desktop
                </div>
                {platform === 'desktop' && (
                  <span className="inline-block text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Your device</span>
                )}
                <ol className="space-y-2.5 text-sm text-muted-foreground">
                  <li className="flex gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">1</span>
                    <span>Open in <strong>Chrome / Edge</strong></span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">2</span>
                    <span>Click <strong>⊕ install icon</strong> in address bar</span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">3</span>
                    <span>Click <strong>"Install"</strong></span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Works on Chrome, Safari, Edge, and Firefox. Install directly — no app store required.
        </p>
      </div>
    </div>
  );
};

export default InstallApp;
