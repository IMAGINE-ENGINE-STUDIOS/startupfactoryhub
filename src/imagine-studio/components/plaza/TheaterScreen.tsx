/**
 * Large theater screen on the Plaza's north lawn. Shows a live screen share
 * (VideoTexture), an image, or a PDF page (rendered to a CanvasTexture).
 */
import { useEffect, useMemo, useState } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export type TheaterSource =
  | { kind: 'video'; el: HTMLVideoElement; by: string }
  | { kind: 'image'; url: string; name: string; by: string }
  | { kind: 'pdf'; url: string; name: string; page: number; by: string }
  | null;

export const THEATER_POS: [number, number, number] = [0, 0, -36];
const W = 16, H = 9;

export function useSourceTexture(src: TheaterSource) {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const [pages, setPages] = useState(0);
  useEffect(() => {
    let dead = false; let t: THREE.Texture | null = null;
    if (!src) { setTex(null); return; }
    if (src.kind === 'video') {
      const v = src.el; const mk = () => { if (dead || t) return; t = new THREE.VideoTexture(v); t.colorSpace = THREE.SRGBColorSpace; setTex(t); };
      v.play().catch(() => {});
      if (v.readyState >= 2) mk(); else { v.addEventListener('loadeddata', mk, { once: true }); v.addEventListener('playing', mk, { once: true }); }
    } else if (src.kind === 'image') {
      new THREE.TextureLoader().load(src.url, (x) => { if (dead) return x.dispose(); x.colorSpace = THREE.SRGBColorSpace; t = x; setTex(x); });
    } else {
      (async () => {
        const doc = await pdfjs.getDocument(src.url).promise;
        if (dead) return; setPages(doc.numPages);
        const page = await doc.getPage(Math.min(Math.max(1, src.page), doc.numPages));
        const vp = page.getViewport({ scale: 2 });
        const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
        await page.render({ canvas: c, canvasContext: c.getContext('2d')!, viewport: vp } as any).promise;
        if (dead) return;
        t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; setTex(t);
      })().catch(() => setTex(null));
    }
    return () => { dead = true; t?.dispose(); };
  }, [src && src.kind, src && (src.kind === 'video' ? src.el : src.url), src && src.kind === 'pdf' ? src.page : 0]); // eslint-disable-line
  return { tex, pages };
}

export function TheaterScreen({ source, onPages }: { source: TheaterSource; onPages?: (n: number) => void }) {
  const { tex, pages } = useSourceTexture(source);
  useEffect(() => { onPages?.(pages); }, [pages]); // eslint-disable-line
  const idle = useMemo(() => {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 576;
    const g = c.getContext('2d')!; g.fillStyle = '#0d1117'; g.fillRect(0, 0, 1024, 576);
    g.fillStyle = '#e6edf3'; g.font = '600 54px sans-serif'; g.textAlign = 'center';
    g.fillText('Plaza Stage', 512, 270); g.font = '28px sans-serif'; g.fillStyle = '#8b949e';
    g.fillText('Ready for presentation', 512, 330);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, []);
  return (
    <group position={THEATER_POS}>
      {/* Pylons + frame */}
      {[-W / 2 - 0.4, W / 2 + 0.4].map((x) => (
        <mesh key={x} position={[x, 4.5, -0.1]} castShadow><boxGeometry args={[0.6, 9, 0.6]} /><meshStandardMaterial color="#2b2f36" /></mesh>
      ))}
      <mesh position={[0, 6, -0.15]} castShadow><boxGeometry args={[W + 0.6, H + 0.6, 0.2]} /><meshStandardMaterial color="#1a1d22" /></mesh>
      <mesh position={[0, 6, 0]}>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial map={tex || idle} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.25, 1.5]} receiveShadow><boxGeometry args={[W + 2, 0.5, 3]} /><meshStandardMaterial color="#5d5448" /></mesh>
      {source && (
        <Html position={[0, 1.2, 0.2]} center distanceFactor={18}>
          <div className="whitespace-nowrap rounded-full bg-background/85 px-3 py-1 text-xs">Presenting: {source.by}</div>
        </Html>
      )}
    </group>
  );
}
