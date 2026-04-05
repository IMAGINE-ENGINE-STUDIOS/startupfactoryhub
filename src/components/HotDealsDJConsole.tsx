import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Radio, Lock, Music, Disc3, Zap, AudioLines } from "lucide-react";
import { useDJBroadcast, TRACKS, DJState } from "@/hooks/useDJBroadcast";
import { useAuth } from "@/contexts/AuthContext";

const HotDealsDJConsole = () => {
  const { user } = useAuth();
  const { djState, broadcast, isAdmin } = useDJBroadcast(user?.email);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const bassRef = useRef<BiquadFilterNode | null>(null);
  const delayRef = useRef<DelayNode | null>(null);
  const delayGainRef = useRef<GainNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [vuLevel, setVuLevel] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const vuIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [plattersRotation, setPlattersRotation] = useState(0);
  const animRef = useRef<number>(0);

  // Initialize audio
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
    bass.type = "lowshelf";
    bass.frequency.value = 200;
    bass.gain.value = 0;
    bassRef.current = bass;
    const delay = ctx.createDelay(1.0);
    delay.delayTime.value = 0.3;
    delayRef.current = delay;
    const delayGain = ctx.createGain();
    delayGain.gain.value = 0;
    delayGainRef.current = delayGain;
    source.connect(bass);
    bass.connect(gain);
    gain.connect(ctx.destination);
    gain.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(ctx.destination);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const currentTrack = TRACKS[djState.trackIndex];
    if (audio.src !== currentTrack.url) {
      audio.src = currentTrack.url;
      if (djState.isPlaying) { ensureAudioContext(); audio.play().catch(() => {}); }
    }
    if (djState.isPlaying && audio.paused) { ensureAudioContext(); audio.play().catch(() => {}); }
    else if (!djState.isPlaying && !audio.paused) { audio.pause(); }
    if (gainRef.current) gainRef.current.gain.value = djState.volume / 100;
    if (bassRef.current) bassRef.current.gain.value = djState.effects.bass ? 15 : 0;
    if (delayGainRef.current) delayGainRef.current.gain.value = djState.effects.echo ? 0.4 : 0;
  }, [djState]);

  useEffect(() => {
    if (djState.isPlaying) {
      vuIntervalRef.current = setInterval(() => {
        setVuLevel(prev => prev.map(() => Math.random() * djState.volume));
      }, 100);
    } else {
      if (vuIntervalRef.current) clearInterval(vuIntervalRef.current);
      setVuLevel(new Array(12).fill(0));
    }
    return () => { if (vuIntervalRef.current) clearInterval(vuIntervalRef.current); };
  }, [djState.isPlaying, djState.volume]);

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

  const update = (partial: Partial<DJState>) => {
    if (!isAdmin) return;
    broadcast({ ...djState, ...partial });
  };

  const toggleEffect = (key: keyof DJState['effects']) => {
    if (!isAdmin) return;
    broadcast({ ...djState, effects: { ...djState.effects, [key]: !djState.effects[key] } });
  };

  const currentTrack = TRACKS[djState.trackIndex];

  // Vinyl disc component
  const VinylDisc = ({ rotation, color, label }: { rotation: number; color: string; label: string }) => (
    <div className="relative w-32 h-32 sm:w-44 sm:h-44">
      {/* Jog wheel ring */}
      <div className="absolute -inset-2 rounded-full" style={{
        background: `conic-gradient(from 0deg, #555 0%, #888 25%, #444 50%, #777 75%, #555 100%)`,
        boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.6)',
      }} />
      {/* Vinyl record */}
      <div
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          transform: `rotate(${rotation}deg)`,
          background: `radial-gradient(circle at 50% 50%, 
            #111 0%, #111 8%, #1a1a1a 9%, #0a0a0a 10%, 
            #151515 12%, #0a0a0a 14%, #151515 16%, #0a0a0a 18%,
            #151515 20%, #0a0a0a 22%, #151515 24%, #0a0a0a 26%,
            #151515 28%, #0a0a0a 30%, #151515 32%, #0a0a0a 34%,
            #151515 36%, #0a0a0a 38%, #151515 40%, #0a0a0a 42%,
            #151515 44%, #0a0a0a 46%, #151515 48%, #0a0a0a 50%,
            #151515 52%, #0a0a0a 54%, #151515 56%, #0a0a0a 58%,
            #151515 60%, #0a0a0a 62%, #151515 64%, #0a0a0a 66%,
            #151515 68%, #0a0a0a 70%, #151515 72%, #0a0a0a 74%,
            #151515 76%, #0a0a0a 78%, #151515 80%, #0a0a0a 82%,
            #151515 84%, #0a0a0a 86%, #151515 88%, #0a0a0a 90%,
            #151515 92%, #0a0a0a 94%, #151515 96%, #111 100%)`,
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.5)',
        }}
      >
        {/* Light streak reflection */}
        <div className="absolute inset-0 rounded-full" style={{
          background: 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.06) 45%, transparent 55%)',
        }} />
        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center" style={{
            background: `radial-gradient(circle, ${color} 0%, ${color}cc 60%, ${color}66 100%)`,
            boxShadow: `0 0 12px ${color}44, inset 0 -2px 4px rgba(0,0,0,0.3)`,
          }}>
            <div className="text-center">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-black/60 mx-auto mb-0.5" />
              <span className="text-[6px] sm:text-[8px] font-bold text-white/90 font-mono tracking-tighter leading-none">{label}</span>
            </div>
          </div>
        </div>
      </div>
      {/* Tonearm */}
      <div className="absolute -top-3 -right-3 origin-[calc(100%-4px)_8px]" style={{
        transform: djState.isPlaying ? 'rotate(-30deg)' : 'rotate(-8deg)',
        transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div className="w-16 h-1.5 rounded-full" style={{
          background: 'linear-gradient(90deg, #999 0%, #666 40%, #888 60%, #555 100%)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
        }} />
        {/* Cartridge head */}
        <div className="absolute left-0 -top-1 w-3 h-3.5 rounded-sm" style={{
          background: 'linear-gradient(180deg, #777, #444)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
        }} />
        {/* Pivot */}
        <div className="absolute right-0 -top-1 w-4 h-4 rounded-full" style={{
          background: 'radial-gradient(circle at 40% 40%, #aaa, #555)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
        }} />
      </div>
    </div>
  );

  // LED segment display
  const LEDDisplay = ({ value, unit }: { value: string | number; unit: string }) => (
    <div className="flex items-center gap-2 px-4 py-2 rounded-md" style={{
      background: '#0a0a0a',
      border: '2px solid #333',
      boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.05)',
    }}>
      <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums" style={{
        color: '#00ff66',
        textShadow: '0 0 8px #00ff6688, 0 0 20px #00ff6644',
        letterSpacing: '2px',
      }}>{value}</span>
      <span className="text-[9px] font-futuristic tracking-wider" style={{ color: '#00ff6688' }}>{unit}</span>
    </div>
  );

  // Volume knob
  const VolumeKnob = () => {
    const knobAngle = (djState.volume / 100) * 270 - 135;
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-[8px] font-futuristic tracking-widest text-gray-500">VOLUME</span>
        <div
          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full cursor-pointer"
          style={{
            background: 'radial-gradient(circle at 40% 35%, #666 0%, #333 50%, #222 100%)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.1), inset 0 -2px 4px rgba(0,0,0,0.3)',
            border: '2px solid #444',
          }}
          onClick={() => {
            if (!isAdmin) return;
            const next = djState.volume >= 90 ? 0 : djState.volume + 10;
            update({ volume: next });
          }}
        >
          {/* Indicator line */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-0.5 h-5 origin-bottom" style={{
              transform: `rotate(${knobAngle}deg) translateY(-4px)`,
              background: 'linear-gradient(180deg, #ff6600, #ff6600)',
              boxShadow: '0 0 4px #ff660088',
              borderRadius: '1px',
            }} />
          </div>
          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-black/50" />
          </div>
        </div>
        <span className="text-orange-400 text-xs font-mono tabular-nums font-bold">{djState.volume}</span>
      </div>
    );
  };

  return (
    <div className="relative rounded-xl overflow-hidden" style={{
      background: `repeating-linear-gradient(90deg, #1e1e1e 0px, #1e1e1e 1px, #222 2px, #222 4px)`,
      border: '3px solid #333',
      boxShadow: '0 8px 32px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.3)',
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
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.1)',
        }}>
          <div className="absolute inset-0.5 rounded-full" style={{
            background: 'conic-gradient(from 45deg, #555, #777, #555)',
          }} />
        </div>
      ))}

      <div className="p-5 sm:p-7">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Disc3 className="w-5 h-5 text-orange-500" />
            <span className="text-orange-500 text-sm font-futuristic font-black tracking-[0.25em]">SFH-CDJ 3000</span>
          </div>
          <div className="flex items-center gap-2">
            {djState.isPlaying && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded" style={{
                background: 'rgba(220,38,38,0.15)',
                border: '1px solid rgba(220,38,38,0.5)',
                boxShadow: '0 0 12px rgba(220,38,38,0.2)',
              }}>
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" style={{
                  boxShadow: '0 0 8px rgba(239,68,68,0.6)',
                }} />
                <span className="text-red-400 text-[10px] font-bold tracking-widest font-futuristic">ON AIR</span>
              </div>
            )}
            {!isAdmin && (
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-black/30 border border-gray-700">
                <Lock className="w-3 h-3 text-gray-500" />
                <span className="text-gray-500 text-[9px] font-futuristic tracking-wider">LOCKED</span>
              </div>
            )}
          </div>
        </div>

        {/* Main deck layout */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 sm:gap-8 items-center">
          {/* Deck A */}
          <div className="flex flex-col items-center gap-2">
            <VinylDisc rotation={plattersRotation} color="#f97316" label="DECK A" />
            <span className="text-gray-600 text-[9px] font-futuristic tracking-[0.3em] mt-1">PLATTER 1</span>
          </div>

          {/* Center mixer */}
          <div className="flex flex-col items-center gap-4 min-w-[160px] sm:min-w-[200px]">
            {/* Track select */}
            <div className="w-full">
              <span className="text-[8px] font-futuristic tracking-widest text-gray-500 block mb-1">TRACK SELECT</span>
              <select
                value={djState.trackIndex}
                onChange={(e) => update({ trackIndex: Number(e.target.value) })}
                disabled={!isAdmin}
                className="w-full px-3 py-2 text-xs font-futuristic tracking-wider disabled:opacity-40 focus:outline-none rounded-md"
                style={{
                  background: '#0a0a0a',
                  border: '2px solid #333',
                  color: '#f97316',
                  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6)',
                }}
              >
                {TRACKS.map((t, i) => (
                  <option key={i} value={i}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* BPM LED */}
            <LEDDisplay value={currentTrack.bpm} unit="BPM" />

            {/* Play button */}
            <button
              onClick={() => update({ isPlaying: !djState.isPlaying })}
              disabled={!isAdmin}
              className="w-16 h-16 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
              style={{
                background: djState.isPlaying
                  ? 'radial-gradient(circle at 40% 35%, #ef4444 0%, #991b1b 100%)'
                  : 'radial-gradient(circle at 40% 35%, #22c55e 0%, #15803d 100%)',
                boxShadow: djState.isPlaying
                  ? '0 0 24px rgba(239,68,68,0.4), inset 0 2px 4px rgba(255,255,255,0.2), 0 4px 8px rgba(0,0,0,0.5)'
                  : '0 0 24px rgba(34,197,94,0.3), inset 0 2px 4px rgba(255,255,255,0.2), 0 4px 8px rgba(0,0,0,0.5)',
                border: '3px solid #444',
              }}
            >
              {djState.isPlaying ? <Pause className="w-7 h-7 text-white" /> : <Play className="w-7 h-7 text-white ml-0.5" />}
            </button>

            {/* Volume knob */}
            <VolumeKnob />

            {/* VU Meter */}
            <div className="flex items-end gap-[3px] h-12 px-3 py-2 rounded-md" style={{
              background: '#0a0a0a',
              border: '2px solid #333',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)',
            }}>
              {vuLevel.map((level, i) => (
                <div key={i} className="flex flex-col-reverse gap-[1px]">
                  {Array.from({ length: 8 }).map((_, seg) => {
                    const threshold = (seg / 8) * 100;
                    const active = level > threshold;
                    const segColor = seg >= 6 ? '#ef4444' : seg >= 4 ? '#f59e0b' : '#22c55e';
                    return (
                      <div
                        key={seg}
                        className="w-1.5 h-1 rounded-[1px]"
                        style={{
                          backgroundColor: active ? segColor : '#1a1a1a',
                          boxShadow: active ? `0 0 4px ${segColor}66` : 'none',
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Deck B */}
          <div className="flex flex-col items-center gap-2">
            <VinylDisc rotation={-plattersRotation} color="#ef4444" label="DECK B" />
            <span className="text-gray-600 text-[9px] font-futuristic tracking-[0.3em] mt-1">PLATTER 2</span>
          </div>
        </div>

        {/* Effects strip */}
        <div className="mt-5 pt-4" style={{ borderTop: '2px solid #2a2a2a' }}>
          <span className="text-[8px] font-futuristic tracking-[0.3em] text-gray-500 block mb-3 text-center">EFFECTS PROCESSOR</span>
          <div className="flex items-center justify-center gap-3 sm:gap-5">
            {([
              { key: 'bass' as const, label: 'BASS', icon: Zap },
              { key: 'echo' as const, label: 'ECHO', icon: AudioLines },
              { key: 'reverb' as const, label: 'REVERB', icon: Radio },
            ]).map(({ key, label, icon: Icon }) => {
              const active = djState.effects[key];
              return (
                <button
                  key={key}
                  onClick={() => toggleEffect(key)}
                  disabled={!isAdmin}
                  className="flex flex-col items-center gap-2 disabled:opacity-30"
                >
                  {/* LED indicator */}
                  <div className="w-2.5 h-2.5 rounded-full" style={{
                    backgroundColor: active ? '#00ff66' : '#1a1a1a',
                    boxShadow: active ? '0 0 8px #00ff6688, 0 0 16px #00ff6644' : 'inset 0 1px 2px rgba(0,0,0,0.5)',
                    border: '1px solid #444',
                  }} />
                  {/* Toggle switch */}
                  <div className="relative w-10 h-6 rounded-md" style={{
                    background: active
                      ? 'linear-gradient(180deg, #333 0%, #222 100%)'
                      : 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)',
                    border: '2px solid #444',
                    boxShadow: active
                      ? 'inset 0 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(249,115,22,0.2)'
                      : 'inset 0 2px 4px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.05)',
                  }}>
                    <Icon className="w-3 h-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{
                      color: active ? '#f97316' : '#555',
                    }} />
                  </div>
                  <span className="text-[8px] font-futuristic tracking-wider" style={{
                    color: active ? '#f97316' : '#555',
                  }}>{label}</span>
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
