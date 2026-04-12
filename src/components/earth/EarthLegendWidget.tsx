import { useState } from 'react';
import { ChevronDown, ChevronUp, Info, Mountain, CloudRain, Thermometer, Waves, Sun, SunDim, Zap, Snowflake, Wind, Activity, Satellite, Leaf, Droplets, Flame, Building2, ShieldAlert, SunMedium, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EarthDataset, EarthLayerCategory, EarthLayerIconType } from '@/hooks/useEarthIntelligence';
import { motion, AnimatePresence } from 'framer-motion';

interface EarthLegendWidgetProps {
  activeDatasets: EarthDataset[];
}

const CATEGORY_META: Record<EarthLayerCategory, { label: string; color: string; gradient: string }> = {
  'land-surface': { label: 'Land Surface', color: 'text-emerald-400', gradient: 'from-emerald-500/20 to-emerald-500/5' },
  'precipitation': { label: 'Precipitation', color: 'text-sky-400', gradient: 'from-sky-500/20 to-sky-500/5' },
  'temperature': { label: 'Temperature', color: 'text-red-400', gradient: 'from-red-500/20 to-red-500/5' },
  'ocean': { label: 'Ocean', color: 'text-cyan-400', gradient: 'from-cyan-500/20 to-cyan-500/5' },
  'weather': { label: 'Severe Weather', color: 'text-purple-400', gradient: 'from-purple-500/20 to-purple-500/5' },
  'seismic': { label: 'Seismic Activity', color: 'text-orange-400', gradient: 'from-orange-500/20 to-orange-500/5' },
  'satellite-imagery': { label: 'Satellite Imagery', color: 'text-indigo-400', gradient: 'from-indigo-500/20 to-indigo-500/5' },
  'energy': { label: 'Energy & Resources', color: 'text-amber-400', gradient: 'from-amber-500/20 to-amber-500/5' },
  'risk': { label: 'Built Environment & Risk', color: 'text-rose-400', gradient: 'from-rose-500/20 to-rose-500/5' },
};

const ICON_MAP: Record<EarthLayerIconType, React.ReactNode> = {
  'mountain': <Mountain className="w-4 h-4" />,
  'sun-dim': <SunDim className="w-4 h-4" />,
  'cloud-rain': <CloudRain className="w-4 h-4" />,
  'thermometer': <Thermometer className="w-4 h-4" />,
  'waves': <Waves className="w-4 h-4" />,
  'sun': <Sun className="w-4 h-4" />,
  'zap': <Zap className="w-4 h-4" />,
  'snowflake': <Snowflake className="w-4 h-4" />,
  'hurricane': <Wind className="w-4 h-4" />,
  'activity': <Activity className="w-4 h-4" />,
  'satellite': <Satellite className="w-4 h-4" />,
  'leaf': <Leaf className="w-4 h-4" />,
  'droplets': <Droplets className="w-4 h-4" />,
  'wind': <Wind className="w-4 h-4" />,
  'flame': <Flame className="w-4 h-4" />,
  'building-2': <Building2 className="w-4 h-4" />,
  'shield-alert': <ShieldAlert className="w-4 h-4" />,
  'sun-medium': <SunMedium className="w-4 h-4" />,
  'gauge': <Gauge className="w-4 h-4" />,
};

// Legend scales for each dataset type
const LEGEND_SCALES: Record<string, { label: string; colors: string[]; labels: string[]; unit: string; description: string }> = {
  'ds-elevation': {
    label: 'Elevation',
    colors: ['#006837', '#1a9850', '#66bd63', '#a6d96a', '#d9ef8b', '#fee08b', '#fdae61', '#f46d43', '#d73027', '#a50026'],
    labels: ['0m', '200m', '500m', '1000m', '2000m', '3000m', '4000m', '5000m', '6000m', '8000m+'],
    unit: 'meters',
    description: 'Digital Surface Model from ALOS PRISM sensor at ~30m resolution. Shows terrain elevation including buildings and vegetation canopy.',
  },
  'ds-hillshade': {
    label: 'Hillshade',
    colors: ['#1a1a1a', '#4d4d4d', '#808080', '#b3b3b3', '#e6e6e6', '#ffffff'],
    labels: ['Shadow', '', '', '', '', 'Light'],
    unit: 'illumination',
    description: 'Terrain relief visualization derived from elevation data. Simulates sunlight casting shadows across the landscape to reveal topographic features.',
  },
  'ds-precipitation': {
    label: 'Precipitation Rate',
    colors: ['#a0f0a0', '#00c800', '#ffff00', '#ffc800', '#ff6400', '#ff0000', '#c80000', '#960064', '#c800c8'],
    labels: ['0.5', '2', '5', '10', '20', '30', '50', '80', '100+'],
    unit: 'mm/hr',
    description: 'Global precipitation measured by the GPM (Global Precipitation Measurement) constellation. Real-time mode updates every ~10 minutes. Monthly mode shows accumulated averages.',
  },
  'ds-lst': {
    label: 'Land Surface Temperature',
    colors: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'],
    labels: ['-25°C', '-15°C', '-5°C', '5°C', '15°C', '25°C', '30°C', '35°C', '40°C', '50°C+'],
    unit: '°C',
    description: 'Land surface temperature measured by MODIS on NASA\'s Terra satellite at ~1km resolution. Day observations at ~10:30am local time, night at ~10:30pm. Cloud cover causes data gaps.',
  },
  'ds-sst-gcomc': {
    label: 'Sea Surface Temperature',
    colors: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'],
    labels: ['-2°C', '2°C', '8°C', '14°C', '18°C', '22°C', '26°C', '28°C', '30°C', '32°C+'],
    unit: '°C',
    description: 'High-resolution sea surface temperature from the MUR (Multi-scale Ultra-high Resolution) analysis. ~250m resolution in coastal areas. Cloud cover may cause gaps in visible imagery.',
  },
  'ds-sst-gcomw': {
    label: 'Sea Surface Temperature',
    colors: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'],
    labels: ['-2°C', '2°C', '8°C', '14°C', '18°C', '22°C', '26°C', '28°C', '30°C', '32°C+'],
    unit: '°C',
    description: 'SST from GCOM-W "SHIZUKU" microwave radiometer. Penetrates cloud cover for all-weather observation. Uses 5-day moving average. Lower resolution than optical sensors, data may be missing near coastlines.',
  },
  'ds-snow-radar': {
    label: 'Snow Radar',
    colors: ['#e0f2fe', '#7dd3fc', '#38bdf8', '#0284c7', '#1e3a5f'],
    labels: ['Light', '', 'Moderate', '', 'Heavy'],
    unit: 'intensity',
    description: 'Real-time snow and mixed precipitation radar from global weather radar network. Color scheme optimized for frozen precipitation detection.',
  },
  'ds-lightning': {
    label: 'Lightning Strikes',
    colors: ['#fef9c3', '#fde047', '#facc15', '#eab308', '#ca8a04'],
    labels: ['Recent', '', '', '', '20min ago'],
    unit: 'time',
    description: 'Real-time lightning strike locations detected by the Blitzortung global sensor network.',
  },
  'ds-earthquakes': {
    label: 'Earthquake Magnitude',
    colors: ['#fde047', '#fb923c', '#ef4444', '#dc2626', '#7f1d1d'],
    labels: ['M2.5', 'M4', 'M5.5', 'M7', 'M9+'],
    unit: 'magnitude',
    description: 'Real-time seismic activity from USGS. Circle size and color scale with earthquake magnitude. Shows all M2.5+ events from the past 24 hours.',
  },
};

export const EarthLegendWidget = ({ activeDatasets }: EarthLegendWidgetProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (activeDatasets.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="absolute bottom-16 left-4 z-30 w-72 max-h-[50vh] backdrop-blur-3xl bg-white/10 dark:bg-black/30 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Layer Legend</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
              {activeDatasets.length}
            </span>
          </div>
          {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
        </button>

        {/* Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3 max-h-[40vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                {activeDatasets.map((dataset) => {
                  const legend = LEGEND_SCALES[dataset.id];
                  const catMeta = CATEGORY_META[dataset.category];

                  return (
                    <motion.div
                      key={dataset.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "rounded-xl border border-white/10 overflow-hidden",
                        "bg-gradient-to-b",
                        catMeta.gradient,
                      )}
                    >
                      {/* Dataset header */}
                      <div className="px-3 py-2 flex items-center gap-2">
                        <span className={catMeta.color}>
                          {ICON_MAP[dataset.icon]}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{dataset.name}</p>
                          <p className={cn("text-[10px]", catMeta.color)}>{catMeta.label}</p>
                        </div>
                      </div>

                      {/* Color scale */}
                      {legend && (
                        <div className="px-3 pb-2.5 space-y-1.5">
                          {/* Gradient bar */}
                          <div
                            className="h-3 rounded-md w-full"
                            style={{
                              background: `linear-gradient(to right, ${legend.colors.join(', ')})`,
                            }}
                          />
                          {/* Labels */}
                          <div className="flex justify-between">
                            <span className="text-[9px] text-muted-foreground">{legend.labels[0]}</span>
                            <span className="text-[9px] text-muted-foreground">{legend.unit}</span>
                            <span className="text-[9px] text-muted-foreground">{legend.labels[legend.labels.length - 1]}</span>
                          </div>
                          {/* Description */}
                          <p className="text-[10px] text-muted-foreground/80 leading-tight">
                            {legend.description}
                          </p>
                        </div>
                      )}

                      {/* Fallback if no legend scale */}
                      {!legend && (
                        <div className="px-3 pb-2.5">
                          <p className="text-[10px] text-muted-foreground/80 leading-tight">
                            {dataset.description}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};
