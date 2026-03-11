import { useEffect, useRef, useCallback } from 'react';
import { findDigitalTwinCity, DigitalTwinCity } from '@/config/digitalTwinCities';

/**
 * Integrates Google Photorealistic 3D Tiles into the Mapbox map
 * when the viewport enters a digital twin city bbox at sufficient zoom.
 * 
 * Falls back gracefully if no Google API key is configured.
 */
export const useDigitalTwinBuildings = (
  map: mapboxgl.Map | null,
  mapReady: boolean,
  show3DBuildings: boolean
) => {
  const currentCityRef = useRef<DigitalTwinCity | null>(null);
  const googleLayerActiveRef = useRef(false);

  const getGoogleApiKey = useCallback((): string | null => {
    return import.meta.env.VITE_GOOGLE_MAPS_API_KEY || null;
  }, []);

  const addGoogle3DTiles = useCallback((m: mapboxgl.Map, apiKey: string) => {
    if (googleLayerActiveRef.current) return;
    
    try {
      // Hide generic buildings when Google tiles are active
      if (m.getLayer('3d-buildings')) {
        m.setLayoutProperty('3d-buildings', 'visibility', 'none');
      }

      // Add Google 3D Tiles as a custom source
      // Mapbox GL JS v3 supports 3D model tiles via addSource with type 'batched-model'
      if (!m.getSource('google-3d-tiles')) {
        (m as any).addSource('google-3d-tiles', {
          type: 'batched-model',
          maxzoom: 14,
          url: `https://tile.googleapis.com/v1/3dtiles/root.json?key=${apiKey}`,
        });
      }

      if (!m.getLayer('google-3d-tiles-layer')) {
        (m as any).addLayer({
          id: 'google-3d-tiles-layer',
          type: 'model',
          source: 'google-3d-tiles',
          minzoom: 13,
        });
      }

      googleLayerActiveRef.current = true;
    } catch (err) {
      console.warn('Google 3D Tiles not supported in this Mapbox version:', err);
    }
  }, []);

  const removeGoogle3DTiles = useCallback((m: mapboxgl.Map) => {
    if (!googleLayerActiveRef.current) return;

    try {
      if (m.getLayer('google-3d-tiles-layer')) {
        m.removeLayer('google-3d-tiles-layer');
      }
      if (m.getSource('google-3d-tiles')) {
        m.removeSource('google-3d-tiles');
      }
    } catch {
      // ignore cleanup errors
    }

    // Restore generic buildings
    if (m.getLayer('3d-buildings') && show3DBuildings) {
      m.setLayoutProperty('3d-buildings', 'visibility', 'visible');
    }

    googleLayerActiveRef.current = false;
  }, [show3DBuildings]);

  useEffect(() => {
    if (!map || !mapReady) return;

    const apiKey = getGoogleApiKey();
    if (!apiKey) return; // No Google API key — skip entirely

    const checkViewport = () => {
      if (!map) return;
      const center = map.getCenter();
      const zoom = map.getZoom();
      const city = findDigitalTwinCity(center.lng, center.lat);

      if (city && zoom >= 13 && show3DBuildings) {
        if (currentCityRef.current?.id !== city.id || !googleLayerActiveRef.current) {
          currentCityRef.current = city;
          addGoogle3DTiles(map, apiKey);
        }
      } else {
        if (googleLayerActiveRef.current) {
          currentCityRef.current = null;
          removeGoogle3DTiles(map);
        }
      }
    };

    map.on('moveend', checkViewport);
    checkViewport(); // Check immediately

    return () => {
      map.off('moveend', checkViewport);
      if (googleLayerActiveRef.current) {
        removeGoogle3DTiles(map);
      }
    };
  }, [map, mapReady, show3DBuildings, getGoogleApiKey, addGoogle3DTiles, removeGoogle3DTiles]);
};
