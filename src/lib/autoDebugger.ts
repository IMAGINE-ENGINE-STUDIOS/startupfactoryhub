/**
 * Auto Debugger — keeps the user experience uninterrupted.
 *
 * Classifies runtime errors into known signatures, applies the matching repair
 * strategy automatically (silent remount, chunk cache purge, ignore-noise), and
 * keeps a rolling diagnostics log that the error screen can display.
 *
 * Strategies:
 *  - "ignore"  : known-benign noise, never surfaces to the user
 *  - "remount" : recoverable render fault, remount the tree in place
 *  - "reload"  : stale build / chunk mismatch, purge caches and reload once
 *  - "escalate": unknown fault, show the recovery console after retries
 */

export type RepairStrategy = "ignore" | "remount" | "reload" | "escalate";

export interface Diagnosis {
  id: string;
  label: string;
  strategy: RepairStrategy;
  explanation: string;
  /** Repairs the app can retry indefinitely without risking a loop. */
  safeToRepeat: boolean;
}

export interface DebugEntry {
  at: number;
  message: string;
  diagnosis: Diagnosis;
  repaired: boolean;
}

const LOG_KEY = "sfh.autodebug.log";
const RELOAD_KEY = "sfh.autodebug.reloaded";
const MAX_LOG = 25;

interface Signature {
  id: string;
  label: string;
  test: RegExp;
  strategy: RepairStrategy;
  explanation: string;
  safeToRepeat: boolean;
}

const SIGNATURES: Signature[] = [
  {
    id: "suspense-sync-input",
    label: "Route suspended during input",
    /* The decoded text AND the minified production form must both
     * match: production throws "Minified React error #426; visit
     * …invariant=426", which never contains the decoded sentence —
     * before this, every #426 fell through to "Unclassified fault"
     * and parked the user on the recovery console (founder report
     * 2026-10-26, repair histories full of held #426s). */
    test: /(component suspended while responding to synchronous input|minified react error #426|invariant=426)/i,
    strategy: "remount",
    explanation:
      "A lazily loaded screen resolved outside a transition. The view is remounted in place while the chunk finishes loading.",
    safeToRepeat: true,
  },
  {
    id: "chunk-default",
    label: "Stale build chunk (module shape)",
    /* A dead lazy chunk often surfaces as reading '.default' of
     * undefined: the SPA fallback serves the app shell for a chunk
     * the newest build replaced, so the import resolves to a module
     * with no default export. Remounting can never fix it — only
     * fetching the current build can. Must precede null-access. */
    test: /(reading 'default'|reading "default"|importing a module script failed)/i,
    strategy: "reload",
    explanation:
      "A code fragment from an older build was requested after it had been replaced. Caches are purged and the latest build is fetched once.",
    safeToRepeat: false,
  },
  {
    id: "chunk-load",
    label: "Stale build chunk",
    test: /(failed to fetch dynamically imported module|loading chunk|importing a module script failed|dynamically imported module)/i,
    strategy: "reload",
    explanation:
      "The browser held an outdated build fragment. Caches are purged and the latest build is fetched once.",
    safeToRepeat: false,
  },
  {
    id: "resize-observer",
    label: "Layout measurement noise",
    test: /resizeobserver loop/i,
    strategy: "ignore",
    explanation: "Harmless layout measurement warning emitted by the browser. Suppressed.",
    safeToRepeat: true,
  },
  {
    id: "hydration",
    label: "Render mismatch",
    test: /(hydrat|did not match|minified react error #(418|423|425))/i,
    strategy: "remount",
    explanation: "Markup drifted from the rendered tree. The affected branch is rebuilt from scratch.",
    safeToRepeat: true,
  },
  {
    id: "network",
    label: "Transient network fault",
    test: /(networkerror|failed to fetch|load failed|err_network|err_failed)/i,
    strategy: "remount",
    explanation: "A request dropped mid-flight. The view is rebuilt and the request retried.",
    safeToRepeat: true,
  },
  {
    id: "null-access",
    label: "Missing data reference",
    test: /(cannot read propert|undefined is not an object|null is not an object|is not a function)/i,
    strategy: "remount",
    explanation: "A component read data before it arrived. The branch is remounted once the data settles.",
    safeToRepeat: false,
  },
  {
    id: "storage-quota",
    label: "Local storage saturated",
    test: /(quotaexceeded|exceeded the quota)/i,
    strategy: "remount",
    explanation: "Local cache was full. Foreign cached entries are cleared automatically — your office data, chats, shifts and tasks are protected and never cleared.",
    safeToRepeat: true,
  },
];

const UNKNOWN: Diagnosis = {
  id: "unknown",
  label: "Unclassified fault",
  strategy: "escalate",
  explanation: "No known signature matched. The recovery console is offered after automatic retries.",
  safeToRepeat: false,
};

export function diagnose(error: unknown): Diagnosis {
  const message =
    error instanceof Error ? `${error.name}: ${error.message}` : String(error ?? "");
  const hit = SIGNATURES.find((s) => s.test.test(message));
  if (!hit) return UNKNOWN;
  const { test: _test, ...rest } = hit;
  return rest;
}

export function readLog(): DebugEntry[] {
  try {
    const raw = sessionStorage.getItem(LOG_KEY);
    return raw ? (JSON.parse(raw) as DebugEntry[]) : [];
  } catch {
    return [];
  }
}

export function recordRepair(error: unknown, diagnosis: Diagnosis, repaired: boolean) {
  try {
    const message = error instanceof Error ? error.message : String(error ?? "");
    const next = [{ at: Date.now(), message, diagnosis, repaired }, ...readLog()].slice(0, MAX_LOG);
    sessionStorage.setItem(LOG_KEY, JSON.stringify(next));
  } catch {
    /* logging must never break the app */
  }
}

export function clearLog() {
  try {
    sessionStorage.removeItem(LOG_KEY);
  } catch {
    /* ignore */
  }
}

/** Frees space when local storage is saturated, keeping auth data AND
 * every `sfh…` key. MEMORY PROTECTION (founder directive 2026-10-26):
 * the old keep-list protected only auth/viewport/theme, so this purge
 * deleted the org doc, every shift state and every agent chat thread
 * whenever any code anywhere hit a quota error — the office's memory
 * literally erased itself. `sfh:`/`sfh.` keys are the user's data
 * (org, shifts, threads, floors, settings) and are NEVER purged;
 * durable data additionally lives in IndexedDB (lib/durableStore),
 * which this function cannot touch. Only foreign keys are removed. */
export function purgeNonEssentialStorage() {
  try {
    const keep = /^(sb-|sfh[:.]|theme)/i;
    Object.keys(localStorage).forEach((k) => {
      if (!keep.test(k)) localStorage.removeItem(k);
    });
  } catch {
    /* ignore */
  }
}

/** Reload policy for stale-build faults (rewritten 2026-10-26 after
 * the founder's held session): the old rule allowed ONE purge+reload
 * per 10 minutes and silently did nothing after that — so on a
 * deploy-heavy day a tab rode out the first deploy, then every later
 * fault remounted a tree whose dead chunks could never load, burned
 * the error boundary's silent-recovery budget, and parked the user
 * on the recovery console. Now: a plain reload comes FIRST (it
 * re-reads the current entry, whose chunk set is consistent), caches
 * purge from the second fault on, and up to 4 automatic reloads are
 * allowed in any 10-minute window. A build that is genuinely broken
 * still stops after 4 — that is what the console is for. */
const RELOAD_WINDOW_MS = 10 * 60 * 1000;
const RELOAD_LOG_KEY = "sfh.autodebug.reloadlog";
const MAX_AUTO_RELOADS = 4;

function recentReloads(): number[] {
  try {
    const now = Date.now();
    const log = JSON.parse(sessionStorage.getItem(RELOAD_LOG_KEY) || "[]");
    return Array.isArray(log) ? log.filter((t) => typeof t === "number" && now - t < RELOAD_WINDOW_MS) : [];
  } catch {
    return [];
  }
}

async function purgeCaches(): Promise<void> {
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    const regs = (await navigator.serviceWorker?.getRegistrations?.()) ?? [];
    await Promise.all(regs.map((r) => r.unregister()));
  } catch {
    /* best effort */
  }
}

/** Reloads for a stale-build fault when the budget allows it.
 * Returns false when the budget is spent — the caller must then
 * treat the fault as unhandled (the console) instead of pretending
 * a repair is coming. */
export function reloadForStaleBuild(): boolean {
  let count = 0;
  try {
    const log = recentReloads();
    count = log.length;
    if (count >= MAX_AUTO_RELOADS) return false;
    log.push(Date.now());
    sessionStorage.setItem(RELOAD_LOG_KEY, JSON.stringify(log));
    // Keep the legacy key roughly in step for anything reading it.
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    return false;
  }
  if (count >= 1) {
    // A repeat fault inside the window: purge first, then reload.
    void purgeCaches().then(() => window.location.reload());
    window.setTimeout(() => window.location.reload(), 350);
  } else {
    window.location.reload();
  }
  return true;
}

export async function purgeCachesAndReload(): Promise<boolean> {
  if (!reloadForStaleBuild()) return false;
  return true;
}

/**
 * Applies the repair for a diagnosis outside of React state.
 * Returns true when the caller should treat the error as handled.
 */
export function applyRepair(diagnosis: Diagnosis): boolean {
  switch (diagnosis.strategy) {
    case "ignore":
      return true;
    case "reload":
      // Honest result: true only when a reload is actually happening.
      // Returning true while the old guard silently blocked the reload
      // is what burned the boundary's budget and held the session.
      return reloadForStaleBuild();
    case "remount":
      if (diagnosis.id === "storage-quota") purgeNonEssentialStorage();
      return true;
    default:
      return false;
  }
}

let installed = false;

/** Installs window-level interception so async faults never reach the user. */
export function installAutoDebugger() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const handle = (error: unknown) => {
    const d = diagnose(error);
    if (d.strategy === "escalate") return false;
    const repaired = applyRepair(d);
    recordRepair(error, d, repaired);
    return repaired;
  };

  window.addEventListener(
    "error",
    (event) => {
      const d = diagnose(event.error ?? event.message);
      if (d.strategy === "ignore" || d.strategy === "reload") {
        event.preventDefault();
        handle(event.error ?? event.message);
      }
    },
    true
  );

  window.addEventListener("unhandledrejection", (event) => {
    const d = diagnose(event.reason);
    if (d.strategy === "ignore" || d.strategy === "reload") {
      event.preventDefault();
      handle(event.reason);
    }
  });

  /* Vite fires this when a lazily loaded chunk fails to load — the
   * moment an open tab meets a build that replaced its chunks. Caught
   * here, the user never sees a fault at all: caches purge and the
   * current build loads once (guarded, never a loop). Uncaught, the
   * same failure becomes a 'default'-of-undefined crash in the error
   * boundary and a held session on the recovery console. */
  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    const payload = (event as Event & { payload?: unknown }).payload;
    recordRepair(payload ?? new Error("vite:preloadError"), diagnose(new Error("Failed to fetch dynamically imported module")), true);
    reloadForStaleBuild();
  });
}
