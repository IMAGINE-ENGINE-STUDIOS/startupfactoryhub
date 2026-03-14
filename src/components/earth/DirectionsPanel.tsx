import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { RouteOption, RoutePoint } from '@/hooks/useMapRouting';
import { SavedLocation } from '@/hooks/useMapFavorites';
import { SearchHistoryItem } from '@/hooks/useMapSearchHistory';
import { RouteHistoryItem } from '@/hooks/useMapRouteHistory';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  X, Navigation, MapPin, Clock, Star, History, Trash2,
  ArrowRight, Route, Loader2, AlertTriangle, Navigation2,
  BookmarkPlus, Search, ChevronDown, ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import mapboxgl from 'mapbox-gl';

interface DirectionsPanelProps {
  origin: RoutePoint | null;
  destination: RoutePoint | null;
  routes: RouteOption[];
  selectedRouteIndex: number;
  isLoadingRoute: boolean;
  routeError: string | null;
  favorites: SavedLocation[];
  searchHistory: SearchHistoryItem[];
  routeHistory: RouteHistoryItem[];
  onSetOrigin: (point: RoutePoint) => void;
  onSetDestination: (point: RoutePoint) => void;
  onSelectRoute: (index: number) => void;
  onGetDirections: (from: RoutePoint, to: RoutePoint) => void;
  onStartNavigation: () => void;
  onClearRoute: () => void;
  onAddFavorite: (loc: Omit<SavedLocation, 'id' | 'created_at'>) => void;
  onRemoveFavorite: (id: string) => void;
  onClose: () => void;
  onSaveRoute: (route: any) => void;
  onClearHistory: () => void;
  onSelectHistoryItem: (item: SearchHistoryItem) => void;
  onSelectRouteHistory: (item: RouteHistoryItem) => void;
  avoidTolls: boolean;
  onToggleTolls: () => void;
  map: mapboxgl.Map | null;
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

export const DirectionsPanel = memo(function DirectionsPanel({
  origin,
  destination,
  routes,
  selectedRouteIndex,
  isLoadingRoute,
  routeError,
  favorites,
  searchHistory,
  routeHistory,
  onSetOrigin,
  onSetDestination,
  onSelectRoute,
  onGetDirections,
  onStartNavigation,
  onClearRoute,
  onAddFavorite,
  onRemoveFavorite,
  onClose,
  onSaveRoute,
  onClearHistory,
  onSelectHistoryItem,
  onSelectRouteHistory,
  avoidTolls,
  onToggleTolls,
  map,
}: DirectionsPanelProps) {
  const [originInput, setOriginInput] = useState(origin?.name || '');
  const [destInput, setDestInput] = useState(destination?.name || '');
  const [activeField, setActiveField] = useState<'origin' | 'destination' | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
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
        if (activeField === 'origin' || !origin) {
          onSetOrigin(point);
          setOriginInput('My Location');
        }
      },
      () => {}
    );
  }, [activeField, origin, onSetOrigin]);

  const handleGetDirections = useCallback(() => {
    if (origin && destination) {
      onGetDirections(origin, destination);
    }
  }, [origin, destination, onGetDirections]);

  return (
    <div className="absolute top-4 left-4 z-20 w-[360px] max-h-[calc(100vh-120px)] bg-black/90 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Navigation2 className="w-5 h-5 text-blue-400" />
          <span className="text-sm font-semibold text-white">Directions</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/10">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Origin & Destination inputs */}
      <div className="p-3 space-y-2 flex-shrink-0">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
          <input
            value={originInput}
            onChange={(e) => { setOriginInput(e.target.value); setActiveField('origin'); geocodeSearch(e.target.value); }}
            onFocus={() => setActiveField('origin')}
            placeholder="Starting point"
            className="w-full pl-8 pr-16 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
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
            placeholder="Destination"
            className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-red-500/50"
          />
        </div>

        {/* Suggestions dropdown */}
        {suggestions.length > 0 && activeField && (
          <div className="bg-black/95 border border-white/15 rounded-xl overflow-hidden">
            {suggestions.map((feat, i) => (
              <button
                key={feat.id || i}
                onClick={() => selectSuggestion(feat)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/10 text-left"
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
            className="ml-auto bg-blue-600 hover:bg-blue-500 text-white text-xs h-8"
          >
            {isLoadingRoute ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Route className="w-3.5 h-3.5 mr-1" />}
            Get Route
          </Button>
        </div>
      </div>

      {/* Route Error */}
      {routeError && (
        <div className="mx-3 mb-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
          {routeError}
        </div>
      )}

      {/* Route Results */}
      <ScrollArea className="flex-1 min-h-0">
        {routes.length > 0 && (
          <div className="p-3 space-y-2">
            <p className="text-xs text-white/50 font-medium">
              {routes.length} route{routes.length > 1 ? 's' : ''} found
            </p>

            {routes.map((route, i) => (
              <button
                key={route.id}
                onClick={() => onSelectRoute(i)}
                className={cn(
                  "w-full text-left p-3 rounded-xl border transition-all",
                  i === selectedRouteIndex
                    ? "bg-blue-500/10 border-blue-500/30"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{formatDuration(route.duration)}</span>
                  <span className="text-xs text-white/50">{formatDistance(route.distance)}</span>
                </div>
                <p className="text-xs text-white/40 mt-1 truncate">{route.summary}</p>
                <div className="flex gap-1.5 mt-1.5">
                  {route.hasTolls && (
                    <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400 px-1.5 py-0">
                      Toll
                    </Badge>
                  )}
                  {i === 0 && (
                    <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400 px-1.5 py-0">
                      Recommended
                    </Badge>
                  )}
                </div>
              </button>
            ))}

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={onStartNavigation}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9"
              >
                <Navigation className="w-4 h-4 mr-1.5" />
                Start Navigation
              </Button>
              <Button
                size="sm"
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
                className="border-white/20 text-white/60 hover:text-white text-xs h-9"
              >
                <BookmarkPlus className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onClearRoute}
                className="border-white/20 text-white/40 hover:text-red-400 text-xs h-9"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Turn-by-turn steps */}
            <div className="pt-2 border-t border-white/10">
              <p className="text-xs text-white/50 font-medium mb-2">Turn-by-turn</p>
              {routes[selectedRouteIndex]?.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-2 py-1.5 border-b border-white/5 last:border-0">
                  <span className="text-xs text-white/30 w-5 text-right flex-shrink-0">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-white/80">{step.instruction}</p>
                    <p className="text-[10px] text-white/30">{formatDistance(step.distance)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Favorites Section */}
        {routes.length === 0 && (
          <div className="p-3 space-y-3">
            {/* Favorites */}
            <div>
              <button
                onClick={() => setShowFavorites(!showFavorites)}
                className="flex items-center gap-2 w-full text-left mb-2"
              >
                <Star className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-white/70">Favorites</span>
                <span className="text-[10px] text-white/30 ml-auto">{favorites.length}</span>
                {showFavorites ? <ChevronUp className="w-3 h-3 text-white/30" /> : <ChevronDown className="w-3 h-3 text-white/30" />}
              </button>
              {showFavorites && favorites.length > 0 && (
                <div className="space-y-1">
                  {favorites.map(fav => (
                    <div key={fav.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 group">
                      <Star className="w-3 h-3 text-amber-400 flex-shrink-0" />
                      <button
                        className="flex-1 text-left min-w-0"
                        onClick={() => onSetDestination({ lat: fav.lat, lng: fav.lng, name: fav.name })}
                      >
                        <p className="text-xs text-white/80 truncate">{fav.name}</p>
                        {fav.address && <p className="text-[10px] text-white/30 truncate">{fav.address}</p>}
                      </button>
                      <button
                        onClick={() => onRemoveFavorite(fav.id)}
                        className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent searches */}
            <div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 w-full text-left mb-2"
              >
                <History className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-white/70">Recent</span>
                <span className="text-[10px] text-white/30 ml-auto">{searchHistory.length}</span>
                {showHistory ? <ChevronUp className="w-3 h-3 text-white/30" /> : <ChevronDown className="w-3 h-3 text-white/30" />}
              </button>
              {showHistory && searchHistory.length > 0 && (
                <div className="space-y-1">
                  {searchHistory.slice(0, 10).map(item => (
                    <button
                      key={item.id}
                      onClick={() => onSelectHistoryItem(item)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 text-left"
                    >
                      <Search className="w-3 h-3 text-white/20 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-white/70 truncate">{item.result_name || item.query}</p>
                        <p className="text-[10px] text-white/30">{new Date(item.searched_at).toLocaleDateString()}</p>
                      </div>
                    </button>
                  ))}
                  {searchHistory.length > 0 && (
                    <button onClick={onClearHistory} className="text-[10px] text-red-400/60 hover:text-red-400 px-2 py-1">
                      Clear history
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Route history */}
            {routeHistory.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Route className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-semibold text-white/70">Past Routes</span>
                  <span className="text-[10px] text-white/30 ml-auto">{routeHistory.length}</span>
                </div>
                <div className="space-y-1">
                  {routeHistory.slice(0, 5).map(item => (
                    <button
                      key={item.id}
                      onClick={() => onSelectRouteHistory(item)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 text-left"
                    >
                      <ArrowRight className="w-3 h-3 text-white/20 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-white/70 truncate">{item.origin_name} → {item.destination_name}</p>
                        <p className="text-[10px] text-white/30">
                          {item.distance_meters ? formatDistance(item.distance_meters) : ''} · {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
});
