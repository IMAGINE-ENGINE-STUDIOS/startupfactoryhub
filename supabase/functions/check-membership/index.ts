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
