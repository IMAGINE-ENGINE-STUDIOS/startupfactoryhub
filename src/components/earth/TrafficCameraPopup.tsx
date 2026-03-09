import { X, RefreshCw, Camera, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrafficCamera } from '@/hooks/useTrafficCameras';
import { useState, useEffect } from 'react';

interface TrafficCameraPopupProps {
  camera: TrafficCamera;
  onClose: () => void;
}

export const TrafficCameraPopup = ({ camera, onClose }: TrafficCameraPopupProps) => {
  const [imageKey, setImageKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      setImageKey(k => k + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setImageKey(k => k + 1);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const imageUrl = camera.imageUrl.includes('?')
    ? `${camera.imageUrl}&_t=${imageKey}`
    : `${camera.imageUrl}?_t=${imageKey}`;

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 w-[360px] max-w-[90vw]">
      <div className="backdrop-blur-3xl bg-black/60 border border-white/20 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-white/10">
          <div className="flex items-center gap-2 min-w-0">
            <Camera className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-sm font-medium text-white truncate">{camera.name}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Badge variant="outline" className="text-[10px] border-white/20 text-white/60">
              {camera.source}
            </Badge>
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

        {/* Live Image */}
        <div className="relative aspect-video bg-black">
          <img
            key={imageKey}
            src={imageUrl}
            alt={camera.name}
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '';
              (e.target as HTMLImageElement).alt = 'Camera feed unavailable';
            }}
          />
          {/* Live indicator */}
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/80 backdrop-blur">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[10px] text-white font-semibold">LIVE</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-2 flex items-center justify-between text-[10px] text-white/40">
          <span>Auto-refreshes every 30s</span>
          {camera.imageUrl && (
            <a
              href={camera.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-white/50 hover:text-white/80 transition"
            >
              <ExternalLink className="w-3 h-3" />
              Open feed
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
