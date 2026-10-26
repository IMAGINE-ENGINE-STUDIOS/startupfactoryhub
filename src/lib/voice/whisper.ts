// @ts-nocheck -- voice core: self-hosted Whisper speech-to-text.
/**
 * Speech-to-text that is 100% ours (founder directive 2026-10-25):
 * OpenAI's Whisper (base.en, int8) runs INSIDE the visitor's browser via
 * Transformers.js + ONNX Runtime Web. The model files are hosted in the
 * founder's own Supabase Storage (public bucket "site-assets", prefix
 * voice/whisper-tiny.en/) — no Groq, no speech API, no free tier, and the
 * audio never leaves the device. First use downloads ~80 MB (progress is
 * reported), afterwards the browser cache serves it.
 *
 * The library itself is lazy-loaded (dynamic import) so nothing here
 * costs the main bundle until someone actually taps a mic button.
 */

export const WHISPER_HOST =
  "https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/site-assets/voice/";
export const WHISPER_MODEL = "whisper-tiny.en";

type ProgressFn = (pct: number | null, label: string) => void;

let pipelinePromise: Promise<any> | null = null;
let activeProgress: ProgressFn | null = null;

async function createPipeline(device: string, transformers: any) {
  const { pipeline } = transformers;
  return pipeline("automatic-speech-recognition", WHISPER_MODEL, {
    dtype: "q8",
    device,
    progress_callback: (e: any) => {
      if (!activeProgress) return;
      if (e?.status === "progress" && typeof e.progress === "number") {
        activeProgress(Math.round(e.progress), `Downloading the voice model (${e.file || "files"})`);
      } else if (e?.status === "ready") {
        activeProgress(100, "Voice model ready");
      }
    },
  });
}

/** Load (once) and return the ASR pipeline. Prefers WebGPU, falls back to WASM. */
export function loadWhisper(onProgress?: ProgressFn): Promise<any> {
  if (onProgress) activeProgress = onProgress;
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      const transformers: any = await import("@huggingface/transformers");
      const { env } = transformers;
      env.remoteHost = WHISPER_HOST;
      env.remotePathTemplate = "{model}/";
      env.allowLocalModels = false;
      if (env.useBrowserCache !== undefined) env.useBrowserCache = true;
      const hasGpu = typeof navigator !== "undefined" && "gpu" in navigator;
      if (hasGpu) {
        try {
          return await createPipeline("webgpu", transformers);
        } catch {
          /* WebGPU present but unusable (older Safari) — fall through to WASM. */
        }
      }
      return createPipeline("wasm", transformers);
    })();
    // A failed load must not poison the singleton — allow a retry next tap.
    pipelinePromise.catch(() => { pipelinePromise = null; });
  }
  return pipelinePromise;
}

/** Decode any recorded blob to mono 16 kHz Float32 PCM (what Whisper eats). */
export async function blobToPcm16k(blob: Blob): Promise<Float32Array> {
  const buf = await blob.arrayBuffer();
  const AC: typeof AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  const ctx = new AC();
  try {
    const decoded = await ctx.decodeAudioData(buf.slice(0));
    const frames = Math.max(1, Math.ceil(decoded.duration * 16000));
    const offline = new OfflineAudioContext(1, frames, 16000);
    const src = offline.createBufferSource();
    src.buffer = decoded;
    // Downmix to mono explicitly so multi-channel recordings behave.
    const merger = offline.createChannelMerger(1);
    src.connect(merger);
    merger.connect(offline.destination);
    src.start(0);
    const rendered = await offline.startRendering();
    return rendered.getChannelData(0).slice();
  } finally {
    void ctx.close().catch(() => {});
  }
}

/** Transcribe a recorded audio blob to text. */
export async function transcribeBlob(blob: Blob, onProgress?: ProgressFn): Promise<string> {
  const asr = await loadWhisper(onProgress);
  const pcm = await blobToPcm16k(blob);
  if (!pcm.length) return "";
  const out = await asr(pcm, { chunk_length_s: 30, stride_length_s: 5 });
  const text = Array.isArray(out) ? out.map((o: any) => o?.text || "").join(" ") : out?.text || "";
  return String(text).trim();
}
