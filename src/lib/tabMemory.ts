import { useCallback, useEffect, useState } from 'react';

// Remembers the last dashboard tab for 1 hour, then forgets it.
const PREFIX = 'sfh-tab:';
const TTL = 60 * 60 * 1000;

function read(scope: string): string | null {
  try {
    const raw = localStorage.getItem(PREFIX + scope);
    if (!raw) return null;
    const v = JSON.parse(raw) as { t: string; at: number };
    if (!v?.t || Date.now() - v.at > TTL) { localStorage.removeItem(PREFIX + scope); return null; }
    return v.t;
  } catch { return null; }
}

export function useRememberedTab(scope: string, urlTab: string | null, fallback: string) {
  const [tab, setTabState] = useState<string>(() => urlTab || read(scope) || fallback);
  const setTab = useCallback((t: string) => {
    setTabState(t);
    try { localStorage.setItem(PREFIX + scope, JSON.stringify({ t, at: Date.now() })); } catch { /* ignore */ }
  }, [scope]);
  useEffect(() => { if (urlTab) setTab(urlTab); }, [urlTab, setTab]);
  return [tab, setTab] as const;
}

// Sweeps expired tab memory and stale, unrelated caches to keep browser storage light.
export function sweepStaleCaches() {
  try {
    const now = Date.now();
    const drop: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith(PREFIX)) {
        try { const v = JSON.parse(localStorage.getItem(k) || ''); if (!v?.at || now - v.at > TTL) drop.push(k); } catch { drop.push(k); }
      } else if (/^(ie-backup|ie-snap|ie-snapshot|sfh-scroll-old|lovable-|vite-)/.test(k)) {
        drop.push(k);
      }
    }
    drop.forEach((k) => localStorage.removeItem(k));
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(PREFIX)) sessionStorage.removeItem(k);
    }
  } catch { /* ignore */ }
}
