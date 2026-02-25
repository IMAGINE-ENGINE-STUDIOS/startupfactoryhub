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

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Get or create the connected account
    const { data: existingAccount } = await supabase
      .from("payout_accounts")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    let connectedAccountId = existingAccount?.stripe_connect_account_id;

    if (!connectedAccountId) {
      // Create new Stripe Connect Express account
      const { country = "US" } = await req.json().catch(() => ({}));
      
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

      connectedAccountId = account.id;

      await supabase.from("payout_accounts").upsert({
        user_id: user.id,
        stripe_connect_account_id: account.id,
        account_status: "pending",
        country,
      }, { onConflict: "user_id" });
    }

    // Create Account Session for embedded onboarding
    const accountSession = await stripe.accountSessions.create({
      account: connectedAccountId,
      components: {
        account_onboarding: {
          enabled: true,
          features: {
            external_account_collection: true,
          },
        },
      },
    });

    // Check current account status
    const account = await stripe.accounts.retrieve(connectedAccountId);
    const status = account.charges_enabled ? "active" : account.details_submitted ? "pending" : "pending";

    if (existingAccount && existingAccount.account_status !== status) {
      await supabase
        .from("payout_accounts")
        .update({ account_status: status })
        .eq("user_id", user.id);
    }

    return new Response(JSON.stringify({
      client_secret: accountSession.client_secret,
      account_id: connectedAccountId,
      status,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating account session:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
