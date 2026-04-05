import { useEffect, useRef, useState } from "react";
import { useDJBroadcast, TRACKS, DeckSetState } from "@/hooks/useDJBroadcast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface SetAudioPair {
  audioA: HTMLAudioElement;
  audioB: HTMLAudioElement;
  ctx: AudioContext | null;
  gainA: GainNode | null;
  gainB: GainNode | null;
  bassA: BiquadFilterNode | null;
  midA: BiquadFilterNode | null;
  highA: BiquadFilterNode | null;
  bassB: BiquadFilterNode | null;
  midB: BiquadFilterNode | null;
  highB: BiquadFilterNode | null;
  masterGain: GainNode | null;
  delayGain: GainNode | null;
  initialized: boolean;
}

interface AnnouncementChunkPayload {
  samples: number[];
  sampleRate: number;
  channels: number;
}

const createAudioPair = (): SetAudioPair => {
  const a = new Audio(); a.crossOrigin = "anonymous";
  const b = new Audio(); b.crossOrigin = "anonymous";
  return {
    audioA: a, audioB: b, ctx: null,
    gainA: null, gainB: null,
    bassA: null, midA: null, highA: null,
    bassB: null, midB: null, highB: null,
    masterGain: null, delayGain: null,
    initialized: false,
  };
};

const ensureCtx = (pair: SetAudioPair) => {
  if (pair.initialized) return;
  const ctx = new AudioContext();
  pair.ctx = ctx;

  const srcA = ctx.createMediaElementSource(pair.audioA);
  const gA = ctx.createGain(); pair.gainA = gA;
  const bA = ctx.createBiquadFilter(); bA.type = "lowshelf"; bA.frequency.value = 200; pair.bassA = bA;
  const mA = ctx.createBiquadFilter(); mA.type = "peaking"; mA.frequency.value = 1000; mA.Q.value = 1; pair.midA = mA;
  const hA = ctx.createBiquadFilter(); hA.type = "highshelf"; hA.frequency.value = 4000; pair.highA = hA;
  srcA.connect(gA).connect(bA).connect(mA).connect(hA);

  const srcB = ctx.createMediaElementSource(pair.audioB);
  const gB = ctx.createGain(); pair.gainB = gB;
  const bB = ctx.createBiquadFilter(); bB.type = "lowshelf"; bB.frequency.value = 200; pair.bassB = bB;
  const mB = ctx.createBiquadFilter(); mB.type = "peaking"; mB.frequency.value = 1000; mB.Q.value = 1; pair.midB = mB;
  const hB = ctx.createBiquadFilter(); hB.type = "highshelf"; hB.frequency.value = 4000; pair.highB = hB;
  srcB.connect(gB).connect(bB).connect(mB).connect(hB);

  const mg = ctx.createGain(); pair.masterGain = mg;
  const delay = ctx.createDelay(1.0); delay.delayTime.value = 0.3;
  const dg = ctx.createGain(); dg.gain.value = 0; pair.delayGain = dg;

  hA.connect(mg); hB.connect(mg);
  mg.connect(ctx.destination);
  mg.connect(delay); delay.connect(dg); dg.connect(ctx.destination);
  pair.initialized = true;
};

/**
 * Persistent DJ Audio Engine — always mounted, plays broadcast audio for ALL users.
 * Manages one audio pair per deck set so all sets play simultaneously.
 */
const DJAudioEngine = () => {
  const { user } = useAuth();
  const { djState } = useDJBroadcast(user?.email);
  const [announcementLive, setAnnouncementLive] = useState(false);
  const [announcerName, setAnnouncerName] = useState<string | null>(null);
  const pairsRef = useRef<Map<number, SetAudioPair>>(new Map());
  
  // Gapless announcement playback — schedule raw PCM chunks
  const announcementCtxRef = useRef<AudioContext | null>(null);
  const nextChunkTimeRef = useRef(0);

  const getAnnouncementCtx = () => {
    if (!announcementCtxRef.current || announcementCtxRef.current.state === 'closed') {
      announcementCtxRef.current = new AudioContext();
      nextChunkTimeRef.current = 0;
    }
    return announcementCtxRef.current;
  };

  // Listen for announcement broadcasts AND audio chunks
  useEffect(() => {
    const channel = supabase.channel('hot-deals-dj-announce');

    channel.on('broadcast', { event: 'mic-state' }, (payload) => {
      const data = payload?.payload;
      if (data) {
        setAnnouncementLive(!!data.announcementLive);
        setAnnouncerName(data.userName || null);

        if (!data.announcementLive) {
          // Reset chunk scheduling when announcement ends
          nextChunkTimeRef.current = 0;
        }
      }
    });

    channel.on('broadcast', { event: 'mic-audio' }, (payload) => {
      const data = payload?.payload;
      if (!data?.samples?.length || !data?.sampleRate) return;

      try {
        const ctx = getAnnouncementCtx();
        if (ctx.state === 'suspended') ctx.resume();

        const payload = data as AnnouncementChunkPayload;
        const channelCount = Math.max(1, payload.channels || 1);
        const frameCount = Math.floor(payload.samples.length / channelCount);
        if (frameCount <= 0) return;

        const audioBuffer = ctx.createBuffer(channelCount, frameCount, payload.sampleRate);
        for (let channel = 0; channel < channelCount; channel++) {
          const channelData = audioBuffer.getChannelData(channel);
          for (let i = 0; i < frameCount; i++) {
            channelData[i] = payload.samples[i * channelCount + channel] ?? 0;
          }
        }

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);

        const now = ctx.currentTime;
        const startTime = Math.max(now, nextChunkTimeRef.current);
        source.start(startTime);
        nextChunkTimeRef.current = startTime + audioBuffer.duration;
      } catch (err) {
        console.warn('Failed to play announcement chunk:', err);
      }
    });

    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      pairsRef.current.forEach(pair => {
        pair.audioA.pause(); pair.audioB.pause();
        pair.ctx?.close();
      });
      pairsRef.current.clear();
      announcementCtxRef.current?.close();
      announcementCtxRef.current = null;
    };
  }, []);

  // Sync ALL sets to audio
  useEffect(() => {
    const sets: DeckSetState[] = djState.sets?.length ? djState.sets : [{
      deckATrackIndex: djState.deckATrackIndex ?? 0,
      deckBTrackIndex: djState.deckBTrackIndex ?? 3,
      deckASourceUrl: null,
      deckBSourceUrl: null,
      deckALabel: null,
      deckBLabel: null,
      deckAPlaying: djState.deckAPlaying ?? false,
      deckBPlaying: djState.deckBPlaying ?? false,
      crossfade: djState.crossfade ?? 50,
      eqA: { low: 0, mid: 0, high: 0 },
      eqB: { low: 0, mid: 0, high: 0 },
    }];

    const activeKeys = new Set<number>();

    sets.forEach((set, idx) => {
      activeKeys.add(idx);
      let pair = pairsRef.current.get(idx);
      if (!pair) {
        pair = createAudioPair();
        pairsRef.current.set(idx, pair);
      }

      const trackA = TRACKS[set.deckATrackIndex] || TRACKS[0];
      const trackB = TRACKS[set.deckBTrackIndex] || TRACKS[0];
      const sourceUrlA = set.deckASourceUrl || trackA.url;
      const sourceUrlB = set.deckBSourceUrl || trackB.url;

      // Sync track URLs
      if (pair.audioA.src !== sourceUrlA) {
        pair.audioA.src = sourceUrlA;
        if (set.deckAPlaying) { ensureCtx(pair); pair.audioA.play().catch(() => {}); }
      }
      if (pair.audioB.src !== sourceUrlB) {
        pair.audioB.src = sourceUrlB;
        if (set.deckBPlaying) { ensureCtx(pair); pair.audioB.play().catch(() => {}); }
      }

      // Sync play/pause
      if (set.deckAPlaying && pair.audioA.paused) { ensureCtx(pair); pair.audioA.play().catch(() => {}); }
      else if (!set.deckAPlaying && !pair.audioA.paused) pair.audioA.pause();
      if (set.deckBPlaying && pair.audioB.paused) { ensureCtx(pair); pair.audioB.play().catch(() => {}); }
      else if (!set.deckBPlaying && !pair.audioB.paused) pair.audioB.pause();

      if (!pair.initialized) return;

      // Crossfade & volume
      const cf = set.crossfade / 100;
      if (pair.gainA) pair.gainA.gain.value = 1 - cf;
      if (pair.gainB) pair.gainB.gain.value = cf;
      if (pair.masterGain) pair.masterGain.gain.value = djState.volume / 100;

      // EQ
      if (pair.bassA) pair.bassA.gain.value = djState.effects.bass ? 15 : set.eqA.low;
      if (pair.midA) pair.midA.gain.value = set.eqA.mid;
      if (pair.highA) pair.highA.gain.value = set.eqA.high;
      if (pair.bassB) pair.bassB.gain.value = djState.effects.bass ? 15 : set.eqB.low;
      if (pair.midB) pair.midB.gain.value = set.eqB.mid;
      if (pair.highB) pair.highB.gain.value = set.eqB.high;
      if (pair.delayGain) pair.delayGain.gain.value = djState.effects.echo ? 0.4 : 0;
    });

    // Cleanup removed sets
    pairsRef.current.forEach((pair, key) => {
      if (!activeKeys.has(key)) {
        pair.audioA.pause(); pair.audioB.pause();
        pair.ctx?.close();
        pairsRef.current.delete(key);
      }
    });
  }, [djState]);

  // Show live announcement banner globally
  if (announcementLive) {
    return (
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-6 py-2 rounded-full animate-pulse"
        style={{
          background: 'linear-gradient(90deg, rgba(239,68,68,0.9), rgba(249,115,22,0.9))',
          boxShadow: '0 0 30px rgba(239,68,68,0.5)',
          border: '2px solid rgba(255,255,255,0.3)',
        }}>
        <div className="w-3 h-3 rounded-full bg-white animate-ping" />
        <span className="text-sm font-futuristic font-bold tracking-[0.15em] text-white">
          🔴 LIVE ANNOUNCEMENT
        </span>
        {announcerName && (
          <span className="text-xs font-mono text-white/70">{announcerName}</span>
        )}
      </div>
    );
  }

  return null;
};

export default DJAudioEngine;
