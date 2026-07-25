import { useMemo, useState } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import {
  TrendingUp,
  DollarSign,
  Wallet,
  Percent,
  Rocket,
  Building2,
  Users,
  GraduationCap,
  Sparkles,
} from "lucide-react";

/**
 * Startup Factory — Financial Projections
 * Source: Institutional monthly model v1.0 (Base scenario)
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

// Revenue mix (Base FY2028, illustrative from operating assumptions)
const revenueMix = [
  { name: "Global MBA tuition", value: 30, color: "hsl(210 90% 60%)" },
  { name: "Space MBA tuition", value: 22, color: "hsl(265 85% 65%)" },
  { name: "Accelerator fees", value: 8, color: "hsl(30 95% 60%)" },
  { name: "SaaS subscriptions", value: 12, color: "hsl(160 80% 50%)" },
  { name: "Corporate contracts", value: 15, color: "hsl(340 85% 60%)" },
  { name: "Consulting", value: 6, color: "hsl(45 95% 55%)" },
  { name: "Sponsorship", value: 3, color: "hsl(180 70% 55%)" },
  { name: "Venture exits", value: 4, color: "hsl(280 80% 65%)" },
];

const drivers = [
  { icon: GraduationCap, label: "MBA students (start)", value: "400", growth: "+1.8% / month" },
  { icon: Rocket, label: "Startups accelerated", value: "100 / yr", growth: "$20K fee" },
  { icon: Users, label: "SaaS users (start)", value: "650", growth: "+4.0% / month" },
  { icon: Building2, label: "Corporate clients", value: "25", growth: "$100K / yr" },
];

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

  const kpis = [
    { label: "5-Yr Revenue", value: fmtM(totalRevenue), sub: "FY27–FY31 cumulative", icon: DollarSign, color: "text-emerald-400" },
    { label: "Revenue CAGR", value: fmtPct(cagr), sub: "FY27 → FY31", icon: TrendingUp, color: "text-primary" },
    { label: "5-Yr EBITDA", value: fmtM(totalEbitda), sub: `${fmtPct(data[4].ebitdaMargin)} margin Y5`, icon: Percent, color: "text-purple-400" },
    { label: "Ending Cash", value: fmtM(endingCash), sub: "FY2031 balance", icon: Wallet, color: "text-cyan-400" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24 pb-16 container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <Badge variant="outline" className="mb-3 border-primary/40 text-primary">
              <Sparkles className="w-3 h-3 mr-1" />
              Institutional Model v1.0
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              Financial Projections
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Startup Factory · 60-month forecast · FY2027–FY2031 · USD
            </p>
          </div>

          {/* Scenario selector */}
          <Tabs value={scenario} onValueChange={(v) => setScenario(v as Scenario)}>
            <TabsList className="tech-card border-0">
              <TabsTrigger value="downside">Downside</TabsTrigger>
              <TabsTrigger value="base">Base</TabsTrigger>
              <TabsTrigger value="upside">Upside</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {kpis.map((k) => (
            <Card key={k.label} className="tech-card border-0">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-2">
                  <k.icon className={`w-4 h-4 ${k.color}`} />
                  <span className="text-xs text-muted-foreground">{k.label}</span>
                </div>
                <div className={`text-2xl sm:text-3xl font-bold ${k.color}`}>{k.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{k.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue & Profitability */}
        <div className="grid lg:grid-cols-2 gap-4 mb-8">
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Revenue Trajectory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${(v / 1e6).toFixed(0)}M`} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                    formatter={(v: number) => fmtM(v)}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#rev)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Percent className="w-4 h-4 text-purple-400" />
                Margin Expansion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={fmtPct} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                    formatter={(v: number) => fmtPct(v)}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="grossMargin" name="Gross" stroke="hsl(160 80% 50%)" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="ebitdaMargin" name="EBITDA" stroke="hsl(265 85% 65%)" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="netMargin" name="Net" stroke="hsl(30 95% 60%)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* P&L bar */}
        <Card className="tech-card border-0 mb-8">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              P&amp;L Waterfall — Revenue · Gross Profit · EBITDA · Net Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${(v / 1e6).toFixed(0)}M`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  formatter={(v: number) => fmtM(v)}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="revenue" name="Revenue" fill="hsl(210 90% 60%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="grossProfit" name="Gross Profit" fill="hsl(160 80% 50%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ebitda" name="EBITDA" fill="hsl(265 85% 65%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="netIncome" name="Net Income" fill="hsl(30 95% 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cash & Balance Sheet */}
        <div className="grid lg:grid-cols-2 gap-4 mb-8">
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="w-4 h-4 text-cyan-400" />
                Cash Position &amp; Operating Cash Flow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="cash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(180 80% 55%)" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="hsl(180 80% 55%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${(v / 1e6).toFixed(0)}M`} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                    formatter={(v: number) => fmtM(v)}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="endingCash" name="Ending Cash" stroke="hsl(180 80% 55%)" strokeWidth={2} fill="url(#cash)" />
                  <Line type="monotone" dataKey="opCashFlow" name="Op. Cash Flow" stroke="hsl(30 95% 60%)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Balance Sheet — Assets &amp; Equity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${(v / 1e6).toFixed(0)}M`} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                    formatter={(v: number) => fmtM(v)}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="totalAssets" name="Total Assets" fill="hsl(210 90% 60%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="totalEquity" name="Total Equity" fill="hsl(265 85% 65%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Revenue mix */}
        <Card className="tech-card border-0 mb-8">
          <CardHeader>
            <CardTitle className="text-base">Revenue Mix — FY2028 Illustrative Blend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {revenueMix.map((s) => (
                <div key={s.name} className="flex items-center gap-3">
                  <div className="w-32 sm:w-44 text-xs sm:text-sm text-muted-foreground shrink-0">{s.name}</div>
                  <div className="flex-1 h-8 rounded-md bg-muted/30 overflow-hidden">
                    <div
                      className="h-full flex items-center px-2 text-xs font-semibold text-white transition-all"
                      style={{ width: `${s.value}%`, background: s.color }}
                    >
                      {s.value}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Drivers */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {drivers.map((d) => (
            <Card key={d.label} className="tech-card border-0">
              <CardContent className="p-4">
                <d.icon className="w-5 h-5 text-primary mb-2" />
                <div className="text-xs text-muted-foreground">{d.label}</div>
                <div className="text-xl font-bold">{d.value}</div>
                <div className="text-xs text-emerald-400 mt-1">{d.growth}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed table */}
        <Card className="tech-card border-0">
          <CardHeader>
            <CardTitle className="text-base">Annual Summary — {FACTORS[scenario].label} Scenario</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground">
                  <th className="text-left py-2 pr-4 font-medium">Metric</th>
                  {data.map((d) => (
                    <th key={d.year} className="text-right py-2 px-3 font-medium">{d.year}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="[&>tr]:border-b [&>tr]:border-border/30">
                {[
                  { k: "revenue", label: "Revenue", fmt: fmtM },
                  { k: "grossProfit", label: "Gross Profit", fmt: fmtM },
                  { k: "ebitda", label: "EBITDA", fmt: fmtM },
                  { k: "netIncome", label: "Net Income", fmt: fmtM },
                  { k: "opCashFlow", label: "Operating Cash Flow", fmt: fmtM },
                  { k: "endingCash", label: "Ending Cash", fmt: fmtM },
                  { k: "totalAssets", label: "Total Assets", fmt: fmtM },
                  { k: "totalEquity", label: "Total Equity", fmt: fmtM },
                  { k: "grossMargin", label: "Gross Margin", fmt: fmtPct },
                  { k: "ebitdaMargin", label: "EBITDA Margin", fmt: fmtPct },
                  { k: "netMargin", label: "Net Margin", fmt: fmtPct },
                ].map((row) => (
                  <tr key={row.k}>
                    <td className="py-2 pr-4 font-medium">{row.label}</td>
                    {data.map((d) => (
                      <td key={d.year} className="text-right py-2 px-3 tabular-nums">
                        {row.fmt((d as any)[row.k])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground mt-6 text-center">
          Source: Startup Factory Institutional Monthly Model v1.0 · Prepared for Series A / Series B due diligence · Base assumes 100 startups / yr, 400 MBA students, 650 SaaS users, 25 corporate clients.
        </p>
      </div>
    </div>
  );
}
