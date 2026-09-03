// Data access layer for the Basic Plan feature: plan configuration
// read/write and Stripe checkout invocation. All Supabase calls for this
// feature live here so components stay purely presentational.
import { supabase } from "@/integrations/supabase/client";
import type { BasicPlanConfig, BillingCycle } from "../types";

/** Loads the active `basic` plan configuration. Throws on failure. */
export async function fetchBasicPlanConfig(): Promise<BasicPlanConfig> {
  const { data, error } = await supabase
    .from("subscription_plan_config")
    .select(
      "key, name, monthly_price_cents, yearly_price_cents, currency, stripe_monthly_price_id, stripe_yearly_price_id, entitlements, is_active"
    )
    .eq("key", "basic")
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Basic plan configuration not found");
  return data as unknown as BasicPlanConfig;
}

/** Persists admin edits to pricing (and optionally entitlements). */
export async function updateBasicPlanConfig(input: {
  monthly_price_cents: number;
  yearly_price_cents: number;
}): Promise<void> {
  const { error } = await supabase
    .from("subscription_plan_config")
    .update({
      monthly_price_cents: input.monthly_price_cents,
      yearly_price_cents: input.yearly_price_cents,
    })
    .eq("key", "basic");

  if (error) throw new Error(error.message);
}

/** Opens a Stripe Checkout session for the chosen billing cycle. */
export async function createBasicPlanCheckout(cycle: BillingCycle): Promise<string> {
  const { data, error } = await supabase.functions.invoke(
    "create-basic-plan-checkout",
    { body: { billingCycle: cycle } }
  );
  if (error) throw new Error(error.message);
  if (!data?.url) throw new Error("Checkout session URL missing");
  return data.url as string;
}
