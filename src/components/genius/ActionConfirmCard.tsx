import { Button } from "@/components/ui/button";
import { Check, X, AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProposedAction } from "@/lib/geniusActions";

interface Props {
  actions: ProposedAction[];
  onConfirm: (action: ProposedAction) => void;
  onCancel: (action: ProposedAction) => void;
  busyId?: string | null;
  doneIds?: Set<string>;
}

const riskColor: Record<ProposedAction["risk"], string> = {
  low: "border-emerald-400/40 from-emerald-500/10",
  medium: "border-amber-400/40 from-amber-500/10",
  high: "border-red-400/50 from-red-500/10",
};

export default function ActionConfirmCard({ actions, onConfirm, onCancel, busyId, doneIds }: Props) {
  return (
    <div className="space-y-2 mt-2">
      {actions.map((a) => {
        const done = doneIds?.has(a.id);
        const busy = busyId === a.id;
        return (
          <div
            key={a.id}
            className={cn(
              "relative rounded-xl border bg-gradient-to-br to-background/40 backdrop-blur-sm p-3 shadow-md",
              riskColor[a.risk]
            )}
          >
            <div className="flex items-start gap-2 mb-2">
              <span className="mt-0.5 h-6 w-6 rounded-md bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shrink-0">
                <Sparkles className="h-3 w-3 text-white" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-xs font-bold text-foreground">{a.title}</p>
                  {a.risk === "high" && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-red-400">
                      <AlertTriangle className="h-2.5 w-2.5" /> destructive
                    </span>
                  )}
                </div>
                {a.details.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {a.details.map((d, i) => (
                      <li key={i} className="text-[11px] text-muted-foreground leading-snug">
                        · {d}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {done ? (
              <p className="text-[11px] text-emerald-400 font-mono uppercase tracking-wider flex items-center gap-1">
                <Check className="h-3 w-3" /> Executed
              </p>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="h-7 px-3 text-xs gap-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
                  disabled={busy}
                  onClick={() => onConfirm(a)}
                >
                  {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-3 text-xs gap-1"
                  disabled={busy}
                  onClick={() => onCancel(a)}
                >
                  <X className="h-3 w-3" /> Skip
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
