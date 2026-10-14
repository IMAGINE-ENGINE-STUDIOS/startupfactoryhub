/**
 * Page library dialog: browse every brochure's pages and insert one as a template.
 * Credits: Imagine Engine Studios Corp.
 */
import React, { useEffect, useState } from 'react';
import { X, Plus, FilePlus2, Library } from 'lucide-react';
import { BROCHURES, countUrl, embedUrl } from './library';

export function PageLibrary({ onPick, onClose, allowBlank }: {
  onPick: (src: string | null, label: string) => void; onClose: () => void; allowBlank: boolean;
}) {
  const [route, setRoute] = useState(BROCHURES[0].route);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || typeof e.data?.bsCount !== 'number') return;
      const r = BROCHURES.find((b) => b.route.toLowerCase() === String(e.data.path).toLowerCase());
      if (r) setCounts((c) => ({ ...c, [r.route]: e.data.bsCount }));
    };
    window.addEventListener('message', on);
    return () => window.removeEventListener('message', on);
  }, []);

  const n = counts[route];
  const name = BROCHURES.find((b) => b.route === route)?.name || '';
  const glass: React.CSSProperties = { background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(168,85,247,0.45)', color: '#e2e8f0' };

  return (
    <div data-bs-ui className="fixed inset-0 z-[80] flex items-center justify-center p-4" style={{ background: 'rgba(2,6,23,0.7)' }} onClick={onClose}>
      <div className="w-full max-w-5xl h-[82vh] rounded-2xl flex overflow-hidden" style={glass} onClick={(e) => e.stopPropagation()}>
        <aside className="w-52 shrink-0 p-3 flex flex-col gap-1 overflow-y-auto" style={{ borderRight: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2 px-2 pb-2 font-mono text-[11px] tracking-[0.2em]" style={{ color: '#c4b5fd' }}><Library className="h-4 w-4" />PAGE LIBRARY</div>
          {allowBlank && (
            <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-bold text-left" style={{ background: 'rgba(124,58,237,0.25)' }} onClick={() => onPick(null, 'Blank')}>
              <FilePlus2 className="h-4 w-4" />Blank page
            </button>
          )}
          {BROCHURES.map((b) => (
            <button key={b.route} className="rounded-lg px-3 py-2 text-[13px] font-semibold text-left"
              style={{ background: route === b.route ? '#7c3aed' : 'transparent' }} onClick={() => setRoute(b.route)}>
              {b.name}{counts[b.route] ? <span className="ml-1 opacity-60">· {counts[b.route]}</span> : null}
            </button>
          ))}
        </aside>
        <section className="flex-1 flex flex-col min-w-0">
          <header className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-[14px] font-bold">{name} pages</span>
            <button aria-label="Close" onClick={onClose}><X className="h-5 w-5" /></button>
          </header>
          <div className="flex-1 overflow-y-auto p-4">
            {n === undefined ? (
              <div className="text-[13px]" style={{ color: '#94a3b8' }}>Loading pages…
                <iframe key={route} title="count" src={countUrl(route)} className="w-px h-px opacity-0 absolute pointer-events-none" />
              </div>
            ) : (
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))' }}>
                {Array.from({ length: n }, (_, i) => (
                  <div key={i} className="group relative rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.12)', aspectRatio: '1 / 1.414' }}>
                    <iframe title={`${name} page ${i + 1}`} src={embedUrl(route, i)} loading="lazy" className="w-full h-full pointer-events-none" />
                    <span className="absolute left-2 top-2 rounded-md px-1.5 py-0.5 font-mono text-[10px]" style={{ background: 'rgba(15,23,42,0.85)' }}>P/{String(i + 1).padStart(2, '0')}</span>
                    <button className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(124,58,237,0.35)' }}
                      onClick={() => onPick(embedUrl(route, i), `${name} P/${i + 1}`)}>
                      <span className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-bold" style={{ background: 'linear-gradient(135deg,#7c3aed,#0e7490)' }}><Plus className="h-4 w-4" />Insert</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
