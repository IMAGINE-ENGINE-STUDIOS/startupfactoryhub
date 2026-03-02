import { useState, useCallback, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { useAuth } from '@/contexts/AuthContext';

export type EarthLayerIconType = 'mountain' | 'sun-dim' | 'cloud-rain';

export interface EarthLayer {
  id: string;
  name: string;
  description: string;
  tileUrl: string;
  enabled: boolean;
  opacity: number;
  icon: EarthLayerIconType;
  category: 'land-surface' | 'precipitation';
  supportsTimeline?: boolean;
}

export interface PrecipitationFrame {
  time: number;
  path: string;
}

const STATIC_EARTH_LAYERS: EarthLayer[] = [
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
  {
    id: 'gsmap-precipitation',
    name: 'GSMaP Precipitation',
    description: 'Real-time global radar precipitation (~10min updates). Historical GSMaP data from 2000+ available via JAXA G-Portal.',
    tileUrl: '', // Dynamic — set from RainViewer API
    enabled: false,
    opacity: 0.65,
    icon: 'cloud-rain',
    category: 'precipitation',
    supportsTimeline: true,
  },
];

const ALLOWED_EMAIL = 'ceo@imagineengine.space';

export const useEarthIntelligence = (map: mapboxgl.Map | null, mapReady: boolean) => {
  const { user } = useAuth();
  const [earthLayers, setEarthLayers] = useState<EarthLayer[]>(STATIC_EARTH_LAYERS);
  const hasAccess = user?.email === ALLOWED_EMAIL;

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
          // Start on the latest past frame
          const pastCount = data.radar?.past?.length || frames.length;
          setCurrentFrameIndex(Math.max(0, pastCount - 1));
        }
      } catch (err) {
        console.error('Failed to fetch precipitation frames:', err);
      }
    };
    fetchFrames();
    // Refresh every 5 minutes
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

  const addEarthLayerToMap = useCallback((layer: EarthLayer) => {
    if (!map) return;
    const tileUrl = layer.id === 'gsmap-precipitation' ? getPrecipTileUrl() : layer.tileUrl;
    if (!tileUrl) return;
    try {
      if (!map.getSource(layer.id)) {
        map.addSource(layer.id, {
          type: 'raster',
          tiles: [tileUrl],
          tileSize: 256,
        });
      }
      const layerId = `${layer.id}-layer`;
      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          type: 'raster',
          source: layer.id,
          paint: {
            'raster-opacity': layer.opacity,
          },
          layout: {
            visibility: layer.enabled ? 'visible' : 'none',
          },
        });
      }
    } catch (err) {
      console.error('Error adding earth layer:', err);
    }
  }, [map, getPrecipTileUrl]);

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

      map.addSource(sourceId, {
        type: 'raster',
        tiles: [tileUrl],
        tileSize: 256,
      });
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

        // Stop playback if disabling precipitation
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
  };
};
