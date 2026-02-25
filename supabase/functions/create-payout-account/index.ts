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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { country = "US" } = await req.json().catch(() => ({}));

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check existing payout account
    const { data: existingAccount } = await supabase
      .from("payout_accounts")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingAccount?.stripe_connect_account_id) {
      // If account exists, create a new onboarding link
      const accountLink = await stripe.accountLinks.create({
        account: existingAccount.stripe_connect_account_id,
        refresh_url: `${req.headers.get("origin")}/dashboard`,
        return_url: `${req.headers.get("origin")}/dashboard`,
        type: "account_onboarding",
      });

      // Check account status
      const account = await stripe.accounts.retrieve(existingAccount.stripe_connect_account_id);
      const status = account.charges_enabled ? "active" : account.details_submitted ? "pending" : "pending";

      await supabase
        .from("payout_accounts")
        .update({ account_status: status })
        .eq("user_id", user.id);

      return new Response(JSON.stringify({
        url: accountLink.url,
        account_id: existingAccount.stripe_connect_account_id,
        status,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create new Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: "express",
      email: user.email,
      country,
      capabilities: {
        transfers: { requested: true },
      },
      metadata: {
        user_id: user.id,
        platform: "startup_factory_hub",
      },
    });

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${req.headers.get("origin")}/dashboard`,
      return_url: `${req.headers.get("origin")}/dashboard`,
      type: "account_onboarding",
    });

    // Upsert payout account record
    await supabase.from("payout_accounts").upsert({
      user_id: user.id,
      stripe_connect_account_id: account.id,
      account_status: "pending",
      country,
    }, { onConflict: "user_id" });

    return new Response(JSON.stringify({
      url: accountLink.url,
      account_id: account.id,
      status: "pending",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
