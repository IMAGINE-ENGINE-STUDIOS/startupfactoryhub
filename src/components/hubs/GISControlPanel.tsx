import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Satellite, 
  Globe, 
  MapPin,
  Radio,
  Car,
  Box,
  Earth,
  Lock,
  Ship
} from 'lucide-react';
import { GISLayer } from '@/hooks/useGISLayers';
import { TrackingProvider } from '@/hooks/useExternalTracking';
import { EarthLayer } from '@/hooks/useEarthIntelligence';
import { AISFilters } from '@/hooks/useAISTracking';
import { AISControlPanel } from './AISControlPanel';
import { cn } from '@/lib/utils';

export type MapStyleType = 'default' | 'satellite' | 'satelliteStreets';

interface GISControlPanelProps {
  layers: GISLayer[];
  trackingProviders: TrackingProvider[];
  onToggleLayer: (layerId: string) => void;
  onToggleProvider: (providerId: string) => void;
  onStyleChange: (style: MapStyleType) => void;
  currentStyle: MapStyleType;
  isPolling?: boolean;
  earthLayers?: EarthLayer[];
  hasEarthAccess?: boolean;
  onToggleEarthLayer?: (layerId: string) => void;
  onEarthLayerOpacity?: (layerId: string, opacity: number) => void;
  // AIS props
  aisEnabled?: boolean;
  onAISToggle?: () => void;
  aisRefreshing?: boolean;
  aisAutoRefresh?: boolean;
  onAISAutoRefreshChange?: (v: boolean) => void;
  aisRefreshInterval?: number;
  onAISRefreshIntervalChange?: (v: number) => void;
  onAISManualRefresh?: () => void;
  aisVesselCount?: number;
  aisTotalCount?: number;
  aisLastFetch?: Date | null;
  aisError?: string | null;
  aisFilters?: AISFilters;
  onAISFiltersChange?: (f: AISFilters) => void;
}

const STYLE_OPTIONS: { value: MapStyleType; label: string; icon: React.ReactNode }[] = [
  { value: 'default', label: 'Globe', icon: <Globe className="w-4 h-4" /> },
  { value: 'satellite', label: 'Satellite', icon: <Satellite className="w-4 h-4" /> },
  { value: 'satelliteStreets', label: 'Satellite + Streets', icon: <MapPin className="w-4 h-4" /> },
];

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  'demo-vehicles': <Car className="w-4 h-4" />,
  'demo-deliveries': <Package className="w-4 h-4" />,
  'demo-drones': <Plane className="w-4 h-4" />,
};

export const GISControlPanel = ({
  layers,
  trackingProviders,
  onToggleLayer,
  onToggleProvider,
  onStyleChange,
  currentStyle,
  isPolling = false,
  earthLayers = [],
  hasEarthAccess = false,
  onToggleEarthLayer,
  onEarthLayerOpacity,
  aisEnabled = false,
  onAISToggle,
  aisRefreshing = false,
  aisAutoRefresh = true,
  onAISAutoRefreshChange,
  aisRefreshInterval = 60,
  onAISRefreshIntervalChange,
  onAISManualRefresh,
  aisVesselCount = 0,
  aisTotalCount = 0,
  aisLastFetch = null,
  aisError = null,
  aisFilters,
  onAISFiltersChange,
}: GISControlPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const enabledProviders = trackingProviders.filter(p => p.enabled).length;

  return (
    <div className={cn(
      "absolute top-20 right-4 z-30 w-72 backdrop-blur-3xl bg-white/10 dark:bg-black/20 border border-white/30 dark:border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-2xl overflow-hidden transition-all duration-300",
      !isExpanded && "w-auto"
    )}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          <span className="font-semibold">GIS Layers</span>
          {isPolling && (
            <Badge variant="outline" className="text-xs bg-green-500/20 border-green-500/50 text-green-400 animate-pulse">
              <Radio className="w-3 h-3 mr-1" />
              Live
            </Badge>
          )}
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Content */}
      {isExpanded && (
        <ScrollArea className="max-h-[400px]">
          <div className="p-4 pt-0 space-y-6">
            {/* Base Map Style */}
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                Base Map Style
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {STYLE_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={currentStyle === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onStyleChange(option.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 h-auto py-2 rounded-xl",
                      currentStyle === option.value 
                        ? "bg-primary/90" 
                        : "bg-white/5 border-white/20 hover:bg-white/10"
                    )}
                  >
                    {option.icon}
                    <span className="text-xs">{option.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Data Layers */}
            {layers.length > 0 && (
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Data Layers
                </Label>
                <div className="space-y-2">
                  {layers.map((layer) => (
                    <div
                      key={layer.id}
                      className="flex items-center justify-between p-2 bg-white/5 rounded-xl"
                    >
                      <div className="flex items-center gap-2">
                        <Box className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{layer.name}</span>
                      </div>
                      <Switch
                        checked={layer.visible}
                        onCheckedChange={() => onToggleLayer(layer.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Tracking */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Live Tracking
                </Label>
                {enabledProviders > 0 && (
                  <Badge variant="outline" className="text-xs bg-primary/20 border-primary/50">
                    {enabledProviders} active
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                {trackingProviders.map((provider) => (
                  <div
                    key={provider.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl transition-colors",
                      provider.enabled 
                        ? "bg-primary/10 border border-primary/30" 
                        : "bg-white/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        provider.enabled ? "bg-primary/20" : "bg-white/10"
                      )}>
                        {PROVIDER_ICONS[provider.id] || <Radio className="w-4 h-4" />}
                      </div>
                      <div>
                        <span className="text-sm font-medium">{provider.name}</span>
                        {provider.description && (
                          <p className="text-xs text-muted-foreground">{provider.description}</p>
                        )}
                      </div>
                    </div>
                    <Switch
                      checked={provider.enabled}
                      onCheckedChange={() => onToggleProvider(provider.id)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Earth Intelligence */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Earth className="w-3.5 h-3.5" />
                  Earth Intelligence
                </Label>
                {!hasEarthAccess && (
                  <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-400">
                    <Lock className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </div>

              {hasEarthAccess ? (
                <div className="space-y-3">
                  {earthLayers.map((layer) => (
                    <div
                      key={layer.id}
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
                          onCheckedChange={() => onToggleEarthLayer?.(layer.id)}
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
                            onValueChange={([val]) => onEarthLayerOpacity?.(layer.id, val)}
                            className="flex-1"
                          />
                          <span className="text-xs text-muted-foreground w-8 text-right">
                            {Math.round(layer.opacity * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-white/5 text-center">
                  <p className="text-xs text-muted-foreground">
                    ALOS Land Surface layers are available for premium users.
                  </p>
                </div>
              )}
            </div>

            {/* Logistics */}
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Ship className="w-3.5 h-3.5" />
                Logistics
              </Label>
              <AISControlPanel
                isEnabled={aisEnabled}
                onToggle={onAISToggle || (() => {})}
                isRefreshing={aisRefreshing}
                autoRefresh={aisAutoRefresh}
                onAutoRefreshChange={onAISAutoRefreshChange || (() => {})}
                refreshInterval={aisRefreshInterval}
                onRefreshIntervalChange={onAISRefreshIntervalChange || (() => {})}
                onManualRefresh={onAISManualRefresh || (() => {})}
                vesselCount={aisVesselCount}
                totalCount={aisTotalCount}
                lastFetch={aisLastFetch}
                error={aisError}
                filters={aisFilters || { vesselType: 'all', minSpeed: 0, maxSpeed: 50, onlyInAOI: false }}
                onFiltersChange={onAISFiltersChange || (() => {})}
              />
            </div>

            {/* Info Footer */}
            <div className="pt-2 border-t border-white/10">
              <p className="text-xs text-muted-foreground text-center">
                🧪 GIS Lab - Experimental Features
              </p>
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
