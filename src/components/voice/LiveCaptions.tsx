// @ts-nocheck -- VoiceCall v2: live captions for a running call.
/**
 * Founder requirement 2026-10-26: "the text to load in real time
 * with no delay on the performance of the talking model."
 *
 * So this is a pure passenger. It subscribes to the session's LIVE
 * channel — a side tap the engine writes to without ever awaiting —
 * and renders in this tiny isolated component (updates throttled to
 * ~8/second in the session), so streaming text can neither stall
 * the voice nor re-render the surrounding app. The chat thread
 * itself still receives only the final transcript when the call
 * ends; this is the live view, not the record.
 */
import { useEffect, useState } from "react";
import { voiceSession, type CallView, type LiveText } from "@/lib/voice/session";

export function LiveCaptions({ surfaceId, name }: { surfaceId: string; name: string }) {
  const [view, setView] = useState<CallView>(voiceSession.snapshot);
  const [live, setLive] = useState<LiveText>(voiceSession.liveSnapshot);
  useEffect(() => voiceSession.subscribe(setView), []);
  useEffect(() => voiceSession.subscribeLive(setLive), []);

  if (!view.active || view.surfaceId !== surfaceId) return null;
  const lastUser = [...live.turns].reverse().find((t) => t.role === "user");
  const lastAssistant = [...live.turns].reverse().find((t) => t.role === "assistant");
  const assistantText = live.assistantText || (lastAssistant?.content ?? "");
  if (!lastUser && !assistantText) return null;

  return (
    <div className="mb-2 space-y-1.5 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5 backdrop-blur">
      {lastUser && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground/70">You: </span>
          {lastUser.content}
        </p>
      )}
      {assistantText && (
        <p className="text-xs leading-relaxed text-foreground">
          <span className="font-semibold text-emerald-500">{name}: </span>
          {assistantText}
          {live.assistantText && <span className="ml-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 align-middle" />}
        </p>
      )}
    </div>
  );
}
