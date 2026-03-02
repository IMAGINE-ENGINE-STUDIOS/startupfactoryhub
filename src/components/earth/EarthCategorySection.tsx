import { EarthLayerCard } from './EarthLayerCard';
import { EarthLayer } from '@/hooks/useEarthIntelligence';

interface EarthCategorySectionProps {
  icon: React.ReactNode;
  title: string;
  layers: EarthLayer[];
  onToggle: (id: string) => void;
  onOpacity: (id: string, opacity: number) => void;
}

export const EarthCategorySection = ({ icon, title, layers, onToggle, onOpacity }: EarthCategorySectionProps) => {
  if (layers.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        {icon}
        {title}
      </h3>
      <div className="space-y-3">
        {layers.map((layer) => (
          <EarthLayerCard
            key={layer.id}
            layer={layer}
            onToggle={onToggle}
            onOpacity={onOpacity}
          />
        ))}
      </div>
    </div>
  );
};
