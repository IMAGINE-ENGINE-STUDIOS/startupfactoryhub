// @ts-nocheck -- shared mic button for every Genius/agent composer.
/**
 * The ONE mic button (founder directive 2026-10-25): tap → (first time:
 * the self-hosted Whisper model downloads, with progress) → speak →
 * tap again → your words land in the composer via onText. Transcription
 * happens on-device; no audio leaves the visitor's machine.
 */
import { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MicRecorder, micSupported } from "@/lib/voice/recorder";
import { loadWhisper, transcribeBlob } from "@/lib/voice/whisper";

export default function VoiceMicButton({
  onText,
  className = "",
  iconClassName = "w-4 h-4",
}: {
  onText: (text: string) => void;
  className?: string;
  iconClassName?: string;
}) {
  const [state, setState] = useState<"idle" | "loading" | "recording" | "busy">("idle");
  const [pct, setPct] = useState<number | null>(null);
  const recRef = useRef<MicRecorder | null>(null);
  const aliveRef = useRef(true);
  useEffect(() => () => { aliveRef.current = false; recRef.current?.cancel(); }, []);

  if (!micSupported()) return null;

  const tap = async () => {
    if (state === "loading" || state === "busy") return;
    if (state === "recording") {
      setState("busy");
      try {
        const blob = await recRef.current?.stop();
        const text = blob ? await transcribeBlob(blob) : "";
        if (!aliveRef.current) return;
        if (text) onText(text);
        else toast.message("I didn't catch that — try again a little closer to the mic.");
      } catch (e: any) {
        if (aliveRef.current) toast.error(e?.message || "Transcription failed");
      }
      if (aliveRef.current) setState("idle");
      return;
    }
    // idle → (load model once) → record
    try {
      setState("loading");
      await loadWhisper((p) => { if (aliveRef.current) setPct(p); });
      if (!aliveRef.current) return;
      setPct(null);
      recRef.current = new MicRecorder();
      await recRef.current.start();
      if (!aliveRef.current) { recRef.current.cancel(); return; }
      setState("recording");
    } catch (e: any) {
      if (!aliveRef.current) return;
      setState("idle");
      toast.error(
        /denied|permission/i.test(e?.message || "")
          ? "Microphone permission was denied — allow the mic to talk to Genius."
          : e?.message || "Could not start the microphone",
      );
    }
  };

  const label =
    state === "loading" ? (pct !== null && pct < 100 ? `Loading voice model ${pct}%` : "Loading voice model…")
    : state === "recording" ? "Listening — tap to finish"
    : state === "busy" ? "Transcribing…"
    : "Talk: dictate with your voice (on-device Whisper)";

  return (
    <button
      type="button"
      onClick={() => void tap()}
      title={label}
      aria-label={label}
      className={`relative shrink-0 inline-flex items-center justify-center rounded-full border transition ${
        state === "recording"
          ? "border-red-400 bg-red-500/15 text-red-400 animate-pulse"
          : "border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/60"
      } ${className || "h-9 w-9"}`}
    >
      {state === "loading" || state === "busy" ? (
        <Loader2 className={`${iconClassName} animate-spin`} />
      ) : state === "recording" ? (
        <Square className={iconClassName} />
      ) : (
        <Mic className={iconClassName} />
      )}
      {state === "loading" && pct !== null && pct < 100 && (
        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-medium text-muted-foreground whitespace-nowrap">{pct}%</span>
      )}
    </button>
  );
}
