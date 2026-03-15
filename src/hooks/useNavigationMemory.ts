import { useState, useEffect, useCallback } from 'react';
import { RoutePoint, RouteOption } from './useMapRouting';

const NAV_CACHE_KEY = 'sfh_last_navigation';
const MUTE_PREF_KEY = 'sfh_nav_muted';
const AVOID_TOLLS_KEY = 'sfh_nav_avoid_tolls';

export interface CachedNavigation {
  origin: RoutePoint;
  destination: RoutePoint;
  selectedRouteIndex: number;
  avoidTolls: boolean;
  timestamp: number;
}

const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export function useNavigationMemory() {
  const [lastNavigation, setLastNavigation] = useState<CachedNavigation | null>(null);

  // Load cached navigation on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(NAV_CACHE_KEY);
      if (!raw) return;
      const cached: CachedNavigation = JSON.parse(raw);
      // Only restore if less than 24h old
      if (Date.now() - cached.timestamp < MAX_AGE_MS) {
        setLastNavigation(cached);
      } else {
        localStorage.removeItem(NAV_CACHE_KEY);
      }
    } catch {
      localStorage.removeItem(NAV_CACHE_KEY);
    }
  }, []);

  // Save current navigation to localStorage
  const saveNavigation = useCallback((
    origin: RoutePoint,
    destination: RoutePoint,
    selectedRouteIndex: number,
    avoidTolls: boolean
  ) => {
    const cached: CachedNavigation = {
      origin,
      destination,
      selectedRouteIndex,
      avoidTolls,
      timestamp: Date.now(),
    };
    setLastNavigation(cached);
    try {
      localStorage.setItem(NAV_CACHE_KEY, JSON.stringify(cached));
    } catch { /* quota exceeded */ }
  }, []);

  // Clear cached navigation (on exit or completion)
  const clearNavigation = useCallback(() => {
    setLastNavigation(null);
    localStorage.removeItem(NAV_CACHE_KEY);
  }, []);

  // Mute preference
  const getMutePreference = useCallback((): boolean => {
    return localStorage.getItem(MUTE_PREF_KEY) === 'true';
  }, []);

  const saveMutePreference = useCallback((muted: boolean) => {
    localStorage.setItem(MUTE_PREF_KEY, String(muted));
  }, []);

  // Avoid tolls preference
  const getAvoidTollsPreference = useCallback((): boolean => {
    const val = localStorage.getItem(AVOID_TOLLS_KEY);
    return val === null ? true : val === 'true';
  }, []);

  const saveAvoidTollsPreference = useCallback((avoid: boolean) => {
    localStorage.setItem(AVOID_TOLLS_KEY, String(avoid));
  }, []);

  return {
    lastNavigation,
    saveNavigation,
    clearNavigation,
    getMutePreference,
    saveMutePreference,
    getAvoidTollsPreference,
    saveAvoidTollsPreference,
  };
}
