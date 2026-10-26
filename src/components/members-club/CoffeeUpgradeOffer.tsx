// Members Club 50% upgrade offer for non-paying visitors (Innovation Coffee Table invite).
// Checkout applies the COFFEE50 Stripe coupon server-side; price is never set by the client.
// Credits: Imagine Engine Studios Corp.
import { useState } from "react";
import { Coffee, Loader2, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { createBasicPlanCheckout } from "@/features/basic-plan/api/basicPlanApi";

export default function CoffeeUpgradeOffer() {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const claim = async () => {
    setBusy(true);
    try {
      window.location.href = await createBasicPlanCheckout("monthly", "coffee50");
    } catch (e) {
      toast({ title: "Checkout unavailable", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
      setBusy(false);
    }
  };

  return (
    <Card className="tech-card border-0 p-6 space-y-4 border-primary/40">
      <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-mono uppercase tracking-widest text-primary">
        <Sparkles className="h-3.5 w-3.5" /> Members Club offer · 50% off
      </span>
      <div>
        <h2 className="text-2xl font-bold">Upgrade and get your coffee today</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Join Venture Network for <span className="font-semibold text-foreground">$25</span> your first month
          (<span className="line-through">$50</span>), then $50/month. Unlock your member card, coffee at the
          Innovation Coffee Table and every member feature. Cancel anytime.
        </p>
      </div>
      <Button size="lg" className="gap-2 w-full sm:w-auto" onClick={claim} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Coffee className="h-4 w-4" />}
        Claim 50% off
      </Button>
    </Card>
  );
}
