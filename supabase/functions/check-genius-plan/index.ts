import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const log = (s: string, d?: unknown) => console.log(`[CHECK-GENIUS-PLAN] ${s}${d ? " - " + JSON.stringify(d) : ""}`);

// Stripe product -> plan key + monthly AI credits (higher wins when several are active).
const PLANS: Record<string, { plan: string; credits: number }> = {
  prod_VO19wW9Qe9JhxQ: { plan: "imagine_starter", credits: 180 },
  prod_VO1AspAEw0Txl0: { plan: "imagine_pro", credits: 600 },
  prod_VNGzBi4OgZ7Hgl: { plan: "imagine_starter", credits: 300 },
  prod_VNGzC3vqRTiZMN: { plan: "imagine_pro", credits: 700 },
  prod_VNHFv9mfca4xTZ: { plan: "imagine_studio", credits: 1600 },
  // Legacy plans converted to credits
  prod_UyMR3vZjOO9AGS: { plan: "starter", credits: 180 },
  prod_UyMS4Bfe7DgCzR: { plan: "pro", credits: 600 },
  prod_VBmemZuuco0yOB: { plan: "members_club", credits: 1000 },
  prod_VBmgE3TZ1f0O7F: { plan: "members_club", credits: 1000 },
};
// One-time credit packs: price -> credits (filled in once pack prices are confirmed)
const PACKS: Record<string, number> = {};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const { data: userData, error: userError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    await supabase.rpc("ai_credits_sync", { _user_id: user.id });

    let plan = "free", monthly = 0;
    let periodEnd: string | null = null, customerId: string | null = null, subscriptionId: string | null = null;
    let cancelAtPeriodEnd = false;

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (stripeKey) {
      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        const subs = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 20 });
        for (const sub of subs.data) {
          const item = sub.items.data[0] as any;
          const p = PLANS[item?.price?.product as string];
          if (!p) continue;
          // Monthly rollover: one grant per month of the current billing period (yearly subs get 12).
          const start = Number(item.current_period_start ?? (sub as any).current_period_start);
          const end = Number(item.current_period_end ?? (sub as any).current_period_end);
          const monthsIn = Math.max(0, Math.floor((Date.now() / 1000 - start) / (30.44 * 86400)));
          const ok = await supabase.rpc("ai_credits_grant", { _user_id: user.id, _amount: p.credits, _reason: "plan:" + p.plan, _ref: `plan:${sub.id}:${start}:${monthsIn}` });
          if (ok.data) log("Granted plan credits", { plan: p.plan, credits: p.credits });
          if (p.credits > monthly) {
            monthly = p.credits; plan = p.plan; subscriptionId = sub.id;
            periodEnd = end ? new Date(end * 1000).toISOString() : null;
            cancelAtPeriodEnd = !!sub.cancel_at_period_end;
          }
        }
        // Paid one-time credit packs (idempotent per checkout session)
        if (Object.keys(PACKS).length) {
          const sessions = await stripe.checkout.sessions.list({ customer: customerId, limit: 30 });
          for (const s of sessions.data) {
            if (s.mode !== "payment" || s.payment_status !== "paid" || s.metadata?.kind !== "ai_credit_pack") continue;
            const credits = PACKS[String(s.metadata?.price_id)];
            if (credits) await supabase.rpc("ai_credits_grant", { _user_id: user.id, _amount: credits, _reason: "pack", _ref: "pack:" + s.id });
          }
        }
      }
    }

    await supabase.from("user_ai_credits").update({ plan, plan_credits_monthly: monthly, last_plan_period_end: periodEnd }).eq("user_id", user.id);
    await supabase.from("genius_ai_plans").upsert(
      { user_id: user.id, plan, stripe_customer_id: customerId, stripe_subscription_id: subscriptionId, status: "active", current_period_end: periodEnd },
      { onConflict: "user_id" },
    );
    const { data: row } = await supabase.from("user_ai_credits").select("balance").eq("user_id", user.id).maybeSingle();

    return new Response(JSON.stringify({
      plan, monthly_credits: monthly, balance: Number(row?.balance ?? 0),
      current_period_end: periodEnd, cancel_at_period_end: cancelAtPeriodEnd, has_customer: !!customerId,
      // legacy fields
      limit: monthly, turns_used: 0, input_tokens: 0, output_tokens: 0, period_start: null,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    log("ERROR", { message: (error as Error).message });
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
