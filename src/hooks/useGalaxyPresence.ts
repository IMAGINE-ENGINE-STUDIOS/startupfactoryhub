import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface GalaxyPeer {
  userId: string;
  name: string;
  color: string;
  latitude: number;
  longitude: number;
  heading: number | null;
  lastSeen: number;
}

const COLORS = [
  "#ff6b9d", "#4ecdc4", "#ffe66d", "#a78bfa", "#f97316",
  "#22d3ee", "#84cc16", "#ec4899", "#0ea5e9", "#f43f5e",
];

const colorFor = (id: string) =>
  COLORS[id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];

/**
 * Realtime presence channel for Galaxy. Broadcasts the user's exact GPS location
 * and tracks all other peers in the world (filter by distance in the consumer).
 */
export const useGalaxyPresence = (active: boolean) => {
  const { user } = useAuth();
  const [peers, setPeers] = useState<GalaxyPeer[]>([]);
  const [myLocation, setMyLocation] = useState<{
    latitude: number;
    longitude: number;
    heading: number | null;
    accuracy: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const myColor = user ? colorFor(user.id) : "#888";
  const myName =
    (user?.user_metadata?.full_name as string) ||
    user?.email?.split("@")[0] ||
    "Anonymous";

  const applyPosition = useCallback((pos: GeolocationPosition) => {
    setLocationError(null);
    setMyLocation({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      heading: pos.coords.heading,
      accuracy: pos.coords.accuracy,
    });
  }, []);

  const describeGeoError = useCallback((err: GeolocationPositionError | GeolocationPositionErrorLike) => {
    if (err.code === 1) return "Location access was denied.";
    if (err.code === 2) return "Location is unavailable right now.";
    if (err.code === 3) return "Location request timed out.";
    return err.message || "Location is unavailable.";
  }, []);

  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationError("This device does not support location.");
      return null;
    }

    return await new Promise<typeof myLocation>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          applyPosition(pos);
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            heading: pos.coords.heading,
            accuracy: pos.coords.accuracy,
          });
        },
        (err) => {
          const message = describeGeoError(err);
          setLocationError(message);
          console.warn("[Galaxy] geolocation error", { code: err.code, message: err.message });
          resolve(null);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
      );
    });
  }, [applyPosition, describeGeoError]);

  // Geolocation watcher
  useEffect(() => {
    if (!active || !navigator.geolocation) return;
    void requestLocation();
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => applyPosition(pos),
      (err) => {
        const message = describeGeoError(err);
        setLocationError(message);
        console.warn("[Galaxy] geolocation error", { code: err.code, message: err.message });
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
    );
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [active, applyPosition, describeGeoError, requestLocation]);

  // Presence channel
  useEffect(() => {
    if (!active || !user) return;
    const channel = supabase.channel("galaxy-presence", {
      config: { presence: { key: user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const list: GalaxyPeer[] = [];
        Object.entries(state).forEach(([id, arr]) => {
          if (id === user.id) return;
          const p = (arr as any[])[0];
          if (p?.latitude != null && p?.longitude != null) {
            list.push({
              userId: id,
              name: p.name || "Explorer",
              color: p.color || colorFor(id),
              latitude: p.latitude,
              longitude: p.longitude,
              heading: p.heading ?? null,
              lastSeen: Date.now(),
            });
          }
        });
        setPeers(list);
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [active, user]);

  // Push our location whenever it changes
  useEffect(() => {
    if (!channelRef.current || !myLocation || !user) return;
    channelRef.current.track({
      userId: user.id,
      name: myName,
      color: myColor,
      latitude: myLocation.latitude,
      longitude: myLocation.longitude,
      heading: myLocation.heading,
    });
  }, [myLocation, user, myName, myColor]);

  const locationDenied = locationError?.toLowerCase().includes("denied") ?? false;

  return {
    peers,
    myLocation,
    myColor,
    myName,
    requestLocation,
    locationError,
    locationDenied,
  };
};

interface GeolocationPositionErrorLike {
  code: number;
  message: string;
}

/** Haversine distance in meters between two GPS coordinates. */
export const distanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

/**
 * Convert GPS lat/lon delta into local east/north meters relative to an origin.
 * Used to position other users + drops in 3D camera space.
 */
export const gpsToLocalMeters = (
  originLat: number,
  originLon: number,
  lat: number,
  lon: number
) => {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const east = toRad(lon - originLon) * Math.cos(toRad(originLat)) * R;
  const north = toRad(lat - originLat) * R;
  return { east, north };
};
