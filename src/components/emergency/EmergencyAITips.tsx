import { useState } from 'react';
import { LifeBuoy, Loader2, X, ShieldAlert, Wind, Flame, Waves, Mountain, CloudRain, Zap, CheckCircle2 } from 'lucide-react';
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

// Parse raw response into clean tip strings
const parseTips = (raw: string): string[] => {
  if (!raw) return [];
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    // strip markdown bullets, numbering, bold markers
    .map((l) => l.replace(/^[-*•·]\s*/, '').replace(/^\d+[.)]\s*/, '').replace(/\*\*/g, '').trim())
    // remove headings or meta lines
    .filter((l) => !l.startsWith('#') && l.length > 4);
  // dedupe & cap
  return Array.from(new Set(lines)).slice(0, 10);
};

export const EmergencyAITips = () => {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tips, setTips] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [activeLabel, setActiveLabel] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const t = (en: string, es: string) => (language === 'es' ? es : en);

  const fetchTips = async (disasterId: string, label: string) => {
    setActive(disasterId);
    setActiveLabel(label);
    setLoading(true);
    setError(null);
    setTips([]);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('emergency-ai-tips', {
        body: { disaster: label, language },
      });
      if (fnError) throw fnError;
      if ((data as any)?.error) throw new Error((data as any).error);
      setTips(parseTips((data as any)?.tips || ''));
    } catch (e: any) {
      setError(e.message || t('Failed to load tips', 'Error al cargar consejos'));
    } finally {
      setLoading(false);
    }
  };

  const ActiveIcon = DISASTERS.find((d) => d.id === active)?.icon ?? ShieldAlert;

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        size="icon"
        onClick={() => setOpen(!open)}
        className={cn(
          'rounded-full w-9 h-9 backdrop-blur-md border shadow-lg text-white',
          'bg-gradient-to-br from-rose-600/90 to-orange-500/90 border-white/30 hover:from-rose-500 hover:to-orange-400'
        )}
        title={t('Safety Tips', 'Consejos de Seguridad')}
      >
        <LifeBuoy className="w-4 h-4" />
      </Button>

      {open && (
        <div className="w-[320px] sm:w-[380px] max-h-[75vh] flex flex-col rounded-2xl border border-white/30 bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-gradient-to-r from-rose-600/10 to-orange-500/10">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span className="text-sm font-semibold">
                {t('Safety Tips', 'Consejos de Seguridad')}
              </span>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 border-b border-border">
            <p className="text-xs text-muted-foreground mb-2">
              {t('Choose a scenario:', 'Elige un escenario:')}
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

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('Preparing tips...', 'Preparando consejos...')}
              </div>
            )}
            {error && <p className="text-rose-500 text-xs">{error}</p>}
            {!loading && !error && tips.length === 0 && (
              <p className="text-xs text-muted-foreground">
                {t(
                  'Pick a scenario above to see safety actions. Always follow local authorities.',
                  'Elige un escenario arriba para ver acciones de seguridad. Sigue siempre a las autoridades locales.'
                )}
              </p>
            )}
            {tips.length > 0 && (
              <>
                <div className="flex items-center gap-2 px-1 pb-1">
                  <ActiveIcon className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {activeLabel}
                  </span>
                </div>
                {tips.map((tip, i) => (
                  <div
                    key={i}
                    className="group flex items-start gap-2.5 rounded-xl border border-border/60 bg-gradient-to-br from-muted/40 to-background p-3 hover:border-rose-500/40 hover:shadow-sm transition-all"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-rose-500/20 to-orange-500/20 flex items-center justify-center text-[11px] font-bold text-rose-600 dark:text-rose-300">
                      {i + 1}
                    </div>
                    <p className="text-xs leading-relaxed text-foreground flex-1">{tip}</p>
                    <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-emerald-500 transition-colors flex-shrink-0 mt-0.5" />
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
