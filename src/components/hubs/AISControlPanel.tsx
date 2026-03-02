import { useState } from 'react';
import { Ship, ChevronDown, ChevronUp, RefreshCw, AlertTriangle, Radio, Filter, Clock, Gauge } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AISFilters, VesselTypeFilter } from '@/hooks/useAISTracking';
import { cn } from '@/lib/utils';

interface AISControlPanelProps {
  isEnabled: boolean;
  onToggle: () => void;
  isRefreshing: boolean;
  autoRefresh: boolean;
  onAutoRefreshChange: (v: boolean) => void;
  refreshInterval: number;
  onRefreshIntervalChange: (v: number) => void;
  onManualRefresh: () => void;
  vesselCount: number;
  totalCount: number;
  lastFetch: Date | null;
  error: string | null;
  filters: AISFilters;
  onFiltersChange: (f: AISFilters) => void;
}

export const AISControlPanel = ({
  isEnabled,
  onToggle,
  isRefreshing,
  autoRefresh,
  onAutoRefreshChange,
  refreshInterval,
  onRefreshIntervalChange,
  onManualRefresh,
  vesselCount,
  totalCount,
  lastFetch,
  error,
  filters,
  onFiltersChange,
}: AISControlPanelProps) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-3">
      {/* Main Toggle */}
      <div className={cn(
        "p-3 rounded-xl transition-colors",
        isEnabled ? "bg-blue-500/10 border border-blue-500/30" : "bg-white/5"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", isEnabled ? "bg-blue-500/20" : "bg-white/10")}>
              <Ship className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-medium">Live Ships (AIS)</span>
              {isEnabled && (
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-500/20 border-blue-500/50 text-blue-400">
                    {vesselCount}{totalCount !== vesselCount ? `/${totalCount}` : ''} vessels
                  </Badge>
                  {isRefreshing && (
                    <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" />
                  )}
                </div>
              )}
            </div>
          </div>
          <Switch checked={isEnabled} onCheckedChange={onToggle} />
        </div>

        {/* Error / Info */}
        {isEnabled && error && (
          <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-amber-300">{error}</p>
          </div>
        )}
      </div>

      {/* Controls when enabled */}
      {isEnabled && (
        <>
          {/* Refresh controls */}
          <div className="p-3 rounded-xl bg-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-muted-foreground" />
                <Label className="text-xs">Auto Refresh</Label>
              </div>
              <Switch checked={autoRefresh} onCheckedChange={onAutoRefreshChange} />
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <Label className="text-xs flex-1">Interval</Label>
              <Select value={String(refreshInterval)} onValueChange={(v) => onRefreshIntervalChange(Number(v))}>
                <SelectTrigger className="w-20 h-7 text-xs bg-white/5 border-white/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="60">60s</SelectItem>
                  <SelectItem value="90">90s</SelectItem>
                  <SelectItem value="120">2m</SelectItem>
                  <SelectItem value="180">3m</SelectItem>
                  <SelectItem value="300">5m</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onManualRefresh}
              disabled={isRefreshing}
              className="w-full h-7 text-xs bg-white/5 border-white/20 hover:bg-white/10"
            >
              <RefreshCw className={cn("w-3 h-3 mr-1.5", isRefreshing && "animate-spin")} />
              Refresh Now
            </Button>

            {lastFetch && (
              <p className="text-[10px] text-muted-foreground text-center">
                Last: {lastFetch.toLocaleTimeString()}
              </p>
            )}
          </div>

          {/* Filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full p-2 rounded-xl bg-white/5 flex items-center justify-between hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">Filters</span>
            </div>
            {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showFilters && (
            <div className="p-3 rounded-xl bg-white/5 space-y-3">
              {/* Vessel Type */}
              <div>
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Vessel Type</Label>
                <Select
                  value={filters.vesselType}
                  onValueChange={(v) => onFiltersChange({ ...filters, vesselType: v as VesselTypeFilter })}
                >
                  <SelectTrigger className="h-7 text-xs bg-white/5 border-white/20 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="cargo">Cargo</SelectItem>
                    <SelectItem value="tanker">Tanker</SelectItem>
                    <SelectItem value="passenger">Passenger</SelectItem>
                    <SelectItem value="fishing">Fishing</SelectItem>
                    <SelectItem value="tug">Tug / Towing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Speed Range */}
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Speed Range (kn)</Label>
                  <span className="text-[10px] text-muted-foreground">
                    {filters.minSpeed}–{filters.maxSpeed}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Gauge className="w-3 h-3 text-muted-foreground" />
                  <Slider
                    value={[filters.minSpeed, filters.maxSpeed]}
                    min={0}
                    max={50}
                    step={1}
                    onValueChange={([min, max]) => onFiltersChange({ ...filters, minSpeed: min, maxSpeed: max })}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
