// Data access layer for the Investor Priority membership: plan configuration
// read and Stripe checkout invocation. All Supabase calls for this feature
// live here so components stay presentational.
import { supabase } from "@/integrations/supabase/client";
import type { InvestorPlanConfig, InvestorBillingCycle } from "../types";

/** Loads the active `investor` plan configuration. Throws on failure. */
export async function fetchInvestorPlanConfig(): Promise<InvestorPlanConfig> {
  const { data, error } = await supabase
    .from("subscription_plan_config")
    .select(
      "key, name, monthly_price_cents, yearly_price_cents, currency, stripe_monthly_price_id, stripe_yearly_price_id, entitlements, is_active"
    )
    .eq("key", "investor")
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Investor plan configuration not found");
  return data as unknown as InvestorPlanConfig;
}

/** Opens a Stripe Checkout session for the chosen billing cycle. */
export async function createInvestorPlanCheckout(
  cycle: InvestorBillingCycle
): Promise<string> {
  const { data, error } = await supabase.functions.invoke(
    "create-basic-plan-checkout",
    { body: { billingCycle: cycle, planKey: "investor" } }
  );
  if (error) throw new Error(error.message);
  if (!data?.url) throw new Error("Checkout session URL missing");
  return data.url as string;
}
