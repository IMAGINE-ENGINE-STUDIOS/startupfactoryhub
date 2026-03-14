import { useState, useCallback, useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { cacheRoute, getCachedRoute } from './useOfflineMaps';

export interface RoutePoint {
  lat: number;
  lng: number;
  name: string;
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  maneuver: {
    type: string;
    modifier?: string;
    bearing_after?: number;
    bearing_before?: number;
    location: [number, number];
  };
}

export interface RouteOption {
  id: string;
  geometry: GeoJSON.LineString;
  distance: number; // meters
  duration: number; // seconds
  steps: RouteStep[];
  hasTolls: boolean;
  summary: string;
}

interface UseMapRoutingOptions {
  map: mapboxgl.Map | null;
  mapReady: boolean;
  avoidTolls?: boolean;
}

export function useMapRouting({ map, mapReady, avoidTolls = true }: UseMapRoutingOptions) {
  const [origin, setOrigin] = useState<RoutePoint | null>(null);
  const [destination, setDestination] = useState<RoutePoint | null>(null);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const originMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const destMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // Fetch route from OSRM
  const fetchRoute = useCallback(async (from: RoutePoint, to: RoutePoint) => {
    setIsLoadingRoute(true);
    setRouteError(null);
    setRoutes([]);

    try {
      // OSRM public demo server — alternatives=true for multiple routes
      const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=true&alternatives=true`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Routing service unavailable');
      const data = await resp.json();

      if (data.code !== 'Ok' || !data.routes?.length) {
        throw new Error('No route found between these locations');
      }

      const routeOptions: RouteOption[] = data.routes.map((r: any, i: number) => {
        const steps: RouteStep[] = r.legs.flatMap((leg: any) =>
          leg.steps.map((s: any) => ({
            instruction: s.maneuver?.type === 'depart'
              ? `Head ${s.maneuver.modifier || 'straight'} on ${s.name || 'the road'}`
              : s.maneuver?.type === 'arrive'
                ? `Arrive at your destination`
                : `${capitalize(s.maneuver?.modifier || '')} ${s.maneuver?.type === 'turn' ? 'turn' : ''} onto ${s.name || 'the road'}`.trim(),
            distance: s.distance,
            duration: s.duration,
            maneuver: {
              type: s.maneuver?.type || 'straight',
              modifier: s.maneuver?.modifier,
              bearing_after: s.maneuver?.bearing_after,
              bearing_before: s.maneuver?.bearing_before,
              location: s.maneuver?.location || [from.lng, from.lat],
            },
          }))
        );

        // Heuristic toll detection — OSRM doesn't provide toll data
        const hasTolls = r.legs.some((leg: any) =>
          leg.steps.some((s: any) =>
            (s.name || '').toLowerCase().includes('toll') ||
            (s.ref || '').toLowerCase().includes('toll')
          )
        );

        return {
          id: `route-${i}`,
          geometry: r.geometry,
          distance: r.distance,
          duration: r.duration,
          steps,
          hasTolls,
          summary: r.legs.map((l: any) => l.summary).filter(Boolean).join(' → ') || `Route ${i + 1}`,
        };
      });

      // Sort: prefer toll-free routes if avoidTolls is on
      if (avoidTolls) {
        routeOptions.sort((a, b) => {
          if (a.hasTolls !== b.hasTolls) return a.hasTolls ? 1 : -1;
          return a.duration - b.duration;
        });
      }

      setRoutes(routeOptions);
      setSelectedRouteIndex(0);
    } catch (err: any) {
      setRouteError(err.message || 'Failed to calculate route');
    } finally {
      setIsLoadingRoute(false);
    }
  }, [avoidTolls]);

  // Draw route on map
  useEffect(() => {
    if (!map || !mapReady || routes.length === 0) return;

    // Remove old layers first
    routes.forEach((_, i) => {
      const layerId = `route-line-${i}`;
      const sourceId = `route-source-${i}`;
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    });
    // Also clean extras
    for (let i = 0; i < 5; i++) {
      const layerId = `route-line-${i}`;
      const sourceId = `route-source-${i}`;
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    }

    // Draw each route (selected on top with different style)
    routes.forEach((route, i) => {
      const sourceId = `route-source-${i}`;
      const layerId = `route-line-${i}`;
      const isSelected = i === selectedRouteIndex;

      map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: route.geometry,
        },
      });

      map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': isSelected
            ? (route.hasTolls ? '#f59e0b' : '#3b82f6')
            : '#64748b',
          'line-width': isSelected ? 6 : 3,
          'line-opacity': isSelected ? 0.9 : 0.4,
        },
      });
    });

    // Add origin/destination markers
    if (origin) {
      if (originMarkerRef.current) originMarkerRef.current.remove();
      const el = document.createElement('div');
      el.innerHTML = `<div style="width:20px;height:20px;background:#22c55e;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`;
      originMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat([origin.lng, origin.lat])
        .addTo(map);
    }

    if (destination) {
      if (destMarkerRef.current) destMarkerRef.current.remove();
      const el = document.createElement('div');
      el.innerHTML = `<div style="width:20px;height:20px;background:#ef4444;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`;
      destMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat([destination.lng, destination.lat])
        .addTo(map);
    }

    // Fit bounds to route
    const selectedRoute = routes[selectedRouteIndex];
    if (selectedRoute) {
      const coords = selectedRoute.geometry.coordinates as [number, number][];
      const bounds = coords.reduce(
        (b, c) => b.extend(c),
        new mapboxgl.LngLatBounds(coords[0], coords[0])
      );
      map.fitBounds(bounds, { padding: 80, duration: 1500 });
    }

    return () => {
      routes.forEach((_, i) => {
        const layerId = `route-line-${i}`;
        const sourceId = `route-source-${i}`;
        try {
          if (map.getLayer(layerId)) map.removeLayer(layerId);
          if (map.getSource(sourceId)) map.removeSource(sourceId);
        } catch { /* map may be removed */ }
      });
      if (originMarkerRef.current) { originMarkerRef.current.remove(); originMarkerRef.current = null; }
      if (destMarkerRef.current) { destMarkerRef.current.remove(); destMarkerRef.current = null; }
    };
  }, [map, mapReady, routes, selectedRouteIndex, origin, destination]);

  const clearRoute = useCallback(() => {
    setRoutes([]);
    setOrigin(null);
    setDestination(null);
    setRouteError(null);
    setSelectedRouteIndex(0);

    if (map) {
      for (let i = 0; i < 5; i++) {
        const layerId = `route-line-${i}`;
        const sourceId = `route-source-${i}`;
        try {
          if (map.getLayer(layerId)) map.removeLayer(layerId);
          if (map.getSource(sourceId)) map.removeSource(sourceId);
        } catch { /* */ }
      }
    }
    if (originMarkerRef.current) { originMarkerRef.current.remove(); originMarkerRef.current = null; }
    if (destMarkerRef.current) { destMarkerRef.current.remove(); destMarkerRef.current = null; }
  }, [map]);

  const getDirections = useCallback(async (from: RoutePoint, to: RoutePoint) => {
    setOrigin(from);
    setDestination(to);
    await fetchRoute(from, to);
  }, [fetchRoute]);

  return {
    origin,
    setOrigin,
    destination,
    setDestination,
    routes,
    selectedRouteIndex,
    setSelectedRouteIndex,
    isLoadingRoute,
    routeError,
    getDirections,
    clearRoute,
    selectedRoute: routes[selectedRouteIndex] || null,
  };
}

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}
