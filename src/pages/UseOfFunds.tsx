import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Rocket, Users, Building2, Scale, ShieldCheck, Megaphone, Plane, Cpu,
  TrendingUp, ArrowUpRight, ArrowRight, FileSpreadsheet, FileDown, Loader2,
  Percent, Briefcase, HandCoins, GraduationCap, Zap, Award, Globe,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";
import sfhLogo from "@/assets/sfh-logo-sphere.png";
import mockupDashboard from "@/assets/mockup-dashboard.png";
import "./UseOfFunds.css";

/* ──────────────────────────────────────────────────────────────────────────
   /uof — Venture Builder Runway: Use of Funds, unified with the Financial
   Projections from /deck.
   Use-of-Funds figures: the founder's runway budget of 2026-11-04 — an
   18-month plan requested at $1,695,048 that fits the $1.5M seed exact by
   cutting Marketing by $195,048 (to $74,952). Both views are shown; the
   toggle switches every figure on the page.
   Projections: taken verbatim from the Deck's "5-Year Financial Projections"
   slide (Year 1 $6.09M → Year 5 $60.9M) and its Business Model slide.
   ────────────────────────────────────────────────────────────────────────── */

const RUNWAY_MONTHS = 18;

/* The ask, two ways: as requested, and adjusted to fit the $1.5M seed exact.
   The whole $195,048 adjustment comes out of Marketing. */
const REQUESTED_TOTAL = 1_695_048;
const ADJUSTED_TOTAL = 1_500_000;
const ADJUSTMENT = 195_048;
const REQ_BURN = 94_169; // $1,695,048 / 18
const ADJ_BURN = 83_333; // $1,500,000 / 18

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

type View = "requested" | "adjusted";

/* ---------------------------------- Team --------------------------------- */

/* 18-month totals per role: CEO/CTO/COO $207K, CFO/CCO $162K. */
const TEAM = [
  { role: "Chief Executive Officer", code: "CEO", total18: 207_000 },
  { role: "Chief Technology Officer", code: "CTO", total18: 207_000 },
  { role: "Chief Operating Officer", code: "COO", total18: 207_000 },
  { role: "Chief Financial Officer", code: "CFO", total18: 162_000 },
  { role: "Chief Commercial Officer", code: "CCO", total18: 162_000 },
];
const TEAM_TOTAL = 945_000;

/* ------------------------------- Categories ------------------------------ */

/* Category colours remapped to the platform / Deck palette (teal → cyan →
   violet → slate → amber → pink → sky), as on the previous /uof. */
const CATEGORIES = [
  { id: "team", name: "Team", icon: Users, color: "#2dd4bf", req: 945_000, adj: 945_000, pctReq: 55.7, pctAdj: 63.0, comp: "CEO $207k + CTO $207k + COO $207k + CFO $162k + CCO $162k" },
  { id: "ops", name: "Operations", icon: Building2, color: "#22d3ee", req: 129_048, adj: 129_048, pctReq: 7.6, pctAdj: 8.6, comp: "Office $42,048 + Other $87,000 = $129,048" },
  { id: "legal", name: "Legal", icon: Scale, color: "#a78bfa", req: 138_000, adj: 138_000, pctReq: 8.1, pctAdj: 9.2, comp: "$138,000 / 18m" },
  { id: "ins", name: "Insurance", icon: ShieldCheck, color: "#94a3b8", req: 18_000, adj: 18_000, pctReq: 1.1, pctAdj: 1.2, comp: "$18,000 / 18m" },
  { id: "mkt", name: "Marketing", icon: Megaphone, color: "#fbbf24", req: 270_000, adj: 74_952, pctReq: 15.9, pctAdj: 5.0, comp: "" },
  { id: "travel", name: "Travel", icon: Plane, color: "#f472b6", req: 75_000, adj: 75_000, pctReq: 4.4, pctAdj: 5.0, comp: "$75,000 / 18m" },
  { id: "ai", name: "A.I. Core", icon: Cpu, color: "#38bdf8", req: 120_000, adj: 120_000, pctReq: 7.1, pctAdj: 8.0, comp: "$120,000 / 18m" },
];

const catAmount = (c: (typeof CATEGORIES)[number], view: View) => (view === "requested" ? c.req : c.adj);
const catPct = (c: (typeof CATEGORIES)[number], view: View) => (view === "requested" ? c.pctReq : c.pctAdj);
const catComp = (c: (typeof CATEGORIES)[number], view: View) =>
  c.id === "mkt" ? (view === "requested" ? "$270,000 / 18m" : "$270,000 → $74,952 to fit $1.5M") : c.comp;

/* Operations, defined once: Office + Other. */
const OPS_PARTS = [
  { label: "Office", total18: 42_048, note: "part of Ops" },
  { label: "Other Ops", total18: 87_000, note: "18m" },
];

/* Product development, one consolidated budget — shown once.
   $8,333/mo × 18 = $150,000. */
const BUILD_SYSTEM = {
  total: 150_000,
  mo: 8_333,
  parts: [
    { label: "AI Engine", mo: 3_500, total18: 63_000, color: "#2dd4bf" },
    { label: "Studio", mo: 2_000, total18: 36_000, color: "#22d3ee" },
    { label: "Stack", mo: 1_333, total18: 23_994, color: "#a78bfa" },
    { label: "Launch", mo: 1_500, total18: 27_000, color: "#fbbf24" },
  ],
};

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
  { icon: Briefcase, t: "500 Venture Resident", s: "$550 / month", v: "$3.3M", amount: 3_300_000, w: 54.2 },
  { icon: Building2, t: "100 Global Venture Partner", s: "$950 / month", v: "$1.14M", amount: 1_140_000, w: 18.7 },
  { icon: Users, t: "1,000 Members", s: "$50 / month", v: "$600K", amount: 600_000, w: 9.9 },
  { icon: Rocket, t: "10 Accelerators-as-a-Service", s: "$5K software + $5K / startup (min 10)", v: "$550K", amount: 550_000, w: 9.0 },
  { icon: Cpu, t: "2,200 Genius AI Plans", s: "20% of 11,000 users (incl. free) · $19 avg / mo", v: "$500K", amount: 500_000, w: 8.2 },
];

/* Deck, "Business Model & Revenue Streams" slide: core recurring revenue. */
const REVENUE_STREAMS = [
  { icon: Award, name: "Members Club", price: "$50", unit: "/ month" },
  { icon: Users, name: "Community", price: "$350", unit: "/ month" },
  { icon: Building2, name: "Venture Resident", price: "$550", unit: "/ month" },
  { icon: HandCoins, name: "Venture Advisor", price: "$550", unit: "/ month" },
  { icon: Globe, name: "Global Venture Partner", price: "$950", unit: "/ month" },
  { icon: Briefcase, name: "Corporate", price: "$1,500", unit: "/ month" },
  { icon: Rocket, name: "Accelerator as a Service", price: "$5K", unit: "software + $5K / startup" },
  { icon: Cpu, name: "Genius AI Plans", price: "$9–$60", unit: "/ month · Starter / Pro / Studio" },
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
  const [view, setView] = useState<View>("requested");
  const [tab, setTab] = useState<"budget" | "allocation">("budget");
  const [exportMsg, setExportMsg] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const total = view === "requested" ? REQUESTED_TOTAL : ADJUSTED_TOTAL;
  const burn = view === "requested" ? REQ_BURN : ADJ_BURN;
  const nonTeam = total - TEAM_TOTAL;

  const exportCsv = () => {
    const rows: (string | number)[][] = [
      ["Category", "Item", "Monthly USD", "18M USD"],
      ...TEAM.map((m) => ["Team", `${m.role} (${m.code})`, m.total18 / 18, m.total18]),
      ["Team", "Total Team", 52_500, TEAM_TOTAL],
      ...CATEGORIES.filter((c) => c.id !== "team").map((c) => [c.name, c.name, Math.round(c.req / 18), c.req] as (string | number)[]),
      ["Operations", "Office", 2_336, 42_048],
      ["Operations", "Other Ops", 4_833, 87_000],
      ["Summary", "Total Requested (18M)", REQ_BURN, REQUESTED_TOTAL],
      ["Summary", "Adjustment — Marketing cut", "", -ADJUSTMENT],
      ["Summary", "Marketing (Adjusted)", 4_164, 74_952],
      ["Summary", "Total Adjusted — fits $1.5M seed exact (18M)", ADJ_BURN, ADJUSTED_TOTAL],
      ["Summary", "Runway", "", "18 months"],
      ...BUILD_SYSTEM.parts.map((p) => ["Product Build System", p.label, p.mo, p.total18] as (string | number)[]),
      ["Product Build System", "Total Product Build System", BUILD_SYSTEM.mo, BUILD_SYSTEM.total],
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

  const viewToggle = (extra = "") => (
    <div className={`uof-no-print inline-flex rounded-full border border-[var(--uof-line)] bg-[var(--uof-surface)] p-1 ${extra}`} role="group" aria-label="Toggle budget view">
      <button
        onClick={() => setView("requested")}
        className={`uof-mono rounded-full px-4 py-2 text-[11px] tracking-[0.1em] transition ${view === "requested" ? "bg-[var(--uof-ink)] font-bold text-[#02110f]" : "text-[var(--uof-ink-dim)] hover:text-[var(--uof-ink)]"}`}
      >
        REQ $1.695M
      </button>
      <button
        onClick={() => setView("adjusted")}
        className={`uof-mono rounded-full px-4 py-2 text-[11px] tracking-[0.1em] transition ${view === "adjusted" ? "bg-[var(--uof-teal)] font-bold text-[#02110f]" : "text-[var(--uof-ink-dim)] hover:text-[var(--uof-ink)]"}`}
      >
        $1.5M EXACT
      </button>
    </div>
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
              <span className="uof-mono block text-[9px] tracking-[0.18em] text-[var(--uof-cyan)]">A.I. POWERED VENTURE BUILDER</span>
            </span>
          </Link>
          <div className="hidden items-center gap-2 uof-mono text-[10px] tracking-[0.12em] text-[var(--uof-ink-faint)] xl:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--uof-teal)] animate-pulse inline-block" />
            {view === "requested" ? `18M • ${fmt(REQUESTED_TOTAL)} • $94,169/MO • +$195,048` : `${fmt(ADJUSTED_TOTAL)} EXACT • $83,333/MO`}
          </div>
          <nav className="hidden items-center gap-6 uof-mono text-[11px] tracking-[0.16em] text-[var(--uof-ink-dim)] lg:flex">
            <a href="#budget" onClick={() => setTab("budget")} className="hover:text-[var(--uof-teal)] transition-colors">BUDGET</a>
            <a href="#budget" onClick={() => setTab("allocation")} className="hover:text-[var(--uof-teal)] transition-colors">ALLOCATION</a>
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
              <SectionTag>18 MONTHS • INVESTOR READY • SINGLE SOURCE OF TRUTH</SectionTag>
              <p className="uof-mono mt-6 text-[11px] font-bold tracking-[0.28em] text-[var(--uof-cyan)]">STARTUP FACTORY HUB</p>
              <h1 className="mt-3 text-4xl font-bold leading-[1.04] tracking-tight sm:text-6xl">
                Venture Builder <span className="uof-gradient-text">Runway</span>
              </h1>
              <p className="mt-4 max-w-xl text-base text-[var(--uof-ink-dim)] sm:text-lg">
                Team $945k (CEO/CTO/COO $207k + CFO/CCO $162k) • Operations $129,048 = Office $42,048 + Other $87k • Legal $138k • Insurance $18k • Marketing $270k → $74,952 adj • Travel $75k • AI Core $120k. Total $1,695,048 ($94,169/mo) • Adjusted $1.5M exact ($83,333/mo).
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a href="#budget" onClick={() => setTab("budget")} className="inline-flex items-center gap-2 rounded-full bg-[var(--uof-teal)] px-6 py-3 text-sm font-bold text-[#02110f] transition hover:brightness-110">
                  BUDGET <ArrowUpRight className="h-4 w-4" />
                </a>
                <a href="#projections" className="inline-flex items-center gap-2 rounded-full border border-[var(--uof-line-cyan)] px-6 py-3 text-sm font-semibold text-[var(--uof-cyan)] transition hover:bg-[rgba(34,211,238,0.08)]">
                  <TrendingUp className="h-4 w-4" /> PROJECTIONS
                </a>
                <span className="uof-no-print">{pdfButton("!px-6 !py-3 !text-sm")}</span>
                {viewToggle()}
              </div>

              <dl className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { k: "TOTAL REQUESTED", v: "$1,695,048" },
                  { k: "ADJUSTED · EXACT", v: "$1,500,000" },
                  { k: "RUNWAY", v: "18 months" },
                  { k: "YEAR 1 REVENUE", v: "$6.09M" },
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
                  <p className="uof-mono text-[10px] tracking-[0.22em] text-[var(--uof-cyan)]">18M ALLOCATION · {view === "requested" ? "REQUESTED" : "ADJUSTED"}</p>
                  <span className="uof-mono text-[10px] tracking-[0.18em] text-[var(--uof-teal)]">100%</span>
                </div>
                <div className="mt-6 flex justify-center">
                  <img src={sfhLogo} alt="Startup Factory Hub" className="h-24 w-24 rounded-full object-cover ring-1 ring-[rgba(45,212,191,0.35)]" />
                </div>
                <ul className="mt-6 space-y-2">
                  {CATEGORIES.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl bg-[var(--uof-surface-2)] px-4 py-2.5">
                      <span className="flex items-center gap-2 text-sm">
                        <span className="h-2 w-2 rounded-sm" style={{ background: c.color }} />
                        {c.name}
                      </span>
                      <span className="uof-mono text-sm font-bold" style={{ color: c.color }}>
                        {fmt(catAmount(c, view))} · {catPct(c, view).toFixed(1)}%
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-center justify-between rounded-2xl border border-[var(--uof-line)] bg-[rgba(2,6,23,0.6)] px-4 py-3">
                  <p className="uof-mono text-sm font-bold">TOTAL {fmt(total)}</p>
                  <Rocket className="h-5 w-5 shrink-0 text-[var(--uof-teal)]" />
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* ------------------------- budget / allocation ------------------------ */}
        <section id="budget" className="relative border-t border-[var(--uof-line)] bg-[var(--uof-deep)]">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <SectionTag>USE OF FUNDS · 18 MONTHS</SectionTag>
                <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                  {tab === "budget" ? "The budget, line by line" : "Allocation — the investor view"}
                </h2>
                <p className="mt-3 max-w-2xl text-[var(--uof-ink-dim)]">
                  One plan, two readings: the full request at $1,695,048, and the same plan adjusted to fit the $1.5M seed exact — the entire $195,048 adjustment comes out of Marketing.
                </p>
              </div>
              <div className="uof-no-print flex flex-col items-start gap-2 sm:items-end">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex rounded-full border border-[var(--uof-line)] bg-[var(--uof-surface)] p-1" role="group" aria-label="Budget or allocation view">
                    <button
                      onClick={() => setTab("budget")}
                      className={`uof-mono rounded-full px-4 py-2 text-[11px] tracking-[0.1em] transition ${tab === "budget" ? "bg-[var(--uof-teal)] font-bold text-[#02110f]" : "text-[var(--uof-ink-dim)] hover:text-[var(--uof-ink)]"}`}
                    >
                      01 — BUDGET
                    </button>
                    <button
                      onClick={() => setTab("allocation")}
                      className={`uof-mono rounded-full px-4 py-2 text-[11px] tracking-[0.1em] transition ${tab === "allocation" ? "bg-[var(--uof-teal)] font-bold text-[#02110f]" : "text-[var(--uof-ink-dim)] hover:text-[var(--uof-ink)]"}`}
                    >
                      02 — ALLOCATION
                    </button>
                  </div>
                  {viewToggle()}
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

            {tab === "budget" ? (
              <>
                {/* Total card + stacked allocation bar */}
                <div className="mt-10 rounded-3xl border border-[var(--uof-line)] bg-[var(--uof-surface)] p-6 sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="uof-mono text-[10px] tracking-[0.22em] text-[var(--uof-ink-faint)]">
                        {view === "requested" ? "TOTAL REQUESTED • 18M" : "TOTAL ADJUSTED • 18M • EXACT"}
                      </p>
                      <p className="uof-mono mt-2 text-5xl font-bold leading-none sm:text-6xl">{fmt(total)}</p>
                      <p className="uof-mono mt-2 text-sm text-[var(--uof-ink-dim)]">${burn.toLocaleString()}/mo • 18 months</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {view === "requested" ? (
                        <>
                          <span className="uof-mono rounded-full border border-[rgba(251,191,36,0.3)] bg-[rgba(251,191,36,0.08)] px-3 py-1 text-[10px] tracking-[0.14em] text-[#fbbf24]">+$195,048 OVER $1.5M</span>
                          <span className="text-xs text-[var(--uof-ink-dim)]">Fits $1.5M by cutting Marketing $195,048</span>
                        </>
                      ) : (
                        <>
                          <span className="uof-mono rounded-full border border-[var(--uof-line)] bg-[rgba(45,212,191,0.08)] px-3 py-1 text-[10px] tracking-[0.14em] text-[var(--uof-teal)]">EXACT $1.5M</span>
                          <span className="uof-mono rounded-full border border-[var(--uof-line)] bg-[rgba(45,212,191,0.08)] px-3 py-1 text-[10px] tracking-[0.14em] text-[var(--uof-teal)]">INVESTOR READY</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 flex h-9 w-full overflow-hidden rounded-full" role="img" aria-label="Allocation by category">
                    {CATEGORIES.map((c) => (
                      <div key={c.id} style={{ width: `${catPct(c, view)}%`, background: c.color }} className="h-full" title={`${c.name} ${catPct(c, view).toFixed(1)}%`} />
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="uof-mono text-[11px] tracking-[0.1em] text-[var(--uof-ink-dim)]">
                      {view === "requested" ? "Team $945k + Non-team $750,048 = $1,695,048" : "Team $945k + $555k non-team = $1.5M exact"}
                    </p>
                    <p className="uof-mono text-[11px] tracking-[0.08em] text-[var(--uof-ink-faint)]">
                      {CATEGORIES.map((c) => `${c.name === "Operations" ? "Ops" : c.name === "Insurance" ? "Ins" : c.name === "Marketing" ? "Mkt" : c.name === "A.I. Core" ? "AI" : c.name} ${catPct(c, view).toFixed(1)}%`).join(" • ")} = 100%
                    </p>
                  </div>
                  {view === "adjusted" && (
                    <p className="uof-mono mt-4 rounded-2xl bg-[var(--uof-surface-2)] px-4 py-3 text-[11px] leading-relaxed tracking-[0.06em] text-[var(--uof-teal)]">
                      Team $945k + Ops $129,048 + Legal $138k + Ins $18k + Mkt $74,952 + Travel $75k + AI $120k = $1,500,000 exact
                    </p>
                  )}
                </div>

                {/* Team + non-team cards */}
                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="rounded-3xl border border-[var(--uof-line)] bg-[var(--uof-surface)] p-6">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="flex items-center gap-2 text-lg font-semibold">
                        <Users className="h-5 w-5 shrink-0 text-[var(--uof-teal)]" /> Team — 5 roles
                      </h3>
                      <span className="uof-mono text-[10px] tracking-[0.18em] text-[var(--uof-ink-faint)]">TEAM • 18M • 5 ROLES</span>
                    </div>
                    <ul className="mt-5 space-y-2">
                      {TEAM.map((m) => (
                        <li key={m.code} className="flex items-center justify-between gap-3 rounded-xl bg-[var(--uof-surface-2)] px-4 py-3">
                          <span className="min-w-0">
                            <span className="uof-mono text-xs font-bold text-[var(--uof-teal)]">{m.code}</span>
                            <span className="block truncate text-sm text-[var(--uof-ink-dim)]">{m.role}</span>
                          </span>
                          <span className="uof-mono shrink-0 text-right">
                            <span className="block text-sm font-bold">{fmt(m.total18)}</span>
                            <span className="block text-[10px] text-[var(--uof-ink-faint)]">${(m.total18 / 18).toLocaleString()}/mo</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex items-center justify-between rounded-2xl border border-[var(--uof-line)] bg-[rgba(2,6,23,0.6)] px-4 py-3">
                      <span className="text-sm font-semibold">Total Team</span>
                      <span className="uof-mono text-sm font-bold text-[var(--uof-teal)]">{fmt(TEAM_TOTAL)} · $52,500/mo</span>
                    </div>
                    <p className="uof-mono mt-3 text-[11px] tracking-[0.08em] text-[var(--uof-ink-faint)]">CEO $207k + CTO $207k + COO $207k + CFO $162k + CCO $162k</p>
                  </div>

                  <div className="rounded-3xl border border-[var(--uof-line)] bg-[var(--uof-surface)] p-6">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold">Non-team — everything else</h3>
                      <span className="uof-mono text-[10px] tracking-[0.18em] text-[var(--uof-ink-faint)]">NON-TEAM • 18M • OPS ONCE</span>
                    </div>
                    <ul className="mt-5 space-y-2">
                      {CATEGORIES.filter((c) => c.id !== "team").map((c) => (
                        <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl bg-[var(--uof-surface-2)] px-4 py-3">
                          <span className="flex min-w-0 items-center gap-2 text-sm">
                            <c.icon className="h-4 w-4 shrink-0" style={{ color: c.color }} />
                            <span className="truncate">{c.name}</span>
                          </span>
                          <span className="uof-mono shrink-0 text-right">
                            <span className="block text-sm font-bold" style={{ color: c.color }}>{fmt(catAmount(c, view))}</span>
                            <span className="block text-[10px] text-[var(--uof-ink-faint)]">${Math.round(catAmount(c, view) / 18).toLocaleString()}/mo · {catPct(c, view).toFixed(1)}%</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex items-center justify-between rounded-2xl border border-[var(--uof-line)] bg-[rgba(2,6,23,0.6)] px-4 py-3">
                      <span className="text-sm font-semibold">Total Non-team</span>
                      <span className="uof-mono text-sm font-bold text-[var(--uof-cyan)]">{fmt(nonTeam)}</span>
                    </div>
                    <p className="uof-mono mt-3 text-[11px] tracking-[0.08em] text-[var(--uof-ink-faint)]">Team $945k + Non-team {fmt(nonTeam)} = {fmt(total)}</p>
                  </div>
                </div>

                {/* Budget table */}
                <div className="mt-6 overflow-hidden rounded-3xl border border-[var(--uof-line)] bg-[var(--uof-surface)]">
                  <div className="flex items-center justify-between gap-3 px-6 pt-6">
                    <h3 className="uof-mono text-xs tracking-[0.2em] text-[var(--uof-ink-dim)]">BUDGET TABLE • 18 MONTHS • SINGLE VIEW</h3>
                    <span className="uof-mono rounded-full border border-[var(--uof-line)] bg-[rgba(45,212,191,0.08)] px-3 py-1 text-[10px] tracking-[0.14em] text-[var(--uof-teal)]">INVESTOR READY</span>
                  </div>
                  <div className="overflow-x-auto px-2 pb-2 pt-4">
                    <table className="w-full min-w-[640px] border-collapse text-left">
                      <thead>
                        <tr className="uof-mono text-[10px] tracking-[0.18em] text-[var(--uof-ink-faint)]">
                          <th className="px-4 py-2 font-medium">CATEGORY</th>
                          <th className="px-4 py-2 font-medium">COMPOSITION • 18M</th>
                          <th className="px-4 py-2 text-right font-medium">18M</th>
                          <th className="px-4 py-2 text-right font-medium">/MO</th>
                          <th className="px-4 py-2 text-right font-medium">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {CATEGORIES.map((c) => (
                          <tr key={c.id} className="border-t border-[rgba(45,212,191,0.08)]">
                            <td className="px-4 py-3">
                              <span className="flex items-center gap-2 font-semibold">
                                <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: c.color }} />
                                {c.name}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-[var(--uof-ink-dim)]">{catComp(c, view)}</td>
                            <td className="uof-mono px-4 py-3 text-right font-bold">{fmt(catAmount(c, view))}</td>
                            <td className="uof-mono px-4 py-3 text-right text-[var(--uof-ink-dim)]">${Math.round(catAmount(c, view) / 18).toLocaleString()}</td>
                            <td className="uof-mono px-4 py-3 text-right" style={{ color: c.color }}>{catPct(c, view).toFixed(1)}%</td>
                          </tr>
                        ))}
                        <tr className="border-t border-[var(--uof-line)] bg-[rgba(2,6,23,0.5)]">
                          <td className="px-4 py-3 font-bold" colSpan={2}>Total — {view === "requested" ? "Requested" : "Adjusted"}</td>
                          <td className="uof-mono px-4 py-3 text-right font-bold text-[var(--uof-teal)]">{fmt(total)}</td>
                          <td className="uof-mono px-4 py-3 text-right font-bold text-[var(--uof-teal)]">${burn.toLocaleString()}</td>
                          <td className="uof-mono px-4 py-3 text-right font-bold text-[var(--uof-teal)]">100%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Operations detail + product development */}
                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="rounded-3xl border border-[var(--uof-line)] bg-[var(--uof-surface)] p-6">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="flex items-center gap-2 text-lg font-semibold">
                        <Building2 className="h-5 w-5 shrink-0 text-[var(--uof-cyan)]" /> Operations
                      </h3>
                      <span className="uof-mono text-[10px] tracking-[0.18em] text-[var(--uof-ink-faint)]">OPERATIONS • ONCE • $129,048 • 18M</span>
                    </div>
                    <p className="uof-mono mt-4 text-3xl font-bold">$129,048 <span className="text-sm font-medium text-[var(--uof-ink-dim)]">$7,169/mo</span></p>
                    <ul className="mt-5 space-y-2">
                      {OPS_PARTS.map((p) => (
                        <li key={p.label} className="flex items-center justify-between gap-3 rounded-xl bg-[var(--uof-surface-2)] px-4 py-3">
                          <span className="text-sm font-semibold uppercase tracking-wide">{p.label} <span className="uof-mono ml-1 text-[10px] font-medium normal-case tracking-[0.08em] text-[var(--uof-ink-faint)]">• 18M</span></span>
                          <span className="uof-mono shrink-0 text-right">
                            <span className="block text-sm font-bold">{fmt(p.total18)}</span>
                            <span className="block text-[10px] text-[var(--uof-ink-faint)]">${Math.round(p.total18 / 18).toLocaleString()}/mo • {p.note}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="uof-mono mt-3 text-[11px] tracking-[0.08em] text-[var(--uof-ink-faint)]">= Office $42,048 + Other $87,000</p>
                  </div>

                  <div className="rounded-3xl border border-[var(--uof-line)] bg-[var(--uof-surface)] p-6">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="flex items-center gap-2 text-lg font-semibold">
                        <Cpu className="h-5 w-5 shrink-0 text-[#38bdf8]" /> Product Development
                      </h3>
                      <span className="uof-mono text-[10px] tracking-[0.18em] text-[var(--uof-ink-faint)]">ONE BUDGET • $150K • 18M</span>
                    </div>
                    <p className="uof-mono mt-4 text-3xl font-bold">$150,000 <span className="text-sm font-medium text-[var(--uof-ink-dim)]">= $8,333/mo • 18m execution engine</span></p>
                    <div className="mt-5 grid grid-cols-2 gap-2">
                      {BUILD_SYSTEM.parts.map((p) => (
                        <div key={p.label} className="rounded-xl bg-[var(--uof-surface-2)] p-3">
                          <p className="flex items-center gap-1.5 text-sm font-semibold">
                            <span className="h-2 w-2 rounded-sm" style={{ background: p.color }} /> {p.label}
                          </p>
                          <p className="uof-mono mt-1 text-[11px] text-[var(--uof-ink-dim)]">${p.mo.toLocaleString()}/mo • {fmt(p.total18)}</p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-[var(--uof-ink-dim)]">
                      Consolidated build budget: AI $3,500 + Studio $2,000 + Stack $1,333 + Launch $1,500 = $8,333/mo = $150,000 / 18m. Shown once.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Allocation — single-line investor view */}
                <div className="mt-10 rounded-3xl border border-[var(--uof-line)] bg-[var(--uof-surface)] p-6 sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="uof-mono text-[10px] tracking-[0.22em] text-[var(--uof-ink-faint)]">SINGLE-LINE INVESTOR VIEW • 18M</p>
                      <h3 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">18 Month Runway • Monthly Burn</h3>
                    </div>
                    <span className="uof-mono rounded-full border border-[var(--uof-line)] bg-[rgba(2,6,23,0.6)] px-4 py-2 text-[11px] tracking-[0.1em] text-[var(--uof-teal)]">
                      {view === "requested" ? `${fmt(REQUESTED_TOTAL)} • 18M • $94,169/MO` : `${fmt(ADJUSTED_TOTAL)} EXACT • 18M • $83,333/MO`}
                    </span>
                  </div>
                  <ul className="mt-6 space-y-2">
                    {[
                      { label: "Team $945k", detail: "$52,500/mo", color: "#2dd4bf" },
                      { label: "Ops $129,048", detail: "Office $42,048 included", color: "#22d3ee" },
                      { label: view === "requested" ? "Marketing $270k" : "Marketing $74,952", detail: view === "requested" ? "$15,000/mo" : "$4,164/mo • cut $195,048 to fit $1.5M", color: "#fbbf24" },
                      { label: "Legal $138k • Ins $18k • Travel $75k • AI $120k", detail: "18m", color: "#a78bfa" },
                    ].map((r) => (
                      <li key={r.label} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--uof-surface-2)] px-4 py-3">
                        <span className="flex items-center gap-2 font-semibold">
                          <span className="h-2 w-2 rounded-sm" style={{ background: r.color }} /> {r.label}
                        </span>
                        <span className="uof-mono text-sm text-[var(--uof-ink-dim)]">{r.detail}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex h-4 w-full overflow-hidden rounded-full" role="img" aria-label="Allocation by category">
                    {CATEGORIES.map((c) => (
                      <div key={c.id} style={{ width: `${catPct(c, view)}%`, background: c.color }} className="h-full" title={`${c.name} ${catPct(c, view).toFixed(1)}%`} />
                    ))}
                  </div>
                  <p className="uof-mono mt-3 text-[11px] tracking-[0.08em] text-[var(--uof-ink-faint)]">
                    {CATEGORIES.map((c) => `${c.name === "Operations" ? "Ops" : c.name === "Insurance" ? "Ins" : c.name === "Marketing" ? "Mkt" : c.name === "A.I. Core" ? "AI" : c.name} ${catPct(c, view).toFixed(1)}%`).join(" • ")} = 100%
                  </p>
                </div>

                {/* Product build system — consolidated once */}
                <div className="mt-6 rounded-3xl border border-[var(--uof-line)] bg-[var(--uof-surface)] p-6 sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="uof-mono text-[10px] tracking-[0.22em] text-[var(--uof-ink-faint)]">PRODUCT BUILD SYSTEM • $150K • 18M • CONSOLIDATED ONCE</p>
                      <p className="uof-mono mt-2 text-3xl font-bold">$150,000 <span className="text-sm font-medium text-[var(--uof-ink-dim)]">ONE BUDGET = $8,333/mo • $150,000 / 18m</span></p>
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
                    {BUILD_SYSTEM.parts.map((p) => (
                      <div key={p.label} className="rounded-xl bg-[var(--uof-surface-2)] p-3">
                        <p className="uof-mono text-[10px] tracking-[0.14em] text-[var(--uof-ink-faint)]">{p.label.toUpperCase()}</p>
                        <p className="uof-mono mt-1 text-lg font-bold" style={{ color: p.color }}>${p.mo.toLocaleString()}<span className="text-[10px] font-medium text-[var(--uof-ink-faint)]">/mo</span></p>
                        <p className="uof-mono text-[11px] text-[var(--uof-ink-dim)]">{fmt(p.total18)} / 18m</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-[var(--uof-ink-dim)]">
                    $3,500 AI + $2,000 Studio + $1,333 Stack + $1,500 Launch = $8,333/mo. Execution engine for venture factory. Shown only here and in budget tab once.
                  </p>
                </div>

                <p className="uof-mono mt-6 text-center text-[11px] tracking-[0.16em] text-[var(--uof-ink-faint)]">
                  Ops defined once • Product dev once • No repeated tabs
                </p>
              </>
            )}
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
                        <span className="min-w-0 flex-1 text-sm leading-snug">{s.name}</span>
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
                <span className="text-sm font-semibold">Raising $1.5M seed · $1,695,048 requested — fits $1.5M exact, allocated line by line above</span>
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
                <span>REQUESTED $1,695,048</span>
                <span>TEAM $945K</span>
                <span>RUNWAY 18 MONTHS</span>
                <span>BURN $83,333–$94,169/MO</span>
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
