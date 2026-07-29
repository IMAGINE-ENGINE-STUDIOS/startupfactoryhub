import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Genius AI plan products
const PLAN_MAP: Record<string, string> = {
  prod_UyMR3vZjOO9AGS: "starter",
  prod_UyMS4Bfe7DgCzR: "pro",
};

const LIMITS: Record<string, number> = {
  free: 50,
  starter: 1000,
  pro: 5000,
  enterprise: 1000000,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const { data: userData, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    let plan = "free";
    let periodEnd: string | null = null;
    let customerId: string | null = null;
    let subscriptionId: string | null = null;

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (stripeKey) {
      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        const subs = await stripe.subscriptions.list({
          customer: customerId,
          status: "active",
          limit: 10,
        });
        for (const sub of subs.data) {
          const productId = sub.items.data[0]?.price.product as string;
          if (PLAN_MAP[productId]) {
            plan = PLAN_MAP[productId];
            subscriptionId = sub.id;
            periodEnd = new Date(sub.current_period_end * 1000).toISOString();
            break;
          }
        }
      }
    }

    await supabase.from("genius_ai_plans").upsert(
      {
        user_id: user.id,
        plan,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        status: "active",
        current_period_end: periodEnd,
      },
      { onConflict: "user_id" }
    );

    const periodStart = new Date();
    periodStart.setUTCDate(1);
    const periodKey = periodStart.toISOString().slice(0, 10);

    const { data: usage } = await supabase
      .from("genius_ai_usage")
      .select("turns_used, input_tokens, output_tokens")
      .eq("user_id", user.id)
      .eq("period_start", periodKey)
      .maybeSingle();

    return new Response(
      JSON.stringify({
        plan,
        limit: LIMITS[plan] ?? 50,
        turns_used: usage?.turns_used ?? 0,
        input_tokens: usage?.input_tokens ?? 0,
        output_tokens: usage?.output_tokens ?? 0,
        current_period_end: periodEnd,
        period_start: periodKey,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("check-genius-plan error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
