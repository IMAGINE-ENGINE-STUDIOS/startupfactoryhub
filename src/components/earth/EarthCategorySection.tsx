import { EarthLayerCard } from './EarthLayerCard';
import { EarthDataset } from '@/hooks/useEarthIntelligence';

interface EarthCategorySectionProps {
  icon: React.ReactNode;
  title: string;
  datasets: EarthDataset[];
  onToggle: (id: string) => void;
  onOpacity: (id: string, opacity: number) => void;
}

export const EarthCategorySection = ({ icon, title, datasets, onToggle, onOpacity }: EarthCategorySectionProps) => {
  if (datasets.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        {icon}
        {title}
      </h3>
      <div className="space-y-3">
        {datasets.map((dataset) => (
          <EarthLayerCard
            key={dataset.id}
            dataset={dataset}
            onToggle={onToggle}
            onOpacity={onOpacity}
          />
        ))}
      </div>
    </div>
  );
};
