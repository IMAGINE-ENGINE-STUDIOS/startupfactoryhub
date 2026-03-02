import { format } from 'date-fns';
import { Play, Pause, SkipBack, SkipForward, Calendar, ChevronLeft, ChevronRight, Sun, Moon, CalendarDays, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { TemporalMode, DayNightMode } from '@/hooks/useEarthIntelligence';

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
  // Temporal controls
  temporalMode: TemporalMode;
  onTemporalModeChange: (mode: TemporalMode) => void;
  dayNightMode: DayNightMode;
  onDayNightModeChange: (mode: DayNightMode) => void;
  precipMode: 'realtime' | 'monthly';
  onPrecipModeChange: (mode: 'realtime' | 'monthly') => void;
  // Active dataset capabilities
  activeHasDayNight: boolean;
  activeHasDaily: boolean;
  activeHasMonthly: boolean;
  activeHasTimelineOption: boolean;
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
  temporalMode,
  onTemporalModeChange,
  dayNightMode,
  onDayNightModeChange,
  precipMode,
  onPrecipModeChange,
  activeHasDayNight,
  activeHasDaily,
  activeHasMonthly,
  activeHasTimelineOption,
}: EarthViewportToolbarProps) => {
  const hasAnyActive = isTimelineVisible || isDatePickerVisible || activeHasDayNight || (activeHasDaily && activeHasMonthly) || activeHasTimelineOption;
  if (!hasAnyActive) return null;

  const stepDay = (dir: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir);
    onDateChange(d);
  };

  const stepMonth = (dir: number) => {
    const d = new Date(selectedMonth);
    d.setMonth(d.getMonth() + dir);
    d.setDate(1); // GIBS monthly layers require 1st of month
    onMonthChange(d);
  };

  // Determine which date stepper to show based on temporal mode
  const showMonthlyStepper = isDatePickerVisible && (temporalMode === 'monthly' || (!activeHasDaily && activeHasMonthly));
  const showDailyStepper = isDatePickerVisible && temporalMode === 'daily' && activeHasDaily;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 flex-wrap justify-center max-w-[95vw]">
      {/* Mode toggles */}
      {activeHasDayNight && (
        <div className="flex items-center gap-0.5 px-1 py-1 rounded-2xl backdrop-blur-3xl bg-black/40 border border-white/10">
          <TogglePill
            active={dayNightMode === 'day'}
            onClick={() => onDayNightModeChange('day')}
            icon={<Sun className="w-3.5 h-3.5" />}
            label="Day"
          />
          <TogglePill
            active={dayNightMode === 'night'}
            onClick={() => onDayNightModeChange('night')}
            icon={<Moon className="w-3.5 h-3.5" />}
            label="Night"
          />
        </div>
      )}

      {activeHasDaily && activeHasMonthly && (
        <div className="flex items-center gap-0.5 px-1 py-1 rounded-2xl backdrop-blur-3xl bg-black/40 border border-white/10">
          <TogglePill
            active={temporalMode === 'daily'}
            onClick={() => onTemporalModeChange('daily')}
            icon={<CalendarDays className="w-3.5 h-3.5" />}
            label="Daily"
          />
          <TogglePill
            active={temporalMode === 'monthly'}
            onClick={() => onTemporalModeChange('monthly')}
            icon={<Calendar className="w-3.5 h-3.5" />}
            label="Monthly"
          />
        </div>
      )}

      {activeHasTimelineOption && (
        <div className="flex items-center gap-0.5 px-1 py-1 rounded-2xl backdrop-blur-3xl bg-black/40 border border-white/10">
          <TogglePill
            active={precipMode === 'realtime'}
            onClick={() => onPrecipModeChange('realtime')}
            icon={<Radio className="w-3.5 h-3.5" />}
            label="Live"
          />
          <TogglePill
            active={precipMode === 'monthly'}
            onClick={() => onPrecipModeChange('monthly')}
            icon={<Calendar className="w-3.5 h-3.5" />}
            label="Monthly"
          />
        </div>
      )}

      {/* Date stepper */}
      {showMonthlyStepper && (
        <div className="flex items-center gap-1 px-2 py-1.5 rounded-2xl backdrop-blur-3xl bg-black/40 border border-white/10">
          <ToolbarButton
            icon={<ChevronLeft className="w-3.5 h-3.5" />}
            onClick={() => stepMonth(-1)}
            label="Previous month"
            small
          />
          <div className="flex items-center gap-1 px-1">
            <Calendar className="w-3 h-3 text-white/60" />
            <span className="text-xs text-white/80 font-mono min-w-[70px] text-center">
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
      {showDailyStepper && (
        <div className="flex items-center gap-1 px-2 py-1.5 rounded-2xl backdrop-blur-3xl bg-black/40 border border-white/10">
          <ToolbarButton
            icon={<ChevronLeft className="w-3.5 h-3.5" />}
            onClick={() => stepDay(-1)}
            label="Previous day"
            small
          />
          <div className="flex items-center gap-1 px-1">
            <Calendar className="w-3 h-3 text-white/60" />
            <span className="text-xs text-white/80 font-mono min-w-[80px] text-center">
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

      {/* Timeline timestamp */}
      {isTimelineVisible && currentFrameTime && (
        <div className="px-2 py-1.5 rounded-xl backdrop-blur-3xl bg-black/40 border border-white/10 text-xs text-white/80 font-mono">
          {format(currentFrameTime, 'MM-dd HH:mm')} UTC
        </div>
      )}

      {/* Timeline slider */}
      {isTimelineVisible && frameCount > 1 && (
        <div className="w-40 px-3 py-1.5 rounded-xl backdrop-blur-3xl bg-black/40 border border-white/10">
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

      {/* Playback controls */}
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
    </div>
  );
};

const TogglePill = ({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
      active
        ? "bg-white/15 text-white"
        : "text-white/50 hover:text-white/70"
    )}
  >
    {icon}
    {label}
  </button>
);

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
