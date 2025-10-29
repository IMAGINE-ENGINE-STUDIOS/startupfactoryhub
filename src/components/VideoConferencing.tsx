import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, Loader2 } from 'lucide-react';

interface VideoConferencingProps {
  roomUrl?: string;
  userId?: string;
  hostId?: string;
  userName?: string;
  meetingTitle?: string;
  onLeave?: () => void;
  autoJoin?: boolean;
}

export default function VideoConferencing({
  roomUrl,
  userName = 'User',
  meetingTitle,
  onLeave,
  autoJoin = false,
}: VideoConferencingProps) {
  const [isCallActive, setIsCallActive] = useState(autoJoin);
  const [isLoading, setIsLoading] = useState(false);

  // Extract room name from Whereby URL or use event ID
  const getRoomName = () => {
    if (!roomUrl) return '';
    
    // If it's already a Whereby URL, extract the room name
    if (roomUrl.includes('whereby.com')) {
      return roomUrl.split('/').pop() || '';
    }
    
    // Otherwise, use the URL as the room identifier
    return roomUrl.split('/').pop() || roomUrl;
  };

  const wherebyUrl = `https://whereby.com/${getRoomName()}?displayName=${encodeURIComponent(userName)}&roomMode=normal&minimal&embed`;

  const handleJoin = () => {
    setIsCallActive(true);
    setIsLoading(false);
  };

  const handleLeave = () => {
    setIsCallActive(false);
    if (onLeave) {
      onLeave();
    }
  };

  if (!roomUrl) {
    return (
      <Card className="p-8 text-center">
        <Video className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No Active Meeting</h3>
        <p className="text-muted-foreground">
          There's no meeting link available for this event.
        </p>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden bg-secondary/5 h-full flex flex-col">
      <div className="flex-1 relative rounded-lg overflow-hidden" style={{ minHeight: '500px' }}>
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/95 z-10">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <p className="text-lg font-semibold">Connecting to meeting...</p>
            </div>
          </div>
        )}

        {/* Waiting to Join State */}
        {!isCallActive && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
            <div className="text-center space-y-6 p-8">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
                <Video className="h-24 w-24 mx-auto text-primary relative z-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Ready to Join?</h3>
                <p className="text-muted-foreground max-w-md">
                  {meetingTitle || 'Video Meeting'}
                </p>
                {userName && (
                  <p className="text-sm text-muted-foreground">
                    Joining as: <span className="font-medium text-foreground">{userName}</span>
                  </p>
                )}
              </div>
              <Button size="lg" onClick={handleJoin} className="gap-2 px-8">
                <Video className="h-5 w-5" />
                Join Video Call
              </Button>
            </div>
          </div>
        )}

        {/* Whereby Embed */}
        {isCallActive && (
          <iframe
            src={wherebyUrl}
            allow="camera; microphone; fullscreen; speaker; display-capture; compute-pressure"
            className="w-full h-full border-0"
            style={{ minHeight: '500px' }}
          />
        )}
      </div>

      {/* Leave Button */}
      {isCallActive && (
        <div className="p-4 bg-background border-t flex items-center justify-center">
          <Button variant="destructive" size="lg" onClick={handleLeave} className="gap-2">
            Leave Meeting
          </Button>
        </div>
      )}
    </Card>
  );
}
