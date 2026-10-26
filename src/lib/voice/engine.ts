/**
 * VoiceCallEngine — the single owner of a realtime voice conversation.
 *
 * Framework-free by design (no React, no DOM): the host injects four
 * ports (mic, speech-to-text, brain, text-to-speech) and receives
 * state changes, completed turns, and — exactly once, when the call
 * ends — the full transcript.
 *
 * TRANSCRIPT INTEGRITY (the v1 failure this replaces): the turn log
 * has exactly two writers, both in this file —
 *   1. the STT adapter's final string for a user turn, and
 *   2. the brain stream's own accumulated text for an assistant turn
 *      (the same string the TTS port is fed from).
 * An assistant turn's `heardChars` records how much of it was actually
 * played before an interruption, so the log never claims more was
 * heard than was — and never contains text from anywhere else.
 *
 * Spec: ~/workspace/voice-v2/SPEC.md
 */

export type CallState =
  | "idle" | "loading" | "listening" | "transcribing"
  | "thinking" | "speaking" | "ended" | "error";

export interface Turn {
  role: "user" | "assistant";
  content: string;
  /** Assistant turns only: characters actually played aloud. Equals
   * content.length unless the user interrupted mid-reply. */
  heardChars?: number;
}

export type MicStopReason = "silence" | "no-speech" | "max";

export interface MicCapture {
  /** 16 kHz mono samples of the utterance (post endpointing). */
  audio: Float32Array;
  reason: MicStopReason;
}

export interface MicPort {
  /** Resolves with the next utterance; rejects on mic errors
   * (permission, busy) with a user-presentable message. */
  listenOnce(signal: AbortSignal): Promise<MicCapture>;
  cancel(): void;
}

export interface SttPort {
  load(onProgress: (pct: number) => void): Promise<void>;
  transcribe(audio: Float32Array): Promise<string>;
}

export interface BrainPort {
  /** Streams the reply: onDelta receives the CUMULATIVE text so far.
   * Resolves with the full reply text. Rejects on abort/failure —
   * the engine falls back to whatever onDelta already delivered. */
  reply(history: Turn[], userText: string,
        onDelta: (fullText: string) => void,
        signal: AbortSignal): Promise<string>;
}

export interface TtsPort {
  load(onProgress: (pct: number) => void): Promise<void>;
  /** Optional pipeline hint: start GENERATING this text's audio now;
   * its speak() comes later. Adapters with generation latency (neural
   * TTS) use it to overlap generation with the current sentence's
   * playback — without it, every sentence boundary costs a full
   * generation of dead air (founder field report 2026-10-26). */
  prepare?(text: string): void;
  /** Resolves when the text has been PLAYED (not merely queued);
   * rejects if stop() interrupts playback. */
  speak(text: string, signal: AbortSignal): Promise<void>;
  stop(): void;
}

export interface EngineAdapters {
  mic: MicPort;
  stt: SttPort;
  brain: BrainPort;
  tts: TtsPort;
}

export interface EngineEvents {
  onState(state: CallState, detail?: string): void;
  onTurn(turn: Turn): void;
  onEnd(log: Turn[]): void;
}

export interface EngineOptions {
  /** Consecutive adapter failures tolerated before the call errors
   * out (its partial transcript is still delivered). Default 2. */
  maxConsecutiveFailures?: number;
}

/* ------------------------------------------------------------------ */
/* Sentence pump: releases complete sentences from a growing stream.  */
/* Guards decimals ("3.5") and common abbreviations ("Dr.", "e.g.")  */
/* against false boundaries — carried over from the v1 pump, which    */
/* was field-proven; the log bookkeeping around it is what's new.     */
/* ------------------------------------------------------------------ */
export class SentencePump {
  private fed = "";
  private consumed = 0;

  /** Feed the cumulative stream text; returns newly completed
   * sentences (and advances the internal offset). */
  feed(fullText: string): string[] {
    this.fed = fullText;
    const out: string[] = [];
    const tail = this.fed.slice(this.consumed);
    const re = /[.!?…]+["')\]]?\s+/g;
    let m: RegExpExecArray | null;
    let lastEnd = 0;
    while ((m = re.exec(tail)) !== null) {
      const end = m.index + m[0].length;
      const sentence = tail.slice(lastEnd, end).trim();
      const before = tail.slice(0, m.index + 1);
      if (/(\d+\.\d+)$/.test(before)) continue;                    // decimal point
      if (/(^|\s)(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|e\.g|i\.e)\.$/i.test(before)) continue;
      if (sentence) out.push(sentence);
      lastEnd = end;
    }
    if (lastEnd > 0) this.consumed += lastEnd;
    return out;
  }

  /** The unspoken remainder once the stream is done. */
  flush(): string {
    const rest = this.fed.slice(this.consumed).trim();
    this.consumed = this.fed.length;
    return rest;
  }

  get text(): string { return this.fed; }
}

/* ------------------------------------------------------------------ */

export class VoiceCallEngine {
  private adapters: EngineAdapters;
  private events: EngineEvents;
  private maxFailures: number;

  private _state: CallState = "idle";
  private turns: Turn[] = [];
  private runId = 0;               // generation counter: stale loops die
  private failures = 0;
  private endFired = false;
  private callAbort: AbortController | null = null;
  private replyAbort: AbortController | null = null;

  constructor(adapters: EngineAdapters, events: EngineEvents, opts: EngineOptions = {}) {
    this.adapters = adapters;
    this.events = events;
    this.maxFailures = opts.maxConsecutiveFailures ?? 2;
  }

  get state(): CallState { return this._state; }
  get log(): Turn[] { return [...this.turns]; }

  private setState(s: CallState, detail?: string) {
    this._state = s;
    this.events.onState(s, detail);
  }

  private fireEnd() {
    if (this.endFired) return;
    this.endFired = true;
    this.events.onEnd([...this.turns]);
  }

  private pushTurn(turn: Turn) {
    this.turns = [...this.turns, turn];
    this.events.onTurn(turn);
  }

  async start(): Promise<void> {
    if (this._state !== "idle" && this._state !== "ended" && this._state !== "error") return;
    this.endFired = false;
    this.failures = 0;
    const gen = ++this.runId;
    this.callAbort = new AbortController();
    this.setState("loading");
    try {
      /* Only the EAR gates the call (founder direction 2026-10-26:
       * keep the conversation off the critical path of everything
       * else). The voice model loads in the background — the first
       * reply's speech simply awaits it inside the TTS adapter, and
       * a TTS failure degrades there, never kills the call. */
      const pcts = [0, 0];
      const report = (i: number) => (pct: number) => {
        pcts[i] = Math.max(pcts[i], pct);
        if (gen === this.runId && this._state === "loading") {
          this.setState("loading", String(Math.min(99, Math.round((pcts[0] + pcts[1]) / 2))));
        }
      };
      const ttsLoad = this.adapters.tts.load(report(1)).catch(() => { /* degraded inside the adapter */ });
      await this.adapters.stt.load(report(0));
      void ttsLoad;
    } catch (e) {
      if (gen !== this.runId) return;
      this.setState("error", e instanceof Error ? e.message : "Voice models failed to load.");
      this.fireEnd();
      return;
    }
    if (gen !== this.runId) return;
    void this.loop(gen);
  }

  /** End the call from any state; the transcript is delivered via
   * onEnd exactly once (here, or by the failure path). */
  stop(): void {
    this.runId++;
    this.callAbort?.abort();
    this.replyAbort?.abort();
    this.adapters.mic.cancel();
    this.adapters.tts.stop();
    if (this._state !== "ended" && this._state !== "error") this.setState("ended");
    this.fireEnd();
  }

  /** Barge-in: cut the current reply off and listen again. The reply
   * turn is appended with its true heardChars (see loop()). */
  interrupt(): void {
    if (this._state !== "speaking" && this._state !== "thinking") return;
    this.adapters.tts.stop();
    this.replyAbort?.abort();
  }

  private noteFailure(e: unknown): boolean {
    this.failures += 1;
    console.warn(`[voice-engine] adapter failure ${this.failures}/${this.maxFailures}`, e);
    return this.failures >= this.maxFailures;
  }

  private async loop(gen: number): Promise<void> {
    const alive = () => gen === this.runId && !this.endFired;
    while (alive()) {
      /* ---- listen ---- */
      this.setState("listening");
      let capture: MicCapture;
      try {
        capture = await this.adapters.mic.listenOnce(this.callAbort!.signal);
      } catch (e) {
        if (!alive()) return;
        // Mic errors (permission/busy) are fatal: retrying can't help.
        this.setState("error", e instanceof Error ? e.message : "Microphone error.");
        this.fireEnd();
        return;
      }
      if (!alive()) return;
      if (capture.reason === "no-speech") continue;

      /* ---- transcribe ---- */
      this.setState("transcribing");
      let userText = "";
      try {
        userText = (await this.adapters.stt.transcribe(capture.audio)).trim();
        this.failures = 0;
      } catch (e) {
        if (!alive()) return;
        if (this.noteFailure(e)) { this.setState("error", "Transcription kept failing."); this.fireEnd(); return; }
        continue;
      }
      if (!alive()) return;
      if (!userText) continue;
      this.pushTurn({ role: "user", content: userText });

      /* ---- think + speak (streamed through the sentence pump) ---- */
      const history = [...this.turns];
      this.setState("thinking");
      const rac = new AbortController();
      this.replyAbort = rac;
      const pump = new SentencePump();
      let heardChars = 0;
      let spokenStarted = false;
      let speakChain: Promise<void> = Promise.resolve();
      let speakFailed: unknown = null;
      const enqueueSpeak = (sentence: string) => {
        // Generation starts the moment the sentence exists — while
        // the brain is still streaming and earlier sentences play.
        try { this.adapters.tts.prepare?.(sentence); } catch { /* hint only */ }
        speakChain = speakChain.then(async () => {
          if (rac.signal.aborted) return;
          if (!spokenStarted) { spokenStarted = true; this.setState("speaking"); }
          try {
            await this.adapters.tts.speak(sentence, rac.signal);
            heardChars += sentence.length + 1; // + trailing space, cosmetic
          } catch (err) {
            if (!rac.signal.aborted) speakFailed = err;
          }
        });
      };

      let fullText = "";
      let brainFailed: unknown = null;
      try {
        fullText = await this.adapters.brain.reply(history, userText, (cumulative) => {
          for (const s of pump.feed(cumulative)) enqueueSpeak(s);
        }, rac.signal);
      } catch (e) {
        brainFailed = e;
        fullText = pump.text; // whatever actually streamed is the record
      }
      if (!alive()) return;
      if (!rac.signal.aborted) {
        const rest = pump.flush();
        if (rest) enqueueSpeak(rest);
      }
      await speakChain;
      if (!alive()) return;

      const heard = Math.min(heardChars, fullText.length);
      if (fullText.trim()) {
        this.pushTurn({ role: "assistant", content: fullText, heardChars: heard });
      }
      this.replyAbort = null;

      if (brainFailed && !rac.signal.aborted) {
        if (this.noteFailure(brainFailed)) { this.setState("error", "The agent kept failing to reply."); this.fireEnd(); return; }
      } else if (speakFailed) {
        if (this.noteFailure(speakFailed)) { this.setState("error", "Speech playback kept failing."); this.fireEnd(); return; }
      } else {
        this.failures = 0;
      }
      // loop continues → listening
    }
  }
}
