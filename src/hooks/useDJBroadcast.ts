import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface DJState {
  volume: number;       // 0-100
  trackIndex: number;
  isPlaying: boolean;
  effects: {
    bass: boolean;
    echo: boolean;
    reverb: boolean;
  };
  eq: {
    low: number;    // -12 to 12
    mid: number;
    high: number;
  };
  crossfade: number; // 0-100 (left to right deck)
}

const DEFAULT_STATE: DJState = {
  volume: 70,
  trackIndex: 0,
  isPlaying: false,
  effects: { bass: false, echo: false, reverb: false },
  eq: { low: 0, mid: 0, high: 0 },
  crossfade: 50,
};

export interface TrackInfo {
  name: string;
  url: string;
  bpm: number;
  genre: string;
}

export const PLAYLISTS: { name: string; tracks: TrackInfo[] }[] = [
  {
    name: "SFH RADIO",
    tracks: [
      { name: "SFH Main", url: "https://ice1.somafm.com/groovesalad-256-mp3", bpm: 120, genre: "Ambient" },
      { name: "Space Station", url: "https://ice1.somafm.com/spacestation-128-mp3", bpm: 90, genre: "Space" },
      { name: "Mission Control", url: "https://ice1.somafm.com/missioncontrol-128-mp3", bpm: 100, genre: "Space/Ambient" },
    ],
  },
  {
    name: "CHILL ZONE",
    tracks: [
      { name: "Groove Salad", url: "https://ice1.somafm.com/groovesalad-256-mp3", bpm: 120, genre: "Chill" },
      { name: "Drone Zone", url: "https://ice1.somafm.com/dronezone-256-mp3", bpm: 70, genre: "Ambient" },
      { name: "Deep Space One", url: "https://ice1.somafm.com/deepspaceone-128-mp3", bpm: 85, genre: "Deep" },
    ],
  },
  {
    name: "BEATS LAB",
    tracks: [
      { name: "DEF CON Radio", url: "https://ice1.somafm.com/defcon-256-mp3", bpm: 130, genre: "Electronic" },
      { name: "The Trip", url: "https://ice1.somafm.com/thetrip-128-mp3", bpm: 128, genre: "Trance" },
      { name: "Fluid", url: "https://ice1.somafm.com/fluid-128-mp3", bpm: 110, genre: "House" },
    ],
  },
  {
    name: "DEEP TECH",
    tracks: [
      { name: "Cliqhop IDM", url: "https://ice1.somafm.com/cliqhop-256-mp3", bpm: 115, genre: "IDM" },
      { name: "Digitalis", url: "https://ice1.somafm.com/digitalis-256-mp3", bpm: 100, genre: "Electronic" },
      { name: "Sonic Universe", url: "https://ice1.somafm.com/sonicuniverse-256-mp3", bpm: 105, genre: "Jazz-Fusion" },
    ],
  },
];

// Flatten for backward compat
export const TRACKS: TrackInfo[] = PLAYLISTS.flatMap(p => p.tracks);

const ADMIN_EMAILS = ['demo-admin@startupfactoryhub.com', 'ceo@imagineengine.space'];

export function useDJBroadcast(userEmail: string | undefined) {
  const [djState, setDjState] = useState<DJState>(DEFAULT_STATE);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isAdmin = ADMIN_EMAILS.includes(userEmail ?? '');

  useEffect(() => {
    const channel = supabase.channel('hot-deals-dj-control', {
      config: { broadcast: { self: true } },
    });

    channel.on('broadcast', { event: 'dj-state' }, ({ payload }) => {
      if (payload) setDjState(payload as DJState);
    });

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, []);

  const broadcast = useCallback((newState: DJState) => {
    if (!isAdmin) return;
    setDjState(newState);
    channelRef.current?.send({
      type: 'broadcast',
      event: 'dj-state',
      payload: newState,
    });
  }, [isAdmin]);

  return { djState, broadcast, isAdmin };
}
