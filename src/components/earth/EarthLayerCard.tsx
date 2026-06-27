import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
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
}

export const EarthLayerCard = ({ dataset, onToggle, onOpacity }: EarthLayerCardProps) => {
  const [descExpanded, setDescExpanded] = useState(false);

  return (
    <div
      className={cn(
        "p-2.5 rounded-xl transition-colors space-y-2",
        dataset.enabled
          ? "bg-emerald-500/10 border border-emerald-500/30"
          : "bg-white/5"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
            {LAYER_ICONS[dataset.icon]}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-sm font-medium truncate block">{dataset.name}</span>
            <button
              onClick={() => setDescExpanded(v => !v)}
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
        <div className="flex-shrink-0 relative p-1 -m-1 mt-0.5">
          <Switch
            checked={dataset.enabled}
            onCheckedChange={() => onToggle(dataset.id)}
            className="data-[state=unchecked]:bg-white/30 dark:data-[state=unchecked]:bg-white/25"
          />
        </div>
      </div>
      {dataset.enabled && (
        <div className="flex items-center gap-3 pt-1">
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
    </div>
  );
};
