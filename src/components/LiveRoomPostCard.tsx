import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Users, Radio } from 'lucide-react';
import VideoMeetingDialog from '@/components/VideoMeetingDialog';

interface LiveRoomPostCardProps {
  roomId: string;
  meetingLink: string;
  roomName: string;
}

export default function LiveRoomPostCard({ roomId, meetingLink, roomName }: LiveRoomPostCardProps) {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(true);
  const [participantCount, setParticipantCount] = useState(0);
  const [showMeeting, setShowMeeting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoomData = async () => {
      const [roomResult, participantsResult] = await Promise.all([
        supabase
          .from('live_rooms')
          .select('is_active')
          .eq('id', roomId)
          .single(),
        supabase
          .from('live_room_participants')
          .select('id')
          .eq('room_id', roomId),
      ]);

      if (roomResult.data) {
        setIsActive(roomResult.data.is_active);
      }
      setParticipantCount(participantsResult.data?.length || 0);
      setLoading(false);
    };

    fetchRoomData();

    // Real-time subscription
    const channel = supabase
      .channel(`live-room-post-${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_rooms', filter: `id=eq.${roomId}` },
        (payload: any) => {
          if (payload.new) {
            setIsActive(payload.new.is_active);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_room_participants', filter: `room_id=eq.${roomId}` },
        async () => {
          const { data } = await supabase
            .from('live_room_participants')
            .select('id')
            .eq('room_id', roomId);
          setParticipantCount(data?.length || 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const handleJoin = async () => {
    if (!user) return;
    
    await supabase
      .from('live_room_participants')
      .upsert({ room_id: roomId, user_id: user.id }, { onConflict: 'room_id,user_id' });
    
    setShowMeeting(true);
  };

  const handleLeave = async () => {
    if (!user) return;
    
    await supabase
      .from('live_room_participants')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', user.id);
    
    setShowMeeting(false);
  };

  if (loading) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="animate-pulse h-16 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={`border-2 ${isActive ? 'border-red-500/50 bg-red-500/5' : 'border-muted bg-muted/50'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isActive ? 'bg-red-500/20' : 'bg-muted'}`}>
                <Video className={`w-5 h-5 ${isActive ? 'text-red-500' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {isActive && (
                    <Badge variant="destructive" className="gap-1 animate-pulse">
                      <Radio className="w-3 h-3" />
                      LIVE
                    </Badge>
                  )}
                  {!isActive && (
                    <Badge variant="secondary">Ended</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{participantCount} {participantCount === 1 ? 'participant' : 'participants'}</span>
                </div>
              </div>
            </div>
            
            {isActive && user && (
              <Button onClick={handleJoin} size="sm" className="gap-2">
                <Video className="w-4 h-4" />
                Join Room
              </Button>
            )}
            
            {!isActive && (
              <span className="text-sm text-muted-foreground">Room has ended</span>
            )}
          </div>
        </CardContent>
      </Card>

      <VideoMeetingDialog
        open={showMeeting}
        onOpenChange={(open) => !open && handleLeave()}
        meetingLink={meetingLink}
        meetingTitle={roomName}
      />
    </>
  );
}
