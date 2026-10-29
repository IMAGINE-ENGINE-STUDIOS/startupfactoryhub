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
  <div ref={ref} className="overflow-hidden" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.25), transparent 60%), linear-gradient(180deg,#0b1220,#111a2e)' }}>
    <div data-bp-root={n} className="relative w-full h-full">
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
    const calc = () => setW(Math.max(300, Math.floor(Math.min(window.innerWidth >= 1100 ? (window.innerWidth - 80) / 2 : window.innerWidth - 24, (window.innerHeight - 120) / 1.414, 620))));
    calc(); window.addEventListener('resize', calc); return () => window.removeEventListener('resize', calc);
  }, []);
  const spread = typeof window !== 'undefined' && window.innerWidth >= 1100;
  const bookRef = useRef<any>(null);
  const { reportPage } = useBrochureLiveBridge(bookRef);

  return (
    <div className="min-h-screen w-full flex items-center justify-center py-6" style={{ background: 'linear-gradient(180deg,#060a14,#0b1220)' }}>
      {/* @ts-expect-error react-pageflip typing requires every prop */}
      <HTMLFlipBook ref={bookRef} onFlip={(e: any) => reportPage(e.data)} key={`${sig}-${w}`} width={w} height={Math.floor(w * 1.414)} size="fixed" showCover usePortrait={!spread} drawShadow={spread} flippingTime={550} disableFlipByClick mobileScrollSupport>
        {pages.map((p, i) => <Page key={i} n={i} src={p.src} />)}
      </HTMLFlipBook>
    </div>
  );
}
