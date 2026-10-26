// @ts-nocheck -- VoiceCall v2 session: the call lives OUTSIDE the UI.
/**
 * Founder direction 2026-10-26: run the conversation separately from
 * the visual experience — panels open and close, she walks the 3D
 * office, and the call must not stutter, lag the scene, or die with
 * a panel.
 *
 * So the call is owned by this module-level session, never by a React
 * component: the engine, the speech worker, the mic session and the
 * playback all live here. Surfaces (AgentChat, the Genius bubble)
 * merely SUBSCRIBE to a view of the call and register a `deliver`
 * callback for the transcript. Unmounting a surface changes nothing.
 * A small always-mounted pill (VoiceCallPill) mirrors the call
 * anywhere in the app so it can be interrupted or ended even with
 * every panel closed.
 *
 * Inference stays in the speech worker (never the render thread);
 * this session's own per-frame cost is zero — it only moves on call
 * events.
 */
import { VoiceCallEngine, type BrainPort, type CallState, type MicCapture, type MicPort, type Turn } from "./engine";
import { MicRecorder, micErrorMessage } from "./recorder";
import { blobToPcm16k } from "./whisper";
import { WorkerStt, WorkerTts } from "./adapters";
import { personaFor } from "./tts";
import { speechClient } from "./speechClient";
import { getVoiceModel, whisperModelId } from "./modelSetting";

/* ---------------- MicPort over MicRecorder ----------------
 * One session stream is held for the whole call (acquired inside the
 * starting tap — the iOS rule — and released when the call ends);
 * each listenOnce runs a fresh recorder on it with the v1-proven
 * endpointing (heard-speech gate, silence end, no-speech recycle). */
export class RecorderMic implements MicPort {
  private stream: MediaStream | null = null;
  private rec: MicRecorder | null = null;

  constructor(private silenceMs: number) {}

  async acquire(): Promise<void> {
    if (!this.stream) {
      try {
        this.stream = await MicRecorder.acquire();
      } catch (e) {
        throw new Error(micErrorMessage(e));
      }
    }
  }

  release(): void {
    MicRecorder.release(this.stream);
    this.stream = null;
  }

  async listenOnce(signal: AbortSignal): Promise<MicCapture> {
    if (signal.aborted) throw new Error("aborted");
    await this.acquire();
    const rec = new MicRecorder();
    this.rec = rec;
    const stream = this.stream!;
    return new Promise<MicCapture>((resolve, reject) => {
      let settled = false;
      const onAbort = () => {
        if (settled) return;
        settled = true;
        rec.cancel();
        reject(new Error("aborted"));
      };
      signal.addEventListener("abort", onAbort, { once: true });
      rec.start({
        stream,
        autoStopSilenceMs: this.silenceMs,
        noSpeechMs: 20_000,
        maxMs: 45_000,
        onAutoStop: (reason) => {
          if (settled) return;
          settled = true;
          signal.removeEventListener("abort", onAbort);
          void (async () => {
            try {
              const blob = await rec.stop();
              const audio = reason === "no-speech" ? new Float32Array(0) : await blobToPcm16k(blob);
              resolve({ audio, reason });
            } catch (e) {
              reject(e instanceof Error ? e : new Error(String(e)));
            }
          })();
        },
      }).catch((e) => {
        if (!settled) {
          settled = true;
          signal.removeEventListener("abort", onAbort);
          reject(new Error(micErrorMessage(e)));
        }
      });
    });
  }

  cancel(): void {
    this.rec?.cancel();
    this.rec = null;
  }
}

/* ---------------- View ---------------- */

export interface CallView {
  active: boolean;
  surfaceId: string | null;
  roleText: string;
  state: CallState;
  loadPct: number | null;
  statusText: string;
  /** Why the last call died (founder report 2026-10-26: a call that
   * failed at startup vanished without a word). Set when the session
   * lands in the error state; the pill keeps it on screen until the
   * user dismisses it or starts a new call. */
  errorText: string | null;
}

export function callStatusText(state: CallState, loadPct: number | null, roleText: string): string {
  switch (state) {
    case "loading": return loadPct != null ? `Loading the voice model — ${loadPct}% (first time only)` : "Loading the voice model…";
    case "listening": return "Listening — speak now, then pause when you're done";
    case "transcribing": return "Transcribing…";
    case "thinking": return `${roleText} is thinking…`;
    case "speaking": return `${roleText} is speaking…`;
    default: return "";
  }
}

const IDLE_VIEW: CallView = { active: false, surfaceId: null, roleText: "", state: "idle", loadPct: null, statusText: "", errorText: null };

export interface StartCallOptions {
  surfaceId: string;
  roleText: string;
  brain: BrainPort;
  deliver: (turns: Turn[]) => void;
  silenceMs?: number;
}

/** Live text of the running call: finalized turns so far plus the
 * assistant's in-flight streaming text. A SEPARATE channel from the
 * call view — captions subscribe here, and nothing here can touch
 * the call's timing (the engine fires it without awaiting). */
export interface LiveText {
  turns: Turn[];
  assistantText: string;
}

class VoiceSession {
  private engine: VoiceCallEngine | null = null;
  private mic: RecorderMic | null = null;
  private roleText = "";
  private lastError: string | null = null;
  private view: CallView = IDLE_VIEW;
  private listeners = new Set<(v: CallView) => void>();
  private live: LiveText = { turns: [], assistantText: "" };
  private liveListeners = new Set<(t: LiveText) => void>();
  private liveTimer: ReturnType<typeof setTimeout> | null = null;

  get snapshot(): CallView {
    return this.view;
  }

  subscribe(fn: (v: CallView) => void): () => void {
    this.listeners.add(fn);
    fn(this.view);
    return () => { this.listeners.delete(fn); };
  }

  private emit(patch: Partial<CallView>) {
    this.view = { ...this.view, ...patch };
    for (const fn of Array.from(this.listeners)) {
      try { fn(this.view); } catch { /* a view's problem, not the call's */ }
    }
  }

  get liveSnapshot(): LiveText {
    return this.live;
  }

  subscribeLive(fn: (t: LiveText) => void): () => void {
    this.liveListeners.add(fn);
    fn(this.live);
    return () => { this.liveListeners.delete(fn); };
  }

  private emitLive() {
    for (const fn of Array.from(this.liveListeners)) {
      try { fn(this.live); } catch { /* a view's problem, not the call's */ }
    }
  }

  /** Streaming deltas arrive per token; captions re-render at most
   * every 120ms regardless — bounded cost, invisible to the call. */
  private emitLiveThrottled() {
    if (this.liveTimer) return;
    this.liveTimer = setTimeout(() => {
      this.liveTimer = null;
      this.emitLive();
    }, 120);
  }

  /** Start the (single) call. Throws a mic error the caller can show.
   * Returns false when a call is already running. */
  async start(opts: StartCallOptions): Promise<boolean> {
    if (this.engine) return false;
    /* 480ms of silence PROPOSES an endpoint (was 900, then 650):
     * the engine's completeness gate judges the transcript — a
     * complete sentence is answered immediately, an unfinished one
     * gets continuation windows instead of a cutoff (speed research
     * 2026-10-26 §4: two-gate endpointing, founder report "sometimes
     * cuts too fast"). */
    const mic = new RecorderMic(opts.silenceMs ?? 480);
    await mic.acquire(); // inside the caller's tap gesture
    this.mic = mic;
    this.roleText = opts.roleText;
    const engine = new VoiceCallEngine(
      { mic, stt: new WorkerStt(), brain: opts.brain, tts: new WorkerTts(personaFor(opts.roleText)) },
      {
        onState: (s, detail) => {
          const n = s === "loading" && detail ? Number(detail) : NaN;
          const loadPct = Number.isFinite(n) ? n : null;
          if (s === "error") this.lastError = detail && Number.isNaN(Number(detail)) ? detail : "The call ran into a problem.";
          this.emit({ state: s, loadPct, statusText: callStatusText(s, loadPct, this.roleText) });
          if (s === "ended" || s === "error") this.cleanup();
        },
        onTurn: (turn) => {
          this.live = {
            turns: [...this.live.turns, turn],
            assistantText: turn.role === "assistant" ? "" : this.live.assistantText,
          };
          this.emitLive();
        },
        onAssistantDelta: (fullText) => {
          this.live = { turns: this.live.turns, assistantText: fullText };
          this.emitLiveThrottled();
        },
        onEnd: (log) => { opts.deliver(log); },
      },
    );
    this.engine = engine;
    this.live = { turns: [], assistantText: "" };
    this.emitLive();
    this.emit({ active: true, surfaceId: opts.surfaceId, roleText: opts.roleText, state: "loading", loadPct: 0, statusText: callStatusText("loading", 0, opts.roleText), errorText: null });
    void engine.start();
    return true;
  }

  interrupt(): void {
    this.engine?.interrupt();
  }

  end(): void {
    this.engine?.stop();
  }

  /** Dismiss the kept error notice (the pill's button). */
  clearError(): void {
    if (!this.view.active && this.view.state === "error") {
      this.view = IDLE_VIEW;
      for (const fn of Array.from(this.listeners)) {
        try { fn(this.view); } catch { /* ignore */ }
      }
    }
  }

  private cleanup(): void {
    this.engine = null;
    this.mic?.release();
    this.mic = null;
    if (this.liveTimer) { clearTimeout(this.liveTimer); this.liveTimer = null; }
    this.live = { turns: [], assistantText: "" };
    this.emitLive();
    /* A call that ERRORED keeps its reason on screen (in the pill)
     * instead of vanishing silently; a clean end returns to idle. */
    const err = this.lastError;
    this.lastError = null;
    this.view = err
      ? { ...IDLE_VIEW, state: "error", statusText: err, errorText: err, roleText: this.roleText }
      : IDLE_VIEW;
    for (const fn of Array.from(this.listeners)) {
      try { fn(this.view); } catch { /* ignore */ }
    }
  }
}

export const voiceSession = new VoiceSession();

/* ---------------- Warm-up ----------------
 * Boot the worker and start the STT model loading BEFORE the tap
 * (hover/focus of a Talk button), so the call's first seconds aren't
 * spent downloading and compiling. Fire-and-forget, once per page;
 * the worker caches the pipeline for the real load. */
let warmed = false;
export function warmVoice(): void {
  if (warmed) return;
  warmed = true;
  /* Ask the browser to keep the downloaded speech models on the
   * device permanently (instant-start lever 1: return visits skip
   * the ~150MB download; without persistence the browser may evict
   * them under storage pressure). */
  try { void navigator.storage?.persist?.().catch(() => {}); } catch { /* best effort */ }
  void (async () => {
    try {
      if (await speechClient.available()) {
        await speechClient.call(
          "asr.load",
          { model: whisperModelId(getVoiceModel()) },
          { timeoutMs: 120_000 },
        ).catch(() => {});
      }
    } catch { /* warm-up is an optimization, never a failure */ }
  })();
}
