import { useState, useEffect, useRef, useCallback, memo } from 'react';
import mapboxgl from 'mapbox-gl';
import { RouteOption, RouteStep, RoutePoint } from '@/hooks/useMapRouting';
import { Button } from '@/components/ui/button';
import { X, Navigation, Volume2, VolumeX, ChevronUp, ChevronDown, MapPin, Clock, ArrowRight, WifiOff, Locate, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface NavigationModeProps {
  map: mapboxgl.Map | null;
  route: RouteOption;
  origin: RoutePoint;
  destination: RoutePoint;
  onExit: () => void;
  onCacheRouteTiles?: (coords: [number, number][]) => void;
}

function getManeuverIcon(type: string, modifier?: string) {
  if (type === 'arrive') return '🏁';
  if (type === 'depart') return '🚗';
  if (modifier?.includes('left')) return '↰';
  if (modifier?.includes('right')) return '↱';
  if (type === 'roundabout') return '↻';
  if (type === 'merge') return '⤨';
  if (modifier?.includes('straight') || type === 'continue') return '↑';
  return '→';
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

function formatETA(seconds: number): string {
  const eta = new Date(Date.now() + seconds * 1000);
  return eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const NavigationMode = memo(function NavigationMode({
  map,
  route,
  origin,
  destination,
  onExit,
  onCacheRouteTiles,
}: NavigationModeProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(() => {
    try { return localStorage.getItem('sfh_nav_muted') === 'true'; } catch { return false; }
  });
  const [showStepsList, setShowStepsList] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isFollowing, setIsFollowing] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const { isOnline } = useNetworkStatus();

  // Cache route corridor tiles for offline use on mount
  useEffect(() => {
    if (onCacheRouteTiles && route.geometry.coordinates.length > 0) {
      onCacheRouteTiles(route.geometry.coordinates as [number, number][]);
    }
  }, []);

  const steps = route.steps;
  const currentStep = steps[currentStepIndex];
  const nextStep = steps[currentStepIndex + 1];
  const remainingDistance = steps.slice(currentStepIndex).reduce((a, s) => a + s.distance, 0);
  const remainingDuration = steps.slice(currentStepIndex).reduce((a, s) => a + s.duration, 0);

  // Text-to-speech for turn instructions
  const speak = useCallback((text: string) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.9;
    utter.pitch = 1;
    window.speechSynthesis.speak(utter);
  }, [isMuted]);

  // Speak current instruction
  useEffect(() => {
    if (currentStep) {
      speak(currentStep.instruction);
    }
  }, [currentStepIndex, currentStep, speak]);

  // Draw route on map and set up view
  useEffect(() => {
    if (!map) return;

    // Add route line
    const sourceId = 'nav-route-source';
    const layerId = 'nav-route-line';
    const outlineId = 'nav-route-outline';

    // Clean up first
    if (map.getLayer(outlineId)) map.removeLayer(outlineId);
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    map.addSource(sourceId, {
      type: 'geojson',
      data: { type: 'Feature', properties: {}, geometry: route.geometry },
    });

    // Route outline (thicker, darker)
    map.addLayer({
      id: outlineId,
      type: 'line',
      source: sourceId,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': route.hasTolls ? '#b45309' : '#1d4ed8',
        'line-width': 10,
        'line-opacity': 0.4,
      },
    });

    // Route core line
    map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': route.hasTolls ? '#f59e0b' : '#3b82f6',
        'line-width': 6,
        'line-opacity': 0.9,
      },
    });

    // Add destination marker
    const destEl = document.createElement('div');
    destEl.innerHTML = `<div style="width:24px;height:24px;background:#ef4444;border:3px solid white;border-radius:50%;box-shadow:0 2px 12px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
      <div style="width:8px;height:8px;background:white;border-radius:50%;"></div>
    </div>`;
    const destMarker = new mapboxgl.Marker(destEl)
      .setLngLat([destination.lng, destination.lat])
      .addTo(map);

    // Fit bounds to show full route initially
    const coords = route.geometry.coordinates as [number, number][];
    if (coords.length > 1) {
      const bounds = coords.reduce(
        (b, c) => b.extend(c),
        new mapboxgl.LngLatBounds(coords[0], coords[0])
      );
      map.fitBounds(bounds, { padding: { top: 200, bottom: 350, left: 60, right: 60 }, duration: 1500 });
    }

    return () => {
      try {
        if (map.getLayer(outlineId)) map.removeLayer(outlineId);
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch {}
      destMarker.remove();
    };
  }, [map, route, destination]);

  // Watch real GPS position
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setLocationError(null);

        // Update user marker on map
        if (map) {
          if (!userMarkerRef.current) {
            const el = document.createElement('div');
            el.innerHTML = `
              <div style="position:relative;">
                <div style="width:22px;height:22px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 12px rgba(59,130,246,0.5);"></div>
                <div style="position:absolute;top:-4px;left:-4px;width:30px;height:30px;border:2px solid rgba(59,130,246,0.3);border-radius:50%;animation:pulse 2s infinite;"></div>
              </div>
            `;
            userMarkerRef.current = new mapboxgl.Marker(el)
              .setLngLat([loc.lng, loc.lat])
              .addTo(map);
          } else {
            userMarkerRef.current.setLngLat([loc.lng, loc.lat]);
          }

          // Follow user if enabled
          if (isFollowing) {
            map.easeTo({
              center: [loc.lng, loc.lat],
              zoom: 16,
              pitch: 45,
              duration: 1000,
            });
          }
        }

        // Update current step based on proximity to step maneuver locations
        for (let s = 0; s < steps.length; s++) {
          const stepLoc = steps[s].maneuver.location;
          const dist = haversine(loc.lat, loc.lng, stepLoc[1], stepLoc[0]);
          if (dist < 50 && s > currentStepIndex) {
            setCurrentStepIndex(s);
            break;
          }
        }

        // Check if arrived
        const distToDest = haversine(loc.lat, loc.lng, destination.lat, destination.lng);
        if (distToDest < 30) {
          speak('You have arrived at your destination');
        }
      },
      (err) => {
        setLocationError(err.message);
        // Use origin as fallback
        if (!userLocation) {
          setUserLocation({ lat: origin.lat, lng: origin.lng });
        }
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
    };
  }, [map, steps, destination, origin, isFollowing]);

  // Cleanup on exit
  const handleExit = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    window.speechSynthesis?.cancel();
    if (map) {
      map.easeTo({ pitch: 0, bearing: 0, zoom: 12, duration: 800 });
    }
    onExit();
  }, [map, onExit]);

  const recenterOnUser = useCallback(() => {
    if (map && userLocation) {
      setIsFollowing(true);
      map.easeTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 16,
        pitch: 45,
        duration: 800,
      });
    }
  }, [map, userLocation]);

  // Detect user drag to disable auto-follow
  useEffect(() => {
    if (!map) return;
    const onDrag = () => setIsFollowing(false);
    map.on('dragstart', onDrag);
    return () => { map.off('dragstart', onDrag); };
  }, [map]);

  return (
    <>
      {/* Top instruction banner - overlays the map */}
      <div className="fixed top-0 left-0 right-0 z-[9999]">
        {!isOnline && (
          <div className="flex items-center justify-center gap-2 py-1.5 bg-amber-600/90 text-white text-xs font-medium backdrop-blur-sm">
            <WifiOff className="w-3.5 h-3.5" />
            Offline mode — using cached maps &amp; route
          </div>
        )}
        <div className="bg-gradient-to-b from-black/85 to-black/60 backdrop-blur-xl">
          <div className="flex items-center gap-4 px-4 py-3">
            <div className="text-4xl flex-shrink-0">
              {currentStep ? getManeuverIcon(currentStep.maneuver.type, currentStep.maneuver.modifier) : '🚗'}
            </div>
            <div className="flex-1 min-w-0">
              {currentStep && (
                <>
                  <p className="text-white text-lg font-bold leading-tight truncate">
                    {currentStep.instruction}
                  </p>
                  <p className="text-blue-300/80 text-sm mt-0.5">
                    {formatDistance(currentStep.distance)}
                  </p>
                </>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
                className="text-white/60 hover:text-white hover:bg-white/10 h-9 w-9"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleExit}
                className="text-white/60 hover:text-red-400 hover:bg-red-500/10 h-9 w-9"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Next step preview */}
          {nextStep && (
            <div className="px-4 pb-2 flex items-center gap-2 text-white/40 text-xs">
              <span>Then</span>
              <span className="text-base">{getManeuverIcon(nextStep.maneuver.type, nextStep.maneuver.modifier)}</span>
              <span className="truncate">{nextStep.instruction}</span>
            </div>
          )}
        </div>
      </div>

      {/* Re-center button (shown when not following) */}
      {!isFollowing && (
        <div className="fixed bottom-[220px] right-4 z-[9999]">
          <Button
            size="icon"
            onClick={recenterOnUser}
            className="bg-blue-600 hover:bg-blue-500 text-white h-12 w-12 rounded-full shadow-lg"
          >
            <Locate className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Bottom slide-up panel — ETA + Steps */}
      <div className="fixed bottom-0 left-0 right-0 z-[9999]">
        <div className="bg-gradient-to-t from-black/95 to-black/85 backdrop-blur-xl border-t border-white/10 rounded-t-2xl">
          {/* Drag handle */}
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Summary bar */}
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div>
                <p className="text-2xl font-bold text-white">{formatDuration(remainingDuration)}</p>
                <p className="text-[11px] text-white/40">ETA {formatETA(remainingDuration)}</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div>
                <p className="text-lg font-semibold text-white/80">{formatDistance(remainingDistance)}</p>
                <p className="text-[11px] text-white/40">remaining</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {route.hasTolls && (
                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                  ⚠️ Toll
                </span>
              )}
              <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl">
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs text-white/70 max-w-[100px] truncate">{destination.name}</span>
              </div>
            </div>
          </div>

          {/* Steps toggle */}
          <button
            onClick={() => setShowStepsList(!showStepsList)}
            className="w-full flex items-center justify-center gap-1.5 py-2 border-t border-white/10 text-white/50 hover:text-white/80 text-xs font-medium transition-colors"
          >
            {showStepsList ? (
              <>Hide steps <ChevronDown className="w-3.5 h-3.5" /></>
            ) : (
              <>View all steps <ChevronUp className="w-3.5 h-3.5" /></>
            )}
          </button>

          {/* Steps list */}
          {showStepsList && (
            <div className="max-h-[40vh] overflow-y-auto border-t border-white/10">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 border-b border-white/5",
                    i === currentStepIndex && "bg-blue-500/10",
                    i < currentStepIndex && "opacity-40"
                  )}
                >
                  <span className="text-xl w-8 text-center flex-shrink-0">
                    {getManeuverIcon(step.maneuver.type, step.maneuver.modifier)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/90 truncate">{step.instruction}</p>
                    <p className="text-xs text-white/40">{formatDistance(step.distance)} · {formatDuration(step.duration)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
});

// Haversine distance in meters
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
