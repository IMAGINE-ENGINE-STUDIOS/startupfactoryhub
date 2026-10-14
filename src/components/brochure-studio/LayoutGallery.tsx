/**
 * Layout gallery: drag a page template onto any page (or click to use it).
 * In Studio-made brochures a layout can also be added as a new page.
 * Credits: Imagine Engine Studios Corp.
 */
import React, { useState } from 'react';
import { X, LayoutTemplate, FilePlus2, GripVertical } from 'lucide-react';
import { LAYOUTS, LAYOUT_GROUPS, LAYOUT_MIME, type Layout } from './layouts';
import { ICONS } from './icons';
import { fontCss } from './fonts';

function Thumb({ l }: { l: Layout }) {
  return (
    <div className="relative w-full overflow-hidden rounded-lg" style={{ aspectRatio: '1 / 1.414', background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.3), transparent 60%), linear-gradient(180deg,#0b1220,#111a2e)', containerType: 'inline-size' } as React.CSSProperties}>
      {l.pieces.map((p, i) => {
        const s: React.CSSProperties = { position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%`, zIndex: p.z ?? 1 };
        if (p.type === 'shape') return <div key={i} style={{ ...s, aspectRatio: '1.6', borderRadius: 6, background: p.bg || 'linear-gradient(135deg,rgba(124,58,237,0.35),rgba(14,116,144,0.35))', border: '1px solid rgba(255,255,255,0.15)' }} />;
        if (p.type === 'icon') { const I = ICONS[p.icon || 'Rocket'] || ICONS.Rocket; return <div key={i} style={{ ...s, aspectRatio: '1', display: 'grid', placeItems: 'center', borderRadius: 5, background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.5)' }}><I style={{ width: '58%', height: '58%', color: '#e9d5ff' }} /></div>; }
        return <div key={i} style={{ ...s, fontSize: `${(p.size || 20) / 6}cqw`, fontWeight: p.weight, color: p.color, lineHeight: 1.15, whiteSpace: 'pre-wrap', fontFamily: fontCss(p.font) }}>{p.text}</div>;
      })}
    </div>
  );
}

export function LayoutGallery({ onUse, onNewPage, onClose, canAddPage }: {
  onUse: (l: Layout) => void; onNewPage: (l: Layout) => void; onClose: () => void; canAddPage: boolean;
}) {
  const [group, setGroup] = useState<string>('All');
  const list = LAYOUTS.filter((l) => group === 'All' || l.group === group);
  return (
    <div data-bs-ui className="fixed right-4 top-20 bottom-20 z-[72] w-72 rounded-xl flex flex-col overflow-hidden"
      style={{ background: 'rgba(15,23,42,0.96)', border: '1px solid rgba(168,85,247,0.45)', color: '#e2e8f0', backdropFilter: 'blur(10px)' }}>
      <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <span className="flex items-center gap-2 font-mono text-[11px] tracking-[0.2em]" style={{ color: '#c4b5fd' }}><LayoutTemplate className="h-4 w-4" />LAYOUTS</span>
        <button aria-label="Close" onClick={onClose}><X className="h-4 w-4" /></button>
      </div>
      <div className="flex flex-wrap gap-1 px-3 py-2">
        {['All', ...LAYOUT_GROUPS].map((g) => (
          <button key={g} className="rounded-md px-2 py-1 text-[11px] font-bold" style={{ background: group === g ? '#7c3aed' : 'rgba(255,255,255,0.08)' }} onClick={() => setGroup(g)}>{g}</button>
        ))}
      </div>
      <p className="px-3 pb-2 text-[11px]" style={{ color: '#94a3b8' }}>Drag a layout onto a page, or press Use for the current page.</p>
      <div className="flex-1 overflow-y-auto px-3 pb-3 grid grid-cols-2 gap-3 content-start">
        {list.map((l) => (
          <div key={l.id} draggable onDragStart={(e) => { e.dataTransfer.setData(LAYOUT_MIME, l.id); e.dataTransfer.effectAllowed = 'copy'; }}
            className="group flex flex-col gap-1.5 cursor-grab active:cursor-grabbing">
            <div className="relative"><Thumb l={l} />
              <GripVertical className="absolute right-1 top-1 h-3.5 w-3.5 opacity-60" />
            </div>
            <span className="text-[11px] font-semibold leading-tight">{l.name}</span>
            <div className="flex gap-1">
              <button className="flex-1 rounded-md py-1 text-[10px] font-bold" style={{ background: 'linear-gradient(135deg,#7c3aed,#0e7490)' }} onClick={() => onUse(l)}>Use</button>
              {canAddPage && <button className="rounded-md px-1.5" title="Add as a new page" aria-label="Add as a new page" style={{ background: 'rgba(255,255,255,0.08)' }} onClick={() => onNewPage(l)}><FilePlus2 className="h-3.5 w-3.5" /></button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
