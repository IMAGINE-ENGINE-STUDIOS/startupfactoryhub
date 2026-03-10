import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { CameraSnapshot } from '@/hooks/useCameraTimeline';
import { Clock, Circle, Trash2 } from 'lucide-react';

interface CameraTimelineScrubberProps {
  snapshots: CameraSnapshot[];
  currentIndex: number;
  onSeek: (index: number) => void;
  isRecording: boolean;
  onToggleRecording: () => void;
  onClearHistory: () => void;
}

export const CameraTimelineScrubber = ({
  snapshots,
  currentIndex,
  onSeek,
  isRecording,
  onToggleRecording,
  onClearHistory,
}: CameraTimelineScrubberProps) => {
  if (snapshots.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-[11px] text-white/40">
        <Clock className="w-3 h-3" />
        <span>Recording snapshots… waiting for first frame</span>
        {isRecording && (
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse ml-auto" />
        )}
      </div>
    );
  }

  const firstTime = snapshots[0]?.timestamp;
  const lastTime = snapshots[snapshots.length - 1]?.timestamp;
  const currentSnap = snapshots[currentIndex];
  const duration = lastTime - firstTime;

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString();
  const formatDuration = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
  };

  return (
    <div className="space-y-1.5">
      {/* Timeline scrubber */}
      <div className="px-3">
        <Slider
          min={0}
          max={Math.max(snapshots.length - 1, 0)}
          step={1}
          value={[currentIndex]}
          onValueChange={([v]) => onSeek(v)}
          className="w-full [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:border-red-500 [&_[role=slider]]:bg-red-500 [&_.relative]:h-1 [&_.absolute]:bg-red-500/80"
        />
      </div>

      {/* Time info */}
      <div className="flex items-center justify-between px-3 text-[10px] text-white/50 font-mono">
        <span>{currentSnap ? formatTime(currentSnap.timestamp) : '--'}</span>
        <span>{snapshots.length} frames · {formatDuration(duration)}</span>
        <span>{formatTime(lastTime)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1 px-3 pb-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleRecording}
          className={`h-6 text-[10px] px-2 rounded ${isRecording ? 'text-red-400 hover:text-red-300' : 'text-white/50 hover:text-white/80'}`}
        >
          <Circle className={`w-2.5 h-2.5 mr-1 ${isRecording ? 'fill-red-500 text-red-500' : ''}`} />
          {isRecording ? 'Recording' : 'Paused'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearHistory}
          className="h-6 text-[10px] px-2 rounded text-white/40 hover:text-white/80"
        >
          <Trash2 className="w-2.5 h-2.5 mr-1" />
          Clear
        </Button>
      </div>
    </div>
  );
};
