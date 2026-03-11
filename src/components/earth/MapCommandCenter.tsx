import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ChevronUp, ChevronDown, Camera, Square, Play, Trash2, Gift, Film, X, MapPin, Building, Globe2, Sparkles, Send, Loader2, HardDrive, ArrowUpCircle, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useRecordingSessions, RecordingSession } from '@/stores/useRecordingSessions';
import { useStorageUsage } from '@/hooks/useStorageUsage';
import { useAuth } from '@/contexts/AuthContext';
import { formatBytes } from '@/lib/storage-plans';
import { Resource } from '@/hooks/useResources';
import mapboxgl from 'mapbox-gl';
import geniusAILogo from '@/assets/genius-ai-logo.png';
import ReactMarkdown from 'react-markdown';
import { CameraVideoPlayer } from './CameraVideoPlayer';

interface MapCommandCenterProps {
  map: mapboxgl.Map | null;
  perks: Resource[];
  allResources?: Resource[];
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

// Build the Genius AI system prompt for map navigation
function buildMapSystemPrompt(resources?: Resource[]) {
  const resourceContext = resources?.map(r =>
    `- **${r.title}** (${r.resource_type.replace(/_/g, ' ')})${r.city ? ` — ${r.city}${r.country ? ', ' + r.country : ''}` : ''} | ID: ${r.id}${r.website_url ? ` | Website: ${r.website_url}` : ''}`
  ).join('\n') || 'No resources loaded yet.';

  return `You are **Genius AI** that controls a 4D interactive globe with CCTV cameras, traffic sensors, transit vehicles, maritime vessels, buildings, and resources worldwide.

## NAV COMMAND FORMATS (FIRST LINE MUST BE ONE OF THESE):

### 1. Navigate to a RESOURCE (office, lab, coworking, etc.):
<!--NAV:/resources?search=SEARCH_TERM&id=BEST_MATCH_RESOURCE_ID-->

### 2. Navigate to a LOCATION (street, building, city, landmark, address):
<!--NAV:/map?place=PLACE_NAME&lat=LATITUDE&lng=LONGITUDE&zoom=ZOOM_LEVEL-->
- For streets/buildings use zoom 17-19
- For neighborhoods use zoom 14-16
- For cities use zoom 11-13
- You MUST provide approximate lat/lng coordinates for the place.
- Examples:
  - Times Square NYC: <!--NAV:/map?place=Times Square&lat=40.758&lng=-73.9855&zoom=17-->
  - Eiffel Tower: <!--NAV:/map?place=Eiffel Tower&lat=48.8584&lng=2.2945&zoom=18-->

### 3. Navigate to a CCTV CAMERA area:
<!--NAV:/map?place=AREA_NAME&lat=LATITUDE&lng=LONGITUDE&zoom=13&layer=cctv-->

### 4. Navigate to TRAFFIC data:
<!--NAV:/map?place=AREA_NAME&lat=LATITUDE&lng=LONGITUDE&zoom=12&layer=sensors-->

### 5. Navigate to TRANSIT vehicles:
<!--NAV:/map?place=CITY_NAME&lat=LATITUDE&lng=LONGITUDE&zoom=12&layer=transit-->

## RULES:
1. FIRST line MUST be a NAV command. Always.
2. After the NAV command, write a SHORT 1-2 sentence summary.
3. NEVER show raw links. The map navigates AUTOMATICALLY.
4. Keep response under 200 chars (excluding NAV tag).
5. If the user asks for a CCTV camera, use layer=cctv.
6. If the user asks to "take me to", "show me", "go to" ANY place on Earth — use the /map NAV.
7. You know world geography. Provide accurate lat/lng for any city, street, landmark, or building.

AVAILABLE RESOURCES:
${resourceContext}

4D MAP LAYERS: CCTV Cameras (worldwide), Traffic Sensors (PeMS, NYC, Seattle), Transit Vehicles (10 cities GTFS-RT), AIS Maritime Vessels, Earth Intelligence (weather, SST, vegetation), Road Sensors.`;
}

export const MapCommandCenter = ({
  map,
  perks,
  allResources,
  onPlaySession,
  onSelectResource,
  isLeftPanelOpen,
}: MapCommandCenterProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);
  const { sessions, stopSession, removeSession, loadDbSessions } = useRecordingSessions();
  const { user } = useAuth();
  const { usage } = useStorageUsage();
  const [expandedSession, setExpandedSession] = useState<RecordingSession | null>(null);
  const [expandedSnapIndex, setExpandedSnapIndex] = useState(0);

  // Load persisted sessions from DB
  useEffect(() => {
    if (user?.id) {
      loadDbSessions(user.id);
    }
  }, [user?.id, loadDbSessions]);

  const activeSessions = sessions.filter(s => !s.stoppedAt);
  const closedSessions = sessions.filter(s => s.stoppedAt !== null);

  // Debounced Mapbox Geocoding search (type-ahead suggestions only)
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    setAiResponse(null);
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

  // Process NAV commands from Genius AI response
  const processNavCommand = useCallback((fullText: string) => {
    const navMatch = fullText.match(/<!--NAV:(\/[^>]+)-->/);
    if (!navMatch) return;

    const navPath = navMatch[1];
    try {
      const url = new URL(navPath, window.location.origin);
      const isMapNav = navPath.startsWith('/map');
      const isResourceNav = navPath.startsWith('/resources');

      if (isMapNav && map) {
        const lat = parseFloat(url.searchParams.get('lat') || '0');
        const lng = parseFloat(url.searchParams.get('lng') || '0');
        const zoom = parseFloat(url.searchParams.get('zoom') || '14');
        const layer = url.searchParams.get('layer') || '';

        if (layer) {
          window.dispatchEvent(new CustomEvent('genius-map-navigate', {
            detail: { lat, lng, zoom, layer, place: url.searchParams.get('place') || '' }
          }));
        }

        if (lat && lng) {
          map.flyTo({ center: [lng, lat], zoom, duration: 2500, essential: true });
        }
      } else if (isResourceNav) {
        const searchTerm = url.searchParams.get('search') || '';
        const resourceId = url.searchParams.get('id') || '';
        window.dispatchEvent(new CustomEvent('genius-resource-navigate', {
          detail: { search: searchTerm, resourceId }
        }));
      }
    } catch {
      // silent
    }
  }, [map]);

  // Submit search - try Mapbox geocoding first, fall back to Genius AI
  const handleSubmit = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query || isAiLoading) return;

    setShowSuggestions(false);
    setSuggestions([]);

    try {
      const token = mapboxgl.accessToken;
      const resp = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&limit=1&types=country,region,place,locality,neighborhood,address,poi`
      );
      const data = await resp.json();

      const isQuestion = /\b(show me|find|where|take me|cameras|cctv|sensors|transit|traffic|what|how|which|list|nearby)\b/i.test(query);
      if (!isQuestion && data.features?.length > 0 && data.features[0].relevance > 0.8) {
        handleSelectSuggestion(data.features[0]);
        return;
      }
    } catch {
      // proceed to AI
    }

    setIsAiLoading(true);
    setAiResponse(null);

    try {
      const systemOverride = buildMapSystemPrompt(allResources);
      const messagesPayload = [{ role: 'user', content: query }];

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lightpaper-genius`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: messagesPayload, systemOverride }),
        }
      );

      if (!resp.ok || !resp.body) throw new Error('Stream failed');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) {
              fullText += c;
              const cleanDisplay = fullText.replace(/<!--NAV:[^>]+-->\n?/g, '').trim();
              setAiResponse(cleanDisplay || null);
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Flush remaining
      for (const raw of textBuffer.split('\n')) {
        if (!raw || raw.startsWith(':') || raw.trim() === '') continue;
        if (!raw.startsWith('data: ')) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === '[DONE]') continue;
        try {
          const c = JSON.parse(jsonStr).choices?.[0]?.delta?.content;
          if (c) {
            fullText += c;
          }
        } catch { /* ignore */ }
      }

      if (fullText) {
        processNavCommand(fullText);
        const cleanDisplay = fullText.replace(/<!--NAV:[^>]+-->\n?/g, '').trim();
        setAiResponse(cleanDisplay || null);
      }
    } catch (e) {
      console.error('Genius AI map search error:', e);
      setAiResponse('Unable to process your request. Try a simpler search.');
    } finally {
      setIsAiLoading(false);
    }
  }, [searchQuery, isAiLoading, allResources, handleSelectSuggestion, processNavCommand]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

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
              ref={inputRef}
              type="text"
              placeholder="Search locations, cameras, or ask Genius AI..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              className="w-full pl-9 pr-10 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/30 transition-all"
            />
            {searchQuery && !isAiLoading && (
              <button
                onClick={() => { setSearchQuery(''); setSuggestions([]); setShowSuggestions(false); setAiResponse(null); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute bottom-full mb-2 left-0 right-0 bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden shadow-2xl z-50">
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

          {/* Submit / Genius AI button */}
          <button
            onClick={handleSubmit}
            disabled={!searchQuery.trim() || isAiLoading}
            className={cn(
              "p-2 rounded-xl transition-all flex items-center justify-center flex-shrink-0",
              searchQuery.trim() && !isAiLoading
                ? "bg-gradient-to-r from-purple-500/80 to-blue-500/80 text-white hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-500/20"
                : "bg-white/5 text-white/20 cursor-not-allowed"
            )}
            title="Search with Genius AI (Enter)"
          >
            {isAiLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>

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

        {/* AI Response inline banner */}
        {(aiResponse || isAiLoading) && (
          <div className="mx-3 mb-2 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 flex items-start gap-2">
            <img src={geniusAILogo} alt="" className="w-5 h-5 rounded-full mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              {isAiLoading && !aiResponse ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />
                  <span className="text-[11px] text-purple-300">Genius is thinking...</span>
                </div>
              ) : aiResponse ? (
                <div className="text-[11px] text-white/80 prose prose-invert prose-xs max-w-none [&>p]:m-0 [&>p]:leading-relaxed">
                  <ReactMarkdown>{aiResponse}</ReactMarkdown>
                </div>
              ) : null}
            </div>
            {!isAiLoading && aiResponse && (
              <button
                onClick={() => setAiResponse(null)}
                className="text-white/30 hover:text-white/60 flex-shrink-0 mt-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

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
                    {/* Storage Usage Bar */}
                    {usage && (
                      <div className="rounded-xl p-2.5 bg-white/5 border border-white/10 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-[10px] text-white/60 font-medium">Storage</span>
                          </div>
                          <span className="text-[10px] text-white/50">
                            {formatBytes(usage.totalBytesUsed)} / {formatBytes(usage.planLimitBytes)}
                          </span>
                        </div>
                        <Progress
                          value={usage.percentUsed}
                          className={cn(
                            "h-1.5",
                            usage.isOverLimit ? "[&>div]:bg-red-500" : usage.percentUsed > 80 ? "[&>div]:bg-amber-500" : "[&>div]:bg-blue-500"
                          )}
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-white/30 capitalize">{usage.storagePlan} Plan</span>
                          {usage.isOverLimit && (
                            <span className="text-[9px] text-red-400 font-medium">
                              +{usage.overageGb} GB overage • ${(usage.overageGb * 2.5).toFixed(2)}
                            </span>
                          )}
                          {usage.percentUsed > 80 && !usage.isOverLimit && (
                            <button className="flex items-center gap-0.5 text-[9px] text-blue-400 hover:text-blue-300 transition-colors">
                              <ArrowUpCircle className="w-3 h-3" />
                              Upgrade
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {sessions.length === 0 ? (
                      <div className="text-center py-8">
                        <Camera className="w-8 h-8 text-white/20 mx-auto mb-2" />
                        <p className="text-xs text-white/40">No recording sessions</p>
                        <p className="text-[10px] text-white/25 mt-1">Open a CCTV camera and hit Record to start</p>
                      </div>
                    ) : (
                      <>
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
                            onExpand={() => { setExpandedSession(session); setExpandedSnapIndex(Math.max(0, session.snapshots.length - 1)); }}
                            formatDuration={formatDuration}
                            formatTime={formatTime}
                          />
                        ))}

                        {activeSessions.length > 0 && closedSessions.length > 0 && (
                          <div className="border-t border-white/10 my-1" />
                        )}

                        {closedSessions.map(session => (
                          <StudioSessionRow
                            key={session.id}
                            session={session}
                            isActive={false}
                            onStop={() => {}}
                            onPlay={() => onPlaySession(session)}
                            onRemove={() => removeSession(session.id)}
                            onExpand={() => { setExpandedSession(session); setExpandedSnapIndex(Math.max(0, session.snapshots.length - 1)); }}
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

      {/* Fullscreen Session Viewer */}
      {expandedSession && (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-black/90 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <Camera className="w-4 h-4 text-red-400" />
              <span className="text-sm text-white font-medium">{expandedSession.cameraName}</span>
              {!expandedSession.stoppedAt && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/20 border border-red-500/30">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] text-red-400 font-bold">LIVE</span>
                </div>
              )}
              <span className="text-xs text-white/40 font-mono">
                {new Date(expandedSession.startedAt).toLocaleString()}
              </span>
              {expandedSession.totalSizeBytes ? (
                <span className="text-xs text-purple-400/70 font-mono">{formatBytes(expandedSession.totalSizeBytes)}</span>
              ) : null}
              <span className="text-xs text-white/30 font-mono">
                {expandedSession.snapshots.length} frames
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!expandedSession.stoppedAt ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    stopSession(expandedSession.id);
                    setExpandedSession({ ...expandedSession, stoppedAt: Date.now() });
                  }}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/20 h-8 text-xs"
                >
                  <Square className="w-3.5 h-3.5 mr-1.5 fill-current" /> Stop
                </Button>
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  removeSession(expandedSession.id);
                  setExpandedSession(null);
                }}
                className="text-white/30 hover:text-red-400 hover:bg-red-500/10 h-8 text-xs"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
              </Button>
              <button
                onClick={() => setExpandedSession(null)}
                className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
                title="Close (Esc)"
              >
                <X className="w-7 h-7" />
              </button>
            </div>
          </div>

          {/* Full video player with all controls */}
          <div className="flex-1 min-h-0 flex flex-col">
            <CameraVideoPlayer
              snapshots={expandedSession.snapshots}
              onClose={() => setExpandedSession(null)}
              fullscreen
            />
          </div>
        </div>
      )}
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
  onExpand: () => void;
  formatDuration: (start: number, end?: number | null) => string;
  formatTime: (ts: number) => string;
}

const StudioSessionRow = ({ session, isActive, onStop, onPlay, onRemove, onExpand, formatDuration, formatTime }: StudioSessionRowProps) => {
  const latestSnap = session.snapshots[session.snapshots.length - 1];
  const sizeDisplay = session.totalSizeBytes ? formatBytes(session.totalSizeBytes) : null;

  return (
    <div
      className={cn(
        "rounded-xl p-2.5 transition-colors flex items-center gap-3 cursor-pointer",
        isActive ? "bg-red-500/10 border border-red-500/20" : "bg-white/5 border border-white/10 hover:bg-white/10"
      )}
      onClick={onExpand}
    >
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
            {session.snapshotCount || session.snapshots.length} frames
          </span>
          {sizeDisplay && (
            <>
              <span className="text-[9px] text-white/30">·</span>
              <span className="text-[9px] text-purple-400/70 font-mono">{sizeDisplay}</span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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
          title="Remove"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};
