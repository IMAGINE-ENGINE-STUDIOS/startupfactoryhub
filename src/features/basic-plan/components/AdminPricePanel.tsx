// Admin-only editor for Basic Plan pricing. Writes go through the
// subscription_plan_config RLS policy (admins only); the checkout edge
// function reads the live Stripe price IDs from the same row.
import { useEffect, useState } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings2, Loader2 } from "lucide-react";
import type { BasicPlanConfig } from "../types";
import type { updateBasicPlanConfig } from "../api/basicPlanApi";

interface Props {
  plan: BasicPlanConfig;
  onSave: typeof updateBasicPlanConfig;
  onSaved: () => void;
}

export default function AdminPricePanel({ plan, onSave, onSaved }: Props) {
  const { role, loading } = useUserRole();
  const { toast } = useToast();
  const [monthly, setMonthly] = useState(String(plan.monthly_price_cents / 100));
  const [yearly, setYearly] = useState(String(plan.yearly_price_cents / 100));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMonthly(String(plan.monthly_price_cents / 100));
    setYearly(String(plan.yearly_price_cents / 100));
  }, [plan.monthly_price_cents, plan.yearly_price_cents]);

  if (loading || role !== "admin") return null;

  const handleSave = async () => {
    const monthlyCents = Math.round(Number(monthly) * 100);
    const yearlyCents = Math.round(Number(yearly) * 100);
    if (!Number.isFinite(monthlyCents) || !Number.isFinite(yearlyCents) || monthlyCents <= 0 || yearlyCents <= 0) {
      toast({ title: "Invalid prices", description: "Enter positive numbers.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await onSave({ monthly_price_cents: monthlyCents, yearly_price_cents: yearlyCents });
      toast({ title: "Pricing updated", description: "Displayed prices refresh immediately. Create matching Stripe prices before switching billing IDs." });
      onSaved();
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-[#0A1418] border border-cyan-400/15 rounded-md p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Settings2 className="h-5 w-5 text-primary" />
        <h3 className="font-semibold font-['Space_Grotesk'] tracking-wide">Admin — Pricing</h3>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="basic-monthly">Monthly price (USD)</Label>
          <Input id="basic-monthly" type="number" min={1} step={1} value={monthly} onChange={(e) => setMonthly(e.target.value)} className="bg-white/[0.03] border-white/10 focus:border-[#00E5FF]/50" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="basic-yearly">Yearly price (USD)</Label>
          <Input id="basic-yearly" type="number" min={1} step={1} value={yearly} onChange={(e) => setYearly(e.target.value)} className="bg-white/[0.03] border-white/10 focus:border-[#00E5FF]/50" />
        </div>
      </div>
      <Button onClick={handleSave} disabled={saving} variant="secondary" size="sm">
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Save pricing
      </Button>
    </Card>
  );
}
