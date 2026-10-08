import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { DollarSign, Users, ShoppingCart, Activity, TrendingUp, TrendingDown, Search, Plus, X } from "lucide-react";

/* Edit these constants (or ask the AI) to turn this into your own dashboard. Records save through IE.db. */
const APP = { name: "Pulse Analytics", currency: "USD", collection: "transactions" };
const STATUSES = ["Paid", "Pending", "Refunded", "Failed"] as const;
const RANGES = { "7D": 7, "30D": 30, "90D": 90, "1Y": 365 } as const;
const CUSTOMERS = ["Northwind Labs", "Acme Robotics", "Blue Harbor", "Lumen Health", "Orbit Freight", "Kestrel AI", "Meridian Bank", "Atlas Foods", "Vertex Media", "Solace Energy", "Granite Legal", "Nimbus Cloud"];
const PLANS = ["Starter", "Growth", "Scale", "Enterprise"];

type Txn = { id: string; customer: string; plan: string; amount: number; status: string; date: string };
const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: APP.currency, maximumFractionDigits: 0 }).format(n);
const db = () => (window as any).IE?.db?.(APP.collection);

function seed(): Omit<Txn, "id">[] {
  const out: Omit<Txn, "id">[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(Date.now() - i * 86400000 * (1 + (i % 4)));
    out.push({ customer: CUSTOMERS[i % CUSTOMERS.length], plan: PLANS[i % PLANS.length], amount: [490, 1290, 2900, 9800][i % 4] + i * 37, status: STATUSES[i % 7 === 3 ? 2 : i % 5 === 4 ? 1 : i % 11 === 6 ? 3 : 0], date: d.toISOString().slice(0, 10) });
  }
  return out;
}

function Kpi({ label, value, delta, icon: Icon }: { label: string; value: string; delta: number; icon: any }) {
  const up = delta >= 0;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
      <div className="flex items-center justify-between text-sm text-zinc-400"><span>{label}</span><Icon className="h-4 w-4" /></div>
      <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
      <div className={"mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs " + (up ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300")}>
        {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{Math.abs(delta).toFixed(1)}%
      </div>
    </motion.div>
  );
}

const pill: Record<string, string> = { Paid: "bg-emerald-500/15 text-emerald-300", Pending: "bg-amber-500/15 text-amber-300", Refunded: "bg-sky-500/15 text-sky-300", Failed: "bg-rose-500/15 text-rose-300" };

export default function App() {
  const [rows, setRows] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<keyof typeof RANGES>("30D");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customer: "", plan: PLANS[0], amount: "", status: "Paid" });

  async function load() {
    const c = db(); if (!c) { setRows(seed().map((r, i) => ({ ...r, id: "s" + i }))); setLoading(false); return; }
    let list = await c.list({ order: "date", desc: true });
    if (!list.length) { for (const r of seed()) await c.insert(r); list = await c.list({ order: "date", desc: true }); }
    setRows(list); setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const since = Date.now() - RANGES[range] * 86400000;
  const inRange = rows.filter((r) => new Date(r.date).getTime() >= since);
  const paid = inRange.filter((r) => r.status === "Paid");
  const revenue = paid.reduce((s, r) => s + Number(r.amount), 0);
  const customers = new Set(inRange.map((r) => r.customer)).size;
  const refundRate = inRange.length ? (inRange.filter((r) => r.status === "Refunded").length / inRange.length) * 100 : 0;

  const series = useMemo(() => {
    const m: Record<string, number> = {};
    paid.slice().sort((a, b) => a.date.localeCompare(b.date)).forEach((r) => { m[r.date.slice(5)] = (m[r.date.slice(5)] || 0) + Number(r.amount); });
    return Object.entries(m).map(([day, value]) => ({ day, value }));
  }, [rows, range]);
  const byPlan = PLANS.map((p) => ({ plan: p, value: paid.filter((r) => r.plan === p).reduce((s, r) => s + Number(r.amount), 0) }));
  const shown = inRange.filter((r) => (status === "All" || r.status === status) && (r.customer + " " + r.plan).toLowerCase().includes(q.toLowerCase()));

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customer.trim() || !(Number(form.amount) > 0)) return;
    const rec = { ...form, amount: Number(form.amount), date: new Date().toISOString().slice(0, 10) };
    const c = db(); const saved = c ? await c.insert(rec) : { ...rec, id: "l" + Date.now() };
    setRows((r) => [saved, ...r]); setOpen(false); setForm({ customer: "", plan: PLANS[0], amount: "", status: "Paid" });
    (window as any).IE?.emit?.("transactionAdded", saved);
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-200">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-semibold text-white">{APP.name}</h1><p className="text-sm text-zinc-400">Revenue, customers and transactions at a glance.</p></div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-white/10 p-1">
            {(Object.keys(RANGES) as (keyof typeof RANGES)[]).map((k) => (
              <button key={k} onClick={() => setRange(k)} className={"rounded-lg px-3 py-1 text-xs " + (range === k ? "bg-white text-zinc-900" : "text-zinc-400 hover:text-white")}>{k}</button>
            ))}
          </div>
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1 rounded-xl bg-blue-500 px-3 py-2 text-sm font-medium text-white hover:bg-blue-400"><Plus className="h-4 w-4" />Add record</button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Revenue" value={money(revenue)} delta={12.4} icon={DollarSign} />
        <Kpi label="Customers" value={String(customers)} delta={6.1} icon={Users} />
        <Kpi label="Transactions" value={String(inRange.length)} delta={3.8} icon={ShoppingCart} />
        <Kpi label="Refund rate" value={refundRate.toFixed(1) + "%"} delta={-refundRate / 4} icon={Activity} />
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-medium text-zinc-300">Revenue over time</h2>
          <div className="h-64"><ResponsiveContainer><AreaChart data={series}><defs><linearGradient id="rv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.5} /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#ffffff10" vertical={false} /><XAxis dataKey="day" stroke="#71717a" fontSize={11} /><YAxis stroke="#71717a" fontSize={11} /><Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 12 }} /><Area type="monotone" dataKey="value" stroke="#3b82f6" fill="url(#rv)" strokeWidth={2} /></AreaChart></ResponsiveContainer></div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h2 className="mb-4 text-sm font-medium text-zinc-300">Revenue by plan</h2>
          <div className="h-64"><ResponsiveContainer><BarChart data={byPlan}><CartesianGrid stroke="#ffffff10" vertical={false} /><XAxis dataKey="plan" stroke="#71717a" fontSize={11} /><YAxis stroke="#71717a" fontSize={11} /><Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 12 }} /><Bar dataKey="value" fill="#22d3ee" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-zinc-300">Transactions</h2>
          <div className="flex gap-2">
            <label className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-1.5"><Search className="h-4 w-4 text-zinc-500" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="w-40 bg-transparent text-sm outline-none" /></label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-white/10 bg-zinc-900 px-3 text-sm">{["All", ...STATUSES].map((s) => <option key={s}>{s}</option>)}</select>
          </div>
        </div>
        {loading ? <p className="py-8 text-center text-sm text-zinc-500">Loading records…</p> : shown.length === 0 ? <p className="py-8 text-center text-sm text-zinc-500">No transactions match.</p> : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-zinc-500"><tr><th className="pb-2">Customer</th><th className="pb-2">Plan</th><th className="pb-2">Date</th><th className="pb-2">Status</th><th className="pb-2 text-right">Amount</th></tr></thead>
            <tbody>{shown.map((r) => (
              <tr key={r.id} className="border-t border-white/5"><td className="py-2.5 text-white">{r.customer}</td><td>{r.plan}</td><td className="text-zinc-400">{r.date}</td><td><span className={"rounded-full px-2 py-0.5 text-xs " + (pill[r.status] || "")}>{r.status}</span></td><td className="text-right">{money(Number(r.amount))}</td></tr>
            ))}</tbody>
          </table>
        )}
      </section>

      <AnimatePresence>{open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <motion.form initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} onSubmit={add} className="w-full max-w-sm space-y-3 rounded-2xl border border-white/10 bg-zinc-900 p-5">
            <div className="flex items-center justify-between"><h3 className="font-medium text-white">Add record</h3><button type="button" onClick={() => setOpen(false)}><X className="h-4 w-4" /></button></div>
            <input required value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} placeholder="Customer" className="w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm" />
            <input required type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Amount" className="w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm" />
            <div className="flex gap-2">
              <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} className="flex-1 rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm">{PLANS.map((p) => <option key={p}>{p}</option>)}</select>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="flex-1 rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm">{STATUSES.map((p) => <option key={p}>{p}</option>)}</select>
            </div>
            <button className="w-full rounded-xl bg-blue-500 py-2 text-sm font-medium text-white hover:bg-blue-400">Save</button>
          </motion.form>
        </motion.div>
      )}</AnimatePresence>
    </div>
  );
}
