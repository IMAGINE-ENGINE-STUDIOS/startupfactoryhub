import { useRef, useState, useCallback, useEffect } from "react";
import { Music, Circle, RotateCcw, ChevronUp, ChevronDown } from "lucide-react";

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

const NOTE_KEY_MAP: Record<string, number> = {
  '1': 0, '2': 2, '3': 4, '4': 5, '5': 7, '6': 9, '7': 11,
  '!': 1, '@': 3, '$': 6, '%': 8, '^': 10,
};

const BASE_NOTES = [
  { name: "C", semitone: 0, black: false, key: "1" },
  { name: "C#", semitone: 1, black: true, key: "!" },
  { name: "D", semitone: 2, black: false, key: "2" },
  { name: "D#", semitone: 3, black: true, key: "@" },
  { name: "E", semitone: 4, black: false, key: "3" },
  { name: "F", semitone: 5, black: false, key: "4" },
  { name: "F#", semitone: 6, black: true, key: "$" },
  { name: "G", semitone: 7, black: false, key: "5" },
  { name: "G#", semitone: 8, black: true, key: "%" },
  { name: "A", semitone: 9, black: false, key: "6" },
  { name: "A#", semitone: 10, black: true, key: "^" },
  { name: "B", semitone: 11, black: false, key: "7" },
];

const getFreq = (semitone: number, octave: number) => 440 * Math.pow(2, (semitone - 9 + (octave - 4) * 12) / 12);

interface RecEvent { semitone: number; timeOffset: number; }

interface Props {
  audioContext: AudioContext | null;
  destination: AudioNode | null;
  disabled: boolean;
}

const DJSynthesizer = ({ audioContext, destination, disabled }: Props) => {
  const [presetIdx, setPresetIdx] = useState(0);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [filterCutoff, setFilterCutoff] = useState(5000);
  const [octave, setOctave] = useState(4);
  const [pitchBend, setPitchBend] = useState(0); // -100 to 100 cents
  const [isRecording, setIsRecording] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [recEvents, setRecEvents] = useState<RecEvent[]>([]);
  const [recTime, setRecTime] = useState(0);
  const [sustain, setSustain] = useState(false);

  const localCtxRef = useRef<AudioContext | null>(null);
  const recStartRef = useRef(0);
  const recEventsRef = useRef<RecEvent[]>([]);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loopTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getCtx = useCallback(() => {
    if (audioContext) return { ctx: audioContext, dest: destination || audioContext.destination };
    if (!localCtxRef.current) localCtxRef.current = new AudioContext();
    return { ctx: localCtxRef.current, dest: localCtxRef.current.destination };
  }, [audioContext, destination]);

  const playNote = useCallback((semitone: number, noteName: string) => {
    if (disabled) return;
    const { ctx, dest } = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const preset = PRESETS[presetIdx];
    const freq = getFreq(semitone, octave) * Math.pow(2, pitchBend / 1200);
    const releaseTime = sustain ? preset.release * 3 : preset.release;

    const osc = ctx.createOscillator();
    osc.type = preset.oscType;
    osc.frequency.value = freq;
    osc.detune.value = preset.detune;

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
    gain.gain.exponentialRampToValueAtTime(0.001, now + preset.attack + releaseTime);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain).connect(dest);

    osc.start(now); osc.stop(now + preset.attack + releaseTime + 0.05);
    osc2.start(now); osc2.stop(now + preset.attack + releaseTime + 0.05);

    setActiveNote(noteName);
    setTimeout(() => setActiveNote(null), (preset.attack + releaseTime) * 1000);

    if (recStartRef.current > 0) {
      recEventsRef.current.push({ semitone, timeOffset: Date.now() - recStartRef.current });
    }
  }, [disabled, getCtx, presetIdx, filterCutoff, octave, pitchBend, sustain]);

  const startRec = useCallback(() => {
    recEventsRef.current = [];
    recStartRef.current = Date.now();
    setIsRecording(true);
    setRecTime(0);
    recTimerRef.current = setInterval(() => setRecTime(p => p + 1), 1000);
  }, []);

  const stopRec = useCallback(() => {
    setIsRecording(false);
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    setRecEvents([...recEventsRef.current]);
    recStartRef.current = 0;
  }, []);

  const startLoop = useCallback(() => {
    if (recEvents.length === 0) return;
    setIsLooping(true);
    const loopLen = recTime * 1000 || 4000;
    const playOnce = () => {
      recEvents.forEach(ev => {
        setTimeout(() => {
          const { ctx, dest } = getCtx();
          if (ctx.state === 'suspended') ctx.resume();
          const preset = PRESETS[presetIdx];
          const freq = getFreq(ev.semitone, octave);
          const osc = ctx.createOscillator(); osc.type = preset.oscType; osc.frequency.value = freq;
          const g = ctx.createGain(); g.gain.setValueAtTime(preset.gain, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + preset.release);
          osc.connect(g).connect(dest); osc.start(); osc.stop(ctx.currentTime + preset.release + 0.05);
        }, ev.timeOffset % loopLen);
      });
    };
    playOnce();
    loopTimerRef.current = setInterval(playOnce, loopLen);
  }, [recEvents, recTime, getCtx, presetIdx, octave]);

  const stopLoop = useCallback(() => {
    setIsLooping(false);
    if (loopTimerRef.current) clearInterval(loopTimerRef.current);
  }, []);

  const preset = PRESETS[presetIdx];
  const whiteKeys = BASE_NOTES.filter(n => !n.black);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const noteIdx = NOTE_KEY_MAP[e.key];
      if (noteIdx !== undefined) {
        e.preventDefault();
        const note = BASE_NOTES[noteIdx];
        if (note) playNote(note.semitone, note.name);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [playNote]);

  useEffect(() => {
    return () => {
      if (recTimerRef.current) clearInterval(recTimerRef.current);
      if (loopTimerRef.current) clearInterval(loopTimerRef.current);
    };
  }, []);

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

      {/* Controls row: Octave, Pitch Bend, Sustain, REC, Loop */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Octave */}
        <div className="flex items-center gap-0.5">
          <button onClick={() => setOctave(Math.max(1, octave - 1))}
            className="w-5 h-5 rounded flex items-center justify-center"
            style={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <ChevronDown className="w-3 h-3 text-gray-500" />
          </button>
          <span className="text-[8px] font-mono text-orange-400 w-8 text-center">OCT {octave}</span>
          <button onClick={() => setOctave(Math.min(8, octave + 1))}
            className="w-5 h-5 rounded flex items-center justify-center"
            style={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <ChevronUp className="w-3 h-3 text-gray-500" />
          </button>
        </div>

        {/* Pitch bend */}
        <div className="flex items-center gap-1">
          <span className="text-[7px] font-futuristic text-gray-600">BEND</span>
          <input type="range" min={-100} max={100} value={pitchBend}
            onChange={e => setPitchBend(Number(e.target.value))}
            onMouseUp={() => setPitchBend(0)} onTouchEnd={() => setPitchBend(0)}
            className="w-14 h-1 rounded-full appearance-none cursor-pointer"
            style={{ background: '#2a2a2a' }}
          />
          <span className="text-[7px] font-mono text-gray-500 w-6">{pitchBend > 0 ? '+' : ''}{pitchBend}</span>
        </div>

        {/* Sustain */}
        <button onClick={() => setSustain(!sustain)}
          className="px-2 py-0.5 rounded text-[7px] font-futuristic font-bold tracking-wider"
          style={{
            background: sustain ? 'rgba(249,115,22,0.2)' : '#1a1a1a',
            border: `1px solid ${sustain ? '#f97316' : '#333'}`,
            color: sustain ? '#f97316' : '#666',
          }}>
          HOLD
        </button>

        {/* REC */}
        <button onClick={isRecording ? stopRec : startRec}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[7px] font-futuristic font-bold tracking-wider"
          style={{
            background: isRecording ? 'rgba(220,38,38,0.2)' : '#1a1a1a',
            border: `1px solid ${isRecording ? '#ef4444' : '#333'}`,
            color: isRecording ? '#ef4444' : '#666',
          }}>
          <Circle className="w-2 h-2" style={{ fill: isRecording ? '#ef4444' : 'none', color: isRecording ? '#ef4444' : '#666' }} />
          {isRecording ? `${recTime}s` : 'REC'}
        </button>

        {/* Loop */}
        <button onClick={isLooping ? stopLoop : startLoop} disabled={recEvents.length === 0}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[7px] font-futuristic font-bold tracking-wider disabled:opacity-30"
          style={{
            background: isLooping ? 'rgba(34,197,94,0.2)' : '#1a1a1a',
            border: `1px solid ${isLooping ? '#22c55e' : '#333'}`,
            color: isLooping ? '#22c55e' : '#666',
          }}>
          <RotateCcw className="w-2 h-2" />
          {isLooping ? 'STOP' : 'LOOP'}
        </button>
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
        <div className="absolute inset-0 flex">
          {whiteKeys.map((note) => {
            const isActive = activeNote === note.name;
            return (
              <button
                key={note.name}
                onPointerDown={() => playNote(note.semitone, note.name)}
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
        <div className="absolute top-0 left-0 right-0 flex pointer-events-none" style={{ height: '55%' }}>
          {BASE_NOTES.map((note, idx) => {
            if (!note.black) return <div key={idx} className="flex-1" style={{ flex: '1 1 0', maxWidth: `${100/7}%` }} />;
            const whiteIdx = BASE_NOTES.slice(0, idx).filter(n => !n.black).length;
            const isActive = activeNote === note.name;
            return (
              <button
                key={note.name}
                onPointerDown={(e) => { e.stopPropagation(); playNote(note.semitone, note.name); }}
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
        {preset.oscType.toUpperCase()} &bull; OCT {octave} &bull; ATK {preset.attack}s &bull; REL {preset.release}s
      </p>
    </div>
  );
};

export default DJSynthesizer;
