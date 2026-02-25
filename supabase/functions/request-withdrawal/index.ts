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
    if (!user) throw new Error("User not authenticated");

    const { amount_cents, source = "referrals" } = await req.json();
    if (!amount_cents || amount_cents <= 0) throw new Error("Invalid amount");

    // Verify payout account exists and is active
    const { data: payoutAccount } = await supabase
      .from("payout_accounts")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!payoutAccount?.stripe_connect_account_id) {
      throw new Error("No payout account configured. Please set up your payout account first.");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Verify the Connect account is active
    const account = await stripe.accounts.retrieve(payoutAccount.stripe_connect_account_id);
    if (!account.charges_enabled) {
      throw new Error("Your payout account is not yet fully verified. Please complete onboarding.");
    }

    // Calculate available balance
    const { data: referralAccount } = await supabase
      .from("referral_accounts")
      .select("total_earned_cents")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: events } = await supabase
      .from("events")
      .select("id")
      .eq("organizer_id", user.id)
      .eq("is_paid", true);

    let eventEarnings = 0;
    if (events && events.length > 0) {
      const { data: payments } = await supabase
        .from("event_payments")
        .select("amount_cents, platform_fee_cents")
        .in("event_id", events.map(e => e.id))
        .eq("payment_status", "paid");
      eventEarnings = (payments || []).reduce((sum, p) => sum + ((p.amount_cents || 0) - (p.platform_fee_cents || 0)), 0);
    }

    const { data: withdrawals } = await supabase
      .from("payout_requests")
      .select("amount_cents")
      .eq("user_id", user.id)
      .in("status", ["pending", "processing", "completed"]);

    const totalWithdrawn = (withdrawals || []).reduce((sum, w) => sum + (w.amount_cents || 0), 0);
    const totalEarnings = (referralAccount?.total_earned_cents || 0) + eventEarnings;
    const available = totalEarnings - totalWithdrawn;

    if (amount_cents > available) {
      throw new Error(`Insufficient balance. Available: $${(available / 100).toFixed(2)}`);
    }

    // Create Stripe transfer
    const transfer = await stripe.transfers.create({
      amount: amount_cents,
      currency: "usd",
      destination: payoutAccount.stripe_connect_account_id,
      metadata: {
        user_id: user.id,
        source,
      },
    });

    // Record payout request
    const { data: payoutRequest, error: insertError } = await supabase
      .from("payout_requests")
      .insert({
        user_id: user.id,
        amount_cents,
        source,
        status: "completed",
        stripe_transfer_id: transfer.id,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) throw new Error(`Failed to record payout: ${insertError.message}`);

    return new Response(JSON.stringify({
      success: true,
      transfer_id: transfer.id,
      amount_cents,
      payout_request_id: payoutRequest.id,
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
