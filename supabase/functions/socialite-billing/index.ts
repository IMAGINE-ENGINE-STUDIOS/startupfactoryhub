// SOCIALITE billing — plans, credit packs, free trial and the Genius add-on,
// charged through Stripe Checkout (STRIPE_SECRET_KEY). No webhook needed:
// the app calls `verify` on return from Checkout, and `status` re-reads the
// Stripe subscription at most once an hour so cancellations/renewals follow.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import Stripe from "npm:stripe@14.21.0";
import { z } from "npm:zod@3";
import { admin, requireUser } from "../_shared/socialiteVault.ts";
import { creditBalance, loadBilling, chargeStorage } from "../_shared/socialiteBilling.ts";

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const stripe = () => new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", { apiVersion: "2023-10-16", httpClient: Stripe.createFetchHttpClient() });

const Body = z.object({
  action: z.enum(["status", "checkout", "verify", "start_trial", "cancel", "admin_summary"]),
  kind: z.enum(["plan", "credits", "ai_addon"]).optional(),
  plan_id: z.string().max(60).optional(),
  pack_id: z.string().max(60).optional(),
  yearly: z.boolean().optional(),
  session_id: z.string().max(200).optional(),
  return_url: z.string().url().max(500).optional(),
  target: z.enum(["plan", "ai_addon"]).optional(),
});

const KINDS = ["posts", "email", "sms", "whatsapp", "call", "ai_tokens", "ai_image", "api_calls", "data_mb"];
const monthStart = () => { const d = new Date(); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString(); };

async function customerFor(userId: string, email: string) {
  const db = admin();
  const { data: sub } = await db.from("socialite_subscriptions").select("stripe_customer_id").eq("user_id", userId).maybeSingle();
  if (sub?.stripe_customer_id) return sub.stripe_customer_id as string;
  const found = email ? await stripe().customers.list({ email, limit: 1 }) : { data: [] as any[] };
  const id = found.data[0]?.id ?? (await stripe().customers.create({ email, metadata: { socialite_user: userId } })).id;
  await db.from("socialite_subscriptions").upsert({ user_id: userId, stripe_customer_id: id, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  return id;
}

async function refresh(userId: string) {
  const db = admin();
  const { data: sub } = await db.from("socialite_subscriptions").select("*").eq("user_id", userId).maybeSingle();
  if (!sub) return null;
  const stale = Date.now() - new Date(sub.updated_at).getTime() > 3600_000;
  if (!stale || (!sub.stripe_subscription_id && !sub.ai_addon_subscription_id)) return sub;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  try {
    if (sub.stripe_subscription_id) {
      const s = await stripe().subscriptions.retrieve(sub.stripe_subscription_id);
      patch.status = s.status === "active" || s.status === "trialing" ? s.status : s.status === "past_due" ? "past_due" : "canceled";
      patch.current_period_end = new Date(s.current_period_end * 1000).toISOString();
    }
    if (sub.ai_addon_subscription_id) {
      const a = await stripe().subscriptions.retrieve(sub.ai_addon_subscription_id);
      patch.ai_addon = a.status === "active" || a.status === "trialing";
    }
  } catch { /* keep last known state */ }
  const { data } = await db.from("socialite_subscriptions").update(patch).eq("user_id", userId).select("*").maybeSingle();
  return data ?? sub;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await requireUser(req);
    if ("error" in auth) return json({ error: auth.error }, auth.status);
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: "Invalid request" }, 400);
    const b = parsed.data;
    const db = admin();
    const cfg = await loadBilling();

    if (b.action === "status") {
      const sub = await refresh(auth.userId);
      const [{ data: plans }, { data: usage }, { data: ledger }, credits] = await Promise.all([
        db.from("socialite_plans").select("*").eq("active", true).order("sort"),
        db.from("socialite_usage").select("kind, units, credits").eq("user_id", auth.userId).gte("created_at", monthStart()),
        db.from("socialite_credit_ledger").select("delta, amount_usd, reason, created_at").eq("user_id", auth.userId).order("created_at", { ascending: false }).limit(20),
        creditBalance(auth.userId),
      ]);
      const storage = await chargeStorage(auth.userId, auth.isAdmin).catch(() => null);
      const used: Record<string, number> = Object.fromEntries(KINDS.map((k) => [k, 0]));
      (usage ?? []).forEach((u: any) => { used[u.kind] = (used[u.kind] ?? 0) + Number(u.units || 0); });
      return json({ config: cfg, plans: plans ?? [], subscription: sub, used, credits, ledger: ledger ?? [], isAdmin: auth.isAdmin, storage });
    }

    if (b.action === "start_trial") {
      if (!cfg.models?.trial) return json({ error: "Free trial is off" }, 400);
      const { data: sub } = await db.from("socialite_subscriptions").select("*").eq("user_id", auth.userId).maybeSingle();
      if (sub?.trial_ends_at || sub?.stripe_subscription_id) return json({ error: "Trial already used" }, 400);
      const plan = b.plan_id || cfg.trial_plan || "pro";
      const ends = new Date(Date.now() + Number(cfg.trial_days || 7) * 86400_000).toISOString();
      await db.from("socialite_subscriptions").upsert({ user_id: auth.userId, plan_id: plan, status: "trialing", trial_ends_at: ends, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      return json({ ok: true, trial_ends_at: ends });
    }

    if (b.action === "checkout") {
      const origin = b.return_url ?? req.headers.get("origin") ?? "https://startupfactoryhub.com/socialite";
      const back = origin.split("?")[0];
      const customer = await customerFor(auth.userId, auth.email);
      const meta = { user_id: auth.userId, kind: b.kind ?? "", plan_id: b.plan_id ?? "", pack_id: b.pack_id ?? "" };
      let session;
      if (b.kind === "plan") {
        if (!cfg.models?.subscription) return json({ error: "Subscriptions are off" }, 400);
        const { data: plan } = await db.from("socialite_plans").select("*").eq("id", b.plan_id ?? "").eq("active", true).maybeSingle();
        if (!plan) return json({ error: "Plan not found" }, 404);
        const amount = Math.round(Number(b.yearly ? plan.yearly_price : plan.monthly_price) * 100);
        if (amount <= 0) return json({ error: "This plan has no price" }, 400);
        session = await stripe().checkout.sessions.create({
          mode: "subscription", customer, metadata: meta, subscription_data: { metadata: meta },
          line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: amount, recurring: { interval: b.yearly ? "year" : "month" }, product_data: { name: `SOCIALITE ${plan.name}` } } }],
          success_url: `${back}?billing=done&session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${back}?billing=cancel`,
        });
      } else if (b.kind === "ai_addon") {
        if (cfg.ai?.mode !== "flat") return json({ error: "Genius add-on is not sold separately" }, 400);
        const amount = Math.round(Number(cfg.ai?.flat_monthly || 0) * 100);
        if (amount <= 0) return json({ error: "Add-on has no price" }, 400);
        session = await stripe().checkout.sessions.create({
          mode: "subscription", customer, metadata: meta, subscription_data: { metadata: meta },
          line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: amount, recurring: { interval: "month" }, product_data: { name: "SOCIALITE Genius add-on" } } }],
          success_url: `${back}?billing=done&session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${back}?billing=cancel`,
        });
      } else {
        if (!cfg.models?.credit_packs) return json({ error: "Credit packs are off" }, 400);
        const pack = (cfg.credit_packs ?? []).find((p: any) => p.id === b.pack_id);
        if (!pack) return json({ error: "Pack not found" }, 404);
        session = await stripe().checkout.sessions.create({
          mode: "payment", customer, metadata: meta,
          line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: Math.round(Number(pack.price) * 100), product_data: { name: `SOCIALITE ${pack.name}` } } }],
          success_url: `${back}?billing=done&session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${back}?billing=cancel`,
        });
      }
      return json({ url: session.url });
    }

    if (b.action === "verify") {
      if (!b.session_id) return json({ error: "Missing session" }, 400);
      const s = await stripe().checkout.sessions.retrieve(b.session_id);
      if (s.metadata?.user_id !== auth.userId) return json({ error: "Not your payment" }, 403);
      const kind = s.metadata?.kind;
      if (kind === "credits") {
        if (s.payment_status !== "paid") return json({ ok: false, pending: true });
        const pack = (cfg.credit_packs ?? []).find((p: any) => p.id === s.metadata?.pack_id);
        const credits = Number(pack?.credits ?? 0);
        await db.from("socialite_credit_ledger").upsert({ user_id: auth.userId, delta: credits, amount_usd: (s.amount_total ?? 0) / 100, reason: `Bought ${pack?.name ?? "credits"}`, stripe_session_id: s.id }, { onConflict: "stripe_session_id", ignoreDuplicates: true });
        return json({ ok: true, kind, credits });
      }
      if (!s.subscription) return json({ ok: false, pending: true });
      const sub = await stripe().subscriptions.retrieve(s.subscription as string);
      const now = new Date().toISOString();
      if (kind === "ai_addon") {
        await db.from("socialite_subscriptions").upsert({ user_id: auth.userId, ai_addon: true, ai_addon_subscription_id: sub.id, stripe_customer_id: s.customer as string, updated_at: now }, { onConflict: "user_id" });
      } else {
        await db.from("socialite_subscriptions").upsert({ user_id: auth.userId, plan_id: s.metadata?.plan_id, status: sub.status, current_period_end: new Date(sub.current_period_end * 1000).toISOString(), stripe_subscription_id: sub.id, stripe_customer_id: s.customer as string, updated_at: now }, { onConflict: "user_id" });
      }
      return json({ ok: true, kind });
    }

    if (b.action === "cancel") {
      const { data: sub } = await db.from("socialite_subscriptions").select("*").eq("user_id", auth.userId).maybeSingle();
      const id = b.target === "ai_addon" ? sub?.ai_addon_subscription_id : sub?.stripe_subscription_id;
      if (id) await stripe().subscriptions.update(id, { cancel_at_period_end: true });
      else if (b.target !== "ai_addon" && sub?.status === "trialing") await db.from("socialite_subscriptions").update({ status: "canceled" }).eq("user_id", auth.userId);
      return json({ ok: true, note: id ? "Ends at the close of the current period" : "Trial ended" });
    }

    if (b.action === "admin_summary") {
      if (!auth.isAdmin) return json({ error: "Admins only" }, 403);
      const [{ data: subs }, { data: plans }, { data: ledger }, { data: usage }] = await Promise.all([
        db.from("socialite_subscriptions").select("*"),
        db.from("socialite_plans").select("*"),
        db.from("socialite_credit_ledger").select("user_id, delta, amount_usd, reason, created_at").order("created_at", { ascending: false }).limit(500),
        db.from("socialite_usage").select("kind, units, credits").gte("created_at", monthStart()).limit(10000),
      ]);
      const planById = Object.fromEntries((plans ?? []).map((p: any) => [p.id, p]));
      const ids = (subs ?? []).map((s: any) => s.user_id);
      const { data: people } = ids.length ? await db.from("profiles").select("id, email, first_name, last_name").in("id", ids) : { data: [] };
      const who = Object.fromEntries((people ?? []).map((p: any) => [p.id, p]));
      const active = (subs ?? []).filter((s: any) => s.status === "active");
      const mrr = active.reduce((t: number, s: any) => t + Number(planById[s.plan_id]?.monthly_price ?? 0), 0)
        + (subs ?? []).filter((s: any) => s.ai_addon).length * Number(cfg.ai?.flat_monthly ?? 0) * (cfg.ai?.mode === "flat" ? 1 : 0);
      const creditRevenue = (ledger ?? []).reduce((t: number, l: any) => t + Number(l.amount_usd || 0), 0);
      const usageTotals: Record<string, { units: number; credits: number }> = {};
      (usage ?? []).forEach((u: any) => { const k = (usageTotals[u.kind] ??= { units: 0, credits: 0 }); k.units += Number(u.units); k.credits += Number(u.credits); });
      return json({
        mrr, creditRevenue, usageTotals,
        counts: { active: active.length, trialing: (subs ?? []).filter((s: any) => s.status === "trialing").length, canceled: (subs ?? []).filter((s: any) => s.status === "canceled").length, aiAddon: (subs ?? []).filter((s: any) => s.ai_addon).length },
        subscribers: (subs ?? []).map((s: any) => ({ ...s, email: who[s.user_id]?.email ?? "", name: [who[s.user_id]?.first_name, who[s.user_id]?.last_name].filter(Boolean).join(" ") })),
        purchases: (ledger ?? []).filter((l: any) => Number(l.amount_usd) > 0).slice(0, 50),
      });
    }
    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
