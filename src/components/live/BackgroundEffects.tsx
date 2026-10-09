import { useEffect, useRef, useState } from 'react';
import { useLocalParticipant } from '@livekit/components-react';
import { LocalVideoTrack, Track } from 'livekit-client';
import { BackgroundProcessor, supportsBackgroundProcessors, type BackgroundProcessorWrapper } from '@livekit/track-processors';
import { Ban, Droplets, ImagePlus, Trash2 } from 'lucide-react';
import office from '@/assets/live-bg/office.jpg';
import loft from '@/assets/live-bg/loft.jpg';
import tech from '@/assets/live-bg/tech.jpg';
import library from '@/assets/live-bg/library.jpg';

export type BgChoice = { kind: 'none' } | { kind: 'blur'; radius: number } | { kind: 'image'; src: string };

const SAMPLES = [
  { name: 'Office', src: office },
  { name: 'Loft', src: loft },
  { name: 'Tech studio', src: tech },
  { name: 'Library', src: library },
];
const CUSTOM_KEY = 'sfh-live-bg-custom';
const CHOICE_KEY = 'sfh-live-bg-choice';

const readCustom = (): string[] => { try { return JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]'); } catch { return []; } };
export const readBgChoice = (): BgChoice => { try { return JSON.parse(localStorage.getItem(CHOICE_KEY) || '') || { kind: 'none' }; } catch { return { kind: 'none' }; } };

// Shrinks an uploaded photo to 1280px wide so it stays light to process.
const toBackground = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => {
    const s = Math.min(1, 1280 / img.width);
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(img.src);
    resolve(c.toDataURL('image/jpeg', 0.82));
  };
  img.onerror = reject;
  img.src = URL.createObjectURL(file);
});

const same = (a: BgChoice, b: BgChoice) => JSON.stringify(a) === JSON.stringify(b);

// Applies the chosen background to this person's camera, so everyone in the call sees it.
export function BackgroundApplier({ choice, cam }: { choice: BgChoice; cam: boolean }) {
  const { localParticipant } = useLocalParticipant();
  const procRef = useRef<BackgroundProcessorWrapper | null>(null);
  const trackRef = useRef<LocalVideoTrack | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      const track = localParticipant.getTrackPublication(Track.Source.Camera)?.track as LocalVideoTrack | undefined;
      if ((track || null) !== trackRef.current) setTick((n) => n + 1);
    }, 800);
    return () => clearInterval(t);
  }, [localParticipant]);

  useEffect(() => {
    const track = localParticipant.getTrackPublication(Track.Source.Camera)?.track as LocalVideoTrack | undefined;
    if (!track || !cam || !supportsBackgroundProcessors()) { trackRef.current = track || null; return; }
    (async () => {
      try {
        if (trackRef.current !== track) { procRef.current = null; trackRef.current = track; }
        if (choice.kind === 'none') {
          if (procRef.current) { await track.stopProcessor(); procRef.current = null; }
          return;
        }
        const opts = choice.kind === 'blur'
          ? { mode: 'background-blur' as const, blurRadius: choice.radius }
          : { mode: 'virtual-background' as const, imagePath: choice.src };
        if (procRef.current) await procRef.current.switchTo(opts);
        else { const p = BackgroundProcessor(opts); procRef.current = p; await track.setProcessor(p); }
      } catch (e) { console.warn('Background effect failed', e); }
    })();
  }, [choice, cam, tick, localParticipant]);
  return null;
}

export function BackgroundPicker({ choice, onChoose, onClose }: { choice: BgChoice; onChoose: (c: BgChoice) => void; onClose: () => void }) {
  const [custom, setCustom] = useState<string[]>(readCustom);
  const fileRef = useRef<HTMLInputElement>(null);
  const supported = supportsBackgroundProcessors();
  const pick = (c: BgChoice) => { onChoose(c); try { localStorage.setItem(CHOICE_KEY, JSON.stringify(c)); } catch { /* storage full */ } };

  const upload = async (f?: File) => {
    if (!f || !f.type.startsWith('image/')) return;
    const src = await toBackground(f);
    const next = [src, ...custom].slice(0, 6);
    setCustom(next);
    try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(next)); } catch { /* storage full */ }
    pick({ kind: 'image', src });
  };
  const remove = (src: string) => {
    const next = custom.filter((s) => s !== src);
    setCustom(next);
    try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    if (choice.kind === 'image' && choice.src === src) pick({ kind: 'none' });
  };

  const ring = (c: BgChoice) => same(choice, c) ? 'ring-2 ring-white' : 'ring-1 ring-white/10 hover:ring-white/40';
  const tile = 'relative aspect-video rounded-xl overflow-hidden flex items-center justify-center text-[11px] text-zinc-200 bg-zinc-800';

  return (
    <div className="absolute bottom-14 z-30 w-[380px] rounded-2xl bg-zinc-900 border border-white/10 p-4 shadow-2xl">
      <div className="flex items-center justify-between mb-3">
        <p className="font-mono text-[11px] tracking-[0.2em] text-zinc-400">BACKGROUND</p>
        <button onClick={onClose} className="text-xs text-zinc-400 hover:text-white">Done</button>
      </div>
      {!supported && <p className="text-xs text-amber-400 mb-3">This browser can't change backgrounds. Try Chrome or Edge on a computer.</p>}
      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => pick({ kind: 'none' })} className={`${tile} ${ring({ kind: 'none' })} flex-col gap-1`}><Ban className="w-4 h-4" />None</button>
        <button onClick={() => pick({ kind: 'blur', radius: 6 })} className={`${tile} ${ring({ kind: 'blur', radius: 6 })} flex-col gap-1`}><Droplets className="w-4 h-4" />Light blur</button>
        <button onClick={() => pick({ kind: 'blur', radius: 18 })} className={`${tile} ${ring({ kind: 'blur', radius: 18 })} flex-col gap-1`}><Droplets className="w-5 h-5" />Strong blur</button>
        {SAMPLES.map((s) => (
          <button key={s.name} title={s.name} onClick={() => pick({ kind: 'image', src: s.src })} className={`${tile} ${ring({ kind: 'image', src: s.src })}`}>
            <img src={s.src} alt={s.name} loading="lazy" width={1280} height={720} className="absolute inset-0 w-full h-full object-cover" />
          </button>
        ))}
        {custom.map((src) => (
          <div key={src.slice(-40)} className={`${tile} ${ring({ kind: 'image', src })} group`}>
            <button onClick={() => pick({ kind: 'image', src })} className="absolute inset-0"><img src={src} alt="Your background" className="w-full h-full object-cover" /></button>
            <button aria-label="Remove background" onClick={() => remove(src)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
          </div>
        ))}
        <button onClick={() => fileRef.current?.click()} className={`${tile} ring-1 ring-dashed ring-white/20 hover:ring-white/50 flex-col gap-1`}><ImagePlus className="w-4 h-4" />Upload</button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
      <p className="mt-3 text-[11px] text-zinc-500">Everyone in the call sees your background. Turn your camera on to see it.</p>
    </div>
  );
}
