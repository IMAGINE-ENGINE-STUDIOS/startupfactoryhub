// @ts-nocheck -- VoiceCall v2 speech worker client.
/**
 * Main-thread RPC client for speechWorker.ts. One lazily spawned
 * worker, promise-per-request, per-call timeouts, progress fan-out.
 *
 * Failure doctrine: if the worker cannot boot (bundle problem, old
 * browser), errors, or ever stops answering, this client marks itself
 * dead and every caller falls back to the in-thread implementations —
 * the call gets slower, never broken, and the fallback is visible in
 * the adapter state rather than silent.
 */

type ProgressCb = (which: "asr" | "tts", pct: number) => void;

interface Pending {
  resolve: (v: any) => void;
  reject: (e: Error) => void;
  timer: ReturnType<typeof setTimeout> | null;
  progressCb: ProgressCb | null;
}

class SpeechClient {
  private worker: Worker | null = null;
  private seq = 0;
  private pending = new Map<number, Pending>();
  private progressSubs = new Set<ProgressCb>();
  private dead = false;
  private availableCache: Promise<boolean> | null = null;

  private ensureWorker(): Worker | null {
    if (this.dead) return null;
    if (this.worker) return this.worker;
    try {
      const w = new Worker(new URL("./speechWorker.ts", import.meta.url), { type: "module" });
      w.onmessage = (e: MessageEvent) => {
        const msg = e.data || {};
        if (msg.kind === "progress") {
          for (const cb of Array.from(this.progressSubs)) {
            try { cb(msg.which, msg.pct); } catch { /* subscriber's problem */ }
          }
          for (const p of Array.from(this.pending.values())) {
            if (p.progressCb) { try { p.progressCb(msg.which, msg.pct); } catch { /* ignore */ } }
          }
          return;
        }
        const p = this.pending.get(msg.id);
        if (!p) return;
        this.pending.delete(msg.id);
        if (p.timer) clearTimeout(p.timer);
        if (msg.ok) p.resolve(msg.value);
        else p.reject(new Error(msg.error || "Speech worker error"));
      };
      w.onerror = () => this.kill("The speech worker crashed.");
      w.onmessageerror = () => this.kill("The speech worker stopped answering.");
      this.worker = w;
      return w;
    } catch {
      this.dead = true;
      return null;
    }
  }

  private kill(reason: string) {
    this.dead = true;
    try { this.worker?.terminate(); } catch { /* already gone */ }
    this.worker = null;
    const err = new Error(reason);
    for (const p of Array.from(this.pending.values())) {
      if (p.timer) clearTimeout(p.timer);
      p.reject(err);
    }
    this.pending.clear();
  }

  /** Boot check (cached): can the worker answer a ping in time? */
  available(): Promise<boolean> {
    if (!this.availableCache) {
      this.availableCache = (async () => {
        try {
          await this.call("ping", {}, { timeoutMs: 8_000 });
          return true;
        } catch {
          return false;
        }
      })();
    }
    return this.availableCache;
  }

  onProgress(cb: ProgressCb): () => void {
    this.progressSubs.add(cb);
    return () => { this.progressSubs.delete(cb); };
  }

  call(
    kind: string,
    payload: Record<string, any>,
    opts: { timeoutMs?: number; transfer?: Transferable[]; onProgress?: ProgressCb } = {},
  ): Promise<any> {
    const w = this.ensureWorker();
    if (!w) return Promise.reject(new Error("Speech worker unavailable"));
    const id = ++this.seq;
    const timeoutMs = opts.timeoutMs ?? 60_000;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Speech worker ${kind} timed out`));
        // A timeout means SLOW, not necessarily wedged (a cold model
        // load on one thread starves everything behind it). Killing
        // the worker here once turned a slow start into a main-thread
        // fallback collapse — so verify the wedge with a ping first:
        // alive-but-slow workers are left alone to finish.
        if (kind !== "ping") {
          void this.call("ping", {}, { timeoutMs: 5_000 }).catch(() => {
            this.kill("The speech worker stopped answering.");
            this.availableCache = Promise.resolve(false);
          });
        }
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer, progressCb: opts.onProgress || null });
      try {
        w.postMessage({ id, kind, payload }, opts.transfer || []);
      } catch (e) {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    });
  }
}

export const speechClient = new SpeechClient();
