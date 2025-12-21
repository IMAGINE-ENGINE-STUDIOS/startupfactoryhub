import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Video, Radio, Users, Heart, MessageCircle, Share, Bookmark, Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import VideoMeetingDialog from '@/components/VideoMeetingDialog';

interface RoomData {
  room_id: string;
  meeting_link: string;
  room_name?: string;
  description?: string;
}

interface LiveRoomPostCardProps {
  post: {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    room_data: RoomData;
    profiles?: {
      full_name: string;
      avatar_url?: string;
    } | null;
  };
  isLiked: boolean;
  isBookmarked: boolean;
  likesCount: number;
  commentsCount: number;
  onLike: () => void;
  onBookmark: () => void;
  onComment: () => void;
  onShare: () => void;
  onUserClick?: (userId: string) => void;
}

export default function LiveRoomPostCard({
  post,
  isLiked,
  isBookmarked,
  likesCount,
  commentsCount,
  onLike,
  onBookmark,
  onComment,
  onShare,
  onUserClick
}: LiveRoomPostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isActive, setIsActive] = useState(true);
  const [participantCount, setParticipantCount] = useState(0);
  const [showMeeting, setShowMeeting] = useState(false);
  const [loading, setLoading] = useState(true);

  const roomData = post.room_data;
  const roomId = roomData?.room_id;
  const meetingLink = roomData?.meeting_link;
  const roomName = roomData?.room_name || 'Live Room';
  const description = roomData?.description;

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

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
    if (!user || !roomId) return;
    
    await supabase
      .from('live_room_participants')
      .upsert({ room_id: roomId, user_id: user.id }, { onConflict: 'room_id,user_id' });
    
    setShowMeeting(true);
  };

  const handleLeave = async () => {
    if (!user || !roomId) return;
    
    await supabase
      .from('live_room_participants')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', user.id);
    
    setShowMeeting(false);
  };

  const copyRoomLink = () => {
    if (meetingLink) {
      navigator.clipboard.writeText(meetingLink);
      toast({ title: 'Room link copied!' });
    }
  };

  const openExternalLink = () => {
    if (meetingLink) {
      window.open(meetingLink, '_blank');
    }
  };

  if (!roomData) return null;

  return (
    <>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        {/* Gradient glow border effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-red-400 via-orange-500 to-pink-500 rounded-lg opacity-75 blur" />
        
        <Card className="relative tech-card border-2 border-red-400 overflow-hidden">
          {/* Celebration header badge */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/50 dark:to-orange-950/50 px-4 py-2 border-b flex items-center gap-2">
            <Video className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-sm font-semibold text-red-700 dark:text-red-300">
              📹 Live Room - Join Now!
            </span>
            {isActive && (
              <Badge variant="destructive" className="ml-auto gap-1 animate-pulse">
                <Radio className="w-3 h-3" />
                LIVE
              </Badge>
            )}
            {!isActive && (
              <Badge variant="secondary" className="ml-auto">Ended</Badge>
            )}
          </div>

          {/* Gradient Header */}
          <div className="h-20 bg-gradient-to-r from-red-500/20 via-orange-500/20 to-pink-500/20 relative">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          </div>

          <CardContent className="p-5 -mt-8 relative">
            {/* Creator Info */}
            <div className="flex items-center gap-3 mb-4">
              <Avatar 
                className="w-14 h-14 border-4 border-background cursor-pointer ring-2 ring-red-400"
                onClick={() => onUserClick?.(post.user_id)}
              >
                <AvatarImage src={post.profiles?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-red-500 to-orange-500 text-white">
                  {post.profiles?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 
                  className="font-bold text-lg hover:text-primary cursor-pointer"
                  onClick={() => onUserClick?.(post.user_id)}
                >
                  {post.profiles?.full_name || 'Anonymous'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Posted {format(new Date(post.created_at), 'MMM d, yyyy')}
                </p>
              </div>
            </div>

            {/* Room Info */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">{roomName}</h2>
              
              {description && (
                <p className="text-muted-foreground">{description}</p>
              )}

              {/* Key Details */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
                  <Users className="w-4 h-4" />
                  <span className="font-medium">
                    {loading ? '...' : `${participantCount} ${participantCount === 1 ? 'participant' : 'participants'}`}
                  </span>
                </div>
                {isActive && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 text-green-500 border border-green-500/20">
                    <Radio className="w-4 h-4 animate-pulse" />
                    <span className="font-medium">Live Now</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                {isActive && user ? (
                  <Button 
                    className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 shadow-lg shadow-red-500/25"
                    onClick={handleJoin}
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Join Room
                  </Button>
                ) : !isActive ? (
                  <Button 
                    className="flex-1"
                    variant="secondary"
                    disabled
                  >
                    Room Ended
                  </Button>
                ) : (
                  <Button 
                    className="flex-1"
                    variant="secondary"
                    disabled
                  >
                    Sign in to Join
                  </Button>
                )}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={copyRoomLink}
                    title="Copy room link"
                    className="border-red-500/30 hover:border-red-500/50"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={openExternalLink}
                    title="Open in new tab"
                    className="border-red-500/30 hover:border-red-500/50"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Social Actions */}
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/50">
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onLike}
                  className={isLiked ? 'text-red-500' : ''}
                >
                  <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                  {likesCount}
                </Button>
                <Button variant="ghost" size="sm" onClick={onComment}>
                  <MessageCircle className="w-4 h-4 mr-1" />
                  {commentsCount}
                </Button>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={onShare}>
                  <Share className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onBookmark}
                  className={isBookmarked ? 'text-amber-500' : ''}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Floating video emoji */}
        <motion.div 
          className="absolute -top-6 -right-6 text-5xl pointer-events-none"
          animate={{
            y: [0, -10, 0],
            rotate: [0, 10, -10, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          📹
        </motion.div>
      </motion.div>

      <VideoMeetingDialog
        open={showMeeting}
        onOpenChange={(open) => !open && handleLeave()}
        meetingLink={meetingLink || ''}
        meetingTitle={roomName}
      />
    </>
  );
}
