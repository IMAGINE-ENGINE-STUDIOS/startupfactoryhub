import { useRef, useState, useCallback, useEffect } from "react";
import { Music } from "lucide-react";

interface SynthPreset {
  name: string;
  oscType: OscillatorType;
  attack: number;
  release: number;
  filterFreq: number;
  filterQ: number;
  detune: number;
  gain: number;
}

const PRESETS: SynthPreset[] = [
  { name: "SINE LEAD", oscType: "sine", attack: 0.01, release: 0.3, filterFreq: 8000, filterQ: 1, detune: 0, gain: 0.4 },
  { name: "SQUARE BASS", oscType: "square", attack: 0.005, release: 0.2, filterFreq: 800, filterQ: 5, detune: 0, gain: 0.25 },
  { name: "SAW PAD", oscType: "sawtooth", attack: 0.1, release: 0.8, filterFreq: 3000, filterQ: 2, detune: 10, gain: 0.2 },
  { name: "FM BELL", oscType: "sine", attack: 0.001, release: 1.2, filterFreq: 12000, filterQ: 0.5, detune: 700, gain: 0.3 },
  { name: "PLUCK", oscType: "triangle", attack: 0.001, release: 0.15, filterFreq: 5000, filterQ: 3, detune: 0, gain: 0.4 },
  { name: "SUB BASS", oscType: "sine", attack: 0.01, release: 0.4, filterFreq: 400, filterQ: 1, detune: 0, gain: 0.5 },
  { name: "STRINGS", oscType: "sawtooth", attack: 0.2, release: 1.0, filterFreq: 2000, filterQ: 1, detune: 5, gain: 0.15 },
  { name: "SCI-FI", oscType: "sawtooth", attack: 0.01, release: 0.5, filterFreq: 6000, filterQ: 8, detune: 50, gain: 0.2 },
];

// Keyboard mappings: 1-8 for white keys (C D E F G A B C), 
// ! @ # (shift+1,2,3) or specific keys for sharps
const NOTE_KEY_MAP: Record<string, number> = {
  '1': 0, '2': 2, '3': 4, '4': 5, '5': 7, '6': 9, '7': 11, // white: C D E F G A B
  '!': 1, '@': 3, '$': 6, '%': 8, '^': 10, // black: C# D# F# G# A# (shift + 1,2,4,5,6)
};

const NOTES = [
  { name: "C", freq: 261.63, black: false, key: "1" },
  { name: "C#", freq: 277.18, black: true, key: "!" },
  { name: "D", freq: 293.66, black: false, key: "2" },
  { name: "D#", freq: 311.13, black: true, key: "@" },
  { name: "E", freq: 329.63, black: false, key: "3" },
  { name: "F", freq: 349.23, black: false, key: "4" },
  { name: "F#", freq: 369.99, black: true, key: "$" },
  { name: "G", freq: 392.00, black: false, key: "5" },
  { name: "G#", freq: 415.30, black: true, key: "%" },
  { name: "A", freq: 440.00, black: false, key: "6" },
  { name: "A#", freq: 466.16, black: true, key: "^" },
  { name: "B", freq: 493.88, black: false, key: "7" },
];

interface Props {
  audioContext: AudioContext | null;
  destination: AudioNode | null;
  disabled: boolean;
}

const DJSynthesizer = ({ audioContext, destination, disabled }: Props) => {
  const [presetIdx, setPresetIdx] = useState(0);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [filterCutoff, setFilterCutoff] = useState(5000);
  const localCtxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (audioContext) return { ctx: audioContext, dest: destination || audioContext.destination };
    if (!localCtxRef.current) localCtxRef.current = new AudioContext();
    return { ctx: localCtxRef.current, dest: localCtxRef.current.destination };
  }, [audioContext, destination]);

  const playNote = useCallback((freq: number, noteName: string) => {
    if (disabled) return;
    const { ctx, dest } = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const preset = PRESETS[presetIdx];

    const osc = ctx.createOscillator();
    osc.type = preset.oscType;
    osc.frequency.value = freq;
    osc.detune.value = preset.detune;

    // Second osc for thickness
    const osc2 = ctx.createOscillator();
    osc2.type = preset.oscType;
    osc2.frequency.value = freq;
    osc2.detune.value = -preset.detune;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = filterCutoff;
    filter.Q.value = preset.filterQ;

    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(preset.gain, now + preset.attack);
    gain.gain.exponentialRampToValueAtTime(0.001, now + preset.attack + preset.release);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain).connect(dest);

    osc.start(now); osc.stop(now + preset.attack + preset.release + 0.05);
    osc2.start(now); osc2.stop(now + preset.attack + preset.release + 0.05);

    setActiveNote(noteName);
    setTimeout(() => setActiveNote(null), (preset.attack + preset.release) * 1000);
  }, [disabled, getCtx, presetIdx, filterCutoff]);

  const preset = PRESETS[presetIdx];
  const whiteKeys = NOTES.filter(n => !n.black);

  // Keyboard listener for piano
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const noteIdx = NOTE_KEY_MAP[e.key];
      if (noteIdx !== undefined) {
        e.preventDefault();
        const note = NOTES[noteIdx];
        if (note) playNote(note.freq, note.name);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [playNote]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-1">
        <Music className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-[8px] font-futuristic tracking-[0.3em] text-gray-500">SYNTHESIZER</span>
        <span className="text-[6px] font-mono text-gray-600 ml-auto">KEYS: 1-7 · SHIFT+1,2,4,5,6 = ♯</span>
      </div>

      {/* Preset selector */}
      <div className="flex gap-1 flex-wrap mb-1">
        {PRESETS.map((p, i) => (
          <button key={i} onClick={() => setPresetIdx(i)}
            className="px-2 py-1 rounded text-[7px] font-futuristic font-bold tracking-wider transition-all"
            style={{
              background: presetIdx === i ? 'linear-gradient(180deg, #f97316, #c2410c)' : '#1a1a1a',
              border: `1px solid ${presetIdx === i ? '#f97316' : '#333'}`,
              color: presetIdx === i ? '#fff' : '#666',
              boxShadow: presetIdx === i ? '0 0 8px rgba(249,115,22,0.3)' : 'none',
            }}>
            {p.name}
          </button>
        ))}
      </div>

      {/* Filter cutoff */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[7px] font-futuristic tracking-wider text-gray-600">FILTER</span>
        <input type="range" min={100} max={12000} value={filterCutoff}
          onChange={(e) => setFilterCutoff(Number(e.target.value))}
          className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(90deg, #f97316 0%, #f97316 ${((filterCutoff - 100) / 11900) * 100}%, #2a2a2a ${((filterCutoff - 100) / 11900) * 100}%, #2a2a2a 100%)`,
          }}
        />
        <span className="text-[8px] font-mono text-orange-400 tabular-nums w-12 text-right">{filterCutoff}Hz</span>
      </div>

      {/* Piano keyboard */}
      <div className="relative h-20 rounded-md overflow-hidden" style={{
        background: '#0a0a0a', border: '2px solid #2a2a2a',
      }}>
        {/* White keys */}
        <div className="absolute inset-0 flex">
          {whiteKeys.map((note) => {
            const isActive = activeNote === note.name;
            return (
              <button
                key={note.name}
                onPointerDown={() => playNote(note.freq, note.name)}
                disabled={disabled}
                className="flex-1 h-full flex flex-col items-center justify-end pb-1 gap-0.5 transition-all disabled:opacity-30 touch-none select-none"
                style={{
                  background: isActive
                    ? 'linear-gradient(180deg, #ddd 0%, #f97316 100%)'
                    : 'linear-gradient(180deg, #f5f5f5 0%, #ddd 100%)',
                  borderRight: '1px solid #bbb',
                  boxShadow: isActive ? 'inset 0 -3px 6px rgba(249,115,22,0.4)' : 'inset 0 -3px 6px rgba(0,0,0,0.1)',
                }}
              >
                <span className="text-[6px] font-futuristic" style={{ color: isActive ? '#fff' : '#999' }}>{note.name}</span>
                <span className="text-[7px] font-mono font-bold rounded px-0.5" style={{
                  background: isActive ? '#f97316' : '#ccc',
                  color: isActive ? '#fff' : '#666',
                }}>{note.key}</span>
              </button>
            );
          })}
        </div>
        {/* Black keys */}
        <div className="absolute top-0 left-0 right-0 flex pointer-events-none" style={{ height: '55%' }}>
          {NOTES.map((note, idx) => {
            if (!note.black) return <div key={idx} className="flex-1" style={{ flex: '1 1 0', maxWidth: `${100/7}%` }} />;
            const whiteIdx = NOTES.slice(0, idx).filter(n => !n.black).length;
            const isActive = activeNote === note.name;
            return (
              <button
                key={note.name}
                onPointerDown={(e) => { e.stopPropagation(); playNote(note.freq, note.name); }}
                disabled={disabled}
                className="absolute pointer-events-auto rounded-b-md z-10 flex flex-col items-center justify-end pb-0.5 gap-0.5 disabled:opacity-30 touch-none select-none"
                style={{
                  width: `${100/7 * 0.6}%`,
                  height: '100%',
                  left: `${(whiteIdx * 100/7) - (100/7 * 0.3)}%`,
                  background: isActive
                    ? 'linear-gradient(180deg, #333 0%, #f97316 100%)'
                    : 'linear-gradient(180deg, #333 0%, #111 100%)',
                  boxShadow: isActive ? '0 2px 8px rgba(249,115,22,0.4)' : '0 2px 4px rgba(0,0,0,0.5)',
                  border: '1px solid #444',
                }}
              >
                <span className="text-[5px] font-futuristic text-gray-500">{note.name}</span>
                <span className="text-[5px] font-mono text-gray-600">{note.key}</span>
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-[7px] font-futuristic tracking-wider text-gray-600 text-center">
        {preset.oscType.toUpperCase()} &bull; ATK {preset.attack}s &bull; REL {preset.release}s
      </p>
    </div>
  );
};

export default DJSynthesizer;
