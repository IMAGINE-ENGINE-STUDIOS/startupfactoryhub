import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company_id, amount_cents, donor_name, donor_email, message } = await req.json();

    if (!company_id || !amount_cents || !donor_name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: company_id, amount_cents, donor_name" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }
    if (amount_cents < 100) {
      return new Response(JSON.stringify({ error: "Minimum donation is $1.00" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { data: company, error: companyErr } = await supabase
      .from("companies")
      .select("id, name, user_id")
      .eq("id", company_id)
      .single();

    if (companyErr || !company) {
      return new Response(JSON.stringify({ error: "Startup not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Resolve Stripe Connect account from payout_accounts
    let connectAccountId: string | null = null;
    if (company.user_id) {
      const { data: payout } = await supabase
        .from("payout_accounts")
        .select("stripe_account_id, status")
        .eq("user_id", company.user_id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      if (payout) connectAccountId = payout.stripe_account_id;
    }

    // Platform takes 20% on donations per the project commission model
    const platformFeeCents = Math.round(amount_cents * 0.20);
    const netAmountCents = amount_cents - platformFeeCents;

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const origin = req.headers.get("origin") || "https://startupfactoryhub.com";

    const sessionParams: any = {
      payment_method_types: ["card", "link"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Support ${company.name}`,
              description: `Donation to ${company.name} — Venezuela Rebuild Initiative`,
            },
            unit_amount: amount_cents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/venezuela-rebuild?donation=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/venezuela-rebuild?donation=cancelled`,
      customer_email: donor_email || undefined,
    };

    if (connectAccountId) {
      sessionParams.payment_intent_data = {
        application_fee_amount: platformFeeCents,
        transfer_data: { destination: connectAccountId },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    await supabase.from("venezuela_rebuild_donations").insert({
      company_id,
      donor_name,
      donor_email: donor_email || null,
      amount_cents,
      platform_fee_cents: platformFeeCents,
      net_amount_cents: netAmountCents,
      stripe_session_id: session.id,
      status: "pending",
      message: message || null,
    });

    return new Response(
      JSON.stringify({ url: session.url, connected: !!connectAccountId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[create-venezuela-donation] ERROR:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
