// SOCIALITE commercial metering — one place that decides whether a user may
// post / send / use Genius, and records what it cost.
// Order: main admin → free. Active/trialing plan → use monthly allowance.
// Past the allowance (or no plan) → pay with credits if the admin enabled
// pay-per-use / overage. Otherwise the action is refused with a clear reason.
import { admin } from "./socialiteVault.ts";

export type MeterKind = "posts" | "email" | "sms" | "whatsapp" | "call" | "ai_tokens" | "ai_image";

// credit_costs keys per kind (ai_tokens is priced per 1,000 tokens)
const COST_KEY: Record<MeterKind, string> = {
  posts: "post", email: "email", sms: "sms", whatsapp: "whatsapp", call: "call", ai_tokens: "ai_1k_tokens", ai_image: "ai_image",
};

export async function loadBilling() {
  const sb = admin();
  const { data } = await sb.from("socialite_billing_config").select("config").eq("id", 1).maybeSingle();
  return (data?.config ?? {}) as any;
}

export async function creditBalance(userId: string) {
  const { data } = await admin().from("socialite_credit_ledger").select("delta").eq("user_id", userId);
  return (data ?? []).reduce((s, r: any) => s + Number(r.delta || 0), 0);
}

const monthStart = () => { const d = new Date(); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString(); };

export async function usedThisPeriod(userId: string, kind: MeterKind) {
  const { data } = await admin().from("socialite_usage").select("units").eq("user_id", userId).eq("kind", kind).gte("created_at", monthStart());
  return (data ?? []).reduce((s, r: any) => s + Number(r.units || 0), 0);
}

export async function activePlan(userId: string) {
  const sb = admin();
  const { data: sub } = await sb.from("socialite_subscriptions").select("*").eq("user_id", userId).maybeSingle();
  const now = Date.now();
  const live = sub && (sub.status === "active" || (sub.status === "trialing" && sub.trial_ends_at && new Date(sub.trial_ends_at).getTime() > now));
  if (!live || !sub?.plan_id) return { sub, plan: null as any };
  const { data: plan } = await sb.from("socialite_plans").select("*").eq("id", sub.plan_id).maybeSingle();
  return { sub, plan };
}

/**
 * Checks and records usage. Returns { ok:true } or { ok:false, reason }.
 * `units` for ai_tokens is the raw token count.
 */
export async function meter(userId: string, isAdmin: boolean, kind: MeterKind, units: number, meta: Record<string, unknown> = {}, dryRun = false) {
  const sb = admin();
  if (isAdmin) {
    if (!dryRun) await sb.from("socialite_usage").insert({ user_id: userId, kind, units, credits: 0, meta: { ...meta, admin: true } });
    return { ok: true as const, credits: 0 };
  }
  const cfg = await loadBilling();
  const models = cfg.models ?? {};
  const { sub, plan } = await activePlan(userId);

  // Genius in flat mode needs the add-on subscription
  if ((kind === "ai_tokens" || kind === "ai_image") && cfg.ai?.mode === "flat" && !sub?.ai_addon) {
    return { ok: false as const, reason: "Genius needs the Genius add-on. Open Plan & billing to add it." };
  }

  const limit = plan ? Number(plan.limits?.[kind] ?? 0) : 0;
  const used = plan ? await usedThisPeriod(userId, kind) : 0;
  const free = Math.max(0, Math.min(units, limit - used));
  const over = units - free;
  // flat AI add-on: tokens beyond the plan are included (fair use = plan allowance x10)
  const flatAi = (kind === "ai_tokens" || kind === "ai_image") && cfg.ai?.mode === "flat" && sub?.ai_addon;
  const perTokenAi = (kind === "ai_tokens" || kind === "ai_image") && cfg.ai?.mode === "per_token";

  let credits = 0;
  if (over > 0 && !flatAi) {
    const canPay = perTokenAi || (plan ? models.overage : models.pay_per_use);
    if (!canPay) return { ok: false as const, reason: plan ? `Monthly ${kind.replace("_", " ")} allowance used up. Upgrade your plan.` : "Choose a plan or buy credits to continue." };
    const rate = Number(cfg.credit_costs?.[COST_KEY[kind]] ?? 0);
    const billable = perTokenAi ? units : over;
    credits = kind === "ai_tokens" ? (billable / 1000) * rate : billable * rate;
    credits = Math.round(credits * 1000) / 1000;
    if (credits > 0) {
      const bal = await creditBalance(userId);
      if (bal < credits) return { ok: false as const, reason: `Not enough credits (needs ${credits}, you have ${Math.floor(bal)}). Buy credits in Plan & billing.` };
    }
  }
  if (dryRun) return { ok: true as const, credits };
  await sb.from("socialite_usage").insert({ user_id: userId, kind, units, credits, meta });
  if (credits > 0) await sb.from("socialite_credit_ledger").insert({ user_id: userId, delta: -credits, reason: `${kind} x${units}` });
  return { ok: true as const, credits };
}

// ─────────────────────────────────────────────────────────────────────────
// API + DATA revenue models (admin controlled in Admin → Pricing & revenue).
// There are no hard data caps: storage and data transfer are charged instead.
//   cfg.api     = { mode: "free"|"included"|"per_call"|"flat", per_call_credits,
//                   flat_monthly_credits, rate_per_minute }
//   cfg.data    = { mode: "free"|"included"|"per_mb", credits_per_mb }   (API data transfer)
//   cfg.storage = { mode: "free"|"per_gb_month"|"tiers", free_mb, credits_per_gb_month,
//                   tiers: [{ id, name, gb, credits_month }] }
// Plans may add allowances: limits.api_calls, limits.data_mb, limits.storage_mb.
// ─────────────────────────────────────────────────────────────────────────
export type Charge = { ok: true; credits: number } | { ok: false; reason: string };

/** Spend credits outright (used by per-call / per-MB / monthly fees). */
async function spend(userId: string, kind: string, units: number, credits: number, meta: Record<string, unknown> = {}): Promise<Charge> {
  const sb = admin();
  credits = Math.round(credits * 1000) / 1000;
  if (credits > 0) {
    const bal = await creditBalance(userId);
    if (bal < credits) return { ok: false, reason: `Not enough credits (needs ${credits}, you have ${Math.floor(bal)}). Buy credits in Plan & billing.` };
    await sb.from("socialite_credit_ledger").insert({ user_id: userId, delta: -credits, reason: `${kind} x${Math.round(units * 1000) / 1000}` });
  }
  await sb.from("socialite_usage").insert({ user_id: userId, kind, units, credits, meta });
  return { ok: true, credits };
}

/** Charges a fixed monthly fee once per calendar month (kind = fee marker). */
async function monthlyFee(userId: string, kind: string, credits: number, meta: Record<string, unknown> = {}): Promise<Charge> {
  const { count } = await admin().from("socialite_usage").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("kind", kind).gte("created_at", monthStart());
  if ((count ?? 0) > 0) return { ok: true, credits: 0 };
  return spend(userId, kind, 1, credits, meta);
}

/** Allowance from plan first, then credits at `rate` per unit for the rest. */
async function allowanceThenPay(userId: string, kind: string, units: number, rate: number, meta: Record<string, unknown>): Promise<Charge> {
  const { plan } = await activePlan(userId);
  const limit = plan ? Number(plan.limits?.[kind] ?? 0) : 0;
  const used = limit ? await usedThisPeriod(userId, kind as MeterKind) : 0;
  const over = Math.max(0, units - Math.max(0, limit - used));
  return spend(userId, kind, units, over * rate, meta);
}

/** Called once per API request (before work) — applies the API business model. */
export async function chargeApiCall(userId: string, isAdmin: boolean, path: string): Promise<Charge> {
  if (isAdmin) return { ok: true, credits: 0 };
  const api = (await loadBilling()).api ?? { mode: "free" };
  const meta = { path };
  if (api.mode === "per_call") return spend(userId, "api_calls", 1, Number(api.per_call_credits ?? 0), meta);
  if (api.mode === "included") return allowanceThenPay(userId, "api_calls", 1, Number(api.per_call_credits ?? 0), meta);
  if (api.mode === "flat") {
    const r = await monthlyFee(userId, "api_flat", Number(api.flat_monthly_credits ?? 0), meta);
    if (!r.ok) return { ok: false, reason: `The monthly API fee could not be paid. ${r.reason}` };
  }
  return { ok: true, credits: 0 };
}

/** Called after an API response is built — applies the data-transfer model. */
export async function chargeDataTransfer(userId: string, isAdmin: boolean, bytes: number): Promise<void> {
  if (isAdmin || bytes <= 0) return;
  const data = (await loadBilling()).data ?? { mode: "free" };
  if (data.mode === "free") return;
  const mb = bytes / 1_048_576;
  const rate = Number(data.credits_per_mb ?? 0);
  if (data.mode === "per_mb") await spend(userId, "data_mb", mb, mb * rate, { transfer: true });
  else await allowanceThenPay(userId, "data_mb", mb, rate, { transfer: true });
}

/** Approximate bytes a user stores across SOCIALITE (contacts, knowledge, pictures, saved workspace). */
export async function storageBytes(userId: string): Promise<number> {
  const sb = admin();
  const [{ count: contacts }, { data: know }, { data: state }, { data: files }] = await Promise.all([
    sb.from("socialite_contacts").select("id", { count: "exact", head: true }).eq("owner_id", userId),
    sb.from("socialite_knowledge").select("title, content").eq("owner_id", userId),
    sb.from("socialite_state").select("value").eq("owner_id", userId),
    sb.storage.from("socialite-knowledge").list(userId, { limit: 10000 }),
  ]);
  const text = (know ?? []).reduce((s, k: any) => s + (k.title?.length ?? 0) + (k.content?.length ?? 0), 0);
  const st = (state ?? []).reduce((s, r: any) => s + String(typeof r.value === "string" ? r.value : JSON.stringify(r.value ?? "")).length, 0);
  const img = (files ?? []).reduce((s, f: any) => s + Number(f.metadata?.size ?? 0), 0);
  return (contacts ?? 0) * 300 + text + st + img;
}

/**
 * Storage model. Bills at most once per month (kind "storage_month").
 * Returns the current storage picture so screens/API can show it.
 */
export async function chargeStorage(userId: string, isAdmin: boolean) {
  const cfg = await loadBilling();
  const s = cfg.storage ?? { mode: "free" };
  const mb = (await storageBytes(userId)) / 1_048_576;
  const { plan } = await activePlan(userId);
  const included = Number(s.free_mb ?? 0) + Number(plan?.limits?.storage_mb ?? 0);
  const billableMb = Math.max(0, mb - included);
  let credits = 0, tier: string | null = null;
  if (s.mode === "per_gb_month") credits = (billableMb / 1024) * Number(s.credits_per_gb_month ?? 0);
  if (s.mode === "tiers" && billableMb > 0) {
    const tiers = [...(s.tiers ?? [])].sort((a: any, b: any) => a.gb - b.gb);
    const t = tiers.find((x: any) => x.gb * 1024 >= billableMb) ?? tiers[tiers.length - 1];
    if (t) { credits = Number(t.credits_month ?? 0); tier = t.name; }
  }
  let charged: Charge = { ok: true, credits: 0 };
  if (!isAdmin && s.mode !== "free" && credits > 0) charged = await monthlyFee(userId, "storage_month", credits, { mb: Math.round(mb * 100) / 100, tier });
  return { mode: s.mode ?? "free", used_mb: Math.round(mb * 100) / 100, included_mb: included, billable_mb: Math.round(billableMb * 100) / 100, monthly_credits: Math.round(credits * 1000) / 1000, tier, paid: charged.ok, reason: charged.ok ? null : charged.reason };
}
