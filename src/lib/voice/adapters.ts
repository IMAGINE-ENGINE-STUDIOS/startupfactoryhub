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

  private readyPromise: Promise<void> | null = null;

  /** Idempotent and NEVER throws: a voice-model failure degrades to
   * the in-thread path (and ultimately the device voice), it does
   * not kill the call. speak()/prepare() await readiness here. */
  load(): Promise<void> {
    if (!this.readyPromise) this.readyPromise = this.doLoad();
    return this.readyPromise;
  }

  private async doLoad(): Promise<void> {
    try {
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
    } catch {
      this.mode = "thread";
    }
  }

  prepare(text: string): void {
    const clean = stripForSpeech(text);
    if (!clean || !this.neural) return;
    if (this.mode === "unknown") {
      // Voice model still loading in the background: hedge in-thread
      // (tts.ts has its own pipeline cache; speak() uses whichever
      // path won the load race).
      void this.load();
      prepareSpeech(text, this.persona);
      return;
    }
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
    await this.load(); // the engine starts listening before this resolves
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

/* ---------------- Conversational actions ----------------
 * DirectiveFilter strips [[ACT {...}]] directives from a cumulative
 * reply stream: they may span deltas, partial openers are held,
 * malformed JSON is dropped silently — a directive NEVER reaches the
 * captions, the voice, or the transcript record. Parsed directives
 * go to the host's executor (fire-and-forget; the conversation never
 * blocks on a job). See ~/workspace/voice-v2/ACTIONS-SPEC.md. */

export interface ActDirective {
  type: string;
  [key: string]: unknown;
}

const ACT_OPEN = "[[ACT";

export class DirectiveFilter {
  private consumed = 0;
  private buf = "";
  private clean = "";

  constructor(private onAct: (d: ActDirective) => void) {}

  feed(cumulative: string): string {
    if (cumulative.length < this.consumed) {
      this.consumed = 0;
      this.buf = "";
      this.clean = "";
    }
    this.buf += cumulative.slice(this.consumed);
    this.consumed = cumulative.length;
    this.drain();
    return this.clean;
  }

  private drain(): void {
    for (;;) {
      const i = this.buf.indexOf(ACT_OPEN);
      if (i === -1) {
        let hold = 0;
        for (let k = Math.min(ACT_OPEN.length - 1, this.buf.length); k > 0; k--) {
          if (this.buf.endsWith(ACT_OPEN.slice(0, k))) { hold = k; break; }
        }
        this.clean += this.buf.slice(0, this.buf.length - hold);
        this.buf = this.buf.slice(this.buf.length - hold);
        return;
      }
      this.clean += this.buf.slice(0, i);
      const rest = this.buf.slice(i);
      const close = rest.indexOf("]]");
      if (close === -1) {
        if (rest.length > 800) {
          this.clean += rest;
          this.buf = "";
        } else {
          this.buf = rest;
        }
        return;
      }
      const jsonText = rest.slice(ACT_OPEN.length, close).trim();
      try {
        const d = JSON.parse(jsonText);
        if (d && typeof d.type === "string") this.onAct(d as ActDirective);
      } catch { /* malformed directive: dropped, never spoken */ }
      this.buf = rest.slice(close + 2);
    }
  }

  finish(): string {
    this.clean += this.buf;
    this.buf = "";
    return this.clean;
  }
}

export class AgentBrain implements BrainPort {
  private notes: string[] = [];

  constructor(
    private getHeaders: () => Promise<Record<string, string>>,
    private agentId: string,
    /** Conversation that predates the call (e.g. the visible chat
     * thread) — read fresh at each reply, placed before the call's
     * own turns so the agent has the full context. */
    private baseHistory?: () => Turn[],
    /** Host executor for [[ACT]] directives. When provided, the
     * chat request enables the server-side ACTIONS protocol. */
    private onAction?: (d: ActDirective) => void,
  ) {}

  /** Queue an action result for the agent's next turn (server-side
   * system context — never part of the transcript record). */
  noteResult(text: string): void {
    if (text.trim()) this.notes.push(text.trim());
  }

  async reply(history: Turn[], userText: string, onDelta: (t: string) => void, signal: AbortSignal): Promise<string> {
    const messages = [
      ...(this.baseHistory ? this.baseHistory() : []).map((t) => ({ role: t.role, content: t.content })),
      ...history.map((t) => ({ role: t.role, content: t.content })),
      { role: "user" as const, content: userText },
    ];
    const notes = this.notes.splice(0, this.notes.length);
    const body: Record<string, unknown> = {
      action: "chat",
      agent_id: this.agentId,
      messages,
      voice: true,
    };
    if (this.onAction) body.actions = true;
    if (notes.length) body.context_notes = notes;
    if (!this.onAction) {
      return streamChat(`${FN_BASE}/call-agents`, this.getHeaders, body, onDelta, signal);
    }
    const filter = new DirectiveFilter(this.onAction);
    await streamChat(
      `${FN_BASE}/call-agents`,
      this.getHeaders,
      body,
      (t) => onDelta(filter.feed(t)),
      signal,
    );
    return filter.finish();
  }
}

export class GeniusBrain implements BrainPort {
  private notes: string[] = [];

  constructor(
    private getHeaders: () => Promise<Record<string, string>>,
    private systemOverride: string | (() => string),
    private language: string = "en",
    private baseHistory?: () => Turn[],
    private onAction?: (d: ActDirective) => void,
  ) {}

  noteResult(text: string): void {
    if (text.trim()) this.notes.push(text.trim());
  }

  async reply(history: Turn[], userText: string, onDelta: (t: string) => void, signal: AbortSignal): Promise<string> {
    const messages = [
      ...(this.baseHistory ? this.baseHistory() : []).map((t) => ({ role: t.role, content: t.content })),
      ...history.map((t) => ({ role: t.role, content: t.content })),
      { role: "user" as const, content: userText },
    ];
    const notes = this.notes.splice(0, this.notes.length);
    const base = typeof this.systemOverride === "function" ? this.systemOverride() : this.systemOverride;
    const systemOverride = notes.length
      ? `${base}\n\nRECENT ACTION RESULTS (mention the outcome naturally if relevant):\n- ${notes.join("\n- ")}`
      : base;
    if (!this.onAction) {
      return streamChat(
        `${FN_BASE}/lightpaper-genius`,
        this.getHeaders,
        { messages, systemOverride, language: this.language },
        onDelta,
        signal,
      );
    }
    const filter = new DirectiveFilter(this.onAction);
    await streamChat(
      `${FN_BASE}/lightpaper-genius`,
      this.getHeaders,
      { messages, systemOverride, language: this.language },
      (t) => onDelta(filter.feed(t)),
      signal,
    );
    return filter.finish();
  }
}
