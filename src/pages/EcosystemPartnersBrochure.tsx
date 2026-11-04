/**
 * Ecosystem Partners brochure (/ecosystempartners).
 * The white-label licensing proposal: a copy of the APEX proposal's shell
 * and pages, directed to general clients who want to license the Startup
 * Factory Hub platform under their own brand (founder, 2026-11-03).
 * Same flipbook behavior as /apex, including the 440 phone layout.
 * Credits: Imagine Engine Studios Corp.
 */
import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import {
  EcosystemCoverPage, EcosystemObjectivePage, EcosystemProposalPage, EcosystemProposalMorePage,
  EcosystemPricingPage, EcosystemWhyPage, EcosystemClosingPage, EcosystemSummaryPage,
} from './ecosystem/EcosystemPages';
import { SupportingDividerPage } from './apex/ProposalPages';
import { PartnersAboutPage, PartnersEcosystemPage } from './apex/PartnersPages';
import { PartnersARPage, PartnersNasdaqPage } from './AcceleratorBrochure';
import { EcosystemValuePage } from './ecosystem/EcosystemValuePage';
import { EcosystemOutcomesPage } from './ecosystem/EcosystemOutcomesPage';
import { EcosystemConclusionPage } from './ecosystem/EcosystemConclusionPage';
import { EcosystemOpportunityPage } from './ecosystem/EcosystemOpportunityPage';
import { EcosystemTeamPage, EcosystemRoadmapPage, EcosystemNextStepsPage } from './ecosystem/EcosystemTeamRoadmap';
import sfhLogo from '@/assets/sfh-logo-combined.png';

const CONTACT_URL = 'https://startupfactoryhub.com/ecosystempartners';
const TOTAL = '21';

const BookPage = forwardRef<HTMLDivElement, { children: React.ReactNode; hard?: boolean }>(({ children, hard }, ref) => (
  <div ref={ref} data-density={hard ? 'hard' : 'soft'} className="overflow-hidden" style={{ background: '#ffffff' }}>{children}</div>
));
BookPage.displayName = 'BookPage';

const PAGES: { key: string; node: React.ReactNode }[] = [
  { key: 'cover', node: <EcosystemCoverPage /> },
  { key: 'objective', node: <EcosystemObjectivePage /> },
  { key: 'proposal', node: <EcosystemProposalPage /> },
  { key: 'proposal-more', node: <EcosystemProposalMorePage /> },
  { key: 'pricing', node: <EcosystemPricingPage /> },
  { key: 'why', node: <EcosystemWhyPage /> },
  { key: 'appendix', node: <SupportingDividerPage /> },
  { key: 'how', node: <EcosystemValuePage /> },
  { key: 'about', node: <PartnersAboutPage /> },
  { key: 'ecosystem', node: <PartnersEcosystemPage /> },
  { key: 'summary', node: <EcosystemSummaryPage /> },
  { key: 'opportunity', node: <EcosystemOpportunityPage total={TOTAL} /> },
  { key: 'conclusion', node: <EcosystemConclusionPage logo={sfhLogo} url={CONTACT_URL} /> },
  { key: 'outcomes', node: <EcosystemOutcomesPage /> },
  { key: 'implementation', node: <EcosystemRoadmapPage /> },
  { key: 'next', node: <EcosystemNextStepsPage /> },
  { key: 'team', node: <EcosystemTeamPage /> },
  { key: 'ar-events', node: <PartnersARPage /> },
  { key: 'nasdaq', node: <PartnersNasdaqPage /> },
  { key: 'closing', node: <EcosystemClosingPage /> },
];
/** Back hard cover: same design as the front cover. */
PAGES.push({ key: 'back-cover', node: PAGES[0].node });

const INK = '#0f172a';

export default function EcosystemPartnersBrochure() {
  const navigate = useNavigate();
  const bookRef = useRef<any>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState({ w: 560, h: 792, spread: true });

  useEffect(() => {
    document.title = 'Ecosystem Partners × Startup Factory Hub';
    const calc = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight - 72;
      const spread = vw >= 1100;
      const maxW = spread ? (vw - 140) / 2 : vw - 24;
      const w = Math.floor(Math.min(maxW, vh / 1.414, 760));
      setSize({ w: Math.max(300, w), h: Math.max(424, Math.floor(Math.max(300, w) * 1.414)), spread });
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  const go = useCallback((dir: 1 | -1) => {
    const f = bookRef.current?.pageFlip?.();
    if (!f) return;
    dir === 1 ? f.flipNext() : f.flipPrev();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.20) 0%, transparent 60%), linear-gradient(180deg,#0b1220 0%,#111a2e 100%)' }}>
      <div className="w-full flex items-center justify-between px-4 py-1.5">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ color: INK, background: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 700 }}>
          <Home className="h-4 w-4" />Home
        </button>
        <span className="font-mono" style={{ color: '#cbd5e1', fontSize: 14, fontWeight: 700, letterSpacing: '0.2em' }}>{page + 1} / {PAGES.length}</span>
      </div>
      <div className="flex-1 flex items-center justify-center w-full gap-3 px-2">
        <button aria-label="Previous page" onClick={() => go(-1)} className="hidden sm:flex h-11 w-11 items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.9)', color: INK }}>
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div ref={boxRef} style={{ width: size.spread ? size.w * 2 : size.w, maxWidth: '100%' }}>
          {/* @ts-expect-error react-pageflip typing requires every prop */}
          <HTMLFlipBook
            key={`${size.spread}-${size.w}`}
            ref={bookRef}
            width={size.w}
            height={size.h}
            size="fixed"
            showCover
            usePortrait={!size.spread}
            mobileScrollSupport
            drawShadow={size.spread}
            flippingTime={550}
            disableFlipByClick
            onFlip={(e: any) => setPage(e.data)}
            onChangeState={(e: any) => {
              const flipping = e.data !== 'read';
              boxRef.current?.classList.toggle('apex-flipping', flipping);
              window.dispatchEvent(new CustomEvent('sfh:flip-state', { detail: { flipping } }));
            }}
          >
            {PAGES.map((p, i) => (
              <BookPage key={p.key} hard={i === 0 || i === PAGES.length - 1}>
                <div className="relative w-full h-full overflow-hidden">
                  {size.w < 560 ? (
                    /* Phone: lay the page out at the 440 phone design width, then scale to fit (same as /apex). */
                    <div style={{ width: 440, height: 440 * (size.h / size.w), transform: `scale(${size.w / 440})`, transformOrigin: 'top left' }}>
                      <div data-bp-root={i} className="relative w-full h-full">{p.node}</div>
                    </div>
                  ) : (
                    <div data-bp-root={i} className="relative w-full h-full">{p.node}</div>
                  )}
                </div>
              </BookPage>
            ))}
          </HTMLFlipBook>
        </div>
        <button aria-label="Next page" onClick={() => go(1)} className="hidden sm:flex h-11 w-11 items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.9)', color: INK }}>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <div className="flex sm:hidden gap-3 py-3">
        <button aria-label="Previous page" onClick={() => go(-1)} className="h-11 w-11 flex items-center justify-center rounded-full" style={{ background: '#ffffff', color: INK }}><ChevronLeft className="h-5 w-5" /></button>
        <button aria-label="Next page" onClick={() => go(1)} className="h-11 w-11 flex items-center justify-center rounded-full" style={{ background: '#ffffff', color: INK }}><ChevronRight className="h-5 w-5" /></button>
      </div>
    </div>
  );
}
