import { useEffect, useRef, useCallback, useState } from "react";
import { useDJBroadcast, TRACKS, DeckSetState } from "@/hooks/useDJBroadcast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Persistent DJ Audio Engine — always mounted, plays broadcast audio for ALL users.
 * Admin controls the state; all users hear the same mix.
 * Also listens for live announcement broadcasts.
 */
const DJAudioEngine = () => {
  const { user } = useAuth();
  const { djState } = useDJBroadcast(user?.email);
  const [announcementLive, setAnnouncementLive] = useState(false);
  const [announcerName, setAnnouncerName] = useState<string | null>(null);

  const audioARef = useRef<HTMLAudioElement | null>(null);
  const audioBRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainARef = useRef<GainNode | null>(null);
  const gainBRef = useRef<GainNode | null>(null);
  const bassARef = useRef<BiquadFilterNode | null>(null);
  const midARef = useRef<BiquadFilterNode | null>(null);
  const highARef = useRef<BiquadFilterNode | null>(null);
  const bassBRef = useRef<BiquadFilterNode | null>(null);
  const midBRef = useRef<BiquadFilterNode | null>(null);
  const highBRef = useRef<BiquadFilterNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const delayGainRef = useRef<GainNode | null>(null);
  const initDone = useRef(false);

  // Listen for announcement broadcasts
  useEffect(() => {
    const channel = supabase.channel('hot-deals-dj-control');
    channel.on('broadcast', { event: 'mic-state' }, (payload) => {
      const data = payload?.payload;
      if (data) {
        setAnnouncementLive(!!data.announcementLive);
        setAnnouncerName(data.userName || null);
      }
    }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Init audio elements once
  useEffect(() => {
    if (!audioARef.current) {
      const a = new Audio(); a.crossOrigin = "anonymous"; audioARef.current = a;
    }
    if (!audioBRef.current) {
      const b = new Audio(); b.crossOrigin = "anonymous"; audioBRef.current = b;
    }
    return () => {
      audioARef.current?.pause();
      audioBRef.current?.pause();
      audioCtxRef.current?.close();
    };
  }, []);

  const ensureAudioContext = useCallback(() => {
    if (audioCtxRef.current) return;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const srcA = ctx.createMediaElementSource(audioARef.current!);
    const gA = ctx.createGain(); gainARef.current = gA;
    const bA = ctx.createBiquadFilter(); bA.type = "lowshelf"; bA.frequency.value = 200; bassARef.current = bA;
    const mA = ctx.createBiquadFilter(); mA.type = "peaking"; mA.frequency.value = 1000; mA.Q.value = 1; midARef.current = mA;
    const hA = ctx.createBiquadFilter(); hA.type = "highshelf"; hA.frequency.value = 4000; highARef.current = hA;
    srcA.connect(gA).connect(bA).connect(mA).connect(hA);

    const srcB = ctx.createMediaElementSource(audioBRef.current!);
    const gB = ctx.createGain(); gainBRef.current = gB;
    const bB = ctx.createBiquadFilter(); bB.type = "lowshelf"; bB.frequency.value = 200; bassBRef.current = bB;
    const mB = ctx.createBiquadFilter(); mB.type = "peaking"; mB.frequency.value = 1000; mB.Q.value = 1; midBRef.current = mB;
    const hB = ctx.createBiquadFilter(); hB.type = "highshelf"; hB.frequency.value = 4000; highBRef.current = hB;
    srcB.connect(gB).connect(bB).connect(mB).connect(hB);

    const masterGain = ctx.createGain(); masterGainRef.current = masterGain;
    const delay = ctx.createDelay(1.0); delay.delayTime.value = 0.3;
    const delayGain = ctx.createGain(); delayGain.gain.value = 0; delayGainRef.current = delayGain;

    hA.connect(masterGain);
    hB.connect(masterGain);
    masterGain.connect(ctx.destination);
    masterGain.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(ctx.destination);
    initDone.current = true;
  }, []);

  // Sync audio to broadcast state
  useEffect(() => {
    const audioA = audioARef.current;
    const audioB = audioBRef.current;
    if (!audioA || !audioB) return;

    const activeSetIdx = djState.activeSet || 0;
    const activeSet: DeckSetState = djState.sets?.[activeSetIdx] || {
      deckATrackIndex: djState.deckATrackIndex ?? 0,
      deckBTrackIndex: djState.deckBTrackIndex ?? 3,
      deckAPlaying: djState.deckAPlaying ?? false,
      deckBPlaying: djState.deckBPlaying ?? false,
      crossfade: djState.crossfade ?? 50,
      eqA: { low: 0, mid: 0, high: 0 },
      eqB: { low: 0, mid: 0, high: 0 },
    };

    const trackA = TRACKS[activeSet.deckATrackIndex] || TRACKS[0];
    const trackB = TRACKS[activeSet.deckBTrackIndex] || TRACKS[0];

    if (audioA.src !== trackA.url) {
      audioA.src = trackA.url;
      if (activeSet.deckAPlaying) { ensureAudioContext(); audioA.play().catch(() => {}); }
    }
    if (audioB.src !== trackB.url) {
      audioB.src = trackB.url;
      if (activeSet.deckBPlaying) { ensureAudioContext(); audioB.play().catch(() => {}); }
    }

    if (activeSet.deckAPlaying && audioA.paused) { ensureAudioContext(); audioA.play().catch(() => {}); }
    else if (!activeSet.deckAPlaying && !audioA.paused) audioA.pause();
    if (activeSet.deckBPlaying && audioB.paused) { ensureAudioContext(); audioB.play().catch(() => {}); }
    else if (!activeSet.deckBPlaying && !audioB.paused) audioB.pause();

    const cf = activeSet.crossfade / 100;
    if (gainARef.current) gainARef.current.gain.value = 1 - cf;
    if (gainBRef.current) gainBRef.current.gain.value = cf;
    if (masterGainRef.current) masterGainRef.current.gain.value = djState.volume / 100;

    if (bassARef.current) bassARef.current.gain.value = djState.effects.bass ? 15 : activeSet.eqA.low;
    if (midARef.current) midARef.current.gain.value = activeSet.eqA.mid;
    if (highARef.current) highARef.current.gain.value = activeSet.eqA.high;
    if (bassBRef.current) bassBRef.current.gain.value = djState.effects.bass ? 15 : activeSet.eqB.low;
    if (midBRef.current) midBRef.current.gain.value = activeSet.eqB.mid;
    if (highBRef.current) highBRef.current.gain.value = activeSet.eqB.high;

    if (delayGainRef.current) delayGainRef.current.gain.value = djState.effects.echo ? 0.4 : 0;
  }, [djState, ensureAudioContext]);

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

  // Invisible — just runs audio
  return null;
};

export default DJAudioEngine;
