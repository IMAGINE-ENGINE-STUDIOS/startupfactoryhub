// Monthly / Yearly billing cycle switch for the pricing card.
import { cn } from "@/lib/utils";
import type { BillingCycle } from "../types";

interface Props {
  value: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
  savingsPercent: number;
}

export default function BillingCycleToggle({ value, onChange, savingsPercent }: Props) {
  const option = (cycle: BillingCycle, label: string) => (
    <button
      key={cycle}
      type="button"
      onClick={() => onChange(cycle)}
      className={cn(
        "px-4 py-2 rounded-full text-sm font-medium transition-colors",
        value === cycle
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
      {cycle === "yearly" && savingsPercent > 0 && (
        <span className="ml-1.5 text-xs opacity-80">−{savingsPercent}%</span>
      )}
    </button>
  );

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 p-1">
      {option("monthly", "Monthly")}
      {option("yearly", "Yearly")}
    </div>
  );
}
