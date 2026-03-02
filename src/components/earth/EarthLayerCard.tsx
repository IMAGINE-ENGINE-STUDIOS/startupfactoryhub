import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Mountain, SunDim, CloudRain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EarthLayer, EarthLayerIconType } from '@/hooks/useEarthIntelligence';

const LAYER_ICONS: Record<EarthLayerIconType, React.ReactNode> = {
  'mountain': <Mountain className="w-4 h-4 text-emerald-400" />,
  'sun-dim': <SunDim className="w-4 h-4 text-amber-400" />,
  'cloud-rain': <CloudRain className="w-4 h-4 text-sky-400" />,
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
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
          {LAYER_ICONS[layer.icon]}
        </div>
        <div>
          <span className="text-sm font-medium">{layer.name}</span>
          <p className="text-xs text-muted-foreground">{layer.description}</p>
        </div>
      </div>
      <Switch
        checked={layer.enabled}
        onCheckedChange={() => onToggle(layer.id)}
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
