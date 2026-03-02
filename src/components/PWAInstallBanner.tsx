import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallBanner = () => {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Don't show if already installed or dismissed recently
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    setShow(true);

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
      if (outcome === 'accepted') setShow(false);
      setDeferredPrompt(null);
    } else {
      navigate('/install');
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  };

  if (!show) return null;

  return (
    <div className="w-full bg-primary/10 backdrop-blur-sm border-b border-primary/20 py-1.5 px-4 flex items-center justify-center gap-3 z-50 relative">
      <button
        onClick={handleInstall}
        className="flex items-center gap-2 text-xs sm:text-sm text-primary font-medium hover:underline"
      >
        <Download className="w-3.5 h-3.5" />
        Install Startup Factory Hub App
      </button>
      <button
        onClick={handleDismiss}
        className="absolute right-3 text-muted-foreground hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default PWAInstallBanner;
