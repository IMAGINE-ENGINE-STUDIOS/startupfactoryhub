import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  Copy,
  Calendar,
  Users,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function VideoConferencing() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const { toast } = useToast();

  const meetingLink = 'https://meet.startuphub.com/demo-meeting-123';

  const copyMeetingLink = () => {
    navigator.clipboard.writeText(meetingLink);
    toast({
      title: 'Link copied',
      description: 'Meeting link copied to clipboard',
    });
  };

  const startCall = () => {
    setIsCallActive(true);
    toast({
      title: 'Call started',
      description: 'Your video call is now active',
    });
  };

  const endCall = () => {
    setIsCallActive(false);
    toast({
      title: 'Call ended',
      description: 'The video call has been terminated',
    });
  };

  if (isCallActive) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {/* Video Preview */}
          <div className="relative aspect-video bg-accent rounded-lg overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Video className="h-16 w-16 mx-auto mb-2 opacity-50" />
                <p className="text-muted-foreground">Video call in progress</p>
              </div>
            </div>
            
            {/* Participant Badge */}
            <Badge className="absolute top-4 left-4">
              <Users className="h-3 w-3 mr-1" />
              3 participants
            </Badge>
          </div>

          {/* Call Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={isCameraOn ? 'default' : 'destructive'}
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={() => setIsCameraOn(!isCameraOn)}
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
              onClick={() => setIsMicOn(!isMicOn)}
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

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Video className="h-5 w-5" />
        <h3 className="font-semibold">Video Conferencing</h3>
      </div>

      <div className="space-y-4">
        {/* Quick Start */}
        <div className="space-y-2">
          <Label>Start Instant Meeting</Label>
          <Button className="w-full" onClick={startCall}>
            <Video className="h-4 w-4 mr-2" />
            Start Video Call
          </Button>
        </div>

        {/* Meeting Link */}
        <div className="space-y-2">
          <Label>Share Meeting Link</Label>
          <div className="flex gap-2">
            <Input value={meetingLink} readOnly />
            <Button variant="outline" size="icon" onClick={copyMeetingLink}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Schedule Meeting */}
        <div className="space-y-2">
          <Label>Schedule for Later</Label>
          <Button variant="outline" className="w-full">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Meeting
          </Button>
        </div>

        {/* Upcoming Meetings */}
        <div className="space-y-2">
          <Label>Upcoming Meetings</Label>
          <Card className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h5 className="font-medium">Investor Call</h5>
                <p className="text-sm text-muted-foreground">Today at 2:00 PM</p>
              </div>
              <Button size="sm" onClick={startCall}>
                Join
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </Card>
  );
}
