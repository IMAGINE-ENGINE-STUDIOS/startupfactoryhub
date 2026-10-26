// @ts-nocheck -- VoiceCall v2: the floating live-call pill.
/**
 * Rendered once by a global host (the Genius bubble is mounted on
 * every page, so the pill is too). A voice call runs in the session,
 * outside any panel — this pill keeps it visible, interruptible and
 * endable wherever the user is in the app, with every panel closed,
 * while they walk the office or work elsewhere.
 */
import { useEffect, useState } from "react";
import { PhoneOff, Pause } from "lucide-react";
import { voiceSession, type CallView } from "@/lib/voice/session";

export function VoiceCallPill() {
  const [view, setView] = useState<CallView>(voiceSession.snapshot);
  useEffect(() => voiceSession.subscribe(setView), []);
  if (!view.active) return null;
  const canInterrupt = view.state === "speaking" || view.state === "thinking";
  return (
    <div className="fixed bottom-24 left-4 z-[90] flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full border border-emerald-400/40 bg-background/90 py-2 pl-4 pr-2 shadow-[0_10px_30px_rgba(6,78,59,0.25)] backdrop-blur-xl" role="status">
      <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-400" />
      <span className="min-w-0 truncate text-xs font-medium text-foreground">
        {view.roleText}
        <span className="text-muted-foreground"> · {view.statusText || "In a call"}</span>
      </span>
      {canInterrupt && (
        <button
          onClick={() => voiceSession.interrupt()}
          className="flex shrink-0 items-center gap-1 rounded-full border border-border px-2.5 py-1.5 text-[11px] font-medium hover:bg-muted"
          aria-label="Interrupt"
        >
          <Pause className="h-3 w-3" /> Interrupt
        </button>
      )}
      <button
        onClick={() => voiceSession.end()}
        className="flex shrink-0 items-center gap-1 rounded-full bg-red-500/90 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-red-500"
        aria-label="End call"
      >
        <PhoneOff className="h-3 w-3" /> End
      </button>
    </div>
  );
}
