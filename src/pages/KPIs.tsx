import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Rocket, Users, Building2, Globe2, Calendar,
  Briefcase, Target, Award, DollarSign, Sparkles, Activity,
  BarChart3, Zap, Heart, MapPin
} from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, LineChart, Line,
  RadialBarChart, RadialBar, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";

/* ---------- Design tokens ---------- */
const NEON = {
  cyan: "#22d3ee",
  magenta: "#e879f9",
  lime: "#a3e635",
  amber: "#fbbf24",
  violet: "#8b5cf6",
  rose: "#fb7185",
};

/* ---------- Animated count-up ---------- */
function useCountUp(target: number, duration = 1600) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function Counter({
  value, prefix = "", suffix = "", decimals = 0,
}: { value: number; prefix?: string; suffix?: string; decimals?: number }) {
  const v = useCountUp(value);
  const formatted = decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString();
  return <span>{prefix}{formatted}{suffix}</span>;
}

/* ---------- Glass card primitive ---------- */
function Glass({
  children, className = "", glow = NEON.cyan,
}: { children: React.ReactNode; className?: string; glow?: string }) {
  return (
    <div
      className={`relative rounded-2xl border border-white/10 backdrop-blur-xl ${className}`}
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 20px 60px -20px ${glow}33`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-60"
        style={{
          background: `radial-gradient(600px 200px at 20% -10%, ${glow}1f, transparent 60%)`,
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

/* ---------- Mock visual data ---------- */
const startupGrowth = [
  { m: "Jan", v: 4 }, { m: "Feb", v: 8 }, { m: "Mar", v: 14 },
  { m: "Apr", v: 19 }, { m: "May", v: 26 }, { m: "Jun", v: 32 },
  { m: "Jul", v: 38 }, { m: "Aug", v: 43 }, { m: "Sep", v: 47 },
  { m: "Oct", v: 50 }, { m: "Nov", v: 50 }, { m: "Dec", v: 50 },
];
const membership = [
  { m: "Jan", sf: 40, wtc: 25 }, { m: "Feb", sf: 75, wtc: 48 },
  { m: "Mar", sf: 110, wtc: 70 }, { m: "Apr", sf: 140, wtc: 95 },
  { m: "May", sf: 170, wtc: 120 }, { m: "Jun", sf: 200, wtc: 150 },
];
const radial = [{ name: "NPS", v: 90, fill: NEON.lime }];

/* ---------- KPI categories ---------- */
const categories = [
  {
    title: "Startup & Innovation", icon: Rocket, glow: NEON.cyan,
    items: [
      "Number of startups accelerated", "Startup survival rate",
      "Revenue growth of startups", "Jobs created",
      "Patents or IP generated", "Number of founders served",
      "Graduation rate",
    ],
  },
  {
    title: "Membership Growth", icon: Users, glow: NEON.magenta,
    items: [
      "New Startup Factory memberships", "New World Trade Center memberships",
      "Membership retention", "International member growth", "Corporate member growth",
    ],
  },
  {
    title: "Corporate Engagement", icon: Building2, glow: NEON.violet,
    items: [
      "Corporate innovation projects launched", "Strategic partnerships executed",
      "Pilot projects completed", "Corporate sponsorship revenue", "Executive participation",
    ],
  },
  {
    title: "Investment Metrics", icon: DollarSign, glow: NEON.amber,
    items: [
      "Investors engaged", "Pitch events hosted", "Capital deployed",
      "Venture funds participating", "Investment meetings facilitated",
    ],
  },
  {
    title: "International Impact", icon: Globe2, glow: NEON.lime,
    items: [
      "International delegations hosted", "Countries represented",
      "Foreign companies supported", "Soft Landing participants",
      "International trade initiatives launched",
    ],
  },
  {
    title: "Community Engagement", icon: Heart, glow: NEON.rose,
    items: [
      "Events hosted", "Annual attendance", "Mentor participation",
      "Volunteer engagement", "Media mentions", "Community partnerships",
    ],
  },
  {
    title: "Facility Performance", icon: Activity, glow: NEON.cyan,
    items: [
      "Workspace occupancy", "Meeting room utilization",
      "Event space utilization", "Daily visitor traffic",
      "Member satisfaction", "Net Promoter Score (NPS)",
    ],
  },
];

interface YearOneTarget {
  label: string;
  value: number;
  icon: React.ElementType;
  glow: string;
  prefix?: string;
  suffix?: string;
}

const yearOneTargets: YearOneTarget[] = [
  { label: "Startups Supported", value: 50, icon: Rocket, glow: NEON.cyan },
  { label: "Startup Factory Members", value: 200, icon: Users, glow: NEON.magenta },
  { label: "WTC Members", value: 150, icon: Globe2, glow: NEON.lime },
  { label: "Corporate Partners", value: 40, icon: Building2, glow: NEON.violet },
  { label: "Mentor Engagements", value: 100, icon: Award, glow: NEON.amber },
  { label: "Investor Organizations", value: 25, icon: DollarSign, glow: NEON.rose },
  { label: "Events Hosted", value: 60, icon: Calendar, glow: NEON.cyan },
  { label: "Annual Attendees", value: 3000, icon: Sparkles, glow: NEON.magenta },
  { label: "Jobs Created", value: 150, icon: Briefcase, glow: NEON.amber },
  { label: "Intl. Delegations", value: 10, icon: MapPin, glow: NEON.violet },
  { label: "Member Satisfaction", value: 90, suffix: "%", icon: Heart, glow: NEON.rose },
];

/* ---------- Page ---------- */
export default function KPIs() {
  return (
    <div
      className="min-h-screen w-full text-white overflow-x-hidden relative"
      style={{
        background:
          "radial-gradient(1200px 700px at 10% -10%, #1e1b4b 0%, transparent 60%)," +
          "radial-gradient(1000px 600px at 90% 10%, #0e7490 0%, transparent 55%)," +
          "radial-gradient(900px 700px at 50% 110%, #831843 0%, transparent 60%)," +
          "linear-gradient(180deg, #05060f 0%, #03040a 100%)",
      }}
    >
      {/* animated grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
        }}
      />
      {/* floating orbs */}
      {[NEON.cyan, NEON.magenta, NEON.lime].map((c, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl pointer-events-none"
          style={{
            background: c,
            width: 380, height: 380, opacity: 0.18,
            left: `${10 + i * 35}%`, top: `${10 + i * 20}%`,
          }}
          animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0] }}
          transition={{ duration: 18 + i * 4, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] tracking-[0.25em] uppercase border border-white/15 backdrop-blur-xl mb-6"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: NEON.cyan }} />
            Performance Intelligence
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-5"
            style={{
              backgroundImage: `linear-gradient(135deg, #fff 0%, ${NEON.cyan} 50%, ${NEON.magenta} 100%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
            Key Performance Indicators
          </h1>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto">
            Live operational signal across startups, members, capital, and community.
          </p>
        </motion.div>

        {/* Hero stat row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { l: "Startups", v: 50, s: "", glow: NEON.cyan, i: Rocket },
            { l: "Capital", v: 5, p: "$", s: "M", glow: NEON.lime, i: DollarSign },
            { l: "Members", v: 350, glow: NEON.magenta, i: Users },
            { l: "NPS", v: 90, s: "", glow: NEON.amber, i: Zap },
          ].map((k, idx) => (
            <motion.div
              key={k.l}
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.08, duration: 0.6 }}
            >
              <Glass glow={k.glow} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <k.i className="w-5 h-5" style={{ color: k.glow }} />
                  <div className="text-[10px] tracking-[0.2em] uppercase text-white/40">Live</div>
                </div>
                <div className="text-4xl md:text-5xl font-bold tracking-tight" style={{ color: k.glow }}>
                  <Counter value={k.v} prefix={k.p} suffix={k.s} />
                </div>
                <div className="text-sm text-white/60 mt-2">{k.l}</div>
              </Glass>
            </motion.div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7 }}
            className="lg:col-span-2"
          >
            <Glass glow={NEON.cyan} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[11px] tracking-[0.25em] uppercase text-white/50">Startup Pipeline</div>
                  <div className="text-xl font-semibold mt-1">Startups Accelerated · 2025</div>
                </div>
                <BarChart3 className="w-5 h-5" style={{ color: NEON.cyan }} />
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={startupGrowth}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={NEON.cyan} stopOpacity={0.7} />
                        <stop offset="100%" stopColor={NEON.cyan} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="m" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(10,12,20,0.9)", border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 12, color: "#fff",
                      }}
                    />
                    <Area type="monotone" dataKey="v" stroke={NEON.cyan} strokeWidth={2} fill="url(#g1)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Glass>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 }}
          >
            <Glass glow={NEON.lime} className="p-6 h-full">
              <div className="text-[11px] tracking-[0.25em] uppercase text-white/50">Satisfaction</div>
              <div className="text-xl font-semibold mt-1 mb-2">Net Promoter Score</div>
              <div className="h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart innerRadius="70%" outerRadius="100%" data={radial} startAngle={90} endAngle={-270}>
                    <RadialBar dataKey="v" cornerRadius={20} background={{ fill: "rgba(255,255,255,0.06)" }} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-5xl font-bold" style={{ color: NEON.lime }}>
                    <Counter value={90} suffix="" />
                  </div>
                  <div className="text-xs text-white/50 mt-1 tracking-widest uppercase">Excellent</div>
                </div>
              </div>
            </Glass>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7 }}
          >
            <Glass glow={NEON.magenta} className="p-6">
              <div className="text-[11px] tracking-[0.25em] uppercase text-white/50">Membership</div>
              <div className="text-xl font-semibold mt-1 mb-4">SF vs WTC Growth</div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={membership}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="m" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                    <Tooltip contentStyle={{ background: "rgba(10,12,20,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                    <Line type="monotone" dataKey="sf" stroke={NEON.magenta} strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="wtc" stroke={NEON.cyan} strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-5 mt-3 text-xs text-white/60">
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: NEON.magenta }} />Startup Factory</span>
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: NEON.cyan }} />World Trade Center</span>
              </div>
            </Glass>
          </motion.div>

        </div>

        {/* KPI categories grid */}
        <div className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <div className="text-[11px] tracking-[0.3em] uppercase text-white/50 mb-3">Framework</div>
            <h2 className="text-3xl md:text-4xl font-bold">KPI Categories</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat, idx) => (
              <motion.div
                key={cat.title}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.6, delay: idx * 0.06 }}
              >
                <Glass glow={cat.glow} className="p-6 h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10"
                      style={{ background: `${cat.glow}1a` }}
                    >
                      <cat.icon className="w-5 h-5" style={{ color: cat.glow }} />
                    </div>
                    <div>
                      <div className="text-[10px] tracking-[0.25em] uppercase text-white/40">Category</div>
                      <div className="font-semibold">{cat.title}</div>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {cat.items.map((it) => (
                      <li key={it} className="flex items-start gap-2 text-sm text-white/75">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: cat.glow, boxShadow: `0 0 8px ${cat.glow}` }} />
                        {it}
                      </li>
                    ))}
                  </ul>
                </Glass>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Year One Targets */}
        <div className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <div className="text-[11px] tracking-[0.3em] uppercase text-white/50 mb-3">Success Dashboard</div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight"
              style={{
                backgroundImage: `linear-gradient(135deg, ${NEON.lime} 0%, ${NEON.cyan} 100%)`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
              Year One Targets
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {yearOneTargets.map((t, idx) => (
              <motion.div
                key={t.label}
                initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: idx * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <Glass glow={t.glow} className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center border border-white/10"
                      style={{ background: `${t.glow}1a` }}
                    >
                      <t.icon className="w-4 h-4" style={{ color: t.glow }} />
                    </div>
                    <Target className="w-3.5 h-3.5 text-white/30" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: t.glow }}>
                    <Counter value={t.value} prefix={t.prefix} suffix={t.suffix} />
                  </div>
                  <div className="text-xs text-white/60 mt-2 leading-snug">{t.label}</div>
                  <div className="mt-3 h-1 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: t.glow }}
                      initial={{ width: 0 }}
                      whileInView={{ width: "100%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.4, delay: 0.2 + idx * 0.05, ease: "easeOut" }}
                    />
                  </div>
                </Glass>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          viewport={{ once: true }} transition={{ duration: 1 }}
          className="text-center text-xs tracking-[0.3em] uppercase text-white/30"
        >
          Startup Factory Hub · Performance Intelligence
        </motion.div>
      </div>
    </div>
  );
}
