import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Global viewport persistence.
 *
 * Saves the exact window scroll position (in pixels) per route+search,
 * throttled while scrolling and flushed synchronously on pagehide /
 * beforeunload / visibilitychange. On mount or route change, restores the
 * user back to the exact pixels they were at — even after a crash, reload,
 * or accidental tab close.
 *
 * Storage key: `viewport:<pathname><search>` in localStorage.
 */
const STORAGE_PREFIX = "viewport:";
const SAVE_THROTTLE_MS = 150;

type Saved = { x: number; y: number; t: number };

const keyFor = (pathname: string, search: string) =>
  `${STORAGE_PREFIX}${pathname}${search || ""}`;

const safeGet = (key: string): Saved | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Saved;
    if (typeof parsed?.x !== "number" || typeof parsed?.y !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
};

const safeSet = (key: string, value: Saved) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode — ignore */
  }
};

export function useViewportPersistence() {
  const location = useLocation();
  const currentKey = keyFor(location.pathname, location.search);
  const keyRef = useRef(currentKey);
  keyRef.current = currentKey;

  // Disable the browser's built-in scroll restoration so ours is authoritative.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("scrollRestoration" in window.history) {
      const prev = window.history.scrollRestoration;
      window.history.scrollRestoration = "manual";
      return () => {
        window.history.scrollRestoration = prev;
      };
    }
  }, []);

  // Restore on mount and whenever the route changes.
  useEffect(() => {
    const saved = safeGet(currentKey);
    if (!saved) return;

    // Wait for the route's content to layout so the page is tall enough
    // to scroll to the saved Y. Retry briefly to cover lazy-loaded routes.
    let cancelled = false;
    let attempts = 0;
    const tryRestore = () => {
      if (cancelled) return;
      const maxY = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        0
      );
      const targetY = Math.min(saved.y, maxY);
      window.scrollTo({ left: saved.x, top: targetY, behavior: "auto" });
      attempts += 1;
      // If the page hasn't grown tall enough yet, try again for ~1s.
      if (attempts < 10 && Math.abs(window.scrollY - targetY) > 2 && targetY > 0) {
        setTimeout(tryRestore, 100);
      }
    };
    // Defer one frame so initial paint happens first.
    requestAnimationFrame(tryRestore);
    return () => {
      cancelled = true;
    };
  }, [currentKey]);

  // Throttled save on scroll, plus synchronous flush on unload/hide.
  useEffect(() => {
    if (typeof window === "undefined") return;

    let timeout: ReturnType<typeof setTimeout> | null = null;

    const flush = () => {
      timeout = null;
      safeSet(keyRef.current, {
        x: window.scrollX,
        y: window.scrollY,
        t: Date.now(),
      });
    };

    const onScroll = () => {
      if (timeout) return;
      timeout = setTimeout(flush, SAVE_THROTTLE_MS);
    };

    const onHide = () => {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      flush();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", onHide);
    window.addEventListener("beforeunload", onHide);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") onHide();
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("beforeunload", onHide);
      if (timeout) {
        clearTimeout(timeout);
        flush();
      }
    };
  }, []);
}

export default function ViewportPersistence() {
  useViewportPersistence();
  return null;
}
