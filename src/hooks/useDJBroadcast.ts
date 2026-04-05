import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface DeckEQ {
  low: number;   // -12 to 12
  mid: number;
  high: number;
}

export interface DeckSetState {
  deckATrackIndex: number;
  deckBTrackIndex: number;
  deckASourceUrl?: string | null;
  deckBSourceUrl?: string | null;
  deckALabel?: string | null;
  deckBLabel?: string | null;
  deckAPlaying: boolean;
  deckBPlaying: boolean;
  crossfade: number; // 0=full A, 100=full B
  eqA: DeckEQ;
  eqB: DeckEQ;
}

export interface DJState {
  volume: number;
  effects: {
    bass: boolean;
    echo: boolean;
    reverb: boolean;
  };
  activeSet: number;
  sets: DeckSetState[];
  // Legacy compat
  trackIndex: number;
  isPlaying: boolean;
  // Flattened from active set for backward compat
  deckATrackIndex: number;
  deckBTrackIndex: number;
  deckAPlaying: boolean;
  deckBPlaying: boolean;
  crossfade: number;
  eq: { low: number; mid: number; high: number; };
}

const DEFAULT_SET: DeckSetState = {
  deckATrackIndex: 0,
  deckBTrackIndex: 3,
  deckASourceUrl: null,
  deckBSourceUrl: null,
  deckALabel: null,
  deckBLabel: null,
  deckAPlaying: false,
  deckBPlaying: false,
  crossfade: 50,
  eqA: { low: 0, mid: 0, high: 0 },
  eqB: { low: 0, mid: 0, high: 0 },
};

const DEFAULT_STATE: DJState = {
  volume: 70,
  effects: { bass: false, echo: false, reverb: false },
  activeSet: 0,
  sets: [{ ...DEFAULT_SET }],
  trackIndex: 0,
  isPlaying: false,
  deckATrackIndex: 0,
  deckBTrackIndex: 3,
  deckAPlaying: false,
  deckBPlaying: false,
  crossfade: 50,
  eq: { low: 0, mid: 0, high: 0 },
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

export const TRACKS: TrackInfo[] = PLAYLISTS.flatMap(p => p.tracks);

export const createDefaultSet = (): DeckSetState => ({
  ...DEFAULT_SET,
  deckATrackIndex: Math.floor(Math.random() * TRACKS.length),
  deckBTrackIndex: Math.floor(Math.random() * TRACKS.length),
});

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
