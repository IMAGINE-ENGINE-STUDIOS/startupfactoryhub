/**
 * Session restore
 *
 * Captures exactly where the user was (URL + scroll position) before any
 * programmatic reload or fatal error, and puts them back on the next render
 * so a crash/refresh is invisible to them.
 */

const RESTORE_KEY = "sfh.restorePoint";

export type RestorePoint = {
  url: string;
  x: number;
  y: number;
  t: number;
};

const MAX_AGE_MS = 10 * 60 * 1000;

function readStore(): RestorePoint | null {
  try {
    const raw = sessionStorage.getItem(RESTORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RestorePoint;
    if (typeof parsed?.url !== "string") return null;
    if (Date.now() - (parsed.t ?? 0) > MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Save the current URL + scroll position so it can be restored after a reload. */
export function saveRestorePoint() {
  if (typeof window === "undefined") return;
  try {
    const point: RestorePoint = {
      url: window.location.href,
      x: window.scrollX,
      y: window.scrollY,
      t: Date.now(),
    };
    sessionStorage.setItem(RESTORE_KEY, JSON.stringify(point));
  } catch {
    /* storage unavailable — ignore */
  }
}

/** Read and clear the pending restore point. */
export function consumeRestorePoint(): RestorePoint | null {
  const point = readStore();
  try {
    sessionStorage.removeItem(RESTORE_KEY);
  } catch {
    /* ignore */
  }
  return point;
}

/** Put the user back at the exact pixels they were at before a reload. */
export function applyRestorePoint() {
  if (typeof window === "undefined") return;
  const point = consumeRestorePoint();
  if (!point) return;

  let attempts = 0;
  const scroll = () => {
    const maxY = Math.max(
      document.documentElement.scrollHeight - window.innerHeight,
      0,
    );
    const targetY = Math.min(point.y, maxY);
    window.scrollTo({ left: point.x, top: targetY, behavior: "auto" });
    attempts += 1;
    if (attempts < 12 && targetY > 0 && Math.abs(window.scrollY - targetY) > 2) {
      setTimeout(scroll, 120);
    }
  };
  requestAnimationFrame(scroll);
}
