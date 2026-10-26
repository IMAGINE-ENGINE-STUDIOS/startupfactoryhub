// @ts-nocheck -- shared mic button for every Genius/agent composer.
/**
 * The ONE mic button (founder directive 2026-10-25): tap → (first time:
 * the self-hosted Whisper model downloads, with progress) → speak →
 * tap again → your words land in the composer via onText. Transcription
 * happens on-device; no audio leaves the visitor's machine.
 */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Mic, Square, Loader2, ChevronDown, Check } from "lucide-react";
import { toast } from "sonner";
import { MicRecorder, micSupported } from "@/lib/voice/recorder";
import { loadWhisper, transcribeBlob } from "@/lib/voice/whisper";
import { VOICE_MODELS, getVoiceModel, setVoiceModel, onVoiceModelChange, type VoiceModelId } from "@/lib/voice/modelSetting";

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

  /* Voice-model dropdown (founder directive 2026-10-25): the caret on
   * the mic opens the model picker — Tiny / Base / Neural, tiered for
   * the future plans, all free while voice is in testing. */
  const [model, setModelState] = useState<VoiceModelId>(() => getVoiceModel());
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ bottom: number; right: number }>({ bottom: 0, right: 0 });
  const wrapRef = useRef<HTMLSpanElement>(null);
  useEffect(() => onVoiceModelChange((id) => setModelState(id)), []);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", close, true);
    return () => document.removeEventListener("pointerdown", close, true);
  }, [menuOpen]);
  const toggleMenu = () => {
    if (!menuOpen && wrapRef.current) {
      const r = wrapRef.current.getBoundingClientRect();
      setMenuPos({ bottom: Math.max(8, window.innerHeight - r.top + 8), right: Math.max(8, window.innerWidth - r.right) });
    }
    setMenuOpen((o) => !o);
  };
  const pickModel = (id: VoiceModelId) => {
    setMenuOpen(false);
    if (id === model) return;
    setVoiceModel(id);
    setModelState(id);
    const info = VOICE_MODELS.find((m) => m.id === id);
    toast.message(`Voice model: ${info?.name}`, { description: `Downloads ${info?.size} the first time it's used. Free while we test.` });
  };

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

  const activeModel = VOICE_MODELS.find((m) => m.id === model) || VOICE_MODELS[1];

  return (
    <span ref={wrapRef} className="relative inline-flex items-center shrink-0">
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
    <button
      type="button"
      onClick={toggleMenu}
      title={`Voice model: ${activeModel.name} — choose model`}
      aria-label="Choose voice model"
      aria-haspopup="menu"
      aria-expanded={menuOpen}
      className="-ml-1.5 inline-flex h-6 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground"
    >
      <ChevronDown className="h-3.5 w-3.5" />
    </button>
    {menuOpen && createPortal(
      <div
        role="menu"
        className="fixed z-[9999] w-[272px] rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-2xl"
        style={{ bottom: menuPos.bottom, right: menuPos.right }}
      >
        <div className="flex items-center justify-between px-2.5 pb-1.5 pt-2">
          <span className="text-xs font-semibold">Voice model</span>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">Free while we test</span>
        </div>
        {VOICE_MODELS.map((m) => (
          <button
            key={m.id}
            type="button"
            role="menuitemradio"
            aria-checked={m.id === model}
            onClick={() => pickModel(m.id)}
            className={`flex w-full items-start gap-2 rounded-xl px-2.5 py-2 text-left transition hover:bg-muted ${m.id === model ? "bg-muted/70" : ""}`}
          >
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="text-sm font-medium">{m.name}</span>
                <span className="rounded-full border border-border px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{m.tier}</span>
                <span className="text-[10px] text-muted-foreground">{m.size}</span>
              </span>
              <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">{m.tagline}</span>
            </span>
            {m.id === model && <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />}
          </button>
        ))}
        <p className="px-2.5 pb-2 pt-1.5 text-[10px] leading-relaxed text-muted-foreground">
          Listening runs Whisper on your own device. Neural talks back in the Kokoro neural voice. Your pick applies everywhere — Genius, the agents, the office, the Plaza.
        </p>
      </div>,
      document.body,
    )}
    </span>
  );
}
