import { useRef, useCallback, useState, useEffect } from "react";
import { Disc3 } from "lucide-react";

interface DrumPadConfig {
  name: string;
  color: string;
  play: (ctx: AudioContext, dest: AudioNode) => void;
}

const createKick = (ctx: AudioContext, dest: AudioNode) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
  gain.gain.setValueAtTime(1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
  osc.connect(gain).connect(dest);
  osc.start(); osc.stop(ctx.currentTime + 0.5);
};

const createSnare = (ctx: AudioContext, dest: AudioNode) => {
  // Noise burst
  const bufferSize = ctx.sampleRate * 0.2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.8, ctx.currentTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass"; filter.frequency.value = 1000;
  noise.connect(filter).connect(noiseGain).connect(dest);
  // Tone
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = "triangle"; osc.frequency.value = 200;
  oscGain.gain.setValueAtTime(0.5, ctx.currentTime);
  oscGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
  osc.connect(oscGain).connect(dest);
  noise.start(); noise.stop(ctx.currentTime + 0.2);
  osc.start(); osc.stop(ctx.currentTime + 0.1);
};

const createHihat = (ctx: AudioContext, dest: AudioNode) => {
  const bufferSize = ctx.sampleRate * 0.05;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass"; hp.frequency.value = 7000;
  src.connect(hp).connect(gain).connect(dest);
  src.start(); src.stop(ctx.currentTime + 0.05);
};

const createClap = (ctx: AudioContext, dest: AudioNode) => {
  for (let i = 0; i < 3; i++) {
    const bufferSize = ctx.sampleRate * 0.02;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let j = 0; j < bufferSize; j++) data[j] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, ctx.currentTime + i * 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.01 + 0.1);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 2500; bp.Q.value = 3;
    src.connect(bp).connect(gain).connect(dest);
    src.start(ctx.currentTime + i * 0.01); src.stop(ctx.currentTime + i * 0.01 + 0.1);
  }
};

const createTom = (ctx: AudioContext, dest: AudioNode) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
  gain.gain.setValueAtTime(0.8, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
  osc.connect(gain).connect(dest);
  osc.start(); osc.stop(ctx.currentTime + 0.3);
};

const createCymbal = (ctx: AudioContext, dest: AudioNode) => {
  const bufferSize = ctx.sampleRate * 0.4;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass"; hp.frequency.value = 5000;
  src.connect(hp).connect(gain).connect(dest);
  src.start(); src.stop(ctx.currentTime + 0.4);
};

const createFX1 = (ctx: AudioContext, dest: AudioNode) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
  osc.connect(gain).connect(dest);
  osc.start(); osc.stop(ctx.currentTime + 0.3);
};

const createFX2 = (ctx: AudioContext, dest: AudioNode) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(100, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(2000, ctx.currentTime + 0.15);
  osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3);
  gain.gain.setValueAtTime(0.25, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
  osc.connect(gain).connect(dest);
  osc.start(); osc.stop(ctx.currentTime + 0.3);
};

// Keyboard shortcuts: Q W E R / A S D F
const PAD_KEYS = ['q', 'w', 'e', 'r', 'a', 's', 'd', 'f'];
const PAD_KEY_LABELS = ['Q', 'W', 'E', 'R', 'A', 'S', 'D', 'F'];

const PADS: DrumPadConfig[] = [
  { name: "KICK", color: "#f97316", play: createKick },
  { name: "SNARE", color: "#eab308", play: createSnare },
  { name: "HI-HAT", color: "#22c55e", play: createHihat },
  { name: "CLAP", color: "#06b6d4", play: createClap },
  { name: "TOM", color: "#8b5cf6", play: createTom },
  { name: "CYMBAL", color: "#ec4899", play: createCymbal },
  { name: "FX 1", color: "#f43f5e", play: createFX1 },
  { name: "FX 2", color: "#6366f1", play: createFX2 },
];

interface Props {
  audioContext: AudioContext | null;
  destination: AudioNode | null;
  disabled: boolean;
}

const DJDrumMachine = ({ audioContext, destination, disabled }: Props) => {
  const [activePad, setActivePad] = useState<number | null>(null);
  const localCtxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (audioContext) return { ctx: audioContext, dest: destination || audioContext.destination };
    if (!localCtxRef.current) localCtxRef.current = new AudioContext();
    return { ctx: localCtxRef.current, dest: localCtxRef.current.destination };
  }, [audioContext, destination]);

  const hitPad = useCallback((index: number) => {
    if (disabled) return;
    const { ctx, dest } = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    PADS[index].play(ctx, dest);
    setActivePad(index);
    setTimeout(() => setActivePad(null), 150);
  }, [disabled, getCtx]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-1">
        <Disc3 className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-[8px] font-futuristic tracking-[0.3em] text-gray-500">DRUM MACHINE</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {PADS.map((pad, i) => {
          const active = activePad === i;
          return (
            <button
              key={i}
              onPointerDown={() => hitPad(i)}
              disabled={disabled}
              className="relative aspect-square rounded-lg flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-30 touch-none select-none"
              style={{
                background: active
                  ? `radial-gradient(circle at 50% 40%, ${pad.color}dd, ${pad.color}66)`
                  : `linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)`,
                border: `2px solid ${active ? pad.color : '#333'}`,
                boxShadow: active
                  ? `0 0 20px ${pad.color}44, inset 0 1px 0 rgba(255,255,255,0.1)`
                  : 'inset 0 2px 4px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              <div className="w-2 h-2 rounded-full" style={{
                backgroundColor: active ? '#fff' : pad.color,
                boxShadow: active ? `0 0 10px ${pad.color}` : 'none',
                opacity: active ? 1 : 0.5,
              }} />
              <span className="text-[7px] font-futuristic font-bold tracking-wider" style={{
                color: active ? '#fff' : '#888',
              }}>{pad.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DJDrumMachine;
