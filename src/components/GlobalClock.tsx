import { useState, useEffect, useCallback } from "react";
import { Clock, MapPin, Search, Plus, X, Play, Pause, RotateCcw, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  searchTimezones,
  getTimeInTimezone,
  getTimezoneAbbreviation,
  getTimezoneOffset,
  getUserTimezone,
  parseTimezone,
  getCountryForTimezone,
  getFlagForTimezone,
  TimezoneInfo,
} from "@/lib/timezoneUtils";

const STORAGE_KEY = "globalClock_pinnedTimezones";

export function GlobalClock() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userTimezone] = useState(getUserTimezone());
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TimezoneInfo[]>([]);
  const [pinnedTimezones, setPinnedTimezones] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  
  // Timer state
  const [timerMode, setTimerMode] = useState<'stopwatch' | 'countdown'>('stopwatch');
  const [timerValue, setTimerValue] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [countdownPreset, setCountdownPreset] = useState(0);

  // Load pinned timezones from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setPinnedTimezones(JSON.parse(saved));
      } catch {
        setPinnedTimezones([]);
      }
    }
  }, []);

  // Save pinned timezones to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pinnedTimezones));
  }, [pinnedTimezones]);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerValue(prev => {
          if (timerMode === 'countdown') {
            if (prev <= 0) {
              setIsTimerRunning(false);
              return 0;
            }
            return prev - 1000;
          }
          return prev + 1000;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerMode]);

  // Detect user location
  useEffect(() => {
    const { city } = parseTimezone(userTimezone);
    const country = getCountryForTimezone(userTimezone);
    setUserLocation(`${city}, ${country}`);
  }, [userTimezone]);

  // Search handler with debounce
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = searchTimezones(searchQuery);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const formatTime = useCallback((date: Date, tz?: string) => {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: tz,
    };
    return new Intl.DateTimeFormat('en-US', options).format(date);
  }, []);

  const formatDate = useCallback((date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }, []);

  const formatTimer = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePinnedTimezone = (tzId: string) => {
    setPinnedTimezones(prev => {
      if (prev.includes(tzId)) {
        return prev.filter(tz => tz !== tzId);
      }
      if (prev.length >= 4) {
        return [...prev.slice(1), tzId];
      }
      return [...prev, tzId];
    });
  };

  const startCountdown = (minutes: number) => {
    setTimerMode('countdown');
    setTimerValue(minutes * 60 * 1000);
    setCountdownPreset(minutes);
    setIsTimerRunning(true);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerValue(timerMode === 'countdown' ? countdownPreset * 60 * 1000 : 0);
  };

  const timezoneAbbr = getTimezoneAbbreviation(userTimezone);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="neon-glow hover:scale-105 transition-all duration-300 h-9 sm:h-10 px-2 sm:px-3 gap-1.5 sm:gap-2 group relative overflow-hidden"
          title="Global Clock & Timer"
        >
          {/* Metallic border effect */}
          <div className="absolute inset-0 rounded-md bg-gradient-to-br from-amber-500/20 via-transparent to-slate-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <Clock className="h-4 w-4 text-amber-500 group-hover:text-amber-400 transition-colors" />
          <span className="font-mono text-xs sm:text-sm font-medium tabular-nums tracking-tight">
            {formatTime(currentTime)}
          </span>
          <span className="hidden sm:inline text-[10px] text-muted-foreground font-medium">
            {timezoneAbbr}
          </span>
          <MapPin className="h-3 w-3 text-muted-foreground hidden lg:inline" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-[340px] sm:w-[380px] p-0 overflow-hidden border-2 border-amber-500/20 bg-gradient-to-br from-background via-background to-muted/30" 
        align="end"
        sideOffset={8}
      >
        {/* Header with main time */}
        <div className="relative p-4 pb-3 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.1),transparent_70%)]" />
          
          <div className="relative text-center">
            <div className="text-xs text-amber-400/80 font-medium tracking-widest mb-1">
              GLOBAL TIME
            </div>
            
            {/* Main clock display */}
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute inset-0 -m-2 rounded-full border border-amber-500/30" />
              <div className="font-mono text-4xl font-bold tracking-tight tabular-nums text-slate-100">
                {formatTime(currentTime)}
              </div>
            </div>
            
            <div className="mt-2 text-sm text-slate-300">
              {formatDate(currentTime)}
            </div>
            
            <div className="mt-1 flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <MapPin className="h-3 w-3" />
              <span>{userLocation}</span>
              <span className="text-amber-400">({timezoneAbbr})</span>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="world" className="w-full">
          <TabsList className="w-full rounded-none border-b bg-muted/30 h-9">
            <TabsTrigger value="world" className="flex-1 text-xs">World Clock</TabsTrigger>
            <TabsTrigger value="timer" className="flex-1 text-xs">Timer</TabsTrigger>
          </TabsList>
          
          <TabsContent value="world" className="mt-0 p-3 space-y-3">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search countries, cities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm bg-muted/50"
              />
            </div>
            
            {/* Search results */}
            {searchResults.length > 0 && (
              <ScrollArea className="h-[140px] rounded-md border bg-muted/30">
                <div className="p-1">
                  {searchResults.map((tz) => (
                    <div
                      key={tz.id}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg">{tz.flag}</span>
                        <div className="truncate">
                          <div className="text-sm font-medium truncate">{tz.city}</div>
                          <div className="text-xs text-muted-foreground">{tz.country}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="font-mono text-sm tabular-nums">
                            {getTimeInTimezone(tz.id)}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {getTimezoneOffset(tz.id)}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => togglePinnedTimezone(tz.id)}
                        >
                          {pinnedTimezones.includes(tz.id) ? (
                            <X className="h-3.5 w-3.5 text-destructive" />
                          ) : (
                            <Plus className="h-3.5 w-3.5 text-primary" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            
            {/* Pinned timezones */}
            {pinnedTimezones.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Pinned Clocks
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {pinnedTimezones.map((tzId) => {
                    const { city } = parseTimezone(tzId);
                    const flag = getFlagForTimezone(tzId);
                    return (
                      <div
                        key={tzId}
                        className="relative p-2 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 group"
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive/80 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => togglePinnedTimezone(tzId)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-sm">{flag}</span>
                          <span className="text-xs font-medium truncate">{city}</span>
                        </div>
                        <div className="font-mono text-lg font-semibold tabular-nums">
                          {getTimeInTimezone(tzId)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {getTimezoneAbbreviation(tzId)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {pinnedTimezones.length === 0 && searchResults.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Search for cities to add clocks</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="timer" className="mt-0 p-3 space-y-4">
            {/* Timer mode tabs */}
            <div className="flex gap-2">
              <Button
                variant={timerMode === 'stopwatch' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => {
                  setTimerMode('stopwatch');
                  setIsTimerRunning(false);
                  setTimerValue(0);
                }}
              >
                <Timer className="h-4 w-4 mr-1.5" />
                Stopwatch
              </Button>
              <Button
                variant={timerMode === 'countdown' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => {
                  setTimerMode('countdown');
                  setIsTimerRunning(false);
                  setTimerValue(0);
                }}
              >
                <Clock className="h-4 w-4 mr-1.5" />
                Countdown
              </Button>
            </div>
            
            {/* Timer display */}
            <div className="text-center py-4">
              <div className="font-mono text-4xl font-bold tabular-nums">
                {formatTimer(timerValue)}
              </div>
            </div>
            
            {/* Countdown presets */}
            {timerMode === 'countdown' && !isTimerRunning && timerValue === 0 && (
              <div className="grid grid-cols-4 gap-2">
                {[15, 30, 45, 60].map((mins) => (
                  <Button
                    key={mins}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => startCountdown(mins)}
                  >
                    {mins}m
                  </Button>
                ))}
              </div>
            )}
            
            {/* Timer controls */}
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={resetTimer}
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
              <Button
                variant="default"
                size="icon"
                className="h-14 w-14 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                onClick={() => {
                  if (timerMode === 'countdown' && timerValue === 0) {
                    startCountdown(countdownPreset || 15);
                  } else {
                    setIsTimerRunning(!isTimerRunning);
                  }
                }}
              >
                {isTimerRunning ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-0.5" />
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
