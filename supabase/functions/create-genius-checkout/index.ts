import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Monthly subscriptions
const SUBSCRIPTION_PRICES = new Set([
  "price_1UNF7bK5N1RcUVuYHlnpmkkA", // Imagine Starter $9/mo - 180 credits
  "price_1UNF7vK5N1RcUVuY121ICYxa", // Imagine Pro $29/mo - 600 credits
  "price_1UNapwK5N1RcUVuYx1SW05kL", // Imagine Studio $60/mo - 1400 credits
  "price_1UMWhHK5N1RcUVuY1bB3pmLA", // legacy Studio $79/mo - 1600 credits
]);
// One-time credits: any amount >= $15, no cap. $0.05/credit; bonus rises to 15% at $500+.
const creditsFor = (usd: number) => {
  const bonus = usd >= 500 ? 0.15 : usd >= 250 ? 0.12 : usd >= 100 ? 0.08 : usd >= 60 ? 0.05 : 0;
  return Math.floor(usd * 20 * (1 + bonus));
};

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Please sign in first." }, 401);
    const { data } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    const user = data.user;
    if (!user?.email) return json({ error: "Please sign in first." }, 401);

    const body = await req.json().catch(() => ({}));
    const priceId = typeof body?.priceId === "string" ? body.priceId : "";
    const isSub = SUBSCRIPTION_PRICES.has(priceId);
    const amount = Math.round(Number(body?.amount) * 100) / 100;
    const isCredits = !isSub && Number.isFinite(amount) && amount > 0;
    if (!isSub && !isCredits) return json({ error: "Invalid plan" }, 400);
    if (isCredits && amount < 15) return json({ error: "The minimum credit purchase is $15." }, 400);
    if (isCredits && amount > 999999) return json({ error: "Please contact us for purchases this large." }, 400);
    const credits = isCredits ? creditsFor(amount) : 0;

    const returnTo = typeof body?.returnPath === "string" && body.returnPath.startsWith("/") ? body.returnPath : "/dashboard?tab=profile";
    const origin = req.headers.get("origin") || "https://startupfactoryhub.com";
    const sep = returnTo.includes("?") ? "&" : "?";

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data[0]?.id;

    if (isSub && customerId) {
      // Already on an Imagine plan? Send them to the portal to switch instead of double-billing.
      const subs = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 20 });
      const existing = subs.data.find((s) => s.items.data.some((i) => SUBSCRIPTION_PRICES.has(i.price.id)));
      if (existing) {
        const portal = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: `${origin}${returnTo}` });
        return json({ url: portal.url, portal: true });
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: isSub ? [{ price: priceId, quantity: 1 }] : [{
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(amount * 100),
          product_data: { name: `${credits.toLocaleString("en-US")} AI Credits`, description: "One-time AI credits. Credits never expire. All sales final." },
        },
      }],
      mode: isSub ? "subscription" : "payment",
      allow_promotion_codes: true,
      success_url: `${origin}${returnTo}${sep}credits=success`,
      cancel_url: `${origin}${returnTo}${sep}credits=cancelled`,
      metadata: { user_id: user.id, kind: isSub ? "imagine_plan" : "ai_credit_pack", price_id: priceId, credits: String(credits), no_refund: "true" },
    });
    return json({ url: session.url });
  } catch (error) {
    console.error("create-genius-checkout error:", error);
    return json({ error: (error as Error).message }, 500);
  }
});
