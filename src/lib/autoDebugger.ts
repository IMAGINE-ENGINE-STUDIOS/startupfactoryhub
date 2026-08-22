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
    test: /component suspended while responding to synchronous input/i,
    strategy: "remount",
    explanation:
      "A lazily loaded screen resolved outside a transition. The view is remounted in place while the chunk finishes loading.",
    safeToRepeat: true,
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
    explanation: "Local cache was full. Non-essential cached entries are cleared automatically.",
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

/** Frees space when local storage is saturated, keeping auth + viewport data. */
export function purgeNonEssentialStorage() {
  try {
    const keep = /^(sb-|sfh\.viewport|sfh\.restore|theme)/;
    Object.keys(localStorage).forEach((k) => {
      if (!keep.test(k)) localStorage.removeItem(k);
    });
  } catch {
    /* ignore */
  }
}

/** Purges build caches and reloads once — guarded so it can never loop. */
export async function purgeCachesAndReload(): Promise<boolean> {
  try {
    if (sessionStorage.getItem(RELOAD_KEY)) return false;
    sessionStorage.setItem(RELOAD_KEY, "1");
  } catch {
    return false;
  }
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
  window.location.reload();
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
      void purgeCachesAndReload();
      return true;
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
}
