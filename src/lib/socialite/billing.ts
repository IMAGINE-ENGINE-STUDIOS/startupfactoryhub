/**
 * SOCIALITE commercial layer — client helpers.
 * Server truth lives in the `socialite-billing` and `socialite-ai` edge
 * functions; this file only calls them and shares types/labels.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const USAGE_LABELS: Record<string, string> = {
  posts: "Posts", email: "Emails", sms: "Texts", whatsapp: "WhatsApp", call: "Calls", ai_tokens: "Genius words (tokens)", ai_image: "Genius pictures",
  api_calls: "API calls", data_mb: "API data (MB)", storage_mb: "Storage (MB)",
};

export type Plan = { id: string; name: string; monthly_price: number; yearly_price: number; limits: Record<string, number>; features: string[]; active: boolean; sort: number };
export type BillingConfig = {
  models: { subscription: boolean; pay_per_use: boolean; credit_packs: boolean; trial: boolean; overage: boolean; ai: boolean };
  trial_days: number; trial_plan: string;
  credit_costs: Record<string, number>;
  credit_packs: { id: string; name: string; credits: number; price: number }[];
  ai: { mode: "plan" | "flat" | "per_token"; flat_monthly: number };
  /** API business model. Credits are the currency; Stripe sells the credits. */
  api?: { mode: "free" | "included" | "per_call" | "flat"; per_call_credits: number; flat_monthly_credits: number; rate_per_minute: number };
  /** API data transfer model (request + response size). */
  data?: { mode: "free" | "included" | "per_mb"; credits_per_mb: number };
  /** Storage model — no hard caps anywhere; storage is billed monthly instead. */
  storage?: { mode: "free" | "per_gb_month" | "tiers"; free_mb: number; credits_per_gb_month: number; tiers: { id: string; name: string; gb: number; credits_month: number }[] };
};
export type StorageInfo = { mode: string; used_mb: number; included_mb: number; billable_mb: number; monthly_credits: number; tier: string | null; paid: boolean; reason: string | null };
export type BillingStatus = {
  config: BillingConfig; plans: Plan[]; subscription: any; used: Record<string, number>; credits: number; ledger: any[]; isAdmin: boolean; storage?: StorageInfo | null;
};

export async function billing<T = any>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("socialite-billing", { body });
  if (error) {
    let msg = error.message;
    try { const j = await (error as any).context?.json?.(); if (j?.error) msg = j.error; } catch { /* keep */ }
    throw new Error(msg);
  }
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as T;
}

export async function genius<T = any>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("socialite-ai", { body });
  if (error) {
    let msg = error.message;
    try { const j = await (error as any).context?.json?.(); if (j?.error) msg = j.error; } catch { /* keep */ }
    throw new Error(msg);
  }
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as T;
}

/** Loads the signed-in user's plan, usage and credits; confirms a Stripe return once. */
export function useBilling() {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    try { setStatus(await billing<BillingStatus>({ action: "status" })); setError(""); } catch (e) { setError((e as Error).message); }
  }, []);
  useEffect(() => {
    (async () => {
      const q = new URLSearchParams(window.location.search);
      const sid = q.get("session_id");
      if (q.get("billing") === "done" && sid) {
        try { const r = await billing({ action: "verify", session_id: sid }); setNotice(r?.ok ? "Payment confirmed — thank you." : "Payment is still processing."); }
        catch (e) { setNotice((e as Error).message); }
        window.history.replaceState({}, "", window.location.pathname);
      } else if (q.get("billing") === "cancel") {
        setNotice("Checkout was cancelled — nothing was charged.");
        window.history.replaceState({}, "", window.location.pathname);
      }
      load();
    })();
  }, [load]);
  return { status, error, notice, reload: load, setNotice };
}

export async function goCheckout(body: Record<string, unknown>) {
  const r = await billing<{ url: string }>({ action: "checkout", return_url: `${window.location.origin}${window.location.pathname}`, ...body });
  if (r.url) window.location.href = r.url;
}
