/**
 * Blank flipbook for brochures created in Brochure Studio (/b/:slug).
 * Pages, content and backgrounds come from the published Studio document.
 * Credits: Imagine Engine Studios Corp.
 */
import React, { forwardRef, useEffect, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { useParams } from 'react-router-dom';
import { fetchPublished, slugFromPath } from '@/components/brochure-studio/BrochureStudio';
import { useBrochureLiveBridge } from '@/lib/brochureLive';
import type { BrochureDoc, PageRef } from '@/components/brochure-studio/types';

const Page = forwardRef<HTMLDivElement, { n: number; src?: string }>(({ n, src }, ref) => (
  // The flipbook library rewrites the page root's inline style on every
  // draw (position/size only), wiping any background put there — so the
  // visible page surface lives on this inner element instead.
  <div ref={ref} className="overflow-hidden">
    <div data-bp-root={n} className="relative w-full h-full" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.38), transparent 62%), linear-gradient(180deg,#16233f,#101a30)', boxShadow: 'inset 0 0 0 1.5px rgba(165,180,205,0.6), inset 0 0 60px rgba(0,0,0,0.35)' }}>
      {src && <iframe title={`Page ${n + 1}`} src={src} className="absolute inset-0 w-full h-full border-0" />}
      <div className="absolute bottom-4 right-5 font-mono text-[11px] tracking-[0.2em]" style={{ color: '#64748b' }}>P/{String(n + 1).padStart(2, '0')}</div>
    </div>
  </div>
));
Page.displayName = 'StudioPage';

export default function StudioBrochure() {
  const { slug = '' } = useParams();
  const key = slugFromPath(`/b/${slug}`);
  const [pages, setPages] = useState<PageRef[]>([{}, {}, {}, {}]);
  const [w, setW] = useState(480);
  const apply = (d: BrochureDoc) => { if (d.pages?.length) setPages(d.pages); else if (d.pageCount) setPages(Array.from({ length: d.pageCount }, () => ({}))); };
  const sig = pages.map((p) => p.src || '-').join('|');

  useEffect(() => { fetchPublished(key).then(apply); document.title = `${slug} · Startup Factory Hub`; }, [key, slug]);
  useEffect(() => {
    const on = (e: Event) => { const { slug: s, doc } = (e as CustomEvent<{ slug: string; doc: BrochureDoc }>).detail; if (s === key) apply(doc); };
    window.addEventListener('bs:doc', on);
    return () => window.removeEventListener('bs:doc', on);
  }, [key]);
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

  return (
    <div className="min-h-screen w-full flex items-center justify-center py-6" style={{ background: 'radial-gradient(ellipse 90% 70% at 50% 42%, #131f38 0%, #060a14 72%)' }}>
      <div className="rounded-[10px] p-2 sm:p-2.5" style={{ background: 'linear-gradient(180deg,#0c1425,#080d18)', boxShadow: '0 30px 80px rgba(0,0,0,0.65), 0 0 0 1.5px rgba(165,180,205,0.4)' }}>
        {/* @ts-expect-error react-pageflip typing requires every prop */}
        <HTMLFlipBook ref={bookRef} onFlip={(e: any) => reportPage(e.data)} key={`${sig}-${w}`} width={w} height={Math.floor(w * 1.414)} size="fixed" showCover usePortrait={!spread} drawShadow={spread} flippingTime={550} disableFlipByClick mobileScrollSupport>
          {pages.map((p, i) => <Page key={i} n={i} src={p.src} />)}
        </HTMLFlipBook>
      </div>
    </div>
  );
}
