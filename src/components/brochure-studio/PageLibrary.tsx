/**
 * Page library dialog: browse every brochure's pages, page templates and full
 * brochure templates, and insert them. Page previews load a few at a time and
 * page counts are cached, so the library opens fast.
 * Credits: Imagine Engine Studios Corp.
 */
import React, { useEffect, useState } from 'react';
import { X, Plus, FilePlus2, Library, BookCopy, GripVertical } from 'lucide-react';
import { BROCHURES, countUrl, templateEmbedUrl } from './library';
import { LAYOUTS, type Layout } from './layouts';
import { Thumb } from './LayoutGallery';
import { STARTER_KITS, APEX_KIT, brochureKit, readCounts, saveCounts, KIT_MIME, type Kit } from './kits';

const ACCENT = 'linear-gradient(135deg,#06b6d4,#1d4ed8)';
const ACTIVE = 'linear-gradient(135deg,#0e7490,#1d4ed8)';

/** Static design card for one library page. Page previews used to be LIVE
 *  iframes — a full copy of the whole app per page — and a grid of 16–39
 *  of them froze and crashed tabs outright (six tabs lost in one test
 *  run), on top of the brochures refusing to render their flipbook under
 *  360px wide. The library therefore shows a designed card per page; the
 *  real page renders when it is inserted into the user's brochure. */
function PageCard({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="absolute inset-0 flex flex-col justify-between p-2" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.30), transparent 62%), linear-gradient(180deg,#0b1220,#111a2e)' }}>
      <span className="font-mono text-[9px] tracking-[0.2em]" style={{ color: '#67e8f9' }}>{label}</span>
      <span className="text-[10px] leading-snug" style={{ color: '#94a3b8' }}>{sub}</span>
    </div>
  );
}

export function PageLibrary({ onPick, onClose, allowBlank, onLayout, onKit }: {
  onPick: (src: string | null, label: string) => void; onClose: () => void; allowBlank: boolean; onLayout?: (l: Layout) => void; onKit?: (k: Kit) => void;
}) {
  const [route, setRoute] = useState(onKit ? 'kits' : onLayout ? 'layouts' : BROCHURES[0].route);
  const [counts, setCounts] = useState<Record<string, number>>(readCounts);
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || typeof e.data?.bsCount !== 'number') return;
      const r = BROCHURES.find((b) => b.route.toLowerCase() === String(e.data.path).toLowerCase());
      if (r) setCounts((c) => { const n = { ...c, [r.route]: e.data.bsCount }; saveCounts(n); return n; });
    };
    window.addEventListener('message', on);
    return () => window.removeEventListener('message', on);
  }, []);

  // Count ONLY the book the user has open: a counting iframe is a full
  // app, and chaining through every uncounted book in the background (the
  // old behaviour) booted one heavy app after another behind the panel
  // and helped kill the tab. Books pick up their count when visited.
  const missing = route === 'kits' || route === 'layouts' || counts[route] !== undefined ? undefined : route;
  // If a count never arrives (a brochure that boots slowly or a stalled
  // iframe), remount the counting iframe and try again — up to 2 retries,
  // then leave it for the next library open instead of spinning forever.
  const [countTry, setCountTry] = useState(0);
  useEffect(() => { setCountTry(0); }, [missing]);
  useEffect(() => {
    if (!missing || countTry >= 2) return;
    const t = setTimeout(() => setCountTry((x) => x + 1), 25000);
    return () => clearTimeout(t);
  }, [missing, countTry]);

  const n = counts[route];
  const isLay = route === 'layouts', isKits = route === 'kits';
  const name = isKits ? 'Brochure templates' : isLay ? 'Page templates' : BROCHURES.find((b) => b.route === route)?.name || '';
  const glass: React.CSSProperties = { background: 'linear-gradient(160deg,rgba(11,18,32,0.97),rgba(17,26,46,0.97))', border: '1px solid rgba(34,211,238,0.28)', color: '#e2e8f0', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' };
  const kits: Kit[] = [...STARTER_KITS, APEX_KIT, ...BROCHURES.filter((b) => counts[b.route]).map((b) => brochureKit(b.route, counts[b.route]))];
  const tab = (on: boolean): React.CSSProperties => ({ background: on ? ACTIVE : 'transparent' });

  return (
    <div data-bs-ui className="fixed inset-0 z-[80] flex items-center justify-center p-4" style={{ background: drag ? 'transparent' : 'rgba(2,6,23,0.7)', pointerEvents: drag ? 'none' : 'auto', opacity: drag ? 0.12 : 1 }} onClick={onClose}>
      {/* The counting iframe needs a REAL desktop viewport: the brochures
          refuse to render their flipbook below 360px wide (their support
          gate), so the old 1px iframe never produced any pages to count
          and uncached books stuck on "Loading pages…" forever. It sits
          invisible on screen (opacity 0, no pointer events, behind
          everything) so the browser still runs it at full speed. */}
      {missing && <iframe key={`${missing}:${countTry}`} title="count" src={countUrl(missing)} className="fixed opacity-0 pointer-events-none" style={{ left: 0, top: 0, width: 1280, height: 900, zIndex: -1, border: 0 }} />}
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
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4">
            {isKits && onKit ? (
              <>
                <p className="pb-3 text-[12px]" style={{ color: '#94a3b8' }}>Use a whole brochure design at once, or drag it onto a page. Its pages are added after the current page.</p>
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))' }}>
                  {kits.map((k) => (
                    <div key={k.id} draggable onDragStart={(e) => { e.dataTransfer.setData(KIT_MIME, k.id); e.dataTransfer.effectAllowed = 'copy'; setTimeout(() => setDrag(true), 0); }} onDragEnd={() => { setDrag(false); onClose(); }}
                      className="rounded-xl p-3 flex flex-col gap-2 cursor-grab active:cursor-grabbing" style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
                      <div className="flex gap-1.5 overflow-hidden">
                        {k.pages.slice(0, k.pages[0]?.layout ? 3 : 1).map((p, i) => (
                          <div key={i} className="w-1/3 shrink-0 relative rounded-md overflow-hidden" style={{ aspectRatio: '1 / 1.414', background: '#0b1220', border: '1px solid rgba(255,255,255,0.08)' }}>
                            {p.layout ? <Thumb l={p.layout} /> : <PageCard label={p.label} sub="Design only — the real page renders when inserted" />}
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
                <p className="pt-3 text-[11px]" style={{ color: '#64748b' }}>More books join the list as you open them in the brochures list.</p>
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
              <div className="text-[13px]" style={{ color: '#94a3b8' }}>Loading pages… counting this book's pages (it opens once, then stays counted).</div>
            ) : (
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))' }}>
                {Array.from({ length: n }, (_, i) => (
                  <div key={i} className="group relative rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.12)', aspectRatio: '1 / 1.414', background: '#0b1220' }}>
                    <PageCard label={`${name.toUpperCase()} // ${String(i + 1).padStart(2, '0')}`} sub="Design only — the real page renders when inserted" />
                    <span className="absolute left-2 top-2 rounded-md px-1.5 py-0.5 font-mono text-[10px]" style={{ background: 'rgba(15,23,42,0.85)' }}>P/{String(i + 1).padStart(2, '0')}</span>
                    <button className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(8,47,73,0.45)' }}
                      onClick={() => onPick(templateEmbedUrl(route, i), `${name} P/${i + 1}`)}>
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
