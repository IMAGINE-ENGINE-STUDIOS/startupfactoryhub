import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { EarthLayer } from '@/hooks/useEarthIntelligence';

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
        <span className="text-base">{layer.icon}</span>
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
