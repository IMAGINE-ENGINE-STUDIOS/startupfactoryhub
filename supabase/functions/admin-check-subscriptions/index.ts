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

const PLATFORM_OWNER_EMAILS = ["ceo@imagineengine.space"];

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
    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);

    const callerUser = userData.user;
    if (!callerUser) throw new Error("Not authenticated");

    // Check admin role
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerUser.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) throw new Error("Unauthorized: admin role required");

    const { user_ids } = await req.json();
    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return new Response(JSON.stringify({}), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get emails for all user_ids
    const { data: profiles } = await supabaseClient
      .from("profiles")
      .select("user_id, email")
      .in("user_id", user_ids);

    const emailMap: Record<string, string> = {};
    for (const p of profiles || []) {
      if (p.email) emailMap[p.user_id] = p.email;
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const result: Record<string, { subscribed: boolean; tier: string }> = {};

    for (const userId of user_ids) {
      const email = emailMap[userId];
      if (!email) {
        result[userId] = { subscribed: false, tier: "free" };
        continue;
      }

      // Platform owner bypass
      if (PLATFORM_OWNER_EMAILS.includes(email.toLowerCase())) {
        result[userId] = { subscribed: true, tier: "corporate" };
        continue;
      }

      try {
        const customers = await stripe.customers.list({ email, limit: 1 });
        if (customers.data.length === 0) {
          result[userId] = { subscribed: false, tier: "free" };
          continue;
        }

        const subscriptions = await stripe.subscriptions.list({
          customer: customers.data[0].id,
          status: "active",
          limit: 1,
        });

        if (subscriptions.data.length === 0) {
          result[userId] = { subscribed: false, tier: "free" };
          continue;
        }

        const productId = subscriptions.data[0].items.data[0].price.product as string;
        const tier = TIER_MAP[productId] || "unknown";
        result[userId] = { subscribed: true, tier };
      } catch (e) {
        console.error(`Error checking subscription for ${userId}:`, e);
        result[userId] = { subscribed: false, tier: "free" };
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
