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

    // Get payout account
    const { data: payoutAccount } = await supabase
      .from("payout_accounts")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    // Get referral earnings
    const { data: referralAccount } = await supabase
      .from("referral_accounts")
      .select("total_earned_cents, total_referrals, total_clicks")
      .eq("user_id", user.id)
      .maybeSingle();

    // Get event earnings
    const { data: events } = await supabase
      .from("events")
      .select("id")
      .eq("organizer_id", user.id)
      .eq("is_paid", true);

    let eventEarningsCents = 0;
    if (events && events.length > 0) {
      const eventIds = events.map(e => e.id);
      const { data: payments } = await supabase
        .from("event_payments")
        .select("amount_cents, platform_fee_cents")
        .in("event_id", eventIds)
        .eq("payment_status", "paid");

      if (payments) {
        eventEarningsCents = payments.reduce((sum, p) => sum + ((p.amount_cents || 0) - (p.platform_fee_cents || 0)), 0);
      }
    }

    // Get already withdrawn amounts
    const { data: withdrawals } = await supabase
      .from("payout_requests")
      .select("amount_cents, status")
      .eq("user_id", user.id)
      .in("status", ["pending", "processing", "completed"]);

    const totalWithdrawn = (withdrawals || []).reduce((sum, w) => sum + (w.amount_cents || 0), 0);

    const referralEarnings = referralAccount?.total_earned_cents || 0;
    const totalEarnings = referralEarnings + eventEarningsCents;
    const availableBalance = Math.max(0, totalEarnings - totalWithdrawn);

    // Check Stripe account status if exists
    let stripeStatus = null;
    if (payoutAccount?.stripe_connect_account_id) {
      try {
        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
          apiVersion: "2025-08-27.basil",
        });
        const account = await stripe.accounts.retrieve(payoutAccount.stripe_connect_account_id);
        stripeStatus = account.charges_enabled ? "active" : "pending";
        
        // Update status in DB
        if (stripeStatus !== payoutAccount.account_status) {
          await supabase
            .from("payout_accounts")
            .update({ account_status: stripeStatus })
            .eq("user_id", user.id);
        }
      } catch (e) {
        stripeStatus = "error";
      }
    }

    return new Response(JSON.stringify({
      has_payout_account: !!payoutAccount?.stripe_connect_account_id,
      account_status: stripeStatus || payoutAccount?.account_status || null,
      available_balance_cents: availableBalance,
      referral_earnings_cents: referralEarnings,
      event_earnings_cents: eventEarningsCents,
      total_withdrawn_cents: totalWithdrawn,
      referral_stats: {
        total_clicks: referralAccount?.total_clicks || 0,
        total_referrals: referralAccount?.total_referrals || 0,
      },
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
