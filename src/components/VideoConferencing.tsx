import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, Loader2, Clock } from 'lucide-react';

const EVENT_DATE = new Date('2026-04-16T14:00:00-05:00'); // April 16, 2026 2:00 PM EST

function useCountdown(target: Date) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds, isLive: diff <= 0 };
}

interface VideoConferencingProps {
  roomUrl?: string;
  persistentRoomUrl?: string; // Stored room URL from database
  userId?: string;
  hostId?: string;
  userName?: string;
  meetingTitle?: string;
  onLeave?: () => void;
  onRoomCreated?: (url: string) => void; // Callback when new room is created
  autoJoin?: boolean;
  eventId?: string;
}

// Convert any meeting link (native or legacy) into a Startup Factory Live Video room path
const toLiveVideoPath = (url?: string): string | null => {
  if (!url) return null;
  if (url.includes('/live-video')) {
    try { const u = new URL(url, window.location.origin); return `/live-video${u.search}`; } catch { return null; }
  }
  if (url.includes('whereby.com')) {
    const last = url.split('?')[0].split('/').filter(Boolean).pop() || 'main';
    const room = last.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 60) || 'main';
    return `/live-video?room=${encodeURIComponent(room)}`;
  }
  return null;
};
const isValidMeetingUrl = (url?: string): boolean => !!toLiveVideoPath(url);

export default function VideoConferencing({
  roomUrl,
  persistentRoomUrl,
  userId,
  hostId,
  userName = 'User',
  meetingTitle,
  onLeave,
  onRoomCreated,
  autoJoin = false,
  eventId
}: VideoConferencingProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeRoomUrl, setActiveRoomUrl] = useState(persistentRoomUrl || roomUrl);

  const openInNewTab = (url: string) => {
    const path = toLiveVideoPath(url) || '/live-video';
    window.open(`${window.location.origin}${path}`, '_blank', 'noopener,noreferrer');
  };

  const handleJoin = async () => {
    setIsLoading(true);

    // Check if we already have a valid persistent room URL
    const existing = isValidMeetingUrl(persistentRoomUrl) ? persistentRoomUrl : isValidMeetingUrl(roomUrl) ? roomUrl : undefined;
    if (existing) {
      setActiveRoomUrl(existing);
      openInNewTab(existing);
      setIsLoading(false);
      return;
    }

    // Startup Factory Hub live video room (no external meeting provider).
    // The room slug is derived from the event/meeting; the event organizer
    // (hostId) hosts, falling back to the current user.
    try {
      const titleSlug = meetingTitle ? meetingTitle.substring(0, 15).replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '') : '';
      const slug = eventId ? `event-${eventId}` : titleSlug ? `meet-${titleSlug}` : `room-${Date.now().toString(36)}`;
      const host = hostId || userId;
      const liveLink = `https://startupfactoryhub.com/live-video?room=${slug}${host ? `&host=${host}` : ''}`;
      setActiveRoomUrl(liveLink);
      openInNewTab(liveLink);

      // Notify parent to save the new room URL to database
      if (onRoomCreated) {
        onRoomCreated(liveLink);
      }
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create meeting room. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };




  const countdown = useCountdown(EVENT_DATE);

  return (
    <Card className="relative overflow-hidden bg-secondary/5 h-full flex flex-col">
      {/* Countdown Banner */}
      <div className="w-full bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 border-b border-primary/20 px-4 py-3">
        {countdown.isLive ? (
          <div className="flex items-center justify-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm font-bold text-green-500 tracking-wider uppercase">Event is Live Now</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium tracking-wide uppercase">Event starts in</span>
            </div>
            <div className="flex items-center gap-2">
              {[
                { value: countdown.days, label: 'D' },
                { value: countdown.hours, label: 'H' },
                { value: countdown.minutes, label: 'M' },
                { value: countdown.seconds, label: 'S' },
              ].map((unit, i) => (
                <div key={i} className="flex items-baseline gap-0.5">
                  <span className="text-lg font-bold text-foreground tabular-nums min-w-[2ch] text-center">
                    {String(unit.value).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium">{unit.label}</span>
                  {i < 3 && <span className="text-muted-foreground/50 ml-1.5">:</span>}
                </div>
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground">April 16, 2026 · 2:00 PM EST</span>
          </div>
        )}
      </div>

      <div className="flex-1 relative rounded-lg overflow-hidden" style={{ minHeight: '300px' }}>
        {/* Loading State */}
        {isLoading &&
        <div className="absolute inset-0 flex items-center justify-center bg-background/95 z-10">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <p className="text-lg font-semibold">Connecting to meeting...</p>
            </div>
          </div>
        }

        {/* Join / Re-join State */}
        {!isLoading &&
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
            <div className="text-center space-y-6 p-8">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
                <Video className="h-24 w-24 mx-auto text-primary relative z-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">
                  {activeRoomUrl ? 'Meeting Ready' : 'Ready to Join?'}
                </h3>
                <p className="text-muted-foreground max-w-md">
                  {meetingTitle || 'Video Meeting'}
                </p>
                {userName &&
              <p className="text-sm text-muted-foreground">
                    Joining as: <span className="font-medium text-foreground">{userName}</span>
                  </p>
              }
                {activeRoomUrl &&
              <p className="text-xs text-muted-foreground">
                    The meeting opened in a new tab
                  </p>
              }
              </div>
              <div className="flex flex-col gap-3 items-center">
                <Button size="lg" onClick={handleJoin} className="gap-2 px-8">
                  <Video className="h-5 w-5" />
                  {activeRoomUrl ? 'join Meeting' : 'Join Video Call'}
                </Button>
                {activeRoomUrl



              }
              </div>
            </div>
          </div>
        }
      </div>
    </Card>);

}