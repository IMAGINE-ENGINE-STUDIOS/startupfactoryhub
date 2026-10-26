// @ts-nocheck -- VoiceCall v2 React view over the session.
/**
 * The call itself lives in session.ts (module level, independent of
 * any component). This hook is only a VIEW: it subscribes the surface
 * to the session, and its toggle delegates — start a call owned by
 * this surface, interrupt it, or end it. Unmounting the surface does
 * NOT end the call (founder direction 2026-10-26: the conversation
 * runs separately from the visual experience).
 *
 * VoiceCallPill is the always-mounted mirror: visible anywhere the
 * host mounts it (the Genius bubble is global, so the pill is too),
 * it keeps a live call visible and endable with every panel closed.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { BrainPort, Turn } from "./engine";
import { voiceSession, warmVoice, type CallView } from "./session";

export { warmVoice };

export interface UseVoiceCallOptions {
  /** Stable identity of this surface (persistKey, "genius-bubble"…). */
  surfaceId: string;
  /** Display name for status text ("Genius", an agent name…). */
  roleText: string;
  /** The conversation brain; null while resolving or when unavailable. */
  brain: BrainPort | null;
  /** Why Talk is unavailable (shown when brain is null and tapped). */
  unavailableReason?: string;
  /** Fired once when a call owned by this surface ends. */
  onEnd: (turns: Turn[]) => void;
  /** Silence that ends a spoken turn. Default 900ms. */
  silenceMs?: number;
}

export function useVoiceCall(opts: UseVoiceCallOptions) {
  const [view, setView] = useState<CallView>(voiceSession.snapshot);
  useEffect(() => voiceSession.subscribe(setView), []);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const mine = view.active && view.surfaceId === opts.surfaceId;

  const toggleTalk = useCallback(async () => {
    const o = optsRef.current;
    if (view.active) {
      if (!mine) {
        toast(`You're in a call with ${view.roleText} — tap the call pill to end it.`);
        return;
      }
      if (view.state === "speaking" || view.state === "thinking") voiceSession.interrupt();
      else voiceSession.end();
      return;
    }
    if (!o.brain) {
      toast.error(o.unavailableReason || "Voice conversation is not available right now.");
      return;
    }
    try {
      await voiceSession.start({
        surfaceId: o.surfaceId,
        roleText: o.roleText,
        brain: o.brain,
        deliver: (turns) => { optsRef.current.onEnd(turns); },
        silenceMs: o.silenceMs,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open the microphone.");
    }
  }, [view, mine]);

  return {
    talkOn: mine,
    talkState: mine ? view.state : ("idle" as const),
    loadPct: mine ? view.loadPct : null,
    statusText: mine ? view.statusText : "",
    toggleTalk,
  };
}
