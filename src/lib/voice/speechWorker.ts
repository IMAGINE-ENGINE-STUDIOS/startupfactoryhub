// @ts-nocheck -- VoiceCall v2 speech worker.
/**
 * Dedicated worker that hosts Whisper (STT) and Kokoro (TTS) so ONNX
 * inference NEVER blocks the page's main thread again (founder field
 * report 2026-10-26: Talk froze the page and the office's 3D with it).
 *
 * Self-contained on purpose: it imports nothing from the main bundle's
 * voice modules (several read window/localStorage), so the model-host
 * config below MIRRORS whisper.ts / tts.ts by hand — keep them in
 * sync. Models come from the founder's own Supabase Storage and are
 * cached by the browser; audio never leaves the device.
 *
 * Device strategy (the v1 lesson, contained): WebGPU session creation
 * can HANG on some Chrome/GPU combos with no error to catch. Inside a
 * worker that hang is survivable — creation is raced against a
 * timeout and falls back to WASM, and the client (speechClient.ts)
 * has its own timeouts + terminate-and-fallback if this worker ever
 * wedges outright. WASM-only was v1's answer on the main thread;
 * here WebGPU's ~10x inference speed is worth the guarded attempt.
 */
import { pipeline, env } from "@huggingface/transformers";
import { KokoroTTS } from "kokoro-js";

const WHISPER_HOST =
  "https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/site-assets/voice/";
const KOKORO_MODEL = "Kokoro-82M-v1.0-ONNX";
/* WASM ONLY — the v1 field doctrine, reinstated (founder reports
 * 2026-10-25 + 2026-10-26). WebGPU session creation on real
 * Chrome/GPU combos can hang or crawl, and racing it "with a
 * timeout" still taxed every cold start: the zombie attempt kept
 * competing with the WASM fallback on this single worker thread,
 * and the two models' loads starved each other — a ~5-minute cold
 * start, after which the conversation itself ran fast. The
 * worker's win was never WebGPU; it is thread isolation. WASM
 * inference here is the exact configuration v1 proved on the
 * founder's machines. */
const DEVICE_TIMEOUT_MS = 8_000;
const deviceFailed = { asr: false, tts: false };

env.remoteHost = WHISPER_HOST;
env.remotePathTemplate = "{model}/";
env.allowLocalModels = false;
if (env.useBrowserCache !== undefined) env.useBrowserCache = true;
try {
  const wasm = env?.backends?.onnx?.wasm;
  if (wasm) wasm.numThreads = Math.max(1, Math.min(4, (self.navigator?.hardwareConcurrency as number) || 2));
} catch { /* best-effort */ }

const ctx: any = self as any;

function postProgress(which: string, pct: number) {
  ctx.postMessage({ kind: "progress", which, pct });
}

function makeProgress(which: string) {
  let last = -1;
  return (e: any) => {
    if (e?.status === "progress" && typeof e.progress === "number") {
      const pct = Math.round(e.progress);
      if (pct !== last) { last = pct; postProgress(which, pct); }
    } else if (e?.status === "ready") {
      postProgress(which, 100);
    }
  };
}

/** Race a creation promise against a timeout (a hung WebGPU session
 * creation never settles — the race is the only way to escape it). */
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(label + " timed out")), ms)),
  ]);
}

const hasWebGpu = false; // see the WASM-only doctrine above

/* ---------------- Whisper ---------------- */
const asrPipelines = new Map<string, Promise<any>>();

function loadAsr(model: string): Promise<any> {
  let p = asrPipelines.get(model);
  if (p) return p;
  const progress = makeProgress("asr");
  const create = async () => {
    if (hasWebGpu && !deviceFailed.asr) {
      try {
        return await withTimeout(
          pipeline("automatic-speech-recognition", model, { dtype: "q8", device: "webgpu", progress_callback: progress }),
          DEVICE_TIMEOUT_MS, "WebGPU speech model load",
        );
      } catch { deviceFailed.asr = true; /* fall through to WASM */ }
    }
    return pipeline("automatic-speech-recognition", model, { dtype: "q8", progress_callback: progress });
  };
  p = create();
  p.catch(() => { asrPipelines.delete(model); });
  asrPipelines.set(model, p);
  return p;
}

/* ---------------- Kokoro ---------------- */
let kokoroPromise: Promise<any> | null = null;

function loadKokoroWorker(): Promise<any> {
  if (kokoroPromise) return kokoroPromise;
  const progress = makeProgress("tts");
  const create = async () => {
    if (hasWebGpu && !deviceFailed.tts) {
      try {
        return await withTimeout(
          KokoroTTS.from_pretrained(KOKORO_MODEL, { dtype: "q8", device: "webgpu", progress_callback: progress }),
          DEVICE_TIMEOUT_MS, "WebGPU neural voice load",
        );
      } catch { deviceFailed.tts = true; /* fall through to WASM */ }
    }
    return KokoroTTS.from_pretrained(KOKORO_MODEL, { dtype: "q8", device: "wasm", progress_callback: progress });
  };
  kokoroPromise = create();
  kokoroPromise.catch(() => { kokoroPromise = null; });
  return kokoroPromise;
}

/* ---------------- RPC ---------------- */
ctx.onmessage = async (e: MessageEvent) => {
  const { id, kind, payload } = (e.data || {}) as any;
  if (kind === "ping") {
    ctx.postMessage({ id, ok: true, value: { pong: true } });
    return;
  }
  const respond = (ok: boolean, value?: any, error?: string, transfer?: any[]) => {
    try { ctx.postMessage({ id, ok, value, error }, transfer || []); }
    catch { try { ctx.postMessage({ id, ok, value, error }); } catch { /* worker dying */ } }
  };
  try {
    switch (kind) {
      case "asr.load": {
        const asr = await loadAsr(String(payload?.model || "whisper-base.en"));
        /* Warm-up inference (speed research: never pay cold costs
         * in-turn): one second of silence compiles the graph now, so
         * the first real transcription isn't the cold one. */
        try { await asr(new Float32Array(16000), { chunk_length_s: 30, stride_length_s: 5 }); } catch { /* warm only */ }
        respond(true, { loaded: true });
        break;
      }
      case "asr.transcribe": {
        const asr = await loadAsr(String(payload?.model || "whisper-base.en"));
        const audio = payload?.audio as Float32Array;
        const out = await asr(audio, { chunk_length_s: 30, stride_length_s: 5 });
        const text = Array.isArray(out) ? out.map((o: any) => o?.text || "").join(" ") : out?.text || "";
        respond(true, { text: String(text).trim() });
        break;
      }
      case "tts.load": {
        const tts = await loadKokoroWorker();
        /* Warm-up synthesis, same doctrine: the first generated
         * sentence of a call must not be the cold one (a cold first
         * synthesis is where the simple device voice used to win). */
        try { await tts.generate("Hi.", { voice: "af_heart" }); } catch { /* warm only */ }
        respond(true, { loaded: true });
        break;
      }
      case "tts.generate": {
        const tts = await loadKokoroWorker();
        const out = await tts.generate(String(payload?.text || ""), { voice: String(payload?.voice || "af_heart") });
        const audio = out?.audio as Float32Array;
        const sampleRate = Number(out?.sampling_rate || 24000);
        if (audio && audio.length) {
          respond(true, { audio, sampleRate }, undefined, [audio.buffer]);
        } else {
          respond(true, { audio: new Float32Array(0), sampleRate });
        }
        break;
      }
      default:
        respond(false, undefined, "Unknown speech worker request: " + String(kind));
    }
  } catch (err: any) {
    respond(false, undefined, String(err?.message || err));
  }
};
