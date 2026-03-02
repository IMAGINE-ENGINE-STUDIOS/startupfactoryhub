import { useState, useCallback, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { useAuth } from '@/contexts/AuthContext';

export type EarthLayerIconType = 'mountain' | 'sun-dim' | 'cloud-rain' | 'thermometer' | 'waves' | 'sun';

export type EarthLayerCategory = 'land-surface' | 'precipitation' | 'temperature' | 'ocean' | 'radiation';

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
  dayNightMode?: 'day' | 'night';
  temporalResolution?: 'monthly' | 'daily';
  gibsLayerDay?: string;
  gibsLayerNight?: string;
  gibsFormat?: string;
  gibsTileMatrixSet?: string;
  maxZoom?: number;
}

export interface PrecipitationFrame {
  time: number;
  path: string;
}

// GIBS tile URL builder
const buildGibsUrl = (layer: string, date: string, tileMatrixSet = 'GoogleMapsCompatible_Level6', format = 'png') => {
  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer}/default/${date}/${tileMatrixSet}/{z}/{y}/{x}.${format}`;
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
    description: 'Monthly LST observed by GCOM-C "SHIKISAI" (~5km). Daytime ~10:30am local time. Clouds cause data gaps.',
    tileUrl: '',
    enabled: false,
    opacity: 0.7,
    icon: 'thermometer',
    category: 'temperature',
    supportsDateSelection: true,
    temporalResolution: 'monthly',
    supportsDayNight: true,
    dayNightMode: 'day',
    gibsLayerDay: 'MODIS_Terra_Land_Surface_Temp_Day_TileMatrixSet',
    gibsLayerNight: 'MODIS_Terra_Land_Surface_Temp_Night_TileMatrixSet',
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
    gibsLayerDay: 'MODIS_Terra_Land_Surface_Temp_Day_TileMatrixSet',
    gibsLayerNight: 'MODIS_Terra_Land_Surface_Temp_Night_TileMatrixSet',
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
    gibsLayerDay: 'MODIS_Terra_Land_Surface_Temp_Day_TileMatrixSet',
    gibsLayerNight: 'MODIS_Terra_Land_Surface_Temp_Night_TileMatrixSet',
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
    gibsLayerDay: 'MODIS_Terra_Land_Surface_Temp_Day_TileMatrixSet',
    gibsLayerNight: 'MODIS_Terra_Land_Surface_Temp_Night_TileMatrixSet',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level7',
    maxZoom: 7,
  },

  // ── Ocean (SST) ──
  {
    id: 'sst-gcomc-day-monthly',
    name: 'SST GCOM-C (Day/Monthly)',
    description: 'Sea surface temperature by GCOM-C "SHIKISAI" (~250m coastal). Daytime ~10:30am. Cloud gaps possible.',
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
    description: 'SST by GCOM-W "SHIZUKU". Observes through clouds. 5-day moving average. Daytime ~1:30pm. Missing near coast.',
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
    description: 'SWR products from Terra MODIS monthly normals, generated by JAXA EORC via JASMES.',
    tileUrl: '',
    enabled: false,
    opacity: 0.6,
    icon: 'sun',
    category: 'radiation',
    supportsDateSelection: true,
    temporalResolution: 'monthly',
    gibsLayerDay: 'CERES_EBAF_Surface_Shortwave_Down_All_Monthly',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level3',
    maxZoom: 3,
  },
];

const ALLOWED_EMAIL = 'ceo@imagineengine.space';

// Format date for GIBS URL
const formatGibsDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const useEarthIntelligence = (map: mapboxgl.Map | null, mapReady: boolean) => {
  const { user } = useAuth();
  const [earthLayers, setEarthLayers] = useState<EarthLayer[]>(STATIC_EARTH_LAYERS);
  const hasAccess = user?.email === ALLOWED_EMAIL;

  // Global date selection for date-sensitive layers
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(Date.now() - 86400000)); // yesterday
  const [selectedMonth, setSelectedMonth] = useState<Date>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
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

  const toggleEarthLayer = useCallback((layerId: string) => {
    if (!map) return;
    setEarthLayers(prev =>
      prev.map(l => {
        if (l.id !== layerId) return l;
        const newEnabled = !l.enabled;
        const mapLayerId = `${l.id}-layer`;
        if (newEnabled && !map.getSource(l.id)) {
          addEarthLayerToMap({ ...l, enabled: true });
        } else if (map.getLayer(mapLayerId)) {
          map.setLayoutProperty(mapLayerId, 'visibility', newEnabled ? 'visible' : 'none');
        }
        if (l.id === 'gsmap-precipitation' && !newEnabled) {
          setIsPlaying(false);
        }
        return { ...l, enabled: newEnabled };
      })
    );
  }, [map, addEarthLayerToMap]);

  const setEarthLayerOpacity = useCallback((layerId: string, opacity: number) => {
    if (!map) return;
    const mapLayerId = `${layerId}-layer`;
    try {
      if (map.getLayer(mapLayerId)) {
        map.setPaintProperty(mapLayerId, 'raster-opacity', opacity);
      }
    } catch (err) {
      console.error('Error setting earth layer opacity:', err);
    }
    setEarthLayers(prev =>
      prev.map(l => (l.id === layerId ? { ...l, opacity } : l))
    );
  }, [map]);

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

  // Check if any date-sensitive layer is active
  const hasActiveDateLayer = earthLayers.some(l => l.enabled && l.supportsDateSelection);
  const hasActiveTimeline = earthLayers.some(l => l.id === 'gsmap-precipitation' && l.enabled);

  return {
    earthLayers,
    hasAccess,
    toggleEarthLayer,
    setEarthLayerOpacity,
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
