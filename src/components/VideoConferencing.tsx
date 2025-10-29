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
  userId?: string;
  hostId?: string;
  userName?: string;
  meetingTitle?: string;
  onLeave?: () => void;
  autoJoin?: boolean;
}

export default function VideoConferencing({ roomUrl, userId, hostId, userName, meetingTitle, onLeave, autoJoin }: VideoConferencingProps) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const [jitsiLoaded, setJitsiLoaded] = useState(false);
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

  // Auto-join when autoJoin prop is true and container is ready
  useEffect(() => {
    if (autoJoin && roomUrl && !isCallActive && !isLoading) {
      // Wait for container to be mounted and have dimensions
      const checkAndStart = () => {
        if (!containerRef.current) {
          console.log('Container ref not ready, retrying...');
          setTimeout(checkAndStart, 50);
          return;
        }
        
        const rect = containerRef.current.getBoundingClientRect();
        console.log('Container dimensions check:', rect);
        
        if (rect && rect.width > 0 && rect.height > 0) {
          console.log('Container ready with dimensions:', rect.width, 'x', rect.height);
          startCall();
        } else {
          console.log('Container has 0x0 dimensions, retrying...');
          setTimeout(checkAndStart, 50);
        }
      };
      
      // Start checking after a brief delay to ensure DOM is ready
      const timer = setTimeout(checkAndStart, 100);
      return () => clearTimeout(timer);
    }
  }, [autoJoin, roomUrl, isCallActive, isLoading]);

  const startCall = async () => {
    if (!roomUrl) {
      toast({
        title: 'No meeting URL',
        description: 'Please provide a valid meeting URL',
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

    // Check if container is ready
    if (!containerRef.current) {
      toast({
        title: 'Container not ready',
        description: 'Video container is still loading. Please try again in a moment.',
        variant: 'destructive',
      });
      return;
    }


    // Validate container has dimensions
    const containerRect = containerRef.current.getBoundingClientRect();
    if (containerRect.width === 0 || containerRect.height === 0) {
      console.error('Container dimensions invalid:', containerRect);
      toast({
        title: 'Container has no dimensions',
        description: `Container size: ${containerRect.width}x${containerRect.height}. This shouldn't happen - please report this bug.`,
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Extract room name from URL
      // Format: https://meet.jit.si/RoomName or just RoomName
      let roomName = roomUrl.split('/').pop() || roomUrl;
      
      // Remove any existing hash or query params
      roomName = roomName.split('#')[0].split('?')[0];

      // Use 8x8.vc instead of meet.jit.si - it has more relaxed lobby policies
      // and allows everyone to join without moderator approval
      const domain = '8x8.vc';
      const isHost = userId && hostId && userId === hostId;
      
      const options = {
        roomName: roomName,
        width: '100%',
        height: '100%',
        parentNode: containerRef.current,
        userInfo: {
          displayName: userName || 'User',
          // Moderator flag doesn't work on public servers
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          enableWelcomePage: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          subject: meetingTitle || 'Startup Factory Hub Meeting',
          defaultRemoteDisplayName: 'Participant',
          requireDisplayName: false,
          enableLobbyChat: false,
          autoKnockLobby: false,
          enableInsecureRoomNameWarning: false,
          disableSelfView: false,
          // CRITICAL: Aggressive lobby bypass for public servers
          disableLobby: true,
          enableForcedReload: false,
          p2p: {
            enabled: false, // Disable P2P to force server mode
          },
          disableProfile: true, // Make everyone a guest to bypass moderator requirements
          hideConferenceSubject: false,
        },
        interfaceConfigOverwrite: {
          APP_NAME: 'Startup Factory Hub',
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          BRAND_WATERMARK_LINK: '',
          DEFAULT_BACKGROUND: '#1a1a2e',
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop',
            'fullscreen', 'fodeviceselection', 'hangup', 'chat',
            'recording', 'livestreaming', 'settings', 'raisehand', 
            'videoquality', 'filmstrip', 'stats', 'shortcuts', 
            'tileview', 'mute-everyone'
          ],
        },
      };

      console.log('Initializing Jitsi with:', {
        roomName,
        domain,
        isHost,
        containerReady: !!containerRef.current,
        containerDimensions: containerRef.current?.getBoundingClientRect(),
      });

      const api = new window.JitsiMeetExternalAPI(domain, options);
      jitsiApiRef.current = api;
      
      // Hide overlay immediately when Jitsi starts loading
      setJitsiLoaded(true);
      setIsLoading(false);

      // Event listeners
      api.on('videoConferenceJoined', () => {
        setIsCallActive(true);
        toast({
          title: 'Joined meeting',
          description: 'You are now in the video call',
        });
      });

      // Sync camera/mic state with Jitsi
      api.on('videoMuteStatusChanged', (data: any) => {
        setIsCameraOn(!data.muted);
      });

      api.on('audioMuteStatusChanged', (data: any) => {
        setIsMicOn(!data.muted);
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

      api.on('errorOccurred', (error: any) => {
        console.error('Jitsi error occurred:', error);
        toast({
          title: 'Video call error',
          description: error.message || 'An error occurred in the video call',
          variant: 'destructive',
        });
      });

    } catch (error: any) {
      console.error('Error starting Jitsi call:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        containerRef: containerRef.current,
        roomUrl,
      });
      toast({
        title: 'Failed to start call',
        description: error.message || 'Could not connect to the video call. Check console for details.',
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
      // Don't immediately update state - wait for Jitsi event
    }
  };

  const toggleMic = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleAudio');
      // Don't immediately update state - wait for Jitsi event
    }
  };

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
    <Card className="p-6">
      <div className="space-y-4">
        {/* Always render container with dimensions */}
        <div className="relative">
          <div 
            ref={containerRef}
            className="aspect-video bg-accent rounded-lg overflow-hidden"
            style={{
              width: '100%',
              height: '100%',
              minHeight: '400px',
              position: 'relative',
              zIndex: 1
            }}
          />
          
          {/* Loading/waiting overlay when not active */}
          {!jitsiLoaded && (
            <div className="absolute inset-0 bg-accent rounded-lg flex items-center justify-center z-10">
              {isLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="text-sm text-muted-foreground">Connecting to meeting...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Video className="h-8 w-8 opacity-50" />
                  <p className="text-sm text-muted-foreground">Ready to join</p>
                </div>
              )}
            </div>
          )}
          
          {/* Show overlay badges when call is active */}
          {isCallActive && (
            <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start">
              <Badge className="bg-background/80 backdrop-blur">
                <Users className="h-3 w-3 mr-1" />
                {participantCount} {participantCount === 1 ? 'participant' : 'participants'}
              </Badge>
              {userId && hostId && userId === hostId && (
                <Badge variant="default" className="bg-primary">
                  Host
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Show join button when not active and not auto-joining */}
        {!isCallActive && !autoJoin && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              <h3 className="font-semibold">Video Conferencing</h3>
            </div>
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
          </div>
        )}

        {/* Show controls when call is active */}
        {isCallActive && (
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
        )}
      </div>
    </Card>
  );
}
