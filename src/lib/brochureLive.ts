import { useEffect, useRef, type RefObject } from 'react';

/**
 * Live-room bridge for brochure pages.
 *
 * When a brochure is presented on a live video stage it renders inside an
 * iframe in the room. This hook connects the flipbook to that room:
 *  - every page flip the LOCAL user makes is reported to the parent frame
 *    ('sfh-brochure-page'), so the room can sync (presenter) or track
 *    divergence (everyone else);
 *  - 'sfh-brochure-goto' commands from the parent flip this book WITHOUT
 *    being reported back — a viewer following the presenter never echoes,
 *    and a viewer browsing on their own is never disturbed, because goto
 *    commands are only sent by the room to followers who are in sync.
 *
 * Standalone (no parent frame) the hook is inert.
 */
export function useBrochureLiveBridge(bookRef: RefObject<{ pageFlip?: () => { flip: (n: number) => void; getCurrentPageIndex: () => number } } | null>) {
  const applying = useRef(false);
  const pageRef = useRef(0);

  useEffect(() => {
    if (window.parent === window) return;
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const d = e.data as { t?: string; page?: number } | null;
      if (!d || typeof d !== 'object') return;
      if (d.t === 'sfh-brochure-goto' && typeof d.page === 'number') {
        try {
          const pf = bookRef.current?.pageFlip?.();
          if (pf && pf.getCurrentPageIndex() !== d.page) { applying.current = true; pf.flip(d.page); }
        } catch { /* flipbook not ready */ }
      } else if (d.t === 'sfh-brochure-hello') {
        window.parent.postMessage({ t: 'sfh-brochure-page', page: pageRef.current }, window.location.origin);
      }
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ t: 'sfh-brochure-ready', page: 0 }, window.location.origin);
    return () => window.removeEventListener('message', onMsg);
  }, [bookRef]);

  /** Call from the flipbook's onFlip. Programmatic (goto) flips are swallowed. */
  const reportPage = (page: number) => {
    if (typeof page === 'number') pageRef.current = page;
    if (applying.current) { applying.current = false; return; }
    if (window.parent !== window) window.parent.postMessage({ t: 'sfh-brochure-page', page: pageRef.current }, window.location.origin);
  };

  return { reportPage };
}
