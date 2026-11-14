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

const LOREM = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(' ');

/** Design-only template mode (?bsTemplate=1): keep the page's layout,
 *  colors and shapes, but replace every real word with lorem ipsum and
 *  remove logo images, so the design can be reused without its content. */
function scrubTemplate(target: HTMLElement) {
  let n = 0;
  target.querySelectorAll('*').forEach((el) => {
    const h = el as HTMLElement;
    if (h.tagName === 'IMG') {
      const im = h as HTMLImageElement;
      if (/logo|apex/i.test(im.src) || /logo|apex/i.test(im.alt || '')) h.style.display = 'none';
      return;
    }
    if (h.childElementCount > 0 || h.dataset.bsLorem !== undefined) return;
    const text = (h.textContent || '').trim();
    if (!text) return;
    h.dataset.bsLorem = '';
    const words = Math.max(1, Math.round(text.length / 6));
    let out = '';
    for (let i = 0; i < words; i++) out += (i ? ' ' : '') + LOREM[(n + i) % LOREM.length];
    n += words;
    h.textContent = text.length <= 3 ? out : out.charAt(0).toUpperCase() + out.slice(1);
  });
}

export default function EmbedPage() {
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const count = q.has('bsCount');
    const template = q.has('bsTemplate');
    const want = Number(q.get('bsEmbed') || 0);
    const style = document.createElement('style'); style.textContent = CSS;
    if (!count) { document.head.appendChild(style); document.documentElement.classList.add('bs-embed'); }
    let target: HTMLElement | null = null;
    let sentN = -1;
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
    let lastN = -1, stableTicks = 0;
    const tick = () => {
      hush();
      const roots = findRoots();
      if (!roots.length) return;
      if (count) {
        // Report only a STABLE count: flipbooks mount their pages
        // progressively, and latching the first partial number (the old
        // behaviour) cached wrong page counts. Re-report if the count
        // later grows; the parent keeps the latest.
        if (roots.length === lastN) stableTicks++; else { lastN = roots.length; stableTicks = 0; }
        if (stableTicks >= 1 && lastN !== sentN) { sentN = lastN; window.parent.postMessage({ bsCount: lastN, path: window.location.pathname }, window.location.origin); }
        return;
      }
      const root = roots.find((r) => pageOf(r, roots) === want);
      const t = (root?.closest('.stf__item') as HTMLElement | null) || root || null;
      if (t && t !== target) {
        target?.classList.remove('bs-embed-target');
        target = t; t.classList.add('bs-embed-target');
      }
      if (template && target) scrubTemplate(target);
      fit();
    };
    const iv = setInterval(tick, 400); tick();
    window.addEventListener('resize', fit);
    return () => { clearInterval(iv); window.removeEventListener('resize', fit); style.remove(); place.remove(); document.documentElement.classList.remove('bs-embed'); };
  }, []);
  return null;
}
