import { useEffect, useState } from 'react';
import { Radio, MapPin, Satellite, Wifi, WifiOff, ShieldAlert, Loader2, Globe2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  ChannelStatus,
  GeoPermissionState,
  LocationSource,
  TrackedUser,
} from '@/hooks/useMapTracking';

interface TrackingStatusIndicatorProps {
  sessionId: string | null;
  isTracking: boolean;
  permissionState: GeoPermissionState;
  channelStatus: ChannelStatus;
  lastUpdateAt: Date | null;
  locationSource: LocationSource;
  trackedUsers: TrackedUser[];
  onRequestPermission?: () => void;
  onOpenPanel?: () => void;
  className?: string;
}

function formatAgo(date: Date | null, now: number): string {
  if (!date) return '—';
  const diffSec = Math.max(0, Math.floor((now - date.getTime()) / 1000));
  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const m = Math.floor(diffSec / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export const TrackingStatusIndicator = ({
  sessionId,
  isTracking,
  permissionState,
  channelStatus,
  lastUpdateAt,
  locationSource,
  trackedUsers,
  onRequestPermission,
  onOpenPanel,
  className,
}: TrackingStatusIndicatorProps) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  if (!sessionId) return null;

  const channelDot =
    channelStatus === 'subscribed'
      ? 'bg-emerald-500'
      : channelStatus === 'connecting'
      ? 'bg-amber-500 animate-pulse'
      : channelStatus === 'error'
      ? 'bg-red-500'
      : 'bg-muted-foreground';

  const broadcastDot = isTracking
    ? locationSource === 'gps'
      ? 'bg-emerald-500 animate-pulse'
      : locationSource === 'ip'
      ? 'bg-amber-500 animate-pulse'
      : 'bg-amber-400 animate-pulse'
    : 'bg-muted-foreground';

  const needsPermission = permissionState === 'denied' || permissionState === 'unsupported';
  const fresh = lastUpdateAt && now - lastUpdateAt.getTime() < 30_000;

  return (
    <div
      className={cn(
        'pointer-events-auto rounded-2xl border border-border/60 bg-background/85 backdrop-blur-md shadow-lg px-3 py-2 text-xs space-y-1.5 w-[240px]',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-semibold">
          <Radio className={cn('w-3.5 h-3.5', isTracking && 'text-emerald-500')} />
          <span>Live Tracking</span>
        </div>
        {onOpenPanel && (
          <button
            type="button"
            onClick={onOpenPanel}
            className="text-[10px] uppercase tracking-wide text-muted-foreground hover:text-foreground"
          >
            Panel
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <span className={cn('w-2 h-2 rounded-full shrink-0', channelDot)} />
        {channelStatus === 'subscribed' ? (
          <Wifi className="w-3 h-3 text-emerald-500" />
        ) : channelStatus === 'connecting' ? (
          <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
        ) : (
          <WifiOff className="w-3 h-3 text-red-500" />
        )}
        <span className="text-muted-foreground">
          Channel:{' '}
          <span className="text-foreground capitalize">
            {channelStatus === 'subscribed' ? 'connected' : channelStatus}
          </span>
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className={cn('w-2 h-2 rounded-full shrink-0', broadcastDot)} />
        {locationSource === 'gps' ? (
          <Satellite className="w-3 h-3 text-emerald-500" />
        ) : locationSource === 'ip' ? (
          <Globe2 className="w-3 h-3 text-amber-500" />
        ) : (
          <MapPin className="w-3 h-3 text-muted-foreground" />
        )}
        <span className="text-muted-foreground">
          Broadcast:{' '}
          <span className="text-foreground">
            {!isTracking
              ? 'off'
              : locationSource === 'gps'
              ? 'GPS'
              : locationSource === 'ip'
              ? 'approx (IP)'
              : 'waiting…'}
          </span>
        </span>
      </div>

      <div className="flex items-center justify-between text-muted-foreground">
        <span>
          Updated: <span className={cn('text-foreground', fresh && 'text-emerald-500')}>{formatAgo(lastUpdateAt, now)}</span>
        </span>
        <span>
          Peers: <span className="text-foreground">{trackedUsers.length}</span>
        </span>
      </div>

      {needsPermission && (
        <button
          type="button"
          onClick={onRequestPermission}
          className="w-full mt-1 flex items-center justify-center gap-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 px-2 py-1 hover:bg-amber-500/25 transition"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          {permissionState === 'denied' ? 'Location blocked — retry' : 'Enable location'}
        </button>
      )}

      {permissionState === 'denied' && (
        <p className="text-[10px] leading-snug text-muted-foreground">
          Enable location in your browser settings, or we'll keep using an approximate (IP-based) location.
        </p>
      )}
    </div>
  );
};
