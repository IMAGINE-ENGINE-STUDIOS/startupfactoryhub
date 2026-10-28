import { useState } from "react";
import {
  ArrowRight, ArrowUpRight, Award, CalendarDays, Check, Eye, Globe,
  Handshake, Lightbulb, Lock, Mail, Megaphone, Network, Presentation,
  Rocket, Sparkles, Star, Users, Zap,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

/*
  THE SPONSOR CIRCLE — Private Offering
  Founder direction 2026-10-28: make the offering PRIVATE first, then modern /
  tech / elegant / dynamic / beautiful. No public prices, no public terms.
  Full tiers, pricing and inventory are shared only in the private prospectus,
  after a request to info@startupfactoryhub.com.
*/

const CALENDLY = "https://calendly.com/startupfactoryhub/30min";
const REQUEST_MAILTO =
  "mailto:info@startupfactoryhub.com?subject=" +
  encodeURIComponent("Private Sponsorship Prospectus — Request") +
  "&body=" +
  encodeURIComponent(
    "Hi Khalia,\n\nPlease send me the private Startup Factory Hub sponsorship prospectus.\n\nOrganization:\nName / Title:\nWhat we would like to reach (founders / accelerators / investors / space ecosystem):\nSeries or events of interest:\n\nThank you."
  );

type Tier = {
  id: string;
  name: string;
  icon: typeof Globe;
  tagline: string;
  essence: string;
  accent: string; // full static classes only
  dot: string;
  includes: string[];
};

const TIERS: Tier[] = [
  {
    id: "earthling",
    name: "EARTHLING",
    icon: Globe,
    tagline: "The entry into the Circle",
    essence:
      "For organizations beginning their presence inside the ecosystem — seen, listed, and welcomed into the room.",
    accent: "border-emerald-300/40 text-emerald-200",
    dot: "bg-emerald-300",
    includes: [
      "Recognition across SFH communications",
      "Logo placement in the Earthling tier on the SFH website",
      "Welcome moment on LinkedIn and in community updates",
      "Access to selected virtual accelerator events",
      "Offer perks, credits or tools directly to founders",
      "Listing in the platform and the Partner Resource Hub",
    ],
  },
  {
    id: "star",
    name: "STAR",
    icon: Star,
    tagline: "Presence with a voice",
    essence:
      "For organizations ready to be heard — elevated placement, a stage for your experts, and curated founder access.",
    accent: "border-amber-200/40 text-amber-100",
    dot: "bg-amber-200",
    includes: [
      "Elevated logo position and event recognition",
      "Monthly ecosystem spotlight in the SFH newsletter",
      "Host a workshop, AMA or technical talk",
      "Invitations to networking in New York, San Francisco, Orlando, Santiago and Tokyo",
      "Curated scouting reports and early deal-flow previews",
      "Feature interview inside the SFH Media Hub",
    ],
  },
  {
    id: "nebula",
    name: "NEBULA",
    icon: Sparkles,
    tagline: "Deep engagement, real pilots",
    essence:
      "For companies seeking integration — guaranteed speaking, structured matching, and pilots with cohort startups.",
    accent: "border-violet-300/40 text-violet-200",
    dot: "bg-violet-300",
    includes: [
      "Premium visibility across website, platform, cohorts and Demo Day",
      "Guaranteed speaking at a flagship SFH event",
      "Co-branded SFH x Sponsor campaign",
      "Full access to all global networking events",
      "Structured 1:1 startup matching sessions",
      "Run pilot programs with startups, with a dedicated sponsor resource page",
    ],
  },
  {
    id: "galaxy",
    name: "GALAXY",
    icon: Award,
    tagline: "The strategic partnership",
    essence:
      "The highest circle — premier placement everywhere, keynote voice, private dinners, and technology woven into the platform itself.",
    accent: "border-[#e8c987]/50 text-[#e8c987]",
    dot: "bg-[#e8c987]",
    includes: [
      "Premier placement across website, all major events, summits and PR",
      "Joint global PR announcement across SFH hubs",
      "Keynote-level speaking at the Global Summit and Demo Day",
      "Lead role in one innovation track",
      "Private investor-startup dinners and priority deal-flow introductions",
      "Dedicated Sponsor Pavilion and a custom founder-engagement analytics view",
    ],
  },
];

const SERIES = [
  { name: "Pitch Events", count: 24, cadence: "Twice monthly", note: "Founders on stage, investors in the room" },
  { name: "Decahedron Reverse Pitch", count: 12, cadence: "Monthly", note: "Investors pitch founders — the room reversed" },
  { name: "Accelerators Networking", count: 12, cadence: "Monthly", note: "Operators of accelerators, in one room" },
  { name: "Innovation Coffee Table", count: 12, cadence: "Monthly · one home", note: "The same table, the same city, every month" },
  { name: "Hot Deals in Space Industry", count: 6, cadence: "Every two months", note: "Space deals, curated and current" },
];

const PILLARS = [
  {
    icon: Eye,
    title: "Visibility, with taste",
    body: "Your brand across the platform, the events and the materials — placed elegantly, never pasted on.",
  },
  {
    icon: Presentation,
    title: "A voice in the room",
    body: "Keynotes, panels, workshops and fireside chats in front of founders who are actively building.",
  },
  {
    icon: Handshake,
    title: "Curated access",
    body: "Structured introductions, matching sessions and private dinners — not a logo wall and a hope.",
  },
  {
    icon: Zap,
    title: "Inside the platform",
    body: "Your tools, credits and pilots offered to founders at the exact moment in their journey when they need them.",
  },
];

const HUBS = ["New York", "San Francisco", "Orlando · HQ", "Santiago, Chile", "Tokyo, Japan"];
const MARQUEE = ["Pitch Events", "Reverse Pitch", "Innovation Coffee Table", "Accelerators Networking", "Hot Deals in Space", "Demo Day", "Global Summit"];

const Sponsorship = () => {
  const [active, setActive] = useState<Tier>(TIERS[3]);

  return (
    <div className="min-h-screen bg-[#04120c] text-[#ecfdf5] relative overflow-x-clip selection:bg-emerald-300/30">
      <style>{`
        @keyframes sp-drift { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(40px,-30px) scale(1.12); } }
        @keyframes sp-drift2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-50px,25px) scale(1.08); } }
        @keyframes sp-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes sp-rise { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes sp-shine { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .sp-rise { animation: sp-rise .9s cubic-bezier(.22,1,.36,1) both; }
        .sp-marquee-track { animation: sp-marquee 34s linear infinite; }
        .sp-shine { background-size: 200% auto; animation: sp-shine 7s ease infinite; }
        @media (prefers-reduced-motion: reduce) {
          .sp-rise, .sp-marquee-track, .sp-shine { animation: none !important; }
        }
      `}</style>

      {/* Ambient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[560px] w-[900px] rounded-full bg-emerald-500/14 blur-[140px]" style={{ animation: "sp-drift 14s ease-in-out infinite" }} />
        <div className="absolute top-[620px] -left-40 h-[420px] w-[420px] rounded-full bg-teal-400/10 blur-[120px]" style={{ animation: "sp-drift2 18s ease-in-out infinite" }} />
        <div className="absolute top-[1300px] -right-40 h-[460px] w-[460px] rounded-full bg-[#c9a96a]/8 blur-[130px]" style={{ animation: "sp-drift 20s ease-in-out infinite" }} />
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,#a7f3d0_1px,transparent_1px),linear-gradient(to_bottom,#a7f3d0_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(ellipse_75%_55%_at_50%_0%,black,transparent)]" />
      </div>

      <Navigation />

      <main className="relative z-10">
        {/* ── HERO · PRIVATE ─────────────────────────────── */}
        <section className="pt-32 sm:pt-40 pb-16 px-5 sm:px-8">
          <div className="max-w-5xl mx-auto text-center">
            <div className="sp-rise inline-flex items-center gap-2.5 rounded-full border border-[#e8c987]/35 bg-white/[0.03] backdrop-blur px-4 py-2">
              <Lock className="h-3.5 w-3.5 text-[#e8c987]" />
              <span className="font-mono text-[11px] tracking-[0.28em] uppercase text-[#e8c987]">Private Offering · By Invitation &amp; Request</span>
            </div>

            <h1 className="sp-rise mt-8 text-5xl sm:text-7xl lg:text-[86px] font-semibold leading-[0.98] tracking-tight" style={{ animationDelay: "0.08s" }}>
              The Sponsor
              <span className="block sp-shine bg-gradient-to-r from-emerald-200 via-[#e8c987] to-emerald-300 bg-clip-text text-transparent">Circle</span>
            </h1>

            <p className="sp-rise mt-7 text-lg sm:text-xl text-emerald-100/65 leading-relaxed max-w-2xl mx-auto" style={{ animationDelay: "0.16s" }}>
              A private partnership with Startup Factory Hub — an AI-powered venture builder
              and a year of rooms where founders, accelerators and investors actually meet.
            </p>

            <p className="sp-rise mt-5 font-mono text-[11px] tracking-[0.22em] uppercase text-emerald-100/40" style={{ animationDelay: "0.22s" }}>
              Terms are not published. They are shared, privately, in the prospectus.
            </p>

            <div className="sp-rise mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5" style={{ animationDelay: "0.28s" }}>
              <a href={REQUEST_MAILTO} className="group inline-flex items-center gap-2.5 rounded-full bg-emerald-300 text-[#04120c] font-semibold px-7 py-3.5 text-sm shadow-[0_0_44px_rgba(110,231,183,0.35)] hover:shadow-[0_0_60px_rgba(110,231,183,0.55)] hover:-translate-y-0.5 transition-all duration-300">
                <Mail className="h-4 w-4" />
                Request the Private Prospectus
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a href={CALENDLY} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.03] backdrop-blur px-7 py-3.5 text-sm font-medium text-emerald-50 hover:border-[#e8c987]/50 hover:text-[#e8c987] transition-all duration-300">
                <CalendarDays className="h-4 w-4" />
                Book a Private Conversation
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="sp-rise max-w-5xl mx-auto mt-16 grid grid-cols-2 lg:grid-cols-4 rounded-3xl border border-white/10 bg-white/[0.025] backdrop-blur-xl overflow-hidden" style={{ animationDelay: "0.36s" }}>
            {[
              { v: "66", l: "Events · Nov 2026 – Oct 2027" },
              { v: "270+", l: "Founders & members on platform" },
              { v: "50+", l: "Strategic partners" },
              { v: "5", l: "Global hubs" },
            ].map((s, i) => (
              <div key={s.l} className={`px-6 py-7 text-center ${i > 0 ? "border-l border-white/[0.07]" : ""} ${i >= 2 ? "max-lg:border-t max-lg:border-white/[0.07]" : ""} ${i === 2 ? "max-lg:border-l-0" : ""}`}>
                <div className="text-4xl font-semibold tracking-tight text-white">{s.v}</div>
                <div className="mt-1.5 text-[11px] font-mono tracking-[0.14em] uppercase text-emerald-100/45">{s.l}</div>
              </div>
            ))}
          </div>
          <p className="text-center mt-5 text-xs text-emerald-100/35">Featured at Nasdaq Tower, Times Square — twice in 2025 · Used by NASA KSC Tech Transfer, UK Space Agency &amp; APEX Accelerators</p>
        </section>

        {/* ── MARQUEE ────────────────────────────────────── */}
        <div aria-hidden className="relative border-y border-white/[0.07] bg-white/[0.015] py-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <div className="sp-marquee-track flex w-max items-center gap-10 pr-10">
            {[...MARQUEE, ...MARQUEE].map((m, i) => (
              <span key={i} className="flex items-center gap-10 whitespace-nowrap font-mono text-xs tracking-[0.3em] uppercase text-emerald-100/45">
                {m} <Sparkles className="h-3.5 w-3.5 text-[#e8c987]/70" />
              </span>
            ))}
          </div>
        </div>

        {/* ── WHY PRIVATE ────────────────────────────────── */}
        <section className="px-5 sm:px-8 py-24">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.4fr] gap-12 items-start">
            <div>
              <p className="font-mono text-[11px] tracking-[0.28em] uppercase text-[#e8c987]">Why private</p>
              <h2 className="mt-4 text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.05]">Sponsorship here is curated, not sold off a rate card.</h2>
              <p className="mt-5 text-emerald-100/60 leading-relaxed">
                Every circle placement is matched to what a sponsor actually wants to reach —
                founders, accelerator operators, investors, or the space ecosystem — and no two
                sponsors in the same circle compete for the same room. That only works privately.
              </p>
              <div className="mt-7 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.025] px-5 py-4">
                <Lock className="h-5 w-5 text-[#e8c987] shrink-0" />
                <p className="text-sm text-emerald-100/70">Pricing, inventory and exclusivity live only in the private prospectus. Nothing is published, nothing is auctioned.</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {PILLARS.map((p, i) => (
                <div key={p.title} className="group rounded-3xl border border-white/[0.09] bg-gradient-to-b from-white/[0.045] to-white/[0.015] p-7 hover:border-emerald-300/35 hover:-translate-y-1 hover:shadow-[0_24px_50px_-24px_rgba(52,211,153,0.35)] transition-all duration-500" style={{ transitionDelay: `${i * 20}ms` }}>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-300/10 border border-emerald-300/20 group-hover:scale-110 transition-transform duration-500">
                    <p.icon className="h-5 w-5 text-emerald-200" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-white">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-emerald-100/55">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── THE CIRCLES · PRIVATE TIERS ────────────────── */}
        <section className="px-5 sm:px-8 py-10 pb-24">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto">
              <p className="font-mono text-[11px] tracking-[0.28em] uppercase text-[#e8c987]">The Four Circles</p>
              <h2 className="mt-4 text-3xl sm:text-5xl font-semibold tracking-tight">Choose your altitude</h2>
              <p className="mt-4 text-emerald-100/55">Select a circle to preview its experience. Full terms arrive privately.</p>
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-2.5" role="tablist" aria-label="Sponsor circles">
              {TIERS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={active.id === t.id}
                  onClick={() => setActive(t)}
                  className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
                    active.id === t.id
                      ? "bg-emerald-300 text-[#04120c] border-emerald-300 shadow-[0_0_32px_rgba(110,231,183,0.35)]"
                      : "border-white/12 bg-white/[0.03] text-emerald-100/70 hover:border-emerald-300/40 hover:text-white"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${active.id === t.id ? "bg-[#04120c]" : t.dot}`} />
                  {t.name}
                </button>
              ))}
            </div>

            <div key={active.id} className="sp-rise mt-6 rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.015] backdrop-blur-xl overflow-hidden">
              <div className="grid lg:grid-cols-[1fr_1.35fr]">
                <div className="p-8 sm:p-12 border-b lg:border-b-0 lg:border-r border-white/[0.08]">
                  <div className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 ${active.accent}`}>
                    <active.icon className="h-4 w-4" />
                    <span className="font-mono text-[11px] tracking-[0.24em]">{active.name}</span>
                  </div>
                  <h3 className="mt-6 text-3xl font-semibold text-white tracking-tight">{active.tagline}</h3>
                  <p className="mt-4 text-emerald-100/60 leading-relaxed">{active.essence}</p>
                  <div className="mt-8 flex items-center gap-3 rounded-2xl bg-black/25 border border-white/[0.07] px-5 py-4">
                    <Lock className="h-5 w-5 text-[#e8c987] shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-white">Private terms</p>
                      <p className="text-xs text-emerald-100/50 mt-0.5">Investment, inventory &amp; exclusivity — in the prospectus only.</p>
                    </div>
                  </div>
                  <a href={REQUEST_MAILTO} className="group mt-7 inline-flex items-center gap-2 text-sm font-semibold text-emerald-200 hover:text-emerald-100">
                    Request this circle, privately
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </div>
                <ul className="p-8 sm:p-12 grid sm:grid-cols-2 gap-x-8 gap-y-4 content-start">
                  {active.includes.map((inc) => (
                    <li key={inc} className="flex gap-3 text-sm leading-relaxed text-emerald-50/85">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-300/12 border border-emerald-300/25">
                        <Check className="h-3 w-3 text-emerald-200" />
                      </span>
                      {inc}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── THE YEAR · 66 EVENTS ───────────────────────── */}
        <section className="px-5 sm:px-8 py-24 border-t border-white/[0.06] bg-white/[0.012]">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="font-mono text-[11px] tracking-[0.28em] uppercase text-[#e8c987]">The Year Ahead</p>
                <h2 className="mt-4 text-3xl sm:text-5xl font-semibold tracking-tight">66 rooms. One circle.</h2>
              </div>
              <p className="text-sm text-emerald-100/50 max-w-xs leading-relaxed">November 2026 — October 2027. Sponsors may take a full series, a single room, or the whole year.</p>
            </div>
            <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SERIES.map((s) => (
                <div key={s.name} className="group rounded-3xl border border-white/[0.09] bg-[#061a11]/80 p-7 hover:border-[#e8c987]/35 hover:-translate-y-1 transition-all duration-500">
                  <div className="flex items-baseline justify-between">
                    <span className="text-5xl font-semibold tracking-tight text-white group-hover:text-emerald-200 transition-colors">{s.count}</span>
                    <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-emerald-100/40">{s.cadence}</span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-white leading-snug">{s.name}</h3>
                  <p className="mt-1.5 text-sm text-emerald-100/50 leading-relaxed">{s.note}</p>
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
                <span key={h} className="flex items-center gap-2 text-sm text-emerald-100/60">
                  <Globe className="h-3.5 w-3.5 text-emerald-300/70" /> {h}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS · PRIVATE PROCESS ─────────────── */}
        <section className="px-5 sm:px-8 py-24">
          <div className="max-w-6xl mx-auto">
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

            {/* Final private CTA */}
            <div className="relative mt-16 rounded-[32px] overflow-hidden border border-[#e8c987]/25 bg-gradient-to-br from-emerald-400/[0.10] via-white/[0.02] to-[#c9a96a]/[0.08] px-7 py-14 sm:p-16 text-center">
              <div aria-hidden className="absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-[520px] rounded-full bg-emerald-300/15 blur-[90px]" />
              <Megaphone className="relative mx-auto h-6 w-6 text-[#e8c987]" />
              <h2 className="relative mt-5 text-3xl sm:text-5xl font-semibold tracking-tight text-white">The next room is already<br className="hidden sm:block" /> on the calendar.</h2>
              <p className="relative mt-4 text-emerald-100/60 max-w-xl mx-auto leading-relaxed">The year opens Friday, November 6, 2026. Founding placements for the first series are being shaped now — privately.</p>
              <div className="relative mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5">
                <a href={REQUEST_MAILTO} className="group inline-flex items-center gap-2.5 rounded-full bg-white text-[#04120c] font-semibold px-7 py-3.5 text-sm hover:-translate-y-0.5 hover:shadow-[0_18px_44px_-14px_rgba(255,255,255,0.45)] transition-all duration-300">
                  Request the Private Prospectus <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
                <a href="mailto:info@startupfactoryhub.com" className="inline-flex items-center gap-2 text-sm text-emerald-100/75 hover:text-white transition-colors">
                  <Mail className="h-4 w-4" /> info@startupfactoryhub.com
                </a>
              </div>
              <p className="relative mt-7 flex items-center justify-center gap-2 font-mono text-[10px] tracking-[0.22em] uppercase text-emerald-100/35">
                <Lock className="h-3 w-3" /> Private offering · No public rate card · No obligation
              </p>
            </div>

            <p className="mt-10 text-center text-xs text-emerald-100/30 flex items-center justify-center gap-2">
              <Lightbulb className="h-3.5 w-3.5" /> Startup Factory Hub sponsorship is a marketing partnership. It is not an investment offering.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Sponsorship;
