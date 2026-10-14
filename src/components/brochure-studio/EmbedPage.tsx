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
    const fit = () => {
      if (!target) return;
      const w = target.offsetWidth || 1, h = target.offsetHeight || 1;
      const s = Math.min(window.innerWidth / w, window.innerHeight / h);
      target.style.setProperty('left', '0px', 'important');
      target.style.setProperty('top', '0px', 'important');
      target.style.setProperty('transform', `scale(${s})`, 'important');
      // Correct for transformed ancestors that re-anchor fixed positioning.
      const r = target.getBoundingClientRect();
      const ox = (window.innerWidth - w * s) / 2 - r.left, oy = (window.innerHeight - h * s) / 2 - r.top;
      target.style.setProperty('left', `${ox}px`, 'important');
      target.style.setProperty('top', `${oy}px`, 'important');
    };
    const tick = () => {
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
    return () => { clearInterval(iv); window.removeEventListener('resize', fit); style.remove(); document.documentElement.classList.remove('bs-embed'); };
  }, []);
  return null;
}
