/**
 * Blank flipbook for brochures created in Brochure Studio (/b/:slug).
 * Pages, content and backgrounds come from the published Studio document.
 * Credits: Imagine Engine Studios Corp.
 */
import React, { forwardRef, useEffect, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { useParams } from 'react-router-dom';
import { fetchPublished, slugFromPath } from '@/components/brochure-studio/BrochureStudio';
import type { BrochureDoc } from '@/components/brochure-studio/types';

const Page = forwardRef<HTMLDivElement, { n: number }>(({ n }, ref) => (
  <div ref={ref} className="overflow-hidden" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.25), transparent 60%), linear-gradient(180deg,#0b1220,#111a2e)' }}>
    <div data-bp-root={n} className="relative w-full h-full">
      <div className="absolute bottom-4 right-5 font-mono text-[11px] tracking-[0.2em]" style={{ color: '#64748b' }}>P/{String(n + 1).padStart(2, '0')}</div>
    </div>
  </div>
));
Page.displayName = 'StudioPage';

export default function StudioBrochure() {
  const { slug = '' } = useParams();
  const key = slugFromPath(`/b/${slug}`);
  const [count, setCount] = useState(4);
  const [w, setW] = useState(480);

  useEffect(() => { fetchPublished(key).then((d) => d.pageCount && setCount(d.pageCount)); document.title = `${slug} · Startup Factory Hub`; }, [key, slug]);
  useEffect(() => {
    const on = (e: Event) => { const { slug: s, doc } = (e as CustomEvent<{ slug: string; doc: BrochureDoc }>).detail; if (s === key && doc.pageCount) setCount(doc.pageCount); };
    window.addEventListener('bs:doc', on);
    return () => window.removeEventListener('bs:doc', on);
  }, [key]);
  useEffect(() => {
    const calc = () => setW(Math.max(300, Math.floor(Math.min(window.innerWidth >= 1100 ? (window.innerWidth - 80) / 2 : window.innerWidth - 24, (window.innerHeight - 120) / 1.414, 620))));
    calc(); window.addEventListener('resize', calc); return () => window.removeEventListener('resize', calc);
  }, []);
  const spread = typeof window !== 'undefined' && window.innerWidth >= 1100;

  return (
    <div className="min-h-screen w-full flex items-center justify-center py-6" style={{ background: 'linear-gradient(180deg,#060a14,#0b1220)' }}>
      {/* @ts-expect-error react-pageflip typing requires every prop */}
      <HTMLFlipBook key={`${count}-${w}`} width={w} height={Math.floor(w * 1.414)} size="fixed" showCover usePortrait={!spread} drawShadow={spread} flippingTime={550} disableFlipByClick mobileScrollSupport>
        {Array.from({ length: count }, (_, i) => <Page key={i} n={i} />)}
      </HTMLFlipBook>
    </div>
  );
}
