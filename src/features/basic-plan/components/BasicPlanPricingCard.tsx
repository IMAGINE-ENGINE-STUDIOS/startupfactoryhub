// Pricing card for the Basic Plan: cycle toggle, live price, savings,
// entitlement checklist and the Stripe test-checkout button.
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2 } from "lucide-react";
import { createBasicPlanCheckout } from "../api/basicPlanApi";
import { formatCents } from "../hooks/useBasicPlan";
import type { BasicPlanConfig, BillingCycle, Entitlement } from "../types";
import BillingCycleToggle from "./BillingCycleToggle";

interface Props {
  plan: BasicPlanConfig;
  entitlements: Entitlement[];
  cycle: BillingCycle;
  onCycleChange: (cycle: BillingCycle) => void;
  savingsPercent: number;
}

export default function BasicPlanPricingCard({
  plan,
  entitlements,
  cycle,
  onCycleChange,
  savingsPercent,
}: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [checkingOut, setCheckingOut] = useState(false);

  const priceCents = cycle === "yearly" ? plan.yearly_price_cents : plan.monthly_price_cents;
  const perMonth =
    cycle === "yearly" ? formatCents(Math.round(plan.yearly_price_cents / 12)) : null;

  const handleCheckout = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Sign in to test the Stripe checkout flow.",
      });
      return;
    }
    setCheckingOut(true);
    try {
      const url = await createBasicPlanCheckout(cycle);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast({
        title: "Checkout failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <Card className="tech-card border-0 p-6 md:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{plan.name}</h2>
          <p className="text-sm text-muted-foreground">
            Full access to the SFH ecosystem
          </p>
        </div>
        <BillingCycleToggle value={cycle} onChange={onCycleChange} savingsPercent={savingsPercent} />
      </div>

      <div className="flex items-end gap-3">
        <span className="text-5xl font-bold tracking-tight">{formatCents(priceCents)}</span>
        <span className="text-muted-foreground pb-1.5">
          / {cycle === "yearly" ? "year" : "month"}
        </span>
        {perMonth && (
          <Badge variant="secondary" className="mb-2">
            {perMonth}/mo billed yearly
          </Badge>
        )}
      </div>

      <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
        {entitlements.map((e) => (
          <li key={e.key} className="flex items-start gap-2 text-sm">
            <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
            <span>{e.label}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <Button onClick={handleCheckout} disabled={checkingOut} size="lg" className="sm:w-auto w-full">
          {checkingOut && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Subscribe (Stripe test checkout)
        </Button>
        <p className="text-xs text-muted-foreground">
          Opens a real Stripe Checkout session against the configured price. No data is written elsewhere in the app.
        </p>
      </div>
    </Card>
  );
}
