/**
 * Full-viewport view of whatever is on a theater screen (screen share, image or
 * PDF page). Works from anywhere (plaza page, studio scene) because it mounts
 * its own DOM root: call openTheaterFullscreen(source).
 */
import { useEffect, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import * as pdfjs from 'pdfjs-dist';
import type { TheaterSource } from './TheaterScreen';

let root: Root | null = null;
let host: HTMLDivElement | null = null;

export function closeTheaterFullscreen() {
  root?.unmount(); root = null; host?.remove(); host = null;
}

export function openTheaterFullscreen(src: TheaterSource, onPage?: (dir: number) => void) {
  if (!src) return;
  if (!host) { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); }
  root!.render(<TheaterFullscreen src={src} onPage={onPage} onClose={closeTheaterFullscreen} />);
}

function TheaterFullscreen({ src, onPage, onClose }: { src: NonNullable<TheaterSource>; onPage?: (d: number) => void; onClose: () => void }) {
  const vid = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [page, setPage] = useState(src.kind === 'pdf' ? src.page : 1);
  const [pages, setPages] = useState(0);

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  useEffect(() => {
    if (src.kind !== 'video' || !vid.current) return;
    vid.current.srcObject = src.el.srcObject;
    if (!src.el.srcObject && src.el.src) vid.current.src = src.el.src;
    vid.current.play().catch(() => {});
  }, [src]);

  useEffect(() => {
    if (src.kind !== 'pdf') return;
    let dead = false;
    (async () => {
      const doc = await pdfjs.getDocument(src.url).promise; if (dead) return;
      setPages(doc.numPages);
      const p = await doc.getPage(Math.min(Math.max(1, page), doc.numPages));
      const vp = p.getViewport({ scale: 2.5 }); const c = canvas.current; if (!c || dead) return;
      c.width = vp.width; c.height = vp.height;
      await p.render({ canvas: c, canvasContext: c.getContext('2d')!, viewport: vp } as any).promise;
    })().catch(() => {});
    return () => { dead = true; };
  }, [src, page]);

  const turn = (d: number) => { setPage((p) => Math.min(Math.max(1, p + d), pages || 1)); onPage?.(d); };

  return (
    <div className="fixed inset-0 z-[2000] bg-background flex items-center justify-center">
      {src.kind === 'video' && <video ref={vid} muted playsInline autoPlay className="w-full h-full object-contain" />}
      {src.kind === 'image' && <img src={src.url} alt={src.name} className="w-full h-full object-contain" />}
      {src.kind === 'pdf' && <canvas ref={canvas} className="max-w-full max-h-full object-contain" />}
      <button onClick={onClose} aria-label="Close full screen" className="absolute top-4 right-4 w-11 h-11 rounded-full bg-background/90 border border-border flex items-center justify-center">
        <X className="w-5 h-5" />
      </button>
      <div className="absolute top-4 left-4 rounded-full bg-background/90 border border-border px-3 py-1.5 text-xs">Presenting: {src.by}</div>
      {src.kind === 'pdf' && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3 rounded-full bg-background/90 border border-border px-3 py-1.5 text-sm">
          <button onClick={() => turn(-1)} aria-label="Previous page"><ChevronLeft className="w-5 h-5" /></button>
          <span>{page} / {pages || '?'}</span>
          <button onClick={() => turn(1)} aria-label="Next page"><ChevronRight className="w-5 h-5" /></button>
        </div>
      )}
    </div>
  );
}
