import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Radio, Lock, Music, Disc3, Zap, AudioLines } from "lucide-react";
import { Slider } from "@/components/ui/slider";
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
  const [vuLevel, setVuLevel] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0]);
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

  // Setup Web Audio nodes
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

    // Chain: source -> bass -> gain -> destination
    //                              \-> delay -> delayGain -> destination
    source.connect(bass);
    bass.connect(gain);
    gain.connect(ctx.destination);
    gain.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(ctx.destination);
  };

  // Apply DJ state to audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const currentTrack = TRACKS[djState.trackIndex];
    if (audio.src !== currentTrack.url) {
      audio.src = currentTrack.url;
      if (djState.isPlaying) {
        ensureAudioContext();
        audio.play().catch(() => {});
      }
    }

    if (djState.isPlaying && audio.paused) {
      ensureAudioContext();
      audio.play().catch(() => {});
    } else if (!djState.isPlaying && !audio.paused) {
      audio.pause();
    }

    if (gainRef.current) {
      gainRef.current.gain.value = djState.volume / 100;
    }
    if (bassRef.current) {
      bassRef.current.gain.value = djState.effects.bass ? 15 : 0;
    }
    if (delayGainRef.current) {
      delayGainRef.current.gain.value = djState.effects.echo ? 0.4 : 0;
    }
  }, [djState]);

  // VU meter animation
  useEffect(() => {
    if (djState.isPlaying) {
      vuIntervalRef.current = setInterval(() => {
        setVuLevel(prev => prev.map(() => Math.random() * djState.volume));
      }, 120);
    } else {
      if (vuIntervalRef.current) clearInterval(vuIntervalRef.current);
      setVuLevel([0, 0, 0, 0, 0, 0, 0, 0]);
    }
    return () => { if (vuIntervalRef.current) clearInterval(vuIntervalRef.current); };
  }, [djState.isPlaying, djState.volume]);

  // Platter rotation animation
  useEffect(() => {
    if (djState.isPlaying) {
      const animate = () => {
        setPlattersRotation(prev => (prev + 1.5) % 360);
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
    broadcast({
      ...djState,
      effects: { ...djState.effects, [key]: !djState.effects[key] },
    });
  };

  const currentTrack = TRACKS[djState.trackIndex];

  return (
    <div className="relative rounded-2xl overflow-hidden border-2 border-orange-500/40 bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d]">
      {/* Top strip */}
      <div className="h-1 bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500" />

      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Disc3 className="w-5 h-5 text-orange-400" />
            <span className="text-orange-400 text-xs font-futuristic font-bold tracking-[0.2em]">DJ CONTROL DECK</span>
          </div>
          <div className="flex items-center gap-2">
            {djState.isPlaying && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-600/20 border border-red-500/40">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400 text-[10px] font-bold tracking-wider font-futuristic">ON AIR</span>
              </div>
            )}
            {!isAdmin && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted/20 border border-border/30">
                <Lock className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground text-[10px] font-futuristic">VIEW ONLY</span>
              </div>
            )}
          </div>
        </div>

        {/* Main console layout */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 sm:gap-6 items-center">
          {/* Left Platter */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-28 h-28 sm:w-36 sm:h-36">
              <div
                className="w-full h-full rounded-full border-4 border-orange-500/30 bg-gradient-to-br from-[#222] to-[#111] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]"
                style={{ transform: `rotate(${plattersRotation}deg)` }}
              >
                {/* Groove lines */}
                {[20, 30, 40, 50, 60].map((r) => (
                  <div
                    key={r}
                    className="absolute rounded-full border border-orange-500/10"
                    style={{
                      top: `${50 - r / 2.8}%`,
                      left: `${50 - r / 2.8}%`,
                      width: `${r / 1.4}%`,
                      height: `${r / 1.4}%`,
                    }}
                  />
                ))}
                {/* Center label */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                    <Music className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                </div>
              </div>
              {/* Tonearm */}
              <div className="absolute -top-1 -right-1 w-12 h-1 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full origin-right" style={{ transform: djState.isPlaying ? 'rotate(-25deg)' : 'rotate(-5deg)', transition: 'transform 0.5s ease' }} />
            </div>
            <span className="text-muted-foreground text-[10px] font-futuristic tracking-wider">DECK A</span>
          </div>

          {/* Center Mixer */}
          <div className="flex flex-col items-center gap-3 min-w-[140px] sm:min-w-[180px]">
            {/* Track selector */}
            <div className="w-full">
              <select
                value={djState.trackIndex}
                onChange={(e) => update({ trackIndex: Number(e.target.value) })}
                disabled={!isAdmin}
                className="w-full bg-[#1a1a1a] border border-orange-500/30 rounded-lg px-3 py-1.5 text-orange-400 text-xs font-futuristic tracking-wider disabled:opacity-50 focus:outline-none focus:border-orange-400"
              >
                {TRACKS.map((t, i) => (
                  <option key={i} value={i}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* BPM */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#111] border border-orange-500/20">
              <AudioLines className="w-3 h-3 text-orange-400" />
              <span className="text-orange-400 text-lg font-bold font-mono tabular-nums">{currentTrack.bpm}</span>
              <span className="text-orange-400/50 text-[10px] font-futuristic">BPM</span>
            </div>

            {/* Play/Pause */}
            <button
              onClick={() => update({ isPlaying: !djState.isPlaying })}
              disabled={!isAdmin}
              className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all disabled:opacity-40 ${
                djState.isPlaying
                  ? "bg-red-600/20 border-red-500 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                  : "bg-green-600/20 border-green-500 text-green-400 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]"
              }`}
            >
              {djState.isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </button>

            {/* Volume */}
            <div className="w-full flex items-center gap-2">
              {djState.volume === 0 ? (
                <VolumeX className="w-4 h-4 text-orange-400/50 shrink-0" />
              ) : (
                <Volume2 className="w-4 h-4 text-orange-400 shrink-0" />
              )}
              <Slider
                value={[djState.volume]}
                max={100}
                step={1}
                onValueChange={([v]) => update({ volume: v })}
                disabled={!isAdmin}
                className="flex-1"
              />
              <span className="text-orange-400 text-xs font-mono w-8 text-right tabular-nums">{djState.volume}</span>
            </div>

            {/* VU Meter */}
            <div className="flex items-end gap-1 h-8">
              {vuLevel.map((level, i) => (
                <div
                  key={i}
                  className="w-2 rounded-sm transition-all duration-100"
                  style={{
                    height: `${Math.max(4, level * 0.32)}px`,
                    backgroundColor: level > 70 ? '#ef4444' : level > 40 ? '#f97316' : '#22c55e',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Right Platter */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-28 h-28 sm:w-36 sm:h-36">
              <div
                className="w-full h-full rounded-full border-4 border-red-500/30 bg-gradient-to-br from-[#222] to-[#111] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]"
                style={{ transform: `rotate(${-plattersRotation}deg)` }}
              >
                {[20, 30, 40, 50, 60].map((r) => (
                  <div
                    key={r}
                    className="absolute rounded-full border border-red-500/10"
                    style={{
                      top: `${50 - r / 2.8}%`,
                      left: `${50 - r / 2.8}%`,
                      width: `${r / 1.4}%`,
                      height: `${r / 1.4}%`,
                    }}
                  />
                ))}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg">
                    <Radio className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="absolute -top-1 -left-1 w-12 h-1 bg-gradient-to-l from-gray-400 to-gray-600 rounded-full origin-left" style={{ transform: djState.isPlaying ? 'rotate(25deg)' : 'rotate(5deg)', transition: 'transform 0.5s ease' }} />
            </div>
            <span className="text-muted-foreground text-[10px] font-futuristic tracking-wider">DECK B</span>
          </div>
        </div>

        {/* Effects strip */}
        <div className="mt-4 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
          {([
            { key: 'bass' as const, label: 'BASS', icon: Zap },
            { key: 'echo' as const, label: 'ECHO', icon: AudioLines },
            { key: 'reverb' as const, label: 'REVERB', icon: Radio },
          ]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => toggleEffect(key)}
              disabled={!isAdmin}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-futuristic font-bold tracking-wider transition-all disabled:opacity-40 ${
                djState.effects[key]
                  ? "bg-orange-500/20 border-orange-400/60 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.2)]"
                  : "bg-[#1a1a1a] border-border/30 text-muted-foreground hover:border-orange-400/30"
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom strip */}
      <div className="h-1 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600" />
    </div>
  );
};

export default HotDealsDJConsole;
