import { useState } from 'react';
import { Clock, Circle, Square, Trash2, Play, Camera, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useRecordingSessions, RecordingSession, DurationMode } from '@/stores/useRecordingSessions';

interface RecordingSessionsWidgetProps {
  onPlaySession: (session: RecordingSession) => void;
}

export const RecordingSessionsWidget = ({ onPlaySession }: RecordingSessionsWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { sessions, stopSession, removeSession } = useRecordingSessions();

  const activeSessions = sessions.filter(s => !s.stoppedAt);
  const closedSessions = sessions.filter(s => s.stoppedAt !== null);
  const totalActive = activeSessions.length;

  if (sessions.length === 0) return null;

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

  return (
    <div className="absolute top-16 right-3 z-20">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 rounded-xl backdrop-blur-xl border shadow-lg transition-all",
          totalActive > 0
            ? "bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30"
            : "bg-black/60 border-white/20 text-white/70 hover:bg-black/80"
        )}
      >
        <Clock className="w-4 h-4" />
        {totalActive > 0 && (
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        )}
        <span className="text-xs font-medium">{sessions.length}</span>
        <ChevronDown className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="mt-2 w-[320px] max-h-[400px] rounded-xl backdrop-blur-3xl bg-black/80 border border-white/20 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
            <span className="text-xs font-medium text-white/80">Recording Sessions</span>
            {totalActive > 0 && (
              <Badge className="text-[9px] bg-red-500/20 text-red-400 border-red-500/30">
                {totalActive} active
              </Badge>
            )}
          </div>

          <ScrollArea className="max-h-[340px]">
            <div className="p-2 space-y-1">
              {/* Active sessions */}
              {activeSessions.map(session => (
                <SessionItem
                  key={session.id}
                  session={session}
                  isActive
                  onStop={() => stopSession(session.id)}
                  onPlay={() => {
                    stopSession(session.id);
                    onPlaySession(session);
                  }}
                  onRemove={() => removeSession(session.id)}
                  formatDuration={formatDuration}
                  formatTime={formatTime}
                />
              ))}

              {/* Divider */}
              {activeSessions.length > 0 && closedSessions.length > 0 && (
                <div className="border-t border-white/10 my-1" />
              )}

              {/* Closed sessions */}
              {closedSessions.map(session => (
                <SessionItem
                  key={session.id}
                  session={session}
                  isActive={false}
                  onStop={() => {}}
                  onPlay={() => onPlaySession(session)}
                  onRemove={() => removeSession(session.id)}
                  formatDuration={formatDuration}
                  formatTime={formatTime}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

interface SessionItemProps {
  session: RecordingSession;
  isActive: boolean;
  onStop: () => void;
  onPlay: () => void;
  onRemove: () => void;
  formatDuration: (start: number, end?: number | null) => string;
  formatTime: (ts: number) => string;
}

const SessionItem = ({ session, isActive, onStop, onPlay, onRemove, formatDuration, formatTime }: SessionItemProps) => (
  <div className={cn(
    "rounded-lg p-2 transition-colors",
    isActive ? "bg-red-500/10 border border-red-500/20" : "bg-white/5 border border-white/10 hover:bg-white/10"
  )}>
    <div className="flex items-center gap-2">
      {/* Status dot */}
      {isActive ? (
        <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
      ) : (
        <div className="w-2.5 h-2.5 rounded-full bg-white/20 flex-shrink-0" />
      )}

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
            {session.snapshots.length} frames
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {isActive ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onStop}
            className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded"
            title="Stop recording"
          >
            <Square className="w-3 h-3 fill-current" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={onPlay}
            className="h-6 w-6 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded"
            title="Play session"
          >
            <Play className="w-3 h-3 fill-current" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-6 w-6 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded"
          title="Delete session"
        >
          <Trash2 className="w-2.5 h-2.5" />
        </Button>
      </div>
    </div>
  </div>
);
