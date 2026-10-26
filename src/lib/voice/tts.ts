// @ts-nocheck -- voice core: talk-back (text-to-speech) with role personas.
/**
 * Talk-back (founder directive 2026-10-25): Genius and the agents speak
 * their replies out loud, with a voice matched to the agent's ROLE, so a
 * realtime conversation feels like talking to different people.
 *
 * Two engines behind this one speak() interface, chosen by the user's
 * voice model (see modelSetting.ts):
 *  - "device": the voices built into the visitor's device
 *    (SpeechSynthesis) — zero download. Used by the Tiny and Base models.
 *  - "kokoro": Kokoro-82M, a real neural voice model hosted in the
 *    founder's own Supabase Storage and run in the browser — the Neural
 *    model's talk-back. Any failure falls back to the device voice, so
 *    a reply is never lost to a model problem.
 */
import { getVoiceModel, speechEngine } from "./modelSetting";
import { WHISPER_HOST } from "./whisper";

export type VoicePersona = {
  id: string;
  pitch: number; // 0..2, 1 = natural
  rate: number; // 0.5..2, 1 = natural
  /** Voice-name fragments to prefer, best first (matched loosely). */
  prefer: string[];
};

/** Role → voice character. Matched by keyword on the agent's role/name. */
const PERSONAS: { match: RegExp; persona: VoicePersona }[] = [
  { match: /chairman/i, persona: { id: "chairman", pitch: 0.72, rate: 0.92, prefer: ["daniel", "arthur", "george", "david", "male"] } },
  { match: /\bceo\b|chief executive/i, persona: { id: "ceo", pitch: 0.85, rate: 0.97, prefer: ["samantha", "zira", "google uk english female", "female"] } },
  { match: /manager|director/i, persona: { id: "manager", pitch: 0.8, rate: 1.0, prefer: ["daniel", "david", "google us english", "male"] } },
  { match: /concierge|closer|outreach|marketer|social/i, persona: { id: "bright", pitch: 1.12, rate: 1.03, prefer: ["samantha", "zira", "aria", "female"] } },
  { match: /analyst|architect|research|engineer|builder|guardian|legal|finance/i, persona: { id: "steady", pitch: 0.95, rate: 0.98, prefer: ["george", "david", "google uk english male", "male"] } },
  { match: /writer|designer|ideator|planner/i, persona: { id: "warm", pitch: 1.05, rate: 1.0, prefer: ["samantha", "aria", "zira", "female"] } },
];

export const DEFAULT_PERSONA: VoicePersona = { id: "genius", pitch: 1.0, rate: 1.0, prefer: ["samantha", "google us english", "zira"] };

export function personaFor(roleText?: string | null): VoicePersona {
  const t = String(roleText || "");
  for (const p of PERSONAS) if (p.match.test(t)) return p.persona;
  return DEFAULT_PERSONA;
}

/* ---------------- voice list (loads async in every browser) -------- */

let voicesCache: SpeechSynthesisVoice[] = [];
function refreshVoices() {
  try { voicesCache = window.speechSynthesis?.getVoices() || []; } catch { voicesCache = []; }
}
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  refreshVoices();
  window.speechSynthesis.onvoiceschanged = refreshVoices;
}

function pickVoice(persona: VoicePersona): SpeechSynthesisVoice | null {
  const vs = voicesCache.length ? voicesCache : (window.speechSynthesis?.getVoices() || []);
  const en = vs.filter((v) => /^en([-_]|$)/i.test(v.lang));
  const pool = en.length ? en : vs;
  for (const hint of persona.prefer) {
    const hit = pool.find((v) => v.name.toLowerCase().includes(hint));
    if (hit) return hit;
  }
  return pool.find((v) => v.default) || pool[0] || null;
}

/* ---------------- speaking ------------------------------------------ */

let speakSeq = 0;

/** Strip markdown so replies are spoken, not spelled out. */
export function stripForSpeech(text: string): string {
  return String(text || "")
    .replace(/```[\s\S]*?```/g, " code block ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " link ")
    .replace(/[#>*_~|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function chunkText(text: string, max = 190): string[] {
  const sentences = text.match(/[^.!?…]+[.!?…]*\s*/g) || [text];
  const chunks: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if ((cur + s).length > max && cur) { chunks.push(cur.trim()); cur = s; }
    else cur += s;
    while (cur.length > max) { chunks.push(cur.slice(0, max).trim()); cur = cur.slice(max); }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks.filter(Boolean);
}

export function stopSpeaking() {
  speakSeq++;
  try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
  stopNeuralPlayback();
}

export function isSpeechSupported(): boolean {
  if (typeof window === "undefined") return false;
  if (speechEngine(getVoiceModel()) === "kokoro") return true; // neural path needs only AudioContext
  return "speechSynthesis" in window;
}

/* ---------------- Kokoro neural speech (the Neural model) ----------- */

export const KOKORO_MODEL = "Kokoro-82M-v1.0-ONNX";

/** Persona → Kokoro voice (hosted voice files; EN + UK + ES sets). */
const KOKORO_VOICE_FOR_PERSONA: Record<string, string> = {
  chairman: "bm_george",
  ceo: "af_nicole",
  manager: "am_michael",
  bright: "af_bella",
  steady: "am_adam",
  warm: "af_alloy",
  genius: "af_heart",
};

let kokoroPromise: Promise<any> | null = null;

/** Load (once) the Kokoro TTS instance from the founder's own storage.
 * WASM only + a hard timeout — same lesson as loadWhisper: a WebGPU
 * session-creation stall hangs forever with no error to catch, which
 * would mute talk-back completely. On timeout this rejects and speak()
 * falls back to the device voice, so a reply is always heard. */
export function loadKokoro(): Promise<any> {
  if (!kokoroPromise) {
    const create = (async () => {
      const transformers: any = await import("@huggingface/transformers");
      const { env } = transformers;
      env.remoteHost = WHISPER_HOST;
      env.remotePathTemplate = "{model}/";
      env.allowLocalModels = false;
      if (env.useBrowserCache !== undefined) env.useBrowserCache = true;
      const { KokoroTTS } = await import("kokoro-js");
      return KokoroTTS.from_pretrained(KOKORO_MODEL, { dtype: "q8", device: "wasm" });
    })();
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("The neural voice took too long to load.")), 120_000),
    );
    kokoroPromise = Promise.race([create, timeout]);
    kokoroPromise.catch(() => { kokoroPromise = null; });
  }
  return kokoroPromise;
}

/** Warm the speech engine for the current model choice (Talk start). */
export function preloadSpeech(): void {
  if (speechEngine(getVoiceModel()) === "kokoro") void loadKokoro().catch(() => {});
}

let audioCtx: AudioContext | null = null;
const activeSources = new Set<AudioBufferSourceNode>();

function stopNeuralPlayback() {
  for (const s of Array.from(activeSources)) {
    try { s.stop(); } catch { /* already ended */ }
    activeSources.delete(s);
  }
}

function playRawAudio(audio: Float32Array, sampleRate: number): Promise<void> {
  return new Promise((resolve) => {
    try {
      const AC: typeof AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioCtx = audioCtx || new AC();
      if (audioCtx.state === "suspended") void audioCtx.resume();
      const buffer = audioCtx.createBuffer(1, audio.length, sampleRate);
      buffer.copyToChannel(audio as any, 0);
      const src = audioCtx.createBufferSource();
      src.buffer = buffer;
      src.connect(audioCtx.destination);
      activeSources.add(src);
      src.onended = () => { activeSources.delete(src); resolve(); };
      src.start();
    } catch { resolve(); }
  });
}

/** Speak with the neural voice; throws on any model problem (caller falls back). */
async function speakNeural(text: string, persona: VoicePersona, mySeq: number): Promise<void> {
  const clean = stripForSpeech(text);
  if (!clean) return;
  const tts = await loadKokoro();
  const voice = KOKORO_VOICE_FOR_PERSONA[persona.id] || "af_heart";
  for (const chunk of chunkText(clean, 300)) {
    if (mySeq !== speakSeq) return; // cancelled / superseded
    const out: any = await tts.generate(chunk, { voice });
    if (mySeq !== speakSeq) return;
    const audio: Float32Array = out?.audio;
    const rate: number = out?.sampling_rate || 24000;
    if (audio && audio.length) await playRawAudio(audio, rate);
  }
}

function speakDevice(text: string, persona: VoicePersona): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) { resolve(); return; }
    const clean = stripForSpeech(text);
    if (!clean) { resolve(); return; }
    const mySeq = ++speakSeq;
    const synth = window.speechSynthesis;
    synth.cancel();
    const voice = pickVoice(persona);
    const chunks = chunkText(clean);
    let idx = 0;
    const next = () => {
      if (mySeq !== speakSeq) { resolve(); return; } // superseded/cancelled
      if (idx >= chunks.length) { resolve(); return; }
      const u = new SpeechSynthesisUtterance(chunks[idx++]);
      if (voice) u.voice = voice;
      u.pitch = persona.pitch;
      u.rate = persona.rate;
      u.onend = next;
      u.onerror = next;
      synth.speak(u);
    };
    next();
  });
}

/**
 * Speak text with the persona's voice, on the engine the user's voice
 * model selects: Neural → Kokoro (with device fallback on any problem);
 * Tiny / Base → the device voice. Resolves when speech ENDS (the
 * realtime loop chains listening off this). stopSpeaking() cancels and
 * also resolves it.
 */
export async function speak(text: string, persona: VoicePersona = DEFAULT_PERSONA): Promise<void> {
  if (speechEngine(getVoiceModel()) === "kokoro") {
    const mySeq = ++speakSeq;
    try {
      await speakNeural(text, persona, mySeq);
      return;
    } catch {
      if (mySeq !== speakSeq) return; // cancelled while loading — stay silent
      /* Neural failed (model still downloading, device too old…) — the
       * reply still gets spoken, on the device voice. */
    }
  }
  return speakDevice(text, persona);
}
