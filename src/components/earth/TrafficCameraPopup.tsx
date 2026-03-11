import { X, RefreshCw, Camera, ExternalLink, MapPin, Clock, Maximize2, Minimize2, Radio, Film, History, Circle, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrafficCamera } from '@/hooks/useTrafficCameras';
import { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useCameraTimeline } from '@/hooks/useCameraTimeline';
import { CameraTimelineScrubber } from './CameraTimelineScrubber';
import { CameraVideoPlayer } from './CameraVideoPlayer';
import { CameraHistoryControls } from './CameraHistoryControls';
import { useRecordingSessions } from '@/stores/useRecordingSessions';

interface TrafficCameraPopupProps {
  camera: TrafficCamera;
  onClose: () => void;
}

function isStreamUrl(url?: string): boolean {
  if (!url) return false;
  return /\.(mjpg|mjpeg|mp4|m3u8)(\?|$)/i.test(url) || /mjpeg|mjpg|stream|video|hls|playlist/i.test(url);
}

function isMjpegStream(url?: string): boolean {
  if (!url) return false;
  return /\.(mjpg|mjpeg)(\?|$)/i.test(url) || /mjpeg|mjpg/i.test(url);
}

function isHlsStream(url?: string): boolean {
  if (!url) return false;
  return /\.m3u8(\?|$)/i.test(url) || /hls|playlist/i.test(url);
}

// Camera popup with timeline/video modes
export const TrafficCameraPopup = ({ camera, onClose }: TrafficCameraPopupProps) => {
  const [imageKey, setImageKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
  const [proxyUrl, setProxyUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [mode, setMode] = useState<'live' | 'timeline' | 'video'>('live');
  const [timelineIndex, setTimelineIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const hasStream = isStreamUrl(camera.streamUrl);
  const isMjpeg = isMjpegStream(camera.streamUrl);
  const refreshRate = Math.max(camera.refreshRate || 10, 1);

  // Recording sessions store
  const { startSession, stopSession, hasActiveSessionForCamera, getActiveSessionForCamera } = useRecordingSessions();
  const activeSession = getActiveSessionForCamera(camera.id);
  const isSessionRecording = hasActiveSessionForCamera(camera.id);

  // Build proxied image URL
  useEffect(() => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'zqiihhmdsdgwdcwmryym';
    const fnUrl = `https://${projectId}.supabase.co/functions/v1/proxy-camera-image`;
    setProxyUrl(fnUrl);
    setImageError(false);
    setImageKey(0);
    setMode('live');
  }, [camera.id]);

  // Timeline hook - records snapshots with persistence
  const timeline = useCameraTimeline({
    imageUrl: camera.imageUrl,
    proxyUrl,
    refreshRate,
    isStream: hasStream,
    cameraId: camera.id,
  });

  const handleToggleSession = () => {
    if (isSessionRecording && activeSession) {
      stopSession(activeSession.id);
    } else if (proxyUrl) {
      startSession({
        cameraId: camera.id,
        cameraName: camera.name,
        proxyUrl,
        imageUrl: camera.imageUrl,
        refreshRate,
      });
    }
  };

  // Auto-refresh for live view
  useEffect(() => {
    if (hasStream || mode !== 'live') return;
    const interval = setInterval(() => {
      setImageKey(k => k + 1);
      setLastRefreshTime(new Date());
      setImageError(false);
    }, refreshRate * 1000);
    return () => clearInterval(interval);
  }, [refreshRate, hasStream, mode]);

  // Keep timeline index at latest when in live mode
  useEffect(() => {
    if (mode === 'live' && timeline.snapshots.length > 0) {
      setTimelineIndex(timeline.snapshots.length - 1);
    }
  }, [mode, timeline.snapshots.length]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setImageKey(k => k + 1);
    setLastRefreshTime(new Date());
    setImageError(false);
    if (videoRef.current) videoRef.current.load();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const imageUrl = proxyUrl
    ? `${proxyUrl}?url=${encodeURIComponent(camera.imageUrl)}&_t=${Date.now()}_${imageKey}`
    : camera.imageUrl;

  const renderFeed = () => {
    // Timeline mode - show historical snapshot
    if (mode === 'timeline' && timeline.snapshots.length > 0) {
      const snap = timeline.snapshots[timelineIndex];
      return snap ? (
        <img src={snap.url} alt={`Snapshot ${timelineIndex}`} className="w-full h-full object-contain" />
      ) : null;
    }

    if (imageError) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <Camera className="w-10 h-10 text-white/30 mx-auto mb-2" />
            <p className="text-white/50 text-sm">Camera feed unavailable</p>
            <Button variant="ghost" size="sm" onClick={handleRefresh} className="mt-2 text-white/60">
              <RefreshCw className="w-3 h-3 mr-1" /> Retry
            </Button>
          </div>
        </div>
      );
    }

    if (hasStream && isMjpeg && camera.streamUrl) {
      return <img src={camera.streamUrl} alt={camera.name} className="w-full h-full object-contain" onError={() => setImageError(true)} />;
    }

    if (hasStream && camera.streamUrl) {
      return <video ref={videoRef} src={camera.streamUrl} autoPlay muted loop playsInline className="w-full h-full object-contain" onError={() => setImageError(true)} />;
    }

    return <img key={imageKey} src={imageUrl} alt={camera.name} className="w-full h-full object-contain" onError={() => setImageError(true)} />;
  };

  return (
    <div className={cn(
      "transition-all duration-300 translate-x-0 opacity-100",
      isFullscreen
        ? "fixed inset-0 z-[9999]"
        : "absolute right-2 top-2 bottom-2 z-30 w-[420px] max-w-[90vw]"
    )}>
      <div className={cn(
        "h-full backdrop-blur-3xl bg-black/70 border border-white/20 shadow-2xl flex flex-col",
        isFullscreen ? "rounded-none border-0 bg-black/95" : "rounded-2xl overflow-hidden"
      )}>
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
            {/* Record session toggle */}
            {!hasStream && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleSession}
                className={cn(
                  "h-7 w-7 rounded-lg",
                  isSessionRecording ? 'text-red-400 bg-red-500/20 hover:bg-red-500/30' : 'text-white/60 hover:text-white hover:bg-white/10'
                )}
                title={isSessionRecording ? "Stop recording session" : "Start recording session (continues when you leave)"}
              >
                {isSessionRecording ? <Square className="w-3 h-3 fill-current" /> : <Circle className="w-3.5 h-3.5" />}
              </Button>
            )}
            {/* Video mode toggle */}
            {!hasStream && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMode(m => m === 'video' ? 'live' : 'video')}
                className={cn(
                  "h-7 w-7 rounded-lg",
                  mode === 'video' ? 'text-green-400 bg-green-500/20 hover:bg-green-500/30' : 'text-white/60 hover:text-white hover:bg-white/10'
                )}
                title="Video playback"
              >
                <Film className="w-3.5 h-3.5" />
              </Button>
            )}
            {/* Timeline toggle */}
            {!hasStream && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMode(m => m === 'timeline' ? 'live' : 'timeline')}
                className={cn(
                  "h-7 w-7 rounded-lg",
                  mode === 'timeline' ? 'text-blue-400 bg-blue-500/20 hover:bg-blue-500/30' : 'text-white/60 hover:text-white hover:bg-white/10'
                )}
                title="Time machine"
              >
                <Clock className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)} className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10 rounded-lg">
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </Button>
            {mode === 'live' && (
              <Button variant="ghost" size="icon" onClick={handleRefresh} className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10 rounded-lg">
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10 rounded-lg">
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Video Player Mode */}
        {mode === 'video' ? (
          <ScrollArea className="flex-1 min-h-0">
            <CameraVideoPlayer
              snapshots={timeline.snapshots}
              onClose={() => setMode('live')}
            />
            <CameraHistoryControls
              onLoadRange={timeline.loadHistoryRange}
              getHistoryStats={timeline.getHistoryStats}
              isLoading={timeline.isLoadingHistory}
              snapshotCount={timeline.snapshotCount}
            />
          </ScrollArea>
        ) : (
          <>
            {/* Live Image / Stream / Timeline */}
            <div className="relative flex-1 min-h-0 bg-black">
              {renderFeed()}
              {/* Mode indicator */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur"
                style={{
                  backgroundColor: mode === 'timeline'
                    ? 'rgba(59,130,246,0.9)'
                    : hasStream ? 'rgba(34,197,94,0.9)' : 'rgba(220,38,38,0.9)'
                }}>
                {mode === 'timeline' ? (
                  <>
                    <Clock className="w-3 h-3 text-white" />
                    <span className="text-[11px] text-white font-bold tracking-wider">TIME MACHINE</span>
                  </>
                ) : hasStream ? (
                  <>
                    <Radio className="w-3 h-3 text-white animate-pulse" />
                    <span className="text-[11px] text-white font-bold tracking-wider">STREAMING</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span className="text-[11px] text-white font-bold tracking-wider">LIVE</span>
                  </>
                )}
              </div>
              {/* Refresh rate (live only) */}
              {mode === 'live' && !hasStream && (
                <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/60 backdrop-blur">
                  <span className="text-[10px] text-white/70 font-mono">{refreshRate}s refresh</span>
                </div>
              )}
              {/* Snapshot counter + session indicator */}
              {!hasStream && (
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                  {isSessionRecording && (
                    <div className="px-2 py-1 rounded-full bg-red-500/80 backdrop-blur flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span className="text-[10px] text-white font-bold">REC</span>
                      <span className="text-[9px] text-white/70 font-mono">{activeSession?.snapshots.length || 0}</span>
                    </div>
                  )}
                  <div className="px-2 py-1 rounded-full bg-black/60 backdrop-blur">
                    <span className="text-[10px] text-white/50 font-mono">{timeline.snapshotCount} frames</span>
                  </div>
                </div>
              )}
            </div>

            {/* Timeline Scrubber (visible in timeline mode or live mode) */}
            {!hasStream && (
              <div className="flex-shrink-0 border-t border-white/10">
                <CameraTimelineScrubber
                  snapshots={timeline.snapshots}
                  currentIndex={timelineIndex}
                  onSeek={(i) => {
                    setTimelineIndex(i);
                    if (mode === 'live') setMode('timeline');
                  }}
                  isRecording={timeline.isRecording}
                  onToggleRecording={timeline.toggleRecording}
                  onClearHistory={timeline.clearHistory}
                />
                <CameraHistoryControls
                  onLoadRange={timeline.loadHistoryRange}
                  getHistoryStats={timeline.getHistoryStats}
                  isLoading={timeline.isLoadingHistory}
                  snapshotCount={timeline.snapshotCount}
                />
              </div>
            )}
          </>
        )}

        {/* Metadata Panel */}
        <div className="flex-shrink-0 border-t border-white/10">
          <ScrollArea className="max-h-[140px]">
            <div className="p-3 space-y-2">
              <div className="flex items-start gap-2 text-xs">
                <MapPin className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white/80 font-medium">Location</p>
                  <p className="text-white/50 font-mono text-[11px]">{camera.lat.toFixed(6)}, {camera.lng.toFixed(6)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-[10px] border-white/20 text-white/60 bg-white/5">
                  {camera.source}
                </Badge>
                {hasStream ? (
                  <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-400 bg-green-500/10">Live stream</Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-400 bg-red-500/10">{refreshRate}s refresh</Badge>
                )}
                {timeline.snapshotCount > 0 && (
                  <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400 bg-blue-500/10">
                    {timeline.snapshotCount} recorded
                  </Badge>
                )}
              </div>
              {camera.imageUrl && (
                <a href={camera.imageUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition w-fit">
                  <ExternalLink className="w-3.5 h-3.5" /> Open original feed
                </a>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};
