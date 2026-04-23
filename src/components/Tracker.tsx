import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, X, ArrowRight } from "lucide-react";
import {
  APP_VERSION,
  CHANGELOG,
  getLastSeenVersion,
  setLastSeenVersion,
  getUnseenEntries,
  isUpdatePromptSuppressed,
} from "@/lib/changelog";
import { cn } from "@/lib/utils";

/**
 * Tracker — detects app version changes and proposes the Take-the-Tour
 * to give a detailed, informed update of what's new.
 *
 * Renders a small toast-style card bottom-left when a new version is
 * available compared to the user's last-seen version.
 */
export default function Tracker() {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (isUpdatePromptSuppressed()) return;
    // Only trigger on the dashboard so the tour can target dashboard elements.
    if (!location.pathname.startsWith("/dashboard")) return;

    const last = getLastSeenVersion();
    if (last === APP_VERSION) return;
    // Defer slightly so the dashboard mounts first.
    const t = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(t);
  }, [user, location.pathname]);

  if (!open) return null;

  const unseen = getUnseenEntries(getLastSeenVersion());
  const latest = unseen[0] ?? CHANGELOG[0];

  const dismiss = (markSeen: boolean) => {
    if (markSeen) setLastSeenVersion(APP_VERSION);
    setOpen(false);
  };

  const startTour = () => {
    setLastSeenVersion(APP_VERSION);
    setOpen(false);
    // Re-use the existing Take-the-Tour engine.
    window.dispatchEvent(new CustomEvent("sfh:start-tour"));
  };

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 z-[80] w-[360px] max-w-[calc(100vw-2rem)]",
        "rounded-2xl border border-violet-400/40 bg-background/90 backdrop-blur-xl",
        "shadow-[0_20px_60px_-20px_hsl(263_70%_60%)] animate-scale-in"
      )}
      role="alertdialog"
      aria-label="App update available"
    >
      {/* Glow ribbon */}
      <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400" />

      <button
        onClick={() => dismiss(false)}
        aria-label="Close"
        className="absolute top-2.5 right-2.5 text-muted-foreground hover:text-foreground transition"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="relative">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 blur-md opacity-70 animate-pulse" />
            <div className="relative h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-wider text-violet-300">
              Tracker · v{APP_VERSION}
            </div>
            <h4 className="text-sm font-semibold leading-tight truncate">{latest.title}</h4>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
          {latest.summary}
        </p>

        {latest.highlights.length > 0 && (
          <ul className="mb-3 space-y-1">
            {latest.highlights.slice(0, 4).map((h) => (
              <li
                key={h}
                className="text-[11px] text-foreground/80 flex items-start gap-1.5"
              >
                <span className="mt-1 h-1 w-1 rounded-full bg-violet-400 shrink-0" />
                <span className="leading-snug">{h}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dismiss(true)}
            className="text-xs text-muted-foreground"
          >
            Dismiss
          </Button>
          <Button
            size="sm"
            onClick={startTour}
            className="gap-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500 hover:from-indigo-600 hover:via-violet-600 hover:to-cyan-600 text-white border-0"
          >
            Take the tour <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
