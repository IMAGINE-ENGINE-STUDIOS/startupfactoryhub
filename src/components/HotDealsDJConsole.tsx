import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, Lock, Disc3, Zap, AudioLines, Radio, List, Music, Headphones, Gauge, Circle, ChevronUp, ChevronDown, Plus, Mic, Archive } from "lucide-react";
import { useDJBroadcast, PLAYLISTS, TRACKS, DJState, DeckSetState, DeckEQ, createDefaultSet } from "@/hooks/useDJBroadcast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DJDrumMachine from "@/components/dj/DJDrumMachine";
import DJSynthesizer from "@/components/dj/DJSynthesizer";
import DJMicrophone from "@/components/dj/DJMicrophone";

/* ─── Per-Deck Spectrum Canvas ─── */
const DeckSpectrum = ({ analyser, color, label }: {
  analyser: AnalyserNode | null;
  color: string;
  label: string;
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      analyser.getByteFrequencyData(dataArray);
      const w = canvas.width; const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 0.5;
      for (let y = 0; y < h; y += 8) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      const bands = 16;
      const barW = (w - 2) / bands;
      const step = Math.max(1, Math.floor(dataArray.length / bands));
      for (let i = 0; i < bands; i++) {
        const val = (dataArray[i * step] / 255) * 100;
        const barH = (val / 100) * (h - 4);
        const x = 1 + i * barW;
        const y2 = h - 2 - barH;
        const grad = ctx.createLinearGradient(x, y2, x, h - 2);
        if (val > 80) { grad.addColorStop(0, '#ef4444'); grad.addColorStop(0.3, color); grad.addColorStop(1, '#22c55e'); }
        else if (val > 50) { grad.addColorStop(0, color); grad.addColorStop(1, '#22c55e'); }
        else { grad.addColorStop(0, '#22c55e'); grad.addColorStop(1, '#15803d'); }
        ctx.fillStyle = grad;
        ctx.fillRect(x + 1, y2, barW - 2, barH);
      }
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [analyser, color]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-full rounded-md overflow-hidden" style={{
        border: '2px solid #2a2a2a', boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6)',
      }}>
        <canvas ref={canvasRef} width={180} height={40} className="w-full h-[40px] block" />
      </div>
      <span className="text-gray-600 text-[6px] font-futuristic tracking-[0.2em]">{label} SPECTRUM</span>
    </div>
  );
};

/* ─── Draggable Vinyl Disc with seamless speed & direction control ─── */
const DraggableVinyl = ({
  rotation, color, label, trackName, isPlaying, speed,
  onSpeedChange, onStartPlay, disabled,
}: {
  rotation: number; color: string; label: string; trackName: string;
  isPlaying: boolean; speed: number;
  onSpeedChange: (speed: number) => void;
  onStartPlay?: () => void;
  disabled: boolean;
}) => {
  const discRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const lastAngle = useRef(0);
  const lastTime = useRef(0);
  const velocitySmooth = useRef(1);
  const releaseAnim = useRef<number>(0);

  const getAngle = (clientX: number, clientY: number) => {
    const rect = discRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return Math.atan2(clientY - (rect.top + rect.height / 2), clientX - (rect.left + rect.width / 2)) * (180 / Math.PI);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    cancelAnimationFrame(releaseAnim.current);
    dragging.current = true;
    lastAngle.current = getAngle(e.clientX, e.clientY);
    lastTime.current = performance.now();
    velocitySmooth.current = speed;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    // If not playing, start playback when user grabs the disc
    if (!isPlaying && onStartPlay) onStartPlay();
    // Immediately signal "grabbed" = hold at current speed
    onSpeedChange(0);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const angle = getAngle(e.clientX, e.clientY);
    const now = performance.now();
    let delta = angle - lastAngle.current;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    const dt = Math.max(1, now - lastTime.current);
    lastAngle.current = angle;
    lastTime.current = now;

    // Convert angular velocity to playback speed: clockwise = forward, counter-clockwise = reverse
    const rawSpeed = (delta / dt) * 3;
    // Smooth it
    velocitySmooth.current = velocitySmooth.current * 0.6 + rawSpeed * 0.4;
    const clamped = Math.max(-3, Math.min(3, velocitySmooth.current));
    onSpeedChange(clamped);
  };

  const onPointerUp = () => {
    dragging.current = false;
    // Smoothly return to 1x normal speed
    const springBack = () => {
      velocitySmooth.current += (1 - velocitySmooth.current) * 0.08;
      if (Math.abs(velocitySmooth.current - 1) < 0.02) {
        velocitySmooth.current = 1;
        onSpeedChange(1);
        return;
      }
      onSpeedChange(velocitySmooth.current);
      releaseAnim.current = requestAnimationFrame(springBack);
    };
    releaseAnim.current = requestAnimationFrame(springBack);
  };

  const speedLabel = Math.abs(speed) < 0.02 ? "STOP" : speed < 0 ? `${speed.toFixed(1)}x REV` : `${speed.toFixed(1)}x`;
  const speedColor = Math.abs(speed) < 0.02 ? '#ef4444' : speed < 0 ? '#f59e0b' : '#22c55e';

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={discRef}
        className="relative w-40 h-40 sm:w-48 sm:h-48 cursor-grab active:cursor-grabbing select-none touch-none"
        onPointerDown={onPointerDown} onPointerMove={onPointerMove}
        onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
      >
        <div className="absolute -inset-3 rounded-full" style={{
          background: `conic-gradient(from 0deg, #555 0%, #999 15%, #444 30%, #888 50%, #444 70%, #999 85%, #555 100%)`,
          boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.2), inset 0 -3px 6px rgba(0,0,0,0.6), 0 6px 20px rgba(0,0,0,0.7)',
        }} />
        <div className="absolute -inset-1 rounded-full" style={{ background: '#222', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)' }} />
        <div className="absolute inset-0 rounded-full overflow-hidden" style={{
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
        }}>
          <div className="absolute inset-0 rounded-full" style={{
            background: 'linear-gradient(135deg, transparent 25%, rgba(255,255,255,0.07) 42%, transparent 58%)',
          }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-full flex flex-col items-center justify-center" style={{
              background: `radial-gradient(circle, ${color} 0%, ${color}bb 60%, ${color}55 100%)`,
              boxShadow: `0 0 16px ${color}55, inset 0 -2px 4px rgba(0,0,0,0.3)`,
            }}>
              <div className="w-2 h-2 rounded-full bg-black/70 mb-0.5" />
              <span className="text-[6px] font-black text-white/90 font-mono tracking-tight leading-none">{label}</span>
            </div>
          </div>
        </div>
        {isPlaying && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-3 rounded-full" style={{
            background: color, boxShadow: `0 0 8px ${color}88`,
          }} />
        )}
      </div>
      <div className="flex items-center gap-2 px-2 py-0.5 rounded-md" style={{ background: '#0a0a0a', border: '1px solid #2a2a2a' }}>
        <Gauge className="w-2.5 h-2.5" style={{ color: speedColor }} />
        <span className="text-[9px] font-mono font-bold tabular-nums" style={{ color: speedColor, textShadow: `0 0 4px ${speedColor}66` }}>{speedLabel}</span>
      </div>
      <p className="text-[8px] font-futuristic tracking-wider truncate max-w-[130px] text-center" style={{ color }}>{trackName}</p>
    </div>
  );
};

/* ─── Vertical EQ Fader ─── */
const EQFader = ({ label, value, color, onChange, disabled }: {
  label: string; value: number; color: string; onChange: (v: number) => void; disabled: boolean;
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const calcValue = useCallback((clientY: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return value;
    const pct = 1 - (clientY - rect.top) / rect.height;
    return Math.round(Math.max(0, Math.min(1, pct)) * 24 - 12);
  }, [value]);
  const pct = ((value + 12) / 24) * 100;
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[6px] font-futuristic tracking-widest" style={{ color: '#888' }}>{label}</span>
      <div ref={trackRef}
        className="relative w-5 h-20 sm:h-24 rounded-md cursor-pointer touch-none"
        style={{ background: '#0a0a0a', border: '2px solid #333', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)' }}
        onPointerDown={(e) => { if (disabled) return; dragging.current = true; (e.target as HTMLElement).setPointerCapture(e.pointerId); onChange(calcValue(e.clientY)); }}
        onPointerMove={(e) => { if (dragging.current) onChange(calcValue(e.clientY)); }}
        onPointerUp={() => { dragging.current = false; }}
        onPointerCancel={() => { dragging.current = false; }}
      >
        <div className="absolute bottom-0 left-0 right-0 rounded-b-sm" style={{
          height: `${pct}%`, background: `linear-gradient(180deg, ${color} 0%, ${color}66 100%)`, boxShadow: `0 0 6px ${color}44`,
        }} />
        <div className="absolute left-0 right-0 top-1/2 h-px" style={{ background: '#444' }} />
        <div className="absolute left-1/2 -translate-x-1/2 w-7 h-2.5 rounded-sm" style={{
          bottom: `calc(${pct}% - 5px)`,
          background: 'linear-gradient(180deg, #888 0%, #555 50%, #444 100%)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.3)',
          border: '1px solid #666',
        }} />
      </div>
      <span className="text-[8px] font-mono tabular-nums font-bold" style={{ color }}>{value > 0 ? `+${value}` : value}</span>
    </div>
  );
};

/* ─── Pitch Fader ─── */
const PitchFader = ({ value, color, onChange, disabled }: {
  value: number; color: string; onChange: (v: number) => void; disabled: boolean;
}) => (
  <div className="flex items-center gap-1">
    <span className="text-[6px] font-futuristic tracking-widest text-gray-600">PITCH</span>
    <button onClick={() => !disabled && onChange(Math.max(-8, value - 1))} disabled={disabled}
      className="w-3.5 h-3.5 rounded flex items-center justify-center disabled:opacity-30"
      style={{ background: '#222', border: '1px solid #444' }}>
      <ChevronDown className="w-2.5 h-2.5 text-gray-400" />
    </button>
    <span className="text-[8px] font-mono font-bold tabular-nums w-8 text-center" style={{ color }}>{value > 0 ? `+${value}%` : `${value}%`}</span>
    <button onClick={() => !disabled && onChange(Math.min(8, value + 1))} disabled={disabled}
      className="w-3.5 h-3.5 rounded flex items-center justify-center disabled:opacity-30"
      style={{ background: '#222', border: '1px solid #444' }}>
      <ChevronUp className="w-2.5 h-2.5 text-gray-400" />
    </button>
  </div>
);

/* ─── Per-deck VU meter (compact) ─── */
const DeckVU = ({ analyser }: { analyser: AnalyserNode | null }) => {
  const [levels, setLevels] = useState<number[]>(Array.from({ length: 12 }, () => 0));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (analyser) {
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      intervalRef.current = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const bars: number[] = [];
        const step = Math.max(1, Math.floor(dataArray.length / 12));
        for (let i = 0; i < 12; i++) bars.push((dataArray[i * step] / 255) * 100);
        setLevels(bars);
      }, 60);
    } else {
      setLevels(Array.from({ length: 12 }, () => 0));
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [analyser]);

  return (
    <div className="flex items-end gap-[1px] h-8 px-1.5 py-1 rounded" style={{
      background: '#0a0a0a', border: '1px solid #2a2a2a',
    }}>
      {levels.map((level, i) => (
        <div key={i} className="flex flex-col-reverse gap-[1px]">
          {Array.from({ length: 6 }).map((_, seg) => {
            const threshold = (seg / 6) * 100;
            const active = level > threshold;
            const segColor = seg >= 5 ? '#ef4444' : seg >= 3 ? '#f59e0b' : '#22c55e';
            return (
              <div key={seg} className="rounded-[1px]" style={{
                width: '2px', height: '2px',
                backgroundColor: active ? segColor : '#1a1a1a',
              }} />
            );
          })}
        </div>
      ))}
    </div>
  );
};

/* ════════════════════════════════════════════════════════
   MAIN DJ CONSOLE COMPONENT
   ════════════════════════════════════════════════════════ */
const HotDealsDJConsole = () => {
  const { user } = useAuth();
  const { djState, broadcast, isAdmin } = useDJBroadcast(user?.email);

  // Audio elements per active set
  const audioARef = useRef<HTMLAudioElement | null>(null);
  const audioBRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  // Per-deck gains
  const gainARef = useRef<GainNode | null>(null);
  const gainBRef = useRef<GainNode | null>(null);
  // Per-deck EQ chains
  const bassARef = useRef<BiquadFilterNode | null>(null);
  const midARef = useRef<BiquadFilterNode | null>(null);
  const highARef = useRef<BiquadFilterNode | null>(null);
  const bassBRef = useRef<BiquadFilterNode | null>(null);
  const midBRef = useRef<BiquadFilterNode | null>(null);
  const highBRef = useRef<BiquadFilterNode | null>(null);
  // Per-deck analysers
  const analyserARef = useRef<AnalyserNode | null>(null);
  const analyserBRef = useRef<AnalyserNode | null>(null);
  // Master
  const masterGainRef = useRef<GainNode | null>(null);
  const delayGainRef = useRef<GainNode | null>(null);
  // Master analyser for combined VU
  const masterAnalyserRef = useRef<AnalyserNode | null>(null);

  // Cue
  const cueARef = useRef<HTMLAudioElement | null>(null);
  const cueBRef = useRef<HTMLAudioElement | null>(null);
  const [cueA, setCueA] = useState(false);
  const [cueB, setCueB] = useState(false);

  // Recording
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Speed & pitch
  const [speedA, setSpeedA] = useState(1);
  const [speedB, setSpeedB] = useState(1);
  const [pitchA, setPitchA] = useState(0);
  const [pitchB, setPitchB] = useState(0);

  const [deckARotation, setDeckARotation] = useState(0);
  const [deckBRotation, setDeckBRotation] = useState(0);
  const animRef = useRef<number>(0);
  const [activePlaylist, setActivePlaylist] = useState(0);
  const [assignDeck, setAssignDeck] = useState<'A' | 'B'>('A');
  const [showMic, setShowMic] = useState(false);
  const [recordings, setRecordings] = useState<any[]>([]);
  
  const [playingRecId, setPlayingRecId] = useState<string | null>(null);
  const recAudioRef = useRef<HTMLAudioElement | null>(null);

  // Load recordings
  const loadRecordings = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase.from('dj_recordings' as any).select('*').order('created_at', { ascending: false }).limit(50);
    if (data) setRecordings(data as any[]);
  }, [user?.id]);

  useEffect(() => { loadRecordings(); }, [loadRecordings]);

  const playRecording = (rec: any) => {
    if (!recAudioRef.current) recAudioRef.current = new Audio();
    if (playingRecId === rec.id) {
      recAudioRef.current.pause();
      setPlayingRecId(null);
    } else {
      recAudioRef.current.src = rec.file_url;
      recAudioRef.current.play().catch(() => {});
      setPlayingRecId(rec.id);
      recAudioRef.current.onended = () => setPlayingRecId(null);
    }
  };

  const deleteRecording = async (rec: any) => {
    if (rec.storage_path) {
      await supabase.storage.from('dj-recordings').remove([rec.storage_path]);
    }
    await supabase.from('dj_recordings' as any).delete().eq('id', rec.id);
    loadRecordings();
  };

  const [showInstrumentsPanel, setShowInstruments] = useState(false);
  const showInstruments = showInstrumentsPanel;

  // Get active set
  const activeSetIdx = djState.activeSet || 0;
  const activeSet: DeckSetState = djState.sets?.[activeSetIdx] || {
    deckATrackIndex: djState.deckATrackIndex ?? 0,
    deckBTrackIndex: djState.deckBTrackIndex ?? 3,
    deckAPlaying: djState.deckAPlaying ?? false,
    deckBPlaying: djState.deckBPlaying ?? false,
    crossfade: djState.crossfade ?? 50,
    eqA: { low: djState.eq?.low ?? 0, mid: djState.eq?.mid ?? 0, high: djState.eq?.high ?? 0 },
    eqB: { low: 0, mid: 0, high: 0 },
  };

  const trackA = TRACKS[activeSet.deckATrackIndex] || TRACKS[0];
  const trackB = TRACKS[activeSet.deckBTrackIndex] || TRACKS[0];
  const sets = djState.sets || [activeSet];

  // Init audio
  useEffect(() => {
    if (!audioARef.current) { const a = new Audio(); a.crossOrigin = "anonymous"; audioARef.current = a; }
    if (!audioBRef.current) { const b = new Audio(); b.crossOrigin = "anonymous"; audioBRef.current = b; }
    if (!cueARef.current) { cueARef.current = new Audio(); }
    if (!cueBRef.current) { cueBRef.current = new Audio(); }
    return () => {
      audioARef.current?.pause();
      audioBRef.current?.pause();
      cueARef.current?.pause();
      cueBRef.current?.pause();
      audioCtxRef.current?.close();
    };
  }, []);

  const ensureAudioContext = () => {
    if (audioCtxRef.current) return;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    // Deck A chain: src -> gainA -> bassA -> midA -> highA -> analyserA -> masterGain
    const srcA = ctx.createMediaElementSource(audioARef.current!);
    const gA = ctx.createGain(); gainARef.current = gA;
    const bA = ctx.createBiquadFilter(); bA.type = "lowshelf"; bA.frequency.value = 200; bassARef.current = bA;
    const mA = ctx.createBiquadFilter(); mA.type = "peaking"; mA.frequency.value = 1000; mA.Q.value = 1; midARef.current = mA;
    const hA = ctx.createBiquadFilter(); hA.type = "highshelf"; hA.frequency.value = 4000; highARef.current = hA;
    const anA = ctx.createAnalyser(); anA.fftSize = 64; analyserARef.current = anA;
    srcA.connect(gA).connect(bA).connect(mA).connect(hA).connect(anA);

    // Deck B chain
    const srcB = ctx.createMediaElementSource(audioBRef.current!);
    const gB = ctx.createGain(); gainBRef.current = gB;
    const bB = ctx.createBiquadFilter(); bB.type = "lowshelf"; bB.frequency.value = 200; bassBRef.current = bB;
    const mB = ctx.createBiquadFilter(); mB.type = "peaking"; mB.frequency.value = 1000; mB.Q.value = 1; midBRef.current = mB;
    const hB = ctx.createBiquadFilter(); hB.type = "highshelf"; hB.frequency.value = 4000; highBRef.current = hB;
    const anB = ctx.createAnalyser(); anB.fftSize = 64; analyserBRef.current = anB;
    srcB.connect(gB).connect(bB).connect(mB).connect(hB).connect(anB);

    // Master
    const masterGain = ctx.createGain(); masterGainRef.current = masterGain;
    const masterAn = ctx.createAnalyser(); masterAn.fftSize = 64; masterAnalyserRef.current = masterAn;
    const delay = ctx.createDelay(1.0); delay.delayTime.value = 0.3;
    const delayGain = ctx.createGain(); delayGain.gain.value = 0; delayGainRef.current = delayGain;

    anA.connect(masterGain);
    anB.connect(masterGain);
    masterGain.connect(masterAn);
    masterAn.connect(ctx.destination);
    masterGain.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(ctx.destination);
  };

  // Speed + pitch + reverse simulation
  const reverseIntervalA = useRef<ReturnType<typeof setInterval> | null>(null);
  const reverseIntervalB = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (reverseIntervalA.current) { clearInterval(reverseIntervalA.current); reverseIntervalA.current = null; }
    const rate = speedA * (1 + pitchA / 100);
    const audio = audioARef.current;
    if (!audio) return;
    if (Math.abs(rate) < 0.02) {
      // STOP — pause playback rate at minimum
      try { audio.playbackRate = 0.0625; } catch {}
      audio.pause();
    } else if (rate < 0) {
      // REVERSE — seek backwards at rate proportional to speed
      try { audio.playbackRate = 0.0625; } catch {}
      audio.pause();
      reverseIntervalA.current = setInterval(() => {
        if (audio.currentTime > 0.05) audio.currentTime -= Math.abs(rate) * 0.05;
      }, 50);
    } else {
      // FORWARD
      try { audio.playbackRate = Math.max(0.0625, Math.min(4, rate)); } catch {}
      if (audio.paused && activeSet.deckAPlaying) audio.play().catch(() => {});
    }
    return () => { if (reverseIntervalA.current) clearInterval(reverseIntervalA.current); };
  }, [speedA, pitchA, activeSet.deckAPlaying]);

  useEffect(() => {
    if (reverseIntervalB.current) { clearInterval(reverseIntervalB.current); reverseIntervalB.current = null; }
    const rate = speedB * (1 + pitchB / 100);
    const audio = audioBRef.current;
    if (!audio) return;
    if (Math.abs(rate) < 0.02) {
      try { audio.playbackRate = 0.0625; } catch {}
      audio.pause();
    } else if (rate < 0) {
      try { audio.playbackRate = 0.0625; } catch {}
      audio.pause();
      reverseIntervalB.current = setInterval(() => {
        if (audio.currentTime > 0.05) audio.currentTime -= Math.abs(rate) * 0.05;
      }, 50);
    } else {
      try { audio.playbackRate = Math.max(0.0625, Math.min(4, rate)); } catch {}
      if (audio.paused && activeSet.deckBPlaying) audio.play().catch(() => {});
    }
    return () => { if (reverseIntervalB.current) clearInterval(reverseIntervalB.current); };
  }, [speedB, pitchB, activeSet.deckBPlaying]);

  // Sync audio to state
  useEffect(() => {
    const audioA = audioARef.current;
    const audioB = audioBRef.current;
    if (!audioA || !audioB) return;
    if (!trackA || !trackB) return;

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

    // Per-deck EQ
    if (bassARef.current) bassARef.current.gain.value = djState.effects.bass ? 15 : activeSet.eqA.low;
    if (midARef.current) midARef.current.gain.value = activeSet.eqA.mid;
    if (highARef.current) highARef.current.gain.value = activeSet.eqA.high;
    if (bassBRef.current) bassBRef.current.gain.value = djState.effects.bass ? 15 : activeSet.eqB.low;
    if (midBRef.current) midBRef.current.gain.value = activeSet.eqB.mid;
    if (highBRef.current) highBRef.current.gain.value = activeSet.eqB.high;

    if (delayGainRef.current) delayGainRef.current.gain.value = djState.effects.echo ? 0.4 : 0;
  }, [djState, activeSet, trackA, trackB]);

  // Rotation
  useEffect(() => {
    const animate = () => {
      if (activeSet.deckAPlaying) setDeckARotation(prev => (prev + 1.2 * speedA) % 360);
      if (activeSet.deckBPlaying) setDeckBRotation(prev => (prev + 1.2 * speedB) % 360);
      animRef.current = requestAnimationFrame(animate);
    };
    if (activeSet.deckAPlaying || activeSet.deckBPlaying) {
      animRef.current = requestAnimationFrame(animate);
    } else { cancelAnimationFrame(animRef.current); }
    return () => cancelAnimationFrame(animRef.current);
  }, [activeSet.deckAPlaying, activeSet.deckBPlaying, speedA, speedB]);

  // --- State helpers ---
  const updateSet = (partial: Partial<DeckSetState>) => {
    if (!isAdmin) return;
    const newSets = [...sets];
    newSets[activeSetIdx] = { ...activeSet, ...partial };
    const ns = newSets[activeSetIdx];
    broadcast({
      ...djState,
      sets: newSets,
      deckATrackIndex: ns.deckATrackIndex,
      deckBTrackIndex: ns.deckBTrackIndex,
      deckAPlaying: ns.deckAPlaying,
      deckBPlaying: ns.deckBPlaying,
      crossfade: ns.crossfade,
      eq: ns.eqA,
    });
  };

  const updateGlobal = (partial: Partial<DJState>) => {
    if (!isAdmin) return;
    broadcast({ ...djState, ...partial });
  };

  const updateEQA = (band: keyof DeckEQ, value: number) => {
    updateSet({ eqA: { ...activeSet.eqA, [band]: value } });
  };
  const updateEQB = (band: keyof DeckEQ, value: number) => {
    updateSet({ eqB: { ...activeSet.eqB, [band]: value } });
  };

  const toggleEffect = (key: keyof DJState['effects']) => {
    if (!isAdmin) return;
    broadcast({ ...djState, effects: { ...djState.effects, [key]: !djState.effects[key] } });
  };

  const addDeckSet = () => {
    if (!isAdmin) return;
    const newSets = [...sets, createDefaultSet()];
    broadcast({ ...djState, sets: newSets, activeSet: newSets.length - 1 });
  };

  const switchSet = (idx: number) => {
    if (!isAdmin) return;
    // Switch view to selected set — all sets keep playing
    const ns = sets[idx] || sets[0];
    broadcast({
      ...djState,
      activeSet: idx,
      deckATrackIndex: ns.deckATrackIndex,
      deckBTrackIndex: ns.deckBTrackIndex,
      deckAPlaying: ns.deckAPlaying,
      deckBPlaying: ns.deckBPlaying,
      crossfade: ns.crossfade,
      eq: ns.eqA,
    });
    setSpeedA(1); setSpeedB(1); setPitchA(0); setPitchB(0);
  };

  const selectTrackForDeck = (globalIdx: number) => {
    if (!isAdmin) return;
    if (assignDeck === 'A') updateSet({ deckATrackIndex: globalIdx });
    else updateSet({ deckBTrackIndex: globalIdx });
  };

  // Cue
  const toggleCue = (deck: 'A' | 'B') => {
    if (deck === 'A') {
      if (cueA) { cueARef.current?.pause(); setCueA(false); }
      else { if (cueARef.current) { cueARef.current.src = trackA.url; cueARef.current.play().catch(() => {}); setCueA(true); } }
    } else {
      if (cueB) { cueBRef.current?.pause(); setCueB(false); }
      else { if (cueBRef.current) { cueBRef.current.src = trackB.url; cueBRef.current.play().catch(() => {}); setCueB(true); } }
    }
  };

  // Recording
  const toggleRecording = () => {
    if (isRecording) {
      recorderRef.current?.stop(); setIsRecording(false);
      if (recTimerRef.current) clearInterval(recTimerRef.current);
      return;
    }
    ensureAudioContext();
    const ctx = audioCtxRef.current;
    if (!ctx || !masterGainRef.current) return;
    const dest = ctx.createMediaStreamDestination();
    masterGainRef.current.connect(dest);
    const recorder = new MediaRecorder(dest.stream, { mimeType: 'audio/webm' });
    recChunksRef.current = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) recChunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(recChunksRef.current, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `sfh-dj-mix-${Date.now()}.webm`; a.click();
      URL.revokeObjectURL(url); setRecTime(0);
    };
    recorder.start(); recorderRef.current = recorder; setIsRecording(true); setRecTime(0);
    recTimerRef.current = setInterval(() => setRecTime(prev => prev + 1), 1000);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="relative rounded-xl overflow-hidden" style={{
      background: `repeating-linear-gradient(90deg, #1a1a1a 0px, #1a1a1a 1px, #1e1e1e 2px, #1e1e1e 4px)`,
      border: '3px solid #333',
      boxShadow: '0 8px 32px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)',
    }}>
      <div className="h-2" style={{ background: 'linear-gradient(180deg, #666 0%, #444 40%, #333 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }} />

      {/* Screws */}
      {['top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3'].map((pos, i) => (
        <div key={i} className={`absolute ${pos} w-3 h-3 rounded-full z-10`} style={{
          background: 'radial-gradient(circle at 40% 40%, #888, #444)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
        }}>
          <div className="absolute inset-0.5 rounded-full" style={{ background: 'conic-gradient(from 45deg, #555, #777, #555)' }} />
        </div>
      ))}

      <div className="p-3 sm:p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Disc3 className="w-5 h-5 text-orange-500" />
            <span className="text-orange-500 text-sm font-futuristic font-black tracking-[0.2em]">SFH-CDJ 3000</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={toggleRecording} className="flex items-center gap-1.5 px-2.5 py-1 rounded transition-all" style={{
              background: isRecording ? 'rgba(220,38,38,0.2)' : '#1a1a1a',
              border: `2px solid ${isRecording ? '#ef4444' : '#333'}`,
            }}>
              <Circle className="w-3 h-3" style={{ color: isRecording ? '#ef4444' : '#666', fill: isRecording ? '#ef4444' : 'none' }} />
              <span className="text-[9px] font-futuristic tracking-wider font-bold" style={{ color: isRecording ? '#ef4444' : '#666' }}>
                {isRecording ? `REC ${formatTime(recTime)}` : 'REC'}
              </span>
            </button>
            <button onClick={() => setShowInstruments(p => !p)} className="flex items-center gap-1.5 px-2.5 py-1 rounded transition-all" style={{
              background: showInstruments ? 'rgba(249,115,22,0.15)' : '#1a1a1a',
              border: `2px solid ${showInstruments ? '#f97316' : '#333'}`,
            }}>
              <Music className="w-3 h-3" style={{ color: showInstruments ? '#f97316' : '#666' }} />
              <span className="text-[9px] font-futuristic tracking-wider font-bold" style={{ color: showInstruments ? '#f97316' : '#666' }}>INSTRUMENTS</span>
            </button>
            <button onClick={() => setShowMic(p => !p)} className="flex items-center gap-1.5 px-2.5 py-1 rounded transition-all" style={{
              background: showMic ? 'rgba(239,68,68,0.15)' : '#1a1a1a',
              border: `2px solid ${showMic ? '#ef4444' : '#333'}`,
            }}>
              <Mic className="w-3 h-3" style={{ color: showMic ? '#ef4444' : '#666' }} />
              <span className="text-[9px] font-futuristic tracking-wider font-bold" style={{ color: showMic ? '#ef4444' : '#666' }}>MIC</span>
            </button>
            {(activeSet.deckAPlaying || activeSet.deckBPlaying) && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded" style={{
                background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.5)',
              }}>
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
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

        {/* ═══ DECK SET SELECTOR ═══ */}
        <div className="flex items-center gap-1.5 mb-4">
          <span className="text-[7px] font-futuristic tracking-[0.3em] text-gray-500 mr-1">DECK SET</span>
          {sets.map((_, i) => (
            <button key={i} onClick={() => switchSet(i)}
              disabled={!isAdmin}
              className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-futuristic font-black transition-all disabled:opacity-50"
              style={{
                background: activeSetIdx === i ? 'linear-gradient(180deg, #f97316, #c2410c)' : '#1a1a1a',
                border: `2px solid ${activeSetIdx === i ? '#f97316' : '#333'}`,
                color: activeSetIdx === i ? '#fff' : '#666',
                boxShadow: activeSetIdx === i ? '0 0 10px rgba(249,115,22,0.3)' : 'none',
              }}>
              {i + 1}
            </button>
          ))}
          <button onClick={addDeckSet} disabled={!isAdmin}
            className="w-7 h-7 rounded-md flex items-center justify-center transition-all disabled:opacity-30"
            style={{ background: '#1a1a1a', border: '2px solid #333' }}>
            <Plus className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>

        {/* ═══ DUAL DECK LAYOUT ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-start">

          {/* ─── DECK A ─── */}
          <div className="flex flex-col items-center gap-2 p-3 rounded-lg" style={{ background: '#141414', border: '2px solid #2a2a2a' }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{
                backgroundColor: activeSet.deckAPlaying ? '#22c55e' : '#333',
                boxShadow: activeSet.deckAPlaying ? '0 0 8px #22c55e88' : 'none',
              }} />
              <span className="text-orange-400 text-[10px] font-futuristic font-black tracking-widest">DECK A</span>
              <button onClick={() => updateSet({ deckAPlaying: !activeSet.deckAPlaying })} disabled={!isAdmin}
                className="w-7 h-7 rounded-full flex items-center justify-center disabled:opacity-30"
                style={{
                  background: activeSet.deckAPlaying ? 'radial-gradient(circle at 40% 35%, #ef4444, #991b1b)' : 'radial-gradient(circle at 40% 35%, #22c55e, #15803d)',
                  border: '2px solid #444',
                }}>
                {activeSet.deckAPlaying ? <Pause className="w-3 h-3 text-white" /> : <Play className="w-3 h-3 text-white ml-0.5" />}
              </button>
              <button onClick={() => toggleCue('A')} className="flex items-center gap-1 px-2 py-1 rounded" style={{
                background: cueA ? 'rgba(34,197,94,0.15)' : '#1a1a1a', border: `1px solid ${cueA ? '#22c55e' : '#333'}`,
              }}>
                <Headphones className="w-3 h-3" style={{ color: cueA ? '#22c55e' : '#555' }} />
                <span className="text-[7px] font-futuristic font-bold" style={{ color: cueA ? '#22c55e' : '#555' }}>CUE</span>
              </button>
            </div>

            <DraggableVinyl rotation={deckARotation} color="#f97316" label="A" trackName={trackA.name}
              isPlaying={activeSet.deckAPlaying} speed={speedA}
              onSpeedChange={(s) => { if (isAdmin) setSpeedA(s); }}
              onStartPlay={() => updateSet({ deckAPlaying: true })}
              disabled={!isAdmin} />

            <PitchFader value={pitchA} color="#f97316" onChange={setPitchA} disabled={!isAdmin} />

            {/* Per-deck EQ */}
            <div className="flex items-center gap-2 mt-1">
              <EQFader label="LO" value={activeSet.eqA.low} color="#22c55e" onChange={(v) => updateEQA('low', v)} disabled={!isAdmin} />
              <EQFader label="MID" value={activeSet.eqA.mid} color="#f59e0b" onChange={(v) => updateEQA('mid', v)} disabled={!isAdmin} />
              <EQFader label="HI" value={activeSet.eqA.high} color="#ef4444" onChange={(v) => updateEQA('high', v)} disabled={!isAdmin} />
            </div>

            {/* Per-deck VU + Spectrum */}
            <DeckVU analyser={analyserARef.current} />
            <DeckSpectrum analyser={analyserARef.current} color="#f97316" label="DECK A" />

            <div className="text-center px-2 py-1 rounded-md w-full" style={{ background: '#0a0a0a', border: '1px solid #2a2a2a' }}>
              <p className="text-[9px] font-mono" style={{ color: '#00ff66', textShadow: '0 0 6px #00ff6666' }}>{trackA.bpm} BPM</p>
              <p className="text-gray-500 text-[7px] font-futuristic tracking-wider">{trackA.genre}</p>
            </div>
          </div>

          {/* ─── CENTER MIXER ─── */}
          <div className="flex flex-col items-center gap-3 min-w-[160px] sm:min-w-[200px] mt-2">
            {/* Master Volume */}
            <div className="w-full">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[7px] font-futuristic tracking-widest text-gray-500">MASTER</span>
                <span className="text-orange-400 text-xs font-mono tabular-nums font-bold">{djState.volume}</span>
              </div>
              <input type="range" min={0} max={100} value={djState.volume}
                onChange={(e) => updateGlobal({ volume: Number(e.target.value) })}
                disabled={!isAdmin}
                className="w-full h-2 rounded-full appearance-none cursor-pointer disabled:opacity-30"
                style={{ background: `linear-gradient(90deg, #f97316 0%, #f97316 ${djState.volume}%, #2a2a2a ${djState.volume}%, #2a2a2a 100%)` }}
              />
            </div>

            {/* Crossfader */}
            <div className="w-full">
              <div className="flex items-center justify-between mb-1">
                <span className="text-orange-400 text-[8px] font-futuristic font-bold">A</span>
                <span className="text-[7px] font-futuristic tracking-widest text-gray-500">XFADER</span>
                <span className="text-red-400 text-[8px] font-futuristic font-bold">B</span>
              </div>
              <input type="range" min={0} max={100} value={activeSet.crossfade}
                onChange={(e) => updateSet({ crossfade: Number(e.target.value) })}
                disabled={!isAdmin}
                className="w-full h-3 rounded-full appearance-none cursor-pointer disabled:opacity-30"
                style={{ background: `linear-gradient(90deg, #f97316 0%, #f9731644 ${activeSet.crossfade}%, #ef444444 ${activeSet.crossfade}%, #ef4444 100%)` }}
              />
            </div>

            {/* Master VU */}
            <DeckVU analyser={masterAnalyserRef.current} />

            {/* Effects */}
            <div className="flex items-center gap-2">
              {([
                { key: 'bass' as const, label: 'BASS+', icon: Zap },
                { key: 'echo' as const, label: 'ECHO', icon: AudioLines },
                { key: 'reverb' as const, label: 'REVERB', icon: Radio },
              ]).map(({ key, label, icon: Icon }) => {
                const active = djState.effects[key];
                return (
                  <button key={key} onClick={() => toggleEffect(key)} disabled={!isAdmin}
                    className="flex flex-col items-center gap-0.5 disabled:opacity-30">
                    <div className="w-2 h-2 rounded-full" style={{
                      backgroundColor: active ? '#00ff66' : '#1a1a1a',
                      boxShadow: active ? '0 0 8px #00ff6688' : 'inset 0 1px 2px rgba(0,0,0,0.5)',
                      border: '1px solid #444',
                    }} />
                    <div className="w-9 h-5 rounded-md flex items-center justify-center" style={{
                      background: active ? 'linear-gradient(180deg, #333, #222)' : 'linear-gradient(180deg, #2a2a2a, #1a1a1a)',
                      border: '2px solid #444',
                    }}>
                      <Icon className="w-3 h-3" style={{ color: active ? '#f97316' : '#555' }} />
                    </div>
                    <span className="text-[5px] font-futuristic tracking-wider" style={{ color: active ? '#f97316' : '#555' }}>{label}</span>
                  </button>
                );
              })}
            </div>

            {/* BPM monitors */}
            <div className="flex gap-2 w-full">
              <div className="flex-1 px-2 py-1 rounded-md text-center" style={{ background: '#0a0a0a', border: '1px solid #2a2a2a' }}>
                <span className="text-[6px] text-gray-600 font-futuristic">A</span>
                <p className="text-xs font-mono font-bold tabular-nums" style={{ color: '#00ff66', textShadow: '0 0 6px #00ff6666' }}>{trackA.bpm}</p>
              </div>
              <div className="flex-1 px-2 py-1 rounded-md text-center" style={{ background: '#0a0a0a', border: '1px solid #2a2a2a' }}>
                <span className="text-[6px] text-gray-600 font-futuristic">B</span>
                <p className="text-xs font-mono font-bold tabular-nums" style={{ color: '#ef4444', textShadow: '0 0 6px #ef444466' }}>{trackB.bpm}</p>
              </div>
            </div>
          </div>

          {/* ─── DECK B ─── */}
          <div className="flex flex-col items-center gap-2 p-3 rounded-lg" style={{ background: '#141414', border: '2px solid #2a2a2a' }}>
            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => toggleCue('B')} className="flex items-center gap-1 px-2 py-1 rounded" style={{
                background: cueB ? 'rgba(34,197,94,0.15)' : '#1a1a1a', border: `1px solid ${cueB ? '#22c55e' : '#333'}`,
              }}>
                <Headphones className="w-3 h-3" style={{ color: cueB ? '#22c55e' : '#555' }} />
                <span className="text-[7px] font-futuristic font-bold" style={{ color: cueB ? '#22c55e' : '#555' }}>CUE</span>
              </button>
              <button onClick={() => updateSet({ deckBPlaying: !activeSet.deckBPlaying })} disabled={!isAdmin}
                className="w-7 h-7 rounded-full flex items-center justify-center disabled:opacity-30"
                style={{
                  background: activeSet.deckBPlaying ? 'radial-gradient(circle at 40% 35%, #ef4444, #991b1b)' : 'radial-gradient(circle at 40% 35%, #22c55e, #15803d)',
                  border: '2px solid #444',
                }}>
                {activeSet.deckBPlaying ? <Pause className="w-3 h-3 text-white" /> : <Play className="w-3 h-3 text-white ml-0.5" />}
              </button>
              <span className="text-red-400 text-[10px] font-futuristic font-black tracking-widest">DECK B</span>
              <div className="w-2 h-2 rounded-full" style={{
                backgroundColor: activeSet.deckBPlaying ? '#22c55e' : '#333',
                boxShadow: activeSet.deckBPlaying ? '0 0 8px #22c55e88' : 'none',
              }} />
            </div>

            <DraggableVinyl rotation={deckBRotation} color="#ef4444" label="B" trackName={trackB.name}
              isPlaying={activeSet.deckBPlaying} speed={speedB}
              onSpeedChange={(s) => { if (isAdmin) setSpeedB(s); }}
              onStartPlay={() => updateSet({ deckBPlaying: true })}
              disabled={!isAdmin} />

            <PitchFader value={pitchB} color="#ef4444" onChange={setPitchB} disabled={!isAdmin} />

            {/* Per-deck EQ */}
            <div className="flex items-center gap-2 mt-1">
              <EQFader label="LO" value={activeSet.eqB.low} color="#22c55e" onChange={(v) => updateEQB('low', v)} disabled={!isAdmin} />
              <EQFader label="MID" value={activeSet.eqB.mid} color="#f59e0b" onChange={(v) => updateEQB('mid', v)} disabled={!isAdmin} />
              <EQFader label="HI" value={activeSet.eqB.high} color="#ef4444" onChange={(v) => updateEQB('high', v)} disabled={!isAdmin} />
            </div>

            <DeckVU analyser={analyserBRef.current} />
            <DeckSpectrum analyser={analyserBRef.current} color="#ef4444" label="DECK B" />

            <div className="text-center px-2 py-1 rounded-md w-full" style={{ background: '#0a0a0a', border: '1px solid #2a2a2a' }}>
              <p className="text-[9px] font-mono" style={{ color: '#ef4444', textShadow: '0 0 6px #ef444466' }}>{trackB.bpm} BPM</p>
              <p className="text-gray-500 text-[7px] font-futuristic tracking-wider">{trackB.genre}</p>
            </div>
          </div>
        </div>

        {/* ═══ INSTRUMENTS ═══ */}
        {showInstruments && (
          <div className="mt-4 pt-3 grid grid-cols-1 md:grid-cols-2 gap-3" style={{ borderTop: '2px solid #2a2a2a' }}>
            <div className="p-3 rounded-lg" style={{ background: '#141414', border: '2px solid #2a2a2a' }}>
              <DJDrumMachine audioContext={audioCtxRef.current} destination={masterGainRef.current} disabled={!isAdmin} />
            </div>
            <div className="p-3 rounded-lg" style={{ background: '#141414', border: '2px solid #2a2a2a' }}>
              <DJSynthesizer audioContext={audioCtxRef.current} destination={masterGainRef.current} disabled={!isAdmin} />
            </div>
          </div>
        )}

        {/* ═══ MICROPHONE ═══ */}
        {showMic && (
          <div className="mt-4 pt-3" style={{ borderTop: '2px solid #2a2a2a' }}>
            <div className="p-3 rounded-lg" style={{ background: '#141414', border: '2px solid #2a2a2a' }}>
              <DJMicrophone
                audioContext={audioCtxRef.current}
                destination={masterGainRef.current}
                disabled={!isAdmin}
                onSaved={loadRecordings}
              />
            </div>
          </div>
        )}

        {/* ═══ PLAYLISTS ═══ */}
        <div className="mt-4 pt-3" style={{ borderTop: '2px solid #2a2a2a' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <List className="w-4 h-4 text-gray-500" />
              <span className="text-[7px] font-futuristic tracking-[0.3em] text-gray-500">PLAYLISTS</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[7px] font-futuristic tracking-wider text-gray-500">LOAD:</span>
              {(['A', 'B'] as const).map(d => (
                <button key={d} onClick={() => setAssignDeck(d)}
                  className="px-2 py-0.5 rounded text-[8px] font-futuristic font-bold tracking-wider"
                  style={{
                    background: assignDeck === d ? (d === 'A' ? '#f97316' : '#ef4444') : '#1a1a1a',
                    color: assignDeck === d ? '#fff' : '#666',
                    border: `1px solid ${assignDeck === d ? (d === 'A' ? '#f97316' : '#ef4444') : '#333'}`,
                  }}>{d}</button>
              ))}
            </div>
          </div>

          <div className="flex gap-1 mb-2 overflow-x-auto">
            {PLAYLISTS.map((pl, i) => (
              <button key={i} onClick={() => setActivePlaylist(i)}
                className="px-2.5 py-1 rounded text-[8px] font-futuristic font-bold tracking-wider whitespace-nowrap transition-all"
                style={{
                  background: activePlaylist === i ? 'linear-gradient(180deg, #333, #222)' : '#1a1a1a',
                  border: `1px solid ${activePlaylist === i ? '#f97316' : '#333'}`,
                  color: activePlaylist === i ? '#f97316' : '#666',
                }}>{pl.name}</button>
            ))}
            <button onClick={() => setActivePlaylist(-1)}
              className="px-2.5 py-1 rounded text-[8px] font-futuristic font-bold tracking-wider whitespace-nowrap transition-all"
              style={{
                background: activePlaylist === -1 ? 'linear-gradient(180deg, #333, #222)' : '#1a1a1a',
                border: `1px solid ${activePlaylist === -1 ? '#ef4444' : '#333'}`,
                color: activePlaylist === -1 ? '#ef4444' : '#666',
              }}>
              <span className="flex items-center gap-1"><Archive className="w-3 h-3" /> RECORDINGS</span>
            </button>
          </div>

          {activePlaylist === -1 ? (
            /* ═══ RECORDINGS LIST ═══ */
            <div className="rounded-md overflow-hidden" style={{ background: '#0a0a0a', border: '2px solid #2a2a2a' }}>
              {recordings.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <Mic className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-[10px] font-futuristic text-gray-500 tracking-wider">No recordings yet</p>
                  <p className="text-[8px] text-gray-600 mt-1">Use the MIC button to record announcements</p>
                </div>
              ) : recordings.map((rec: any) => {
                const isPlaying = playingRecId === rec.id;
                const duration = rec.duration_seconds ? `${Math.floor(rec.duration_seconds / 60)}:${(rec.duration_seconds % 60).toString().padStart(2, '0')}` : '--:--';
                return (
                  <div key={rec.id} className="flex items-center gap-2 px-2.5 py-2 hover:bg-white/5 transition-all"
                    style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <button onClick={() => playRecording(rec)}
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: isPlaying ? 'radial-gradient(circle, #ef4444, #991b1b)' : 'radial-gradient(circle, #22c55e, #15803d)',
                        border: '2px solid #444',
                      }}>
                      {isPlaying ? <Pause className="w-3 h-3 text-white" /> : <Play className="w-3 h-3 text-white ml-0.5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-futuristic tracking-wider truncate" style={{ color: isPlaying ? '#ef4444' : '#999' }}>
                        {rec.title}
                      </p>
                      <p className="text-[7px] text-gray-600 font-mono">
                        {new Date(rec.created_at).toLocaleDateString()} · {duration} · {rec.recording_type?.toUpperCase()}
                      </p>
                    </div>
                    {user?.id === rec.user_id && (
                      <button onClick={() => deleteRecording(rec)}
                        className="w-5 h-5 rounded flex items-center justify-center hover:bg-red-900/30 transition-all"
                        style={{ border: '1px solid #333' }}>
                        <span className="text-red-500 text-[8px]">✕</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-md overflow-hidden" style={{
              background: '#0a0a0a', border: '2px solid #2a2a2a',
            }}>
              {PLAYLISTS[activePlaylist]?.tracks.map((track, tIdx) => {
                let globalIdx = 0;
                for (let p = 0; p < activePlaylist; p++) globalIdx += PLAYLISTS[p].tracks.length;
                globalIdx += tIdx;
                const isOnA = globalIdx === activeSet.deckATrackIndex;
                const isOnB = globalIdx === activeSet.deckBTrackIndex;
                return (
                  <button key={tIdx} onClick={() => selectTrackForDeck(globalIdx)}
                    disabled={!isAdmin}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left transition-all disabled:opacity-50 hover:bg-white/5"
                    style={{
                      background: isOnA ? 'rgba(249,115,22,0.1)' : isOnB ? 'rgba(239,68,68,0.1)' : 'transparent',
                      borderBottom: '1px solid #1a1a1a',
                    }}>
                    <div className="w-4 h-4 flex items-center justify-center">
                      {(isOnA && activeSet.deckAPlaying) || (isOnB && activeSet.deckBPlaying) ? (
                        <Music className="w-3 h-3 animate-pulse" style={{ color: isOnA ? '#f97316' : '#ef4444' }} />
                      ) : (
                        <span className="text-[8px] font-mono text-gray-600">{tIdx + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-futuristic tracking-wider truncate" style={{
                        color: isOnA ? '#f97316' : isOnB ? '#ef4444' : '#999',
                      }}>{track.name}</p>
                    </div>
                    {isOnA && <span className="text-[6px] font-futuristic font-bold px-1 py-0.5 rounded" style={{ background: '#f97316', color: '#fff' }}>A</span>}
                    {isOnB && <span className="text-[6px] font-futuristic font-bold px-1 py-0.5 rounded" style={{ background: '#ef4444', color: '#fff' }}>B</span>}
                    <span className="text-[8px] font-mono tabular-nums text-gray-600">{track.bpm}</span>
                    <span className="text-[7px] font-futuristic tracking-wider px-1 py-0.5 rounded" style={{
                      background: '#1a1a1a', border: '1px solid #2a2a2a',
                      color: isOnA ? '#f97316' : isOnB ? '#ef4444' : '#555',
                    }}>{track.genre}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="h-2" style={{ background: 'linear-gradient(180deg, #333 0%, #444 60%, #666 100%)', boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.2)' }} />
    </div>
  );
};

export default HotDealsDJConsole;
