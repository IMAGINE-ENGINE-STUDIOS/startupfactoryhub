import { useCallback, useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const POLL_INTERVAL_MS = 60_000;

function getCurrentEntryScript(): string | null {
  const scripts = Array.from(
    document.querySelectorAll<HTMLScriptElement>('script[type="module"][src]'),
  );
  const entry = scripts.find((script) => script.src.includes("/assets/"));
  return entry ? new URL(entry.src, window.location.origin).pathname : null;
}

function extractEntryScript(html: string): string | null {
  const match = html.match(/<script[^>]+type="module"[^>]+src="([^"]*\/assets\/[^"]+)"/i);
  return match ? match[1] : null;
}

const UpdateAvailableBubble = () => {
  const [updateReady, setUpdateReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const hardRefresh = useCallback(async () => {
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.update()));
      }
    } catch {
      // Ignore cleanup errors — the reload below is what matters.
    }

    const url = new URL(window.location.href);
    url.searchParams.set("_v", Date.now().toString(36));
    window.location.replace(url.toString());
  }, []);

  useEffect(() => {
    if (!import.meta.env.PROD) return;

    let cancelled = false;
    const currentEntry = getCurrentEntryScript();

    const checkForUpdate = async () => {
      if (document.visibilityState === "hidden") return;

      try {
        const response = await fetch(`/index.html?_check=${Date.now()}`, {
          cache: "no-store",
          headers: { "cache-control": "no-cache" },
        });
        if (!response.ok) return;

        const html = await response.text();
        const latestEntry = extractEntryScript(html);

        if (!cancelled && currentEntry && latestEntry && latestEntry !== currentEntry) {
          // Auto-load the new version once per detected build; if that already
          // happened in this tab, fall back to the manual refresh bubble.
          let alreadyAuto = false;
          try {
            alreadyAuto = sessionStorage.getItem(AUTO_RELOAD_KEY) === latestEntry;
            sessionStorage.setItem(AUTO_RELOAD_KEY, latestEntry);
          } catch {
            alreadyAuto = true;
          }

          if (!alreadyAuto) {
            void hardRefresh();
            return;
          }

          setUpdateReady(true);
        }
      } catch {
        // Offline or transient failure — try again on the next tick.
      }
    };

    const interval = window.setInterval(checkForUpdate, POLL_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void checkForUpdate();
    };
    document.addEventListener("visibilitychange", onVisible);
    void checkForUpdate();

    // Also react to a freshly installed service worker version.
    let onUpdateFound: (() => void) | undefined;
    let registrationRef: ServiceWorkerRegistration | undefined;
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.getRegistration().then((registration) => {
        if (!registration || cancelled) return;
        registrationRef = registration;
        onUpdateFound = () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              setUpdateReady(true);
            }
          });
        };
        registration.addEventListener("updatefound", onUpdateFound);
      });
    }

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      if (registrationRef && onUpdateFound) {
        registrationRef.removeEventListener("updatefound", onUpdateFound);
      }
    };
  }, []);

  if (!updateReady || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[9999] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0">
      <div className="tech-card border-0 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-lg">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15">
          <RefreshCw className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">New version available</p>
          <p className="text-xs text-muted-foreground">
            You're viewing a cached older version. Refresh to load the latest.
          </p>
        </div>
        <Button size="sm" className="shrink-0 hover-glow" onClick={() => void hardRefresh()}>
          Refresh
        </Button>
        <button
          type="button"
          aria-label="Dismiss update notice"
          className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default UpdateAvailableBubble;
