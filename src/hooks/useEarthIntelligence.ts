import { useState, useCallback, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { useAuth } from '@/contexts/AuthContext';
import { useMembershipStatus } from '@/hooks/useMembershipStatus';

export type EarthLayerIconType = 'mountain' | 'sun-dim' | 'cloud-rain' | 'thermometer' | 'waves' | 'sun';

export type EarthLayerCategory = 'land-surface' | 'precipitation' | 'temperature' | 'ocean' | 'radiation';

export type TemporalMode = 'daily' | 'monthly';
export type DayNightMode = 'day' | 'night';

export interface EarthLayer {
  id: string;
  name: string;
  description: string;
  tileUrl: string;
  enabled: boolean;
  opacity: number;
  icon: EarthLayerIconType;
  category: EarthLayerCategory;
  supportsTimeline?: boolean;
  supportsDateSelection?: boolean;
  supportsDayNight?: boolean;
  dayNightMode?: DayNightMode;
  temporalResolution?: TemporalMode;
  gibsLayerDay?: string;
  gibsLayerNight?: string;
  gibsFormat?: string;
  gibsTileMatrixSet?: string;
  maxZoom?: number;
  useWms?: boolean;
}

export interface EarthDataset {
  id: string;
  name: string;
  description: string;
  icon: EarthLayerIconType;
  category: EarthLayerCategory;
  enabled: boolean;
  opacity: number;
  // Available modes
  hasDayNight: boolean;
  hasDaily: boolean;
  hasMonthly: boolean;
  hasTimeline: boolean; // real-time precipitation
  // Underlying layer IDs for each combination
  layerIds: {
    dayMonthly?: string;
    nightMonthly?: string;
    dayDaily?: string;
    nightDaily?: string;
    realtime?: string;
    static?: string; // for layers with no temporal config
  };
}

export interface PrecipitationFrame {
  time: number;
  path: string;
}

// GIBS tile URL builder (WMTS)
const buildGibsUrl = (layer: string, date: string, tileMatrixSet = 'GoogleMapsCompatible_Level6', format = 'png') => {
  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer}/default/${date}/${tileMatrixSet}/{z}/{y}/{x}.${format}`;
};

// GIBS WMS tile URL builder (for layers that don't support GoogleMapsCompatible TileMatrixSets like CERES)
const buildGibsWmsUrl = (layer: string, date: string, format = 'image/png') => {
  return `https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=${layer}&SRS=EPSG:3857&FORMAT=${encodeURIComponent(format)}&WIDTH=256&HEIGHT=256&TRANSPARENT=true&TIME=${date}&BBOX={bbox-epsg-3857}`;
};

const STATIC_EARTH_LAYERS: EarthLayer[] = [
  // ── Land Surface ──
  {
    id: 'jaxa-aw3d30',
    name: 'ALOS Elevation (AW3D30)',
    description: 'Global ~30m DSM from ALOS "Daichi" satellite series (PRISM sensor)',
    tileUrl: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
    enabled: false,
    opacity: 0.6,
    icon: 'mountain',
    category: 'land-surface',
  },
  {
    id: 'jaxa-hillshade',
    name: 'Land Surface Hillshade',
    description: 'Global terrain relief derived from ALOS/Mapzen ~30m elevation data',
    tileUrl: 'https://tiles.openstreetmap.us/raster/hillshade/{z}/{x}/{y}.jpg',
    enabled: false,
    opacity: 0.5,
    icon: 'sun-dim',
    category: 'land-surface',
  },

  // ── Precipitation ──
  {
    id: 'gsmap-precipitation',
    name: 'GSMaP Precipitation (Real-time)',
    description: 'Real-time global radar precipitation (~10min updates)',
    tileUrl: '',
    enabled: false,
    opacity: 0.65,
    icon: 'cloud-rain',
    category: 'precipitation',
    supportsTimeline: true,
  },
  {
    id: 'gsmap-precipitation-monthly',
    name: 'GSMaP Precipitation (Monthly)',
    description: 'Monthly accumulated precipitation from GPM/GSMaP. Data available since March 2000.',
    tileUrl: '',
    enabled: false,
    opacity: 0.65,
    icon: 'cloud-rain',
    category: 'precipitation',
    supportsDateSelection: true,
    temporalResolution: 'monthly',
    gibsLayerDay: 'IMERG_Precipitation_Rate',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level6',
    maxZoom: 6,
  },

  // ── Temperature (Land) ──
  {
    id: 'lst-day-monthly',
    name: 'Land Surface Temp (Day/Monthly)',
    description: 'Monthly LST observed by GCOM-C "SHIKISAI" (~5km). Daytime ~10:30am local time.',
    tileUrl: '',
    enabled: false,
    opacity: 0.7,
    icon: 'thermometer',
    category: 'temperature',
    supportsDateSelection: true,
    temporalResolution: 'monthly',
    supportsDayNight: true,
    dayNightMode: 'day',
    gibsLayerDay: 'MODIS_Terra_Land_Surface_Temp_Day',
    gibsLayerNight: 'MODIS_Terra_Land_Surface_Temp_Night',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level7',
    maxZoom: 7,
  },
  {
    id: 'lst-day-daily',
    name: 'Land Surface Temp (Day/Daily)',
    description: 'Daily LST observed by GCOM-C "SHIKISAI" (~5km). Daytime ~10:30am local time.',
    tileUrl: '',
    enabled: false,
    opacity: 0.7,
    icon: 'thermometer',
    category: 'temperature',
    supportsDateSelection: true,
    temporalResolution: 'daily',
    supportsDayNight: true,
    dayNightMode: 'day',
    gibsLayerDay: 'MODIS_Terra_Land_Surface_Temp_Day',
    gibsLayerNight: 'MODIS_Terra_Land_Surface_Temp_Night',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level7',
    maxZoom: 7,
  },
  {
    id: 'lst-night-monthly',
    name: 'Land Surface Temp (Night/Monthly)',
    description: 'Monthly nighttime LST observed by GCOM-C "SHIKISAI" (~5km). Nighttime ~10:30pm local time.',
    tileUrl: '',
    enabled: false,
    opacity: 0.7,
    icon: 'thermometer',
    category: 'temperature',
    supportsDateSelection: true,
    temporalResolution: 'monthly',
    supportsDayNight: true,
    dayNightMode: 'night',
    gibsLayerDay: 'MODIS_Terra_Land_Surface_Temp_Day',
    gibsLayerNight: 'MODIS_Terra_Land_Surface_Temp_Night',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level7',
    maxZoom: 7,
  },
  {
    id: 'lst-night-daily',
    name: 'Land Surface Temp (Night/Daily)',
    description: 'Daily nighttime LST observed by GCOM-C "SHIKISAI" (~5km). Nighttime ~10:30pm local time.',
    tileUrl: '',
    enabled: false,
    opacity: 0.7,
    icon: 'thermometer',
    category: 'temperature',
    supportsDateSelection: true,
    temporalResolution: 'daily',
    supportsDayNight: true,
    dayNightMode: 'night',
    gibsLayerDay: 'MODIS_Terra_Land_Surface_Temp_Day',
    gibsLayerNight: 'MODIS_Terra_Land_Surface_Temp_Night',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level7',
    maxZoom: 7,
  },

  // ── Ocean (SST) ──
  {
    id: 'sst-gcomc-day-monthly',
    name: 'SST GCOM-C (Day/Monthly)',
    description: 'Sea surface temperature by GCOM-C "SHIKISAI" (~250m coastal). Daytime ~10:30am.',
    tileUrl: '',
    enabled: false,
    opacity: 0.7,
    icon: 'waves',
    category: 'ocean',
    supportsDateSelection: true,
    temporalResolution: 'monthly',
    supportsDayNight: true,
    dayNightMode: 'day',
    gibsLayerDay: 'GHRSST_L4_MUR_Sea_Surface_Temperature',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level7',
    maxZoom: 7,
  },
  {
    id: 'sst-gcomc-night-monthly',
    name: 'SST GCOM-C (Night/Monthly)',
    description: 'Sea surface temperature by GCOM-C "SHIKISAI" (~250m coastal). Nighttime ~10:30pm.',
    tileUrl: '',
    enabled: false,
    opacity: 0.7,
    icon: 'waves',
    category: 'ocean',
    supportsDateSelection: true,
    temporalResolution: 'monthly',
    supportsDayNight: true,
    dayNightMode: 'night',
    gibsLayerDay: 'GHRSST_L4_MUR_Sea_Surface_Temperature',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level7',
    maxZoom: 7,
  },
  {
    id: 'sst-gcomc-day-daily',
    name: 'SST GCOM-C (Day/Daily)',
    description: 'Daily SST by GCOM-C "SHIKISAI" (~250m coastal). Daytime ~10:30am.',
    tileUrl: '',
    enabled: false,
    opacity: 0.7,
    icon: 'waves',
    category: 'ocean',
    supportsDateSelection: true,
    temporalResolution: 'daily',
    supportsDayNight: true,
    dayNightMode: 'day',
    gibsLayerDay: 'GHRSST_L4_MUR_Sea_Surface_Temperature',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level7',
    maxZoom: 7,
  },
  {
    id: 'sst-gcomc-night-daily',
    name: 'SST GCOM-C (Night/Daily)',
    description: 'Daily SST by GCOM-C "SHIKISAI" (~250m coastal). Nighttime ~10:30pm.',
    tileUrl: '',
    enabled: false,
    opacity: 0.7,
    icon: 'waves',
    category: 'ocean',
    supportsDateSelection: true,
    temporalResolution: 'daily',
    supportsDayNight: true,
    dayNightMode: 'night',
    gibsLayerDay: 'GHRSST_L4_MUR_Sea_Surface_Temperature',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level7',
    maxZoom: 7,
  },
  {
    id: 'sst-gcomw-day-daily',
    name: 'SST GCOM-W (Day/Daily)',
    description: 'SST by GCOM-W "SHIZUKU". Observes through clouds. 5-day moving average. Daytime ~1:30pm.',
    tileUrl: '',
    enabled: false,
    opacity: 0.7,
    icon: 'waves',
    category: 'ocean',
    supportsDateSelection: true,
    temporalResolution: 'daily',
    supportsDayNight: true,
    dayNightMode: 'day',
    gibsLayerDay: 'GHRSST_L4_MUR_Sea_Surface_Temperature',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level7',
    maxZoom: 7,
  },
  {
    id: 'sst-gcomw-night-daily',
    name: 'SST GCOM-W (Night/Daily)',
    description: 'SST by GCOM-W "SHIZUKU". Observes through clouds. 5-day moving average. Nighttime ~1:30am.',
    tileUrl: '',
    enabled: false,
    opacity: 0.7,
    icon: 'waves',
    category: 'ocean',
    supportsDateSelection: true,
    temporalResolution: 'daily',
    supportsDayNight: true,
    dayNightMode: 'night',
    gibsLayerDay: 'GHRSST_L4_MUR_Sea_Surface_Temperature',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level7',
    maxZoom: 7,
  },

   // ── Radiation ──
  {
    id: 'swr-modis-monthly',
    name: 'Shortwave Radiation (Monthly)',
    description: 'Surface downwelling shortwave flux from combined satellite observations.',
    tileUrl: '',
    enabled: false,
    opacity: 0.6,
    icon: 'sun',
    category: 'radiation',
    supportsDateSelection: true,
    temporalResolution: 'monthly',
    gibsLayerDay: 'CERES_Combined_Surface_Shortwave_Flux_Down_All_Sky_Monthly',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level5',
    maxZoom: 5,
    useWms: true,
  },
];

// Dataset groups that consolidate multiple layers into single cards
const EARTH_DATASETS: EarthDataset[] = [
  // Land Surface (static, no temporal)
  {
    id: 'ds-elevation',
    name: 'ALOS Elevation (AW3D30)',
    description: 'Global ~30m DSM from ALOS "Daichi" satellite series (PRISM sensor)',
    icon: 'mountain',
    category: 'land-surface',
    enabled: false,
    opacity: 0.6,
    hasDayNight: false,
    hasDaily: false,
    hasMonthly: false,
    hasTimeline: false,
    layerIds: { static: 'jaxa-aw3d30' },
  },
  {
    id: 'ds-hillshade',
    name: 'Land Surface Hillshade',
    description: 'Global terrain relief derived from ALOS/Mapzen ~30m elevation data',
    icon: 'sun-dim',
    category: 'land-surface',
    enabled: false,
    opacity: 0.5,
    hasDayNight: false,
    hasDaily: false,
    hasMonthly: false,
    hasTimeline: false,
    layerIds: { static: 'jaxa-hillshade' },
  },
  // Precipitation
  {
    id: 'ds-precipitation',
    name: 'GSMaP Precipitation',
    description: 'Global precipitation data. Real-time radar (~10min updates) or monthly accumulated data since March 2000.',
    icon: 'cloud-rain',
    category: 'precipitation',
    enabled: false,
    opacity: 0.65,
    hasDayNight: false,
    hasDaily: false,
    hasMonthly: true,
    hasTimeline: true,
    layerIds: {
      realtime: 'gsmap-precipitation',
      dayMonthly: 'gsmap-precipitation-monthly',
    },
  },
  // Temperature
  {
    id: 'ds-lst',
    name: 'Land Surface Temperature',
    description: 'LST observed by GCOM-C "SHIKISAI" (~5km). Clouds cause data gaps. Daytime ~10:30am, nighttime ~10:30pm local time.',
    icon: 'thermometer',
    category: 'temperature',
    enabled: false,
    opacity: 0.7,
    hasDayNight: true,
    hasDaily: true,
    hasMonthly: true,
    hasTimeline: false,
    layerIds: {
      dayMonthly: 'lst-day-monthly',
      nightMonthly: 'lst-night-monthly',
      dayDaily: 'lst-day-daily',
      nightDaily: 'lst-night-daily',
    },
  },
  // Ocean SST GCOM-C
  {
    id: 'ds-sst-gcomc',
    name: 'SST (GCOM-C)',
    description: 'Sea surface temperature by GCOM-C "SHIKISAI" (~250m coastal). Cloud gaps possible. Daytime ~10:30am, nighttime ~10:30pm.',
    icon: 'waves',
    category: 'ocean',
    enabled: false,
    opacity: 0.7,
    hasDayNight: true,
    hasDaily: true,
    hasMonthly: true,
    hasTimeline: false,
    layerIds: {
      dayMonthly: 'sst-gcomc-day-monthly',
      nightMonthly: 'sst-gcomc-night-monthly',
      dayDaily: 'sst-gcomc-day-daily',
      nightDaily: 'sst-gcomc-night-daily',
    },
  },
  // Ocean SST GCOM-W (daily only)
  {
    id: 'ds-sst-gcomw',
    name: 'SST (GCOM-W)',
    description: 'SST by GCOM-W "SHIZUKU". Observes through clouds. 5-day moving average. Missing near coast. Daytime ~1:30pm, nighttime ~1:30am.',
    icon: 'waves',
    category: 'ocean',
    enabled: false,
    opacity: 0.7,
    hasDayNight: true,
    hasDaily: true,
    hasMonthly: false,
    hasTimeline: false,
    layerIds: {
      dayDaily: 'sst-gcomw-day-daily',
      nightDaily: 'sst-gcomw-night-daily',
    },
  },
  // Radiation
  {
    id: 'ds-swr',
    name: 'Shortwave Radiation',
    description: 'SWR products from Terra MODIS monthly normals, generated by JAXA EORC via JASMES.',
    icon: 'sun',
    category: 'radiation',
    enabled: false,
    opacity: 0.6,
    hasDayNight: false,
    hasDaily: false,
    hasMonthly: true,
    hasTimeline: false,
    layerIds: { dayMonthly: 'swr-modis-monthly' },
  },
];

const ALLOWED_EMAIL = 'ceo@imagineengine.space';
const EARTH_ACCESS_TIERS = ['self_paced_office', 'global_access', 'corporate'];

// Format date for GIBS URL
const formatGibsDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Resolve which underlying layer ID to use given current temporal/daynight settings
const resolveLayerId = (
  dataset: EarthDataset,
  temporalMode: TemporalMode,
  dayNightMode: DayNightMode,
  precipMode: 'realtime' | 'monthly',
): string | null => {
  // Static layers (elevation, hillshade)
  if (dataset.layerIds.static) return dataset.layerIds.static;

  // Precipitation special case
  if (dataset.hasTimeline) {
    if (precipMode === 'realtime') return dataset.layerIds.realtime || null;
    return dataset.layerIds.dayMonthly || null;
  }

  // Temporal layers
  const mode = temporalMode;
  const dn = dayNightMode;
  if (mode === 'monthly' && dataset.hasMonthly) {
    return dn === 'night' && dataset.hasDayNight
      ? dataset.layerIds.nightMonthly || dataset.layerIds.dayMonthly || null
      : dataset.layerIds.dayMonthly || null;
  }
  if (mode === 'daily' && dataset.hasDaily) {
    return dn === 'night' && dataset.hasDayNight
      ? dataset.layerIds.nightDaily || dataset.layerIds.dayDaily || null
      : dataset.layerIds.dayDaily || null;
  }
  // Fallback: try daily then monthly
  if (dataset.hasDaily) {
    return dn === 'night' ? dataset.layerIds.nightDaily || dataset.layerIds.dayDaily || null : dataset.layerIds.dayDaily || null;
  }
  if (dataset.hasMonthly) {
    return dn === 'night' ? dataset.layerIds.nightMonthly || dataset.layerIds.dayMonthly || null : dataset.layerIds.dayMonthly || null;
  }
  return null;
};

export const useEarthIntelligence = (map: mapboxgl.Map | null, mapReady: boolean) => {
  const { user } = useAuth();
  const { tier } = useMembershipStatus();
  const [earthLayers, setEarthLayers] = useState<EarthLayer[]>(STATIC_EARTH_LAYERS);
  const [datasets, setDatasets] = useState<EarthDataset[]>(EARTH_DATASETS);
  const hasAccess = user?.email === ALLOWED_EMAIL || EARTH_ACCESS_TIERS.includes(tier);

  // Global temporal controls
  const [temporalMode, setTemporalMode] = useState<TemporalMode>('monthly');
  const [dayNightMode, setDayNightMode] = useState<DayNightMode>('day');
  const [precipMode, setPrecipMode] = useState<'realtime' | 'monthly'>('realtime');

  // Global date selection for date-sensitive layers
  // Use 5 days ago for daily (GIBS data has ~2-3 day lag)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(Date.now() - 5 * 86400000));
  const [selectedMonth, setSelectedMonth] = useState<Date>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 2);
    d.setDate(1); // GIBS monthly layers require 1st of month
    return d;
  });

  // Precipitation timeline state
  const [precipFrames, setPrecipFrames] = useState<PrecipitationFrame[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rainviewerHost = useRef('https://tilecache.rainviewer.com');

  // Fetch RainViewer frames on mount
  useEffect(() => {
    const fetchFrames = async () => {
      try {
        const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        const data = await res.json();
        if (data.host) rainviewerHost.current = data.host;
        const frames: PrecipitationFrame[] = [
          ...(data.radar?.past || []),
          ...(data.radar?.nowcast || []),
        ];
        setPrecipFrames(frames);
        if (frames.length > 0) {
          const pastCount = data.radar?.past?.length || frames.length;
          setCurrentFrameIndex(Math.max(0, pastCount - 1));
        }
      } catch (err) {
        console.error('Failed to fetch precipitation frames:', err);
      }
    };
    fetchFrames();
    const interval = setInterval(fetchFrames, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Build the current tile URL for precipitation
  const getPrecipTileUrl = useCallback(() => {
    if (precipFrames.length === 0) return '';
    const frame = precipFrames[currentFrameIndex];
    if (!frame) return '';
    return `${rainviewerHost.current}${frame.path}/256/{z}/{x}/{y}/6/1_1.png`;
  }, [precipFrames, currentFrameIndex]);

  // Build tile URL for a date-sensitive GIBS layer
  const getGibsTileUrl = useCallback((layer: EarthLayer) => {
    if (!layer.gibsLayerDay) return '';
    const date = layer.temporalResolution === 'monthly'
      ? formatGibsDate(selectedMonth)
      : formatGibsDate(selectedDate);
    const gibsLayer = layer.dayNightMode === 'night' && layer.gibsLayerNight
      ? layer.gibsLayerNight
      : layer.gibsLayerDay;
    if (layer.useWms) {
      return buildGibsWmsUrl(gibsLayer, date);
    }
    return buildGibsUrl(gibsLayer, date, layer.gibsTileMatrixSet, layer.gibsFormat);
  }, [selectedDate, selectedMonth]);

  const addEarthLayerToMap = useCallback((layer: EarthLayer) => {
    if (!map) return;
    let tileUrl: string;
    if (layer.id === 'gsmap-precipitation') {
      tileUrl = getPrecipTileUrl();
    } else if (layer.supportsDateSelection && layer.gibsLayerDay) {
      tileUrl = getGibsTileUrl(layer);
    } else {
      tileUrl = layer.tileUrl;
    }
    if (!tileUrl) return;
    try {
      if (!map.getSource(layer.id)) {
        map.addSource(layer.id, {
          type: 'raster',
          tiles: [tileUrl],
          tileSize: 256,
          maxzoom: layer.maxZoom || 18,
        });
      }
      const layerId = `${layer.id}-layer`;
      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          type: 'raster',
          source: layer.id,
          paint: { 'raster-opacity': layer.opacity },
          layout: { visibility: layer.enabled ? 'visible' : 'none' },
        });
      }
    } catch (err) {
      console.error('Error adding earth layer:', err);
    }
  }, [map, getPrecipTileUrl, getGibsTileUrl]);

  // Update GIBS layers when date changes
  useEffect(() => {
    if (!map || !mapReady) return;
    earthLayers.forEach(layer => {
      if (!layer.enabled || !layer.supportsDateSelection || !layer.gibsLayerDay) return;
      const tileUrl = getGibsTileUrl(layer);
      if (!tileUrl) return;
      const sourceId = layer.id;
      const layerId = `${layer.id}-layer`;
      try {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
        map.addSource(sourceId, {
          type: 'raster',
          tiles: [tileUrl],
          tileSize: 256,
          maxzoom: layer.maxZoom || 18,
        });
        map.addLayer({
          id: layerId,
          type: 'raster',
          source: sourceId,
          paint: { 'raster-opacity': layer.opacity },
          layout: { visibility: 'visible' },
        });
      } catch (err) {
        console.error('Error updating GIBS layer:', err);
      }
    });
  }, [selectedDate, selectedMonth, mapReady]);

  // Update precipitation tiles when frame changes
  useEffect(() => {
    if (!map || !mapReady) return;
    const precipLayer = earthLayers.find(l => l.id === 'gsmap-precipitation');
    if (!precipLayer?.enabled || precipFrames.length === 0) return;
    const tileUrl = getPrecipTileUrl();
    if (!tileUrl) return;
    const sourceId = 'gsmap-precipitation';
    const layerId = 'gsmap-precipitation-layer';
    try {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
      map.addSource(sourceId, { type: 'raster', tiles: [tileUrl], tileSize: 256 });
      map.addLayer({
        id: layerId,
        type: 'raster',
        source: sourceId,
        paint: { 'raster-opacity': precipLayer.opacity },
        layout: { visibility: 'visible' },
      });
    } catch (err) {
      console.error('Error updating precipitation frame:', err);
    }
  }, [currentFrameIndex, precipFrames, mapReady]);

  // Animation playback
  useEffect(() => {
    if (isPlaying && precipFrames.length > 0) {
      playIntervalRef.current = setInterval(() => {
        setCurrentFrameIndex(prev => (prev + 1) % precipFrames.length);
      }, 700);
    } else if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, precipFrames.length]);

  // Helper: disable a specific underlying layer on the map
  const disableLayerOnMap = useCallback((layerId: string) => {
    if (!map) return;
    const mapLayerId = `${layerId}-layer`;
    try {
      if (map.getLayer(mapLayerId)) {
        map.setLayoutProperty(mapLayerId, 'visibility', 'none');
      }
    } catch {}
    setEarthLayers(prev => prev.map(l => l.id === layerId ? { ...l, enabled: false } : l));
  }, [map]);

  // Helper: enable a specific underlying layer on the map
  const enableLayerOnMap = useCallback((layerId: string, opacity: number) => {
    if (!map) return;
    const layer = earthLayers.find(l => l.id === layerId);
    if (!layer) return;
    const mapLayerId = `${layerId}-layer`;
    const updatedLayer = { ...layer, enabled: true, opacity };
    if (!map.getSource(layerId)) {
      addEarthLayerToMap(updatedLayer);
    } else if (map.getLayer(mapLayerId)) {
      map.setLayoutProperty(mapLayerId, 'visibility', 'visible');
      map.setPaintProperty(mapLayerId, 'raster-opacity', opacity);
    }
    setEarthLayers(prev => prev.map(l => l.id === layerId ? { ...l, enabled: true, opacity } : l));
  }, [map, earthLayers, addEarthLayerToMap]);

  // Get all underlying layer IDs for a dataset
  const getAllLayerIdsForDataset = useCallback((dataset: EarthDataset): string[] => {
    const ids: string[] = [];
    const li = dataset.layerIds;
    if (li.static) ids.push(li.static);
    if (li.realtime) ids.push(li.realtime);
    if (li.dayMonthly) ids.push(li.dayMonthly);
    if (li.nightMonthly) ids.push(li.nightMonthly);
    if (li.dayDaily) ids.push(li.dayDaily);
    if (li.nightDaily) ids.push(li.nightDaily);
    return ids;
  }, []);

  // Toggle a dataset on/off
  const toggleDataset = useCallback((datasetId: string) => {
    setDatasets(prev => {
      const ds = prev.find(d => d.id === datasetId);
      if (!ds) return prev;
      const newEnabled = !ds.enabled;

      if (newEnabled) {
        // Enable the correct underlying layer
        const layerId = resolveLayerId(ds, temporalMode, dayNightMode, precipMode);
        if (layerId) {
          enableLayerOnMap(layerId, ds.opacity);
        }
        // For precipitation realtime, start timeline
        if (ds.hasTimeline && precipMode === 'realtime') {
          // already handled via enableLayerOnMap
        }
      } else {
        // Disable all underlying layers for this dataset
        getAllLayerIdsForDataset(ds).forEach(id => disableLayerOnMap(id));
        if (ds.hasTimeline) setIsPlaying(false);
      }

      return prev.map(d => d.id === datasetId ? { ...d, enabled: newEnabled } : d);
    });
  }, [temporalMode, dayNightMode, precipMode, enableLayerOnMap, disableLayerOnMap, getAllLayerIdsForDataset]);

  // Set dataset opacity
  const setDatasetOpacity = useCallback((datasetId: string, opacity: number) => {
    setDatasets(prev => prev.map(d => {
      if (d.id !== datasetId) return d;
      // Update active layer opacity on map
      if (d.enabled) {
        const layerId = resolveLayerId(d, temporalMode, dayNightMode, precipMode);
        if (layerId && map) {
          const mapLayerId = `${layerId}-layer`;
          try {
            if (map.getLayer(mapLayerId)) {
              map.setPaintProperty(mapLayerId, 'raster-opacity', opacity);
            }
          } catch {}
          setEarthLayers(prev2 => prev2.map(l => l.id === layerId ? { ...l, opacity } : l));
        }
      }
      return { ...d, opacity };
    }));
  }, [map, temporalMode, dayNightMode, precipMode]);

  // When temporal mode or day/night changes, swap active layers for enabled datasets
  useEffect(() => {
    if (!map || !mapReady) return;
    datasets.forEach(ds => {
      if (!ds.enabled) return;
      // Disable all underlying layers first
      getAllLayerIdsForDataset(ds).forEach(id => disableLayerOnMap(id));
      // Enable the correct one
      const layerId = resolveLayerId(ds, temporalMode, dayNightMode, precipMode);
      if (layerId) {
        enableLayerOnMap(layerId, ds.opacity);
      }
    });
  }, [temporalMode, dayNightMode, precipMode, mapReady]);

  // Re-add layers after style change
  useEffect(() => {
    if (!map || !mapReady) return;
    earthLayers.forEach(layer => {
      if (layer.enabled) {
        const mapLayerId = `${layer.id}-layer`;
        try {
          if (map.getLayer(mapLayerId)) map.removeLayer(mapLayerId);
          if (map.getSource(layer.id)) map.removeSource(layer.id);
        } catch {}
        addEarthLayerToMap(layer);
      }
    });
  }, [mapReady]);

  // Timeline controls
  const stepFrame = useCallback((direction: 1 | -1) => {
    if (precipFrames.length === 0) return;
    setCurrentFrameIndex(prev => {
      const next = prev + direction;
      if (next < 0) return precipFrames.length - 1;
      if (next >= precipFrames.length) return 0;
      return next;
    });
  }, [precipFrames.length]);

  const togglePlayback = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const currentFrameTime = precipFrames[currentFrameIndex]?.time
    ? new Date(precipFrames[currentFrameIndex].time * 1000)
    : null;

  // Derived: which features the active datasets need
  const activeDatasets = datasets.filter(d => d.enabled);
  const hasActiveTimeline = activeDatasets.some(d => d.hasTimeline && precipMode === 'realtime');
  const hasActiveDateLayer = activeDatasets.some(d => d.hasMonthly || d.hasDaily);
  const activeHasDayNight = activeDatasets.some(d => d.hasDayNight);
  const activeHasDaily = activeDatasets.some(d => d.hasDaily);
  const activeHasMonthly = activeDatasets.some(d => d.hasMonthly);
  const activeHasTimelineOption = activeDatasets.some(d => d.hasTimeline);

  return {
    earthLayers,
    datasets,
    hasAccess,
    toggleDataset,
    setDatasetOpacity,
    // Temporal controls
    temporalMode,
    setTemporalMode,
    dayNightMode,
    setDayNightMode,
    precipMode,
    setPrecipMode,
    // Derived
    activeHasDayNight,
    activeHasDaily,
    activeHasMonthly,
    activeHasTimelineOption,
    // Precipitation timeline
    precipFrames,
    currentFrameIndex,
    setCurrentFrameIndex,
    currentFrameTime,
    isPlaying,
    togglePlayback,
    stepFrame,
    // Date selection
    selectedDate,
    setSelectedDate,
    selectedMonth,
    setSelectedMonth,
    hasActiveDateLayer,
    hasActiveTimeline,
  };
};
