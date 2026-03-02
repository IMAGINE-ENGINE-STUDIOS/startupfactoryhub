import { format } from 'date-fns';
import { Play, Pause, SkipBack, SkipForward, Layers, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';

interface EarthViewportToolbarProps {
  // Timeline (precipitation real-time)
  isTimelineVisible: boolean;
  isPlaying: boolean;
  onTogglePlayback: () => void;
  onStepFrame: (direction: 1 | -1) => void;
  currentFrameTime: Date | null;
  frameCount: number;
  currentFrameIndex: number;
  onFrameChange: (index: number) => void;
  // Date selection (GIBS layers)
  isDatePickerVisible: boolean;
  selectedDate: Date;
  selectedMonth: Date;
  onDateChange: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  hasMonthlyLayer: boolean;
  hasDailyLayer: boolean;
  // Common
  onToggleLayers?: () => void;
}

export const EarthViewportToolbar = ({
  isTimelineVisible,
  isPlaying,
  onTogglePlayback,
  onStepFrame,
  currentFrameTime,
  frameCount,
  currentFrameIndex,
  onFrameChange,
  isDatePickerVisible,
  selectedDate,
  selectedMonth,
  onDateChange,
  onMonthChange,
  hasMonthlyLayer,
  hasDailyLayer,
  onToggleLayers,
}: EarthViewportToolbarProps) => {
  if (!isTimelineVisible && !isDatePickerVisible) return null;

  const stepDay = (dir: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir);
    onDateChange(d);
  };

  const stepMonth = (dir: number) => {
    const d = new Date(selectedMonth);
    d.setMonth(d.getMonth() + dir);
    onMonthChange(d);
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2">
      {/* Date picker for GIBS layers */}
      {isDatePickerVisible && (
        <div className="flex items-center gap-2">
          {hasMonthlyLayer && (
            <div className="flex items-center gap-1 px-3 py-2 rounded-2xl backdrop-blur-3xl bg-black/40 border border-white/10">
              <ToolbarButton
                icon={<ChevronLeft className="w-3.5 h-3.5" />}
                onClick={() => stepMonth(-1)}
                label="Previous month"
                small
              />
              <div className="flex items-center gap-1.5 px-2">
                <Calendar className="w-3.5 h-3.5 text-white/60" />
                <span className="text-xs text-white/80 font-mono min-w-[80px] text-center">
                  {format(selectedMonth, 'MMM yyyy')}
                </span>
              </div>
              <ToolbarButton
                icon={<ChevronRight className="w-3.5 h-3.5" />}
                onClick={() => stepMonth(1)}
                label="Next month"
                small
              />
            </div>
          )}
          {hasDailyLayer && (
            <div className="flex items-center gap-1 px-3 py-2 rounded-2xl backdrop-blur-3xl bg-black/40 border border-white/10">
              <ToolbarButton
                icon={<ChevronLeft className="w-3.5 h-3.5" />}
                onClick={() => stepDay(-1)}
                label="Previous day"
                small
              />
              <div className="flex items-center gap-1.5 px-2">
                <Calendar className="w-3.5 h-3.5 text-white/60" />
                <span className="text-xs text-white/80 font-mono min-w-[90px] text-center">
                  {format(selectedDate, 'yyyy-MM-dd')}
                </span>
              </div>
              <ToolbarButton
                icon={<ChevronRight className="w-3.5 h-3.5" />}
                onClick={() => stepDay(1)}
                label="Next day"
                small
              />
            </div>
          )}
        </div>
      )}

      {/* Timeline for real-time precipitation */}
      {isTimelineVisible && (
        <>
          {currentFrameTime && (
            <div className="px-3 py-1.5 rounded-xl backdrop-blur-3xl bg-black/40 border border-white/10 text-xs text-white/80 font-mono">
              {format(currentFrameTime, 'yyyy-MM-dd HH:mm')} UTC
            </div>
          )}
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
        </>
      )}

      {/* Button row */}
      <div className="flex items-center gap-2">
        {isTimelineVisible && (
          <>
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
          </>
        )}
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
  small = false,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  label: string;
  active?: boolean;
  small?: boolean;
}) => (
  <button
    onClick={onClick}
    title={label}
    className={cn(
      "rounded-2xl backdrop-blur-3xl flex items-center justify-center transition-all",
      "border shadow-lg",
      small ? "w-7 h-7 rounded-lg" : "w-11 h-11",
      active
        ? "bg-primary/30 border-primary/50 text-primary-foreground"
        : "bg-black/40 border-white/15 text-white/80 hover:bg-white/10 hover:text-white"
    )}
  >
    {icon}
  </button>
);
