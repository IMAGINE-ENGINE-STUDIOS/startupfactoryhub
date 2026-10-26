// @ts-nocheck -- realtime Talk loop: listen → agent → speak → listen…
/**
 * Hands-free realtime conversation with an agent (founder directive
 * 2026-10-25): turn Talk on and the loop runs itself —
 *   1. LISTENING: mic open; when you pause (~1.6 s of silence) the
 *      utterance is transcribed on-device (Whisper) and sent.
 *   2. WAITING: the agent thinks (mic closed, nothing is captured).
 *   3. SPEAKING: the reply is read aloud in the agent's role voice.
 *   4. Back to LISTENING — until you turn Talk off.
 * Barge-in is the Talk button itself: tapping it off stops speech and
 * mic immediately. Nothing here phones home: STT is on-device Whisper;
 * talk-back is the device voice, or Kokoro neural speech on the Neural
 * voice model — both self-hosted, both in the browser.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MicRecorder, micErrorMessage } from "@/lib/voice/recorder";
import { subscribeVoiceStream } from "@/lib/voice/streamBus";
import { loadWhisper, transcribeBlob } from "@/lib/voice/whisper";
import { speak, stopSpeaking, personaFor, preloadSpeech, stripForSpeech, type VoicePersona } from "@/lib/voice/tts";

export type TalkState = "off" | "loading" | "listening" | "transcribing" | "waiting" | "speaking";

/** Human-readable Talk status — EVERY surface must render this while
 * Talk is on (founder field report 2026-10-25: "I didn't get a message
 * or anything from the realtime talk feature" — the state machine ran
 * invisibly behind a pulsing icon, so a 1-2 minute first-time model
 * download looked exactly like a dead button). */
export function talkStatusLabel(state: TalkState, pct: number | null, name = "The agent"): string {
  switch (state) {
    case "loading": return pct !== null && pct < 100 ? `Loading the voice model — ${pct}% (first time only)` : "Loading the voice model… (first time only)";
    case "listening": return "Listening — speak now, then pause when you're done";
    case "transcribing": return "Transcribing what you said…";
    case "waiting": return `${name} is thinking…`;
    case "speaking": return `${name} is speaking…`;
    default: return "Voice conversation on";
  }
}

export function useVoiceConversation(opts: {
  /** Agent role/name text — picks the speaking voice persona. */
  roleText?: string | null;
  persona?: VoicePersona;
  /** Latest assistant message; each NEW id is spoken exactly once. */
  lastAssistant: { id: string; text: string } | null;
  /** True while the agent is generating a reply. */
  busy: boolean;
  onUserText: (text: string) => void;
}) {
  const [talkOn, setTalkOn] = useState(false);
  const [talkState, setTalkState] = useState<TalkState>("off");
  const [loadPct, setLoadPct] = useState<number | null>(null);
  const genRef = useRef(0);
  const recRef = useRef<MicRecorder | null>(null);
  /* Streaming speech state: how much of each assistant message has
   * already been handed to the speech queue, which messages are fully
   * flushed, and which already reopened the mic. Replies are spoken
   * SENTENCE BY SENTENCE as they stream in — the old design waited for
   * the entire reply to finish generating before the first sound,
   * which is most of why Talk felt slow (founder: "no way to make
   * this faster more realtime?", 2026-10-25). */
  const spokenCharsRef = useRef<Map<string, number>>(new Map());
  const spokenTextRef = useRef<Map<string, string>>(new Map());
  const flushedRef = useRef<Set<string>>(new Set());
  const reopenedRef = useRef<Set<string>>(new Set());
  const speechQueueRef = useRef<string[]>([]);
  const pumpingRef = useRef(false);
  const personaRef = useRef<VoicePersona>(opts.persona || personaFor(opts.roleText));
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const busyRef = useRef(opts.busy);
  busyRef.current = opts.busy;

  const persona = opts.persona || personaFor(opts.roleText);
  personaRef.current = persona;

  /* The Talk session's microphone stream — acquired inside the tap
   * that starts Talk and held across every turn, so iOS Safari never
   * sees a getUserMedia call that trails a long download. */
  const streamRef = useRef<MediaStream | null>(null);

  const shutdown = useCallback(() => {
    genRef.current++;
    speechQueueRef.current = [];
    recRef.current?.cancel();
    recRef.current = null;
    MicRecorder.release(streamRef.current);
    streamRef.current = null;
    stopSpeaking();
    setTalkState("off");
  }, []);

  const listen = useCallback(async (gen: number) => {
    if (gen !== genRef.current) return;
    /* "listening" only once the mic is REALLY open — before the model
     * is ready the state stays "loading" with live progress, so the
     * user never speaks into a mic that isn't capturing yet. */
    setTalkState("loading");
    let phase: "load" | "mic" = "load";
    try {
      await loadWhisper((p) => { if (gen === genRef.current) setLoadPct(p); });
      if (gen !== genRef.current) return;
      setLoadPct(null);
      phase = "mic";
      const rec = new MicRecorder();
      recRef.current = rec;
      await rec.start({
        stream: streamRef.current ?? undefined,
        autoStopSilenceMs: 1100,
        noSpeechMs: 20_000,
        maxMs: 45_000,
        onAutoStop: (reason) => { stopReasonRef.current = reason; void finishListen(gen); },
      });
      if (gen === genRef.current) setTalkState("listening");
    } catch (e: any) {
      if (gen !== genRef.current) return;
      setTalkOn(false);
      shutdown();
      toast.error(phase === "mic" ? micErrorMessage(e) : e?.message || "Voice failed to start — try Talk again.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shutdown]);

  const failCountRef = useRef(0);
  const stopReasonRef = useRef<"silence" | "no-speech" | "max">("silence");

  const finishListen = useCallback(async (gen: number) => {
    const rec = recRef.current;
    if (!rec) return;
    recRef.current = null;
    /* Dead air: nobody spoke — don't burn seconds transcribing
     * silence; just reopen the mic. */
    if (stopReasonRef.current === "no-speech") {
      try { await rec.stop(); } catch { /* recorder already down */ }
      if (gen === genRef.current) void listen(gen);
      return;
    }
    setTalkState("transcribing");
    try {
      const blob = await rec.stop();
      const text = await transcribeBlob(blob);
      if (gen !== genRef.current) return;
      failCountRef.current = 0;
      if (text) {
        setTalkState("waiting");
        optsRef.current.onUserText(text);
      } else {
        void listen(gen); // heard nothing — keep the conversation open
      }
    } catch (e: any) {
      if (gen !== genRef.current) return;
      /* Never fail silently (founder field report 2026-10-25: Talk
       * "did nothing"): surface the error, and after two failures in
       * a row stop the loop with a clear message instead of spinning. */
      failCountRef.current++;
      if (failCountRef.current >= 2) {
        failCountRef.current = 0;
        setTalkOn(false);
        shutdown();
        toast.error(e?.message || "Voice transcription failed — Talk mode stopped.");
      } else {
        toast.error(e?.message || "Transcription failed — listening again…");
        void listen(gen);
      }
    }
  }, [listen, shutdown]);

  /* The speech pump: speaks the queue sentence by sentence. When it
   * drains AND the current reply has been fully flushed AND the agent
   * is done generating, the mic reopens — the conversation loop. */
  const pumpSpeech = useCallback(async () => {
    if (pumpingRef.current) return;
    pumpingRef.current = true;
    const gen = genRef.current;
    try {
      while (speechQueueRef.current.length) {
        const sentence = speechQueueRef.current.shift()!;
        await speak(sentence, personaRef.current);
        if (gen !== genRef.current) return;
      }
    } finally {
      pumpingRef.current = false;
    }
    if (gen !== genRef.current) return;
    const la = optsRef.current.lastAssistant;
    if (la && flushedRef.current.has(la.id) && !busyRef.current && !reopenedRef.current.has(la.id)) {
      reopenedRef.current.add(la.id);
      void listen(gen);
    } else if (busyRef.current) {
      setTalkState("waiting");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Feed the speech queue from a cumulative reply text: every
   * completed sentence is spoken as soon as it exists; the trailing
   * partial sentence flushes when `done`. Idempotent — the spoken
   * offset makes re-feeding the same text a no-op, so two sources
   * (the direct stream tap and the host's rendered state) can feed
   * the same reply without ever double-speaking. */
  const feedSpeech = useCallback((id: string, text: string, done: boolean) => {
    spokenTextRef.current.set(id, text);
    if (!spokenCharsRef.current.has(id)) spokenCharsRef.current.set(id, 0);
    const from = spokenCharsRef.current.get(id)!;
    if (done && text.length <= from) { flushedRef.current.add(id); void pumpSpeech(); return; }
    const tail = text.slice(from);
    if (!tail) return;
    const ready: string[] = [];
    let consumed = 0;
    const re = /[^.!?…]+[.!?…]+["')\]]*\s*/g;
    let m: RegExpExecArray | null;
    let last = 0;
    while ((m = re.exec(tail))) { ready.push(m[0]); last = re.lastIndex; }
    if (ready.length) consumed = last;
    if (done) {
      const rest = tail.slice(consumed);
      if (rest.trim()) { ready.push(rest); consumed = tail.length; }
      flushedRef.current.add(id);
    }
    if (!ready.length) return;
    spokenCharsRef.current.set(id, from + consumed);
    for (const s of ready) if (stripForSpeech(s).trim()) speechQueueRef.current.push(s);
    if (speechQueueRef.current.length) {
      setTalkState("speaking");
      void pumpSpeech();
    } else if (done) {
      void pumpSpeech(); // nothing to say — still runs the reopen check
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Source 1 — the host's rendered state (works for every surface,
   * including non-streaming agent runs). Guard: if another feed key
   * already spoke this exact reply in full (the stream tap uses its
   * own id), adopt that progress instead of speaking it twice. */
  useEffect(() => {
    if (!talkOn) return;
    const la = opts.lastAssistant;
    if (!la) return;
    for (const [otherId] of Array.from(spokenCharsRef.current.entries())) {
      if (otherId !== la.id && spokenTextRef.current.get(otherId) === la.text && flushedRef.current.has(otherId)) {
        spokenCharsRef.current.set(la.id, la.text.length);
        flushedRef.current.add(la.id);
        void pumpSpeech();
        return;
      }
    }
    feedSpeech(la.id, la.text, !opts.busy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [talkOn, opts.lastAssistant?.id, opts.lastAssistant?.text, opts.busy]);

  /* Source 2 — the direct stream tap (voice-first fast lane): a
   * streaming host publishes deltas straight from its fetch reader,
   * so speech starts with the wire, not with the render. */
  useEffect(() => {
    if (!talkOn) return;
    return subscribeVoiceStream((ev) => {
      if (!ev.done && ev.text === "") { setTalkState("waiting"); return; }
      feedSpeech(ev.id, ev.text, ev.done);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [talkOn]);

  const toggleTalk = useCallback(() => {
    /* Tap while she's speaking = interrupt, the way you'd cut into a
     * real conversation: speech stops mid-flow and the mic opens for
     * the user at once. Tap again (while listening) ends Talk. */
    if (talkOn && talkState === "speaking") {
      stopSpeaking();
      speechQueueRef.current = [];
      const la = optsRef.current.lastAssistant;
      if (la) {
        /* The unspoken remainder of this reply stays unspoken — she
         * cut in because she has something to say. */
        spokenCharsRef.current.set(la.id, la.text.length);
        flushedRef.current.add(la.id);
        reopenedRef.current.add(la.id);
      }
      void listen(genRef.current);
      return;
    }
    if (talkOn) {
      setTalkOn(false);
      shutdown();
      return;
    }
    // Messages that already exist are history, not new speech.
    if (optsRef.current.lastAssistant) {
      const la = optsRef.current.lastAssistant;
      spokenCharsRef.current.set(la.id, la.text.length);
      flushedRef.current.add(la.id);
      reopenedRef.current.add(la.id);
    }
    genRef.current++;
    const gen = genRef.current;
    setTalkOn(true);
    setTalkState("loading");
    void (async () => {
      /* Open the mic FIRST, while the tap's permission window is fresh
       * (iOS Safari can refuse after the model download has sat in
       * between — "could not open the microphone", 2026-10-25). */
      try {
        streamRef.current = await MicRecorder.acquire();
      } catch (e: any) {
        if (gen !== genRef.current) return;
        setTalkOn(false);
        shutdown();
        toast.error(micErrorMessage(e));
        return;
      }
      if (gen !== genRef.current) { MicRecorder.release(streamRef.current); streamRef.current = null; return; }
      preloadSpeech(); // Neural model: start the Kokoro download now, not at first reply
      try { await loadWhisper((p) => { if (gen === genRef.current) setLoadPct(p); }); } catch { /* listen() will surface errors */ }
      if (gen !== genRef.current) return;
      setLoadPct(null);
      void listen(gen);
    })();
  }, [talkOn, talkState, listen, shutdown]);

  /* Full stop on unmount. */
  useEffect(() => () => { genRef.current++; recRef.current?.cancel(); MicRecorder.release(streamRef.current); streamRef.current = null; stopSpeaking(); }, []);

  return { talkOn, talkState, loadPct, toggleTalk };
}
