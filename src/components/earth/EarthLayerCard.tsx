import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Mountain, SunDim, CloudRain, Thermometer, Waves, Sun, Zap, Snowflake, Wind, Activity, Satellite, Leaf, Droplets, Flame, Building2, ShieldAlert, SunMedium, Gauge, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EarthDataset, EarthLayerIconType } from '@/hooks/useEarthIntelligence';

const LAYER_ICONS: Record<EarthLayerIconType, React.ReactNode> = {
  'mountain': <Mountain className="w-4 h-4 text-emerald-400" />,
  'sun-dim': <SunDim className="w-4 h-4 text-amber-400" />,
  'cloud-rain': <CloudRain className="w-4 h-4 text-sky-400" />,
  'thermometer': <Thermometer className="w-4 h-4 text-red-400" />,
  'waves': <Waves className="w-4 h-4 text-cyan-400" />,
  'sun': <Sun className="w-4 h-4 text-yellow-400" />,
  'zap': <Zap className="w-4 h-4 text-yellow-300" />,
  'snowflake': <Snowflake className="w-4 h-4 text-blue-300" />,
  'hurricane': <Wind className="w-4 h-4 text-purple-400" />,
  'activity': <Activity className="w-4 h-4 text-orange-400" />,
  'satellite': <Satellite className="w-4 h-4 text-indigo-400" />,
  'leaf': <Leaf className="w-4 h-4 text-green-400" />,
  'droplets': <Droplets className="w-4 h-4 text-blue-400" />,
  'wind': <Wind className="w-4 h-4 text-slate-400" />,
  'flame': <Flame className="w-4 h-4 text-orange-500" />,
  'building-2': <Building2 className="w-4 h-4 text-zinc-400" />,
  'shield-alert': <ShieldAlert className="w-4 h-4 text-red-500" />,
  'sun-medium': <SunMedium className="w-4 h-4 text-amber-500" />,
  'gauge': <Gauge className="w-4 h-4 text-teal-400" />,
};

interface EarthLayerCardProps {
  dataset: EarthDataset;
  onToggle: (id: string) => void;
  onOpacity: (id: string, opacity: number) => void;
  renderExtra?: (dataset: EarthDataset) => React.ReactNode;
}

export const EarthLayerCard = ({ dataset, onToggle, onOpacity, renderExtra }: EarthLayerCardProps) => {
  const [descExpanded, setDescExpanded] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent toggle when interacting with slider or read-more
    const target = e.target as HTMLElement;
    if (target.closest('[data-no-toggle]')) return;
    onToggle(dataset.id);
  };

  return (
    <div
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle(dataset.id);
        }
      }}
      className={cn(
        "relative p-2.5 rounded-xl cursor-pointer space-y-2 overflow-hidden",
        "transition-all duration-500 ease-out select-none",
        "border",
        dataset.enabled
          ? "bg-gradient-to-br from-emerald-500/25 via-cyan-500/15 to-emerald-500/25 border-emerald-400/50 shadow-[0_0_20px_-4px_rgba(16,185,129,0.5)]"
          : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
      )}
    >
      {/* Animated gradient sheen when active */}
      {dataset.enabled && (
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background: 'linear-gradient(110deg, transparent 30%, rgba(110,231,183,0.25) 50%, transparent 70%)',
            backgroundSize: '200% 100%',
            animation: 'earth-sheen 3s linear infinite',
          }}
        />
      )}
      {/* Pulsing dot indicator */}
      <div
        className={cn(
          "absolute top-2 right-2 w-2 h-2 rounded-full transition-all duration-500",
          dataset.enabled
            ? "bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.8)] animate-pulse"
            : "bg-white/20"
        )}
      />

      <div className="relative flex items-start gap-2 pr-4">
        <div className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-500",
          dataset.enabled ? "bg-white/15 scale-110" : "bg-white/5"
        )}>
          {LAYER_ICONS[dataset.icon]}
        </div>
        <div className="min-w-0 flex-1">
          <span className={cn(
            "text-sm font-medium truncate block transition-colors",
            dataset.enabled ? "text-white" : "text-white/85"
          )}>{dataset.name}</span>
          <button
            data-no-toggle
            onClick={(e) => { e.stopPropagation(); setDescExpanded(v => !v); }}
            className="text-left w-full group"
            type="button"
          >
            <p className={cn(
              "text-[11px] text-muted-foreground transition-all leading-relaxed",
              descExpanded ? "" : "line-clamp-2"
            )}>
              {dataset.description}
            </p>
            {!descExpanded && dataset.description.length > 70 && (
              <span className="text-[10px] text-cyan-400/80 group-hover:text-cyan-300 flex items-center gap-0.5 mt-0.5">
                <ChevronDown className="w-3 h-3" />
                Read more
              </span>
            )}
          </button>
        </div>
      </div>

      {dataset.enabled && (
        <div
          data-no-toggle
          onClick={(e) => e.stopPropagation()}
          className="relative flex items-center gap-3 pt-1 animate-fade-in"
        >
          <span className="text-xs text-muted-foreground w-14">Opacity</span>
          <Slider
            value={[dataset.opacity]}
            min={0}
            max={1}
            step={0.05}
            onValueChange={([val]) => onOpacity(dataset.id, val)}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-8 text-right">
            {Math.round(dataset.opacity * 100)}%
          </span>
        </div>
      )}
      {dataset.enabled && renderExtra && (
        <div data-no-toggle onClick={(e) => e.stopPropagation()} className="relative pt-1 animate-fade-in">
          {renderExtra(dataset)}
        </div>
      )}
    </div>
  );
};
