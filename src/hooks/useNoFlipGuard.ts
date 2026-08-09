import { useEffect } from 'react';

/**
 * Brochure flipbooks (react-pageflip) capture pointer drags anywhere on a page,
 * which makes form fields, buttons and profile cards flip the page instead of
 * responding. This guard stops pointer-start events from reaching the flipbook
 * whenever they originate inside an interactive element.
 *
 * Only pointer/touch "start" and "move" events are stopped — `click`, `input`
 * and `change` still bubble normally, so React handlers keep working.
 */
const INTERACTIVE_SELECTOR = [
  'input',
  'textarea',
  'select',
  'button',
  'a[href]',
  'label',
  '[contenteditable="true"]',
  '[role="button"]',
  '[role="tab"]',
  '[role="slider"]',
  '[data-no-flip]',
  'canvas',
  'iframe',
  'video',
  'model-viewer',
  '.mapboxgl-map',
].join(',');

export function useNoFlipGuard() {
  useEffect(() => {
    const stop = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest) return;
      // Only guard events that happen inside a flipbook page.
      if (!target.closest('.stf__parent')) return;
      if (!target.closest(INTERACTIVE_SELECTOR)) return;
      e.stopPropagation();
    };

    const events = ['pointerdown', 'mousedown', 'touchstart', 'touchmove', 'pointermove'];
    events.forEach((name) =>
      document.addEventListener(name, stop, { capture: true, passive: true })
    );
    return () => {
      events.forEach((name) =>
        document.removeEventListener(name, stop, { capture: true } as EventListenerOptions)
      );
    };
  }, []);
}

/** True when the user is typing, so arrow keys should not turn pages. */
export function isTypingTarget(el: EventTarget | null) {
  const node = el as HTMLElement | null;
  if (!node || !(node as any).tagName) return false;
  const tag = node.tagName.toLowerCase();
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    node.isContentEditable === true
  );
}
