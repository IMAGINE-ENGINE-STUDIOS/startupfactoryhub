import { useEffect, useState, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TrackedUser {
  userId: string;
  userName: string;
  latitude: number;
  longitude: number;
  color: string;
  avatar?: string;
  lastUpdated: string;
}

const TRACKING_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
  '#E74C3C', '#3498DB', '#2ECC71', '#9B59B6', '#F39C12'
];

export const useMapTracking = (sessionId: string | null) => {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [trackedUsers, setTrackedUsers] = useState<TrackedUser[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [userColor, setUserColor] = useState<string>('');
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch profile for display name
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('user_id', user.id)
          .single();

        const userName = profile?.full_name || user.email?.split('@')[0] || 'Anonymous';
        setCurrentUser({ 
          id: user.id, 
          email: user.email || 'Anonymous',
          name: userName
        });
        // Assign consistent color based on user ID
        const colorIndex = user.id.charCodeAt(0) % TRACKING_COLORS.length;
        setUserColor(TRACKING_COLORS[colorIndex]);
      }
    };
    getUser();
  }, []);

  // Broadcast location update
  const broadcastLocation = useCallback((lat: number, lng: number) => {
    if (!channel || !currentUser) return;

    channel.track({
      userId: currentUser.id,
      userName: currentUser.name,
      latitude: lat,
      longitude: lng,
      color: userColor,
      lastUpdated: new Date().toISOString(),
    });
  }, [channel, currentUser, userColor]);

  // Start tracking location
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsTracking(true);

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        broadcastLocation(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('Unable to get your location');
      },
      { enableHighAccuracy: true }
    );

    // Watch position changes
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        broadcastLocation(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error('Error watching location:', error);
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 2000 // Update every 2 seconds max
      }
    );
  }, [broadcastLocation]);

  // Stop tracking location
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Setup tracking channel
  useEffect(() => {
    if (!sessionId || !currentUser) return;

    const trackingChannel = supabase.channel(`map-tracking-${sessionId}`, {
      config: {
        presence: {
          key: currentUser.id,
        },
      },
    });

    // Handle presence sync
    trackingChannel
      .on('presence', { event: 'sync' }, () => {
        const state = trackingChannel.presenceState();
        const users: TrackedUser[] = [];

        Object.keys(state).forEach((id) => {
          const presences = state[id] as any[];
          if (presences && presences.length > 0) {
            const presence = presences[0];
            
            // Include all users (including current user for debugging, but filter if needed)
            if (id !== currentUser.id && presence.latitude && presence.longitude) {
              users.push({
                userId: presence.userId,
                userName: presence.userName,
                latitude: presence.latitude,
                longitude: presence.longitude,
                color: presence.color,
                lastUpdated: presence.lastUpdated,
              });
            }
          }
        });

        setTrackedUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (key !== currentUser.id) {
          const presence = newPresences[0] as any;
          toast.info(`${presence?.userName || 'Someone'} joined the tracking session`);
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        if (key !== currentUser.id) {
          const presence = leftPresences[0] as any;
          toast.info(`${presence?.userName || 'Someone'} left the tracking session`);
        }
      });

    // Subscribe to channel
    trackingChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Initial presence with no location until tracking starts
        await trackingChannel.track({
          userId: currentUser.id,
          userName: currentUser.name,
          latitude: null,
          longitude: null,
          color: userColor,
          lastUpdated: new Date().toISOString(),
        });
      }
    });

    setChannel(trackingChannel);

    // Cleanup
    return () => {
      stopTracking();
      trackingChannel.unsubscribe();
    };
  }, [sessionId, currentUser, userColor, stopTracking]);

  // Generate session ID
  const generateSessionId = useCallback(() => {
    return crypto.randomUUID().slice(0, 8);
  }, []);

  return {
    trackedUsers,
    currentUser,
    userColor,
    isTracking,
    startTracking,
    stopTracking,
    generateSessionId,
  };
};
