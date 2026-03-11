import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ChevronUp, ChevronDown, Camera, Square, Play, Trash2, Gift, Film, X, MapPin, Building, Globe2, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useRecordingSessions, RecordingSession } from '@/stores/useRecordingSessions';
import { Resource } from '@/hooks/useResources';
import mapboxgl from 'mapbox-gl';

interface MapCommandCenterProps {
  map: mapboxgl.Map | null;
  perks: Resource[];
  onPlaySession: (session: RecordingSession) => void;
  onSelectResource: (resource: Resource) => void;
  isLeftPanelOpen: boolean;
}

const ZOOM_BY_TYPE: Record<string, number> = {
  country: 4,
  region: 6,
  place: 10,
  district: 12,
  locality: 13,
  neighborhood: 14,
  address: 16,
  poi: 15,
  postcode: 13,
};

export const MapCommandCenter = ({
  map,
  perks,
  onPlaySession,
  onSelectResource,
  isLeftPanelOpen,
}: MapCommandCenterProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const { sessions, stopSession, removeSession } = useRecordingSessions();

  const activeSessions = sessions.filter(s => !s.stoppedAt);
  const closedSessions = sessions.filter(s => s.stoppedAt !== null);

  // Debounced Mapbox Geocoding search
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const token = mapboxgl.accessToken;
        const resp = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&limit=6&types=country,region,place,locality,neighborhood,address,poi`
        );
        const data = await resp.json();
        if (data.features) {
          setSuggestions(data.features);
          setShowSuggestions(true);
        }
      } catch {
        // silent fail
      }
    }, 300);
  }, []);

  const handleSelectSuggestion = useCallback((feature: any) => {
    if (!map) return;
    const [lng, lat] = feature.center;
    const placeType = feature.place_type?.[0] || 'place';
    const zoom = ZOOM_BY_TYPE[placeType] || 12;

    map.flyTo({ center: [lng, lat], zoom, duration: 2000 });
    setSearchQuery(feature.place_name || feature.text);
    setShowSuggestions(false);
    setSuggestions([]);
  }, [map]);

  const getPlaceIcon = (type: string) => {
    switch (type) {
      case 'poi': return <MapPin className="w-3.5 h-3.5 text-red-400" />;
      case 'address': return <Building className="w-3.5 h-3.5 text-blue-400" />;
      case 'country':
      case 'region': return <Globe2 className="w-3.5 h-3.5 text-emerald-400" />;
      default: return <MapPin className="w-3.5 h-3.5 text-white/40" />;
    }
  };

  const formatDuration = (startMs: number, endMs?: number | null) => {
    const ms = (endMs || Date.now()) - startMs;
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
  };

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString();

  // Force re-render for live durations
  const [, setTick] = useState(0);
  useEffect(() => {
    if (activeSessions.length === 0) return;
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [activeSessions.length]);

  return (
    <div
      className={cn(
        "absolute bottom-4 z-10 pointer-events-auto transition-all duration-300",
        isLeftPanelOpen ? "left-[348px] right-4" : "left-4 right-4"
      )}
    >
      <div className="tech-card border-0 backdrop-blur-3xl bg-white/10 dark:bg-black/80 border border-white/20 rounded-2xl shadow-2xl relative">
        {/* Search Bar - always visible */}
        <div className="p-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search locations, POIs, or ask Genius AI..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/30 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setSuggestions([]); setShowSuggestions(false); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute bottom-full mb-2 left-0 right-0 bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden shadow-2xl">
                {suggestions.map((feat, i) => (
                  <button
                    key={feat.id || i}
                    onClick={() => handleSelectSuggestion(feat)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/10 transition-colors text-left"
                  >
                    {getPlaceIcon(feat.place_type?.[0])}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white/90 font-medium truncate">{feat.text}</div>
                      <div className="text-[10px] text-white/40 truncate">{feat.place_name}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active recording indicator */}
          {activeSessions.length > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-500/20 border border-red-500/30">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] text-red-400 font-medium">{activeSessions.length} REC</span>
            </div>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white/80"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Expanded content with tabs */}
        {isExpanded && (
          <div className="border-t border-white/10">
            <Tabs defaultValue="studio" className="w-full">
              <TabsList className="w-full bg-transparent border-b border-white/10 rounded-none h-9 mt-0 p-0">
                <TabsTrigger
                  value="studio"
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-red-400 data-[state=active]:bg-transparent data-[state=active]:text-red-400 text-white/50 text-xs h-9"
                >
                  <Film className="w-3.5 h-3.5 mr-1.5" />
                  Studio
                  {sessions.length > 0 && (
                    <Badge className="ml-1.5 text-[9px] bg-white/10 border-white/20 text-white/60 px-1.5 py-0">
                      {sessions.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="perks"
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-green-400 data-[state=active]:bg-transparent data-[state=active]:text-green-400 text-white/50 text-xs h-9"
                >
                  <Gift className="w-3.5 h-3.5 mr-1.5" />
                  Perks
                  {perks.length > 0 && (
                    <Badge className="ml-1.5 text-[9px] bg-white/10 border-white/20 text-white/60 px-1.5 py-0">
                      {perks.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Studio Tab */}
              <TabsContent value="studio" className="mt-0">
                <ScrollArea className="max-h-[40vh]">
                  <div className="p-3 space-y-2">
                    {sessions.length === 0 ? (
                      <div className="text-center py-8">
                        <Camera className="w-8 h-8 text-white/20 mx-auto mb-2" />
                        <p className="text-xs text-white/40">No recording sessions</p>
                        <p className="text-[10px] text-white/25 mt-1">Open a CCTV camera and hit Record to start</p>
                      </div>
                    ) : (
                      <>
                        {/* Active sessions */}
                        {activeSessions.map(session => (
                          <StudioSessionRow
                            key={session.id}
                            session={session}
                            isActive
                            onStop={() => stopSession(session.id)}
                            onPlay={() => {
                              stopSession(session.id);
                              onPlaySession(session);
                            }}
                            onRemove={() => removeSession(session.id)}
                            formatDuration={formatDuration}
                            formatTime={formatTime}
                          />
                        ))}

                        {activeSessions.length > 0 && closedSessions.length > 0 && (
                          <div className="border-t border-white/10 my-1" />
                        )}

                        {/* Closed sessions */}
                        {closedSessions.map(session => (
                          <StudioSessionRow
                            key={session.id}
                            session={session}
                            isActive={false}
                            onStop={() => {}}
                            onPlay={() => onPlaySession(session)}
                            onRemove={() => removeSession(session.id)}
                            formatDuration={formatDuration}
                            formatTime={formatTime}
                          />
                        ))}
                      </>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Perks Tab */}
              <TabsContent value="perks" className="mt-0">
                <ScrollArea className="max-h-[40vh]">
                  <div className="p-3">
                    {perks.length === 0 ? (
                      <div className="text-center py-8">
                        <Gift className="w-8 h-8 text-white/20 mx-auto mb-2" />
                        <p className="text-xs text-white/40">No perks available</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {perks.map(perk => (
                          <Card
                            key={perk.id}
                            className="tech-card border-0 cursor-pointer hover:ring-1 hover:ring-green-500/50 transition-all"
                            onClick={() => onSelectResource(perk)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2">
                                {perk.logo_url ? (
                                  <img src={perk.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                                ) : (
                                  <Gift className="w-6 h-6 text-green-400 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-xs truncate">{perk.title}</h4>
                                  {perk.is_official_partner && (
                                    <span className="text-[10px] text-amber-400">⭐ Partner</span>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Studio Session Row ---
interface StudioSessionRowProps {
  session: RecordingSession;
  isActive: boolean;
  onStop: () => void;
  onPlay: () => void;
  onRemove: () => void;
  formatDuration: (start: number, end?: number | null) => string;
  formatTime: (ts: number) => string;
}

const StudioSessionRow = ({ session, isActive, onStop, onPlay, onRemove, formatDuration, formatTime }: StudioSessionRowProps) => {
  const latestSnap = session.snapshots[session.snapshots.length - 1];

  return (
    <div className={cn(
      "rounded-xl p-2.5 transition-colors flex items-center gap-3",
      isActive ? "bg-red-500/10 border border-red-500/20" : "bg-white/5 border border-white/10 hover:bg-white/10"
    )}>
      {/* Thumbnail */}
      <div className="w-16 h-10 rounded-lg overflow-hidden bg-black/40 flex-shrink-0 relative">
        {latestSnap ? (
          <img src={latestSnap.url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera className="w-4 h-4 text-white/20" />
          </div>
        )}
        {isActive && (
          <div className="absolute top-0.5 right-0.5 flex items-center gap-0.5 bg-red-600/90 rounded px-1 py-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[7px] text-white font-bold">REC</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Camera className="w-3 h-3 text-white/40 flex-shrink-0" />
          <span className="text-[11px] text-white/80 font-medium truncate">{session.cameraName}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] text-white/40 font-mono">
            {formatTime(session.startedAt)}
          </span>
          <span className="text-[9px] text-white/30">·</span>
          <span className="text-[9px] text-white/40 font-mono">
            {formatDuration(session.startedAt, session.stoppedAt)}
          </span>
          <span className="text-[9px] text-white/30">·</span>
          <span className="text-[9px] text-blue-400/70 font-mono">
            {session.snapshots.length} frames
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {isActive ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onStop}
            className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg"
            title="Stop recording"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={onPlay}
            className="h-7 w-7 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded-lg"
            title="Play session"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-7 w-7 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
          title="Delete session"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};
