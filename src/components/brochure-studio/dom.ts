/**
 * DOM helpers: locate brochure pages, address elements by path, apply edits.
 * Credits: Imagine Engine Studios Corp.
 */
import type { BrochureDoc, ElEdit } from './types';

/** Pages tagged with data-bp-root win; otherwise every flipbook page counts. */
export function findRoots(): HTMLElement[] {
  const tagged = Array.from(document.querySelectorAll('[data-bp-root]')) as HTMLElement[];
  if (tagged.length) return tagged;
  return Array.from(document.querySelectorAll('.stf__item')) as HTMLElement[];
}
export const pageOf = (root: HTMLElement, all: HTMLElement[]) =>
  root.dataset.bpRoot !== undefined ? Number(root.dataset.bpRoot) : all.indexOf(root);

/** Overlay host for added items / backgrounds of one page. */
export function layerHost(root: HTMLElement): HTMLElement {
  const parent = root.dataset.bpRoot !== undefined ? root.parentElement! : root;
  let host = parent.querySelector(':scope > [data-bs-layer]') as HTMLElement | null;
  if (!host) {
    host = document.createElement('div');
    host.dataset.bsLayer = '';
    host.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:30;overflow:hidden';
    parent.appendChild(host);
  }
  return host;
}

export const pathOf = (el: Element, root: Element) => {
  const parts: number[] = [];
  let n: Element | null = el;
  while (n && n !== root) {
    const p: Element | null = n.parentElement;
    if (!p) return null;
    parts.unshift(Array.prototype.indexOf.call(p.children, n));
    n = p;
  }
  return n === root ? parts.join('.') : null;
};
export const byPath = (root: Element, path: string) => {
  let n: Element | undefined = root;
  for (const i of path ? path.split('.').map(Number) : []) n = n?.children[i];
  return (n as HTMLElement) || null;
};

const ONCE = new Set(['fade', 'up', 'reveal']);
export const animCss = (a?: string) =>
  !a ? '' : `bs-${a} ${ONCE.has(a) ? '1s ease both' : a === 'spin' ? '8s linear infinite' : '2.4s ease-in-out infinite'}`;

function restore(el: HTMLElement) {
  if (el.dataset.bsCss !== undefined) el.style.cssText = el.dataset.bsCss;
  if (el.dataset.bpOrig !== undefined && el.childElementCount === 0) el.textContent = el.dataset.bpOrig;
}

function applyOne(el: HTMLElement, e: ElEdit) {
  if (el.dataset.bsCss === undefined) el.dataset.bsCss = el.style.cssText;
  if (el.dataset.bpOrig === undefined && el.childElementCount === 0) el.dataset.bpOrig = el.textContent || '';
  el.style.cssText = el.dataset.bsCss;
  el.dataset.bsEdited = '';
  if (e.text !== undefined && el.childElementCount === 0) el.textContent = e.text;
  if (e.color) { el.style.color = e.color; el.style.webkitTextFillColor = e.color; el.style.backgroundImage = 'none'; }
  if (e.bg) el.style.background = e.bg;
  if (e.hidden) el.style.display = 'none';
  if (e.fontSize) el.style.fontSize = `${e.fontSize}px`;
  if (e.opacity !== undefined) el.style.opacity = String(e.opacity);
  if (e.radius !== undefined) el.style.borderRadius = `${e.radius}px`;
  const t = [
    e.dx || e.dy ? `translate(${e.dx || 0}px, ${e.dy || 0}px)` : '',
    e.scale && e.scale !== 1 ? `scale(${e.scale})` : '',
    e.rot ? `rotate(${e.rot}deg)` : '',
  ].filter(Boolean).join(' ');
  if (t) { el.style.transform = t; el.style.transformOrigin = 'center'; }
  if (e.anim) el.style.animation = animCss(e.anim);
}

export function applyEdits(doc: BrochureDoc) {
  const all = findRoots();
  document.querySelectorAll('[data-bs-edited]').forEach((n) => { restore(n as HTMLElement); delete (n as HTMLElement).dataset.bsEdited; });
  for (const root of all) {
    const pg = pageOf(root, all);
    for (const [key, e] of Object.entries(doc.edits)) {
      const [p, path] = key.split(':');
      if (Number(p) !== pg) continue;
      const el = byPath(root, path);
      if (el) applyOne(el, e);
    }
  }
}

export const STUDIO_CSS = `
@keyframes bs-fade{from{opacity:0}to{opacity:1}}
@keyframes bs-up{from{opacity:0;translate:0 26px}to{opacity:1;translate:0 0}}
@keyframes bs-reveal{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
@keyframes bs-pulse{50%{scale:1.07}}
@keyframes bs-float{50%{translate:0 -9px}}
@keyframes bs-glow{50%{filter:drop-shadow(0 0 14px rgba(168,85,247,.9))}}
@keyframes bs-spin{to{rotate:360deg}}
.bs-editing [data-bp-root] *, .bs-editing .stf__item *{cursor:pointer}
.bs-editing [data-bp-root] *:hover, .bs-editing .stf__item *:hover{outline:1px dashed rgba(168,85,247,.7)}
.bs-sel{outline:2px solid #a855f7 !important;outline-offset:2px}
`;
