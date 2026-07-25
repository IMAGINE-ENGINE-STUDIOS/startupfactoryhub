import { useMemo, useState } from "react";
import Navigation from "@/components/Navigation";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

/**
 * Startup Factory — Financial Projections
 * Dark-terminal institutional dashboard
 * Source: Institutional monthly model v1.0
 * Forecast: FY2027–FY2031 (60 months), USD
 */

type Scenario = "downside" | "base" | "upside";

const BASE = {
  revenue: [20_224_587, 24_466_112, 29_992_877, 37_247_922, 46_853_633],
  grossProfit: [15_913_257, 19_486_319, 24_157_926, 30_310_255, 38_480_501],
  ebitda: [1_840_219, 3_707_955, 6_294_120, 9_860_340, 14_771_670],
  netIncome: [313_006, 878_708, 2_059_512, 4_084_887, 7_277_445],
  opCashFlow: [-3_502_679, 1_035_324, 2_782_072, 5_241_309, 8_693_198],
  capex: [-4_999_992, -4_999_992, -4_999_992, -4_999_992, -4_999_992],
  endingCash: [4_097_329, 30_132_661, 27_914_741, 88_156_058, 91_849_264],
  totalAssets: [14_924_474, 46_189_694, 48_741_031, 113_456_166, 121_547_343],
  totalEquity: [12_913_006, 43_791_714, 45_851_226, 109_936_112, 117_213_557],
  grossMargin: [0.79, 0.80, 0.81, 0.81, 0.82],
  ebitdaMargin: [0.09, 0.15, 0.21, 0.26, 0.32],
  netMargin: [0.02, 0.04, 0.07, 0.11, 0.16],
};

const FACTORS: Record<Scenario, { rev: number; cost: number; label: string }> = {
  downside: { rev: 0.80, cost: 1.05, label: "Downside" },
  base: { rev: 1.00, cost: 1.00, label: "Base" },
  upside: { rev: 1.20, cost: 0.97, label: "Upside" },
};

const YEARS = ["FY2027", "FY2028", "FY2029", "FY2030", "FY2031"];

const fmtM = (v: number) =>
  `$${(v / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`;
const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`;
const fmtFull = (v: number) =>
  `$${Math.round(v).toLocaleString()}`;

// Revenue mix — muted terminal palette
const revenueMix = [
  { name: "Global MBA tuition", value: 30 },
  { name: "Space MBA tuition", value: 22 },
  { name: "Corporate contracts", value: 15 },
  { name: "SaaS subscriptions", value: 12 },
  { name: "Accelerator fees", value: 8 },
  { name: "Consulting", value: 6 },
  { name: "Venture exits", value: 4 },
  { name: "Sponsorship", value: 3 },
];

const drivers = [
  { label: "MBA students (start)", value: "400", growth: "+1.8% / mo" },
  { label: "Startups accelerated", value: "100 / yr", growth: "$20K fee" },
  { label: "SaaS users (start)", value: "650", growth: "+4.0% / mo" },
  { label: "Corporate clients", value: "25", growth: "$100K / yr" },
];

// Terminal tooltip
const termTooltip = {
  background: "#09090b",
  border: "1px solid #27272a",
  borderRadius: 2,
  fontSize: 11,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  color: "#fafafa",
};

export default function Financials() {
  const [scenario, setScenario] = useState<Scenario>("base");

  const data = useMemo(() => {
    const f = FACTORS[scenario];
    return YEARS.map((y, i) => {
      const revenue = BASE.revenue[i] * f.rev;
      const cogs = (BASE.revenue[i] - BASE.grossProfit[i]) * f.cost;
      const grossProfit = revenue - cogs;
      const opex = (BASE.grossProfit[i] - BASE.ebitda[i]) * f.cost;
      const ebitda = grossProfit - opex;
      const netIncome = BASE.netIncome[i] * f.rev * (f.rev >= 1 ? 1.1 : 0.85);
      return {
        year: y,
        revenue: Math.round(revenue),
        grossProfit: Math.round(grossProfit),
        ebitda: Math.round(ebitda),
        netIncome: Math.round(netIncome),
        opCashFlow: Math.round(BASE.opCashFlow[i] * f.rev),
        endingCash: Math.round(BASE.endingCash[i] * f.rev),
        totalAssets: Math.round(BASE.totalAssets[i] * f.rev),
        totalEquity: Math.round(BASE.totalEquity[i] * f.rev),
        grossMargin: grossProfit / revenue,
        ebitdaMargin: ebitda / revenue,
        netMargin: netIncome / revenue,
      };
    });
  }, [scenario]);

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalEbitda = data.reduce((s, d) => s + d.ebitda, 0);
  const endingCash = data[data.length - 1].endingCash;
  const cagr = Math.pow(data[4].revenue / data[0].revenue, 1 / 4) - 1;
  const y5 = data[4];
  const y1 = data[0];
  const revYoY = y5.revenue / data[3].revenue - 1;
  const ebitdaYoY = y5.ebitda / data[3].ebitda - 1;

  const kpis = [
    { label: "5-Yr Revenue", value: fmtM(totalRevenue), sub: "FY27–FY31 cumulative", delta: `+${(cagr * 100).toFixed(1)}% CAGR`, positive: true },
    { label: "Revenue CAGR", value: fmtPct(cagr), sub: "FY27 → FY31", delta: `${fmtM(y1.revenue)} → ${fmtM(y5.revenue)}`, positive: true },
    { label: "5-Yr EBITDA", value: fmtM(totalEbitda), sub: `${fmtPct(y5.ebitdaMargin)} margin Y5`, delta: `${(ebitdaYoY * 100).toFixed(1)}% YoY`, positive: true },
    { label: "Net Margin Y5", value: fmtPct(y5.netMargin), sub: "Steady-state profitability", delta: `${fmtM(y5.netIncome)} net`, positive: y5.netMargin > 0 },
    { label: "Ending Cash", value: fmtM(endingCash), sub: "FY2031 balance", delta: `${fmtM(y5.opCashFlow)} op. cash`, positive: y5.opCashFlow > 0 },
    { label: "Total Assets Y5", value: fmtM(y5.totalAssets), sub: "Balance sheet size", delta: `${fmtM(y5.totalEquity)} equity`, positive: true },
  ];

  const scenarios: Scenario[] = ["downside", "base", "upside"];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300">
      <Navigation />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-10 max-w-[1400px] mx-auto font-sans">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-5 border-b border-zinc-800 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">
                Live · Institutional Model v1.0
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-medium text-zinc-100 tracking-tight">
              Financial Performance
            </h1>
            <p className="text-xs text-zinc-500 uppercase tracking-widest mt-2 font-mono">
              FY2027 – FY2031 · 60-Month Forecast · USD
            </p>
          </div>

          <div className="flex bg-zinc-900 p-1 rounded-sm border border-zinc-800">
            {scenarios.map((s) => (
              <button
                key={s}
                onClick={() => setScenario(s)}
                className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-colors ${
                  scenario === s
                    ? "bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700/50"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {FACTORS[s].label}
              </button>
            ))}
          </div>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-zinc-800 border border-zinc-800 mb-8">
          {kpis.map((k) => (
            <div key={k.label} className="p-4 bg-zinc-950">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-mono">
                {k.label}
              </p>
              <p className="text-lg font-mono text-zinc-100 tracking-tight tabular-nums">
                {k.value}
              </p>
              <p className={`text-[10px] mt-1.5 font-mono ${k.positive ? "text-emerald-500" : "text-rose-500"}`}>
                {k.delta}
              </p>
              <p className="text-[10px] text-zinc-600 mt-0.5">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Revenue Trajectory + Revenue Mix */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 border border-zinc-800 bg-zinc-900/30 p-5">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-medium text-zinc-200">Revenue Trajectory</h3>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1 font-mono">
                  Annual revenue · {FACTORS[scenario].label}
                </p>
              </div>
              <div className="flex gap-4 text-[10px] uppercase tracking-widest text-zinc-500 font-mono">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-indigo-500" /> Revenue</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="#27272a" vertical={false} />
                <XAxis dataKey="year" stroke="#52525b" fontSize={10} tickLine={false} axisLine={{ stroke: "#27272a" }} />
                <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1e6).toFixed(0)}M`} />
                <Tooltip contentStyle={termTooltip} formatter={(v: number) => fmtM(v)} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={1.5} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="border border-zinc-800 bg-zinc-900/30 p-5">
            <h3 className="text-sm font-medium text-zinc-200">Revenue Mix</h3>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1 mb-6 font-mono">
              FY2028 illustrative blend
            </p>
            <div className="space-y-3.5">
              {revenueMix.map((s, i) => (
                <div key={s.name}>
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="text-zinc-400">{s.name}</span>
                    <span className="text-zinc-100 font-mono tabular-nums">{s.value}%</span>
                  </div>
                  <div className="w-full h-1 bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full"
                      style={{
                        width: `${s.value}%`,
                        background: i === 0 ? "#6366f1" : i === 1 ? "#818cf8" : `rgba(161,161,170,${1 - i * 0.1})`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Margin + P&L */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="border border-zinc-800 bg-zinc-900/30 p-5">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-zinc-200">Margin Expansion</h3>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1 font-mono">Gross · EBITDA · Net</p>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#27272a" vertical={false} />
                <XAxis dataKey="year" stroke="#52525b" fontSize={10} tickLine={false} axisLine={{ stroke: "#27272a" }} />
                <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={fmtPct} />
                <Tooltip contentStyle={termTooltip} formatter={(v: number) => fmtPct(v)} />
                <Legend wrapperStyle={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "#71717a" }} iconType="square" />
                <Line type="monotone" dataKey="grossMargin" name="Gross" stroke="#a1a1aa" strokeWidth={1.5} dot={{ r: 2, fill: "#a1a1aa" }} />
                <Line type="monotone" dataKey="ebitdaMargin" name="EBITDA" stroke="#6366f1" strokeWidth={1.5} dot={{ r: 2, fill: "#6366f1" }} />
                <Line type="monotone" dataKey="netMargin" name="Net" stroke="#10b981" strokeWidth={1.5} dot={{ r: 2, fill: "#10b981" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="border border-zinc-800 bg-zinc-900/30 p-5">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-zinc-200">P&amp;L Composition</h3>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1 font-mono">Revenue · Gross · EBITDA · Net</p>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#27272a" vertical={false} />
                <XAxis dataKey="year" stroke="#52525b" fontSize={10} tickLine={false} axisLine={{ stroke: "#27272a" }} />
                <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1e6).toFixed(0)}M`} />
                <Tooltip contentStyle={termTooltip} formatter={(v: number) => fmtM(v)} />
                <Legend wrapperStyle={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "#71717a" }} iconType="square" />
                <Bar dataKey="revenue" name="Revenue" fill="#3f3f46" />
                <Bar dataKey="grossProfit" name="Gross" fill="#a1a1aa" />
                <Bar dataKey="ebitda" name="EBITDA" fill="#6366f1" />
                <Bar dataKey="netIncome" name="Net" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cash + Balance Sheet */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="border border-zinc-800 bg-zinc-900/30 p-5">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-zinc-200">Cash Position</h3>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1 font-mono">Ending cash · Operating flow</p>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="#27272a" vertical={false} />
                <XAxis dataKey="year" stroke="#52525b" fontSize={10} tickLine={false} axisLine={{ stroke: "#27272a" }} />
                <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1e6).toFixed(0)}M`} />
                <Tooltip contentStyle={termTooltip} formatter={(v: number) => fmtM(v)} />
                <Legend wrapperStyle={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "#71717a" }} iconType="square" />
                <Area type="monotone" dataKey="endingCash" name="Ending Cash" stroke="#22d3ee" strokeWidth={1.5} fill="url(#cashGrad)" />
                <Line type="monotone" dataKey="opCashFlow" name="Op. Cash Flow" stroke="#f59e0b" strokeWidth={1.5} dot={{ r: 2, fill: "#f59e0b" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="border border-zinc-800 bg-zinc-900/30 p-5">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-zinc-200">Balance Sheet</h3>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1 font-mono">Assets · Equity</p>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#27272a" vertical={false} />
                <XAxis dataKey="year" stroke="#52525b" fontSize={10} tickLine={false} axisLine={{ stroke: "#27272a" }} />
                <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1e6).toFixed(0)}M`} />
                <Tooltip contentStyle={termTooltip} formatter={(v: number) => fmtM(v)} />
                <Legend wrapperStyle={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "#71717a" }} iconType="square" />
                <Bar dataKey="totalAssets" name="Assets" fill="#6366f1" />
                <Bar dataKey="totalEquity" name="Equity" fill="#a1a1aa" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Drivers strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-800 border border-zinc-800 mb-8">
          {drivers.map((d) => (
            <div key={d.label} className="p-4 bg-zinc-950">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-mono">{d.label}</p>
              <p className="text-lg font-mono text-zinc-100 tabular-nums">{d.value}</p>
              <p className="text-[10px] text-emerald-500 mt-1 font-mono">{d.growth}</p>
            </div>
          ))}
        </div>

        {/* Annual summary table */}
        <div className="border border-zinc-800 bg-zinc-900/30 overflow-hidden mb-8">
          <div className="px-5 py-3 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-zinc-300 font-mono">
                Annual Summary — {FACTORS[scenario].label} Scenario
              </h4>
              <p className="text-[10px] text-zinc-600 mt-0.5 font-mono">P&amp;L · Cash Flow · Balance Sheet</p>
            </div>
            <span className="text-[10px] text-zinc-600 font-mono">Values in USD</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[10px] text-zinc-500 uppercase tracking-widest border-b border-zinc-800/50 font-mono">
                <tr>
                  <th className="px-5 py-3 font-normal">Metric</th>
                  {data.map((d) => (
                    <th key={d.year} className="px-5 py-3 font-normal text-right">{d.year}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-xs font-mono">
                {[
                  { k: "revenue", label: "Revenue", fmt: fmtFull, bold: true },
                  { k: "grossProfit", label: "Gross Profit", fmt: fmtFull },
                  { k: "ebitda", label: "EBITDA", fmt: fmtFull, bold: true },
                  { k: "netIncome", label: "Net Income", fmt: fmtFull },
                  { k: "opCashFlow", label: "Operating Cash Flow", fmt: fmtFull },
                  { k: "endingCash", label: "Ending Cash", fmt: fmtFull, bold: true },
                  { k: "totalAssets", label: "Total Assets", fmt: fmtFull },
                  { k: "totalEquity", label: "Total Equity", fmt: fmtFull },
                  { k: "grossMargin", label: "Gross Margin", fmt: fmtPct },
                  { k: "ebitdaMargin", label: "EBITDA Margin", fmt: fmtPct },
                  { k: "netMargin", label: "Net Margin", fmt: fmtPct },
                ].map((row) => (
                  <tr key={row.k} className="border-b border-zinc-800/30 hover:bg-white/[0.02] transition-colors">
                    <td className={`px-5 py-3 font-sans ${row.bold ? "text-zinc-100 font-medium" : "text-zinc-400"}`}>
                      {row.label}
                    </td>
                    {data.map((d, idx) => (
                      <td
                        key={d.year}
                        className={`px-5 py-3 text-right tabular-nums ${
                          idx === data.length - 1 ? "text-indigo-300 bg-indigo-500/[0.03]" : "text-zinc-200"
                        }`}
                      >
                        {row.fmt((d as any)[row.k])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-[10px] text-zinc-600 mt-6 text-center font-mono uppercase tracking-widest">
          Source: Startup Factory Institutional Monthly Model v1.0 · Prepared for Series A / Series B due diligence
        </p>
      </div>
    </div>
  );
}
