import { X, RefreshCw, Camera, ExternalLink, MapPin, Clock, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrafficCamera } from '@/hooks/useTrafficCameras';
import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface TrafficCameraPopupProps {
  camera: TrafficCamera;
  onClose: () => void;
}

export const TrafficCameraPopup = ({ camera, onClose }: TrafficCameraPopupProps) => {
  const [imageKey, setImageKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
  const [proxyUrl, setProxyUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Build proxied image URL
  useEffect(() => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'zqiihhmdsdgwdcwmryym';
    const fnUrl = `https://${projectId}.supabase.co/functions/v1/proxy-camera-image`;
    setProxyUrl(fnUrl);
    setImageError(false);
    setImageKey(0);
  }, [camera.id]);

  // Auto-refresh every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      setImageKey(k => k + 1);
      setLastRefreshTime(new Date());
      setImageError(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setImageKey(k => k + 1);
    setLastRefreshTime(new Date());
    setImageError(false);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Use proxy URL to fetch camera image
  const imageUrl = proxyUrl
    ? `${proxyUrl}?url=${encodeURIComponent(camera.imageUrl)}&_t=${Date.now()}_${imageKey}`
    : camera.imageUrl;

  return (
    <div className={cn(
      "absolute right-2 top-2 bottom-2 z-30 transition-all duration-300 translate-x-0 opacity-100",
      isFullscreen ? "left-2 w-auto" : "w-[420px] max-w-[90vw]"
    )}>
      <div className="h-full backdrop-blur-3xl bg-black/70 border border-white/20 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <Camera className="w-4 h-4 text-red-400" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-medium text-white truncate block">{camera.name}</span>
              <span className="text-[10px] text-white/50">{camera.source}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10 rounded-lg"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10 rounded-lg"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10 rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Live Image - takes most space */}
        <div className="relative flex-1 min-h-0 bg-black">
          <img
            key={imageKey}
            src={imageUrl}
            alt={camera.name}
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).alt = 'Camera feed unavailable';
            }}
          />
          {/* Live indicator */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/90 backdrop-blur">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-[11px] text-white font-bold tracking-wider">LIVE</span>
          </div>
          {/* Refresh countdown */}
          <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/60 backdrop-blur">
            <span className="text-[10px] text-white/70 font-mono">5s refresh</span>
          </div>
        </div>

        {/* Metadata Panel */}
        <div className="flex-shrink-0 border-t border-white/10">
          <ScrollArea className="max-h-[200px]">
            <div className="p-3 space-y-3">
              {/* Coordinates */}
              <div className="flex items-start gap-2 text-xs">
                <MapPin className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white/80 font-medium">Location</p>
                  <p className="text-white/50 font-mono text-[11px]">
                    {camera.lat.toFixed(6)}, {camera.lng.toFixed(6)}
                  </p>
                </div>
              </div>

              {/* Last Updated */}
              <div className="flex items-start gap-2 text-xs">
                <Clock className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white/80 font-medium">Last Refresh</p>
                  <p className="text-white/50 text-[11px]">
                    {lastRefreshTime.toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Source Badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-[10px] border-white/20 text-white/60 bg-white/5">
                  Source: {camera.source}
                </Badge>
                <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-400 bg-red-500/10">
                  Auto-refreshing
                </Badge>
              </div>

              {/* Open Feed Link */}
              {camera.imageUrl && (
                <a
                  href={camera.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition w-fit"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open original feed
                </a>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};
