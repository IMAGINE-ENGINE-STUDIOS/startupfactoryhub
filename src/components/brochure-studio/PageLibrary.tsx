/**
 * Page library dialog: browse every brochure's pages, page templates and full
 * brochure templates, and insert them. Page previews load a few at a time and
 * page counts are cached, so the library opens fast.
 * Credits: Imagine Engine Studios Corp.
 */
import React, { useEffect, useState } from 'react';
import { X, Plus, FilePlus2, Library, BookCopy, GripVertical } from 'lucide-react';
import { BROCHURES, countUrl, embedUrl } from './library';
import { LAYOUTS, type Layout } from './layouts';
import { Thumb } from './LayoutGallery';
import { STARTER_KITS, brochureKit, readCounts, saveCounts, KIT_MIME, type Kit } from './kits';

const ACCENT = 'linear-gradient(135deg,#06b6d4,#1d4ed8)';
const ACTIVE = 'linear-gradient(135deg,#0e7490,#1d4ed8)';
const PARALLEL = 3; // live page previews loading at the same time

/** One live page preview that only starts loading when its turn comes. */
function LivePage({ src, title, go, onDone }: { src: string; title: string; go: boolean; onDone: () => void }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { if (!go || ready) return; const t = setTimeout(() => { setReady(true); onDone(); }, 6000); return () => clearTimeout(t); }, [go, ready]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!go) return <div className="w-full h-full grid place-items-center text-[11px]" style={{ color: '#64748b' }}>Waiting…</div>;
  return <>
    {!ready && <div className="absolute inset-0 grid place-items-center text-[11px]" style={{ color: '#64748b' }}>Loading…</div>}
    <iframe title={title} src={src} className="w-full h-full pointer-events-none" style={{ opacity: ready ? 1 : 0, transition: 'opacity .3s' }}
      onLoad={() => setTimeout(() => { if (!ready) { setReady(true); onDone(); } }, 700)} />
  </>;
}

export function PageLibrary({ onPick, onClose, allowBlank, onLayout, onKit }: {
  onPick: (src: string | null, label: string) => void; onClose: () => void; allowBlank: boolean; onLayout?: (l: Layout) => void; onKit?: (k: Kit) => void;
}) {
  const [route, setRoute] = useState(onKit ? 'kits' : onLayout ? 'layouts' : BROCHURES[0].route);
  const [counts, setCounts] = useState<Record<string, number>>(readCounts);
  const [done, setDone] = useState(0);
  useEffect(() => setDone(0), [route]);

  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || typeof e.data?.bsCount !== 'number') return;
      const r = BROCHURES.find((b) => b.route.toLowerCase() === String(e.data.path).toLowerCase());
      if (r) setCounts((c) => { const n = { ...c, [r.route]: e.data.bsCount }; saveCounts(n); return n; });
    };
    window.addEventListener('message', on);
    return () => window.removeEventListener('message', on);
  }, []);

  // Count missing brochures one at a time in the background (the open one first).
  const missing = [route, ...BROCHURES.map((b) => b.route)].find((r) => BROCHURES.some((b) => b.route === r) && counts[r] === undefined);

  const n = counts[route];
  const isLay = route === 'layouts', isKits = route === 'kits';
  const name = isKits ? 'Brochure templates' : isLay ? 'Page templates' : BROCHURES.find((b) => b.route === route)?.name || '';
  const glass: React.CSSProperties = { background: 'linear-gradient(160deg,rgba(11,18,32,0.97),rgba(17,26,46,0.97))', border: '1px solid rgba(34,211,238,0.28)', color: '#e2e8f0', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' };
  const kits: Kit[] = [...STARTER_KITS, ...BROCHURES.filter((b) => counts[b.route]).map((b) => brochureKit(b.route, counts[b.route]))];
  const tab = (on: boolean): React.CSSProperties => ({ background: on ? ACTIVE : 'transparent' });

  return (
    <div data-bs-ui className="fixed inset-0 z-[80] flex items-center justify-center p-4" style={{ background: 'rgba(2,6,23,0.7)' }} onClick={onClose}>
      {missing && <iframe key={missing} title="count" src={countUrl(missing)} className="fixed w-px h-px opacity-0 pointer-events-none" style={{ left: -10, top: -10 }} />}
      <div className="w-full max-w-5xl h-[82vh] rounded-2xl flex overflow-hidden" style={glass} onClick={(e) => e.stopPropagation()}>
        <aside className="w-56 shrink-0 p-3 flex flex-col gap-1 overflow-y-auto" style={{ borderRight: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2 px-2 pb-2 font-mono text-[11px] tracking-[0.2em]" style={{ color: '#67e8f9' }}><Library className="h-4 w-4" />PAGE LIBRARY</div>
          {allowBlank && (
            <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold text-left" style={{ background: 'rgba(34,211,238,0.12)' }} onClick={() => onPick(null, 'Blank')}>
              <FilePlus2 className="h-4 w-4" />Blank page
            </button>
          )}
          {onKit && <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold text-left" style={tab(isKits)} onClick={() => setRoute('kits')}><BookCopy className="h-4 w-4" />Brochure templates</button>}
          {onLayout && <button className="rounded-lg px-3 py-2 text-[13px] font-semibold text-left" style={tab(isLay)} onClick={() => setRoute('layouts')}>Page templates <span className="opacity-60">· {LAYOUTS.length}</span></button>}
          <div className="px-2 pt-2 pb-1 font-mono text-[10px] tracking-[0.2em]" style={{ color: '#64748b' }}>BROCHURES</div>
          {BROCHURES.map((b) => (
            <button key={b.route} className="rounded-lg px-3 py-2 text-[13px] font-semibold text-left" style={tab(route === b.route)} onClick={() => setRoute(b.route)}>
              {b.name}{counts[b.route] ? <span className="ml-1 opacity-60">· {counts[b.route]}</span> : null}
            </button>
          ))}
        </aside>
        <section className="flex-1 flex flex-col min-w-0">
          <header className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-[14px] font-bold">{name}{!isKits && !isLay ? ' pages' : ''}</span>
            <button aria-label="Close" onClick={onClose}><X className="h-5 w-5" /></button>
          </header>
          <div className="flex-1 overflow-y-auto p-4">
            {isKits && onKit ? (
              <>
                <p className="pb-3 text-[12px]" style={{ color: '#94a3b8' }}>Use a whole brochure design at once, or drag it onto a page. Its pages are added after the current page.</p>
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))' }}>
                  {kits.map((k) => (
                    <div key={k.id} draggable onDragStart={(e) => { e.dataTransfer.setData(KIT_MIME, k.id); e.dataTransfer.effectAllowed = 'copy'; onClose(); }}
                      className="rounded-xl p-3 flex flex-col gap-2 cursor-grab active:cursor-grabbing" style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
                      <div className="flex gap-1.5 overflow-hidden">
                        {k.pages.slice(0, 3).map((p, i) => (
                          <div key={i} className="w-1/3 shrink-0 relative rounded-md overflow-hidden" style={{ aspectRatio: '1 / 1.414', background: '#0b1220', border: '1px solid rgba(255,255,255,0.08)' }}>
                            {p.layout ? <Thumb l={p.layout} /> : <LivePage src={p.src!} title={p.label} go={i < 3 && k.pages.length > 0 && kits.indexOf(k) < STARTER_KITS.length + done + 1} onDone={() => setDone((d) => d + 1)} />}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <div><div className="text-[13px] font-bold">{k.name}</div><div className="text-[11px]" style={{ color: '#94a3b8' }}>{k.note}</div></div>
                        <GripVertical className="h-4 w-4 opacity-50 shrink-0" />
                      </div>
                      <button className="rounded-md py-1.5 text-[12px] font-semibold" style={{ background: ACCENT }} onClick={() => onKit(k)}>Use whole brochure · {k.pages.length} pages</button>
                    </div>
                  ))}
                </div>
                {missing && <p className="pt-3 text-[11px]" style={{ color: '#64748b' }}>Adding more brochures as templates…</p>}
              </>
            ) : isLay && onLayout ? (
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))' }}>
                {LAYOUTS.map((l) => (
                  <div key={l.id} className="group relative rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
                    <Thumb l={l} />
                    <span className="absolute left-2 top-2 rounded-md px-1.5 py-0.5 text-[10px] font-bold" style={{ background: 'rgba(15,23,42,0.85)' }}>{l.name}</span>
                    <button className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(8,47,73,0.45)' }} onClick={() => onLayout(l)}>
                      <span className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-bold" style={{ background: ACCENT }}><Plus className="h-4 w-4" />Insert</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : n === undefined ? (
              <div className="text-[13px]" style={{ color: '#94a3b8' }}>Loading pages…</div>
            ) : (
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))' }}>
                {Array.from({ length: n }, (_, i) => (
                  <div key={i} className="group relative rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.12)', aspectRatio: '1 / 1.414', background: '#0b1220' }}>
                    <LivePage src={embedUrl(route, i)} title={`${name} page ${i + 1}`} go={i < done + PARALLEL} onDone={() => setDone((d) => d + 1)} />
                    <span className="absolute left-2 top-2 rounded-md px-1.5 py-0.5 font-mono text-[10px]" style={{ background: 'rgba(15,23,42,0.85)' }}>P/{String(i + 1).padStart(2, '0')}</span>
                    <button className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(8,47,73,0.45)' }}
                      onClick={() => onPick(embedUrl(route, i), `${name} P/${i + 1}`)}>
                      <span className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-bold" style={{ background: ACCENT }}><Plus className="h-4 w-4" />Insert</span>
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
