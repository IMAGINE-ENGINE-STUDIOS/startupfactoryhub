// Creates a Stripe Checkout session for the Basic Plan.
// Resolves the price ID server-side from public.subscription_plan_config
// so the client can never substitute an arbitrary price.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-BASIC-PLAN-CHECKOUT] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const body = await req.json().catch(() => ({}));
    const cycle = body?.billingCycle === "yearly" ? "yearly" : "monthly";
    // Supported membership plans. Anything else falls back to `basic`.
    const planKey = body?.planKey === "investor" ? "investor" : "basic";
    const returnPath = planKey === "investor" ? "/investor-plan" : "/members-club";

    // Resolve price server-side from the plan configuration
    const { data: plan, error: planError } = await supabaseClient
      .from("subscription_plan_config")
      .select("stripe_monthly_price_id, stripe_yearly_price_id, is_active")
      .eq("key", planKey)
      .limit(1)
      .maybeSingle();
    if (planError) throw new Error(`Plan lookup failed: ${planError.message}`);
    if (!plan || !plan.is_active) throw new Error(`${planKey} plan is not available`);

    const priceId =
      cycle === "yearly" ? plan.stripe_yearly_price_id : plan.stripe_monthly_price_id;
    if (!priceId) throw new Error(`No Stripe price configured for ${cycle} billing`);
    logStep("Price resolved", { cycle, priceId });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data.length > 0 ? customers.data[0].id : undefined;

    const origin = req.headers.get("origin") || "https://startupfactoryhub.com";
    // Members Club event offer: 50% off the first month of the basic monthly plan (Stripe coupon COFFEE50).
    const coffeeOffer = body?.offer === "coffee50" && planKey === "basic" && cycle === "monthly";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      ...(coffeeOffer ? { discounts: [{ coupon: "COFFEE50" }] } : { allow_promotion_codes: true }),
      success_url: `${origin}${returnPath}?checkout=success`,
      cancel_url: `${origin}${planKey === "investor" ? "/investor-plan" : "/membership"}?checkout=cancelled`,
      metadata: { user_id: user.id, plan: planKey, billing_cycle: cycle, ...(coffeeOffer ? { offer: "coffee50" } : {}) },
    });
    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
