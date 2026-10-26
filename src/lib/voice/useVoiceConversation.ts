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
import { MicRecorder } from "@/lib/voice/recorder";
import { loadWhisper, transcribeBlob } from "@/lib/voice/whisper";
import { speak, stopSpeaking, personaFor, preloadSpeech, type VoicePersona } from "@/lib/voice/tts";

export type TalkState = "off" | "loading" | "listening" | "transcribing" | "waiting" | "speaking";

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
  const genRef = useRef(0);
  const recRef = useRef<MicRecorder | null>(null);
  const spokenRef = useRef<Set<string>>(new Set());
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const busyRef = useRef(opts.busy);
  busyRef.current = opts.busy;

  const persona = opts.persona || personaFor(opts.roleText);

  const shutdown = useCallback(() => {
    genRef.current++;
    recRef.current?.cancel();
    recRef.current = null;
    stopSpeaking();
    setTalkState("off");
  }, []);

  const listen = useCallback(async (gen: number) => {
    if (gen !== genRef.current) return;
    setTalkState("listening");
    try {
      await loadWhisper();
      if (gen !== genRef.current) return;
      const rec = new MicRecorder();
      recRef.current = rec;
      await rec.start({
        autoStopSilenceMs: 1600,
        onAutoStop: () => { void finishListen(gen); },
      });
    } catch (e: any) {
      if (gen !== genRef.current) return;
      setTalkOn(false);
      shutdown();
      toast.error(/denied|permission/i.test(e?.message || "") ? "Microphone permission was denied — allow the mic to talk." : "Could not open the microphone");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shutdown]);

  const finishListen = useCallback(async (gen: number) => {
    const rec = recRef.current;
    if (!rec) return;
    recRef.current = null;
    setTalkState("transcribing");
    try {
      const blob = await rec.stop();
      const text = await transcribeBlob(blob);
      if (gen !== genRef.current) return;
      if (text) {
        setTalkState("waiting");
        optsRef.current.onUserText(text);
      } else {
        void listen(gen); // heard nothing — keep the conversation open
      }
    } catch {
      if (gen === genRef.current) void listen(gen);
    }
  }, [listen]);

  /* Speak each new assistant reply once, then reopen the mic. */
  useEffect(() => {
    if (!talkOn) return;
    const la = opts.lastAssistant;
    if (!la || opts.busy) return;
    if (spokenRef.current.has(la.id)) return;
    spokenRef.current.add(la.id);
    const gen = genRef.current;
    setTalkState("speaking");
    void (async () => {
      await speak(la.text, persona);
      if (gen !== genRef.current) return;
      if (!busyRef.current) void listen(gen);
      else setTalkState("waiting");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [talkOn, opts.lastAssistant?.id, opts.busy]);

  const toggleTalk = useCallback(() => {
    if (talkOn) {
      setTalkOn(false);
      shutdown();
      return;
    }
    // Messages that already exist are history, not new speech.
    if (optsRef.current.lastAssistant) spokenRef.current.add(optsRef.current.lastAssistant.id);
    genRef.current++;
    const gen = genRef.current;
    setTalkOn(true);
    setTalkState("loading");
    void (async () => {
      preloadSpeech(); // Neural model: start the Kokoro download now, not at first reply
      try { await loadWhisper(); } catch { /* listen() will surface errors */ }
      if (gen !== genRef.current) return;
      void listen(gen);
    })();
  }, [talkOn, listen, shutdown]);

  /* Full stop on unmount. */
  useEffect(() => () => { genRef.current++; recRef.current?.cancel(); stopSpeaking(); }, []);

  return { talkOn, talkState, toggleTalk };
}
