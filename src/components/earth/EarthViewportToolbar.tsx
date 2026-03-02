import { format } from 'date-fns';
import { Play, Pause, SkipBack, SkipForward, Layers, Settings, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';

interface EarthViewportToolbarProps {
  isVisible: boolean;
  isPlaying: boolean;
  onTogglePlayback: () => void;
  onStepFrame: (direction: 1 | -1) => void;
  currentFrameTime: Date | null;
  frameCount: number;
  currentFrameIndex: number;
  onFrameChange: (index: number) => void;
  onToggleLayers?: () => void;
}

export const EarthViewportToolbar = ({
  isVisible,
  isPlaying,
  onTogglePlayback,
  onStepFrame,
  currentFrameTime,
  frameCount,
  currentFrameIndex,
  onFrameChange,
  onToggleLayers,
}: EarthViewportToolbarProps) => {
  if (!isVisible) return null;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2">
      {/* Time display */}
      {currentFrameTime && (
        <div className="px-3 py-1.5 rounded-xl backdrop-blur-3xl bg-black/40 border border-white/10 text-xs text-white/80 font-mono">
          {format(currentFrameTime, 'yyyy-MM-dd HH:mm')} UTC
        </div>
      )}

      {/* Timeline slider */}
      {frameCount > 1 && (
        <div className="w-64 px-4 py-2 rounded-xl backdrop-blur-3xl bg-black/40 border border-white/10">
          <Slider
            value={[currentFrameIndex]}
            min={0}
            max={frameCount - 1}
            step={1}
            onValueChange={([val]) => onFrameChange(val)}
            className="w-full"
          />
        </div>
      )}

      {/* Button row */}
      <div className="flex items-center gap-2">
        <ToolbarButton
          icon={<SkipBack className="w-4 h-4" />}
          onClick={() => onStepFrame(-1)}
          label="Previous frame"
        />
        <ToolbarButton
          icon={isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          onClick={onTogglePlayback}
          label={isPlaying ? 'Pause' : 'Play'}
          active={isPlaying}
        />
        <ToolbarButton
          icon={<SkipForward className="w-4 h-4" />}
          onClick={() => onStepFrame(1)}
          label="Next frame"
        />
        {onToggleLayers && (
          <ToolbarButton
            icon={<Layers className="w-4 h-4" />}
            onClick={onToggleLayers}
            label="Layers"
          />
        )}
      </div>
    </div>
  );
};

const ToolbarButton = ({
  icon,
  onClick,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  label: string;
  active?: boolean;
}) => (
  <button
    onClick={onClick}
    title={label}
    className={cn(
      "w-11 h-11 rounded-2xl backdrop-blur-3xl flex items-center justify-center transition-all",
      "border shadow-lg",
      active
        ? "bg-primary/30 border-primary/50 text-primary-foreground"
        : "bg-black/40 border-white/15 text-white/80 hover:bg-white/10 hover:text-white"
    )}
  >
    {icon}
  </button>
);
