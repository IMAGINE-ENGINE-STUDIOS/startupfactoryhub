import { useState, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUp, Loader2, Sparkles } from "lucide-react";
import type { FlowSessionApi } from "@/hooks/useFlowSession";
import { cn } from "@/lib/utils";

interface Props {
  api: FlowSessionApi;
  onAsked?: () => void;
}

/**
 * Minimalistic always-visible chat bar pinned at the bottom of the FLOW widget.
 * Submits questions to the active investigation session.
 */
export default function FlowQuickAskBar({ api, onAsked }: Props) {
  const [draft, setDraft] = useState("");
  const { askQuestion, asking, sessionId } = api;

  const send = () => {
    const q = draft.trim();
    if (!q || asking || !sessionId) return;
    setDraft("");
    askQuestion(q);
    onAsked?.();
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div
      className={cn(
        "group relative flex items-center gap-2 rounded-full border bg-background/70 backdrop-blur-xl pl-4 pr-1.5 py-1.5 transition-all",
        "border-white/10 focus-within:border-violet-400/60",
        "shadow-[0_4px_30px_-10px_hsl(263_70%_60%/0.5)]"
      )}
    >
      <Sparkles
        className={cn(
          "h-3.5 w-3.5 shrink-0 transition-colors",
          asking ? "text-violet-300 animate-pulse" : "text-violet-400/70"
        )}
      />
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        disabled={!sessionId || asking}
        placeholder={
          sessionId
            ? "Ask Flow anything about this analysis…"
            : "Run an analysis to start asking questions."
        }
        className="flex-1 h-9 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 text-sm placeholder:text-muted-foreground/60"
      />
      <Button
        type="button"
        size="icon"
        onClick={send}
        disabled={!sessionId || asking || !draft.trim()}
        className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white shadow-[0_0_18px_-4px_hsl(263_70%_60%)] disabled:opacity-30"
        title="Send"
      >
        {asking ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ArrowUp className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  );
}
