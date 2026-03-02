import { useState, useCallback, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { useAuth } from '@/contexts/AuthContext';

export interface EarthLayer {
  id: string;
  name: string;
  description: string;
  tileUrl: string;
  enabled: boolean;
  opacity: number;
  icon: string;
}

const EARTH_LAYERS: EarthLayer[] = [
  {
    id: 'jaxa-aw3d30',
    name: 'JAXA AW3D30 Elevation',
    description: 'Global ~30m DEM from ALOS "Daichi" (ALOS/ALOS-2 satellites)',
    tileUrl: 'https://cyberjapandata.gsi.go.jp/xyz/dem_png/{z}/{x}/{y}.png',
    enabled: false,
    opacity: 0.6,
    icon: '🏔️',
  },
  {
    id: 'jaxa-hillshade',
    name: 'Hillshade Relief',
    description: 'Terrain hillshade from ALOS "Daichi-2" ~30m spatial resolution',
    tileUrl: 'https://cyberjapandata.gsi.go.jp/xyz/hillshademap/{z}/{x}/{y}.png',
    enabled: false,
    opacity: 0.5,
    icon: '🌄',
  },
];

const ALLOWED_EMAIL = 'ceo@imagineengine.space';

export const useEarthIntelligence = (map: mapboxgl.Map | null, mapReady: boolean) => {
  const { user } = useAuth();
  const [earthLayers, setEarthLayers] = useState<EarthLayer[]>(EARTH_LAYERS);
  const hasAccess = user?.email === ALLOWED_EMAIL;

  const addEarthLayerToMap = useCallback((layer: EarthLayer) => {
    if (!map) return;
    try {
      if (!map.getSource(layer.id)) {
        map.addSource(layer.id, {
          type: 'raster',
          tiles: [layer.tileUrl],
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
  }, [map]);

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
        // Remove stale references and re-add
        const mapLayerId = `${layer.id}-layer`;
        try {
          if (map.getLayer(mapLayerId)) map.removeLayer(mapLayerId);
          if (map.getSource(layer.id)) map.removeSource(layer.id);
        } catch {}
        addEarthLayerToMap(layer);
      }
    });
  }, [mapReady]);

  return {
    earthLayers,
    hasAccess,
    toggleEarthLayer,
    setEarthLayerOpacity,
  };
};
