import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { CameraSnapshot } from '@/hooks/useCameraTimeline';
import { Play, Pause, SkipBack, SkipForward, FastForward, Rewind, Calendar } from 'lucide-react';

interface CameraVideoPlayerProps {
  snapshots: CameraSnapshot[];
  onClose: () => void;
  fullscreen?: boolean;
}

const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 4, 8, 16];

export const CameraVideoPlayer = ({ snapshots, onClose, fullscreen = false }: CameraVideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [speed, setSpeed] = useState(2); // index into SPEED_OPTIONS → starts at 1x
  const [startFrame, setStartFrame] = useState(0);
  const [endFrame, setEndFrame] = useState(Math.max(snapshots.length - 1, 0));
  const frameRef = useRef(0);
  const animRef = useRef<number | null>(null);
  const lastFrameTime = useRef(0);

  const currentSpeed = SPEED_OPTIONS[speed];
  // Base delay = 1 minute / speed factor → but since snapshots are already N seconds apart,
  // we play them back-to-back. Speed controls how fast frames advance.
  // At 1x: ~100ms between frames (smooth). At 16x: ~6ms.
  const frameDelay = Math.max(6, 100 / currentSpeed);

  const play = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
  }, []);

  const seekTo = useCallback((frame: number) => {
    const clamped = Math.max(startFrame, Math.min(endFrame, frame));
    frameRef.current = clamped;
    setCurrentFrame(clamped);
  }, [startFrame, endFrame]);

  // Playback loop
  useEffect(() => {
    if (!isPlaying || snapshots.length < 2) return;

    const tick = (time: number) => {
      if (time - lastFrameTime.current >= frameDelay) {
        lastFrameTime.current = time;
        const next = frameRef.current + 1;
        if (next > endFrame) {
          // Loop back to start
          frameRef.current = startFrame;
          setCurrentFrame(startFrame);
        } else {
          frameRef.current = next;
          setCurrentFrame(next);
        }
      }
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, snapshots.length, frameDelay, startFrame, endFrame]);

  // Update end frame when snapshots grow
  useEffect(() => {
    setEndFrame(Math.max(snapshots.length - 1, 0));
  }, [snapshots.length]);

  const currentSnap = snapshots[currentFrame];
  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString();
  const formatDate = (ts: number) => new Date(ts).toLocaleDateString();

  if (snapshots.length < 2) {
    return (
      <div className="px-3 py-4 text-center">
        <p className="text-white/50 text-xs">Need at least 2 snapshots to play video.</p>
        <p className="text-white/30 text-[10px] mt-1">Recording… {snapshots.length}/2 frames</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Video display */}
      <div className="relative bg-black aspect-video">
        {currentSnap && (
          <img
            src={currentSnap.url}
            alt={`Frame ${currentFrame}`}
            className="w-full h-full object-contain"
          />
        )}
        {/* Frame timestamp overlay */}
        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur text-[10px] text-white/80 font-mono">
          {currentSnap ? formatTime(currentSnap.timestamp) : '--'}
        </div>
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur text-[10px] text-white/80 font-mono">
          {currentFrame + 1}/{snapshots.length}
        </div>
        {/* Playing indicator */}
        {isPlaying && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-green-500/90 text-[10px] text-white font-bold flex items-center gap-1">
            <Play className="w-2.5 h-2.5 fill-white" /> {currentSpeed}x
          </div>
        )}
      </div>

      {/* Scrubber */}
      <div className="px-3 pt-2">
        <Slider
          min={0}
          max={Math.max(snapshots.length - 1, 0)}
          step={1}
          value={[currentFrame]}
          onValueChange={([v]) => {
            pause();
            seekTo(v);
          }}
          className="w-full [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:border-green-500 [&_[role=slider]]:bg-green-500 [&_.relative]:h-1.5 [&_.absolute]:bg-green-500/80"
        />
      </div>

      {/* Time range labels */}
      <div className="flex items-center justify-between px-3 mt-1 text-[9px] text-white/40 font-mono">
        <span>{snapshots[0] ? formatTime(snapshots[0].timestamp) : '--'}</span>
        <span>{currentSnap ? formatDate(currentSnap.timestamp) : '--'}</span>
        <span>{snapshots[snapshots.length - 1] ? formatTime(snapshots[snapshots.length - 1].timestamp) : '--'}</span>
      </div>

      {/* Playback controls */}
      <div className="flex items-center justify-center gap-1 px-3 py-2">
        {/* Speed down */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSpeed(s => Math.max(0, s - 1))}
          className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10 rounded-lg"
          disabled={speed === 0}
        >
          <Rewind className="w-3.5 h-3.5" />
        </Button>

        {/* Skip back */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => seekTo(currentFrame - 10)}
          className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10 rounded-lg"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </Button>

        {/* Play / Pause */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => isPlaying ? pause() : play()}
          className="h-9 w-9 text-white hover:bg-white/10 rounded-full border border-white/20"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </Button>

        {/* Skip forward */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => seekTo(currentFrame + 10)}
          className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10 rounded-lg"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </Button>

        {/* Speed up */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSpeed(s => Math.min(SPEED_OPTIONS.length - 1, s + 1))}
          className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10 rounded-lg"
          disabled={speed === SPEED_OPTIONS.length - 1}
        >
          <FastForward className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Speed indicator */}
      <div className="flex items-center justify-center gap-1.5 px-3 pb-2">
        {SPEED_OPTIONS.map((s, i) => (
          <button
            key={s}
            onClick={() => setSpeed(i)}
            className={`text-[9px] px-1.5 py-0.5 rounded font-mono transition-colors ${
              i === speed
                ? 'bg-green-500/30 text-green-400 border border-green-500/40'
                : 'text-white/30 hover:text-white/60'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* Trim range */}
      <div className="px-3 pb-2 space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] text-white/40">
          <Calendar className="w-3 h-3" />
          <span>Playback range</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-white/40 w-8">From</span>
          <Slider
            min={0}
            max={Math.max(snapshots.length - 2, 0)}
            step={1}
            value={[startFrame]}
            onValueChange={([v]) => {
              setStartFrame(v);
              if (currentFrame < v) seekTo(v);
            }}
            className="flex-1 [&_[role=slider]]:h-2.5 [&_[role=slider]]:w-2.5 [&_[role=slider]]:border-blue-500 [&_[role=slider]]:bg-blue-500 [&_.relative]:h-0.5"
          />
          <span className="text-white/50 font-mono w-16 text-right">
            {snapshots[startFrame] ? formatTime(snapshots[startFrame].timestamp) : '--'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-white/40 w-8">To</span>
          <Slider
            min={Math.min(startFrame + 1, snapshots.length - 1)}
            max={Math.max(snapshots.length - 1, 0)}
            step={1}
            value={[endFrame]}
            onValueChange={([v]) => {
              setEndFrame(v);
              if (currentFrame > v) seekTo(v);
            }}
            className="flex-1 [&_[role=slider]]:h-2.5 [&_[role=slider]]:w-2.5 [&_[role=slider]]:border-blue-500 [&_[role=slider]]:bg-blue-500 [&_.relative]:h-0.5"
          />
          <span className="text-white/50 font-mono w-16 text-right">
            {snapshots[endFrame] ? formatTime(snapshots[endFrame].timestamp) : '--'}
          </span>
        </div>
      </div>

      {/* Close button */}
      <div className="px-3 pb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="w-full h-7 text-[10px] text-white/50 hover:text-white hover:bg-white/10 border border-white/10"
        >
          Back to Live Feed
        </Button>
      </div>
    </div>
  );
};
