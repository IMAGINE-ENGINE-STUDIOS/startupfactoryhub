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
}

const DEFAULT_STATE: DJState = {
  volume: 70,
  trackIndex: 0,
  isPlaying: false,
  effects: { bass: false, echo: false, reverb: false },
};

export const TRACKS = [
  { name: "SFH Radio", url: "https://stream.zeno.fm/0r0xa792kwzuv", bpm: 128 },
  { name: "Lo-Fi Beats", url: "https://stream.zeno.fm/f3wvbbqmdg8uv", bpm: 85 },
  { name: "Chillhop", url: "https://stream.zeno.fm/4lyee6rqhzzuv", bpm: 90 },
  { name: "Deep House", url: "https://stream.zeno.fm/yn65fsaurfhvv", bpm: 124 },
];

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
