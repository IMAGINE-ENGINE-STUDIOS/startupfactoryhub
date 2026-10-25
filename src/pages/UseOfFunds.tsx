import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Rocket, Users, GraduationCap, HandCoins, Zap, Building2, Server, Cloud,
  Scale, ShieldCheck, Megaphone, Plane, Wallet, Timer, TrendingUp,
  ArrowUpRight, ArrowRight, Cpu, CircleDollarSign, CalendarRange,
  FileSpreadsheet, FileDown, Loader2, BrainCircuit, FlaskConical, Wrench,
  PiggyBank, Umbrella, FileCheck2, Briefcase, Percent, Globe, Award,
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, AreaChart, Area,
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";
import sfhLogo from "@/assets/sfh-logo-sphere.png";
import mockupDashboard from "@/assets/mockup-dashboard.png";
import "./UseOfFunds.css";

/* ──────────────────────────────────────────────────────────────────────────
   /uof — Use of Funds, unified with the Financial Projections from /deck.
   Use-of-Funds figures: the founder-supplied Year-1 budget for the $1.5M seed.
   Projections: taken verbatim from the Deck's "5-Year Financial Projections"
   slide (Year 1 $6.09M → Year 5 $60.9M) and its Business Model slide.
   ────────────────────────────────────────────────────────────────────────── */

const SEED = 1_500_000;
const TOTAL = 1_500_000;

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/* ------------------------------ Use of Funds ----------------------------- */

const TEAM = [
  { role: "Chief Executive Officer", code: "CEO", annual: 144_000, tier: "$12K/MO" },
  { role: "Chief Technology Officer", code: "CTO", annual: 144_000, tier: "$12K/MO" },
  { role: "Chief Operating Officer", code: "COO", annual: 144_000, tier: "$12K/MO" },
  { role: "Chief Financial Officer", code: "CFO", annual: 108_000, tier: "$9K/MO" },
  { role: "Chief Commercial Officer", code: "CCO", annual: 108_000, tier: "$9K/MO" },
];

const OPS_ITEMS = [
  { icon: Building2, label: "Office", detail: "$584 / person / mo × 5", monthly: 2_920, annual: 35_040 },
  { icon: Server, label: "Hosting", detail: "Platform infrastructure", monthly: 1_500, annual: 18_000 },
  { icon: Cloud, label: "Cloud", detail: "$250 / person / mo × 5", monthly: 1_250, annual: 15_000 },
  { icon: Scale, label: "Legal", detail: "Corporate · IP · Venture", monthly: 3_630, annual: 43_560 },
  { icon: ShieldCheck, label: "Insurance", detail: "GL · E&O · D&O · Cyber", monthly: 1_000, annual: 12_000 },
];

const GROWTH_ITEMS = [
  { icon: Megaphone, label: "Marketing + CAC", detail: "$20,000 / mo", monthly: 20_000, annual: 240_000, pct: "16.0%" },
  { icon: Users, label: "Events", detail: "$2,500 / mo", monthly: 2_500, annual: 30_000, pct: "2.0%" },
  { icon: Plane, label: "Travel", detail: "$4,167 / mo", monthly: 4_167, annual: 50_000, pct: "3.3%" },
];

const PRODUCT_DEV_ITEMS = [
  { icon: BrainCircuit, label: "AI Platform Core", monthly: 10_000, annual: 120_000, pct: "41.6%" },
  { icon: FlaskConical, label: "Venture Studio", monthly: 5_833, annual: 70_000, pct: "24.3%" },
  { icon: Wrench, label: "Tech Stack", monthly: 3_333, annual: 40_000, pct: "13.9%" },
  { icon: Rocket, label: "Venture Launch", monthly: 4_867, annual: 58_400, pct: "20.2%" },
];

const WC_ITEMS = [
  { icon: PiggyBank, label: "Buffer", amount: 60_000, pct: "50.0%" },
  { icon: Umbrella, label: "Contingency", amount: 40_000, pct: "33.3%" },
  { icon: FileCheck2, label: "Compliance", amount: 20_000, pct: "16.7%" },
];

const TEAM_TOTAL = 648_000;
const OPS_TOTAL = 123_600;
const GROWTH_TOTAL = 320_000;
const PRODUCT_DEV_TOTAL = 288_400;
const WC_TOTAL = 120_000;

/* Category colours remapped to the platform / Deck palette (teal → cyan →
   sky → violet → amber) instead of the draft's neon set. */
const CATEGORIES = [
  { name: "Team", annual: TEAM_TOTAL, pctOfBurn: "43.2%", color: "#2dd4bf", note: "5 people · $54,000/mo" },
  { name: "Operations", annual: OPS_TOTAL, pctOfBurn: "8.2%", color: "#22d3ee", note: "$10,300/mo" },
  { name: "Growth", annual: GROWTH_TOTAL, pctOfBurn: "21.3%", color: "#38bdf8", note: "$26,667/mo" },
  { name: "Product Development", annual: PRODUCT_DEV_TOTAL, pctOfBurn: "19.2%", color: "#a78bfa", note: "$24,033/mo" },
  { name: "Working Capital", annual: WC_TOTAL, pctOfBurn: "8.0%", color: "#fbbf24", note: "$10,000/mo" },
];

const DONUT_DATA = CATEGORIES.map((c) => ({ name: c.name, value: c.annual, color: c.color }));

const BAR_DATA = [
  { name: "Team", annual: 648 },
  { name: "Ops", annual: 123.6 },
  { name: "Growth", annual: 320 },
  { name: "Product Dev", annual: 288.4 },
  { name: "Working Cap.", annual: 120 },
];

const ECOSYSTEM = [
  { icon: Rocket, title: "Startups", accent: "#2dd4bf" },
  { icon: Users, title: "Mentors", accent: "#22d3ee" },
  { icon: HandCoins, title: "Investors", accent: "#38bdf8" },
  { icon: GraduationCap, title: "Students", accent: "#a78bfa" },
  { icon: Zap, title: "Accelerators", accent: "#fbbf24" },
];

/* -------------------- Projections — verbatim from /deck ------------------ */

/* Deck, "5-Year Financial Projections" slide: $6.09M → $60.9M, +78% per year. */
const PROJECTION_YEARS = [
  { year: "Year 1", revenue: 6.09, growth: null as string | null },
  { year: "Year 2", revenue: 10.83, growth: "+78%" },
  { year: "Year 3", revenue: 19.26, growth: "+78%" },
  { year: "Year 4", revenue: 34.25, growth: "+78%" },
  { year: "Year 5", revenue: 60.9, growth: "+78%" },
];

/* Deck, same slide: the Year 1 revenue engine behind the $6.09M. */
const Y1_ENGINE = [
  { icon: Briefcase, t: "500 Global Desk", s: "$550 / month", v: "$3.3M", amount: 3_300_000, w: 54.2 },
  { icon: Building2, t: "100 Global Office", s: "$950 / month", v: "$1.14M", amount: 1_140_000, w: 18.7 },
  { icon: Users, t: "1,000 Members", s: "$50 / month", v: "$600K", amount: 600_000, w: 9.9 },
  { icon: Rocket, t: "10 Accelerators-as-a-Service", s: "$5K software + $5K / startup (min 10)", v: "$550K", amount: 550_000, w: 9.0 },
  { icon: Cpu, t: "2,200 AI Credit Plans", s: "20% of 11,000 users (incl. free) · $19 avg / mo", v: "$500K", amount: 500_000, w: 8.2 },
];

/* Deck, "Business Model & Revenue Streams" slide: core recurring revenue. */
const REVENUE_STREAMS = [
  { icon: Building2, name: "Global Desk", price: "$550", unit: "/ month" },
  { icon: Globe, name: "Global Office", price: "$950", unit: "/ month" },
  { icon: Award, name: "Members Club", price: "$50", unit: "/ month" },
  { icon: Rocket, name: "Accelerator as a Service", price: "$5K", unit: "software + $5K / startup" },
  { icon: Cpu, name: "AI Credits", price: "$9–$29", unit: "/ month + usage packs" },
];

const CHART_TOOLTIP = {
  background: "#0e1622",
  border: "1px solid rgba(45,212,191,0.25)",
  borderRadius: 12,
  color: "#f0fdfa",
} as const;

/* --------------------------------- helpers -------------------------------- */

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--uof-line)] bg-[var(--uof-surface)] px-3 py-1">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--uof-teal)] uof-pulse-ring" />
      <span className="uof-mono text-[11px] tracking-[0.22em] text-[var(--uof-teal)] uppercase">{children}</span>
    </div>
  );
}

/* ----------------------------------- page ---------------------------------- */

export default function UseOfFunds() {
  const [period, setPeriod] = useState<"annual" | "monthly">("annual");
  const [scenario, setScenario] = useState<"ops" | "core" | "full">("full");
  const [exportMsg, setExportMsg] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const runway = useMemo(() => {
    if (scenario === "ops") {
      return { monthly: 64_300, months: 18, display: "18", label: "Operational — Team + Operations" };
    }
    if (scenario === "core") {
      return { monthly: 90_967, months: 16.22, display: "16.22", label: "Core + Growth" };
    }
    return { monthly: 125_000, months: 12, display: "12.0", label: "Full Deployment" };
  }, [scenario]);

  const runwayPct = Math.min(100, (runway.months / 24) * 100);
  const val = (annual: number) => (period === "annual" ? fmt(annual) : fmt(Math.round(annual / 12)));
  const per = period === "annual" ? "/ yr" : "/ mo";

  const exportCsv = () => {
    const rows: (string | number)[][] = [
      ["Category", "Item", "Monthly USD", "Annual USD"],
      ...TEAM.map((m) => ["Team", `${m.role} (${m.code})`, m.annual / 12, m.annual]),
      ["Team", "Total Team", 54_000, TEAM_TOTAL],
      ...OPS_ITEMS.map((i) => ["Operations", i.label, i.monthly, i.annual]),
      ["Operations", "Total Operations", 10_300, OPS_TOTAL],
      ...GROWTH_ITEMS.map((g) => ["Growth", g.label, g.monthly, g.annual]),
      ["Growth", "Total Growth", 26_667, GROWTH_TOTAL],
      ...PRODUCT_DEV_ITEMS.map((p) => ["Product Development", p.label, p.monthly, p.annual]),
      ["Product Development", "Total Product Development", 24_033, PRODUCT_DEV_TOTAL],
      ...WC_ITEMS.map((w) => ["Working Capital", w.label, Math.round(w.amount / 12), w.amount]),
      ["Working Capital", "Total Working Capital", 10_000, WC_TOTAL],
      ["Summary", "Total", 125_000, TOTAL],
      ["Summary", "Seed Raise", "", SEED],
      ["Summary", "Runway — Operational (Team + Ops)", 64_300, "18.0 months"],
      ["Summary", "Runway — Core + Growth", 90_967, "16.22 months"],
      ["Summary", "Runway — Full Deployment", 125_000, "12.0 months"],
      ["Projections (from /deck)", "Year 1 Revenue", "", 6_090_000],
      ["Projections (from /deck)", "Year 2 Revenue", "", 10_830_000],
      ["Projections (from /deck)", "Year 3 Revenue", "", 19_260_000],
      ["Projections (from /deck)", "Year 4 Revenue", "", 34_250_000],
      ["Projections (from /deck)", "Year 5 Revenue", "", 60_900_000],
      ...Y1_ENGINE.map((r) => ["Year 1 Revenue Engine", r.t, "", r.amount]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "startup-factory-hub-use-of-funds.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setExportMsg("Downloaded startup-factory-hub-use-of-funds.csv");
  };

  /* PDF: render the whole unified page (same html2canvas + jsPDF stack the
     Deck uses) and slice the tall canvas into A4 portrait pages. */
  const downloadPdf = async () => {
    const el = contentRef.current;
    if (!el || pdfBusy) return;
    setPdfBusy(true);
    const loading = toast.loading("Building your PDF…");
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: "#020617",
        useCORS: true,
        logging: false,
        windowWidth: 1280,
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pageW) / canvas.width;
      let heightLeft = imgH;
      let position = 0;
      pdf.addImage(imgData, "JPEG", 0, position, pageW, imgH);
      heightLeft -= pageH;
      while (heightLeft > 0) {
        position -= pageH;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, pageW, imgH);
        heightLeft -= pageH;
      }
      pdf.save("startup-factory-hub-use-of-funds.pdf");
      toast.success("PDF downloaded — Use of Funds + Projections", { id: loading });
      setExportMsg("Downloaded startup-factory-hub-use-of-funds.pdf");
    } catch {
      toast.error("PDF export failed — please try again", { id: loading });
    } finally {
      setPdfBusy(false);
    }
  };

  const pdfButton = (extra = "") => (
    <button
      onClick={downloadPdf}
      disabled={pdfBusy}
      className={`uof-no-print inline-flex items-center gap-2 rounded-full bg-[var(--uof-teal)] px-5 py-2.5 text-xs font-bold tracking-wide text-[#02110f] transition hover:brightness-110 disabled:opacity-60 ${extra}`}
    >
      {pdfBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
      DOWNLOAD PDF
    </button>
  );

  return (
    <div className="uof-root min-h-screen overflow-x-clip">
      {/* ------------------------------- header ------------------------------- */}
      <header className="uof-no-print sticky top-0 z-40 border-b border-[var(--uof-line)] bg-[rgba(2,6,23,0.88)] backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <img src={sfhLogo} alt="Startup Factory Hub" className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-[rgba(45,212,191,0.35)]" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold tracking-wide">STARTUP FACTORY HUB</span>
              <span className="uof-mono block text-[9px] tracking-[0.18em] text-[var(--uof-cyan)]">A.I. POWERED VENTURE BUILDER PLATFORM</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 uof-mono text-[11px] tracking-[0.16em] text-[var(--uof-ink-dim)] lg:flex">
            <a href="#use-of-funds" className="hover:text-[var(--uof-teal)] transition-colors">ALLOCATION</a>
            <a href="#breakdown" className="hover:text-[var(--uof-teal)] transition-colors">BREAKDOWN</a>
            <a href="#runway" className="hover:text-[var(--uof-teal)] transition-colors">RUNWAY</a>
            <a href="#projections" className="hover:text-[var(--uof-teal)] transition-colors">PROJECTIONS</a>
            <Link to="/deck" className="hover:text-[var(--uof-teal)] transition-colors">DECK</Link>
          </nav>
          {pdfButton("shrink-0")}
        </div>
      </header>

      <div ref={contentRef}>
        {/* -------------------------------- hero -------------------------------- */}
        <section id="top" className="relative overflow-x-clip">
          <div className="uof-grid absolute inset-0 opacity-70" aria-hidden />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(20,184,166,0.16),transparent_55%),radial-gradient(ellipse_at_85%_10%,rgba(34,211,238,0.10),transparent_50%)]" aria-hidden />
          <div className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-[rgba(45,212,191,0.10)] blur-3xl" aria-hidden />

          <div className="relative mx-auto grid grid-cols-1 max-w-7xl gap-10 px-4 pt-14 pb-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <SectionTag>$1.5M SEED · USE OF FUNDS + PROJECTIONS</SectionTag>
              <p className="uof-mono mt-6 text-[11px] font-bold tracking-[0.28em] text-[var(--uof-cyan)]">STARTUP FACTORY HUB</p>
              <h1 className="mt-3 text-4xl font-bold leading-[1.04] tracking-tight sm:text-6xl">
                Use of Funds — <span className="uof-gradient-text">where the $1.5M goes</span>, and the growth it funds
              </h1>
              <p className="mt-4 max-w-xl text-base text-[var(--uof-ink-dim)] sm:text-lg">
                The Year-1 allocation of the seed, line by line — unified with the 5-year financial projections from the deck: $6.09M in Year 1 growing to $60.9M in Year 5.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a href="#use-of-funds" className="inline-flex items-center gap-2 rounded-full bg-[var(--uof-teal)] px-6 py-3 text-sm font-bold text-[#02110f] transition hover:brightness-110">
                  ALLOCATION <ArrowUpRight className="h-4 w-4" />
                </a>
                <a href="#projections" className="inline-flex items-center gap-2 rounded-full border border-[var(--uof-line-cyan)] px-6 py-3 text-sm font-semibold text-[var(--uof-cyan)] transition hover:bg-[rgba(34,211,238,0.08)]">
                  <TrendingUp className="h-4 w-4" /> PROJECTIONS
                </a>
                <span className="uof-no-print">{pdfButton("!px-6 !py-3 !text-sm")}</span>
              </div>

              <dl className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { k: "SEED", v: "$1,500,000" },
                  { k: "BURN", v: "$125,000/mo" },
                  { k: "YEAR 1 REVENUE", v: "$6.09M" },
                  { k: "YEAR 5 REVENUE", v: "$60.9M" },
                ].map((s) => (
                  <div key={s.k} className="rounded-2xl border border-[var(--uof-line)] bg-[var(--uof-surface)] p-4">
                    <dt className="uof-mono text-[10px] tracking-[0.18em] text-[var(--uof-ink-faint)]">{s.k}</dt>
                    <dd className="uof-mono mt-2 text-lg font-bold text-[var(--uof-ink)] sm:text-xl">{s.v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div className="rounded-[2rem] border border-[var(--uof-line)] bg-[var(--uof-surface)] p-6 sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <p className="uof-mono text-[10px] tracking-[0.22em] text-[var(--uof-cyan)]">YEAR-1 ALLOCATION</p>
                  <span className="uof-mono text-[10px] tracking-[0.18em] text-[var(--uof-teal)]">100%</span>
                </div>
                <div className="mt-6 flex justify-center">
                  <img src={sfhLogo} alt="Startup Factory Hub" className="h-24 w-24 rounded-full object-cover ring-1 ring-[rgba(45,212,191,0.35)]" />
                </div>
                <ul className="mt-6 space-y-2">
                  {CATEGORIES.map((c) => (
                    <li key={c.name} className="flex items-center justify-between gap-3 rounded-xl bg-[var(--uof-surface-2)] px-4 py-2.5">
                      <span className="flex items-center gap-2 text-sm">
                        <span className="h-2 w-2 rounded-sm" style={{ background: c.color }} />
                        {c.name}
                      </span>
                      <span className="uof-mono text-sm font-bold" style={{ color: c.color }}>
                        {fmt(c.annual)} · {c.pctOfBurn}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-center justify-between rounded-2xl border border-[var(--uof-line)] bg-[rgba(2,6,23,0.6)] px-4 py-3">
                  <p className="uof-mono text-sm font-bold">TOTAL $1,500,000</p>
                  <Rocket className="h-5 w-5 shrink-0 text-[var(--uof-teal)]" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------- use of funds ---------------------------- */}
        <section id="use-of-funds" className="relative border-t border-[var(--uof-line)] bg-[var(--uof-deep)]">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <SectionTag>USE OF FUNDS</SectionTag>
                <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">$1,500,000 — allocated</h2>
              </div>
              <div className="uof-no-print inline-flex rounded-full border border-[var(--uof-line)] bg-[var(--uof-surface)] p-1" role="group" aria-label="Toggle period">
                {(["annual", "monthly"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`rounded-full px-4 py-2 uof-mono text-xs tracking-wider transition ${
                      period === p ? "bg-[var(--uof-teal)] font-bold text-[#02110f]" : "text-[var(--uof-ink-dim)] hover:text-[var(--uof-ink)]"
                    }`}
                  >
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-3xl border border-[var(--uof-line)] bg-[var(--uof-surface)] p-5 uof-glow">
                <div className="flex items-center justify-between">
                  <h3 className="uof-mono text-xs tracking-[0.2em] text-[var(--uof-ink-dim)]">ALLOCATION</h3>
                  <CircleDollarSign className="h-5 w-5 text-[var(--uof-teal)]" />
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={DONUT_DATA} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="88%" paddingAngle={2} strokeWidth={0}>
                        {DONUT_DATA.map((d) => (
                          <Cell key={d.name} fill={d.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any, name: any) => [fmt(Number(value)), name]} contentStyle={CHART_TOOLTIP} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {DONUT_DATA.map((d) => (
                    <li key={d.name} className="flex items-center gap-2 text-sm">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
                      <span className="text-[var(--uof-ink-dim)]">{d.name}</span>
                      <span className="uof-mono ml-auto font-semibold">{((d.value / TOTAL) * 100).toFixed(1)}%</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-4">
                {CATEGORIES.map((c) => {
                  const pct = (c.annual / TOTAL) * 100;
                  return (
                    <article key={c.name} className="rounded-3xl border border-[var(--uof-line)] bg-[var(--uof-surface)] p-5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="text-lg font-semibold">{c.name}</h3>
                        <p className="uof-mono text-xl font-bold" style={{ color: c.color }}>
                          {val(c.annual)} <span className="text-xs font-medium text-[var(--uof-ink-faint)]">{per}</span>
                        </p>
                      </div>
                      <div className="uof-bar-track mt-3 h-2.5 overflow-hidden rounded-full">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: c.color }} />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--uof-ink-dim)]">
                        <span>{c.note}</span>
                        <span className="uof-mono text-xs tracking-wider" style={{ color: c.color }}>{c.pctOfBurn}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-[var(--uof-line)] bg-[var(--uof-surface)] p-5">
              <div className="flex items-center justify-between">
                <h3 className="uof-mono text-xs tracking-[0.2em] text-[var(--uof-ink-dim)]">ANNUAL SPEND · $K</h3>
                <TrendingUp className="h-5 w-5 text-[var(--uof-cyan)]" />
              </div>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={BAR_DATA} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(45,212,191,0.08)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "rgba(45,212,191,0.2)" }} tickLine={false} interval={0} angle={-12} textAnchor="end" height={44} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value: any) => [`$${value}k / year`, "Spend"]} contentStyle={CHART_TOOLTIP} />
                    <Bar dataKey="annual" radius={[8, 8, 0, 0]}>
                      {BAR_DATA.map((d, i) => (
                        <Cell key={d.name} fill={CATEGORIES[i].color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        {/* ----------------------------- breakdown ------------------------------ */}
        <section id="breakdown" className="relative border-t border-[var(--uof-line)]">
          <div className="uof-dots absolute inset-0 opacity-40" aria-hidden />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <SectionTag>BREAKDOWN</SectionTag>
                <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Line by line</h2>
              </div>
              <div className="uof-no-print flex flex-col items-start gap-2 sm:items-end">
                <div className="flex flex-wrap gap-2">
                  {pdfButton()}
                  <button
                    onClick={exportCsv}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--uof-line)] bg-[var(--uof-surface)] px-5 py-2.5 text-xs font-bold tracking-wide text-[var(--uof-teal)] transition hover:bg-[rgba(45,212,191,0.08)]"
                  >
                    <FileSpreadsheet className="h-4 w-4" /> EXPORT CSV
                  </button>
                </div>
                {exportMsg && <p className="uof-mono text-[11px] text-[var(--uof-cyan)]">{exportMsg}</p>}
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <article className="rounded-3xl border border-[var(--uof-line)] bg-[var(--uof-surface)] p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-lg font-semibold"><Users className="h-5 w-5 shrink-0 text-[var(--uof-teal)]" /> Team — 5</h3>
                  <span className="uof-mono rounded-full bg-[rgba(45,212,191,0.12)] px-3 py-1 text-xs font-bold text-[var(--uof-teal)]">43.2%</span>
                </div>
                <ul className="mt-5 divide-y divide-[rgba(45,212,191,0.08)]">
                  {TEAM.map((m) => (
                    <li key={m.code} className="flex items-center justify-between gap-3 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="uof-mono flex h-9 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--uof-surface-2)] text-xs font-bold text-[var(--uof-cyan)]">{m.code}</span>
                        <p className="truncate text-sm font-medium">{m.role}</p>
                        <span className="uof-mono hidden shrink-0 rounded-full bg-[rgba(45,212,191,0.14)] px-2 py-0.5 text-[10px] font-bold tracking-wider text-[var(--uof-teal)] sm:inline">{m.tier}</span>
                      </div>
                      <span className="uof-mono shrink-0 text-sm font-semibold sm:text-base">{val(m.annual)}<span className="text-[var(--uof-ink-faint)]"> {per}</span></span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-center justify-between rounded-2xl bg-[var(--uof-surface-2)] px-4 py-3">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="uof-mono text-lg font-bold text-[var(--uof-teal)]">{val(TEAM_TOTAL)} {per}</span>
                </div>
              </article>

              <article className="rounded-3xl border border-[var(--uof-line)] bg-[var(--uof-surface)] p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-lg font-semibold"><Cpu className="h-5 w-5 shrink-0 text-[var(--uof-cyan)]" /> Operations</h3>
                  <span className="uof-mono rounded-full bg-[rgba(34,211,238,0.12)] px-3 py-1 text-xs font-bold text-[var(--uof-cyan)]">8.2%</span>
                </div>
                <ul className="mt-5 divide-y divide-[rgba(34,211,238,0.08)]">
                  {OPS_ITEMS.map((item) => (
                    <li key={item.label} className="flex items-center justify-between gap-3 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <item.icon className="h-5 w-5 shrink-0 text-[var(--uof-cyan)]" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{item.label}</p>
                          <p className="truncate text-xs text-[var(--uof-ink-faint)]">{item.detail}</p>
                        </div>
                      </div>
                      <span className="uof-mono shrink-0 font-semibold">{period === "annual" ? fmt(item.annual) : fmt(item.monthly)}<span className="text-[var(--uof-ink-faint)]"> {per}</span></span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-center justify-between rounded-2xl bg-[var(--uof-surface-2)] px-4 py-3">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="uof-mono text-lg font-bold text-[var(--uof-cyan)]">{val(OPS_TOTAL)} {per}</span>
                </div>
              </article>

              <article className="rounded-3xl border border-[rgba(56,189,248,0.35)] bg-[var(--uof-surface)] p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-lg font-semibold"><Megaphone className="h-5 w-5 shrink-0 text-[#7dd3fc]" /> Growth</h3>
                  <span className="uof-mono rounded-full bg-[rgba(56,189,248,0.14)] px-3 py-1 text-xs font-bold text-[#7dd3fc]">21.3%</span>
                </div>
                <ul className="mt-5 divide-y divide-[rgba(56,189,248,0.10)]">
                  {GROWTH_ITEMS.map((item) => (
                    <li key={item.label} className="flex items-center justify-between gap-3 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <item.icon className="h-5 w-5 shrink-0 text-[#7dd3fc]" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{item.label}</p>
                          <p className="truncate text-xs text-[var(--uof-ink-faint)]">{item.detail}</p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="uof-mono font-semibold">{period === "annual" ? fmt(item.annual) : fmt(item.monthly)}<span className="text-[var(--uof-ink-faint)]"> {per}</span></span>
                        <p className="uof-mono text-[11px] text-[var(--uof-ink-faint)]">{item.pct}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-center justify-between rounded-2xl bg-[var(--uof-surface-2)] px-4 py-3">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="uof-mono text-lg font-bold text-[#7dd3fc]">{val(GROWTH_TOTAL)} {per}</span>
                </div>
              </article>

              <article className="rounded-3xl border border-[rgba(167,139,250,0.35)] bg-[var(--uof-surface)] p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-lg font-semibold"><BrainCircuit className="h-5 w-5 shrink-0 text-[#c4b5fd]" /> Product Development</h3>
                  <span className="uof-mono rounded-full bg-[rgba(167,139,250,0.16)] px-3 py-1 text-xs font-bold text-[#c4b5fd]">19.2%</span>
                </div>
                <ul className="mt-5 divide-y divide-[rgba(167,139,250,0.12)]">
                  {PRODUCT_DEV_ITEMS.map((item) => (
                    <li key={item.label} className="flex items-center justify-between gap-3 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <item.icon className="h-5 w-5 shrink-0 text-[#c4b5fd]" />
                        <p className="truncate text-sm font-medium">{item.label}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="uof-mono font-semibold">{period === "annual" ? fmt(item.annual) : fmt(item.monthly)}<span className="text-[var(--uof-ink-faint)]"> {per}</span></span>
                        <p className="uof-mono text-[11px] text-[var(--uof-ink-faint)]">{item.pct}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-center justify-between rounded-2xl bg-[var(--uof-surface-2)] px-4 py-3">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="uof-mono text-lg font-bold text-[#c4b5fd]">{val(PRODUCT_DEV_TOTAL)} {per}</span>
                </div>
              </article>

              <article className="rounded-3xl border border-[rgba(251,191,36,0.3)] bg-[var(--uof-surface)] p-6 lg:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-lg font-semibold"><Wallet className="h-5 w-5 shrink-0 text-[#fbbf24]" /> Working Capital</h3>
                  <span className="uof-mono rounded-full bg-[rgba(251,191,36,0.14)] px-3 py-1 text-xs font-bold text-[#fbbf24]">8.0%</span>
                </div>
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {WC_ITEMS.map((item) => (
                    <div key={item.label} className="rounded-2xl bg-[var(--uof-surface-2)] p-4">
                      <item.icon className="h-5 w-5 text-[#fbbf24]" />
                      <p className="mt-3 text-sm font-medium">{item.label}</p>
                      <p className="uof-mono mt-1 text-xl font-bold text-[#fbbf24]">{fmt(item.amount)}</p>
                      <p className="uof-mono text-[11px] text-[var(--uof-ink-faint)]">{item.pct} of WC</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between rounded-2xl bg-[var(--uof-surface-2)] px-4 py-3">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="uof-mono text-lg font-bold text-[#fbbf24]">{fmt(WC_TOTAL)} · $10,000/mo</span>
                </div>
              </article>
            </div>

            <div className="mt-6 rounded-3xl border border-[var(--uof-line)] bg-[var(--uof-surface)] px-5 py-4">
              <p className="uof-mono text-center text-xs tracking-[0.14em] text-[var(--uof-ink-dim)] sm:text-sm">
                $648,000 + $123,600 + $320,000 + $288,400 + $120,000 = <span className="font-bold text-[var(--uof-teal)]">$1,500,000</span>
              </p>
            </div>
          </div>
        </section>

        {/* ------------------------------- runway -------------------------------- */}
        <section id="runway" className="relative border-t border-[var(--uof-line)] bg-[var(--uof-deep)] overflow-x-clip">
          <div className="uof-grid absolute inset-0 opacity-60" aria-hidden />
          <div className="absolute -top-24 left-1/3 h-80 w-80 rounded-full bg-[rgba(34,211,238,0.10)] blur-3xl" aria-hidden />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[rgba(45,212,191,0.10)] blur-3xl" aria-hidden />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6">
            <SectionTag>RUNWAY · $1,500,000</SectionTag>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Runway</h2>

            <div className="uof-no-print mt-8 inline-flex flex-wrap rounded-full border border-[var(--uof-line)] bg-[rgba(14,22,34,0.9)] p-1" role="group" aria-label="Runway scenario">
              <button onClick={() => setScenario("ops")} className={`rounded-full px-4 py-2 text-xs font-semibold tracking-wide transition sm:px-5 ${scenario === "ops" ? "bg-[var(--uof-teal)] text-[#02110f]" : "text-[var(--uof-ink-dim)] hover:text-[var(--uof-ink)]"}`}>OPERATIONAL</button>
              <button onClick={() => setScenario("core")} className={`rounded-full px-4 py-2 text-xs font-semibold tracking-wide transition sm:px-5 ${scenario === "core" ? "bg-[#a78bfa] text-white" : "text-[var(--uof-ink-dim)] hover:text-[var(--uof-ink)]"}`}>CORE + GROWTH</button>
              <button onClick={() => setScenario("full")} className={`rounded-full px-4 py-2 text-xs font-semibold tracking-wide transition sm:px-5 ${scenario === "full" ? "bg-[var(--uof-cyan)] text-[#02121a]" : "text-[var(--uof-ink-dim)] hover:text-[var(--uof-ink)]"}`}>FULL</button>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="rounded-3xl border border-[var(--uof-line)] bg-[rgba(14,22,34,0.92)] p-6">
                <Timer className="h-6 w-6 text-[var(--uof-teal)]" />
                <p className="uof-mono mt-4 text-[10px] tracking-[0.2em] text-[var(--uof-ink-faint)]">MONTHLY BURN</p>
                <p className="uof-mono mt-1 text-3xl font-bold">{fmt(runway.monthly)}</p>
                <p className="mt-2 text-sm text-[var(--uof-ink-dim)]">{runway.label}</p>
              </div>
              <div className="rounded-3xl border border-[var(--uof-line)] bg-[rgba(14,22,34,0.92)] p-6 uof-glow">
                <CalendarRange className="h-6 w-6 text-[var(--uof-teal)]" />
                <p className="uof-mono mt-4 text-[10px] tracking-[0.2em] text-[var(--uof-ink-faint)]">RUNWAY</p>
                <p className="uof-mono mt-1 text-4xl font-bold text-[var(--uof-teal)]">{runway.display} <span className="text-lg">months</span></p>
                <p className="mt-2 text-sm text-[var(--uof-ink-dim)]">On $1,500,000 seed.</p>
              </div>
              <div className="rounded-3xl border border-[var(--uof-line)] bg-[rgba(14,22,34,0.92)] p-6">
                <Wallet className="h-6 w-6 text-[#fbbf24]" />
                <p className="uof-mono mt-4 text-[10px] tracking-[0.2em] text-[var(--uof-ink-faint)]">WORKING CAPITAL</p>
                <p className="uof-mono mt-1 text-3xl font-bold">$120,000</p>
                <p className="mt-2 text-sm text-[var(--uof-ink-dim)]">8.0% · $10,000/mo</p>
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-[var(--uof-line)] bg-[rgba(14,22,34,0.92)] p-6">
              <div className="flex items-center justify-between uof-mono text-[11px] tracking-[0.16em] text-[var(--uof-ink-faint)]">
                <span>MONTH 0</span>
                <span className="hidden sm:inline">24-MONTH HORIZON</span>
                <span>MONTH 24</span>
              </div>
              <div className="uof-bar-track relative mt-3 h-4 overflow-hidden rounded-full">
                <div className="h-full rounded-full bg-gradient-to-r from-[var(--uof-teal)] to-[var(--uof-cyan)] transition-all duration-700" style={{ width: `${runwayPct}%` }} />
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { t: "18.0 mo · Operational", d: "$64,300/mo — Team + Operations ($771,600/yr)." },
                  { t: "16.22 mo · Core + Growth", d: "$90,967/mo — Team + Operations + Growth." },
                  { t: "12.0 mo · Full", d: "$125,000/mo — Full deployment." },
                ].map((m) => (
                  <div key={m.t} className="rounded-2xl bg-[var(--uof-surface-2)] p-4">
                    <p className="uof-mono text-xs font-bold text-[var(--uof-cyan)]">{m.t}</p>
                    <p className="mt-1 text-sm text-[var(--uof-ink-dim)]">{m.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------- projections ----------------------------- */}
        {/* Unified from /deck — "5-Year Financial Projections" + "Business Model" slides */}
        <section id="projections" className="relative border-t border-[var(--uof-line)] overflow-x-clip">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_60%,rgba(20,184,166,0.14),transparent_55%),radial-gradient(ellipse_at_85%_20%,rgba(34,211,238,0.10),transparent_50%)]" aria-hidden />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <SectionTag>PROJECTIONS · FROM THE DECK</SectionTag>
                <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">5-Year Financial Projections</h2>
                <p className="mt-3 max-w-2xl text-[var(--uof-ink-dim)]">
                  The growth the seed funds. Revenue grows 10x — from $6.09M in Year 1 to $60.9M in Year 5, +78% year over year.
                </p>
              </div>
              <Link to="/deck" className="uof-no-print inline-flex items-center gap-2 rounded-full border border-[var(--uof-line-cyan)] px-5 py-2.5 text-xs font-bold tracking-wide text-[var(--uof-cyan)] transition hover:bg-[rgba(34,211,238,0.08)]">
                SEE THE FULL DECK <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Hero numbers + growth chart */}
            <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="flex flex-col gap-4">
                <div className="rounded-3xl border border-[var(--uof-line)] bg-[var(--uof-surface)] p-6 uof-glow">
                  <p className="uof-mono text-[10px] tracking-[0.22em] text-[var(--uof-ink-faint)]">YEAR 5 REVENUE</p>
                  <p className="uof-gradient-text mt-2 text-6xl font-bold leading-none sm:text-7xl">$60.9M</p>
                  <p className="mt-3 flex items-center gap-2 text-lg font-semibold text-[var(--uof-teal)]">
                    <TrendingUp className="h-5 w-5" /> 10x from $6.09M
                  </p>
                  <p className="mt-1 text-sm text-[var(--uof-ink-dim)]">+78% growth every year, Years 2–5</p>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {PROJECTION_YEARS.map((y) => (
                    <div key={y.year} className="rounded-2xl border border-[var(--uof-line)] bg-[var(--uof-surface)] p-3 text-center">
                      <p className="uof-mono text-[9px] tracking-[0.14em] text-[var(--uof-ink-faint)] uppercase">{y.year}</p>
                      <p className="uof-mono mt-1.5 text-sm font-bold text-[var(--uof-ink)] sm:text-base">${y.revenue}M</p>
                      <p className="uof-mono text-[10px] text-[var(--uof-teal)]">{y.growth ?? "—"}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-3xl border border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.05)] p-6">
                  <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[rgba(52,211,153,0.12)]">
                      <Percent className="h-6 w-6 text-[var(--uof-emerald)]" />
                    </span>
                    <div>
                      <p className="text-lg font-semibold">Equity Program · 100 startups / year</p>
                      <p className="mt-1 text-sm text-[var(--uof-ink-dim)]">1% equity each · 10% reach $50M and exit in Year 3 · upside, not in revenue totals</p>
                      <p className="uof-mono mt-3 text-2xl font-bold text-[var(--uof-emerald)]">$5M <span className="text-xs font-medium tracking-wider text-[var(--uof-ink-faint)]">PER COHORT</span></p>
                      <p className="mt-2 text-sm text-emerald-100/80">10 exits per cohort × $500K (1% of $50M) · each class exits in its Year 3 · first exits Year 3 · $15M realized by Year 5</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-[var(--uof-line)] bg-[var(--uof-surface)] p-5">
                <div className="flex items-center justify-between">
                  <h3 className="uof-mono text-xs tracking-[0.2em] text-[var(--uof-ink-dim)]">REVENUE GROWTH · $M</h3>
                  <TrendingUp className="h-5 w-5 text-[var(--uof-teal)]" />
                </div>
                <div className="mt-4 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={PROJECTION_YEARS} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
                      <defs>
                        <linearGradient id="uofProjArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="uofProjLine" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#14b8a6" />
                          <stop offset="100%" stopColor="#67e8f9" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(45,212,191,0.08)" vertical={false} />
                      <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "rgba(45,212,191,0.2)" }} tickLine={false} />
                      <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: any) => `$${v}M`} />
                      <Tooltip formatter={(value: any) => [`$${value}M`, "Revenue"]} contentStyle={CHART_TOOLTIP} />
                      <Area type="monotone" dataKey="revenue" stroke="url(#uofProjLine)" strokeWidth={3} fill="url(#uofProjArea)" dot={{ r: 5, fill: "#a5f3fc", stroke: "#2dd4bf" }} activeDot={{ r: 7 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className="uof-mono mt-2 text-center text-[11px] tracking-[0.16em] text-[var(--uof-ink-faint)]">$6.09M · $10.83M · $19.26M · $34.25M · $60.9M</p>

                {/* Revenue streams behind the projections (Deck, Business Model slide) */}
                <div className="mt-6 border-t border-[var(--uof-line)] pt-5">
                  <p className="uof-mono text-[10px] tracking-[0.22em] text-[var(--uof-ink-faint)]">CORE RECURRING REVENUE · IN PROJECTIONS</p>
                  <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {REVENUE_STREAMS.map((s) => (
                      <li key={s.name} className="flex items-center gap-3 rounded-xl bg-[var(--uof-surface-2)] px-4 py-2.5">
                        <s.icon className="h-4 w-4 shrink-0 text-[var(--uof-teal)]" />
                        <span className="min-w-0 flex-1 truncate text-sm">{s.name}</span>
                        <span className="uof-mono shrink-0 text-sm font-bold text-[var(--uof-teal)]">{s.price} <span className="text-[10px] font-medium text-[var(--uof-ink-faint)]">{s.unit}</span></span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Year 1 revenue engine */}
            <div className="mt-6 rounded-3xl border border-[var(--uof-line)] bg-[var(--uof-surface)] p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="uof-mono text-[10px] tracking-[0.22em] text-[var(--uof-ink-faint)]">YEAR 1 REVENUE ENGINE</p>
                  <p className="uof-mono mt-1 text-4xl font-bold">$6.09M</p>
                </div>
                <p className="text-sm text-[var(--uof-ink-dim)]">How Year 1 revenue is built, stream by stream</p>
              </div>
              <div className="mt-6 space-y-5">
                {Y1_ENGINE.map((r) => (
                  <div key={r.t}>
                    <div className="flex items-center gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[rgba(45,212,191,0.10)]">
                        <r.icon className="h-5 w-5 text-[var(--uof-teal)]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold leading-tight">{r.t}</p>
                        <p className="truncate text-sm text-[var(--uof-ink-dim)]">{r.s}</p>
                      </div>
                      <span className="uof-mono shrink-0 text-xl font-bold text-[var(--uof-teal)]">{r.v}</span>
                      <span className="uof-mono hidden shrink-0 text-xs text-[var(--uof-ink-faint)] sm:inline">{r.w.toFixed(1)}%</span>
                    </div>
                    <div className="uof-bar-track mt-2 ml-[3.75rem] h-[3px] overflow-hidden rounded-full">
                      <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-cyan-300" style={{ width: `${Math.max(r.w, 3)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[var(--uof-surface-2)] px-4 py-3">
                <span className="text-sm font-semibold">Raising $1.5M seed — allocated line by line above</span>
                <a href="#use-of-funds" className="uof-mono inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-[var(--uof-teal)] hover:text-[var(--uof-cyan)]">
                  USE OF FUNDS <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------ ecosystem ------------------------------ */}
        <section className="relative border-t border-[var(--uof-line)]">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
              <div>
                <SectionTag>PLATFORM</SectionTag>
                <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Five communities. One platform.</h2>
                <img src={mockupDashboard} alt="Startup Factory Hub platform" className="mt-8 w-full rounded-3xl object-cover ring-1 ring-[var(--uof-line)]" />
              </div>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {ECOSYSTEM.map((e) => (
                  <li key={e.title} className="flex items-center gap-4 rounded-3xl border border-[var(--uof-line)] bg-[var(--uof-surface)] p-5">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: `${e.accent}1f` }}>
                      <e.icon className="h-6 w-6" style={{ color: e.accent }} />
                    </span>
                    <h3 className="font-semibold">{e.title}</h3>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* -------------------------------- footer ------------------------------- */}
        <footer className="relative border-t border-[var(--uof-line)] overflow-x-clip">
          <div className="uof-grid absolute inset-0 opacity-50" aria-hidden />
          <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6">
            <div className="flex flex-col items-center text-center">
              <img src={sfhLogo} alt="Startup Factory Hub" className="h-16 w-16 rounded-full object-cover ring-1 ring-[rgba(45,212,191,0.35)]" />
              <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
                STARTUP FACTORY <span className="text-[var(--uof-teal)] uof-text-glow">HUB</span>
              </h2>
              <p className="uof-mono mt-3 text-xs font-bold tracking-[0.24em] text-[var(--uof-cyan)]">A.I. POWERED VENTURE BUILDER PLATFORM</p>
              <p className="uof-mono mt-3 text-xs tracking-[0.18em] text-[var(--uof-ink-dim)]">
                <a href="mailto:info@startupfactoryhub.com" className="text-[var(--uof-cyan)] transition hover:text-[var(--uof-teal)]">info@startupfactoryhub.com</a>
                {" · "}
                <a href="https://startupfactoryhub.com" target="_blank" rel="noopener" className="text-[var(--uof-cyan)] transition hover:text-[var(--uof-teal)]">startupfactoryhub.com</a>
              </p>
              <div className="uof-no-print mt-6 flex flex-wrap justify-center gap-3">
                {pdfButton()}
                <Link to="/deck" className="inline-flex items-center gap-2 rounded-full border border-[var(--uof-line)] bg-[var(--uof-surface)] px-5 py-2.5 text-xs font-bold tracking-wide text-[var(--uof-teal)] transition hover:bg-[rgba(45,212,191,0.08)]">
                  VIEW THE DECK <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="uof-mono mt-10 flex flex-wrap justify-center gap-x-8 gap-y-2 text-[11px] tracking-[0.18em] text-[var(--uof-ink-faint)]">
                <span>SEED $1,500,000</span>
                <span>TEAM 43.2%</span>
                <span>GROWTH 21.3%</span>
                <span>PRODUCT DEV 19.2%</span>
                <span>WORKING CAPITAL 8.0%</span>
                <span>YEAR 5 REVENUE $60.9M</span>
              </div>
              <p className="uof-mono mt-6 border-t border-[var(--uof-line)] pt-4 text-[11px] tracking-[0.14em] text-[var(--uof-ink-faint)]">Startup Factory Hub</p>
              <p className="mt-2 text-[11px] text-[var(--uof-ink-faint)]">© 2026 Startup Factory Hub</p>
              <p className="uof-mono mt-3 text-[10px] tracking-[0.18em] text-[var(--uof-ink-faint)]">Powered by IMAGINE ENGINE</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
