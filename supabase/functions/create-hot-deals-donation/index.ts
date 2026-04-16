import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { startup_id, amount_cents, donor_name, donor_email } = await req.json();

    if (!startup_id || !amount_cents || !donor_name) {
      return new Response(JSON.stringify({ error: "Missing required fields: startup_id, amount_cents, donor_name" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (amount_cents < 100) {
      return new Response(JSON.stringify({ error: "Minimum donation is $1.00" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Fetch startup details
    const { data: startup, error: startupError } = await supabaseClient
      .from("hot_deals_invited_startups")
      .select("id, company_name, stripe_connect_account_id, user_id")
      .eq("id", startup_id)
      .single();

    if (startupError || !startup) {
      return new Response(JSON.stringify({ error: "Startup not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Try to get Stripe Connect account - from startup directly or from payout_accounts
    let connectAccountId = startup.stripe_connect_account_id;
    if (!connectAccountId && startup.user_id) {
      const { data: payout } = await supabaseClient
        .from("payout_accounts")
        .select("stripe_account_id")
        .eq("user_id", startup.user_id)
        .eq("status", "active")
        .limit(1)
        .single();
      if (payout) connectAccountId = payout.stripe_account_id;
    }

    const platformFeeCents = Math.round(amount_cents * 0.20);
    const netAmountCents = amount_cents - platformFeeCents;

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const origin = req.headers.get("origin") || "https://startupfactoryhub.lovable.app";

    // Build checkout session params
    const sessionParams: any = {
      payment_method_types: ["card", "link"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Support ${startup.company_name}`,
              description: `Donation to ${startup.company_name} — Hot Deals in the Space Industry`,
            },
            unit_amount: amount_cents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/hot-deals-space?donation=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/hot-deals-space?donation=cancelled`,
      customer_email: donor_email || undefined,
    };

    // If startup has a connected Stripe account, use application_fee
    if (connectAccountId) {
      sessionParams.payment_intent_data = {
        application_fee_amount: platformFeeCents,
        transfer_data: {
          destination: connectAccountId,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Record pending donation
    await supabaseClient.from("hot_deals_donations").insert({
      startup_id,
      donor_name,
      donor_email: donor_email || null,
      amount_cents,
      platform_fee_cents: platformFeeCents,
      net_amount_cents: netAmountCents,
      stripe_session_id: session.id,
      status: "pending",
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[create-hot-deals-donation] ERROR:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
