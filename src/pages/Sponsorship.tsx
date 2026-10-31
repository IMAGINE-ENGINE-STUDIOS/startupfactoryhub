import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, ArrowUpRight, Award, CalendarDays, Check, Eye, Globe,
  Handshake, Lightbulb, Lock, Mail, Network, Presentation,
  Rocket, Sparkles, Star, Users, Zap,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import sfhLogo from "@/assets/sfh-logo-emblem.png";
import heroBg from "@/assets/accelerated-fundraising-bg.jpg";

/*
  THE SPONSOR CIRCLE — Private Offering · v2 "Amazing"
  Founder directions: 2026-10-28 private offering FIRST (no public prices/terms);
  2026-10-30 take it to the Accelerated Fundraising page's level — cinematic hero,
  HUD, AR bento tiles, orbital finale. Rotating centerpiece is ORIGINAL
  to this page (founder, 2026-10-30): an armillary of the four Circle rings
  over a disc of 66 event-stars — not the Accelerated Fundraising hologram.
  Terms live only in the private prospectus via info@ / Calendly.
*/

const CALENDLY = "https://calendly.com/startupfactoryhub/30min";
const REQUEST_MAILTO =
  "mailto:info@startupfactoryhub.com?subject=" +
  encodeURIComponent("Private Sponsorship Prospectus — Request") +
  "&body=" +
  encodeURIComponent(
    "Hi Khalia,\n\nPlease send me the private Startup Factory Hub sponsorship prospectus.\n\nOrganization:\nName / Title:\nWhat we would like to reach (founders / accelerators / investors / space ecosystem):\nSeries or events of interest:\n\nThank you."
  );

/* ── Count-up ─────────────────────────────────────────── */
function useCountUp(target: number, ms = 1600) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

/* ── ORIGINAL centerpiece: The Armillary Circle ────────
   Designed for this page (founder 2026-10-30: the rotating piece must be
   original, not the Accelerated Fundraising hologram). Four tilted rings —
   one per Circle, each in its tier color — precess around a golden core,
   above a rotating disc of exactly 66 event-stars, one per event of the year. */
function ArmillaryCircle() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let raf = 0; let t = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      canvas.width = r.width * dpr; canvas.height = r.height * dpr;
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);

    const RINGS = [
      { r: 0.52, tilt: 0.9, speed: 0.55, col: [52, 211, 153], node: 0.0 },   // EARTHLING emerald
      { r: 0.68, tilt: 0.55, speed: -0.4, col: [251, 191, 36], node: 2.1 },   // STAR amber
      { r: 0.84, tilt: 1.15, speed: 0.3, col: [167, 139, 250], node: 4.0 },   // NEBULA violet
      { r: 1.0, tilt: 0.72, speed: -0.22, col: [232, 201, 135], node: 1.2 },  // GALAXY gold
    ];
    const bgStars = Array.from({ length: 80 }, () => ({
      x: Math.random() * 2 - 1, y: Math.random() * 2 - 1,
      s: 0.5 + Math.random() * 1.1, ph: Math.random() * Math.PI * 2,
    })).filter((s) => Math.hypot(s.x, s.y) < 1.05);
    // 66 event-stars on a golden-angle spiral disc
    const disc = Array.from({ length: 66 }, (_, i) => {
      const f = (i + 0.5) / 66;
      return { rad: 1.12 * Math.sqrt(f), ang: i * 2.39996, gold: i % 5 === 0, s: 0.7 + ((i * 37) % 10) / 9 };
    });
    const rot = (x: number, y: number, z: number, ax: number, ay: number) => {
      const y1 = y * Math.cos(ax) - z * Math.sin(ax);
      const z1 = y * Math.sin(ax) + z * Math.cos(ax);
      const x2 = x * Math.cos(ay) + z1 * Math.sin(ay);
      const z2 = -x * Math.sin(ay) + z1 * Math.cos(ay);
      return [x2, y1, z2] as const;
    };

    const draw = () => {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.36;
      t += 0.005;

      // background stars
      bgStars.forEach((s, i) => {
        const tw = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2 + s.ph));
        ctx.beginPath(); ctx.arc(cx + s.x * R * 1.35, cy + s.y * R * 1.35, s.s * dpr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(190,242,220,${tw * 0.5})`; ctx.fill(); void i;
      });

      // 66 event-stars disc (flat, rotating)
      disc.forEach((d) => {
        const a = d.ang + t * 0.35;
        const x = Math.cos(a) * d.rad * R, y = Math.sin(a) * d.rad * R * 0.3;
        ctx.beginPath(); ctx.arc(cx + x, cy + y + R * 0.1, d.s * dpr, 0, Math.PI * 2);
        ctx.fillStyle = d.gold ? "rgba(232,201,135,0.75)" : "rgba(52,211,153,0.5)";
        ctx.fill();
      });

      // vertical axis beam
      const beam = ctx.createLinearGradient(cx, cy - R * 1.3, cx, cy + R * 1.3);
      beam.addColorStop(0, "rgba(232,201,135,0)"); beam.addColorStop(0.5, "rgba(232,201,135,0.4)"); beam.addColorStop(1, "rgba(232,201,135,0)");
      ctx.fillStyle = beam; ctx.fillRect(cx - dpr * 0.75, cy - R * 1.3, dpr * 1.5, R * 2.6);

      // the four rings, drawn as depth-shaded segments
      RINGS.forEach((ring) => {
        const prec = t * ring.speed;
        const SEG = 90;
        for (let sIdx = 0; sIdx < SEG; sIdx++) {
          const a1 = (sIdx / SEG) * Math.PI * 2, a2 = ((sIdx + 1.6) / SEG) * Math.PI * 2;
          const p1 = rot(Math.cos(a1) * ring.r, Math.sin(a1) * ring.r, 0, ring.tilt, prec);
          const p2 = rot(Math.cos(a2) * ring.r, Math.sin(a2) * ring.r, 0, ring.tilt, prec);
          const depth = (p1[2] + 1) / 2;
          ctx.beginPath();
          ctx.moveTo(cx + p1[0] * R, cy + p1[1] * R);
          ctx.lineTo(cx + p2[0] * R, cy + p2[1] * R);
          ctx.strokeStyle = `rgba(${ring.col[0]},${ring.col[1]},${ring.col[2]},${0.12 + depth * 0.55})`;
          ctx.lineWidth = (0.7 + depth * 1.3) * dpr; ctx.stroke();
        }
        // the sponsor's travelling node on this ring
        const na = ring.node + t * (0.7 + ring.speed * 0.4);
        const np = rot(Math.cos(na) * ring.r, Math.sin(na) * ring.r, 0, ring.tilt, prec);
        ctx.beginPath(); ctx.arc(cx + np[0] * R, cy + np[1] * R, 3 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${ring.col[0]},${ring.col[1]},${ring.col[2]},0.95)`;
        ctx.shadowColor = `rgba(${ring.col[0]},${ring.col[1]},${ring.col[2]},0.9)`; ctx.shadowBlur = 14 * dpr; ctx.fill(); ctx.shadowBlur = 0;
      });

      // expanding pulse from the core
      const pulse = (t * 0.5) % 1;
      ctx.beginPath(); ctx.arc(cx, cy, pulse * R * 1.05, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(232,201,135,${(1 - pulse) * 0.3})`; ctx.lineWidth = dpr; ctx.stroke();

      // golden core
      const cp = 0.5 + 0.5 * Math.sin(t * 3.2);
      const coreR = R * (0.13 + cp * 0.02);
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 3);
      grad.addColorStop(0, "rgba(255,248,220,0.95)");
      grad.addColorStop(0.25, "rgba(232,201,135,0.75)");
      grad.addColorStop(0.6, "rgba(52,211,153,0.25)");
      grad.addColorStop(1, "rgba(52,211,153,0)");
      ctx.beginPath(); ctx.arc(cx, cy, coreR * 3, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, coreR * 0.55, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,252,240,1)"; ctx.fill();

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return (
    <div className="relative w-full aspect-square max-w-[540px] mx-auto">
      <div aria-hidden className="absolute inset-4 rounded-full border border-dashed border-[#e8c987]/20" style={{ animation: "sp-orbit 70s linear infinite" }} />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {[
        { pos: "left-0 top-[14%]", k: "The Form", v: "4 RINGS · ONE SPHERE" },
        { pos: "right-0 top-[46%]", k: "Signal", v: "PRIVATE / LIVE" },
        { pos: "bottom-[10%] left-[6%]", k: "The Disc", v: "66 EVENT-STARS" },
      ].map((l) => (
        <div key={l.k} className={`pointer-events-none absolute ${l.pos}`}>
          <div className="rounded-lg border border-emerald-300/25 bg-[#04120c]/70 px-3 py-1.5 backdrop-blur-md">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#e8c987]">{l.k}</p>
            <p className="font-mono text-xs text-emerald-50">{l.v}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Data ─────────────────────────────────────────────── */
type Tier = { id: string; name: string; icon: typeof Globe; tagline: string; essence: string; accent: string; dot: string; includes: string[] };
const TIERS: Tier[] = [
  { id: "earthling", name: "EARTHLING", icon: Globe, tagline: "The entry into the Circle", essence: "For organizations beginning their presence inside the ecosystem — seen, listed, and welcomed into the room.", accent: "border-emerald-300/40 text-emerald-200", dot: "bg-emerald-300", includes: ["Recognition across SFH communications", "Logo placement in the Earthling tier on the SFH website", "Welcome moment on LinkedIn and in community updates", "Access to selected virtual accelerator events", "Offer perks, credits or tools directly to founders", "Listing in the platform and the Partner Resource Hub"] },
  { id: "star", name: "STAR", icon: Star, tagline: "Presence with a voice", essence: "For organizations ready to be heard — elevated placement, a stage for your experts, and curated founder access.", accent: "border-amber-200/40 text-amber-100", dot: "bg-amber-200", includes: ["Elevated logo position and event recognition", "Monthly ecosystem spotlight in the SFH newsletter", "Host a workshop, AMA or technical talk", "Invitations to networking in New York, San Francisco, Orlando, Santiago and Tokyo", "Curated scouting reports and early deal-flow previews", "Feature interview inside the SFH Media Hub"] },
  { id: "nebula", name: "NEBULA", icon: Sparkles, tagline: "Deep engagement, real pilots", essence: "For companies seeking integration — guaranteed speaking, structured matching, and pilots with cohort startups.", accent: "border-violet-300/40 text-violet-200", dot: "bg-violet-300", includes: ["Premium visibility across website, platform, cohorts and Demo Day", "Guaranteed speaking at a flagship SFH event", "Co-branded SFH x Sponsor campaign", "Full access to all global networking events", "Structured 1:1 startup matching sessions", "Run pilot programs with startups, with a dedicated sponsor resource page"] },
  { id: "galaxy", name: "GALAXY", icon: Award, tagline: "The strategic partnership", essence: "The highest circle — premier placement everywhere, keynote voice, private dinners, and technology woven into the platform itself.", accent: "border-[#e8c987]/50 text-[#e8c987]", dot: "bg-[#e8c987]", includes: ["Premier placement across website, all major events, summits and PR", "Joint global PR announcement across SFH hubs", "Keynote-level speaking at the Global Summit and Demo Day", "Lead role in one innovation track", "Private investor-startup dinners and priority deal-flow introductions", "Dedicated Sponsor Pavilion and a custom founder-engagement analytics view"] },
];
const SERIES = [
  { name: "Pitch Events", count: 24, cadence: "Twice monthly", note: "Founders on stage, investors in the room", glow: "rgba(52,211,153,0.5)" },
  { name: "Decahedron Reverse Pitch", count: 12, cadence: "Monthly", note: "Investors pitch founders — the room reversed", glow: "rgba(232,201,135,0.5)" },
  { name: "Accelerators Networking", count: 12, cadence: "Monthly", note: "Operators of accelerators, in one room", glow: "rgba(34,211,238,0.5)" },
  { name: "Innovation Coffee Table", count: 12, cadence: "Monthly · one home", note: "Foxtail Coffee, Belle Isle — the same table every month", glow: "rgba(245,158,11,0.5)" },
  { name: "Hot Deals in Space Industry", count: 6, cadence: "Every two months", note: "Space deals, curated and current", glow: "rgba(167,139,250,0.5)" },
];
const PILLARS = [
  { code: "VIS", icon: Eye, title: "Visibility, with taste", body: "Your brand across the platform, the events and the materials — placed elegantly, never pasted on.", detail: ["Platform + event placement", "Cohort & Demo Day materials", "Media Hub features"], glow: "rgba(52,211,153,0.55)" },
  { code: "VOX", icon: Presentation, title: "A voice in the room", body: "Keynotes, panels, workshops and fireside chats in front of founders who are actively building.", detail: ["Keynote & panel slots", "Workshops & AMAs", "Co-branded firesides"], glow: "rgba(232,201,135,0.55)" },
  { code: "ACC", icon: Handshake, title: "Curated access", body: "Structured introductions, matching sessions and private dinners — not a logo wall and a hope.", detail: ["1:1 matching sessions", "Private dinners", "Deal-flow previews"], glow: "rgba(34,211,238,0.5)" },
  { code: "PLT", icon: Zap, title: "Inside the platform", body: "Your tools, credits and pilots offered to founders at the exact moment in their journey when they need them.", detail: ["Perks & credits in-journey", "Pilot programs", "Engagement analytics"], glow: "rgba(167,139,250,0.5)" },
];
const HUBS = ["New York", "San Francisco", "Orlando · HQ", "Santiago, Chile", "Tokyo, Japan"];
const MARQUEE = ["Pitch Events", "Reverse Pitch", "Innovation Coffee Table", "Accelerators Networking", "Hot Deals in Space", "Demo Day", "Global Summit"];

function StatCell({ value, suffix, label, i }: { value: number; suffix: string; label: string; i: number }) {
  const v = useCountUp(value, 1400 + i * 250);
  return (
    <div className="px-4 py-4 backdrop-blur-sm bg-[#020d08]/85">
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-200/70">{label}</p>
      <p className="mt-1 font-mono text-2xl sm:text-3xl font-semibold text-white">{v}{suffix}</p>
    </div>
  );
}

const Sponsorship = () => {
  const [active, setActive] = useState<Tier>(TIERS[3]);
  const [openPillar, setOpenPillar] = useState<string | null>(null);
  return (
    <div className="min-h-screen bg-[#04120c] text-[#ecfdf5] relative overflow-x-clip selection:bg-emerald-300/30">
      <style>{`
        @keyframes sp-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes sp-rise { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes sp-shine { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes sp-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes sp-trace { 0% { stroke-dashoffset: 400; } 100% { stroke-dashoffset: 0; } }
        @keyframes sp-node { 0%,100% { opacity:.25; transform: scale(.85);} 50% { opacity:1; transform: scale(1.15);} }
        @keyframes sp-scan { 0% { transform: translateY(-10%); opacity: 0; } 40% { opacity: .8; } 100% { transform: translateY(1100%); opacity: 0; } }
        @keyframes sp-orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes sp-orbit-rev { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        @keyframes sp-sweep { 0% { transform: translateX(-120%); } 100% { transform: translateX(120%); } }
        @keyframes sp-particle { 0% { transform: translateY(0); opacity: 0; } 15% { opacity: .9; } 100% { transform: translateY(-260px); opacity: 0; } }
        .sp-rise { animation: sp-rise .9s cubic-bezier(.22,1,.36,1) both; }
        .sp-marquee-track { animation: sp-marquee 34s linear infinite; }
        .sp-shine { background-size: 200% auto; animation: sp-shine 7s ease infinite; }
        @media (prefers-reduced-motion: reduce) { .sp-rise, .sp-marquee-track, .sp-shine { animation: none !important; } }
      `}</style>

      <Navigation />

      <main className="relative z-10">
        {/* ── CINEMATIC HERO ─────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-white/10">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-35" style={{ backgroundImage: `url(${heroBg})` }} />
          <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(2,13,8,0.97) 0%, rgba(2,13,8,0.9) 46%, rgba(2,13,8,0.62) 72%, rgba(2,13,8,0.45) 100%)" }} />
          <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(20,184,166,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(20,184,166,0.07) 1px, transparent 1px), radial-gradient(rgba(20,184,166,0.25) 1.4px, transparent 1.5px)", backgroundSize: "50px 50px, 50px 50px, 50px 50px" }} />
          <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 1200 630">
            {["M0,180 L440,620", "M60,0 L560,500", "M660,0 L1200,540", "M456,630 L1200,126", "M0,346 L360,0"].map((d, i) => (
              <path key={d} d={d} stroke="rgba(52,211,153,0.16)" strokeWidth="1.2" fill="none" strokeDasharray="6 14" style={{ animation: `sp-trace ${14 + i * 3}s linear infinite` }} />
            ))}
            {[[245, 165], [460, 390], [130, 420], [880, 180], [1040, 470]].map(([cx, cy], i) => (
              <circle key={cx} cx={cx} cy={cy} r="4" fill={i % 2 ? "#22d3ee" : "#e8c987"} style={{ animation: `sp-node ${3 + i * 0.6}s ease-in-out infinite` }} />
            ))}
          </svg>
          <div aria-hidden className="pointer-events-none absolute left-0 right-0 top-0 h-px" style={{ background: "linear-gradient(90deg,#14b8a6,#e8c987,#22d3ee)" }} />
          <div aria-hidden className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full blur-3xl bg-emerald-400/20" />
          <div aria-hidden className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full blur-3xl bg-[#e8c987]/15" />
          {["left-5 top-24 border-l-2 border-t-2", "right-5 top-24 border-r-2 border-t-2", "bottom-5 left-5 border-b-2 border-l-2", "bottom-5 right-5 border-b-2 border-r-2"].map((c) => (
            <span key={c} aria-hidden className={`pointer-events-none absolute h-8 w-8 border-emerald-300/50 ${c}`} />
          ))}

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:py-24">
            <span aria-hidden className="pointer-events-none absolute bottom-14 left-2 top-14 w-[3px] rounded-full sm:left-3" style={{ background: "linear-gradient(180deg,#34d399,rgba(52,211,153,0.12))" }} />
            {[14, 36, 60, 82].map((tp, i) => (
              <span key={tp} aria-hidden className="pointer-events-none absolute left-2 sm:left-3 h-2.5 w-2.5 -translate-x-[4px] rounded-full bg-emerald-300" style={{ top: `${tp}%`, boxShadow: "0 0 18px 6px rgba(52,211,153,0.45)", animation: `sp-node ${3 + i * 0.5}s ease-in-out infinite` }} />
            ))}
            <div>
              <div className="sp-rise flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#e8c987]/40 bg-[#e8c987]/[0.07] px-4 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#e8c987]">
                  <Lock className="h-3 w-3" /> Private Offering · By Invitation &amp; Request
                </span>
                <span className="relative inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-300/[0.07] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-200">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-300" />
                  </span>
                  Founding Circle · Open
                </span>
              </div>

              <div className="sp-rise mt-8 flex items-center gap-5" style={{ animationDelay: "0.06s" }}>
                <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full p-2 border-2 border-emerald-300/60 bg-[#020d08]/60">
                  <img src={sfhLogo} alt="Startup Factory Hub logo" className="h-full w-full rounded-full object-contain" />
                  <span aria-hidden className="pointer-events-none absolute -inset-6 rounded-full blur-2xl bg-emerald-400/25" />
                </div>
                <span className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/45">startupfactoryhub.com<br />/ sponsorship</span>
              </div>

              <h1 className="sp-rise mt-8 font-black uppercase leading-[0.92] tracking-tight" style={{ animationDelay: "0.12s" }}>
                <span className="block text-xl sm:text-3xl font-light tracking-[0.06em] text-white/85">Sponsor the room where</span>
                <span className="block text-[2.7rem] leading-[0.92] sm:text-6xl lg:text-7xl sp-shine" style={{ backgroundImage: "linear-gradient(90deg,#34d399 0%,#e8c987 48%,#22d3ee 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", filter: "drop-shadow(0 0 28px rgba(232,201,135,0.35))" }}>
                  The Sponsor Circle
                </span>
                <span className="block text-xl sm:text-3xl font-light tracking-[0.06em] text-white/85">founders &amp; capital meet</span>
              </h1>

              <p className="sp-rise mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-[#e8c987]/90" style={{ animationDelay: "0.18s" }}>
                A private partnership with Startup Factory Hub — an AI-powered venture builder, and a year of rooms where founders, accelerators and investors actually meet.
              </p>
              <p className="sp-rise mt-3 max-w-xl text-sm leading-relaxed text-white/55" style={{ animationDelay: "0.22s" }}>
                Terms are not published. They are shared, privately, in the prospectus — shaped around who you want to reach, never sold off a rate card.
              </p>

              <div className="sp-rise mt-6 h-px w-full max-w-md" style={{ background: "linear-gradient(90deg, rgba(52,211,153,0.8), rgba(232,201,135,0.35), transparent)", animationDelay: "0.26s" }} />

              <div className="sp-rise mt-8 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "0.3s" }}>
                <a href={REQUEST_MAILTO} className="group relative overflow-hidden rounded-full px-8 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-white transition-transform duration-300 hover:scale-[1.03] bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-600 border border-cyan-300/50 shadow-[0_0_45px_-8px_rgba(52,211,153,0.75)]">
                  <span className="relative z-10 inline-flex items-center gap-2"><Mail className="h-4 w-4" /> Request Prospectus</span>
                  <span aria-hidden className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </a>
                <a href={CALENDLY} target="_blank" rel="noreferrer" className="rounded-full px-8 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-white text-center transition-transform duration-300 hover:scale-[1.03] bg-gradient-to-r from-amber-600 via-[#c9a96a] to-amber-600 border border-[#e8c987]/60 shadow-[0_0_45px_-10px_rgba(232,201,135,0.65)]">
                  Private Conversation
                </a>
              </div>

              <div className="sp-rise mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-emerald-300/20 bg-emerald-300/15 sm:grid-cols-4" style={{ animationDelay: "0.36s" }}>
                <StatCell value={66} suffix="" label="Events · 2026–27" i={0} />
                <StatCell value={270} suffix="+" label="On platform" i={1} />
                <StatCell value={50} suffix="+" label="Partners" i={2} />
                <StatCell value={5} suffix="" label="Global hubs" i={3} />
              </div>
              <p className="mt-4 text-xs text-white/40">Featured at Nasdaq Tower, Times Square — twice in 2025 · Used by NASA KSC Tech Transfer, UK Space Agency &amp; APEX Accelerators</p>
            </div>

            <div className="relative hidden lg:block" style={{ animation: "sp-float 8s ease-in-out infinite" }}>
              <ArmillaryCircle />
            </div>
          </div>
        </section>

        {/* ── TICKER ─────────────────────────────────────── */}
        <div aria-hidden className="relative overflow-hidden border-b border-white/[0.07] bg-white/[0.015] py-4 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <div className="sp-marquee-track flex w-max items-center gap-10 pr-10">
            {[...MARQUEE, ...MARQUEE].map((m, i) => (
              <span key={i} className="flex items-center gap-10 whitespace-nowrap font-mono text-xs tracking-[0.3em] uppercase text-emerald-100/45">
                {m} <Sparkles className="h-3.5 w-3.5 text-[#e8c987]/70" />
              </span>
            ))}
          </div>
        </div>

        {/* ── WHY PRIVATE · AR BENTO ─────────────────────── */}
        <section className="relative px-5 sm:px-8 py-24 overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(#34d399 1px, transparent 1px), linear-gradient(90deg, #34d399 1px, transparent 1px)", backgroundSize: "64px 64px" }} />
          <div aria-hidden className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-emerald-300/30" style={{ animation: "sp-scan 9s linear infinite" }} />
          <div className="relative max-w-6xl mx-auto">
            <div className="max-w-3xl">
              <p className="font-mono text-[11px] tracking-[0.32em] uppercase text-[#e8c987]">Why Private · What You Get</p>
              <h2 className="mt-4 text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.05]">Sponsorship here is curated,<br className="hidden sm:block" /> not sold off a rate card.</h2>
              <p className="mt-5 text-emerald-100/60 leading-relaxed max-w-2xl">Every placement is matched to what a sponsor actually wants to reach — and no two sponsors in the same circle compete for the same room. Tap a tile to expand it.</p>
            </div>
            <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {PILLARS.map((p) => {
                const open = openPillar === p.code;
                return (
                  <button key={p.code} type="button" onClick={() => setOpenPillar(open ? null : p.code)}
                    className="group relative overflow-hidden rounded-2xl border border-white/[0.09] bg-gradient-to-b from-white/[0.045] to-white/[0.015] p-6 text-left transition-all duration-300 hover:-translate-y-1"
                    style={{ boxShadow: open ? `0 18px 50px -12px ${p.glow}` : undefined }}>
                    <span aria-hidden className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full opacity-25 blur-3xl transition-opacity duration-500 group-hover:opacity-70" style={{ background: `radial-gradient(circle, ${p.glow} 0%, transparent 70%)` }} />
                    <span aria-hidden className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l border-t border-emerald-300/40 transition-all duration-300 group-hover:h-6 group-hover:w-6" />
                    <span aria-hidden className="pointer-events-none absolute right-2 top-2 h-4 w-4 border-r border-t border-emerald-300/40 transition-all duration-300 group-hover:h-6 group-hover:w-6" />
                    <span aria-hidden className="pointer-events-none absolute bottom-2 left-2 h-4 w-4 border-b border-l border-emerald-300/40 transition-all duration-300 group-hover:h-6 group-hover:w-6" />
                    <span aria-hidden className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b border-r border-emerald-300/40 transition-all duration-300 group-hover:h-6 group-hover:w-6" />
                    <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent opacity-0 group-hover:opacity-100" style={{ animation: "sp-scan 2.4s linear infinite" }} />
                    <div className="relative flex items-start justify-between">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-300/30 bg-emerald-300/[0.06] font-mono text-[11px] font-bold tracking-[0.12em] text-emerald-200">{p.code}</span>
                      <p.icon className="h-5 w-5 text-emerald-200/70" />
                    </div>
                    <h3 className="relative mt-5 text-lg font-semibold text-white leading-tight">{p.title}</h3>
                    <p className={`relative mt-2 text-sm leading-relaxed text-emerald-100/55 ${open ? "" : "line-clamp-3"}`}>{p.body}</p>
                    {open && (
                      <ul className="relative mt-3 space-y-1.5">
                        {p.detail.map((d) => (
                          <li key={d} className="flex items-center gap-2 font-mono text-[11px] text-emerald-100/65"><span className="h-1 w-1 rounded-full bg-emerald-300" />{d}</li>
                        ))}
                      </ul>
                    )}
                    <p className="relative mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300/40 group-hover:text-emerald-300/80 transition-colors">{open ? "— Collapse" : "+ Expand"}</p>
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[#e8c987]/25 bg-[#e8c987]/[0.04] px-5 py-4 max-w-3xl">
              <Lock className="h-5 w-5 text-[#e8c987] shrink-0" />
              <p className="text-sm text-emerald-100/70">Pricing, inventory and exclusivity live only in the private prospectus. Nothing is published, nothing is auctioned.</p>
            </div>
          </div>
        </section>

        {/* ── THE FOUR CIRCLES ───────────────────────────── */}
        <section className="relative px-5 sm:px-8 py-10 pb-24 overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 opacity-60">
            <div className="absolute inset-0 rounded-full border border-emerald-300/[0.07]" style={{ animation: "sp-orbit 60s linear infinite" }}>
              <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-300/70 shadow-[0_0_18px_4px_rgba(52,211,153,0.5)]" />
            </div>
            <div className="absolute inset-20 rounded-full border border-[#e8c987]/[0.06]" style={{ animation: "sp-orbit-rev 44s linear infinite" }}>
              <span className="absolute right-0 top-1/2 h-1.5 w-1.5 translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e8c987]/80 shadow-[0_0_14px_3px_rgba(232,201,135,0.5)]" />
            </div>
          </div>
          <div className="relative max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto">
              <p className="font-mono text-[11px] tracking-[0.32em] uppercase text-[#e8c987]">The Four Circles</p>
              <h2 className="mt-4 text-3xl sm:text-5xl font-semibold tracking-tight">Choose your altitude</h2>
              <p className="mt-4 text-emerald-100/55">Select a circle to preview its experience. Full terms arrive privately.</p>
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-2.5" role="tablist" aria-label="Sponsor circles">
              {TIERS.map((t) => (
                <button key={t.id} role="tab" aria-selected={active.id === t.id} onClick={() => setActive(t)}
                  className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-all duration-300 ${active.id === t.id ? "bg-emerald-300 text-[#04120c] border-emerald-300 shadow-[0_0_32px_rgba(110,231,183,0.35)]" : "border-white/10 bg-white/[0.03] text-emerald-100/70 hover:border-emerald-300/40 hover:text-white"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${active.id === t.id ? "bg-[#04120c]" : t.dot}`} />{t.name}
                </button>
              ))}
            </div>
            <div key={active.id} className="sp-rise mt-6 rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.015] backdrop-blur-xl overflow-hidden shadow-[0_40px_90px_-40px_rgba(52,211,153,0.35)]">
              <div className="grid lg:grid-cols-[1fr_1.35fr]">
                <div className="p-8 sm:p-12 border-b lg:border-b-0 lg:border-r border-white/[0.08]">
                  <div className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 ${active.accent}`}>
                    <active.icon className="h-4 w-4" /><span className="font-mono text-[11px] tracking-[0.24em]">{active.name}</span>
                  </div>
                  <h3 className="mt-6 text-3xl font-semibold text-white tracking-tight">{active.tagline}</h3>
                  <p className="mt-4 text-emerald-100/60 leading-relaxed">{active.essence}</p>
                  <div className="mt-8 flex items-center gap-3 rounded-2xl bg-black/25 border border-white/[0.07] px-5 py-4">
                    <Lock className="h-5 w-5 text-[#e8c987] shrink-0" />
                    <div><p className="text-sm font-medium text-white">Private terms</p><p className="text-xs text-emerald-100/50 mt-0.5">Investment, inventory &amp; exclusivity — in the prospectus only.</p></div>
                  </div>
                  <a href={REQUEST_MAILTO} className="group mt-7 inline-flex items-center gap-2 text-sm font-semibold text-emerald-200 hover:text-emerald-100">
                    Request this circle, privately <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </div>
                <ul className="p-8 sm:p-12 grid sm:grid-cols-2 gap-x-8 gap-y-4 content-start">
                  {active.includes.map((inc) => (
                    <li key={inc} className="flex gap-3 text-sm leading-relaxed text-emerald-50/85">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-300/10 border border-emerald-300/25"><Check className="h-3 w-3 text-emerald-200" /></span>{inc}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── THE YEAR · 66 ──────────────────────────────── */}
        <section className="px-5 sm:px-8 py-24 border-t border-white/[0.06] bg-white/[0.012]">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="font-mono text-[11px] tracking-[0.32em] uppercase text-[#e8c987]">The Year Ahead</p>
                <h2 className="mt-4 text-3xl sm:text-5xl font-semibold tracking-tight">66 rooms. One circle.</h2>
              </div>
              <p className="text-sm text-emerald-100/50 max-w-xs leading-relaxed">November 2026 — October 2027. Take a full series, a single room, or the whole year.</p>
            </div>
            <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SERIES.map((s) => (
                <div key={s.name} className="group relative overflow-hidden rounded-3xl border border-white/[0.09] bg-[#061a11]/80 p-7 hover:-translate-y-1 transition-all duration-500">
                  <span aria-hidden className="pointer-events-none absolute -top-14 -right-14 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-80" style={{ background: `radial-gradient(circle, ${s.glow} 0%, transparent 70%)` }} />
                  <div className="relative flex items-baseline justify-between">
                    <span className="text-5xl font-semibold tracking-tight text-white group-hover:text-emerald-200 transition-colors">{s.count}</span>
                    <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-emerald-100/40">{s.cadence}</span>
                  </div>
                  <h3 className="relative mt-4 text-base font-semibold text-white leading-snug">{s.name}</h3>
                  <p className="relative mt-1.5 text-sm text-emerald-100/50 leading-relaxed">{s.note}</p>
                </div>
              ))}
              <div className="rounded-3xl border border-dashed border-emerald-300/25 bg-emerald-300/[0.04] p-7 flex flex-col justify-center">
                <Rocket className="h-6 w-6 text-emerald-200" />
                <h3 className="mt-4 text-base font-semibold text-white">Plus Demo Day &amp; the Global Summit</h3>
                <p className="mt-1.5 text-sm text-emerald-100/50 leading-relaxed">The flagship moments of the year — reserved first for the Circle.</p>
              </div>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {HUBS.map((h) => (
                <span key={h} className="flex items-center gap-2 text-sm text-emerald-100/60"><Globe className="h-3.5 w-3.5 text-emerald-300/70" /> {h}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ── PROCESS + ORBITAL FINALE ───────────────────── */}
        <section className="relative px-5 sm:px-8 py-24 overflow-hidden">
          <div className="relative max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { n: "01", icon: Mail, t: "Request", b: "Ask for the private prospectus. Tell us who you want to reach — that is all we need to begin." },
                { n: "02", icon: Users, t: "Converse", b: "A private conversation with Khalia. Your circle, your series, your exclusivity — shaped around your goals." },
                { n: "03", icon: Network, t: "Take your place", b: "Your placement goes live across the platform and the year's rooms, with reporting on founder engagement." },
              ].map((step) => (
                <div key={step.n} className="relative rounded-3xl border border-white/[0.09] bg-white/[0.025] p-8 overflow-hidden group hover:border-emerald-300/30 transition-colors duration-500">
                  <span className="absolute -top-3 right-5 text-[92px] font-semibold leading-none text-white/[0.045] group-hover:text-emerald-300/[0.07] transition-colors duration-500">{step.n}</span>
                  <step.icon className="relative h-6 w-6 text-emerald-200" />
                  <h3 className="relative mt-5 text-xl font-semibold text-white">{step.t}</h3>
                  <p className="relative mt-2.5 text-sm leading-relaxed text-emerald-100/55">{step.b}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Orbital finale */}
          <div className="relative mt-24 overflow-hidden rounded-[32px] border border-white/[0.08]">
            <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(#34d399 1px, transparent 1px), linear-gradient(90deg, #34d399 1px, transparent 1px)", backgroundSize: "48px 48px", maskImage: "radial-gradient(ellipse 70% 60% at 50% 55%, black, transparent 80%)", WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 55%, black, transparent 80%)" }} />
            <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[760px] w-[760px] -translate-x-1/2 -translate-y-1/2">
              <div className="absolute inset-0 rounded-full border border-emerald-300/15" style={{ animation: "sp-orbit 48s linear infinite" }}>
                <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-300 shadow-[0_0_18px_4px_rgba(52,211,153,0.6)]" />
              </div>
              <div className="absolute inset-16 rounded-full border border-[#e8c987]/10" style={{ animation: "sp-orbit-rev 34s linear infinite" }}>
                <span className="absolute right-0 top-1/2 h-1.5 w-1.5 translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e8c987]/80 shadow-[0_0_14px_3px_rgba(232,201,135,0.5)]" />
              </div>
              <div className="absolute inset-36 rounded-full border border-dashed border-emerald-300/10" style={{ animation: "sp-orbit 70s linear infinite" }} />
            </div>
            <div aria-hidden className="pointer-events-none absolute inset-0">
              {Array.from({ length: 14 }).map((_, i) => (
                <span key={i} className="absolute bottom-0 h-1 w-1 rounded-full bg-emerald-300/70" style={{ left: `${(i * 7.3 + 4) % 98}%`, animation: `sp-particle ${7 + (i % 5) * 1.7}s linear ${i * 0.8}s infinite` }} />
              ))}
            </div>
            <div className="relative px-6 py-20 sm:py-24 text-center">
              <div className="mx-auto mb-10 flex w-full max-w-md items-center gap-3 rounded-full border border-emerald-300/25 bg-[#04120c]/70 px-4 py-2 backdrop-blur-xl">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-emerald-200">Founding placements · shaping now</span>
                <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-100/40">Nov 6 opens</span>
              </div>
              <h2 className="text-[13vw] sm:text-8xl font-black uppercase leading-[0.85] tracking-tighter">
                <span className="block bg-gradient-to-b from-white via-white to-white/20 bg-clip-text text-transparent">Take your</span>
                <span className="relative block overflow-hidden">
                  <span className="sp-shine" style={{ backgroundImage: "linear-gradient(90deg,#34d399 0%,#e8c987 48%,#22d3ee 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", filter: "drop-shadow(0 0 30px rgba(232,201,135,0.4))" }}>place</span>
                  <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden"><span className="absolute inset-y-0 w-1/3" style={{ background: "linear-gradient(90deg,transparent,rgba(232,201,135,0.22),transparent)", animation: "sp-sweep 4.5s ease-in-out infinite" }} /></span>
                </span>
              </h2>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.5em] text-cyan-200/80">in the circle</p>
              <p className="mx-auto mt-8 max-w-xl text-sm sm:text-base leading-relaxed text-white/60">
                The year opens Friday, November 6, 2026 with Accelerators Networking. Founding placements for the first series are being shaped now — privately.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5">
                <a href={REQUEST_MAILTO} className="group relative overflow-hidden rounded-full px-9 py-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-white transition-transform duration-300 hover:scale-[1.03] bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-600 border border-cyan-300/50 shadow-[0_0_50px_-8px_rgba(52,211,153,0.8)]">
                  <span className="relative z-10 inline-flex items-center gap-2">Request the Prospectus <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                  <span aria-hidden className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </a>
                <a href={CALENDLY} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.03] px-8 py-4 text-sm font-medium hover:border-[#e8c987]/50 hover:text-[#e8c987] transition-all">
                  <CalendarDays className="h-4 w-4" /> Book a Private Conversation
                </a>
              </div>
              <p className="mt-8 flex items-center justify-center gap-2 font-mono text-[10px] tracking-[0.22em] uppercase text-emerald-100/35">
                <Lock className="h-3 w-3" /> Private offering · No public rate card · No obligation
              </p>
            </div>
          </div>

          <p className="mt-10 text-center text-xs text-emerald-100/30 flex items-center justify-center gap-2">
            <Lightbulb className="h-3.5 w-3.5" /> Startup Factory Hub sponsorship is a marketing partnership. It is not an investment offering.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Sponsorship;
