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

export type GeoPermissionState = 'unknown' | 'prompt' | 'granted' | 'denied' | 'unsupported';
export type ChannelStatus = 'idle' | 'connecting' | 'subscribed' | 'error' | 'closed';
export type LocationSource = 'gps' | 'ip' | null;

const TRACKING_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
  '#E74C3C', '#3498DB', '#2ECC71', '#9B59B6', '#F39C12'
];

const GPS_INITIAL_TIMEOUT_MS = 8000;

async function fetchIpLocation(): Promise<{ lat: number; lng: number } | null> {
  // Try a couple of free IP geolocation providers as a best-effort fallback
  const endpoints = [
    'https://ipapi.co/json/',
    'https://ipwho.is/',
  ];
  for (const url of endpoints) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 5000);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(t);
      if (!res.ok) continue;
      const data = await res.json();
      const lat = Number(data.latitude ?? data.lat);
      const lng = Number(data.longitude ?? data.lon ?? data.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    } catch {
      // try next provider
    }
  }
  return null;
}

export const useMapTracking = (sessionId: string | null) => {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [trackedUsers, setTrackedUsers] = useState<TrackedUser[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [userColor, setUserColor] = useState<string>('');
  const [isTracking, setIsTracking] = useState(false);
  const [permissionState, setPermissionState] = useState<GeoPermissionState>('unknown');
  const [channelStatus, setChannelStatus] = useState<ChannelStatus>('idle');
  const [lastUpdateAt, setLastUpdateAt] = useState<Date | null>(null);
  const [locationSource, setLocationSource] = useState<LocationSource>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Identify current user (auth) or guest fallback
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('user_id', user.id)
          .single();

        const userName = profile?.full_name || user.email?.split('@')[0] || 'Anonymous';
        setCurrentUser({ id: user.id, email: user.email || 'Anonymous', name: userName });
        setUserColor(TRACKING_COLORS[user.id.charCodeAt(0) % TRACKING_COLORS.length]);
      } else {
        let guestId = localStorage.getItem('tracking-guest-id');
        if (!guestId) {
          guestId = `guest-${crypto.randomUUID()}`;
          localStorage.setItem('tracking-guest-id', guestId);
        }
        let guestName = localStorage.getItem('tracking-guest-name');
        if (!guestName) {
          guestName = `Guest ${Math.floor(Math.random() * 9000 + 1000)}`;
          localStorage.setItem('tracking-guest-name', guestName);
        }
        setCurrentUser({ id: guestId, email: 'guest', name: guestName });
        setUserColor(TRACKING_COLORS[guestId.charCodeAt(6) % TRACKING_COLORS.length]);
      }
    };
    getUser();
  }, []);

  // Probe geolocation permission state
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setPermissionState('unsupported');
      return;
    }
    const anyNav = navigator as any;
    if (anyNav.permissions?.query) {
      anyNav.permissions
        .query({ name: 'geolocation' })
        .then((status: any) => {
          setPermissionState(status.state as GeoPermissionState);
          status.onchange = () => setPermissionState(status.state as GeoPermissionState);
        })
        .catch(() => setPermissionState('unknown'));
    } else {
      setPermissionState('unknown');
    }
  }, []);

  // Broadcast location update
  const broadcastLocation = useCallback(
    (lat: number, lng: number, source: LocationSource) => {
      const ch = channelRef.current;
      if (!ch || !currentUser) return;
      ch.track({
        userId: currentUser.id,
        userName: currentUser.name,
        latitude: lat,
        longitude: lng,
        color: userColor,
        lastUpdated: new Date().toISOString(),
      });
      setLastUpdateAt(new Date());
      setLocationSource(source);
    },
    [currentUser, userColor]
  );

  // Start tracking — try GPS, fall back to IP-based location if denied/timeout
  const startTracking = useCallback(async () => {
    setLastError(null);

    if (!('geolocation' in navigator)) {
      setPermissionState('unsupported');
      const ip = await fetchIpLocation();
      if (ip) {
        setIsTracking(true);
        broadcastLocation(ip.lat, ip.lng, 'ip');
        toast.info('Sharing approximate (IP-based) location — GPS unavailable');
      } else {
        toast.error('Geolocation is not supported and IP fallback failed');
      }
      return;
    }

    setIsTracking(true);

    let resolved = false;
    const timer = setTimeout(async () => {
      if (resolved) return;
      // GPS hung — try IP fallback while we keep waiting for GPS
      const ip = await fetchIpLocation();
      if (ip && !resolved) {
        broadcastLocation(ip.lat, ip.lng, 'ip');
        toast.info('Using approximate location while waiting for GPS…');
      }
    }, GPS_INITIAL_TIMEOUT_MS);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolved = true;
        clearTimeout(timer);
        setPermissionState('granted');
        broadcastLocation(position.coords.latitude, position.coords.longitude, 'gps');
      },
      async (error) => {
        resolved = true;
        clearTimeout(timer);
        console.error('Error getting GPS location:', error);
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionState('denied');
          setLastError('Location permission denied');
        } else {
          setLastError(error.message || 'GPS error');
        }
        const ip = await fetchIpLocation();
        if (ip) {
          broadcastLocation(ip.lat, ip.lng, 'ip');
          toast.info('Sharing approximate (IP-based) location instead');
        } else {
          toast.error('Unable to determine your location');
          setIsTracking(false);
        }
      },
      { enableHighAccuracy: true, timeout: GPS_INITIAL_TIMEOUT_MS, maximumAge: 0 }
    );

    try {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          setPermissionState('granted');
          broadcastLocation(position.coords.latitude, position.coords.longitude, 'gps');
        },
        (error) => {
          console.warn('watchPosition error:', error);
          if (error.code === error.PERMISSION_DENIED) setPermissionState('denied');
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 2000 }
      );
    } catch (e) {
      console.warn('watchPosition unavailable', e);
    }
  }, [broadcastLocation]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setLocationSource(null);
  }, []);

  // Setup tracking channel
  useEffect(() => {
    if (!sessionId || !currentUser) return;

    setChannelStatus('connecting');
    const trackingChannel = supabase.channel(`map-tracking-${sessionId}`, {
      config: { presence: { key: currentUser.id } },
    });
    channelRef.current = trackingChannel;

    trackingChannel
      .on('presence', { event: 'sync' }, () => {
        const state = trackingChannel.presenceState();
        const users: TrackedUser[] = [];
        Object.keys(state).forEach((id) => {
          const presences = state[id] as any[];
          if (presences && presences.length > 0) {
            const presence = presences[0];
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

    trackingChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setChannelStatus('subscribed');
        await trackingChannel.track({
          userId: currentUser.id,
          userName: currentUser.name,
          latitude: null,
          longitude: null,
          color: userColor,
          lastUpdated: new Date().toISOString(),
        });
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setChannelStatus('error');
      } else if (status === 'CLOSED') {
        setChannelStatus('closed');
      }
    });

    setChannel(trackingChannel);

    return () => {
      stopTracking();
      setChannelStatus('idle');
      trackingChannel.unsubscribe();
      channelRef.current = null;
    };
  }, [sessionId, currentUser, userColor, stopTracking]);

  const generateSessionId = useCallback(() => crypto.randomUUID().slice(0, 8), []);

  const requestPermission = useCallback(async () => {
    await startTracking();
  }, [startTracking]);

  return {
    trackedUsers,
    currentUser,
    userColor,
    isTracking,
    startTracking,
    stopTracking,
    generateSessionId,
    permissionState,
    channelStatus,
    lastUpdateAt,
    locationSource,
    lastError,
    requestPermission,
  };
};
