// @ts-nocheck -- VoiceCall v2 React binding.
/**
 * Thin React binding over VoiceCallEngine: owns the React state, the
 * microphone session (acquired INSIDE the tap — iOS Safari refuses
 * getUserMedia that trails a long await), and the engine lifecycle.
 * All conversation logic lives in engine.ts; this file only adapts.
 *
 * Tap semantics (founder's model of a call):
 *  - tap while off -> start the call
 *  - tap while the agent is speaking/thinking -> interrupt (barge-in)
 *  - tap while on otherwise -> end the call; the transcript is
 *    delivered through onEnd exactly once
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { VoiceCallEngine, type BrainPort, type CallState, type MicPort, type MicCapture, type Turn } from "./engine";
import { MicRecorder, micErrorMessage } from "./recorder";
import { blobToPcm16k } from "./whisper";
import { WorkerStt, WorkerTts } from "./adapters";
import { personaFor } from "./tts";

/* MicPort over MicRecorder: one session stream is held for the whole
 * call (acquired in the tap, released when the call ends); each
 * listenOnce runs a fresh recorder on that stream with the v1-proven
 * endpointing (heard-speech gate, silence end, no-speech recycle). */
class RecorderMic implements MicPort {
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

export interface UseVoiceCallOptions {
  /** Display name for status text ("Genius", an agent name…). */
  roleText: string;
  /** The conversation brain; null while resolving or when unavailable. */
  brain: BrainPort | null;
  /** Why Talk is unavailable (shown when brain is null and tapped). */
  unavailableReason?: string;
  /** Fired once when a call ends, with the full transcript. */
  onEnd: (turns: Turn[]) => void;
  /** Silence that ends a spoken turn. Default 900ms. */
  silenceMs?: number;
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

export function useVoiceCall(opts: UseVoiceCallOptions) {
  const [talkOn, setTalkOn] = useState(false);
  const [state, setState] = useState<CallState>("idle");
  const [loadPct, setLoadPct] = useState<number | null>(null);
  const engineRef = useRef<VoiceCallEngine | null>(null);
  const micRef = useRef<RecorderMic | null>(null);
  const stateRef = useRef<CallState>("idle");
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const setStateBoth = (s: CallState) => { stateRef.current = s; setState(s); };

  const teardown = useCallback(() => {
    engineRef.current = null;
    micRef.current?.release();
    micRef.current = null;
    setTalkOn(false);
    setStateBoth("idle");
    setLoadPct(null);
  }, []);

  const toggleTalk = useCallback(async () => {
    const current = engineRef.current;
    if (current && stateRef.current !== "idle" && stateRef.current !== "ended" && stateRef.current !== "error") {
      if (stateRef.current === "speaking" || stateRef.current === "thinking") {
        current.interrupt();
      } else {
        current.stop();
      }
      return;
    }
    const brain = optsRef.current.brain;
    if (!brain) {
      toast.error(optsRef.current.unavailableReason || "Voice conversation is not available right now.");
      return;
    }
    const mic = new RecorderMic(optsRef.current.silenceMs ?? 900);
    micRef.current = mic;
    try {
      await mic.acquire(); // inside the tap — the iOS rule
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open the microphone.");
      micRef.current = null;
      return;
    }
    const engine = new VoiceCallEngine(
      {
        mic,
        stt: new WorkerStt(),
        brain,
        tts: new WorkerTts(personaFor(optsRef.current.roleText)),
      },
      {
        onState: (s, detail) => {
          setStateBoth(s);
          if (s === "loading") {
            const n = detail ? Number(detail) : NaN;
            setLoadPct(Number.isFinite(n) ? n : null);
          } else {
            setLoadPct(null);
          }
          if (s === "error" && detail) toast.error(detail);
          if (s === "ended" || s === "error") teardown();
        },
        onTurn: () => {},
        onEnd: (log) => { optsRef.current.onEnd(log); },
      },
    );
    engineRef.current = engine;
    setTalkOn(true);
    void engine.start();
  }, [teardown]);

  useEffect(() => () => {
    engineRef.current?.stop();
    micRef.current?.release();
    engineRef.current = null;
    micRef.current = null;
  }, []);

  return {
    talkOn,
    talkState: state,
    loadPct,
    toggleTalk,
    statusText: talkOn ? callStatusText(state, loadPct, opts.roleText) : "",
  };
}
