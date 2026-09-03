// Upgrade pop-up shown whenever a free user touches a member-only feature.
// Offers monthly / yearly checkout plus a link to the full membership brochure.
import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Loader2, Lock, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useBasicPlan, formatCents } from "../hooks/useBasicPlan";
import { createBasicPlanCheckout } from "../api/basicPlanApi";
import type { BillingCycle } from "../types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Human-readable name of the blocked feature. */
  feature?: string;
}

const HIGHLIGHTS = [
  "Post in the community feed and the resource map",
  "Apply to acceleration and MVP programs",
  "Contact investors directly",
  "Events, internships, volunteering and technology transfer",
  "Certified courses and member pricing",
];

export default function MembershipUpgradeDialog({ open, onOpenChange, feature }: Props) {
  const { plan, savingsPercent } = useBasicPlan();
  const { user } = useAuth();
  const { toast } = useToast();
  const [busy, setBusy] = useState<BillingCycle | null>(null);

  const start = async (cycle: BillingCycle) => {
    if (!user) {
      window.location.href = "/auth";
      return;
    }
    setBusy(cycle);
    try {
      const url = await createBasicPlanCheckout(cycle);
      window.open(url, "_blank");
    } catch (e) {
      toast({
        title: "Checkout unavailable",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-background backdrop-blur-none border-primary/30 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-2">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-black">Members only</DialogTitle>
          <DialogDescription className="text-base">
            {feature ? `“${feature}” is` : "This feature is"} included with any Startup Factory Hub
            membership. Free accounts stay read-only.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 text-sm">
          {HIGHLIGHTS.map((h) => (
            <li key={h} className="flex gap-2 text-muted-foreground">
              <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              {h}
            </li>
          ))}
        </ul>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          <button
            onClick={() => start("monthly")}
            disabled={busy !== null}
            className="rounded-xl border border-border p-4 text-left hover:border-primary/60 transition disabled:opacity-60"
          >
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Monthly</div>
            <div className="text-3xl font-black">{formatCents(plan.monthly_price_cents)}</div>
            <div className="text-xs text-muted-foreground">per month · annual term</div>
            <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary">
              {busy === "monthly" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Subscribe
            </div>
          </button>

          <button
            onClick={() => start("yearly")}
            disabled={busy !== null}
            className="rounded-xl border border-primary/50 bg-primary/5 p-4 text-left hover:border-primary transition disabled:opacity-60"
          >
            <div className="text-xs uppercase tracking-widest text-primary">
              Yearly · save {savingsPercent}%
            </div>
            <div className="text-3xl font-black">{formatCents(plan.yearly_price_cents)}</div>
            <div className="text-xs text-muted-foreground">billed once a year</div>
            <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary">
              {busy === "yearly" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Subscribe
            </div>
          </button>
        </div>

        <Button asChild variant="ghost" className="w-full">
          <Link to="/basic-plan" onClick={() => onOpenChange(false)}>
            Find out more about the membership
          </Link>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
