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
      // Create Whereby room
      const { data: wherebyData, error: wherebyError } = await supabase.functions.invoke('create-whereby-room', {
        body: {
          roomName: name,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
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
    if (!user) return false;

    try {
      // First remove all participants
      await supabase
        .from('live_room_participants')
        .delete()
        .eq('room_id', roomId);

      // Then close the room (set is_active to false)
      const { error } = await supabase
        .from('live_rooms')
        .update({ is_active: false })
        .eq('id', roomId)
        .eq('creator_id', user.id);

      if (error) throw error;

      toast({
        title: 'Room Closed',
        description: 'The room has been closed',
      });

      await fetchRooms();
      return true;
    } catch (error) {
      console.error('Error closing room:', error);
      toast({
        title: 'Error',
        description: 'Failed to close room',
        variant: 'destructive',
      });
      return false;
    }
  };

  const permanentlyDeleteRoom = async (roomId: string) => {
    if (!user) return false;

    try {
      // Remove all participants first
      await supabase
        .from('live_room_participants')
        .delete()
        .eq('room_id', roomId);

      // Permanently delete the room
      const { error } = await supabase
        .from('live_rooms')
        .delete()
        .eq('id', roomId)
        .eq('creator_id', user.id);

      if (error) throw error;

      toast({
        title: 'Room Deleted',
        description: 'The room has been permanently deleted',
      });

      await fetchRooms();
      return true;
    } catch (error) {
      console.error('Error deleting room:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete room',
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
