/**
 * Embed mode: shows exactly one brochure page filling the window
 * (?bsEmbed=<page>), or reports the page count to the parent (?bsCount=1).
 * Used by the page library and by pages inserted into other brochures.
 * Credits: Imagine Engine Studios Corp.
 */
import { useEffect } from 'react';
import { findRoots, pageOf } from './dom';

const CSS = `
html.bs-embed, html.bs-embed body{overflow:hidden!important;background:#0b1220!important}
html.bs-embed body *{visibility:hidden}
html.bs-embed .bs-embed-target, html.bs-embed .bs-embed-target *{visibility:visible}
html.bs-embed .bs-embed-target{display:block!important;position:fixed!important;z-index:2147483000!important;transform-origin:0 0!important;opacity:1!important;clip-path:none!important}
`;

export default function EmbedPage() {
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const count = q.has('bsCount');
    const want = Number(q.get('bsEmbed') || 0);
    const style = document.createElement('style'); style.textContent = CSS;
    if (!count) { document.head.appendChild(style); document.documentElement.classList.add('bs-embed'); }
    let target: HTMLElement | null = null;
    let sent = false;
    // The flipbook rewrites page inline styles, so placement lives in a stylesheet rule.
    const place = document.createElement('style');
    if (!count) document.head.appendChild(place);
    const fit = () => {
      if (!target) return;
      const book = target.closest('.stf__parent') as HTMLElement | null;
      const bw = book?.offsetWidth || 600, bh = book?.offsetHeight || 848;
      const w = bw / bh > 1 ? bw / 2 : bw, h = bh;
      const s = Math.min(window.innerWidth / w, window.innerHeight / h);
      const set = (l: number, t: number) => { place.textContent = `html.bs-embed .bs-embed-target{width:${w}px!important;height:${h}px!important;left:${l}px!important;top:${t}px!important;transform:scale(${s})!important}`; };
      set(0, 0);
      // Correct for transformed ancestors that re-anchor fixed positioning.
      const r = target.getBoundingClientRect();
      set((window.innerWidth - w * s) / 2 - r.left, (window.innerHeight - h * s) / 2 - r.top);
    };
    // Previews and inserted pages stay silent: no brochure music.
    const hush = () => document.querySelectorAll('audio, video').forEach((m) => { const el = m as HTMLMediaElement; el.muted = true; if (el.tagName === 'AUDIO' && !el.paused) el.pause(); });
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) { this.muted = true; if (this.tagName === 'AUDIO') return Promise.resolve(); return play.call(this); };
    const tick = () => {
      hush();
      const roots = findRoots();
      if (!roots.length) return;
      if (count) {
        if (!sent) { sent = true; window.parent.postMessage({ bsCount: roots.length, path: window.location.pathname }, window.location.origin); }
        return;
      }
      const root = roots.find((r) => pageOf(r, roots) === want);
      const t = (root?.closest('.stf__item') as HTMLElement | null) || root || null;
      if (t && t !== target) {
        target?.classList.remove('bs-embed-target');
        target = t; t.classList.add('bs-embed-target');
      }
      fit();
    };
    const iv = setInterval(tick, 400); tick();
    window.addEventListener('resize', fit);
    return () => { clearInterval(iv); window.removeEventListener('resize', fit); style.remove(); place.remove(); document.documentElement.classList.remove('bs-embed'); };
  }, []);
  return null;
}
