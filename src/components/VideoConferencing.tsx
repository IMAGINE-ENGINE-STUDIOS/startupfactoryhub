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
import DailyIframe, { DailyCall } from '@daily-co/daily-js';

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
  
  const callObjectRef = useRef<DailyCall | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (callObjectRef.current) {
        callObjectRef.current.destroy();
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

    try {
      setIsLoading(true);
      
      // Create Daily iframe and attach to container
      const callObject = DailyIframe.createFrame(containerRef.current, {
        showLeaveButton: false,
        iframeStyle: {
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: '0.5rem',
        },
      });
      
      callObjectRef.current = callObject;

      // Set up event listeners
      callObject.on('joined-meeting', () => {
        setIsCallActive(true);
        setIsLoading(false);
        toast({
          title: 'Joined meeting',
          description: 'You are now in the video call',
        });
      });

      callObject.on('participant-joined', () => {
        const participants = callObject.participants();
        setParticipantCount(Object.keys(participants).length);
      });

      callObject.on('participant-left', () => {
        const participants = callObject.participants();
        setParticipantCount(Object.keys(participants).length);
      });

      callObject.on('left-meeting', () => {
        setIsCallActive(false);
        onLeave?.();
      });

      callObject.on('error', (error) => {
        console.error('Daily.co error:', error);
        toast({
          title: 'Call error',
          description: error.errorMsg || 'An error occurred during the call',
          variant: 'destructive',
        });
        setIsLoading(false);
      });

      // Join the meeting
      await callObject.join({ url: roomUrl });
    } catch (error) {
      console.error('Error starting call:', error);
      toast({
        title: 'Failed to start call',
        description: 'Could not connect to the video call',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const endCall = async () => {
    if (callObjectRef.current) {
      await callObjectRef.current.leave();
      await callObjectRef.current.destroy();
      callObjectRef.current = null;
    }
    setIsCallActive(false);
    toast({
      title: 'Call ended',
      description: 'You have left the meeting',
    });
    onLeave?.();
  };

  const toggleCamera = () => {
    if (callObjectRef.current) {
      callObjectRef.current.setLocalVideo(!isCameraOn);
      setIsCameraOn(!isCameraOn);
    }
  };

  const toggleMic = () => {
    if (callObjectRef.current) {
      callObjectRef.current.setLocalAudio(!isMicOn);
      setIsMicOn(!isMicOn);
    }
  };

  if (isCallActive) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {/* Video Container */}
          <div className="relative">
            <div 
              ref={containerRef}
              className="aspect-video bg-accent rounded-lg overflow-hidden"
            />
            
            {/* Participant Badge */}
            <Badge className="absolute top-4 left-4 z-10">
              <Users className="h-3 w-3 mr-1" />
              {participantCount} {participantCount === 1 ? 'participant' : 'participants'}
            </Badge>
          </div>

          {/* Call Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={isCameraOn ? 'default' : 'destructive'}
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={toggleCamera}
            >
              {isCameraOn ? (
                <Video className="h-5 w-5" />
              ) : (
                <VideoOff className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant={isMicOn ? 'default' : 'destructive'}
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={toggleMic}
            >
              {isMicOn ? (
                <Mic className="h-5 w-5" />
              ) : (
                <MicOff className="h-5 w-5" />
              )}
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
