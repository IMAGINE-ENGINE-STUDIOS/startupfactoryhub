/**
 * Color control for Brochure Studio: swatch that opens a color wheel
 * (hue/saturation circle, lightness, hex) plus brand swatches.
 * Wheel adapted from Flip Builder V3. Credits: Imagine Engine Studios Corp.
 */
import React, { useEffect, useRef, useState } from 'react';

const hexToHsl = (hex: string): [number, number, number] => {
  const m = hex.replace('#', '').match(/^([0-9a-f]{6})$/i);
  if (!m) return [0, 0, 50];
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s * 100, l * 100];
};
const hslToHex = (h: number, s: number, l: number) => {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
  return `#${[f(0), f(8), f(4)].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
};

const BRAND = ['#ffffff', '#e2e8f0', '#94a3b8', '#0b1220', '#22d3ee', '#0e7490', '#a855f7', '#7c3aed', '#c084fc', '#f472b6', '#fbbf24', '#4ade80'];
const SIZE = 168;

export function ColorField({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const [open, setOpen] = useState(false);
  const [hex, setHex] = useState(value);
  const wrap = useRef<HTMLDivElement>(null);
  const wheel = useRef<HTMLDivElement>(null);
  useEffect(() => setHex(value), [value]);
  useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', off);
    return () => document.removeEventListener('mousedown', off);
  }, [open]);

  const [h, s, l] = hexToHsl(value);
  const pick = (e: React.PointerEvent) => {
    const r = wheel.current!.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
    const hue = ((Math.atan2(x, -y) * 180) / Math.PI + 360) % 360;
    onChange(hslToHex(hue, Math.min(100, (Math.hypot(x, y) / (r.width / 2)) * 100), l || 50));
  };
  const rad = ((h - 90) * Math.PI) / 180, dist = (s / 100) * (SIZE / 2);

  return (
    <div ref={wrap} className="relative">
      <button type="button" aria-label="Choose color" onClick={() => setOpen((o) => !o)}
        className="h-8 w-12 rounded-md" style={{ background: value, border: '1px solid rgba(255,255,255,0.25)', boxShadow: '0 0 0 2px rgba(168,85,247,0.25)' }} />
      {open && (
        <div className="absolute bottom-10 left-0 z-[90] w-[200px] rounded-xl p-3 flex flex-col items-center gap-2.5"
          style={{ background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(168,85,247,0.45)' }}>
          <div ref={wheel} role="slider" aria-label="Color wheel" aria-valuenow={Math.round(h)}
            onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); pick(e); }}
            onPointerMove={(e) => e.buttons === 1 && pick(e)}
            className="relative cursor-crosshair rounded-full touch-none"
            style={{ width: SIZE, height: SIZE, background: `radial-gradient(circle, hsl(0 0% ${l}%) 0%, transparent 70%), conic-gradient(from 0deg, hsl(0 100% ${l}%), hsl(60 100% ${l}%), hsl(120 100% ${l}%), hsl(180 100% ${l}%), hsl(240 100% ${l}%), hsl(300 100% ${l}%), hsl(360 100% ${l}%))` }}>
            <span className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
              style={{ left: SIZE / 2 + Math.cos(rad) * dist, top: SIZE / 2 + Math.sin(rad) * dist, background: value, borderColor: l > 60 ? '#0b1220' : '#fff' }} />
          </div>
          <input type="range" min={0} max={100} value={Math.round(l)} aria-label="Lightness" className="w-full"
            onChange={(e) => onChange(hslToHex(h, s, Number(e.target.value)))} style={{ accentColor: '#a855f7' }} />
          <div className="grid grid-cols-6 gap-1.5">
            {BRAND.map((c) => <button key={c} type="button" aria-label={c} onClick={() => onChange(c)} className="h-5 w-5 rounded-full" style={{ background: c, border: '1px solid rgba(255,255,255,0.3)' }} />)}
          </div>
          <input value={hex} aria-label="Hex color" className="w-full rounded-md px-2 py-1 font-mono text-[12px]"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.15)' }}
            onChange={(e) => { setHex(e.target.value); if (/^#[0-9a-f]{6}$/i.test(e.target.value)) onChange(e.target.value.toLowerCase()); }} />
        </div>
      )}
    </div>
  );
}
