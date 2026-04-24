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
  const [locationPermissionState, setLocationPermissionState] = useState<PermissionState | "unsupported">("prompt");
  const channelRef = useRef<RealtimeChannel | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const myColor = user ? colorFor(user.id) : "#888";
  const myName =
    (user?.user_metadata?.full_name as string) ||
    user?.email?.split("@")[0] ||
    "Anonymous";

  const lastFixRef = useRef<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);

  const applyPosition = useCallback((pos: GeolocationPosition) => {
    setLocationError(null);
    const next = {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      heading: pos.coords.heading,
      accuracy: pos.coords.accuracy || 30,
    };

    // Anti-jitter filter: GPS fixes drift several meters even when standing still.
    // Only commit a new origin when the new fix is meaningfully different OR
    // when the new fix is significantly more accurate than what we have.
    const last = lastFixRef.current;
    if (last) {
      const dLat = (next.latitude - last.latitude) * 111_320;
      const dLon =
        (next.longitude - last.longitude) *
        111_320 *
        Math.cos((last.latitude * Math.PI) / 180);
      const moved = Math.sqrt(dLat * dLat + dLon * dLon);
      // Movement must exceed BOTH our prior accuracy and the new accuracy/2.
      // Otherwise we treat it as jitter and keep the locked origin.
      const movementThreshold = Math.max(3, last.accuracy * 0.6, next.accuracy * 0.5);
      const accuracyImproved = next.accuracy < last.accuracy * 0.6;
      if (moved < movementThreshold && !accuracyImproved) {
        // Keep the locked origin; only update heading silently.
        if (next.heading != null) {
          setMyLocation((prev) =>
            prev ? { ...prev, heading: next.heading } : next
          );
        }
        return;
      }
    }

    lastFixRef.current = {
      latitude: next.latitude,
      longitude: next.longitude,
      accuracy: next.accuracy,
    };
    setMyLocation(next);
  }, []);

  const describeGeoError = useCallback((err: GeolocationPositionError | GeolocationPositionErrorLike) => {
    if (err.code === 1) return "Location access was denied.";
    if (err.code === 2) return "Location is unavailable right now.";
    if (err.code === 3) return "Location request timed out.";
    return err.message || "Location is unavailable.";
  }, []);

  const readPermissionState = useCallback(async () => {
    if (!navigator.permissions?.query) {
      setLocationPermissionState("unsupported");
      return "unsupported" as const;
    }

    try {
      const status = await navigator.permissions.query({
        name: "geolocation" as PermissionName,
      });
      setLocationPermissionState(status.state);
      return status.state;
    } catch {
      setLocationPermissionState("unsupported");
      return "unsupported" as const;
    }
  }, []);

  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationError("This device does not support location.");
      return null;
    }

    const permissionState = await readPermissionState();
    if (permissionState === "denied") {
      setLocationError(
        "Location is blocked in your browser settings. Enable it for this site, then try again."
      );
      return null;
    }

    return await new Promise<typeof myLocation>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocationPermissionState("granted");
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
          if (err.code === 1) setLocationPermissionState("denied");
          setLocationError(message);
          console.warn("[Galaxy] geolocation error", { code: err.code, message: err.message });
          resolve(null);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
      );
    });
  }, [applyPosition, describeGeoError, readPermissionState]);

  // Geolocation watcher
  useEffect(() => {
    if (!active || !navigator.geolocation) return;
    let cancelled = false;

    (async () => {
      const permissionState = await readPermissionState();
      if (cancelled || permissionState === "denied") {
        if (permissionState === "denied") {
          setLocationError(
            "Location is blocked in your browser settings. Enable it for this site to enter AR mode."
          );
        }
        return;
      }

      void requestLocation();
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setLocationPermissionState("granted");
          applyPosition(pos);
        },
        (err) => {
          const message = describeGeoError(err);
          if (err.code === 1) {
            setLocationPermissionState("denied");
            if (watchIdRef.current !== null) {
              navigator.geolocation.clearWatch(watchIdRef.current);
              watchIdRef.current = null;
            }
          }
          setLocationError(message);
          console.warn("[Galaxy] geolocation error", { code: err.code, message: err.message });
        },
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
      );
    })();

    return () => {
      cancelled = true;
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [active, applyPosition, describeGeoError, readPermissionState, requestLocation]);

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
    locationPermissionState,
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
