import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  Users,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Jitsi External API types
declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

interface VideoConferencingProps {
  roomUrl?: string;
  onLeave?: () => void;
}

export default function VideoConferencing({ roomUrl, onLeave }: VideoConferencingProps) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const { toast } = useToast();
  
  const jitsiApiRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
      }
    };
  }, []);

  const startCall = async () => {
    if (!roomUrl) {
      toast({
        title: 'No meeting URL',
        description: 'Please provide a valid meeting URL',
        variant: 'destructive',
      });
      return;
    }

    if (!containerRef.current) {
      toast({
        title: 'Error',
        description: 'Video container not ready',
        variant: 'destructive',
      });
      return;
    }

    if (!window.JitsiMeetExternalAPI) {
      toast({
        title: 'Error',
        description: 'Jitsi Meet is not loaded yet. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);

      // Extract room name from URL
      // Format: https://meet.jit.si/RoomName or just RoomName
      const roomName = roomUrl.split('/').pop() || roomUrl;

      // Initialize Jitsi Meet
      const domain = 'meet.jit.si';
      const options = {
        roomName: roomName,
        width: '100%',
        height: '100%',
        parentNode: containerRef.current,
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          enableWelcomePage: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop',
            'fullscreen', 'fodeviceselection', 'hangup', 'chat',
            'recording', 'livestreaming', 'etherpad', 'sharedvideo',
            'settings', 'raisehand', 'videoquality', 'filmstrip',
            'feedback', 'stats', 'shortcuts', 'tileview', 'download',
            'help', 'mute-everyone'
          ],
        },
      };

      const api = new window.JitsiMeetExternalAPI(domain, options);
      jitsiApiRef.current = api;

      // Event listeners
      api.on('videoConferenceJoined', () => {
        setIsCallActive(true);
        setIsLoading(false);
        toast({
          title: 'Joined meeting',
          description: 'You are now in the video call',
        });
      });

      api.on('participantJoined', () => {
        const count = api.getNumberOfParticipants();
        setParticipantCount(count);
      });

      api.on('participantLeft', () => {
        const count = api.getNumberOfParticipants();
        setParticipantCount(count);
      });

      api.on('videoConferenceLeft', () => {
        setIsCallActive(false);
        onLeave?.();
      });

      api.on('readyToClose', () => {
        api.dispose();
        jitsiApiRef.current = null;
        setIsCallActive(false);
        onLeave?.();
      });

    } catch (error) {
      console.error('Error starting Jitsi call:', error);
      toast({
        title: 'Failed to start call',
        description: 'Could not connect to the video call',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const endCall = async () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('hangup');
      jitsiApiRef.current.dispose();
      jitsiApiRef.current = null;
    }
    setIsCallActive(false);
    toast({
      title: 'Call ended',
      description: 'You have left the meeting',
    });
    onLeave?.();
  };

  const toggleCamera = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleVideo');
      setIsCameraOn(!isCameraOn);
    }
  };

  const toggleMic = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleAudio');
      setIsMicOn(!isMicOn);
    }
  };

  if (isCallActive) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="relative">
            <div 
              ref={containerRef}
              className="aspect-video bg-accent rounded-lg overflow-hidden"
            />
            
            <Badge className="absolute top-4 left-4 z-10">
              <Users className="h-3 w-3 mr-1" />
              {participantCount} {participantCount === 1 ? 'participant' : 'participants'}
            </Badge>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button
              variant={isCameraOn ? 'default' : 'destructive'}
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={toggleCamera}
            >
              {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>

            <Button
              variant={isMicOn ? 'default' : 'destructive'}
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={toggleMic}
            >
              {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>

            <Button
              variant="destructive"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={endCall}
            >
              <Phone className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (!roomUrl) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No active meeting</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Video className="h-5 w-5" />
        <h3 className="font-semibold">Video Conferencing</h3>
      </div>

      <div className="space-y-4">
        <Button 
          className="w-full" 
          onClick={startCall}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Video className="h-4 w-4 mr-2" />
              Join Video Call
            </>
          )}
        </Button>
        
        <p className="text-xs text-muted-foreground text-center">
          Ready to join when you are
        </p>
      </div>
    </Card>
  );
}
