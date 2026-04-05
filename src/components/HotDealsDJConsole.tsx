import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, Lock, Disc3, Zap, AudioLines, Radio, List, Music, Headphones, Gauge } from "lucide-react";
import { useDJBroadcast, PLAYLISTS, TRACKS, DJState } from "@/hooks/useDJBroadcast";
import { useAuth } from "@/contexts/AuthContext";

/* ─── Draggable Vinyl Disc ─── */
const DraggableVinyl = ({
  rotation,
  color,
  label,
  trackName,
  isPlaying,
  onScratch,
  disabled,
}: {
  rotation: number;
  color: string;
  label: string;
  trackName: string;
  isPlaying: boolean;
  onScratch: (delta: number) => void;
  disabled: boolean;
}) => {
  const discRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const lastAngle = useRef(0);

  const getAngle = (clientX: number, clientY: number) => {
    const rect = discRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    dragging.current = true;
    lastAngle.current = getAngle(e.clientX, e.clientY);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const angle = getAngle(e.clientX, e.clientY);
    let delta = angle - lastAngle.current;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    lastAngle.current = angle;
    onScratch(delta);
  };

  const onPointerUp = () => { dragging.current = false; };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={discRef}
        className="relative w-32 h-32 sm:w-40 sm:h-40 cursor-grab active:cursor-grabbing select-none touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Jog wheel outer ring */}
        <div className="absolute -inset-3 rounded-full" style={{
          background: `conic-gradient(from 0deg, #555 0%, #999 15%, #444 30%, #888 50%, #444 70%, #999 85%, #555 100%)`,
          boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.2), inset 0 -3px 6px rgba(0,0,0,0.6), 0 6px 20px rgba(0,0,0,0.7)',
        }} />
        {/* Jog wheel inner ring */}
        <div className="absolute -inset-1 rounded-full" style={{
          background: '#222',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)',
        }} />
        {/* Vinyl record */}
        <div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{
            transform: `rotate(${rotation}deg)`,
            background: `radial-gradient(circle at 50% 50%, 
              #111 0%, #111 8%, #1a1a1a 9%, #0d0d0d 10%, 
              #161616 13%, #0d0d0d 16%, #161616 19%, #0d0d0d 22%,
              #161616 25%, #0d0d0d 28%, #161616 31%, #0d0d0d 34%,
              #161616 37%, #0d0d0d 40%, #161616 43%, #0d0d0d 46%,
              #161616 49%, #0d0d0d 52%, #161616 55%, #0d0d0d 58%,
              #161616 61%, #0d0d0d 64%, #161616 67%, #0d0d0d 70%,
              #161616 73%, #0d0d0d 76%, #161616 79%, #0d0d0d 82%,
              #161616 85%, #0d0d0d 88%, #161616 91%, #111 100%)`,
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.9)',
          }}
        >
          {/* Light streak */}
          <div className="absolute inset-0 rounded-full" style={{
            background: 'linear-gradient(135deg, transparent 25%, rgba(255,255,255,0.07) 42%, transparent 58%)',
          }} />
          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex flex-col items-center justify-center" style={{
              background: `radial-gradient(circle, ${color} 0%, ${color}bb 60%, ${color}55 100%)`,
              boxShadow: `0 0 16px ${color}55, inset 0 -2px 4px rgba(0,0,0,0.3)`,
            }}>
              <div className="w-2.5 h-2.5 rounded-full bg-black/70 mb-0.5" />
              <span className="text-[6px] sm:text-[7px] font-black text-white/90 font-mono tracking-tight leading-none">{label}</span>
            </div>
          </div>
        </div>
        {/* Scratch indicator */}
        {isPlaying && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-4 rounded-full" style={{
            background: color,
            boxShadow: `0 0 8px ${color}88`,
          }} />
        )}
      </div>
      <p className="text-[9px] font-futuristic tracking-wider truncate max-w-[140px] text-center" style={{ color }}>
        {trackName}
      </p>
    </div>
  );
};

/* ─── Vertical EQ Fader ─── */
const EQFader = ({
  label,
  value,
  color,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  color: string;
  onChange: (v: number) => void;
  disabled: boolean;
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const calcValue = useCallback((clientY: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return value;
    const pct = 1 - (clientY - rect.top) / rect.height;
    const clamped = Math.max(0, Math.min(1, pct));
    return Math.round((clamped * 24 - 12)); // -12 to +12
  }, [value]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    onChange(calcValue(e.clientY));
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    onChange(calcValue(e.clientY));
  };

  const onPointerUp = () => { dragging.current = false; };

  const pct = ((value + 12) / 24) * 100;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[7px] font-futuristic tracking-widest" style={{ color: '#888' }}>{label}</span>
      <div
        ref={trackRef}
        className="relative w-6 h-24 sm:h-32 rounded-md cursor-pointer touch-none"
        style={{
          background: '#0a0a0a',
          border: '2px solid #333',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Fill */}
        <div className="absolute bottom-0 left-0 right-0 rounded-b-sm" style={{
          height: `${pct}%`,
          background: `linear-gradient(180deg, ${color} 0%, ${color}66 100%)`,
          boxShadow: `0 0 6px ${color}44`,
        }} />
        {/* Center line (0 dB) */}
        <div className="absolute left-0 right-0 top-1/2 h-px" style={{ background: '#444' }} />
        {/* Fader knob */}
        <div className="absolute left-1/2 -translate-x-1/2 w-8 h-3 rounded-sm" style={{
          bottom: `calc(${pct}% - 6px)`,
          background: 'linear-gradient(180deg, #888 0%, #555 50%, #444 100%)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.3)',
          border: '1px solid #666',
        }}>
          <div className="absolute inset-x-1 top-1/2 -translate-y-1/2 h-px bg-black/30" />
        </div>
      </div>
      <span className="text-[9px] font-mono tabular-nums font-bold" style={{ color }}>
        {value > 0 ? `+${value}` : value}
      </span>
    </div>
  );
};

/* ─── Main Component ─── */
const HotDealsDJConsole = () => {
  const { user } = useAuth();
  const { djState, broadcast, isAdmin } = useDJBroadcast(user?.email);

  // Dual audio elements
  const audioARef = useRef<HTMLAudioElement | null>(null);
  const audioBRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainARef = useRef<GainNode | null>(null);
  const gainBRef = useRef<GainNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const bassRef = useRef<BiquadFilterNode | null>(null);
  const midRef = useRef<BiquadFilterNode | null>(null);
  const highRef = useRef<BiquadFilterNode | null>(null);
  const delayRef = useRef<DelayNode | null>(null);
  const delayGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceARef = useRef<MediaElementAudioSourceNode | null>(null);
  const sourceBRef = useRef<MediaElementAudioSourceNode | null>(null);

  const [vuLevel, setVuLevel] = useState<number[]>(Array.from({ length: 24 }, () => 0));
  const [eqBands, setEqBands] = useState<number[]>(Array.from({ length: 16 }, () => 0));
  const vuIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [deckARotation, setDeckARotation] = useState(0);
  const [deckBRotation, setDeckBRotation] = useState(0);
  const animRef = useRef<number>(0);
  const [activePlaylist, setActivePlaylist] = useState(0);
  const [assignDeck, setAssignDeck] = useState<'A' | 'B'>('A');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const eqAnimRef = useRef<number>(0);

  // Init audio elements
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

  const ensureAudioContext = () => {
    if (audioCtxRef.current) return;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    // Deck A chain
    const srcA = ctx.createMediaElementSource(audioARef.current!);
    sourceARef.current = srcA;
    const gA = ctx.createGain(); gainARef.current = gA;
    srcA.connect(gA);

    // Deck B chain
    const srcB = ctx.createMediaElementSource(audioBRef.current!);
    sourceBRef.current = srcB;
    const gB = ctx.createGain(); gainBRef.current = gB;
    srcB.connect(gB);

    // Shared EQ + master
    const bass = ctx.createBiquadFilter();
    bass.type = "lowshelf"; bass.frequency.value = 200; bass.gain.value = 0;
    bassRef.current = bass;

    const mid = ctx.createBiquadFilter();
    mid.type = "peaking"; mid.frequency.value = 1000; mid.Q.value = 1; mid.gain.value = 0;
    midRef.current = mid;

    const high = ctx.createBiquadFilter();
    high.type = "highshelf"; high.frequency.value = 4000; high.gain.value = 0;
    highRef.current = high;

    const masterGain = ctx.createGain(); masterGainRef.current = masterGain;

    const delay = ctx.createDelay(1.0);
    delay.delayTime.value = 0.3; delayRef.current = delay;
    const delayGain = ctx.createGain();
    delayGain.gain.value = 0; delayGainRef.current = delayGain;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64; analyserRef.current = analyser;

    // Route: deckGains -> bass -> mid -> high -> masterGain -> analyser -> dest
    gA.connect(bass);
    gB.connect(bass);
    bass.connect(mid).connect(high).connect(masterGain);
    masterGain.connect(analyser);
    analyser.connect(ctx.destination);
    masterGain.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(ctx.destination);
  };

  // Sync audio to state
  useEffect(() => {
    const audioA = audioARef.current;
    const audioB = audioBRef.current;
    if (!audioA || !audioB) return;

    const trackA = TRACKS[djState.deckATrackIndex];
    const trackB = TRACKS[djState.deckBTrackIndex];
    if (!trackA || !trackB) return;

    // Track sources
    if (audioA.src !== trackA.url) {
      audioA.src = trackA.url;
      if (djState.deckAPlaying) { ensureAudioContext(); audioA.play().catch(() => {}); }
    }
    if (audioB.src !== trackB.url) {
      audioB.src = trackB.url;
      if (djState.deckBPlaying) { ensureAudioContext(); audioB.play().catch(() => {}); }
    }

    // Play/pause
    if (djState.deckAPlaying && audioA.paused) { ensureAudioContext(); audioA.play().catch(() => {}); }
    else if (!djState.deckAPlaying && !audioA.paused) audioA.pause();

    if (djState.deckBPlaying && audioB.paused) { ensureAudioContext(); audioB.play().catch(() => {}); }
    else if (!djState.deckBPlaying && !audioB.paused) audioB.pause();

    // Crossfade: 0=full A, 100=full B
    const cf = djState.crossfade / 100;
    if (gainARef.current) gainARef.current.gain.value = 1 - cf;
    if (gainBRef.current) gainBRef.current.gain.value = cf;

    // Master volume
    if (masterGainRef.current) masterGainRef.current.gain.value = djState.volume / 100;

    // EQ
    if (bassRef.current) bassRef.current.gain.value = djState.effects.bass ? 15 : djState.eq.low;
    if (midRef.current) midRef.current.gain.value = djState.eq.mid;
    if (highRef.current) highRef.current.gain.value = djState.eq.high;
    if (delayGainRef.current) delayGainRef.current.gain.value = djState.effects.echo ? 0.4 : 0;
  }, [djState]);

  // VU meter
  useEffect(() => {
    const anyPlaying = djState.deckAPlaying || djState.deckBPlaying;
    if (anyPlaying && analyserRef.current) {
      const analyser = analyserRef.current;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      vuIntervalRef.current = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const bars: number[] = [];
        const step = Math.max(1, Math.floor(dataArray.length / 24));
        for (let i = 0; i < 24; i++) bars.push((dataArray[i * step] / 255) * 100);
        setVuLevel(bars);
        const eq: number[] = [];
        const eqStep = Math.max(1, Math.floor(dataArray.length / 16));
        for (let i = 0; i < 16; i++) eq.push((dataArray[i * eqStep] / 255) * 100);
        setEqBands(eq);
      }, 50);
    } else {
      if (vuIntervalRef.current) clearInterval(vuIntervalRef.current);
      setVuLevel(Array.from({ length: 24 }, () => 0));
      setEqBands(Array.from({ length: 16 }, () => 0));
    }
    return () => { if (vuIntervalRef.current) clearInterval(vuIntervalRef.current); };
  }, [djState.deckAPlaying, djState.deckBPlaying]);

  // Rotation animation
  useEffect(() => {
    const animate = () => {
      if (djState.deckAPlaying) setDeckARotation(prev => (prev + 1.2) % 360);
      if (djState.deckBPlaying) setDeckBRotation(prev => (prev + 1.2) % 360);
      animRef.current = requestAnimationFrame(animate);
    };
    if (djState.deckAPlaying || djState.deckBPlaying) {
      animRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animRef.current);
    }
    return () => cancelAnimationFrame(animRef.current);
  }, [djState.deckAPlaying, djState.deckBPlaying]);

  // EQ visualizer canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const draw = () => {
      const w = canvas.width; const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 0.5;
      for (let y = 0; y < h; y += 8) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      const barW = (w - 2) / eqBands.length;
      eqBands.forEach((val, i) => {
        const barH = (val / 100) * (h - 4);
        const x = 1 + i * barW;
        const y = h - 2 - barH;
        const grad = ctx.createLinearGradient(x, y, x, h - 2);
        if (val > 80) { grad.addColorStop(0, '#ef4444'); grad.addColorStop(0.3, '#f97316'); grad.addColorStop(1, '#22c55e'); }
        else if (val > 50) { grad.addColorStop(0, '#f59e0b'); grad.addColorStop(1, '#22c55e'); }
        else { grad.addColorStop(0, '#22c55e'); grad.addColorStop(1, '#15803d'); }
        ctx.fillStyle = grad;
        ctx.fillRect(x + 1, y, barW - 2, barH);
        ctx.shadowColor = val > 70 ? '#f9731666' : '#22c55e44';
        ctx.shadowBlur = 4;
        ctx.fillRect(x + 1, y, barW - 2, 2);
        ctx.shadowBlur = 0;
      });
      eqAnimRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(eqAnimRef.current);
  }, [eqBands]);

  const update = (partial: Partial<DJState>) => {
    if (!isAdmin) return;
    broadcast({ ...djState, ...partial });
  };

  const toggleEffect = (key: keyof DJState['effects']) => {
    if (!isAdmin) return;
    broadcast({ ...djState, effects: { ...djState.effects, [key]: !djState.effects[key] } });
  };

  const updateEQ = (band: 'low' | 'mid' | 'high', value: number) => {
    if (!isAdmin) return;
    broadcast({ ...djState, eq: { ...djState.eq, [band]: value } });
  };

  const handleScratchA = (delta: number) => {
    if (!isAdmin) return;
    setDeckARotation(prev => prev + delta);
    // Modulate playback rate briefly for scratch feel
    if (audioARef.current) {
      audioARef.current.playbackRate = Math.max(0.1, Math.min(3, 1 + delta * 0.02));
      setTimeout(() => { if (audioARef.current) audioARef.current.playbackRate = 1; }, 150);
    }
  };

  const handleScratchB = (delta: number) => {
    if (!isAdmin) return;
    setDeckBRotation(prev => prev + delta);
    if (audioBRef.current) {
      audioBRef.current.playbackRate = Math.max(0.1, Math.min(3, 1 + delta * 0.02));
      setTimeout(() => { if (audioBRef.current) audioBRef.current.playbackRate = 1; }, 150);
    }
  };

  const selectTrackForDeck = (globalIdx: number) => {
    if (!isAdmin) return;
    if (assignDeck === 'A') {
      update({ deckATrackIndex: globalIdx });
    } else {
      update({ deckBTrackIndex: globalIdx });
    }
  };

  const trackA = TRACKS[djState.deckATrackIndex] || TRACKS[0];
  const trackB = TRACKS[djState.deckBTrackIndex] || TRACKS[0];

  // VU Meter
  const VUMeterBar = ({ levels }: { levels: number[] }) => (
    <div className="flex items-end gap-[2px] h-14 px-2 py-1.5 rounded-md" style={{
      background: '#0a0a0a', border: '2px solid #2a2a2a',
      boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)',
    }}>
      {levels.map((level, i) => (
        <div key={i} className="flex flex-col-reverse gap-[1px]">
          {Array.from({ length: 10 }).map((_, seg) => {
            const threshold = (seg / 10) * 100;
            const active = level > threshold;
            const segColor = seg >= 8 ? '#ef4444' : seg >= 5 ? '#f59e0b' : '#22c55e';
            return (
              <div key={seg} className="rounded-[1px]" style={{
                width: '3px', height: '3px',
                backgroundColor: active ? segColor : '#1a1a1a',
                boxShadow: active ? `0 0 3px ${segColor}66` : 'none',
              }} />
            );
          })}
        </div>
      ))}
    </div>
  );

  return (
    <div className="relative rounded-xl overflow-hidden" style={{
      background: `repeating-linear-gradient(90deg, #1a1a1a 0px, #1a1a1a 1px, #1e1e1e 2px, #1e1e1e 4px)`,
      border: '3px solid #333',
      boxShadow: '0 8px 32px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)',
    }}>
      {/* Top chrome */}
      <div className="h-2" style={{
        background: 'linear-gradient(180deg, #666 0%, #444 40%, #333 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
      }} />

      {/* Screws */}
      {['top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3'].map((pos, i) => (
        <div key={i} className={`absolute ${pos} w-3 h-3 rounded-full z-10`} style={{
          background: 'radial-gradient(circle at 40% 40%, #888, #444)',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
        }}>
          <div className="absolute inset-0.5 rounded-full" style={{ background: 'conic-gradient(from 45deg, #555, #777, #555)' }} />
        </div>
      ))}

      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Disc3 className="w-5 h-5 text-orange-500" />
            <span className="text-orange-500 text-sm font-futuristic font-black tracking-[0.2em]">SFH-CDJ 3000</span>
            <span className="text-gray-600 text-[9px] font-futuristic tracking-wider ml-2">DUAL DECK</span>
          </div>
          <div className="flex items-center gap-2">
            {(djState.deckAPlaying || djState.deckBPlaying) && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded" style={{
                background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.5)',
                boxShadow: '0 0 12px rgba(220,38,38,0.2)',
              }}>
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" style={{ boxShadow: '0 0 8px rgba(239,68,68,0.6)' }} />
                <span className="text-red-400 text-[10px] font-bold tracking-widest font-futuristic">ON AIR</span>
              </div>
            )}
            {!isAdmin && (
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-black/30 border border-gray-700">
                <Lock className="w-3 h-3 text-gray-500" />
                <span className="text-gray-500 text-[9px] font-futuristic tracking-wider">VIEW ONLY</span>
              </div>
            )}
          </div>
        </div>

        {/* ===== DUAL DECK LAYOUT ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto_auto_1fr] gap-3 sm:gap-5 items-start">

          {/* DECK A */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{
                backgroundColor: djState.deckAPlaying ? '#22c55e' : '#333',
                boxShadow: djState.deckAPlaying ? '0 0 8px #22c55e88' : 'none',
              }} />
              <span className="text-orange-400 text-[10px] font-futuristic font-black tracking-widest">DECK A</span>
              <button
                onClick={() => update({ deckAPlaying: !djState.deckAPlaying })}
                disabled={!isAdmin}
                className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30"
                style={{
                  background: djState.deckAPlaying
                    ? 'radial-gradient(circle at 40% 35%, #ef4444 0%, #991b1b 100%)'
                    : 'radial-gradient(circle at 40% 35%, #22c55e 0%, #15803d 100%)',
                  border: '2px solid #444',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                }}
              >
                {djState.deckAPlaying ? <Pause className="w-3.5 h-3.5 text-white" /> : <Play className="w-3.5 h-3.5 text-white ml-0.5" />}
              </button>
            </div>
            <DraggableVinyl
              rotation={deckARotation}
              color="#f97316"
              label="A"
              trackName={trackA.name}
              isPlaying={djState.deckAPlaying}
              onScratch={handleScratchA}
              disabled={!isAdmin}
            />
            <div className="text-center px-3 py-1.5 rounded-md w-full max-w-[180px]" style={{
              background: '#0a0a0a', border: '1px solid #2a2a2a',
            }}>
              <p className="text-[9px] font-mono" style={{ color: '#00ff66', textShadow: '0 0 6px #00ff6666' }}>
                {trackA.bpm} BPM
              </p>
              <p className="text-gray-500 text-[8px] font-futuristic tracking-wider">{trackA.genre}</p>
            </div>
          </div>

          {/* EQ FADERS */}
          <div className="flex flex-col items-center gap-2 mt-6">
            <span className="text-[7px] font-futuristic tracking-[0.3em] text-gray-500 mb-1">EQUALIZER</span>
            <div className="flex items-end gap-3">
              <EQFader label="LOW" value={djState.eq.low} color="#22c55e" onChange={(v) => updateEQ('low', v)} disabled={!isAdmin} />
              <EQFader label="MID" value={djState.eq.mid} color="#f59e0b" onChange={(v) => updateEQ('mid', v)} disabled={!isAdmin} />
              <EQFader label="HIGH" value={djState.eq.high} color="#ef4444" onChange={(v) => updateEQ('high', v)} disabled={!isAdmin} />
            </div>
          </div>

          {/* CENTER MIXER */}
          <div className="flex flex-col items-center gap-3 min-w-[180px] sm:min-w-[220px] mt-2">
            {/* Master Volume */}
            <div className="w-full">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[8px] font-futuristic tracking-widest text-gray-500">MASTER</span>
                <span className="text-orange-400 text-xs font-mono tabular-nums font-bold">{djState.volume}</span>
              </div>
              <input type="range" min={0} max={100} value={djState.volume}
                onChange={(e) => update({ volume: Number(e.target.value) })}
                disabled={!isAdmin}
                className="w-full h-2 rounded-full appearance-none cursor-pointer disabled:opacity-30"
                style={{ background: `linear-gradient(90deg, #f97316 0%, #f97316 ${djState.volume}%, #2a2a2a ${djState.volume}%, #2a2a2a 100%)` }}
              />
            </div>

            {/* Crossfader */}
            <div className="w-full">
              <div className="flex items-center justify-between mb-1">
                <span className="text-orange-400 text-[8px] font-futuristic font-bold">A</span>
                <span className="text-[8px] font-futuristic tracking-widest text-gray-500">CROSSFADER</span>
                <span className="text-red-400 text-[8px] font-futuristic font-bold">B</span>
              </div>
              <input type="range" min={0} max={100} value={djState.crossfade}
                onChange={(e) => update({ crossfade: Number(e.target.value) })}
                disabled={!isAdmin}
                className="w-full h-3 rounded-full appearance-none cursor-pointer disabled:opacity-30"
                style={{
                  background: `linear-gradient(90deg, #f97316 0%, #f9731644 ${djState.crossfade}%, #ef444444 ${djState.crossfade}%, #ef4444 100%)`,
                }}
              />
            </div>

            {/* VU Meter */}
            <VUMeterBar levels={vuLevel} />

            {/* Spectrum */}
            <div className="w-full rounded-md overflow-hidden" style={{
              border: '2px solid #2a2a2a', boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6)',
            }}>
              <canvas ref={canvasRef} width={220} height={50} className="w-full h-[50px] block" />
            </div>
            <span className="text-gray-600 text-[7px] font-futuristic tracking-[0.2em]">SPECTRUM ANALYZER</span>

            {/* Effects */}
            <div className="flex items-center gap-3">
              {([
                { key: 'bass' as const, label: 'BASS+', icon: Zap },
                { key: 'echo' as const, label: 'ECHO', icon: AudioLines },
                { key: 'reverb' as const, label: 'REVERB', icon: Radio },
              ]).map(({ key, label, icon: Icon }) => {
                const active = djState.effects[key];
                return (
                  <button key={key} onClick={() => toggleEffect(key)} disabled={!isAdmin}
                    className="flex flex-col items-center gap-1 disabled:opacity-30">
                    <div className="w-2 h-2 rounded-full" style={{
                      backgroundColor: active ? '#00ff66' : '#1a1a1a',
                      boxShadow: active ? '0 0 8px #00ff6688' : 'inset 0 1px 2px rgba(0,0,0,0.5)',
                      border: '1px solid #444',
                    }} />
                    <div className="w-10 h-6 rounded-md flex items-center justify-center" style={{
                      background: active ? 'linear-gradient(180deg, #333, #222)' : 'linear-gradient(180deg, #2a2a2a, #1a1a1a)',
                      border: '2px solid #444',
                      boxShadow: active ? '0 0 6px rgba(249,115,22,0.2)' : 'inset 0 2px 4px rgba(0,0,0,0.3)',
                    }}>
                      <Icon className="w-3 h-3" style={{ color: active ? '#f97316' : '#555' }} />
                    </div>
                    <span className="text-[6px] font-futuristic tracking-wider" style={{ color: active ? '#f97316' : '#555' }}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* EQ FADERS mirrored (for visual balance — actually just monitor indicator) */}
          <div className="flex flex-col items-center gap-2 mt-6">
            <span className="text-[7px] font-futuristic tracking-[0.3em] text-gray-500 mb-1">MONITOR</span>
            <div className="flex items-center gap-1">
              <Headphones className="w-3.5 h-3.5 text-gray-600" />
              <Gauge className="w-3.5 h-3.5 text-gray-600" />
            </div>
            {/* BPM displays */}
            <div className="space-y-2 mt-3">
              <div className="px-3 py-1.5 rounded-md" style={{ background: '#0a0a0a', border: '1px solid #2a2a2a' }}>
                <span className="text-[7px] text-gray-600 font-futuristic tracking-wider">DECK A</span>
                <p className="text-sm font-mono font-bold tabular-nums" style={{ color: '#00ff66', textShadow: '0 0 6px #00ff6666' }}>{trackA.bpm}</p>
                <span className="text-[7px] text-gray-600 font-futuristic">BPM</span>
              </div>
              <div className="px-3 py-1.5 rounded-md" style={{ background: '#0a0a0a', border: '1px solid #2a2a2a' }}>
                <span className="text-[7px] text-gray-600 font-futuristic tracking-wider">DECK B</span>
                <p className="text-sm font-mono font-bold tabular-nums" style={{ color: '#ef4444', textShadow: '0 0 6px #ef444466' }}>{trackB.bpm}</p>
                <span className="text-[7px] text-gray-600 font-futuristic">BPM</span>
              </div>
            </div>
          </div>

          {/* DECK B */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => update({ deckBPlaying: !djState.deckBPlaying })}
                disabled={!isAdmin}
                className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30"
                style={{
                  background: djState.deckBPlaying
                    ? 'radial-gradient(circle at 40% 35%, #ef4444 0%, #991b1b 100%)'
                    : 'radial-gradient(circle at 40% 35%, #22c55e 0%, #15803d 100%)',
                  border: '2px solid #444',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                }}
              >
                {djState.deckBPlaying ? <Pause className="w-3.5 h-3.5 text-white" /> : <Play className="w-3.5 h-3.5 text-white ml-0.5" />}
              </button>
              <span className="text-red-400 text-[10px] font-futuristic font-black tracking-widest">DECK B</span>
              <div className="w-2 h-2 rounded-full" style={{
                backgroundColor: djState.deckBPlaying ? '#22c55e' : '#333',
                boxShadow: djState.deckBPlaying ? '0 0 8px #22c55e88' : 'none',
              }} />
            </div>
            <DraggableVinyl
              rotation={deckBRotation}
              color="#ef4444"
              label="B"
              trackName={trackB.name}
              isPlaying={djState.deckBPlaying}
              onScratch={handleScratchB}
              disabled={!isAdmin}
            />
            <div className="text-center px-3 py-1.5 rounded-md w-full max-w-[180px]" style={{
              background: '#0a0a0a', border: '1px solid #2a2a2a',
            }}>
              <p className="text-[9px] font-mono" style={{ color: '#ef4444', textShadow: '0 0 6px #ef444466' }}>
                {trackB.bpm} BPM
              </p>
              <p className="text-gray-500 text-[8px] font-futuristic tracking-wider">{trackB.genre}</p>
            </div>
          </div>
        </div>

        {/* ===== PLAYLIST SECTION ===== */}
        <div className="mt-5 pt-4" style={{ borderTop: '2px solid #2a2a2a' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <List className="w-4 h-4 text-gray-500" />
              <span className="text-[8px] font-futuristic tracking-[0.3em] text-gray-500">PLAYLISTS</span>
            </div>
            {/* Assign to deck selector */}
            <div className="flex items-center gap-1">
              <span className="text-[8px] font-futuristic tracking-wider text-gray-500">LOAD TO:</span>
              <button
                onClick={() => setAssignDeck('A')}
                className="px-2 py-1 rounded text-[9px] font-futuristic font-bold tracking-wider"
                style={{
                  background: assignDeck === 'A' ? '#f97316' : '#1a1a1a',
                  color: assignDeck === 'A' ? '#fff' : '#666',
                  border: `1px solid ${assignDeck === 'A' ? '#f97316' : '#333'}`,
                }}
              >A</button>
              <button
                onClick={() => setAssignDeck('B')}
                className="px-2 py-1 rounded text-[9px] font-futuristic font-bold tracking-wider"
                style={{
                  background: assignDeck === 'B' ? '#ef4444' : '#1a1a1a',
                  color: assignDeck === 'B' ? '#fff' : '#666',
                  border: `1px solid ${assignDeck === 'B' ? '#ef4444' : '#333'}`,
                }}
              >B</button>
            </div>
          </div>

          {/* Playlist tabs */}
          <div className="flex gap-1 mb-3 overflow-x-auto">
            {PLAYLISTS.map((pl, i) => (
              <button key={i} onClick={() => setActivePlaylist(i)}
                className="px-3 py-1.5 rounded text-[9px] font-futuristic font-bold tracking-wider whitespace-nowrap transition-all"
                style={{
                  background: activePlaylist === i ? 'linear-gradient(180deg, #333, #222)' : '#1a1a1a',
                  border: `1px solid ${activePlaylist === i ? '#f97316' : '#333'}`,
                  color: activePlaylist === i ? '#f97316' : '#666',
                  boxShadow: activePlaylist === i ? '0 0 8px rgba(249,115,22,0.15)' : 'none',
                }}
              >{pl.name}</button>
            ))}
          </div>

          {/* Track list */}
          <div className="rounded-md overflow-hidden" style={{
            background: '#0a0a0a', border: '2px solid #2a2a2a',
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6)',
          }}>
            {PLAYLISTS[activePlaylist]?.tracks.map((track, tIdx) => {
              let globalIdx = 0;
              for (let p = 0; p < activePlaylist; p++) globalIdx += PLAYLISTS[p].tracks.length;
              globalIdx += tIdx;
              const isOnA = globalIdx === djState.deckATrackIndex;
              const isOnB = globalIdx === djState.deckBTrackIndex;

              return (
                <button key={tIdx} onClick={() => selectTrackForDeck(globalIdx)}
                  disabled={!isAdmin}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left transition-all disabled:opacity-50 hover:bg-white/5"
                  style={{
                    background: isOnA ? 'rgba(249,115,22,0.1)' : isOnB ? 'rgba(239,68,68,0.1)' : 'transparent',
                    borderBottom: '1px solid #1a1a1a',
                  }}
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    {(isOnA && djState.deckAPlaying) || (isOnB && djState.deckBPlaying) ? (
                      <Music className="w-3.5 h-3.5 animate-pulse" style={{ color: isOnA ? '#f97316' : '#ef4444' }} />
                    ) : (
                      <span className="text-[9px] font-mono text-gray-600">{tIdx + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-futuristic tracking-wider truncate" style={{
                      color: isOnA ? '#f97316' : isOnB ? '#ef4444' : '#999',
                    }}>{track.name}</p>
                  </div>
                  {isOnA && <span className="text-[7px] font-futuristic font-bold px-1.5 py-0.5 rounded" style={{
                    background: '#f97316', color: '#fff',
                  }}>A</span>}
                  {isOnB && <span className="text-[7px] font-futuristic font-bold px-1.5 py-0.5 rounded" style={{
                    background: '#ef4444', color: '#fff',
                  }}>B</span>}
                  <span className="text-[9px] font-mono tabular-nums text-gray-600">{track.bpm}</span>
                  <span className="text-[8px] font-futuristic tracking-wider px-1.5 py-0.5 rounded" style={{
                    background: '#1a1a1a', border: '1px solid #2a2a2a',
                    color: isOnA ? '#f97316' : isOnB ? '#ef4444' : '#555',
                  }}>{track.genre}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom chrome */}
      <div className="h-2" style={{
        background: 'linear-gradient(180deg, #333 0%, #444 60%, #666 100%)',
        boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.2)',
      }} />
    </div>
  );
};

export default HotDealsDJConsole;
