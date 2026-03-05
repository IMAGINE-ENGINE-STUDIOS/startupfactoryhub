import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TIER_MAP: Record<string, string> = {
  "prod_U1XG9MJn2KVcpW": "community",
  "prod_U1XHGc8mHzhFhJ": "self_paced_office",
  "prod_U1XQ4HPzkYzTHB": "global_access",
  "prod_U1XRb2qaUuoVyH": "corporate",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    // Platform owner override - full access without Stripe check
    const PLATFORM_OWNER_EMAILS = ["ceo@imagineengine.space"];
    if (PLATFORM_OWNER_EMAILS.includes(user.email.toLowerCase())) {
      return new Response(JSON.stringify({
        subscribed: true,
        tier: "corporate",
        product_id: "platform_owner",
        subscription_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        cancel_at_period_end: false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      return new Response(JSON.stringify({ subscribed: false, tier: "free" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return new Response(JSON.stringify({ subscribed: false, tier: "free" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sub = subscriptions.data[0];
    const productId = sub.items.data[0].price.product as string;
    const tier = TIER_MAP[productId] || "unknown";
    const subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();

    // Upsert subscription record
    await supabaseClient.from("user_subscriptions").upsert({
      user_id: user.id,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      product_id: productId,
      price_id: sub.items.data[0].price.id,
      tier,
      status: sub.status,
      current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end: subscriptionEnd,
      cancel_at_period_end: sub.cancel_at_period_end,
    }, { onConflict: "user_id" });

    // Process referral conversion if user was referred
    try {
      const referredBy = user.user_metadata?.referred_by;
      if (referredBy) {
        // Check if conversion already exists for this user
        const { data: existingConversion } = await supabaseClient
          .from("referral_conversions")
          .select("id")
          .eq("referred_user_id", user.id)
          .maybeSingle();

        if (!existingConversion) {
          // Find the referrer's account
          const { data: referrerAccount } = await supabaseClient
            .from("referral_accounts")
            .select("id, user_id, total_referrals, total_earned_cents")
            .eq("referral_code", referredBy)
            .maybeSingle();

          if (referrerAccount) {
            // Check if referrer is an official mentor (25% commission)
            const { data: officialStatus } = await supabaseClient
              .from("official_mentor_status")
              .select("is_official, referral_commission_rate")
              .eq("user_id", referrerAccount.user_id)
              .eq("is_official", true)
              .maybeSingle();

            const commissionRate = officialStatus ? (officialStatus.referral_commission_rate || 0.25) : 0.2;
            
            // Calculate subscription amount from price
            const priceAmount = sub.items.data[0].price.unit_amount || 0;
            const commissionCents = Math.floor(priceAmount * commissionRate); // Dynamic commission rate

            // Create conversion record
            await supabaseClient.from("referral_conversions").insert({
              referrer_id: referrerAccount.id,
              referred_user_id: user.id,
              subscription_tier: tier,
              subscription_amount_cents: priceAmount,
              commission_cents: commissionCents,
              status: "pending",
              stripe_subscription_id: sub.id,
            });

            // Update referrer stats
            await supabaseClient
              .from("referral_accounts")
              .update({
                total_referrals: (referrerAccount.total_referrals || 0) + 1,
                total_earned_cents: (referrerAccount.total_earned_cents || 0) + commissionCents,
              })
              .eq("id", referrerAccount.id);
          }
        }
      }
    } catch (refError) {
      console.error("Referral processing error:", refError);
      // Don't fail the main response for referral errors
    }

    return new Response(JSON.stringify({
      subscribed: true,
      tier,
      product_id: productId,
      subscription_end: subscriptionEnd,
      cancel_at_period_end: sub.cancel_at_period_end,
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
