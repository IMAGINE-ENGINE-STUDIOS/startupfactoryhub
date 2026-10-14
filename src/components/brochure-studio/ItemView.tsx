/**
 * Renders one added Studio item (picture, text, icon, 3D/AR model, card shape).
 * Credits: Imagine Engine Studios Corp.
 */
import React, { useEffect } from 'react';
import { Box } from 'lucide-react';
import { ICONS } from './icons';
import { animCss } from './dom';
import type { Item } from './types';

const METAL: React.CSSProperties = {
  backgroundImage: 'linear-gradient(180deg,#ffffff 0%,#e2e8f0 35%,#94a3b8 55%,#f8fafc 70%,#cbd5e1 100%)',
  WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
};

let mvLoaded = false;
const loadModelViewer = () => { if (!mvLoaded) { mvLoaded = true; import('@google/model-viewer').catch(() => { mvLoaded = false; }); } };

export function ItemView({ it, editing, selected }: { it: Item; editing: boolean; selected: boolean }) {
  useEffect(() => { if (it.type === 'model') loadModelViewer(); }, [it.type]);
  const wrap: React.CSSProperties = {
    position: 'absolute', left: `${it.x}%`, top: `${it.y}%`, width: `${it.w}%`,
    transform: it.rot ? `rotate(${it.rot}deg)` : undefined, opacity: it.opacity ?? 1, zIndex: it.z ?? 1,
    animation: animCss(it.anim), pointerEvents: editing || it.type === 'model' || it.type === 'page' ? 'auto' : 'none',
    cursor: editing ? 'move' : undefined, outline: selected ? '2px solid #a855f7' : undefined, outlineOffset: 2,
  };
  let body: React.ReactNode = null;
  if (it.type === 'image') body = <img src={it.src} alt="" draggable={false} style={{ width: '100%', display: 'block', borderRadius: it.radius ?? 10 }} />;
  if (it.type === 'text') body = (
    <div style={{ fontSize: it.size || 22, fontWeight: it.weight || 700, color: it.color || '#f1f5f9', lineHeight: 1.2, whiteSpace: 'pre-wrap', ...(it.metal ? METAL : {}) }}
      className={it.metal ? 'font-futuristic' : undefined}>{it.text || 'Your text'}</div>
  );
  if (it.type === 'icon') {
    const I = ICONS[it.icon || 'Rocket'] || ICONS.Rocket;
    body = (
      <div style={{ aspectRatio: '1', display: 'grid', placeItems: 'center', borderRadius: it.radius ?? 16, background: it.bg || 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.5)', boxShadow: '0 0 24px rgba(168,85,247,0.35)' }}>
        <I style={{ width: '58%', height: '58%', color: it.color || '#e9d5ff' }} />
      </div>
    );
  }
  if (it.type === 'shape') body = (
    <div style={{ aspectRatio: '1.6', borderRadius: it.radius ?? 18, background: it.bg || 'linear-gradient(135deg,rgba(124,58,237,0.35),rgba(14,116,144,0.35))', border: '1px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(10px)' }} />
  );
  if (it.type === 'page') body = (
    <iframe title="Page template" src={it.src} style={{ width: '100%', aspectRatio: '1 / 1.414', border: 0, display: 'block', pointerEvents: editing ? 'none' : 'auto' }} />
  );
  if (it.type === 'model') body = it.src
    ? React.createElement('model-viewer', {
        src: it.src, 'camera-controls': true, 'auto-rotate': it.autoRotate === false ? undefined : true,
        ar: it.ar ? true : undefined, 'ar-modes': 'webxr scene-viewer quick-look', 'shadow-intensity': '1',
        exposure: '1.1', style: { width: '100%', aspectRatio: '1', background: 'transparent', pointerEvents: editing ? 'none' : 'auto' },
      })
    : (
      <div style={{ aspectRatio: '1', display: 'grid', placeItems: 'center', borderRadius: 16, border: '1px dashed rgba(168,85,247,0.7)', color: '#c4b5fd', fontSize: 12, textAlign: 'center', padding: 8 }}>
        <div><Box className="h-8 w-8 mx-auto mb-1" />Upload a 3D model (.glb) from the panel</div>
      </div>
    );
  return (
    <div data-bs-item={it.id} data-bs-hover={it.hover || undefined} style={wrap}>
      {body}
      {editing && selected && (
        <div data-bs-handle={it.id} style={{ position: 'absolute', right: -7, bottom: -7, width: 14, height: 14, borderRadius: 4, background: '#a855f7', border: '2px solid #fff', cursor: 'nwse-resize' }} />
      )}
    </div>
  );
}
