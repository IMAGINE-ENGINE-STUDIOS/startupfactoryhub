import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Mountain, SunDim, CloudRain, Thermometer, Waves, Sun, Zap, Snowflake, Wind, Activity, Satellite, Leaf, Droplets, Flame, Building2, ShieldAlert, SunMedium, Gauge } from 'lucide-react';
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

export const EarthLayerCard = ({ dataset, onToggle, onOpacity }: EarthLayerCardProps) => (
  <div
    className={cn(
      "p-3 rounded-xl transition-colors space-y-2",
      dataset.enabled
        ? "bg-emerald-500/10 border border-emerald-500/30"
        : "bg-white/5"
    )}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
          {LAYER_ICONS[dataset.icon]}
        </div>
        <div className="min-w-0">
          <span className="text-sm font-medium truncate block">{dataset.name}</span>
          <p className="text-xs text-muted-foreground line-clamp-2">{dataset.description}</p>
        </div>
      </div>
      <Switch
        checked={dataset.enabled}
        onCheckedChange={() => onToggle(dataset.id)}
        className="flex-shrink-0 ml-2"
      />
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
