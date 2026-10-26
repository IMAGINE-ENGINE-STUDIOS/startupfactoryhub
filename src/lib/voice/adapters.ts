// @ts-nocheck -- VoiceCall v2 adapters: engine ports over real services.
/**
 * The concrete ports the VoiceCallEngine drives:
 *
 *  - WorkerStt: Whisper in the speech worker; falls back to the
 *    in-thread pipeline (whisper.ts) if the worker can't serve.
 *  - WorkerTts: Kokoro generation in the worker + main-thread
 *    playback, generation pipelined ahead via prepare(); falls back
 *    to tts.ts speak() (which itself falls back to the device voice).
 *    When the user's voice model isn't Neural, the device voice path
 *    is used directly.
 *  - AgentBrain: the founder's call-agents "chat" action — an agent's
 *    persona + its model ladder, streamed as SSE.
 *  - GeniusBrain: the legacy lightpaper-genius stream, used only when
 *    the user has no agent to talk to.
 *
 * Every fallback is a state the adapter reports honestly (mode), not
 * a silent substitution — v1's lesson.
 */
import type { BrainPort, SttPort, TtsPort, Turn } from "./engine";
import { speechClient } from "./speechClient";
import { loadWhisper, trimSilence } from "./whisper";
import { getVoiceModel, speechEngine, whisperModelId } from "./modelSetting";
import {
  KOKORO_VOICE_FOR_PERSONA,
  loadKokoro,
  playPcm,
  prepareSpeech,
  speak as speakV1,
  stopSpeaking,
  stripForSpeech,
  type VoicePersona,
} from "./tts";

const FN_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

/* ------------------------------ STT ------------------------------ */

export class WorkerStt implements SttPort {
  mode: "unknown" | "worker" | "thread" = "unknown";

  async load(onProgress: (pct: number) => void): Promise<void> {
    const model = whisperModelId(getVoiceModel());
    if (this.mode !== "thread" && (await speechClient.available())) {
      try {
        await speechClient.call("asr.load", { model }, {
          timeoutMs: 120_000,
          onProgress: (which, pct) => { if (which === "asr") onProgress(pct); },
        });
        this.mode = "worker";
        return;
      } catch { this.mode = "thread"; }
    }
    this.mode = "thread";
    await loadWhisper((pct) => onProgress(pct ?? 0));
  }

  async transcribe(audio: Float32Array): Promise<string> {
    const pcm = trimSilence(audio);
    if (this.mode === "worker") {
      try {
        const r = await speechClient.call(
          "asr.transcribe",
          { model: whisperModelId(getVoiceModel()), audio: pcm },
          { timeoutMs: 90_000, transfer: [pcm.buffer as ArrayBuffer] },
        );
        return String(r?.text || "").trim();
      } catch { this.mode = "thread"; }
    }
    const asr = await loadWhisper();
    const out = await asr(pcm, { chunk_length_s: 30, stride_length_s: 5 });
    const text = Array.isArray(out) ? out.map((o: any) => o?.text || "").join(" ") : out?.text || "";
    return String(text).trim();
  }
}

/* ------------------------------ TTS ------------------------------ */

function abortError(): Error {
  const e = new Error("aborted");
  e.name = "AbortError";
  return e;
}

async function withAbort<T>(p: Promise<T>, signal: AbortSignal, onAbort?: () => void): Promise<T> {
  if (signal.aborted) { onAbort?.(); throw abortError(); }
  return Promise.race([
    p,
    new Promise<T>((_, reject) => {
      signal.addEventListener("abort", () => { onAbort?.(); reject(abortError()); }, { once: true });
    }),
  ]);
}

export class WorkerTts implements TtsPort {
  mode: "unknown" | "worker" | "thread" = "unknown";
  private persona: VoicePersona;
  private prepared = new Map<string, Promise<any>>();

  constructor(persona: VoicePersona) {
    this.persona = persona;
  }

  private get neural(): boolean {
    return speechEngine(getVoiceModel()) === "kokoro";
  }

  private voice(): string {
    return KOKORO_VOICE_FOR_PERSONA[this.persona.id] || "af_heart";
  }

  async load(): Promise<void> {
    if (!this.neural) { this.mode = "thread"; return; }
    if (this.mode !== "thread" && (await speechClient.available())) {
      try {
        await speechClient.call("tts.load", {}, { timeoutMs: 120_000 });
        this.mode = "worker";
        return;
      } catch { this.mode = "thread"; }
    }
    this.mode = "thread";
    await loadKokoro();
  }

  prepare(text: string): void {
    const clean = stripForSpeech(text);
    if (!clean || !this.neural) return;
    if (this.mode === "worker") {
      if (this.prepared.has(clean)) return;
      const p = speechClient.call(
        "tts.generate",
        { text: clean, voice: this.voice() },
        { timeoutMs: 60_000 },
      );
      p.catch(() => { this.prepared.delete(clean); });
      this.prepared.set(clean, p);
      if (this.prepared.size > 8) {
        const oldest = this.prepared.keys().next().value;
        if (oldest && oldest !== clean) this.prepared.delete(oldest);
      }
    } else {
      prepareSpeech(text, this.persona);
    }
  }

  async speak(text: string, signal: AbortSignal): Promise<void> {
    const clean = stripForSpeech(text);
    if (!clean) return;
    if (this.neural && this.mode === "worker") {
      try {
        const p = this.prepared.get(clean)
          ?? speechClient.call("tts.generate", { text: clean, voice: this.voice() }, { timeoutMs: 60_000 });
        this.prepared.delete(clean);
        const r = await withAbort(p, signal);
        const audio = r?.audio as Float32Array | undefined;
        const rate = Number(r?.sampleRate || 24000);
        if (audio && audio.length) {
          await withAbort(playPcm(audio, rate), signal, () => stopSpeaking());
        }
        return;
      } catch (e) {
        if (signal.aborted) { stopSpeaking(); throw e; }
        this.mode = "thread"; // worker failed mid-call: finish on the in-thread path
      }
    }
    // In-thread path (tts.ts handles neural-with-device-fallback, or
    // the plain device voice when Neural isn't selected).
    try {
      await withAbort(speakV1(text, this.persona), signal, () => stopSpeaking());
    } catch (e) {
      stopSpeaking();
      throw e;
    }
  }

  stop(): void {
    stopSpeaking();
  }
}

/* ------------------------------ Brain ------------------------------ */

/** Shared SSE reader: accumulates the reply, onDelta per chunk with
 * the CUMULATIVE text, resolves with the full text. */
async function streamChat(
  url: string,
  getHeaders: () => Promise<Record<string, string>>,
  body: Record<string, unknown>,
  onDelta: (fullText: string) => void,
  signal: AbortSignal,
): Promise<string> {
  const resp = await fetch(url, {
    method: "POST",
    headers: await getHeaders(),
    body: JSON.stringify(body),
    signal,
  });
  if (resp.status === 429) throw new Error("Rate limit — give it a moment, then talk again.");
  if (resp.status === 402) throw new Error("AI credits are exhausted.");
  if (!resp.ok || !resp.body) throw new Error(`The agent could not reply (status ${resp.status}).`);
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  const handleLine = (rawLine: string) => {
    let line = rawLine;
    if (line.endsWith("\r")) line = line.slice(0, -1);
    if (!line.startsWith("data: ")) return;
    const jsonStr = line.slice(6).trim();
    if (!jsonStr || jsonStr === "[DONE]") return;
    try {
      const c = JSON.parse(jsonStr).choices?.[0]?.delta?.content;
      if (c) { fullText += c; onDelta(fullText); }
    } catch { /* partial line stays buffered by the caller */ }
  };
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      handleLine(line);
    }
  }
  for (const raw of buffer.split("\n")) handleLine(raw);
  return fullText.replace(/<!--NAV:[^>]+-->\n?/, "");
}

export class AgentBrain implements BrainPort {
  constructor(
    private getHeaders: () => Promise<Record<string, string>>,
    private agentId: string,
  ) {}

  async reply(history: Turn[], userText: string, onDelta: (t: string) => void, signal: AbortSignal): Promise<string> {
    const messages = [
      ...history.map((t) => ({ role: t.role, content: t.content })),
      { role: "user" as const, content: userText },
    ];
    return streamChat(
      `${FN_BASE}/call-agents`,
      this.getHeaders,
      { action: "chat", agent_id: this.agentId, messages, voice: true },
      onDelta,
      signal,
    );
  }
}

export class GeniusBrain implements BrainPort {
  constructor(
    private getHeaders: () => Promise<Record<string, string>>,
    private systemOverride: string,
    private language: string = "en",
  ) {}

  async reply(history: Turn[], userText: string, onDelta: (t: string) => void, signal: AbortSignal): Promise<string> {
    const messages = [
      ...history.map((t) => ({ role: t.role, content: t.content })),
      { role: "user" as const, content: userText },
    ];
    return streamChat(
      `${FN_BASE}/lightpaper-genius`,
      this.getHeaders,
      { messages, systemOverride: this.systemOverride, language: this.language },
      onDelta,
      signal,
    );
  }
}
