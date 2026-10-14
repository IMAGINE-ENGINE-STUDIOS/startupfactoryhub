/**
 * Animated page backgrounds: growth tree (3D), tech lab, HUD grid, stars, particles.
 * Credits: Imagine Engine Studios Corp.
 */
import React, { useEffect, useRef, useState } from 'react';
import GrowthTree3D from '@/components/brochure/GrowthTree3D';
import type { PageBg } from './types';

function TreeBg() {
  const [stage, setStage] = useState(0);
  useEffect(() => { const t = setInterval(() => setStage((s) => (s + 1) % 4), 3200); return () => clearInterval(t); }, []);
  return <GrowthTree3D stage={stage} accent="#a855f7" accent2="#22d3ee" className="w-full h-full" />;
}

function CanvasBg({ kind }: { kind: PageBg['kind'] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const g = c.getContext('2d')!;
    let raf = 0; let t = 0;
    const fit = () => { c.width = c.clientWidth; c.height = c.clientHeight; };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(c);
    const pts = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), vx: (Math.random() - 0.5) * 0.0015, vy: (Math.random() - 0.5) * 0.0015, z: Math.random() }));
    const draw = () => {
      const W = c.width, H = c.height; t += 0.016;
      g.clearRect(0, 0, W, H);
      if (kind === 'lab') {
        // hex lattice + scanning beam + molecule links
        g.strokeStyle = 'rgba(34,211,238,0.18)'; g.lineWidth = 1;
        const r = 22, h = r * Math.sqrt(3);
        for (let y = 0; y < H + h; y += h) for (let x = 0; x < W + r * 3; x += r * 3) {
          for (const ox of [0, r * 1.5]) {
            const cx = x + ox, cy = y + (ox ? h / 2 : 0);
            g.beginPath();
            for (let k = 0; k < 6; k++) { const a = (Math.PI / 3) * k; g.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a)); }
            g.closePath(); g.stroke();
          }
        }
        const by = ((t * 0.18) % 1) * H;
        const grad = g.createLinearGradient(0, by - 60, 0, by + 6);
        grad.addColorStop(0, 'rgba(168,85,247,0)'); grad.addColorStop(1, 'rgba(168,85,247,0.45)');
        g.fillStyle = grad; g.fillRect(0, by - 60, W, 66);
      }
      if (kind === 'grid') {
        g.strokeStyle = 'rgba(168,85,247,0.35)'; g.lineWidth = 1;
        const hz = H * 0.45;
        for (let i = -20; i <= 20; i++) { g.beginPath(); g.moveTo(W / 2 + i * 8, hz); g.lineTo(W / 2 + i * W * 0.12, H); g.stroke(); }
        for (let i = 0; i < 18; i++) {
          const p = ((i + (t * 0.6) % 1) / 18); const y = hz + (H - hz) * p * p;
          g.globalAlpha = p; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
        }
        g.globalAlpha = 1;
      }
      if (kind === 'stars') {
        for (const p of pts) {
          p.z -= 0.004; if (p.z <= 0.02) { p.z = 1; p.x = Math.random(); p.y = Math.random(); }
          const sx = W / 2 + ((p.x - 0.5) * W) / p.z, sy = H / 2 + ((p.y - 0.5) * H) / p.z;
          g.fillStyle = `rgba(226,232,240,${1 - p.z})`; g.fillRect(sx, sy, 2 / p.z * 0.6, 2 / p.z * 0.6);
        }
      }
      if (kind === 'particles' || kind === 'lab') {
        for (const p of pts) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > 1) p.vx *= -1; if (p.y < 0 || p.y > 1) p.vy *= -1;
        }
        for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
          const dx = (pts[i].x - pts[j].x) * W, dy = (pts[i].y - pts[j].y) * H, d = Math.hypot(dx, dy);
          if (d < 90) { g.strokeStyle = `rgba(34,211,238,${(1 - d / 90) * 0.5})`; g.beginPath(); g.moveTo(pts[i].x * W, pts[i].y * H); g.lineTo(pts[j].x * W, pts[j].y * H); g.stroke(); }
        }
        for (const p of pts) { g.fillStyle = 'rgba(168,85,247,0.9)'; g.beginPath(); g.arc(p.x * W, p.y * H, 2.2, 0, 7); g.fill(); }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [kind]);
  return <canvas ref={ref} className="w-full h-full block" />;
}

export function PageBackground({ bg }: { bg: PageBg }) {
  if (!bg || bg.kind === 'none') return null;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: bg.opacity, mixBlendMode: bg.blend, pointerEvents: 'none' }}>
      {bg.kind === 'tree' ? <TreeBg /> : <CanvasBg kind={bg.kind} />}
    </div>
  );
}

export const BG_OPTIONS: { kind: PageBg['kind']; label: string }[] = [
  { kind: 'none', label: 'None' },
  { kind: 'tree', label: 'Growth tree' },
  { kind: 'lab', label: 'Tech lab' },
  { kind: 'grid', label: 'HUD grid' },
  { kind: 'stars', label: 'Deep space' },
  { kind: 'particles', label: 'Network' },
];
