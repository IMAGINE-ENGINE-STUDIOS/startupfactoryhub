import { X, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RecordingSession } from '@/stores/useRecordingSessions';
import { CameraVideoPlayer } from './CameraVideoPlayer';

interface SessionPlaybackPanelProps {
  session: RecordingSession;
  onClose: () => void;
}

export const SessionPlaybackPanel = ({ session, onClose }: SessionPlaybackPanelProps) => {
  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString();
  const duration = session.stoppedAt
    ? Math.round((session.stoppedAt - session.startedAt) / 1000)
    : Math.round((Date.now() - session.startedAt) / 1000);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
  };

  return (
    <div className="absolute right-2 top-2 bottom-2 z-30 w-[420px] max-w-[90vw]">
      <div className="h-full backdrop-blur-3xl bg-black/70 border border-white/20 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <Camera className="w-4 h-4 text-green-400" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-medium text-white truncate block">{session.cameraName}</span>
              <span className="text-[10px] text-white/50">
                {session.isVideoRecording ? 'Video' : 'Session'} · {formatTime(session.startedAt)} · {formatDuration(duration)}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10 rounded-lg">
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Reuse video player — pass videoUrl for proper video playback */}
        <div className="flex-1 min-h-0 overflow-auto">
          <CameraVideoPlayer
            snapshots={session.snapshots}
            onClose={onClose}
            videoUrl={session.videoUrl}
            videoDurationMs={session.videoDurationMs}
          />
        </div>
      </div>
    </div>
  );
};
