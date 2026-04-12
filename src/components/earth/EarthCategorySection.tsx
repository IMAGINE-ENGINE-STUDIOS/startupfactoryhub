import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { EarthLayerCard } from './EarthLayerCard';
import { EarthDataset, EarthSubcategory } from '@/hooks/useEarthIntelligence';
import { cn } from '@/lib/utils';

const SUBCATEGORY_LABELS: Record<string, string> = {
  'climate-trends': 'Climate Trends',
  'precipitation-intelligence': 'Precipitation Intelligence',
  'extreme-events': 'Extreme Events',
  'climate-projections': 'Climate Projections',
  'soil-moisture': 'Soil Moisture',
  'hydrological-flow': 'Hydrological Flow',
  'flood-risk': 'Flood Risk Zones',
  'drought-indicators': 'Drought Indicators',
  'vegetation-health': 'Vegetation Health',
  'land-use-dynamics': 'Land Use Dynamics',
  'crop-suitability': 'Crop Suitability',
  'productivity-mapping': 'Productivity Mapping',
  'solar-exposure': 'Solar Exposure',
  'environmental-constraints': 'Environmental Constraints',
  'resource-optimization': 'Resource Optimization',
  'renewable-feasibility': 'Renewable Feasibility',
  'urban-expansion': 'Urban Expansion',
  'infrastructure-risk': 'Infrastructure Risk',
  'climate-risk-index': 'Climate Risk Index',
  'hazard-mapping': 'Hazard Mapping',
};

interface EarthCategorySectionProps {
  icon: React.ReactNode;
  title: string;
  datasets: EarthDataset[];
  onToggle: (id: string) => void;
  onOpacity: (id: string, opacity: number) => void;
  terraStreamEnabled?: boolean;
}

export const EarthCategorySection = ({ icon, title, datasets, onToggle, onOpacity, terraStreamEnabled = false }: EarthCategorySectionProps) => {
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set());

  // Split datasets into core (non-TerraStream) and TerraStream
  const coreDatasets = datasets.filter(d => !d.isTerraStream);
  const terraStreamDatasets = datasets.filter(d => d.isTerraStream);

  // Group TerraStream datasets by subcategory
  const subcategoryGroups = new Map<EarthSubcategory, EarthDataset[]>();
  terraStreamDatasets.forEach(d => {
    const sub = d.subcategory || null;
    if (!subcategoryGroups.has(sub)) subcategoryGroups.set(sub, []);
    subcategoryGroups.get(sub)!.push(d);
  });

  const visibleTerraStream = terraStreamEnabled ? terraStreamDatasets : [];

  if (coreDatasets.length === 0 && visibleTerraStream.length === 0) return null;

  const toggleSub = (sub: string) => {
    setExpandedSubs(prev => {
      const next = new Set(prev);
      if (next.has(sub)) next.delete(sub);
      else next.add(sub);
      return next;
    });
  };

  return (
    <div>
      <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        {icon}
        {title}
        {visibleTerraStream.length > 0 && (
          <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold tracking-wider">
            TS
          </span>
        )}
      </h3>
      <div className="space-y-3">
        {/* Core datasets */}
        {coreDatasets.map((dataset) => (
          <EarthLayerCard
            key={dataset.id}
            dataset={dataset}
            onToggle={onToggle}
            onOpacity={onOpacity}
          />
        ))}

        {/* TerraStream subcategory groups */}
        {terraStreamEnabled && Array.from(subcategoryGroups.entries()).map(([sub, subDatasets]) => {
          const subKey = sub || 'uncategorized';
          const subLabel = sub ? SUBCATEGORY_LABELS[sub] || sub : 'Other';
          const isExpanded = expandedSubs.has(subKey);
          const hasActiveLayer = subDatasets.some(d => d.enabled);

          return (
            <div key={subKey} className="rounded-lg border border-cyan-500/15 bg-cyan-500/5 overflow-hidden">
              <button
                onClick={() => toggleSub(subKey)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-cyan-500/10 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                )}
                <span className="text-xs font-medium text-cyan-300">{subLabel}</span>
                {hasActiveLayer && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </button>
              {isExpanded && (
                <div className="px-2 pb-2 space-y-2">
                  {subDatasets.map((dataset) => (
                    <EarthLayerCard
                      key={dataset.id}
                      dataset={dataset}
                      onToggle={onToggle}
                      onOpacity={onOpacity}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
