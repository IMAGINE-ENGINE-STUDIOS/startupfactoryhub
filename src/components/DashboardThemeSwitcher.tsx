import { useEffect, useState } from 'react';
import { Check, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Futuristic color theme presets for the dashboard.
 * Each preset overrides --primary, --accent and a couple of glow tokens
 * directly on a scoped root element so the toolbar + cards swap instantly.
 */
export type DashboardThemeId = 'cyan' | 'magenta' | 'ocean';

interface ThemeDef {
  id: DashboardThemeId;
  label: string;
  // HSL triplets (no hsl() wrapper) so they slot straight into CSS vars
  primary: string;
  accent: string;
  glow: string;          // rgba for box-shadow glows
  ring: string;          // hex/rgba for swatch ring
  swatch: [string, string]; // gradient for the picker chip
}

const THEMES: ThemeDef[] = [
  {
    id: 'cyan',
    label: 'Cyan Pulse',
    primary: '189 94% 55%',
    accent:  '199 89% 60%',
    glow:    'rgba(34,211,238,0.45)',
    ring:    '#22d3ee',
    swatch:  ['#22d3ee', '#3b82f6'],
  },
  {
    id: 'magenta',
    label: 'Magenta Flux',
    primary: '320 90% 60%',
    accent:  '280 88% 65%',
    glow:    'rgba(232,121,249,0.45)',
    ring:    '#e879f9',
    swatch:  ['#e879f9', '#a855f7'],
  },
  {
    id: 'ocean',
    label: 'Ocean Green',
    primary: '168 76% 45%',
    accent:  '190 85% 50%',
    glow:    'rgba(20,184,166,0.45)',
    ring:    '#14b8a6',
    swatch:  ['#14b8a6', '#0ea5b7'],
  },
];

const STORAGE_KEY = 'dashboard.theme';

export const applyDashboardTheme = (id: DashboardThemeId) => {
  const theme = THEMES.find(t => t.id === id) ?? THEMES[0];
  const scope = document.documentElement;
  scope.style.setProperty('--primary', theme.primary);
  scope.style.setProperty('--accent', theme.accent);
  scope.style.setProperty('--ring', theme.primary);
  scope.style.setProperty('--dashboard-glow', theme.glow);
  scope.setAttribute('data-dashboard-theme', id);
};

export const DashboardThemeSwitcher = () => {
  const [active, setActive] = useState<DashboardThemeId>(() => {
    if (typeof window === 'undefined') return 'cyan';
    return (localStorage.getItem(STORAGE_KEY) as DashboardThemeId) || 'cyan';
  });

  useEffect(() => {
    applyDashboardTheme(active);
    localStorage.setItem(STORAGE_KEY, active);
  }, [active]);

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.06] backdrop-blur-xl border border-white/15 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      <Palette className="h-3.5 w-3.5 text-white/60" strokeWidth={1.5} />
      <span className="text-[10px] uppercase tracking-[0.18em] text-white/50 hidden sm:inline">
        Theme
      </span>
      <div className="flex items-center gap-1.5">
        {THEMES.map(t => {
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActive(t.id)}
              aria-label={t.label}
              title={t.label}
              className={cn(
                'relative h-6 w-6 rounded-full transition-all duration-300',
                'border border-white/20 hover:scale-110',
                isActive && 'scale-110 ring-2 ring-offset-2 ring-offset-transparent'
              )}
              style={{
                background: `linear-gradient(135deg, ${t.swatch[0]}, ${t.swatch[1]})`,
                boxShadow: isActive
                  ? `0 0 14px ${t.ring}, 0 0 28px ${t.ring}80`
                  : `0 0 6px ${t.ring}55`,
                ['--tw-ring-color' as any]: t.ring,
              }}
            >
              {isActive && (
                <Check className="absolute inset-0 m-auto h-3 w-3 text-white drop-shadow" strokeWidth={3} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardThemeSwitcher;
