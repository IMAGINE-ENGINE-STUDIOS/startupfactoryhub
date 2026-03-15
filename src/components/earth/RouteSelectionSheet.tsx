import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { RouteOption, RoutePoint } from '@/hooks/useMapRouting';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Navigation, MapPin, Clock, Route, Loader2, AlertTriangle,
  Navigation2, X, ChevronUp, ChevronDown, BookmarkPlus, Trash2, Star, History, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SavedLocation } from '@/hooks/useMapFavorites';
import { SearchHistoryItem } from '@/hooks/useMapSearchHistory';
import { RouteHistoryItem } from '@/hooks/useMapRouteHistory';
import mapboxgl from 'mapbox-gl';

interface RouteSelectionSheetProps {
  origin: RoutePoint | null;
  destination: RoutePoint | null;
  routes: RouteOption[];
  selectedRouteIndex: number;
  isLoadingRoute: boolean;
  routeError: string | null;
  favorites: SavedLocation[];
  searchHistory: SearchHistoryItem[];
  routeHistory: RouteHistoryItem[];
  avoidTolls: boolean;
  map: mapboxgl.Map | null;
  onSetOrigin: (point: RoutePoint) => void;
  onSetDestination: (point: RoutePoint) => void;
  onSelectRoute: (index: number) => void;
  onGetDirections: (from: RoutePoint, to: RoutePoint) => void;
  onStartNavigation: () => void;
  onClearRoute: () => void;
  onClose: () => void;
  onToggleTolls: () => void;
  onAddFavorite: (loc: Omit<SavedLocation, 'id' | 'created_at'>) => void;
  onRemoveFavorite: (id: string) => void;
  onSaveRoute: (route: any) => void;
  onClearHistory: () => void;
  onSelectHistoryItem: (item: SearchHistoryItem) => void;
  onSelectRouteHistory: (item: RouteHistoryItem) => void;
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

export const RouteSelectionSheet = memo(function RouteSelectionSheet({
  origin,
  destination,
  routes,
  selectedRouteIndex,
  isLoadingRoute,
  routeError,
  favorites,
  searchHistory,
  routeHistory,
  avoidTolls,
  map,
  onSetOrigin,
  onSetDestination,
  onSelectRoute,
  onGetDirections,
  onStartNavigation,
  onClearRoute,
  onClose,
  onToggleTolls,
  onAddFavorite,
  onRemoveFavorite,
  onSaveRoute,
  onClearHistory,
  onSelectHistoryItem,
  onSelectRouteHistory,
}: RouteSelectionSheetProps) {
  const [originInput, setOriginInput] = useState(origin?.name || '');
  const [destInput, setDestInput] = useState(destination?.name || '');
  const [activeField, setActiveField] = useState<'origin' | 'destination' | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { if (origin) setOriginInput(origin.name); }, [origin]);
  useEffect(() => { if (destination) setDestInput(destination.name); }, [destination]);

  const geocodeSearch = useCallback(async (query: string) => {
    if (query.length < 2) { setSuggestions([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const token = mapboxgl.accessToken;
        const resp = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&limit=5`
        );
        const data = await resp.json();
        setSuggestions(data.features || []);
      } catch { setSuggestions([]); }
    }, 300);
  }, []);

  const selectSuggestion = useCallback((feat: any) => {
    const point: RoutePoint = {
      lat: feat.center[1],
      lng: feat.center[0],
      name: feat.place_name || feat.text,
    };
    if (activeField === 'origin') {
      onSetOrigin(point);
      setOriginInput(point.name);
    } else {
      onSetDestination(point);
      setDestInput(point.name);
    }
    setSuggestions([]);
    setActiveField(null);
  }, [activeField, onSetOrigin, onSetDestination]);

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const point: RoutePoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          name: 'My Location',
        };
        onSetOrigin(point);
        setOriginInput('My Location');
      },
      () => {}
    );
  }, [onSetOrigin]);

  const handleGetDirections = useCallback(() => {
    if (origin && destination) {
      onGetDirections(origin, destination);
    }
  }, [origin, destination, onGetDirections]);

  const hasRoutes = routes.length > 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] pointer-events-none">
      <div className="pointer-events-auto bg-black/92 backdrop-blur-2xl border-t border-white/10 rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Drag handle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex justify-center pt-3 pb-1"
        >
          <div className="w-10 h-1 rounded-full bg-white/25" />
        </button>

        {/* Header with close */}
        <div className="px-4 pb-2 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Navigation2 className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-semibold text-white">Directions</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/10">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Origin & Destination inputs */}
        <div className="px-4 pb-3 space-y-2 flex-shrink-0">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
            <input
              value={originInput}
              onChange={(e) => { setOriginInput(e.target.value); setActiveField('origin'); geocodeSearch(e.target.value); }}
              onFocus={() => setActiveField('origin')}
              placeholder="Starting point"
              className="w-full pl-8 pr-16 py-2.5 rounded-xl bg-white/8 border border-white/12 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
            <button
              onClick={handleUseMyLocation}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-blue-400 hover:text-blue-300 px-1.5 py-0.5 rounded bg-blue-500/10"
            >
              My loc
            </button>
          </div>

          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
            <input
              value={destInput}
              onChange={(e) => { setDestInput(e.target.value); setActiveField('destination'); geocodeSearch(e.target.value); }}
              onFocus={() => setActiveField('destination')}
              placeholder="Where to?"
              className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-white/8 border border-white/12 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-red-500/50"
            />
          </div>

          {/* Suggestions dropdown */}
          {suggestions.length > 0 && activeField && (
            <div className="bg-black/95 border border-white/15 rounded-xl overflow-hidden">
              {suggestions.map((feat, i) => (
                <button
                  key={feat.id || i}
                  onClick={() => selectSuggestion(feat)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white/10 text-left"
                >
                  <MapPin className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-white/90 truncate">{feat.text}</p>
                    <p className="text-[10px] text-white/40 truncate">{feat.place_name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Options row */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleTolls}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-colors border",
                avoidTolls
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  : "bg-white/5 border-white/10 text-white/40"
              )}
            >
              <AlertTriangle className="w-3 h-3" />
              Avoid tolls
            </button>

            <Button
              size="sm"
              onClick={handleGetDirections}
              disabled={!origin || !destination || isLoadingRoute}
              className="ml-auto bg-blue-600 hover:bg-blue-500 text-white text-xs h-8 px-4"
            >
              {isLoadingRoute ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Route className="w-3.5 h-3.5 mr-1" />}
              Get Route
            </Button>
          </div>
        </div>

        {/* Route Error */}
        {routeError && (
          <div className="mx-4 mb-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
            {routeError}
          </div>
        )}

        {/* Route Results — takes most of screen */}
        {isExpanded && (
          <div className="flex-1 overflow-y-auto min-h-0">
            {hasRoutes && (
              <div className="px-4 pb-4 space-y-2">
                <p className="text-xs text-white/50 font-medium">
                  {routes.length} route{routes.length > 1 ? 's' : ''} found
                </p>

                {routes.map((route, i) => {
                  const isSelected = i === selectedRouteIndex;
                  return (
                    <button
                      key={route.id}
                      onClick={() => onSelectRoute(i)}
                      className={cn(
                        "w-full text-left p-4 rounded-2xl border transition-all",
                        isSelected
                          ? "bg-blue-500/15 border-blue-500/40 ring-1 ring-blue-500/20"
                          : "bg-white/5 border-white/10 hover:bg-white/8"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-white">{formatDuration(route.duration)}</span>
                          <span className="text-xs text-white/40">({formatDistance(route.distance)})</span>
                        </div>
                        <span className="text-xs text-white/40">ETA {formatETA(route.duration)}</span>
                      </div>
                      <p className="text-xs text-white/50 truncate">{route.summary}</p>
                      <div className="flex gap-1.5 mt-2">
                        {route.hasTolls && (
                          <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400 px-1.5 py-0">
                            Toll road
                          </Badge>
                        )}
                        {i === 0 && (
                          <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400 px-1.5 py-0">
                            Fastest
                          </Badge>
                        )}
                        {isSelected && (
                          <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 px-1.5 py-0">
                            Selected
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })}

                {/* Action buttons */}
                <div className="flex gap-2 pt-1">
                  <Button
                    size="lg"
                    onClick={onStartNavigation}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-sm h-12 rounded-xl font-semibold"
                  >
                    <Navigation className="w-5 h-5 mr-2" />
                    Start
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => {
                      if (origin && destination && routes[selectedRouteIndex]) {
                        const r = routes[selectedRouteIndex];
                        onSaveRoute({
                          origin_name: origin.name,
                          origin_lat: origin.lat,
                          origin_lng: origin.lng,
                          destination_name: destination.name,
                          destination_lat: destination.lat,
                          destination_lng: destination.lng,
                          distance_meters: r.distance,
                          duration_seconds: r.duration,
                          avoid_tolls: avoidTolls,
                        });
                      }
                    }}
                    className="border-white/20 text-white/60 hover:text-white h-12 w-12 rounded-xl"
                  >
                    <BookmarkPlus className="w-5 h-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={onClearRoute}
                    className="border-white/20 text-white/40 hover:text-red-400 h-12 w-12 rounded-xl"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>

                {/* Turn-by-turn preview */}
                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs text-white/50 font-medium mb-2">Turn-by-turn directions</p>
                  {routes[selectedRouteIndex]?.steps.slice(0, 8).map((step, i) => (
                    <div key={i} className="flex items-start gap-2 py-1.5 border-b border-white/5 last:border-0">
                      <span className="text-xs text-white/30 w-5 text-right flex-shrink-0">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-white/80">{step.instruction}</p>
                        <p className="text-[10px] text-white/30">{formatDistance(step.distance)}</p>
                      </div>
                    </div>
                  ))}
                  {(routes[selectedRouteIndex]?.steps.length || 0) > 8 && (
                    <p className="text-[10px] text-white/30 pt-1 text-center">
                      +{(routes[selectedRouteIndex]?.steps.length || 0) - 8} more steps
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Empty state — show favorites & history */}
            {!hasRoutes && !isLoadingRoute && (
              <div className="px-4 pb-4 space-y-3">
                {/* Favorites */}
                {favorites.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-semibold text-white/70">Favorites</span>
                    </div>
                    {favorites.slice(0, 5).map(fav => (
                      <button
                        key={fav.id}
                        className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/5 text-left"
                        onClick={() => onSetDestination({ lat: fav.lat, lng: fav.lng, name: fav.name })}
                      >
                        <Star className="w-3 h-3 text-amber-400 flex-shrink-0" />
                        <p className="text-xs text-white/80 truncate flex-1">{fav.name}</p>
                      </button>
                    ))}
                  </div>
                )}

                {/* Route history */}
                {routeHistory.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Route className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-semibold text-white/70">Recent routes</span>
                    </div>
                    {routeHistory.slice(0, 5).map(item => (
                      <button
                        key={item.id}
                        onClick={() => onSelectRouteHistory(item)}
                        className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/5 text-left"
                      >
                        <Navigation className="w-3 h-3 text-white/20 flex-shrink-0" />
                        <p className="text-xs text-white/70 truncate flex-1">
                          {item.origin_name} → {item.destination_name}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
