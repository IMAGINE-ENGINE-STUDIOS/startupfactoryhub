import { useState, useEffect, useRef, useCallback, memo } from 'react';
import mapboxgl from 'mapbox-gl';
import { RouteOption, RouteStep, RoutePoint } from '@/hooks/useMapRouting';
import { Button } from '@/components/ui/button';
import { X, Navigation, Volume2, VolumeX, ChevronUp, ChevronDown, MapPin, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationModeProps {
  map: mapboxgl.Map | null;
  route: RouteOption;
  origin: RoutePoint;
  destination: RoutePoint;
  onExit: () => void;
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

export const NavigationMode = memo(function NavigationMode({
  map,
  route,
  origin,
  destination,
  onExit,
}: NavigationModeProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showStepsList, setShowStepsList] = useState(false);
  const animationRef = useRef<number | null>(null);
  const coordIndexRef = useRef(0);
  const startTimeRef = useRef<number>(0);

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

  // Start 3D flythrough animation
  const startNavAnimation = useCallback(() => {
    if (!map || !route.geometry.coordinates.length) return;

    setIsAnimating(true);
    const coords = route.geometry.coordinates as [number, number][];
    const totalCoords = coords.length;

    // Calculate total animation duration based on route (compressed — ~1s per km, min 10s max 120s)
    const routeKm = route.distance / 1000;
    const animDurationMs = Math.min(120000, Math.max(10000, routeKm * 1000));

    startTimeRef.current = performance.now();
    coordIndexRef.current = 0;

    // Set initial camera
    map.setProjection('mercator');

    const animate = (timestamp: number) => {
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / animDurationMs, 1);

      // Get current position along route
      const floatIndex = progress * (totalCoords - 1);
      const i = Math.floor(floatIndex);
      const frac = floatIndex - i;

      if (i >= totalCoords - 1) {
        setIsAnimating(false);
        speak('You have arrived at your destination');
        setCurrentStepIndex(steps.length - 1);
        return;
      }

      const current = coords[i];
      const next = coords[Math.min(i + 1, totalCoords - 1)];
      const lng = current[0] + (next[0] - current[0]) * frac;
      const lat = current[1] + (next[1] - current[1]) * frac;

      // Calculate bearing
      const bearing = getBearing(current[1], current[0], next[1], next[0]);

      // Update camera — 3D navigation view
      map.jumpTo({
        center: [lng, lat],
        zoom: 17.5,
        pitch: 65,
        bearing,
      });

      // Update current step based on proximity to step maneuver locations
      for (let s = currentStepIndex; s < steps.length; s++) {
        const loc = steps[s].maneuver.location;
        const dist = haversine(lat, lng, loc[1], loc[0]);
        if (dist < 30 && s > currentStepIndex) {
          setCurrentStepIndex(s);
          break;
        }
      }

      coordIndexRef.current = i;
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [map, route, steps, currentStepIndex, speak]);

  // Start animation on mount
  useEffect(() => {
    const timer = setTimeout(() => startNavAnimation(), 500);
    return () => {
      clearTimeout(timer);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [startNavAnimation]);

  // Cleanup on exit
  const handleExit = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    window.speechSynthesis?.cancel();
    if (map) {
      map.jumpTo({ pitch: 0, bearing: 0, zoom: 12 });
    }
    onExit();
  }, [map, onExit]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      {/* Top Bar — Current Instruction */}
      <div className="flex-shrink-0 bg-gradient-to-b from-emerald-900/95 to-emerald-950/95 backdrop-blur-xl border-b border-emerald-500/20">
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
                <p className="text-emerald-300/80 text-sm mt-0.5">
                  {formatDistance(currentStep.distance)}
                </p>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              className="text-white/60 hover:text-white hover:bg-white/10 h-10 w-10"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExit}
              className="text-white/60 hover:text-red-400 hover:bg-red-500/10 h-10 w-10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Next step preview */}
        {nextStep && (
          <div className="px-4 pb-2 flex items-center gap-2 text-emerald-300/50 text-xs">
            <span>Then</span>
            <span className="text-base">{getManeuverIcon(nextStep.maneuver.type, nextStep.maneuver.modifier)}</span>
            <span className="truncate">{nextStep.instruction}</span>
          </div>
        )}
      </div>

      {/* Map Container — the actual map is behind this overlay, we just control the camera */}
      <div className="flex-1 relative">
        {/* This is transparent — map shows through from behind */}
        <div className="absolute inset-0 pointer-events-none" />
      </div>

      {/* Bottom Bar — ETA & Controls */}
      <div className="flex-shrink-0 bg-gradient-to-t from-black/95 to-black/80 backdrop-blur-xl border-t border-white/10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{formatDuration(remainingDuration)}</p>
              <p className="text-xs text-white/40">remaining</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-lg font-semibold text-white/80">{formatDistance(remainingDistance)}</p>
              <p className="text-xs text-white/40">distance</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {route.hasTolls && (
              <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                ⚠️ Toll road
              </span>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowStepsList(!showStepsList)}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              Steps {showStepsList ? <ChevronDown className="w-4 h-4 ml-1" /> : <ChevronUp className="w-4 h-4 ml-1" />}
            </Button>

            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-red-400" />
              <span className="text-sm text-white/80 max-w-[120px] truncate">{destination.name}</span>
            </div>
          </div>
        </div>

        {/* Steps list */}
        {showStepsList && (
          <div className="border-t border-white/10 max-h-[40vh] overflow-y-auto">
            {steps.map((step, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 border-b border-white/5",
                  i === currentStepIndex && "bg-emerald-500/10",
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

// Bearing between two points
function getBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}
