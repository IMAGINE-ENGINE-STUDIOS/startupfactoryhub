/**
 * 3D model with "View in your room" for Brochure Studio.
 * Phones (Android Scene Viewer / WebXR, iPhone Quick Look) place the uploaded
 * model in the room; on computers the button shows a QR code to open it on a phone.
 * Credits: Imagine Engine Studios Corp.
 */
import React, { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ScanLine, X } from 'lucide-react';

let mvLoaded = false;
const loadModelViewer = () => { if (!mvLoaded) { mvLoaded = true; import('@google/model-viewer').catch(() => { mvLoaded = false; }); } };

type MV = HTMLElement & { canActivateAR?: boolean; activateAR?: () => void };

export function ModelAR({ src, iosSrc, ar, autoRotate, editing }: { src: string; iosSrc?: string; ar?: boolean; autoRotate?: boolean; editing: boolean }) {
  const ref = useRef<MV>(null);
  const [qr, setQr] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(loadModelViewer, []);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const err = () => setFailed(true);
    el.addEventListener('error', err);
    return () => el.removeEventListener('error', err);
  }, [src]);

  const openAR = (e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault();
    const el = ref.current;
    if (el?.canActivateAR && el.activateAR) el.activateAR();
    else setQr(true);
  };
  // Keep the flipbook from turning while the model is spun.
  const stop = (e: React.SyntheticEvent) => { if (!editing) e.stopPropagation(); };

  return (
    <div style={{ position: 'relative' }} onPointerDown={stop} onMouseDown={stop} onTouchStart={stop}>
      {React.createElement('model-viewer', {
        ref, src, 'ios-src': iosSrc || undefined, 'camera-controls': true, 'touch-action': 'pan-y',
        'auto-rotate': autoRotate === false ? undefined : true, ar: ar ? true : undefined,
        'ar-modes': 'webxr scene-viewer quick-look', 'ar-placement': 'floor', 'shadow-intensity': '1', exposure: '1.1',
        style: { width: '100%', aspectRatio: '1', background: 'transparent', pointerEvents: editing ? 'none' : 'auto' },
      },
        React.createElement('span', { slot: 'ar-button', style: { display: 'none' } }),
      )}
      {failed && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#fca5a5', fontSize: 12, textAlign: 'center' }}>This 3D model could not be opened. Upload a .glb file.</div>}
      {ar && !editing && (
        <button type="button" onClick={openAR} aria-label="View in your room"
          style={{ position: 'absolute', left: '50%', bottom: 6, transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
            padding: '7px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700, color: '#fff', pointerEvents: 'auto',
            background: 'linear-gradient(135deg,#7c3aed,#0e7490)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 0 18px rgba(168,85,247,0.55)' }}>
          <ScanLine style={{ width: 15, height: 15 }} />View in your room
        </button>
      )}
      {qr && (
        <div data-bs-ui onClick={(e) => { e.stopPropagation(); setQr(false); }}
          style={{ position: 'fixed', inset: 0, zIndex: 2147483000, display: 'grid', placeItems: 'center', background: 'rgba(2,6,23,0.7)' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: 280, padding: 20, borderRadius: 16, textAlign: 'center', color: '#e2e8f0',
            background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(168,85,247,0.45)' }}>
            <button aria-label="Close" onClick={() => setQr(false)} style={{ position: 'absolute', right: 10, top: 10 }}><X style={{ width: 16, height: 16 }} /></button>
            <div style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.2em', color: '#c4b5fd', marginBottom: 10 }}>VIEW IN YOUR ROOM</div>
            <div style={{ background: '#fff', padding: 10, borderRadius: 10, display: 'inline-block' }}><QRCodeSVG value={window.location.href} size={180} /></div>
            <p style={{ fontSize: 13, marginTop: 12, lineHeight: 1.4 }}>Scan with your phone, then tap "View in your room" to place the model on your floor.</p>
          </div>
        </div>
      )}
    </div>
  );
}
