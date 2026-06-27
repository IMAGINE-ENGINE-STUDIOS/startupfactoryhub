import { useState } from 'react';
import { Brain, Loader2, X, AlertTriangle, Wind, Flame, Waves, Mountain, CloudRain, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

const DISASTERS = [
  { id: 'earthquake', icon: Mountain, en: 'Earthquake', es: 'Terremoto' },
  { id: 'hurricane', icon: Wind, en: 'Hurricane', es: 'Huracán' },
  { id: 'flood', icon: Waves, en: 'Flood', es: 'Inundación' },
  { id: 'wildfire', icon: Flame, en: 'Wildfire', es: 'Incendio' },
  { id: 'storm', icon: CloudRain, en: 'Severe Storm', es: 'Tormenta' },
  { id: 'tsunami', icon: Waves, en: 'Tsunami', es: 'Tsunami' },
  { id: 'landslide', icon: Mountain, en: 'Landslide', es: 'Deslizamiento' },
  { id: 'power', icon: Zap, en: 'Power Outage', es: 'Apagón' },
];

export const EmergencyAITips = () => {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tips, setTips] = useState<string>('');
  const [active, setActive] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const t = (en: string, es: string) => (language === 'es' ? es : en);

  const fetchTips = async (disasterId: string, label: string) => {
    setActive(disasterId);
    setLoading(true);
    setError(null);
    setTips('');
    try {
      const { data, error: fnError } = await supabase.functions.invoke('emergency-ai-tips', {
        body: { disaster: label, language },
      });
      if (fnError) throw fnError;
      if ((data as any)?.error) throw new Error((data as any).error);
      setTips((data as any)?.tips || '');
    } catch (e: any) {
      setError(e.message || t('Failed to load tips', 'Error al cargar consejos'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        size="sm"
        onClick={() => setOpen(!open)}
        className={cn(
          'rounded-full backdrop-blur-md border shadow-lg gap-2 text-white',
          'bg-gradient-to-r from-rose-600/90 to-orange-500/90 border-white/30 hover:from-rose-500 hover:to-orange-400'
        )}
        title={t('AI Emergency Tips', 'Consejos IA de Emergencia')}
      >
        <Sparkles className="w-4 h-4" />
        <span className="hidden sm:inline">{t('AI Tips', 'Consejos IA')}</span>
      </Button>

      {open && (
        <div className="w-[320px] sm:w-[360px] max-h-[70vh] flex flex-col rounded-2xl border border-white/30 bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-gradient-to-r from-rose-600/10 to-orange-500/10">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span className="text-sm font-semibold">
                {t('Disaster Response AI', 'IA de Respuesta a Desastres')}
              </span>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 border-b border-border">
            <p className="text-xs text-muted-foreground mb-2">
              {t('Pick a disaster for instant safety tips:', 'Elige un desastre para consejos:')}
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {DISASTERS.map((d) => {
                const Icon = d.icon;
                const label = language === 'es' ? d.es : d.en;
                const isActive = active === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => fetchTips(d.id, label)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2 rounded-lg border text-[10px] transition-all',
                      isActive
                        ? 'bg-rose-500/20 border-rose-500/60 text-rose-600 dark:text-rose-300'
                        : 'bg-muted/40 border-border hover:bg-muted'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="leading-tight text-center">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 text-sm">
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('Generating tips...', 'Generando consejos...')}
              </div>
            )}
            {error && <p className="text-rose-500 text-xs">{error}</p>}
            {!loading && !error && !tips && (
              <p className="text-xs text-muted-foreground">
                {t(
                  'Tap any disaster above. Tips are AI-generated for guidance only — always follow local authorities.',
                  'Toca un desastre arriba. Los consejos son generados por IA solo como guía — sigue siempre a las autoridades locales.'
                )}
              </p>
            )}
            {tips && (
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-foreground">
                {tips}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
