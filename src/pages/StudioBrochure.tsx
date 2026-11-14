/**
 * Blank flipbook for brochures created in Brochure Studio (/b/:slug).
 * Pages, content and backgrounds come from the published Studio document.
 * Credits: Imagine Engine Studios Corp.
 */
import React, { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { fetchPublished, slugFromPath } from '@/components/brochure-studio/BrochureStudio';
import { ItemView } from '@/components/brochure-studio/ItemView';
import { PageBackground } from '@/components/brochure-studio/Backgrounds';
import { useBrochureLiveBridge } from '@/lib/brochureLive';
import type { BrochureDoc, Item, PageBg, PageRef } from '@/components/brochure-studio/types';

const Page = forwardRef<HTMLDivElement, { n: number; src?: string; items: Item[]; bg?: PageBg; editing: boolean }>(({ n, src, items, bg, editing }, ref) => (
  // The flipbook library rewrites the page root's inline style on every
  // draw (position/size only), wiping any background put there — so the
  // visible page surface lives on this inner element instead.
  <div ref={ref} className="overflow-hidden">
    <div data-bp-root={n} data-bs-intree="1" className="relative w-full h-full" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.38), transparent 62%), linear-gradient(180deg,#16233f,#101a30)', boxShadow: 'inset 0 0 0 1.5px rgba(165,180,205,0.6), inset 0 0 60px rgba(0,0,0,0.35)' }}>
      {src && <iframe title={`Page ${n + 1}`} src={src} className="absolute inset-0 w-full h-full border-0" />}
      <div className="absolute bottom-4 right-5 font-mono text-[11px] tracking-[0.2em]" style={{ color: '#64748b' }}>P/{String(n + 1).padStart(2, '0')}</div>
      {/* Saved items + page background render INSIDE the page itself.
          They used to be painted by the editor through DOM portals into
          the flipbook's live nodes; whenever the flipbook rebuilt a page
          the portal layer died with it, so published content flickered
          or never showed after a reload even though the saved file was
          correct. In-tree, the items are ordinary page content: the
          flipbook clones and carries them like everything else. */}
      {(bg || items.length > 0) && (
        <div data-bs-layer="" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30, overflow: 'hidden' }}>
          {bg && <PageBackground bg={bg} />}
          {items.map((it) => <ItemView key={it.id} it={it} editing={editing} selected={false} />)}
        </div>
      )}
    </div>
  </div>
));
Page.displayName = 'StudioPage';

export default function StudioBrochure() {
  const { slug = '' } = useParams();
  const key = slugFromPath(`/b/${slug}`);
  const [pages, setPages] = useState<PageRef[]>([{}, {}, {}, {}]);
  const [w, setW] = useState(480);
  const pagesRef = useRef(pages); pagesRef.current = pages;
  // The editor (Brochure Studio) owns the live document once it has spoken:
  // its doc carries the owner's draft, which is NEWER than the published
  // file this page fetches on its own. If that fetch resolves afterwards it
  // must not stomp the editor's pages back to the published page list —
  // that race silently "lost" added pages and template pages on reload.
  const editorSeen = useRef(false);
  // The full document (items + backgrounds) lives here too, so the pages
  // can render their own content in-tree (see Page above). Guarded by a
  // JSON fingerprint so identical docs don't re-render the book.
  const [doc, setDocState] = useState<BrochureDoc | null>(null);
  const docFp = useRef('');
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    const on = (e: Event) => setEditing(!!(e as CustomEvent<{ editing?: boolean }>).detail?.editing);
    window.addEventListener('bs:editing', on);
    return () => window.removeEventListener('bs:editing', on);
  }, []);
  const apply = (d: BrochureDoc, fromEditor = false) => {
    if (fromEditor && (d.pages?.length || d.pageCount)) editorSeen.current = true;
    const fp = JSON.stringify([d.items, d.bgs]);
    if (fp !== docFp.current) { docFp.current = fp; setDocState(d); }
    const next = d.pages?.length ? d.pages : d.pageCount ? Array.from({ length: d.pageCount }, () => ({})) : null;
    if (!next) return;
    const cur = pagesRef.current;
    // Keep the existing array identity when the page list is equivalent:
    // a new array on every editor keystroke made react-pageflip rebuild
    // the whole book from the live DOM (updateFromHtml), which broke
    // rendering and page turning.
    if (cur.length === next.length && cur.every((p, i) => (p.src || '') === (next[i].src || '') && (p.label || '') === (next[i].label || ''))) return;
    setPages(next);
  };
  const sig = pages.map((p) => p.src || '-').join('|');
  const docSig = doc ? JSON.stringify([doc.items, doc.bgs]) : '';

  useEffect(() => { fetchPublished(key).then((d) => { if (!editorSeen.current) apply(d); }); document.title = `${slug} · Startup Factory Hub`; }, [key, slug]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const on = (e: Event) => { const { slug: s, doc } = (e as CustomEvent<{ slug: string; doc: BrochureDoc }>).detail; if (s === key) apply(doc, true); };
    window.addEventListener('bs:doc', on);
    return () => window.removeEventListener('bs:doc', on);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    let lastVw = -1;
    const calc = () => {
      // Height-only changes are the phone browser bar sliding in/out while
      // passing pages — keep the page geometry (and the flipbook) frozen.
      if (window.innerWidth === lastVw) return;
      lastVw = window.innerWidth;
      setW(Math.max(300, Math.floor(Math.min(window.innerWidth >= 1100 ? (window.innerWidth - 80) / 2 : window.innerWidth - 24, (window.innerHeight - 120) / 1.414, 620))));
    };
    calc(); window.addEventListener('resize', calc); return () => window.removeEventListener('resize', calc);
  }, []);
  const spread = typeof window !== 'undefined' && window.innerWidth >= 1100;
  const bookRef = useRef<any>(null);
  const { reportPage } = useBrochureLiveBridge(bookRef);

  // Edit-mode page turning: while Brochure Studio is editing, its pointer
  // capture blocks the flipbook's own drag/click gestures, so the editor's
  // Prev/Next buttons ask the book to turn through this event instead.
  useEffect(() => {
    const on = (e: Event) => {
      const dir = (e as CustomEvent<{ dir?: string }>).detail?.dir;
      try {
        const pf = bookRef.current?.pageFlip?.();
        if (!pf) return;
        if (dir === 'prev') pf.flipPrev('bottom');
        else pf.flipNext('bottom');
      } catch { /* book not ready */ }
    };
    window.addEventListener('bs:flip', on);
    return () => window.removeEventListener('bs:flip', on);
  }, []);

  const [cur, setCur] = useState(0);
  const flipBy = (dir: 'prev' | 'next') => {
    try {
      const pf = bookRef.current?.pageFlip?.();
      if (!pf) return;
      if (dir === 'prev') pf.flipPrev('bottom'); else pf.flipNext('bottom');
    } catch { /* book not ready */ }
  };
  const arrowBtn: React.CSSProperties = { background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(34,211,238,0.4)', color: '#e2e8f0', backdropFilter: 'blur(10px)' };

  // Keep the counter honest when pages are removed under it.
  useEffect(() => { setCur((c) => Math.min(c, Math.max(0, pages.length - 1))); }, [pages.length]);

  const onFlipRef = useRef<(e: any) => void>(() => {});
  onFlipRef.current = (e: any) => { reportPage(e.data); setCur(e.data); window.dispatchEvent(new CustomEvent('bs:page', { detail: { page: e.data } })); };
  // The flipbook element is memoized: react-pageflip rebuilds the whole
  // book from the live DOM whenever it receives fresh children, so handing
  // it a new element on every render (page counter, live bridge updates)
  // made the pages — and everything the editor portals into them — flicker
  // in and out. It only gets a new element when the pages or size change.
  const book = useMemo(() => (
    // @ts-expect-error react-pageflip typing requires every prop
    <HTMLFlipBook ref={bookRef} onFlip={(e: any) => onFlipRef.current(e)} key={`${sig}-${w}`} width={w} height={Math.floor(w * 1.414)} size="fixed" showCover usePortrait={!spread} drawShadow={spread} flippingTime={550} disableFlipByClick mobileScrollSupport>
      {pages.map((p, i) => <Page key={i} n={i} src={p.src} items={doc?.items.filter((x) => x.page === i) ?? []} bg={doc?.bgs[String(i)] || doc?.bgs.all} editing={editing} />)}
    </HTMLFlipBook>
  ), [sig, w, spread, docSig, editing]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center py-6" style={{ background: 'radial-gradient(ellipse 90% 70% at 50% 42%, #131f38 0%, #060a14 72%)' }}>
      {/* Flip arrows at the top of the brochure — pages can always be
          turned from here, in view mode and while editing. */}
      <div className="flex items-center gap-3 pb-3" data-bs-ui>
        <button type="button" aria-label="Previous page" title="Previous page" disabled={cur <= 0} onClick={() => flipBy('prev')}
          className="grid h-10 w-10 place-items-center rounded-full transition-opacity disabled:opacity-35" style={arrowBtn}>
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="font-mono text-[11px] tracking-[0.2em]" style={{ color: '#94a3b8' }}>PAGE {cur + 1} / {pages.length}</span>
        <button type="button" aria-label="Next page" title="Next page" disabled={cur >= pages.length - 1} onClick={() => flipBy('next')}
          className="grid h-10 w-10 place-items-center rounded-full transition-opacity disabled:opacity-35" style={arrowBtn}>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <div className="rounded-[10px] p-2 sm:p-2.5" style={{ background: 'linear-gradient(180deg,#0c1425,#080d18)', boxShadow: '0 30px 80px rgba(0,0,0,0.65), 0 0 0 1.5px rgba(165,180,205,0.4)' }}>
        {book}
      </div>
    </div>
  );
}
