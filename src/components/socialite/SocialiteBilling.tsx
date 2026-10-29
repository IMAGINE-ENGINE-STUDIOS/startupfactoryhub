/**
 * SOCIALITE → Plan & billing (every user).
 * Current plan, monthly usage vs allowance, credit balance, plans, credit
 * packs, free trial and the Genius add-on — all priced by the admin in
 * Admin → Pricing & revenue and charged through Stripe Checkout.
 */
import { useState } from "react";
import { billing, goCheckout, useBilling, USAGE_LABELS } from "@/lib/socialite/billing";

const card = "rounded-[18px] border border-zinc-800 bg-[#161617] p-5";
const btn = "px-4 py-2 rounded-full text-[12px] font-semibold transition disabled:opacity-40";
const usd = (n: number) => `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export default function SocialiteBilling() {
  const { status, error, notice, reload, setNotice } = useBilling();
  const [yearly, setYearly] = useState(false);
  const [busy, setBusy] = useState("");

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    try { await fn(); } catch (e) { setNotice((e as Error).message); } finally { setBusy(""); }
  };

  if (!status) return <div className="p-8 text-[13px] text-zinc-400">{error || "Loading your plan…"}</div>;
  const { config: cfg, plans, subscription: sub, used, credits, ledger, isAdmin, storage } = status;
  const livePlan = sub && (sub.status === "active" || (sub.status === "trialing" && sub.trial_ends_at && new Date(sub.trial_ends_at) > new Date()));
  const plan = livePlan ? plans.find((p) => p.id === sub.plan_id) : null;
  const trialUsed = !!(sub?.trial_ends_at || sub?.stripe_subscription_id);

  return (
    <div className="p-4 lg:p-8 max-w-[1000px] space-y-5">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Plan & billing</h1>
        <p className="text-[12px] text-zinc-500 mt-1">Your plan, what you have used this month and your credits.</p>
      </div>
      {notice && <div className="rounded-[14px] border border-zinc-700 bg-zinc-900 px-4 py-3 text-[12.5px] text-zinc-200 flex justify-between gap-3">{notice}<button onClick={() => setNotice("")} className="text-zinc-500 hover:text-white">Close</button></div>}
      {isAdmin && <div className="rounded-[14px] border border-zinc-800 bg-[#0f0f10] px-4 py-3 text-[12px] text-zinc-400">You are the owner — nothing is charged or limited for you. Prices are set in Admin → Pricing & revenue.</div>}

      <div className="grid md:grid-cols-3 gap-4">
        <div className={card}>
          <div className="text-[11px] uppercase tracking-wider text-zinc-500">Current plan</div>
          <div className="text-[22px] font-semibold mt-1">{plan?.name ?? (isAdmin ? "Owner" : "No plan")}</div>
          <div className="text-[12px] text-zinc-400 mt-1">
            {sub?.status === "trialing" && sub.trial_ends_at ? `Free trial until ${new Date(sub.trial_ends_at).toLocaleDateString()}` :
              sub?.status === "active" && sub.current_period_end ? `Renews ${new Date(sub.current_period_end).toLocaleDateString()}` :
              sub?.status === "past_due" ? "Payment failed — please update your card" : "Pay as you go with credits"}
          </div>
          {livePlan && <button disabled={!!busy} onClick={() => run("cancel", async () => { const r = await billing({ action: "cancel", target: "plan" }); setNotice(r.note); reload(); })} className={`${btn} mt-4 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800`}>Cancel plan</button>}
        </div>
        <div className={card}>
          <div className="text-[11px] uppercase tracking-wider text-zinc-500">Credits</div>
          <div className="text-[22px] font-semibold mt-1 mono">{Math.floor(credits).toLocaleString()}</div>
          <div className="text-[12px] text-zinc-400 mt-1">Used for posts and sends beyond your plan{cfg.ai?.mode === "per_token" ? " and for Genius" : ""}.</div>
        </div>
        <div className={card}>
          <div className="text-[11px] uppercase tracking-wider text-zinc-500">Genius</div>
          <div className="text-[15px] font-semibold mt-1">
            {cfg.ai?.mode === "flat" ? (sub?.ai_addon ? "Add-on active" : `Add-on ${usd(cfg.ai.flat_monthly)}/month`) : cfg.ai?.mode === "per_token" ? "Paid with credits" : "Included in your plan"}
          </div>
          {cfg.ai?.mode === "flat" && !isAdmin && (sub?.ai_addon
            ? <button disabled={!!busy} onClick={() => run("cai", async () => { const r = await billing({ action: "cancel", target: "ai_addon" }); setNotice(r.note); reload(); })} className={`${btn} mt-4 bg-zinc-900 border border-zinc-800 text-zinc-300`}>Cancel add-on</button>
            : <button disabled={!!busy} onClick={() => run("ai", () => goCheckout({ kind: "ai_addon" }))} className={`${btn} mt-4 bg-white text-black`}>Add Genius</button>)}
        </div>
      </div>

      <div className={card}>
        <div className="text-[13px] font-semibold mb-3">This month</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.keys(USAGE_LABELS).map((k) => {
            const limit = Number(plan?.limits?.[k] ?? 0);
            const u = Math.round(Number(k === "storage_mb" ? storage?.used_mb ?? 0 : used[k] ?? 0) * 100) / 100;
            const pct = limit ? Math.min(100, (u / limit) * 100) : 0;
            return (
              <div key={k} className="rounded-[12px] border border-zinc-800 bg-[#0f0f10] p-3">
                <div className="text-[11px] text-zinc-500">{USAGE_LABELS[k]}</div>
                <div className="text-[14px] font-semibold mono mt-0.5">{u.toLocaleString()}{limit ? ` / ${limit.toLocaleString()}` : ""}</div>
                {limit > 0 && <div className="h-1 rounded-full bg-zinc-800 mt-2"><div className={`h-1 rounded-full ${pct > 90 ? "bg-amber-400" : "bg-white"}`} style={{ width: `${pct}%` }} /></div>}
              </div>
            );
          })}
        </div>
        {storage && storage.mode !== "free" && (
          <div className="text-[11.5px] text-zinc-500 mt-3">
            Storage: {storage.used_mb.toLocaleString()} MB saved · {storage.included_mb.toLocaleString()} MB included
            {storage.monthly_credits > 0 ? ` · ${storage.monthly_credits} credits this month${storage.tier ? ` (${storage.tier})` : ""}` : " · nothing to pay"}
            {!storage.paid && storage.reason ? ` — ${storage.reason}` : ""}
          </div>
        )}
      </div>

      {cfg.models?.subscription && !isAdmin && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">Plans</h2>
            <div className="flex rounded-full border border-zinc-800 p-0.5 text-[12px]">
              {[false, true].map((y) => <button key={String(y)} onClick={() => setYearly(y)} className={`px-3 py-1 rounded-full ${yearly === y ? "bg-white text-black" : "text-zinc-400"}`}>{y ? "Yearly" : "Monthly"}</button>)}
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((p) => (
              <div key={p.id} className={`${card} flex flex-col ${plan?.id === p.id ? "border-white" : ""}`}>
                <div className="text-[15px] font-semibold">{p.name}</div>
                <div className="text-[26px] font-semibold mt-1">{usd(yearly ? p.yearly_price : p.monthly_price)}<span className="text-[12px] text-zinc-500 font-normal">/{yearly ? "year" : "month"}</span></div>
                <ul className="mt-3 space-y-1 text-[12px] text-zinc-400 flex-1">
                  {Object.entries(p.limits ?? {}).filter(([, v]) => Number(v) > 0).map(([k, v]) => <li key={k}>{Number(v).toLocaleString()} {USAGE_LABELS[k] ?? k} / month</li>)}
                  {(p.features ?? []).map((f) => <li key={f}>{f}</li>)}
                </ul>
                <div className="mt-4 grid gap-2">
                  <button disabled={!!busy || (plan?.id === p.id && sub?.status === "active")} onClick={() => run(p.id, () => goCheckout({ kind: "plan", plan_id: p.id, yearly }))} className={`${btn} bg-white text-black`}>
                    {plan?.id === p.id && sub?.status === "active" ? "Your plan" : busy === p.id ? "Opening checkout…" : "Choose"}
                  </button>
                  {cfg.models?.trial && !trialUsed && (cfg.trial_plan === p.id) && (
                    <button disabled={!!busy} onClick={() => run("trial", async () => { await billing({ action: "start_trial", plan_id: p.id }); setNotice(`Your ${cfg.trial_days}-day free trial has started.`); reload(); })} className={`${btn} bg-zinc-900 border border-zinc-800 text-zinc-200`}>
                      Start {cfg.trial_days}-day free trial
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {cfg.models?.credit_packs && !isAdmin && (
        <div className="space-y-3">
          <h2 className="text-[15px] font-semibold">Credit packs</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {(cfg.credit_packs ?? []).map((k) => (
              <div key={k.id} className={card}>
                <div className="text-[15px] font-semibold">{k.name}</div>
                <div className="text-[12px] text-zinc-400 mt-1">{k.credits.toLocaleString()} credits · {usd(k.price)}</div>
                <button disabled={!!busy} onClick={() => run(k.id, () => goCheckout({ kind: "credits", pack_id: k.id }))} className={`${btn} mt-4 bg-white text-black`}>{busy === k.id ? "Opening checkout…" : "Buy"}</button>
              </div>
            ))}
          </div>
          <div className="text-[11.5px] text-zinc-500">
            Credit cost: {Object.entries(cfg.credit_costs ?? {}).map(([k, v]) => `${k.replace("ai_1k_tokens", "Genius 1,000 tokens").replace("ai_image", "Genius picture")} ${v}`).join(" · ")}
          </div>
        </div>
      )}

      {!!ledger.length && (
        <div className={card}>
          <div className="text-[13px] font-semibold mb-2">Credit history</div>
          <div className="divide-y divide-zinc-800">
            {ledger.map((l, i) => (
              <div key={i} className="flex justify-between py-2 text-[12px]">
                <span className="text-zinc-300">{l.reason}</span>
                <span className="mono text-zinc-400">{Number(l.delta) > 0 ? "+" : ""}{Number(l.delta).toLocaleString()} · {new Date(l.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
