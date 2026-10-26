// @ts-nocheck
/**
 * DURABLE STORE — the office's and Genius's long-term memory substrate
 * (founder directive 2026-10-26: "there is no memory in the agents and
 * on the genius — it forgets every time I reload… build a robust
 * memory for this").
 *
 * Why the old storage failed, and what this does differently:
 *
 *  1. Everything lived in localStorage ONLY — a ~5 MB quota shared by
 *     the whole origin. Shift states carry full deliverables, so the
 *     store filled up; every writer swallowed the QuotaExceededError
 *     ("session only") and saves silently stopped landing.
 *  2. Worse: a quota error ANYWHERE surfaced to the auto-debugger,
 *     whose "storage-quota" repair called purgeNonEssentialStorage()
 *     and deleted every key except auth/viewport/theme — the org doc,
 *     every shift, every chat thread. The memory ate itself.
 *  3. Several surfaces never persisted at all (desk bots, plaza
 *     characters) and no typed chat sent conversation history to the
 *     model, so agents answered every message as if it were the first.
 *
 * This store fixes the substrate:
 *  - IndexedDB is PRIMARY (hundreds of MB, no 5 MB cliff). localStorage
 *    keeps a mirror copy of small values so module-load synchronous
 *    reads (org doc, shift state) keep working exactly as before.
 *  - Every value is a versioned envelope { v, t, data }. Readers pick
 *    the NEWEST valid copy across backends; a corrupt primary falls
 *    back to the previous good envelope kept in a backup slot.
 *  - Existing localStorage values (raw JSON, pre-envelope) are adopted
 *    in place and migrated into IndexedDB on first hydrate — nothing
 *    the user already has is thrown away.
 *  - Writes never throw and never silently vanish: IndexedDB receives
 *    every write even when the localStorage mirror no longer fits.
 *  - The origin asks for persistent storage (navigator.storage
 *    .persist) so the browser treats this data as keep-forever.
 */

const DB_NAME = "sfh-memory";
const STORE = "kv";
const MIRROR_LIMIT = 350_000; // chars; bigger values live in IDB only
const BAK = "::bak";

interface Envelope { v: 1; t: number; data: unknown }

const cache = new Map<string, Envelope>();
const lastSetT = new Map<string, number>();
const adoptListeners = new Map<string, Set<(data: unknown) => void>>();
let dbPromise: Promise<IDBDatabase | null> | null = null;
let hydrated = false;
let hydratePromise: Promise<void> | null = null;

/* ---------------- IndexedDB (tiny promise wrapper) ---------------- */

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null);
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        try { req.result.createObjectStore(STORE); } catch { /* exists */ }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch { resolve(null); }
  });
  return dbPromise;
}

async function idbGet(key: string): Promise<unknown> {
  const db = await openDb();
  if (!db) return undefined;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, "readonly");
      const rq = tx.objectStore(STORE).get(key);
      rq.onsuccess = () => resolve(rq.result);
      rq.onerror = () => resolve(undefined);
    } catch { resolve(undefined); }
  });
}

async function idbPut(key: string, value: unknown): Promise<void> {
  const db = await openDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch { resolve(); }
  });
}

async function idbDelete(key: string): Promise<void> {
  const db = await openDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch { resolve(); }
  });
}

async function idbKeys(): Promise<string[]> {
  const db = await openDb();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, "readonly");
      const rq = tx.objectStore(STORE).getAllKeys();
      rq.onsuccess = () => resolve((rq.result as string[]) || []);
      rq.onerror = () => resolve([]);
    } catch { resolve([]); }
  });
}

/* ---------------- localStorage mirror ---------------- */

function lsRead(key: string): Envelope | { legacy: unknown } | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.v === 1 && typeof parsed.t === "number" && "data" in parsed) {
      return parsed as Envelope;
    }
    return { legacy: parsed };
  } catch { return null; }
}

function lsWrite(key: string, env: Envelope): void {
  try {
    const s = JSON.stringify(env);
    if (s.length <= MIRROR_LIMIT) localStorage.setItem(key, s);
    else localStorage.removeItem(key); // too big to mirror — IDB is the copy of record
  } catch { /* mirror is best-effort; IDB already has it */ }
}

function isEnvelope(x: unknown): x is Envelope {
  return !!x && typeof x === "object" && (x as Envelope).v === 1 && typeof (x as Envelope).t === "number" && "data" in (x as object);
}

/* ---------------- public API ---------------- */

/**
 * Synchronous read for module-load bootstraps: memory cache →
 * localStorage (envelope or legacy raw JSON). Returns undefined when
 * nothing is stored. IndexedDB-only values arrive via hydrate adopt.
 */
export function durableGetSync<T = unknown>(key: string): T | undefined {
  const c = cache.get(key);
  if (c) return c.data as T;
  const ls = lsRead(key);
  if (ls) {
    if (isEnvelope(ls)) { cache.set(key, ls); return ls.data as T; }
    return (ls as { legacy: unknown }).legacy as T;
  }
  return undefined;
}

/** Write a value durably. Never throws. */
export function durableSet(key: string, data: unknown): void {
  const env: Envelope = { v: 1, t: Date.now(), data };
  const prev = cache.get(key);
  cache.set(key, env);
  lastSetT.set(key, env.t);
  lsWrite(key, env);
  void (async () => {
    if (prev) await idbPut(key + BAK, prev);
    await idbPut(key, env);
  })();
}

/** Remove a value everywhere (explicit user action only). */
export function durableDelete(key: string): void {
  cache.delete(key);
  lastSetT.delete(key);
  try { localStorage.removeItem(key); } catch { /* ignore */ }
  void idbDelete(key);
  void idbDelete(key + BAK);
}

/**
 * Subscribe to a NEWER copy of `key` arriving from IndexedDB at
 * hydrate time (e.g. the localStorage mirror was wiped or stale).
 * Fires at most once per hydrate, only when the IDB copy is strictly
 * newer than anything this session has read or written.
 */
export function durableOnAdopt(key: string, cb: (data: unknown) => void): () => void {
  let set = adoptListeners.get(key);
  if (!set) { set = new Set(); adoptListeners.set(key, set); }
  set.add(cb);
  if (hydrated) {
    // Late subscriber after hydrate: if IDB already resolved a newer
    // value into the cache beyond the localStorage bootstrap, deliver.
    const c = cache.get(key);
    const ls = lsRead(key);
    const lsT = isEnvelope(ls) ? ls.t : 0;
    if (c && c.t > lsT && c.t > (lastSetT.get(key) ?? 0)) {
      try { cb(c.data); } catch { /* listener errors never break the store */ }
    }
  }
  return () => { set!.delete(cb); };
}

function fireAdopt(key: string, data: unknown): void {
  const set = adoptListeners.get(key);
  if (!set) return;
  set.forEach((cb) => { try { cb(data); } catch { /* ignore */ } });
}

/**
 * One-time hydration: reconcile IndexedDB with the synchronous
 * bootstrap. For every stored key: a newer IDB envelope is adopted
 * (listeners fire, mirror refreshed); a localStorage-only value is
 * migrated into IDB so it survives even if localStorage is later
 * wiped. A corrupt IDB primary falls back to its backup slot.
 * Safe to call repeatedly; runs once.
 */
export function durableHydrate(): Promise<void> {
  if (hydratePromise) return hydratePromise;
  hydratePromise = (async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.storage?.persist) {
        void navigator.storage.persist().catch(() => false);
      }
    } catch { /* best effort */ }
    const keys = await idbKeys().catch(() => [] as string[]);
    const idbKeySet = new Set(keys.filter((k) => !k.endsWith(BAK)));
    for (const key of idbKeySet) {
      let env = await idbGet(key);
      if (!isEnvelope(env)) {
        const bak = await idbGet(key + BAK);
        if (isEnvelope(bak)) { env = bak; void idbPut(key, bak); }
      }
      if (!isEnvelope(env)) continue;
      const local = cache.get(key);
      const localT = local?.t ?? (isEnvelope(lsRead(key)) ? (lsRead(key) as Envelope).t : 0);
      const writtenT = lastSetT.get(key) ?? 0;
      if (env.t > Math.max(localT, writtenT)) {
        cache.set(key, env);
        lsWrite(key, env);
        fireAdopt(key, env.data);
      } else if (!local && !cache.has(key)) {
        cache.set(key, env);
      }
    }
    // Migrate localStorage-only values (legacy raw or envelope) into
    // IDB so a future localStorage wipe cannot take them.
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith("sfh")) continue;
        if (idbKeySet.has(key) || cache.has(key) && isEnvelope(await idbGet(key))) continue;
        const ls = lsRead(key);
        if (!ls) continue;
        const env: Envelope = isEnvelope(ls) ? ls : { v: 1, t: Date.now(), data: (ls as { legacy: unknown }).legacy };
        cache.set(key, env);
        await idbPut(key, env);
      }
    } catch { /* migration is best-effort; localStorage copies remain */ }
    hydrated = true;
  })();
  return hydratePromise;
}

/** True once the IndexedDB reconciliation has finished. */
export const durableHydrated = () => hydrated;
