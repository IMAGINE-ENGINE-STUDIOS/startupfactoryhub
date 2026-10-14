/**
 * Reader controls shown on every brochure: read the visible page aloud
 * (browser voice, no cost), share the link and full-screen view.
 * Adapted from Flip Builder V3's reader. Credits: Imagine Engine Studios Corp.
 */
import React, { useEffect, useState } from 'react';
import { Volume2, Pause, Share2, Maximize2, Minimize2 } from 'lucide-react';
import { toast } from 'sonner';

/** The page that takes up most of the screen right now. */
const visiblePage = (roots: HTMLElement[]) => {
  let best: HTMLElement | null = null, area = 0;
  for (const r of roots) {
    const b = r.getBoundingClientRect();
    const w = Math.max(0, Math.min(b.right, innerWidth) - Math.max(b.left, 0));
    const h = Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    if (w * h > area && getComputedStyle(r).visibility !== 'hidden') { area = w * h; best = r; }
  }
  return best;
};

export function ReaderBar({ roots }: { roots: HTMLElement[] }) {
  const [speaking, setSpeaking] = useState(false);
  const [full, setFull] = useState(false);
  useEffect(() => {
    const f = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', f);
    return () => { document.removeEventListener('fullscreenchange', f); window.speechSynthesis?.cancel(); };
  }, []);

  const read = () => {
    const synth = window.speechSynthesis;
    if (!synth) return toast.error('Reading aloud is not available in this browser.');
    if (speaking) { synth.cancel(); setSpeaking(false); return; }
    const text = (visiblePage(roots)?.innerText || '').replace(/\s+/g, ' ').trim();
    if (!text) return toast.error('Nothing to read on this page.');
    const u = new SpeechSynthesisUtterance(text.slice(0, 4000));
    u.lang = document.documentElement.lang || 'en-US';
    u.onend = u.onerror = () => setSpeaking(false);
    synth.cancel(); synth.speak(u); setSpeaking(true);
  };
  const share = async () => {
    const url = location.origin + location.pathname;
    try {
      if (navigator.share) await navigator.share({ title: document.title, url });
      else { await navigator.clipboard.writeText(url); toast.success('Link copied'); }
    } catch { /* closed */ }
  };
  const fullscreen = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.())?.catch?.(() => {});

  if (!roots.length) return null;
  const b = 'grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-white/10';
  return (
    <div className="fixed right-4 bottom-4 z-[60] flex items-center gap-1 rounded-full px-1.5 py-1"
      style={{ background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(168,85,247,0.4)', color: '#e2e8f0', backdropFilter: 'blur(10px)' }}>
      <button className={b} onClick={read} aria-label={speaking ? 'Stop reading' : 'Read this page aloud'} title={speaking ? 'Stop reading' : 'Read aloud'}>
        {speaking ? <Pause className="h-4 w-4" style={{ color: '#22d3ee' }} /> : <Volume2 className="h-4 w-4" />}
      </button>
      <button className={b} onClick={share} aria-label="Share" title="Share"><Share2 className="h-4 w-4" /></button>
      <button className={b} onClick={fullscreen} aria-label="Full screen" title="Full screen">{full ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</button>
    </div>
  );
}
