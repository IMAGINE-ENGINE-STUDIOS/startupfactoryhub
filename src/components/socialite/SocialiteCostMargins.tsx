/**
 * SOCIALITE → Admin → Pricing & revenue → "Your cost vs. your price".
 * Shows what each action costs the business (provider wholesale, editable and
 * saved in billing config `provider_costs`) next to what the customer is
 * charged (credits × $ per credit from the credit packs), with the margin.
 * Default costs are public list prices (2026) and are only estimates.
 */
import type { BillingConfig } from "@/lib/socialite/billing";

type Row = { key: string; label: string; unit: string; provider: string; cost: number; price: (c: BillingConfig) => number };

export const DEFAULT_PROVIDER_COSTS: Row[] = [
  { key: "email", label: "Email", unit: "per email", provider: "Resend", cost: 0.0004, price: (c) => c.credit_costs?.email ?? 0 },
  { key: "sms", label: "Text (SMS)", unit: "per text", provider: "Twilio US", cost: 0.0083, price: (c) => c.credit_costs?.sms ?? 0 },
  { key: "whatsapp", label: "WhatsApp", unit: "per message", provider: "Meta + Twilio", cost: 0.03, price: (c) => c.credit_costs?.whatsapp ?? 0 },
  { key: "call", label: "Phone call", unit: "per call (~1 min)", provider: "Twilio voice", cost: 0.014, price: (c) => c.credit_costs?.call ?? 0 },
  { key: "post", label: "Social post", unit: "per platform", provider: "Platform APIs", cost: 0, price: (c) => c.credit_costs?.post ?? 0 },
  { key: "ai_1k_tokens", label: "Genius text", unit: "per 1,000 tokens", provider: "AI provider", cost: 0.001, price: (c) => c.credit_costs?.ai_1k_tokens ?? 0 },
  { key: "ai_image", label: "Genius picture", unit: "per picture", provider: "AI provider", cost: 0.04, price: (c) => c.credit_costs?.ai_image ?? 0 },
  { key: "api_call", label: "API call", unit: "per call", provider: "Edge functions", cost: 0.000002, price: (c) => (c.api?.mode === "per_call" ? c.api.per_call_credits : 0) },
  { key: "data_mb", label: "Data transfer", unit: "per MB", provider: "Bandwidth", cost: 0.00009, price: (c) => (c.data?.mode === "per_mb" ? c.data.credits_per_mb : 0) },
  { key: "storage_gb", label: "Storage", unit: "per GB / month", provider: "Database + files", cost: 0.125, price: (c) => (c.storage?.mode === "per_gb_month" ? c.storage.credits_per_gb_month : 0) },
];

const money = (n: number) => (n === 0 ? "$0" : n < 0.01 ? `$${n.toPrecision(2)}` : `$${n.toFixed(n < 1 ? 3 : 2)}`);

export default function SocialiteCostMargins({ cfg, setC, card, input }: { cfg: BillingConfig & { provider_costs?: Record<string, number> }; setC: (p: any) => void; card: string; input: string }) {
  const packs = (cfg.credit_packs ?? []).filter((p) => p.credits > 0);
  // $ per credit = average across the packs you sell (what a customer really pays).
  const perCredit = packs.length ? packs.reduce((s, p) => s + p.price / p.credits, 0) / packs.length : 0;
  const costs = cfg.provider_costs ?? {};

  return (
    <div className={card}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
        <div className="text-[14px] font-semibold">Your cost vs. your price</div>
        <div className="text-[11px] text-zinc-500">1 credit ≈ <span className="text-zinc-200 mono">{perCredit ? money(perCredit) : "set a credit pack"}</span></div>
      </div>
      <div className="text-[11px] text-zinc-500 mb-3">Costs are estimates from each provider's list price — edit them to match your bills. Price comes from the credits you set above.</div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead className="text-[10.5px] text-zinc-500 text-left">
            <tr><th className="py-1.5 font-normal">Item</th><th className="font-normal">Provider</th><th className="font-normal w-28">Your cost $</th><th className="font-normal">You charge</th><th className="font-normal text-right">Margin</th></tr>
          </thead>
          <tbody>
            {DEFAULT_PROVIDER_COSTS.map((r) => {
              const cost = costs[r.key] ?? r.cost;
              const credits = r.price(cfg);
              const price = credits * perCredit;
              const margin = price > 0 ? Math.round(((price - cost) / price) * 100) : null;
              const tone = margin === null ? "text-zinc-500" : margin < 0 ? "text-[#f97066]" : margin < 50 ? "text-amber-300" : "text-emerald-300";
              return (
                <tr key={r.key} className="border-t border-zinc-800">
                  <td className="py-2"><div className="text-zinc-100">{r.label}</div><div className="text-[10.5px] text-zinc-500">{r.unit}</div></td>
                  <td className="text-zinc-400">{r.provider}</td>
                  <td className="pr-3"><input type="number" min={0} step="any" className={input} value={cost} onChange={(e) => setC({ provider_costs: { ...costs, [r.key]: Number(e.target.value) } })} /></td>
                  <td className="mono text-zinc-200">{credits ? `${credits} cr · ${money(price)}` : <span className="text-zinc-500">free / plan</span>}</td>
                  <td className={`text-right mono ${tone}`}>{margin === null ? (cost > 0 ? "you pay" : "—") : `${margin}%`}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
