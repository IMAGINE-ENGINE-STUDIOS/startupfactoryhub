import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface LiveRoom {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  meeting_link: string;
  is_active: boolean;
  is_public: boolean;
  created_at: string;
  expires_at: string;
  creator?: {
    full_name: string;
    avatar_url: string | null;
  };
  participant_count: number;
}

export const useLiveRooms = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<LiveRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchRooms = useCallback(async () => {
    try {
      // Fetch active rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from('live_rooms')
        .select('*')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (roomsError) throw roomsError;

      if (!roomsData || roomsData.length === 0) {
        setRooms([]);
        return;
      }

      // Fetch creator profiles
      const creatorIds = [...new Set(roomsData.map(r => r.creator_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', creatorIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Fetch participant counts
      const { data: participantCounts } = await supabase
        .from('live_room_participants')
        .select('room_id');

      const countMap = new Map<string, number>();
      participantCounts?.forEach(p => {
        countMap.set(p.room_id, (countMap.get(p.room_id) || 0) + 1);
      });

      const enrichedRooms: LiveRoom[] = roomsData.map(room => ({
        ...room,
        creator: profileMap.get(room.creator_id) || { full_name: 'Unknown', avatar_url: null },
        participant_count: countMap.get(room.id) || 0,
      }));

      setRooms(enrichedRooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Real-time subscriptions
  useEffect(() => {
    const roomsChannel = supabase
      .channel('live-rooms-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_rooms' },
        () => fetchRooms()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_room_participants' },
        () => fetchRooms()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomsChannel);
    };
  }, [fetchRooms]);

  const createRoom = async (name: string, description?: string, isPublic: boolean = true) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to create a room',
        variant: 'destructive',
      });
      return null;
    }

    setCreating(true);
    try {
      const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(); // 12 hours

      // Create Whereby room
      const { data: wherebyData, error: wherebyError } = await supabase.functions.invoke('create-whereby-room', {
        body: {
          roomName: name,
          startDate: new Date().toISOString(),
          endDate: expiresAt,
        },
      });

      if (wherebyError) throw wherebyError;

      const meetingLink = wherebyData.roomUrl;

      // Create room in database
      const { data: room, error: roomError } = await supabase
        .from('live_rooms')
        .insert({
          name,
          description: description || null,
          creator_id: user.id,
          meeting_link: meetingLink,
          is_public: isPublic,
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // If public, create a feed post
      if (isPublic) {
        await supabase.from('feed_posts').insert({
          content: `Started a live room: ${name}`,
          user_id: user.id,
          post_type: 'live_room',
          room_data: { 
            room_id: room.id, 
            meeting_link: meetingLink,
            room_name: name,
            description: description || null
          },
        } as any);
      }

      toast({
        title: 'Room Created',
        description: `"${name}" is now live!`,
      });

      await fetchRooms();
      return room;
    } catch (error) {
      console.error('Error creating room:', error);
      toast({
        title: 'Error',
        description: 'Failed to create room',
        variant: 'destructive',
      });
      return null;
    } finally {
      setCreating(false);
    }
  };

  const joinRoom = async (roomId: string) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to join a room',
        variant: 'destructive',
      });
      return false;
    }

    try {
      await supabase
        .from('live_room_participants')
        .upsert({
          room_id: roomId,
          user_id: user.id,
        }, { onConflict: 'room_id,user_id' });

      return true;
    } catch (error) {
      console.error('Error joining room:', error);
      return false;
    }
  };

  const leaveRoom = async (roomId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('live_room_participants')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  };

  const deleteRoom = async (roomId: string) => {
    // IMPORTANT: use session from Supabase to ensure requests carry a valid JWT
    const { data: { session } } = await supabase.auth.getSession();
    const authedUserId = session?.user?.id;

    if (!authedUserId) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in again to close a room',
        variant: 'destructive',
      });
      return false;
    }

    const closeRoom = async (actorId: string) => {
      return supabase
        .from('live_rooms')
        .update({ is_active: false })
        .eq('id', roomId)
        .eq('creator_id', actorId);
    };

    try {
      // Close the room first so we don't partially delete data if closing fails.
      let { error } = await closeRoom(authedUserId);

      // If the JWT is stale, refresh once and retry.
      if (error?.code === '42501') {
        await supabase.auth.refreshSession();
        const { data: { session: refreshedSession } } = await supabase.auth.getSession();
        const refreshedUserId = refreshedSession?.user?.id;

        if (!refreshedUserId) {
          throw error;
        }

        ({ error } = await closeRoom(refreshedUserId));
      }

      if (error) throw error;

      // Cleanup: remove participants and associated feed post.
      await supabase
        .from('live_room_participants')
        .delete()
        .eq('room_id', roomId);

      await supabase
        .from('feed_posts')
        .delete()
        .eq('user_id', authedUserId)
        .eq('post_type', 'live_room')
        .contains('room_data', { room_id: roomId });

      toast({
        title: 'Room Closed',
        description: 'The room has been closed',
      });

      await fetchRooms();
      return true;
    } catch (error: any) {
      console.error('Error closing room:', error);
      toast({
        title: 'Error',
        description:
          error?.code === '42501'
            ? 'Permission denied: only the room creator can close this room.'
            : 'Failed to close room',
        variant: 'destructive',
      });
      return false;
    }
  };

  const permanentlyDeleteRoom = async (roomId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const authedUserId = session?.user?.id;

    if (!authedUserId) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in again to delete a room',
        variant: 'destructive',
      });
      return false;
    }

    const deleteRoomRow = async (actorId: string) => {
      return supabase
        .from('live_rooms')
        .delete()
        .eq('id', roomId)
        .eq('creator_id', actorId);
    };

    try {
      let { error } = await deleteRoomRow(authedUserId);

      if (error?.code === '42501') {
        await supabase.auth.refreshSession();
        const { data: { session: refreshedSession } } = await supabase.auth.getSession();
        const refreshedUserId = refreshedSession?.user?.id;

        if (!refreshedUserId) {
          throw error;
        }

        ({ error } = await deleteRoomRow(refreshedUserId));
      }

      if (error) throw error;

      // Cleanup (best-effort)
      await supabase
        .from('live_room_participants')
        .delete()
        .eq('room_id', roomId);

      await supabase
        .from('feed_posts')
        .delete()
        .eq('user_id', authedUserId)
        .eq('post_type', 'live_room')
        .contains('room_data', { room_id: roomId });

      toast({
        title: 'Room Deleted',
        description: 'The room has been permanently deleted',
      });

      await fetchRooms();
      return true;
    } catch (error: any) {
      console.error('Error deleting room:', error);
      toast({
        title: 'Error',
        description:
          error?.code === '42501'
            ? 'Permission denied: only the room creator can delete this room.'
            : 'Failed to delete room',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    rooms,
    loading,
    creating,
    createRoom,
    joinRoom,
    leaveRoom,
    deleteRoom,
    permanentlyDeleteRoom,
    refetch: fetchRooms,
  };
};
