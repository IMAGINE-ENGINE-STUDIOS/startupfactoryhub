import { useEffect, useRef, useState } from "react";
import { Play, Pause, Lock, Disc3, Zap, AudioLines, Radio, SkipForward, SkipBack, List, Music, Headphones } from "lucide-react";
import { useDJBroadcast, PLAYLISTS, TRACKS, DJState, TrackInfo } from "@/hooks/useDJBroadcast";
import { useAuth } from "@/contexts/AuthContext";

const HotDealsDJConsole = () => {
  const { user } = useAuth();
  const { djState, broadcast, isAdmin } = useDJBroadcast(user?.email);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const bassRef = useRef<BiquadFilterNode | null>(null);
  const midRef = useRef<BiquadFilterNode | null>(null);
  const highRef = useRef<BiquadFilterNode | null>(null);
  const delayRef = useRef<DelayNode | null>(null);
  const delayGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [vuLevel, setVuLevel] = useState<number[]>(new Array(24).fill(0));
  const [eqBands, setEqBands] = useState<number[]>(new Array(16).fill(0));
  const vuIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [plattersRotation, setPlattersRotation] = useState(0);
  const animRef = useRef<number>(0);
  const [activePlaylist, setActivePlaylist] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const eqAnimRef = useRef<number>(0);

  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      audioRef.current = audio;
    }
    return () => {
      audioRef.current?.pause();
      audioCtxRef.current?.close();
    };
  }, []);

  const ensureAudioContext = () => {
    if (audioCtxRef.current) return;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaElementSource(audioRef.current!);
    sourceRef.current = source;

    const gain = ctx.createGain();
    gainRef.current = gain;

    const bass = ctx.createBiquadFilter();
    bass.type = "lowshelf"; bass.frequency.value = 200; bass.gain.value = 0;
    bassRef.current = bass;

    const mid = ctx.createBiquadFilter();
    mid.type = "peaking"; mid.frequency.value = 1000; mid.Q.value = 1; mid.gain.value = 0;
    midRef.current = mid;

    const high = ctx.createBiquadFilter();
    high.type = "highshelf"; high.frequency.value = 4000; high.gain.value = 0;
    highRef.current = high;

    const delay = ctx.createDelay(1.0);
    delay.delayTime.value = 0.3;
    delayRef.current = delay;
    const delayGain = ctx.createGain();
    delayGain.gain.value = 0;
    delayGainRef.current = delayGain;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    analyserRef.current = analyser;

    source.connect(bass).connect(mid).connect(high).connect(gain);
    gain.connect(analyser);
    analyser.connect(ctx.destination);
    gain.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(ctx.destination);
  };

  // Sync audio state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const currentTrack = TRACKS[djState.trackIndex];
    if (!currentTrack) return;
    if (audio.src !== currentTrack.url) {
      audio.src = currentTrack.url;
      if (djState.isPlaying) { ensureAudioContext(); audio.play().catch(() => {}); }
    }
    if (djState.isPlaying && audio.paused) { ensureAudioContext(); audio.play().catch(() => {}); }
    else if (!djState.isPlaying && !audio.paused) { audio.pause(); }
    if (gainRef.current) gainRef.current.gain.value = djState.volume / 100;
    if (bassRef.current) bassRef.current.gain.value = djState.effects.bass ? 15 : djState.eq.low;
    if (midRef.current) midRef.current.gain.value = djState.eq.mid;
    if (highRef.current) highRef.current.gain.value = djState.eq.high;
    if (delayGainRef.current) delayGainRef.current.gain.value = djState.effects.echo ? 0.4 : 0;
  }, [djState]);

  // VU meter from analyser
  useEffect(() => {
    if (djState.isPlaying && analyserRef.current) {
      const analyser = analyserRef.current;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      vuIntervalRef.current = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const bars = [];
        const step = Math.floor(dataArray.length / 24);
        for (let i = 0; i < 24; i++) {
          bars.push((dataArray[i * step] / 255) * 100);
        }
        setVuLevel(bars);
        // EQ bands
        const eq = [];
        const eqStep = Math.floor(dataArray.length / 16);
        for (let i = 0; i < 16; i++) {
          eq.push((dataArray[i * eqStep] / 255) * 100);
        }
        setEqBands(eq);
      }, 50);
    } else {
      if (vuIntervalRef.current) clearInterval(vuIntervalRef.current);
      setVuLevel(new Array(24).fill(0));
      setEqBands(new Array(16).fill(0));
    }
    return () => { if (vuIntervalRef.current) clearInterval(vuIntervalRef.current); };
  }, [djState.isPlaying]);

  // Platter rotation
  useEffect(() => {
    if (djState.isPlaying) {
      const animate = () => {
        setPlattersRotation(prev => (prev + 1.2) % 360);
        animRef.current = requestAnimationFrame(animate);
      };
      animRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animRef.current);
    }
    return () => cancelAnimationFrame(animRef.current);
  }, [djState.isPlaying]);

  // EQ visualizer canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 0.5;
      for (let y = 0; y < h; y += 10) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      const barW = (w - 2) / eqBands.length;
      eqBands.forEach((val, i) => {
        const barH = (val / 100) * (h - 4);
        const x = 1 + i * barW;
        const y = h - 2 - barH;

        // Gradient bar
        const grad = ctx.createLinearGradient(x, y, x, h - 2);
        if (val > 80) {
          grad.addColorStop(0, '#ef4444');
          grad.addColorStop(0.3, '#f97316');
          grad.addColorStop(1, '#22c55e');
        } else if (val > 50) {
          grad.addColorStop(0, '#f59e0b');
          grad.addColorStop(1, '#22c55e');
        } else {
          grad.addColorStop(0, '#22c55e');
          grad.addColorStop(1, '#15803d');
        }

        ctx.fillStyle = grad;
        ctx.fillRect(x + 1, y, barW - 2, barH);

        // Glow
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

  const nextTrack = () => {
    if (!isAdmin) return;
    const next = (djState.trackIndex + 1) % TRACKS.length;
    update({ trackIndex: next });
  };

  const prevTrack = () => {
    if (!isAdmin) return;
    const prev = djState.trackIndex === 0 ? TRACKS.length - 1 : djState.trackIndex - 1;
    update({ trackIndex: prev });
  };

  const currentTrack = TRACKS[djState.trackIndex] || TRACKS[0];

  // Find which playlist the current track belongs to
  const getPlaylistForTrack = (idx: number) => {
    let count = 0;
    for (let p = 0; p < PLAYLISTS.length; p++) {
      if (idx < count + PLAYLISTS[p].tracks.length) return p;
      count += PLAYLISTS[p].tracks.length;
    }
    return 0;
  };

  const selectTrackFromPlaylist = (playlistIdx: number, trackIdx: number) => {
    if (!isAdmin) return;
    let globalIdx = 0;
    for (let p = 0; p < playlistIdx; p++) {
      globalIdx += PLAYLISTS[p].tracks.length;
    }
    globalIdx += trackIdx;
    update({ trackIndex: globalIdx });
  };

  // EQ knob component
  const EQKnob = ({ label, value, band, color }: { label: string; value: number; band: 'low' | 'mid' | 'high'; color: string }) => {
    const angle = (value / 24) * 270; // -12..+12 mapped to rotation
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-[7px] font-futuristic tracking-widest" style={{ color: '#666' }}>{label}</span>
        <div
          className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full cursor-pointer"
          style={{
            background: 'radial-gradient(circle at 40% 35%, #555 0%, #2a2a2a 60%, #1a1a1a 100%)',
            boxShadow: '0 3px 8px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.1)',
            border: '2px solid #3a3a3a',
          }}
          onClick={() => {
            if (!isAdmin) return;
            const next = value >= 12 ? -12 : value + 3;
            updateEQ(band, next);
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-0.5 h-3.5 origin-bottom" style={{
              transform: `rotate(${angle}deg) translateY(-2px)`,
              background: color,
              boxShadow: `0 0 4px ${color}88`,
              borderRadius: '1px',
            }} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-black/50" />
          </div>
        </div>
        <span className="text-[9px] font-mono tabular-nums" style={{ color }}>{value > 0 ? `+${value}` : value}</span>
      </div>
    );
  };

  // VU Meter bar
  const VUMeterBar = ({ levels }: { levels: number[] }) => (
    <div className="flex items-end gap-[2px] h-16 px-2 py-2 rounded-md" style={{
      background: '#0a0a0a',
      border: '2px solid #2a2a2a',
      boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)',
    }}>
      {levels.map((level, i) => (
        <div key={i} className="flex flex-col-reverse gap-[1px]">
          {Array.from({ length: 10 }).map((_, seg) => {
            const threshold = (seg / 10) * 100;
            const active = level > threshold;
            const segColor = seg >= 8 ? '#ef4444' : seg >= 5 ? '#f59e0b' : '#22c55e';
            return (
              <div
                key={seg}
                className="rounded-[1px]"
                style={{
                  width: '3px',
                  height: '3px',
                  backgroundColor: active ? segColor : '#1a1a1a',
                  boxShadow: active ? `0 0 3px ${segColor}66` : 'none',
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );

  // Vinyl disc
  const VinylDisc = ({ rotation, color, label }: { rotation: number; color: string; label: string }) => (
    <div className="relative w-28 h-28 sm:w-36 sm:h-36">
      <div className="absolute -inset-2 rounded-full" style={{
        background: `conic-gradient(from 0deg, #555 0%, #888 25%, #444 50%, #777 75%, #555 100%)`,
        boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.6)',
      }} />
      <div
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          transform: `rotate(${rotation}deg)`,
          background: `radial-gradient(circle at 50% 50%, 
            #111 0%, #111 8%, #1a1a1a 9%, #0a0a0a 10%, 
            #151515 14%, #0a0a0a 18%, #151515 22%, #0a0a0a 26%,
            #151515 30%, #0a0a0a 34%, #151515 38%, #0a0a0a 42%,
            #151515 46%, #0a0a0a 50%, #151515 54%, #0a0a0a 58%,
            #151515 62%, #0a0a0a 66%, #151515 70%, #0a0a0a 74%,
            #151515 78%, #0a0a0a 82%, #151515 86%, #0a0a0a 90%,
            #151515 94%, #111 100%)`,
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8)',
        }}
      >
        <div className="absolute inset-0 rounded-full" style={{
          background: 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.06) 45%, transparent 55%)',
        }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center" style={{
            background: `radial-gradient(circle, ${color} 0%, ${color}cc 60%, ${color}66 100%)`,
            boxShadow: `0 0 12px ${color}44`,
          }}>
            <div className="text-center">
              <div className="w-2 h-2 rounded-full bg-black/60 mx-auto mb-0.5" />
              <span className="text-[6px] sm:text-[7px] font-bold text-white/90 font-mono leading-none">{label}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative rounded-xl overflow-hidden" style={{
      background: `repeating-linear-gradient(90deg, #1a1a1a 0px, #1a1a1a 1px, #1e1e1e 2px, #1e1e1e 4px)`,
      border: '3px solid #333',
      boxShadow: '0 8px 32px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)',
    }}>
      {/* Top chrome strip */}
      <div className="h-2" style={{
        background: 'linear-gradient(180deg, #666 0%, #444 40%, #333 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
      }} />

      {/* Screw corners */}
      {['top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3'].map((pos, i) => (
        <div key={i} className={`absolute ${pos} w-3 h-3 rounded-full z-10`} style={{
          background: 'radial-gradient(circle at 40% 40%, #888, #444)',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
        }}>
          <div className="absolute inset-0.5 rounded-full" style={{
            background: 'conic-gradient(from 45deg, #555, #777, #555)',
          }} />
        </div>
      ))}

      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Disc3 className="w-5 h-5 text-orange-500" />
            <span className="text-orange-500 text-sm font-futuristic font-black tracking-[0.2em]">SFH-CDJ 3000</span>
          </div>
          <div className="flex items-center gap-2">
            {djState.isPlaying && (
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

        {/* ===== MAIN DECK LAYOUT ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-start">

          {/* LEFT: Vinyl + Track info */}
          <div className="flex flex-col items-center gap-3">
            <VinylDisc rotation={plattersRotation} color="#f97316" label="DECK A" />
            <div className="text-center mt-1">
              <p className="text-orange-400 text-xs font-futuristic font-bold tracking-wider truncate max-w-[180px]">
                {currentTrack.name}
              </p>
              <p className="text-gray-500 text-[9px] font-futuristic tracking-wider">{currentTrack.genre} — {currentTrack.bpm} BPM</p>
            </div>
          </div>

          {/* CENTER: Transport + Volume + EQ */}
          <div className="flex flex-col items-center gap-4 min-w-[220px] sm:min-w-[260px]">
            {/* Now playing LED */}
            <div className="w-full px-3 py-2 rounded-md" style={{
              background: '#0a0a0a', border: '2px solid #2a2a2a',
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.8)',
            }}>
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-futuristic tracking-wider text-gray-600">NOW PLAYING</span>
                <span className="text-[9px] font-mono tabular-nums" style={{
                  color: '#00ff66', textShadow: '0 0 6px #00ff6666',
                }}>{currentTrack.bpm} BPM</span>
              </div>
              <p className="text-orange-400 text-sm font-futuristic font-bold tracking-wider truncate mt-0.5">{currentTrack.name}</p>
              <p className="text-gray-600 text-[9px] font-futuristic tracking-wider">{currentTrack.genre}</p>
            </div>

            {/* Transport controls */}
            <div className="flex items-center gap-3">
              <button onClick={prevTrack} disabled={!isAdmin}
                className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-30 transition-all hover:scale-105"
                style={{
                  background: 'radial-gradient(circle at 40% 35%, #444 0%, #222 100%)',
                  border: '2px solid #444', boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                }}>
                <SkipBack className="w-4 h-4 text-gray-300" />
              </button>

              <button
                onClick={() => update({ isPlaying: !djState.isPlaying })}
                disabled={!isAdmin}
                className="w-14 h-14 rounded-full flex items-center justify-center transition-all disabled:opacity-30 hover:scale-105"
                style={{
                  background: djState.isPlaying
                    ? 'radial-gradient(circle at 40% 35%, #ef4444 0%, #991b1b 100%)'
                    : 'radial-gradient(circle at 40% 35%, #22c55e 0%, #15803d 100%)',
                  boxShadow: djState.isPlaying
                    ? '0 0 20px rgba(239,68,68,0.4), 0 4px 8px rgba(0,0,0,0.5)'
                    : '0 0 20px rgba(34,197,94,0.3), 0 4px 8px rgba(0,0,0,0.5)',
                  border: '3px solid #444',
                }}
              >
                {djState.isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-0.5" />}
              </button>

              <button onClick={nextTrack} disabled={!isAdmin}
                className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-30 transition-all hover:scale-105"
                style={{
                  background: 'radial-gradient(circle at 40% 35%, #444 0%, #222 100%)',
                  border: '2px solid #444', boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                }}>
                <SkipForward className="w-4 h-4 text-gray-300" />
              </button>
            </div>

            {/* Volume slider */}
            <div className="w-full">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[8px] font-futuristic tracking-widest text-gray-500">MASTER VOLUME</span>
                <span className="text-orange-400 text-xs font-mono tabular-nums font-bold">{djState.volume}</span>
              </div>
              <input
                type="range" min={0} max={100} value={djState.volume}
                onChange={(e) => update({ volume: Number(e.target.value) })}
                disabled={!isAdmin}
                className="w-full h-2 rounded-full appearance-none cursor-pointer disabled:opacity-30"
                style={{
                  background: `linear-gradient(90deg, #f97316 0%, #f97316 ${djState.volume}%, #2a2a2a ${djState.volume}%, #2a2a2a 100%)`,
                }}
              />
            </div>

            {/* EQ Knobs */}
            <div className="flex items-center gap-4 sm:gap-6">
              <EQKnob label="LOW" value={djState.eq.low} band="low" color="#22c55e" />
              <EQKnob label="MID" value={djState.eq.mid} band="mid" color="#f59e0b" />
              <EQKnob label="HIGH" value={djState.eq.high} band="high" color="#ef4444" />
            </div>

            {/* VU Meter */}
            <VUMeterBar levels={vuLevel} />
          </div>

          {/* RIGHT: Vinyl B + EQ Visualizer */}
          <div className="flex flex-col items-center gap-3">
            <VinylDisc rotation={-plattersRotation} color="#ef4444" label="DECK B" />
            {/* EQ Visualizer Canvas */}
            <div className="w-full max-w-[200px] rounded-md overflow-hidden" style={{
              border: '2px solid #2a2a2a',
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6)',
            }}>
              <canvas ref={canvasRef} width={200} height={60} className="w-full h-[60px] block" />
            </div>
            <span className="text-gray-600 text-[8px] font-futuristic tracking-[0.2em]">SPECTRUM ANALYZER</span>
          </div>
        </div>

        {/* ===== EFFECTS STRIP ===== */}
        <div className="mt-5 pt-4" style={{ borderTop: '2px solid #2a2a2a' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[8px] font-futuristic tracking-[0.3em] text-gray-500">EFFECTS PROCESSOR</span>
            <div className="flex items-center gap-1">
              <Headphones className="w-3 h-3 text-gray-600" />
              <span className="text-[8px] font-futuristic tracking-wider text-gray-600">MONITOR</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            {([
              { key: 'bass' as const, label: 'BASS BOOST', icon: Zap },
              { key: 'echo' as const, label: 'DELAY/ECHO', icon: AudioLines },
              { key: 'reverb' as const, label: 'REVERB', icon: Radio },
            ]).map(({ key, label, icon: Icon }) => {
              const active = djState.effects[key];
              return (
                <button
                  key={key}
                  onClick={() => toggleEffect(key)}
                  disabled={!isAdmin}
                  className="flex flex-col items-center gap-1.5 disabled:opacity-30 transition-all"
                >
                  <div className="w-2.5 h-2.5 rounded-full" style={{
                    backgroundColor: active ? '#00ff66' : '#1a1a1a',
                    boxShadow: active ? '0 0 8px #00ff6688, 0 0 16px #00ff6644' : 'inset 0 1px 2px rgba(0,0,0,0.5)',
                    border: '1px solid #444',
                  }} />
                  <div className="relative w-12 h-7 rounded-md flex items-center justify-center" style={{
                    background: active
                      ? 'linear-gradient(180deg, #333 0%, #222 100%)'
                      : 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)',
                    border: '2px solid #444',
                    boxShadow: active
                      ? '0 0 8px rgba(249,115,22,0.2), inset 0 1px 3px rgba(0,0,0,0.4)'
                      : 'inset 0 2px 4px rgba(0,0,0,0.3)',
                  }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: active ? '#f97316' : '#555' }} />
                  </div>
                  <span className="text-[7px] font-futuristic tracking-wider" style={{
                    color: active ? '#f97316' : '#555',
                  }}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ===== PLAYLIST TABS ===== */}
        <div className="mt-5 pt-4" style={{ borderTop: '2px solid #2a2a2a' }}>
          <div className="flex items-center gap-2 mb-3">
            <List className="w-4 h-4 text-gray-500" />
            <span className="text-[8px] font-futuristic tracking-[0.3em] text-gray-500">PLAYLISTS</span>
          </div>

          {/* Playlist tabs */}
          <div className="flex gap-1 mb-3 overflow-x-auto">
            {PLAYLISTS.map((pl, i) => (
              <button
                key={i}
                onClick={() => setActivePlaylist(i)}
                className="px-3 py-1.5 rounded text-[9px] font-futuristic font-bold tracking-wider whitespace-nowrap transition-all"
                style={{
                  background: activePlaylist === i ? 'linear-gradient(180deg, #333, #222)' : '#1a1a1a',
                  border: `1px solid ${activePlaylist === i ? '#f97316' : '#333'}`,
                  color: activePlaylist === i ? '#f97316' : '#666',
                  boxShadow: activePlaylist === i ? '0 0 8px rgba(249,115,22,0.15)' : 'none',
                }}
              >
                {pl.name}
              </button>
            ))}
          </div>

          {/* Track list */}
          <div className="rounded-md overflow-hidden" style={{
            background: '#0a0a0a', border: '2px solid #2a2a2a',
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6)',
          }}>
            {PLAYLISTS[activePlaylist]?.tracks.map((track, tIdx) => {
              // Calculate the global index for this track
              let globalIdx = 0;
              for (let p = 0; p < activePlaylist; p++) globalIdx += PLAYLISTS[p].tracks.length;
              globalIdx += tIdx;
              const isActive = globalIdx === djState.trackIndex;

              return (
                <button
                  key={tIdx}
                  onClick={() => selectTrackFromPlaylist(activePlaylist, tIdx)}
                  disabled={!isAdmin}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left transition-all disabled:opacity-50 hover:bg-white/5"
                  style={{
                    background: isActive ? 'rgba(249,115,22,0.1)' : 'transparent',
                    borderBottom: '1px solid #1a1a1a',
                  }}
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    {isActive && djState.isPlaying ? (
                      <Music className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                    ) : (
                      <span className="text-[9px] font-mono text-gray-600">{tIdx + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-futuristic tracking-wider truncate" style={{
                      color: isActive ? '#f97316' : '#999',
                    }}>{track.name}</p>
                  </div>
                  <span className="text-[9px] font-mono tabular-nums text-gray-600">{track.bpm}</span>
                  <span className="text-[8px] font-futuristic tracking-wider px-1.5 py-0.5 rounded" style={{
                    background: '#1a1a1a', border: '1px solid #2a2a2a',
                    color: isActive ? '#f97316' : '#555',
                  }}>{track.genre}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom chrome strip */}
      <div className="h-2" style={{
        background: 'linear-gradient(180deg, #333 0%, #444 60%, #666 100%)',
        boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.2)',
      }} />
    </div>
  );
};

export default HotDealsDJConsole;
