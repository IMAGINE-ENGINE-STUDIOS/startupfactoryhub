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

// Check if URL is a valid Whereby room URL
const isValidWherebyUrl = (url?: string): boolean => {
  if (!url) return false;
  return url.includes('whereby.com');
};

export default function VideoConferencing({
  roomUrl,
  persistentRoomUrl,
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
    const fullUrl = `${url}?displayName=${encodeURIComponent(userName)}&roomMode=normal&minimal`;
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  const handleJoin = async () => {
    setIsLoading(true);

    // Check if we already have a valid persistent room URL
    if (isValidWherebyUrl(persistentRoomUrl)) {
      setActiveRoomUrl(persistentRoomUrl);
      openInNewTab(persistentRoomUrl!);
      setIsLoading(false);
      return;
    }

    // Create a new persistent room (10-year expiration handled by edge function)
    try {
      const response = await fetch(
        'https://zqiihhmdsdgwdcwmryym.supabase.co/functions/v1/create-whereby-room',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxaWloaG1kc2Rnd2Rjd21yeXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MTAyMDcsImV4cCI6MjA3Mzk4NjIwN30.ppEJAvP7mVrX-6uXA1_AlaJEDHPBcb297irRyBBT3YI'
          },
          body: JSON.stringify({
            roomName: eventId ? `event-${eventId}` : meetingTitle ? `meet-${meetingTitle.substring(0, 15).replace(/\s+/g, '-')}` : `room-${Date.now()}`
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create meeting room');
      }

      const data = await response.json();
      setActiveRoomUrl(data.roomUrl);
      openInNewTab(data.roomUrl);

      // Notify parent to save the new room URL to database
      if (onRoomCreated && data.roomUrl) {
        onRoomCreated(data.roomUrl);
      }
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create meeting room. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };




  return (
    <Card className="relative overflow-hidden bg-secondary/5 h-full flex flex-col">
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
                  {activeRoomUrl ? 'Rejoin Meeting' : 'Join Video Call'}
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