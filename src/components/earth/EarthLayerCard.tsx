import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Mountain, SunDim, CloudRain, Thermometer, Waves, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EarthLayer, EarthLayerIconType } from '@/hooks/useEarthIntelligence';
import { Badge } from '@/components/ui/badge';

const LAYER_ICONS: Record<EarthLayerIconType, React.ReactNode> = {
  'mountain': <Mountain className="w-4 h-4 text-emerald-400" />,
  'sun-dim': <SunDim className="w-4 h-4 text-amber-400" />,
  'cloud-rain': <CloudRain className="w-4 h-4 text-sky-400" />,
  'thermometer': <Thermometer className="w-4 h-4 text-red-400" />,
  'waves': <Waves className="w-4 h-4 text-cyan-400" />,
  'sun': <Sun className="w-4 h-4 text-yellow-400" />,
};

interface EarthLayerCardProps {
  layer: EarthLayer;
  onToggle: (id: string) => void;
  onOpacity: (id: string, opacity: number) => void;
}

export const EarthLayerCard = ({ layer, onToggle, onOpacity }: EarthLayerCardProps) => (
  <div
    className={cn(
      "p-3 rounded-xl transition-colors space-y-2",
      layer.enabled
        ? "bg-emerald-500/10 border border-emerald-500/30"
        : "bg-white/5"
    )}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
          {LAYER_ICONS[layer.icon]}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium truncate">{layer.name}</span>
            {layer.dayNightMode && (
              <Badge variant="outline" className={cn(
                "text-[9px] px-1 py-0 flex-shrink-0",
                layer.dayNightMode === 'day'
                  ? "border-amber-500/50 text-amber-400"
                  : "border-indigo-500/50 text-indigo-400"
              )}>
                {layer.dayNightMode === 'day' ? '☀ Day' : '🌙 Night'}
              </Badge>
            )}
            {layer.temporalResolution && (
              <Badge variant="outline" className="text-[9px] px-1 py-0 border-white/20 text-muted-foreground flex-shrink-0">
                {layer.temporalResolution === 'monthly' ? 'Monthly' : 'Daily'}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{layer.description}</p>
        </div>
      </div>
      <Switch
        checked={layer.enabled}
        onCheckedChange={() => onToggle(layer.id)}
        className="flex-shrink-0 ml-2"
      />
    </div>
    {layer.enabled && (
      <div className="flex items-center gap-3 pt-1">
        <span className="text-xs text-muted-foreground w-14">Opacity</span>
        <Slider
          value={[layer.opacity]}
          min={0}
          max={1}
          step={0.05}
          onValueChange={([val]) => onOpacity(layer.id, val)}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground w-8 text-right">
          {Math.round(layer.opacity * 100)}%
        </span>
      </div>
    )}
  </div>
);
