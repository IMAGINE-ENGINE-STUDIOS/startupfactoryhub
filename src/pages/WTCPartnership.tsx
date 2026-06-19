import { useEffect, useRef, useState } from "react";
import sfhLogo from "@/assets/sfh-logo-combined.png";
import sfhEmblem from "@/assets/sfh-logo-emblem.png";
import heroBg from "@/assets/event-launching-orlando.jpg";
import nasdaqFeature from "@/assets/nasdaq-feature.jpg";
import coworkingSpace from "@/assets/coworking-space.jpg";
import dashboardMockup from "@/assets/mockup-dashboard.png";
import conferenceHall from "@/assets/conference-hall-bg.webp";
import WebGLBackground from "@/components/WebGLBackground";



import {
  Globe2,
  Building2,
  Handshake,
  Rocket,
  Target,
  Sparkles,
  TrendingUp,
  Users,
  Briefcase,
  ArrowRight,
  ShieldCheck,
  Network,
  GraduationCap,
  Lightbulb,
  MapPin,
  Mail,
  ChevronDown,
  ChevronLeft,
  ChevronRight,

  Scan,
  Box,
  Smartphone,
  Eye,
  Layers,
  QrCode,
  Cpu,
  Wand2,
  Award,
  DollarSign,
  BarChart3,
  Trophy,
} from "lucide-react";


/**
 * /wtcpartnership — Confidential joint venture brochure for
 * the World Trade Center Club Orlando × Startup Factory Hub.
 *
 * Design system: editorial dark, refined serif display, mono kicker
 * accents, Startup Factory Hub emerald (#10E1A0) on tech-dark (#0A0F14).
 */

const ACCENT = "#10E1A0"; // Startup Factory Hub emerald
const ACCENT_GLOW = "#22D3EE"; // cyan neon accent
const NAV = "#0A0F14"; // tech-dark background (matches app)


const Kicker = ({ children }: { children: React.ReactNode }) => (
  <div
    className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.32em]"
    style={{ color: ACCENT }}
  >
    <span className="block h-px w-8" style={{ background: ACCENT }} />
    {children}
  </div>
);

const SectionTitle = ({
  kicker,
  title,
  lead,
}: {
  kicker: string;
  title: string;
  lead?: string;
}) => (
  <div className="max-w-3xl">
    <Kicker>{kicker}</Kicker>
    <h2
      className="mt-5 text-4xl md:text-5xl font-light leading-[1.05] tracking-tight text-white"
      style={{ fontFamily: '"Sora", "Manrope", sans-serif' }}
    >
      {title}
    </h2>
    {lead && (
      <p className="mt-5 text-base md:text-lg leading-relaxed text-white/65 font-light">
        {lead}
      </p>
    )}
  </div>
);

const HairlineCard = ({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-[0_8px_40px_-12px_rgba(16,225,160,0.15)] p-7 transition-all duration-500 hover:border-[color:var(--accent)] hover:bg-white/[0.04]"
       style={{ ['--accent' as any]: ACCENT }}>
    <div
      className="absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      style={{ background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)` }}
    />
    <Icon className="h-5 w-5" style={{ color: ACCENT }} />
    <h3 className="mt-5 text-lg font-medium tracking-tight text-white">{title}</h3>
    <div className="mt-3 text-sm leading-relaxed text-white/60 font-light">{children}</div>
  </div>
);

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <li className="flex gap-3 text-[15px] leading-relaxed text-white/70 font-light">
    <span
      className="mt-[10px] block h-[5px] w-[5px] shrink-0 rotate-45"
      style={{ background: ACCENT }}
    />
    <span>{children}</span>
  </li>
);

const TOTAL_SLIDES = 14;

const WTCPartnership = () => {
  const scrollerRef = useRef<HTMLElement | null>(null);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    document.title = "Joint Venture Proposal — WTC Orlando × Startup Factory Hub";
  }, []);

  const goTo = (idx: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(TOTAL_SLIDES - 1, idx));
    el.scrollTo({ left: clamped * window.innerWidth, behavior: "smooth" });
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const w = window.innerWidth || 1;
      setSlide(Math.round(el.scrollLeft / w));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") goTo(slide + 1);
      if (e.key === "ArrowLeft" || e.key === "PageUp") goTo(slide - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slide]);

  return (
    <div
      className="wtc-deck relative h-screen w-screen antialiased overflow-hidden"
      style={{
        background: `radial-gradient(1200px 600px at 80% -10%, ${ACCENT}14, transparent 60%), radial-gradient(900px 500px at -10% 30%, ${ACCENT_GLOW}10, transparent 60%), ${NAV}`,
        fontFamily:
          '"Manrope", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: "#D8DCE0",
      }}
    >
      {/* Slide-panel styles */}
      <style>{`
        .slide-panel { width: 100vw; height: 100vh; flex: 0 0 100vw; scroll-snap-align: center; overflow-y: auto; overflow-x: hidden; }
        .slide-panel::-webkit-scrollbar { width: 6px; }
        .slide-panel::-webkit-scrollbar-thumb { background: ${ACCENT}33; border-radius: 4px; }
        .horizontal-deck { scroll-snap-type: x mandatory; scroll-behavior: smooth; }
        .horizontal-deck::-webkit-scrollbar { display: none; }
        /* Dimmer "white" across the presentation */
        .wtc-deck .text-white { color: #D8DCE0 !important; }
        /* Scale all slide content by ~20% */
        .wtc-deck .slide-panel > * { font-size: 1.2em; }
      `}</style>
      {/* 3D Planet background — same as main app */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-60 mix-blend-screen">
        <WebGLBackground />
      </div>

      {/* Ambient neon orbs */}
      <div
        className="pointer-events-none fixed -top-40 -right-40 h-[500px] w-[500px] rounded-full opacity-25 blur-[120px]"
        style={{ background: ACCENT }}
      />
      <div
        className="pointer-events-none fixed bottom-0 -left-40 h-[600px] w-[600px] rounded-full opacity-15 blur-[140px]"
        style={{ background: ACCENT_GLOW }}
      />


      {/* Horizontal slide deck */}
      <main
        ref={scrollerRef as any}
        className="horizontal-deck relative z-10 flex h-screen w-screen overflow-x-auto overflow-y-hidden"
      >


      {/* Hero */}
      <section className="slide-panel relative flex flex-col justify-center overflow-hidden px-6 pt-12 md:px-12">
        {/* Hero background image */}
        <div className="pointer-events-none absolute inset-0">
          <img
            src={heroBg}
            alt="Orlando innovation community event"
            className="h-full w-full object-cover opacity-25"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(90deg, ${NAV} 0%, ${NAV}CC 45%, ${NAV}66 100%)`,
            }}
          />
        </div>
        {/* ornamental grid */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]">

          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(${ACCENT} 1px, transparent 1px), linear-gradient(90deg, ${ACCENT} 1px, transparent 1px)`,
              backgroundSize: "80px 80px",
            }}
          />
        </div>
        {/* radial glow */}
        <div
          className="pointer-events-none absolute -top-40 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
          style={{ background: `radial-gradient(circle, ${ACCENT} 0%, transparent 60%)` }}
        />

        <div className="relative mx-auto w-full max-w-7xl">
          <Kicker>Confidential · Joint Venture Proposal · June 2026</Kicker>

          {/* Co-branding lockup */}
          <div className="mt-5 flex items-center gap-6 md:gap-8">
            <img
              src={sfhLogo}
              alt="Startup Factory Hub"
              className="h-14 md:h-16 object-contain drop-shadow-[0_0_30px_rgba(201,162,74,0.35)]"
            />
            <div className="h-10 w-px md:h-12" style={{ background: `${ACCENT}55` }} />
            <div>
              <div className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.32em] text-white/45">
                In partnership with
              </div>
              <div
                className="mt-1 text-xl md:text-2xl font-light leading-tight text-white"
                style={{ fontFamily: '"Sora", "Manrope", sans-serif' }}
              >
                World Trade Center <span style={{ color: ACCENT }}>Club Orlando</span>
              </div>
            </div>
          </div>


          <h1
            className="mt-4 text-4xl md:text-6xl lg:text-[72px] font-light leading-[1.05] tracking-[-0.02em] text-white"
            style={{ fontFamily: '"Sora", "Manrope", sans-serif' }}
          >
            World Trade Center
            <br />
            <span className="italic" style={{ color: ACCENT }}>
              Innovation Hub
            </span>
            <br />
            <span className="text-2xl md:text-3xl lg:text-4xl text-white/60 font-light not-italic">
              powered by Startup Factory Hub
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/65 font-light">
            A strategic joint venture establishing Orlando's premier destination for
            entrepreneurship, innovation, international trade, investment, and
            corporate collaboration.
          </p>


          {/* Prepared for */}
          <div className="mt-8 grid max-w-4xl gap-6 md:grid-cols-2">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
                Prepared for
              </div>
              <div
                className="mt-2 text-xl font-light text-white"
                style={{ fontFamily: '"Sora", "Manrope", sans-serif' }}
              >
                Leadership of the World Trade Center Club Orlando
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
                Prepared by
              </div>
              <div
                className="mt-2 text-xl font-light text-white"
                style={{ fontFamily: '"Sora", "Manrope", sans-serif' }}
              >
                Startup Factory Hub Accelerator
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3 text-white/40">
            <ChevronDown className="h-4 w-4 animate-bounce" />
            <span className="font-mono text-[10px] uppercase tracking-[0.28em]">
              Scroll
            </span>
          </div>
        </div>
      </section>


      {/* Executive Summary */}
      <section id="proposal" className="slide-panel relative overflow-hidden">
        {/* Magazine image — fills right side top-to-bottom */}
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-full md:block md:w-[42%] lg:w-[40%]">
          <img
            src={conferenceHall}
            alt="Innovation hub event space"
            className="h-full w-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to right, ${NAV} 0%, ${NAV}CC 40%, transparent 85%), ${ACCENT}08`,
            }}
          />
        </div>

        <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col px-6 md:px-12">
          <div className="relative mt-12 grid h-full flex-1 grid-cols-1 items-start gap-12 pb-12 md:grid-cols-12">
            <div className="space-y-6 text-base leading-relaxed text-white/90 md:col-span-6 lg:col-span-6">
              <div>
                <SectionTitle
                  kicker="01 · Executive Summary"
                  title="A first-of-its-kind innovation destination for Central Florida."
                />
              </div>

              <p className="font-normal">
                Startup Factory Hub Accelerator respectfully proposes the formation
                of a strategic Joint Venture with the World Trade Center Club
                Orlando to create the{" "}
                <span className="font-medium text-white">
                  World Trade Center Innovation Hub powered by Startup Factory Hub
                </span>
                —a premier destination for entrepreneurship, innovation,
                international trade, investment, and corporate collaboration.
              </p>
              <p className="font-normal">
                The Joint Venture will establish a globally connected innovation
                ecosystem designed to accelerate startup growth, foster corporate
                innovation, attract investment, facilitate international business
                expansion, and generate measurable economic impact across the
                region.
              </p>
              <p className="font-normal">
                By combining the prestige and global reach of the World Trade
                Center with the accelerator capabilities of Startup Factory Hub,
                the partnership creates a first-of-its-kind platform where
                founders, corporations, investors, universities, government, and
                international organizations converge.
              </p>

              {/* Quote moved off the image for readability */}
              <div className="mt-10 border-l-2 pl-6" style={{ borderColor: ACCENT }}>
                <Sparkles className="h-5 w-5" style={{ color: ACCENT }} />
                <p
                  className="mt-4 text-xl font-light italic leading-snug text-white md:text-2xl"
                  style={{ fontFamily: '"Sora", "Manrope", sans-serif' }}
                >
                  "Orlando's flagship center for innovation and global commerce."
                </p>
                <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.28em] text-white/60">
                  The Innovation Hub
                </div>
              </div>
            </div>

            {/* Mobile-only image card — never overlaps desktop text */}
            <aside className="md:col-span-6 md:hidden lg:hidden">
              <div
                className="relative flex h-full min-h-[360px] flex-col justify-end overflow-hidden rounded-sm border"
                style={{ borderColor: `${ACCENT}40` }}
              >
                <img
                  src={conferenceHall}
                  alt="Innovation hub event space"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(to top, ${NAV}F2 0%, ${NAV}AA 40%, transparent 70%), ${ACCENT}10`,
                  }}
                />
                <div className="relative z-10 p-8">
                  <Sparkles className="h-5 w-5" style={{ color: ACCENT }} />
                  <p
                    className="mt-6 text-2xl font-light italic leading-snug text-white"
                    style={{ fontFamily: '"Sora", "Manrope", sans-serif' }}
                  >
                    "Orlando's flagship center for innovation and global commerce."
                  </p>
                  <div className="mt-8 font-mono text-[10px] uppercase tracking-[0.28em] text-white/50">
                    The Innovation Hub
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Strategic Partnership Overview */}
      <section className="slide-panel border-t border-white/5 px-6 py-12 md:px-12">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            kicker="02 · Strategic Partnership Overview"
            title="A transformative public-private innovation platform."
          />
          <div className="mt-12 grid gap-12 md:grid-cols-12">
            <div className="md:col-span-7 space-y-6 text-base leading-relaxed text-white/70 font-light">
              <p>
                The World Trade Center Club Orlando and Startup Factory Hub
                Accelerator have a unique opportunity to establish a
                transformative public-private innovation platform that positions
                Orlando as a leading destination for entrepreneurship, global
                commerce, investment, and corporate innovation.
              </p>
              <p>
                Rather than a traditional service-provider relationship, this
                initiative is envisioned as a strategic{" "}
                <span className="text-white">Joint Venture</span> in which both
                organizations contribute complementary assets, capabilities,
                networks, and expertise to co-create a world-class innovation
                ecosystem.
              </p>
              <p>
                The proposed{" "}
                <span className="text-white">
                  World Trade Center Innovation Hub powered by Startup Factory Hub
                </span>{" "}
                will operate as a shared platform designed to generate long-term
                value for both organizations while advancing regional economic
                development and strengthening Orlando's global competitiveness.
              </p>
            </div>
            <aside className="md:col-span-5">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-[0_8px_40px_-12px_rgba(16,225,160,0.15)] p-8">
                <Globe2 className="h-5 w-5" style={{ color: ACCENT }} />
                <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
                  Founding Partners
                </div>
                <ul className="mt-6 space-y-4">
                  <li className="flex items-start gap-3 text-[15px] leading-relaxed text-white/80 font-light">
                    <span
                      className="mt-[10px] block h-[5px] w-[5px] shrink-0 rotate-45"
                      style={{ background: ACCENT }}
                    />
                    World Trade Center Club Orlando — global brand, executive
                    community, international relationships, physical headquarters,
                    and WTC network access.
                  </li>
                  <li className="flex items-start gap-3 text-[15px] leading-relaxed text-white/80 font-light">
                    <span
                      className="mt-[10px] block h-[5px] w-[5px] shrink-0 rotate-45"
                      style={{ background: ACCENT }}
                    />
                    Startup Factory Hub — innovation platform, accelerator
                    operations, entrepreneurial ecosystem, corporate innovation
                    capabilities, investor and mentor networks, educational
                    programming, and ecosystem activation expertise.
                  </li>
                </ul>
              </div>
            </aside>
          </div>

          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Entrepreneurship", body: "Orlando's center for startup growth" },
              { label: "Gateway", body: "International companies entering the U.S." },
              { label: "Corporate", body: "Industry collaboration & innovation" },
              { label: "Capital", body: "Investor deal flow & venture formation" },
            ].map(({ label, body }) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-[0_8px_40px_-12px_rgba(16,225,160,0.15)] p-6 transition-all duration-500 hover:border-[color:var(--accent)] hover:bg-white/[0.04]"
                style={{ ['--accent' as any]: ACCENT }}
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
                  {label}
                </div>
                <div className="mt-3 text-[15px] leading-snug text-white/80 font-light">
                  {body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founding Partner Principles */}
      <section className="slide-panel border-t border-white/5 bg-white/[0.015] px-6 py-12 md:px-12">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            kicker="03 · Founding Partner Principles"
            title="Guided by shared commitment. Built for long-term impact."
          />

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Handshake,
                title: "Equal Strategic Partnership",
                body: "Both organizations participate as equal strategic partners committed to the long-term success and growth of the Innovation Hub.",
              },
              {
                icon: Users,
                title: "Shared Governance",
                body: "Strategic decisions are made jointly through an agreed governance structure designed to ensure alignment, accountability, and sustainable growth.",
              },
              {
                icon: TrendingUp,
                title: "Shared Value Creation",
                body: "Both organizations participate in the economic and strategic value created through the Joint Venture.",
              },
              {
                icon: Lightbulb,
                title: "Complementary Contributions",
                body: "Each partner contributes unique and complementary capabilities that, when combined, create substantially greater value than either could achieve independently.",
              },
              {
                icon: Building2,
                title: "Long-Term Institutional Development",
                body: "The objective is to build a permanent innovation institution and economic development platform serving Central Florida and the global business community.",
              },
            ].map(({ icon: Icon, title, body }, idx) => (
              <div
                key={title}
                className="group relative overflow-hidden rounded-2xl p-[1px] transition-all duration-500 hover:-translate-y-1"
                style={{
                  background: `linear-gradient(140deg, ${ACCENT}55 0%, rgba(255,255,255,0.08) 35%, rgba(255,255,255,0.02) 65%, ${ACCENT}30 100%)`,
                }}
              >
                {/* glow */}
                <div
                  className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-60"
                  style={{ background: `radial-gradient(circle, ${ACCENT}, transparent 70%)` }}
                />
                <div className="relative h-full rounded-2xl bg-[#0b1118]/95 p-7 backdrop-blur-xl">
                  {/* grid pattern */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-[0.05] transition-opacity duration-500 group-hover:opacity-[0.12]"
                    style={{
                      backgroundImage: `linear-gradient(${ACCENT} 1px, transparent 1px), linear-gradient(90deg, ${ACCENT} 1px, transparent 1px)`,
                      backgroundSize: "28px 28px",
                      maskImage: "radial-gradient(circle at top right, black, transparent 70%)",
                      WebkitMaskImage: "radial-gradient(circle at top right, black, transparent 70%)",
                    }}
                  />
                  {/* corner brackets */}
                  <span
                    className="absolute left-3 top-3 h-3 w-3 border-l border-t transition-all duration-500 group-hover:h-5 group-hover:w-5"
                    style={{ borderColor: ACCENT }}
                  />
                  <span
                    className="absolute right-3 bottom-3 h-3 w-3 border-r border-b transition-all duration-500 group-hover:h-5 group-hover:w-5"
                    style={{ borderColor: ACCENT }}
                  />

                  <div className="relative flex items-start justify-between">
                    <div
                      className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 transition-all duration-500 group-hover:border-[color:var(--accent)]"
                      style={{
                        ['--accent' as any]: ACCENT,
                        background: `linear-gradient(135deg, ${ACCENT}25, transparent)`,
                      }}
                    >
                      <Icon className="h-5 w-5" style={{ color: ACCENT }} />
                      <span
                        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                        style={{ boxShadow: `0 0 24px ${ACCENT}55, inset 0 0 12px ${ACCENT}30` }}
                      />
                    </div>
                    <span
                      className="font-mono text-[11px] tracking-[0.2em] text-white/30"
                      style={{ fontFamily: '"JetBrains Mono", monospace' }}
                    >
                      P/{String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <div
                    className="mt-6 h-px w-10 transition-all duration-500 group-hover:w-24"
                    style={{ background: `linear-gradient(90deg, ${ACCENT}, transparent)` }}
                  />

                  <h3 className="mt-5 text-lg font-medium leading-snug tracking-tight text-white">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed font-light text-white/65">
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Strategic Rationale */}
      <section className="slide-panel border-t border-white/5 px-6 py-12 md:px-12">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            kicker="04 · Strategic Rationale"
            title="Orlando has the growth. It needs the convergence."
            lead="Global competitiveness depends on innovation ecosystems that connect entrepreneurs, capital, corporations, talent, and international markets. Orlando lacks a centralized destination integrating these stakeholders within one globally connected platform."
          />

          <div className="mt-16 grid gap-px border border-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Rocket, title: "Startup creation & acceleration" },
              { icon: Building2, title: "Corporate innovation & adoption" },
              { icon: TrendingUp, title: "Venture capital formation" },
              { icon: Globe2, title: "International trade expansion" },
              { icon: Users, title: "Economic development & jobs" },
              { icon: Network, title: "Academic & government collaboration" },
            ].map(({ icon: Icon, title }) => (
              <div key={title} className="bg-white/[0.02] p-8">
                <Icon className="h-5 w-5" style={{ color: ACCENT }} />
                <h3 className="mt-5 text-lg font-medium tracking-tight text-white">
                  {title}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision / Mission */}
      <section className="slide-panel relative overflow-hidden border-t border-white/5 px-6 py-12 md:px-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 20%, ${ACCENT}, transparent 40%), radial-gradient(circle at 80% 80%, ${ACCENT}, transparent 40%)`,
          }}
        />
        <div className="relative mx-auto grid max-w-7xl gap-16 md:grid-cols-2">
          <div>
            <Kicker>05 · Vision</Kicker>
            <p
              className="mt-6 text-3xl md:text-4xl font-light leading-tight text-white"
              style={{ fontFamily: '"Sora", "Manrope", sans-serif' }}
            >
              To establish Orlando as a{" "}
              <span className="italic" style={{ color: ACCENT }}>
                globally recognized center
              </span>{" "}
              for entrepreneurship, innovation, international business,
              investment, and economic development.
            </p>
          </div>
          <div>
            <Kicker>06 · Mission</Kicker>
            <p
              className="mt-6 text-3xl md:text-4xl font-light leading-tight text-white"
              style={{ fontFamily: '"Sora", "Manrope", sans-serif' }}
            >
              To build a world-class ecosystem that empowers founders,
              corporations, investors, and international organizations to{" "}
              <span className="italic" style={{ color: ACCENT }}>
                connect, collaborate, and grow.
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* JV Structure */}
      <section className="slide-panel border-t border-white/5 bg-white/[0.015] px-6 py-12 md:px-12">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            kicker="07 · Joint Venture Structure"
            title="An equal strategic partnership."
            lead="A dedicated operating entity shall be established to develop, manage, and expand the Innovation Hub, its programs, partnerships, and revenue opportunities."
          />

          <div className="mt-14 overflow-hidden rounded-sm border border-white/10">
            <div className="grid md:grid-cols-2">
              <div
                className="relative border-b border-white/10 p-10 md:border-b-0 md:border-r"
                style={{ background: `${ACCENT}06` }}
              >
                <Building2 className="h-6 w-6" style={{ color: ACCENT }} />
                <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
                  Partner
                </div>
                <div
                  className="mt-2 text-2xl font-light text-white"
                  style={{ fontFamily: '"Sora", "Manrope", sans-serif' }}
                >
                  World Trade Center Club Orlando
                </div>
                <div
                  className="mt-8 text-6xl font-light"
                  style={{
                    color: ACCENT,
                    fontFamily: '"Sora", "Manrope", sans-serif',
                  }}
                >
                  50%
                </div>
                <div className="mt-2 text-sm text-white/55">Ownership Interest</div>
              </div>
              <div className="relative p-10">
                <Rocket className="h-6 w-6" style={{ color: ACCENT }} />
                <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
                  Partner
                </div>
                <div
                  className="mt-2 text-2xl font-light text-white"
                  style={{ fontFamily: '"Sora", "Manrope", sans-serif' }}
                >
                  Startup Factory Hub Accelerator
                </div>
                <div
                  className="mt-8 text-6xl font-light"
                  style={{
                    color: ACCENT,
                    fontFamily: '"Sora", "Manrope", sans-serif',
                  }}
                >
                  50%
                </div>
                <div className="mt-2 text-sm text-white/55">Ownership Interest</div>
              </div>
            </div>
            <div className="border-t border-white/10 bg-black/20 p-6 text-center text-sm text-white/55 font-light">
              Reflecting the complementary strategic assets, capabilities, and
              long-term commitments contributed by each organization.
            </div>
          </div>
        </div>
      </section>

      {/* Strategic Contributions */}
      <section className="slide-panel border-t border-white/5 px-6 py-12 md:px-12">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            kicker="08 · Strategic Contributions"
            title="Two organizations. Complementary strengths."
          />

          <div className="mt-14 grid gap-8 lg:grid-cols-2">
            {[
              {
                org: "World Trade Center Club Orlando",
                tag: "Institutional · Physical · International",
                icon: Globe2,
                code: "WTC",
                items: [
                  { icon: Building2, label: "Premium HQ & Innovation Facilities" },
                  { icon: Briefcase, label: "Executive Meeting & Event Spaces" },
                  { icon: Network, label: "WTC Global Network Access" },
                  { icon: Handshake, label: "International Trade Relationships" },
                  { icon: Users, label: "Corporate Membership Ecosystem" },
                  { icon: ShieldCheck, label: "Government & Institutional Relations" },
                  { icon: Award, label: "Global Brand & Market Credibility" },
                  { icon: MapPin, label: "International Delegation Pipeline" },
                ],
              },
              {
                org: "Startup Factory Hub Accelerator",
                tag: "Entrepreneurial · Platform · Ecosystem",
                icon: Rocket,
                code: "SFH",
                items: [
                  { icon: Rocket, label: "Accelerator & Incubation Operations" },
                  { icon: Target, label: "Startup Recruitment & Portfolio Mgmt" },
                  { icon: GraduationCap, label: "Mentor & Advisor Network" },
                  { icon: DollarSign, label: "Investor & Venture Capital Relations" },
                  { icon: Lightbulb, label: "Corporate Innovation Programs" },
                  { icon: BarChart3, label: "Educational & Executive Programming" },
                  { icon: Network, label: "Ecosystem Activation & Community" },
                  { icon: Globe2, label: "International Entrepreneurship Partners" },
                  { icon: TrendingUp, label: "Marketing, Branding & Growth" },
                  { icon: Cpu, label: "Proprietary Digital Accelerator Platform" },
                  { icon: Users, label: "Founder Engagement & Networking" },
                  { icon: Handshake, label: "Strategic Partnership Development" },
                ],
              },
            ].map((card, ci) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.code}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 p-px transition-all duration-500 hover:border-white/20"
                  style={{
                    boxShadow: `0 20px 80px -30px ${ACCENT}40, inset 0 1px 0 0 rgba(255,255,255,0.06)`,
                  }}
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                    style={{
                      background: `conic-gradient(from ${ci * 180}deg at 50% 50%, ${ACCENT}00, ${ACCENT}55, ${ACCENT_GLOW}00, ${ACCENT}55, ${ACCENT}00)`,
                      filter: "blur(24px)",
                    }}
                  />
                  <div className="relative rounded-[15px] bg-[#0a0e14]/95 backdrop-blur-xl">
                    <div className="relative overflow-hidden border-b border-white/5 p-8">
                      <div
                        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-30 blur-3xl"
                        style={{ background: `radial-gradient(circle, ${ACCENT}, transparent 70%)` }}
                      />
                      <div className="relative flex items-start justify-between gap-4">
                        <div>
                          <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/40">
                            {card.tag}
                          </div>
                          <h3
                            className="mt-3 text-2xl font-light leading-tight text-white"
                            style={{ fontFamily: '"Sora", "Manrope", sans-serif' }}
                          >
                            {card.org}
                          </h3>
                        </div>
                        <div
                          className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border"
                          style={{
                            borderColor: `${ACCENT}55`,
                            background: `linear-gradient(135deg, ${ACCENT}22, transparent)`,
                          }}
                        >
                          <Icon className="h-6 w-6" style={{ color: ACCENT }} />
                        </div>
                      </div>
                      <div className="mt-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.28em]">
                        <span className="h-px flex-1" style={{ background: `linear-gradient(to right, ${ACCENT}55, transparent)` }} />
                        <span style={{ color: ACCENT }}>{card.code}-{String(card.items.length).padStart(2, "0")} CAPABILITIES</span>
                        <span className="h-px flex-1" style={{ background: `linear-gradient(to left, ${ACCENT}55, transparent)` }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-px bg-white/5 sm:grid-cols-2">
                      {card.items.map((item, i) => {
                        const ItemIcon = item.icon;
                        return (
                          <div
                            key={i}
                            className="group/item relative flex items-start gap-3 bg-[#0a0e14] p-4 transition-all duration-300 hover:bg-white/[0.04]"
                          >
                            <div
                              className="absolute left-0 top-0 h-full w-0.5 origin-top scale-y-0 transition-transform duration-300 group-hover/item:scale-y-100"
                              style={{ background: `linear-gradient(to bottom, ${ACCENT}, ${ACCENT_GLOW})` }}
                            />
                            <div
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 transition-colors duration-300 group-hover/item:border-white/30"
                              style={{ background: `${ACCENT}0A` }}
                            >
                              <ItemIcon className="h-3.5 w-3.5" style={{ color: ACCENT }} />
                            </div>
                            <div className="flex-1 pt-0.5">
                              <span className="font-mono text-[9px] tracking-[0.2em] text-white/30">
                                {String(i + 1).padStart(2, "0")}
                              </span>
                              <div className="mt-0.5 text-[13px] font-light leading-snug text-white/80">
                                {item.label}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Track Record — Startup Factory Hub Metrics */}
      <section className="slide-panel relative overflow-hidden border-t border-white/5 px-6 py-12 md:px-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(circle at 15% 20%, ${ACCENT}, transparent 45%), radial-gradient(circle at 85% 80%, ${ACCENT_GLOW}, transparent 45%)`,
          }}
        />
        <div className="relative mx-auto max-w-7xl">
          <SectionTitle
            kicker="08a · Track Record"
            title="A proven accelerator platform — recognized globally."
            lead="Startup Factory Hub brings measurable scale, capital outcomes, and international recognition to the Joint Venture from day one."
          />

          {/* Featured in Nasdaq banner */}
          <div
            className="mt-10 flex flex-col items-start gap-4 rounded-sm border p-6 md:flex-row md:items-center md:gap-6 md:p-7"
            style={{ borderColor: `${ACCENT}55`, background: `${ACCENT}0C` }}
          >
            <div
              className="relative shrink-0 overflow-hidden rounded-sm border"
              style={{ borderColor: `${ACCENT}66` }}
            >
              <img
                src={nasdaqFeature}
                alt="Startup Factory Hub featured on Nasdaq"
                className="h-16 w-28 object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/55">
                As Featured on
              </div>
              <div
                className="mt-1 text-xl md:text-2xl font-light leading-snug text-white"
                style={{ fontFamily: '"Sora", "Manrope", sans-serif' }}
              >
                Nasdaq — <span style={{ color: ACCENT }}>World's Leading Accelerator Platform</span>
              </div>
            </div>
            <div
              className="hidden md:block border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.28em]"
              style={{ borderColor: `${ACCENT}55`, color: ACCENT }}
            >
              Nasdaq Feature
            </div>
          </div>

          {/* Hero metrics */}
          <div className="mt-10 grid gap-px border border-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Users,
                value: "4,000+",
                label: "Network in Central Florida",
                sub: "Founders, mentors, investors & operators",
              },
              {
                icon: Rocket,
                value: "40+",
                label: "Startups Accelerated",
                sub: "Across multiple cohorts & verticals",
              },
              {
                icon: DollarSign,
                value: "$200M",
                label: "Capital Raised by Portfolio",
                sub: "Aggregate funding across portfolio companies",
              },
            ].map(({ icon: Icon, value, label, sub }) => (
              <div key={label} className="bg-white/[0.02] p-7">
                <Icon className="h-5 w-5" style={{ color: ACCENT }} />
                <div
                  className="mt-5 text-5xl md:text-6xl font-light leading-none text-white"
                  style={{ fontFamily: '"Sora", "Manrope", sans-serif', color: ACCENT }}
                >
                  {value}
                </div>
                <div className="mt-3 text-base font-medium text-white">{label}</div>
                <div className="mt-1 text-sm text-white/55 font-light">{sub}</div>
              </div>
            ))}
          </div>

          {/* Platform community breakdown */}
          <div className="mt-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <Kicker>Platform Community</Kicker>
                <h3
                  className="mt-3 text-2xl md:text-3xl font-light text-white"
                  style={{ fontFamily: '"Sora", "Manrope", sans-serif' }}
                >
                  Total members across the Startup Factory Hub platform
                </h3>
              </div>
              <div
                className="hidden md:block text-right text-4xl md:text-5xl font-light leading-none"
                style={{ color: ACCENT, fontFamily: '"Sora", "Manrope", sans-serif' }}
              >
                4,000+
              </div>
            </div>

            <div className="mt-6 grid gap-px border border-white/10 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { label: "Mentors", value: "150+" },
                { label: "Startups", value: "40+" },
                { label: "Investors", value: "300+" },
                { label: "Interns", value: "200+" },
                { label: "Legacy Startups", value: "120+" },
                { label: "Investor Directory", value: "1,500+" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/[0.02] p-5">
                  <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
                    {label}
                  </div>
                  <div
                    className="mt-2 text-2xl font-light text-white"
                    style={{ fontFamily: '"Sora", "Manrope", sans-serif' }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Network Partners */}
          <div className="mt-10">
            <div className="flex items-center justify-between">
              <Kicker>Network Partners</Kicker>
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
                Selected ecosystem partners
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-px border border-white/10 sm:grid-cols-3 lg:grid-cols-6">
              {[
                "UCF",
                "Orlando EP",
                "StarterStudio",
                "Florida HTC",
                "FundRise",
                "NVIDIA Inception",
                "AWS Activate",
                "Microsoft for Startups",
                "Google for Startups",
                "Stripe",
                "HubSpot",
                "Nasdaq",
              ].map((name) => (
                <div
                  key={name}
                  className="flex h-20 items-center justify-center bg-white/[0.02] px-3 transition-colors hover:bg-white/[0.05]"
                >
                  <span
                    className="text-center text-sm font-medium tracking-wide text-white/70"
                    style={{ fontFamily: '"Sora", "Manrope", sans-serif' }}
                  >
                    {name}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.28em] text-white/35">
              Logos available upon request · Replace placeholders with partner marks
            </div>
          </div>
        </div>
      </section>

      {/* Operating Model */}
      <section className="slide-panel border-t border-white/5 bg-white/[0.015] px-6 py-12 md:px-12">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            kicker="09 · Operating Model"
            title="Startup Factory Hub serves as Innovation Operating Partner."
            lead="Responsible for day-to-day activation and management of the Innovation Hub."
          />

          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Rocket, title: "Accelerator Operations", body: "Program design and execution end-to-end." },
              { icon: Users, title: "Community Engagement", body: "Ecosystem development and activation." },
              { icon: Briefcase, title: "Membership Growth", body: "Acquisition and long-term retention." },
              { icon: Sparkles, title: "Event Programming", body: "Signature events and conferences." },
              { icon: TrendingUp, title: "Investor Relations", body: "Capital access initiatives." },
              { icon: Building2, title: "Corporate Innovation", body: "Programs for enterprise partners." },
              { icon: Handshake, title: "Strategic Partnerships", body: "Sponsorships and alliances." },
              { icon: Target, title: "Founder Success", body: "Startup support services." },
              { icon: Network, title: "Communications", body: "Marketing and ecosystem voice." },
            ].map(({ icon: Icon, title, body }) => (
              <HairlineCard key={title} icon={Icon} title={title}>
                {body}
              </HairlineCard>
            ))}
          </div>

          <div
            className="mt-14 rounded-sm border p-8 md:p-10"
            style={{ borderColor: `${ACCENT}40`, background: `${ACCENT}06` }}
          >
            <ShieldCheck className="h-6 w-6" style={{ color: ACCENT }} />
            <h3
              className="mt-5 text-2xl font-light text-white"
              style={{ fontFamily: '"Sora", "Manrope", sans-serif' }}
            >
              World Trade Center Club Orlando provides
            </h3>
            <p className="mt-3 max-w-3xl text-base leading-relaxed text-white/65 font-light">
              Strategic oversight, facility infrastructure, international
              business engagement, and executive relationship development. Both
              organizations jointly oversee strategic planning, governance,
              financial performance, and long-term expansion.
            </p>
          </div>
        </div>
      </section>

      {/* Online Platform & AR Experience */}
      <section className="slide-panel relative overflow-hidden border-t border-white/5 px-6 py-12 md:px-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `linear-gradient(${ACCENT}40 1px, transparent 1px), linear-gradient(90deg, ${ACCENT}40 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative mx-auto max-w-7xl">
          <SectionTitle
            kicker="10 · Online Platform & Augmented Reality"
            title="A proprietary digital layer extending the Hub beyond its walls."
            lead="Members, founders, investors, and global partners experience the Innovation Hub through an immersive web platform and a next-generation Augmented Reality layer that turns physical spaces, signage, and printed collateral into interactive gateways."
          />

          <div className="mt-14 grid gap-8 lg:grid-cols-12">
            {/* Feature spotlight */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] backdrop-blur-xl p-10 shadow-[0_8px_40px_-12px_rgba(16,225,160,0.15)] lg:col-span-7">
              <div
                className="absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-20 blur-3xl"
                style={{ background: ACCENT }}
              />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <Scan className="h-6 w-6" style={{ color: ACCENT }} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
                    AR Experience Layer
                  </span>
                </div>
                <h3
                  className="mt-6 text-3xl md:text-4xl font-light leading-tight text-white"
                  style={{ fontFamily: '"Sora", "Manrope", sans-serif' }}
                >
                  Point. Scan. Step inside the Innovation Hub.
                </h3>
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/65 font-light">
                  Any smartphone becomes a portal. Through markerless AR and QR-anchored
                  experiences, members can visualize startup portfolios in 3D, walk through
                  virtual booths, meet founders as holographic avatars, and explore the WTC
                  global network as an interactive world map — all from the lobby, an event,
                  or anywhere in the world.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {[
                    { icon: QrCode, label: "QR-anchored AR triggers across the Hub" },
                    { icon: Box, label: "3D startup showcases & product demos" },
                    { icon: Eye, label: "Virtual tours of facilities & events" },
                    { icon: Layers, label: "Live data overlays on physical spaces" },
                  ].map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-[0_8px_40px_-12px_rgba(16,225,160,0.15)] p-4"
                    >
                      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: ACCENT }} />
                      <span className="text-sm text-white/75 font-light">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Online platform pillar */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] backdrop-blur-xl p-10 shadow-[0_8px_40px_-12px_rgba(16,225,160,0.15)] lg:col-span-5">
              <div className="relative mb-6 overflow-hidden rounded-sm border border-white/10">
                <img
                  src={dashboardMockup}
                  alt="Startup Factory Hub platform dashboard"
                  className="h-44 w-full object-cover object-top opacity-90"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: `linear-gradient(to top, ${NAV}E6, transparent 60%)` }}
                />
              </div>
              <Cpu className="h-6 w-6" style={{ color: ACCENT }} />
              <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
                Online Platform
              </div>
              <h3
                className="mt-3 text-2xl font-light text-white"
                style={{ fontFamily: '"Sora", "Manrope", sans-serif' }}
              >
                Startup Factory Hub digital infrastructure
              </h3>
              <ul className="mt-7 space-y-3">
                <Bullet>Member, founder, mentor & investor portals</Bullet>
                <Bullet>Live deal flow & startup discovery</Bullet>
                <Bullet>Embedded video meetings & events</Bullet>
                <Bullet>AI-powered matchmaking & navigation</Bullet>
                <Bullet>Global WTC network directory access</Bullet>
                <Bullet>Real-time analytics & engagement insights</Bullet>
              </ul>
            </div>
          </div>

          {/* AR use cases */}
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Smartphone,
                title: "Mobile-First AR",
                body: "No app install — WebAR launches instantly from any modern smartphone browser.",
              },
              {
                icon: Box,
                title: "3D Startup Booths",
                body: "Portfolio companies presented as interactive 3D pavilions with pitch videos and live KPIs.",
              },
              {
                icon: Globe2,
                title: "Global Network Map",
                body: "Visualize WTC's 300+ member cities as an immersive 3D globe of trade and innovation flows.",
              },
              {
                icon: Wand2,
                title: "Event Activations",
                body: "Signature events come alive with AR signage, holographic speakers, and gamified networking.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <HairlineCard key={title} icon={Icon} title={title}>
                {body}
              </HairlineCard>
            ))}
          </div>

          <p
            className="mx-auto mt-14 max-w-3xl text-center text-xl md:text-2xl font-light italic leading-snug text-white/80"
            style={{ fontFamily: '"Sora", "Manrope", sans-serif' }}
          >
            "The first innovation hub in Central Florida where the physical, digital, and
            augmented realities of global commerce converge."
          </p>
        </div>
      </section>

      {/* Workspace Ecosystem */}
      <section className="slide-panel border-t border-white/5 px-6 py-12 md:px-12">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            kicker="11 · Workspace Ecosystem"

            title="A differentiated hybrid model. Local prestige. Global access."
            lead="Built for the evolving needs of entrepreneurs, corporations, and international business leaders."
          />

          <div className="mt-14 grid gap-8">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] backdrop-blur-xl p-10 shadow-[0_8px_40px_-12px_rgba(16,225,160,0.15)] lg:max-w-4xl">
              <div
                className="absolute right-0 top-0 h-32 w-32 -translate-y-12 translate-x-12 rounded-full opacity-10 blur-2xl"
                style={{ background: ACCENT }}
              />
              <div className="relative mb-6 overflow-hidden rounded-sm border border-white/10">
                <img
                  src={coworkingSpace}
                  alt="Innovation hub coworking space"
                  className="h-48 w-full object-cover opacity-85"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: `linear-gradient(to top, ${NAV}E6, transparent 60%)` }}
                />
              </div>
              <MapPin className="h-6 w-6" style={{ color: ACCENT }} />
              <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
                Flagship Destination
              </div>
              <h3
                className="mt-3 text-3xl font-light text-white"
                style={{ fontFamily: '"Sora", "Manrope", sans-serif' }}
              >
                World Trade Center Club Orlando
              </h3>
              <ul className="mt-8 space-y-3">
                <Bullet>Innovation and entrepreneurship</Bullet>
                <Bullet>Executive networking</Bullet>
                <Bullet>International trade and diplomacy</Bullet>
                <Bullet>Investor engagement</Bullet>
                <Bullet>Corporate collaboration</Bullet>
                <Bullet>Signature events and conferences</Bullet>
              </ul>
            </div>
          </div>

          <p
            className="mx-auto mt-16 max-w-3xl text-center text-2xl font-light italic leading-snug text-white/80"
            style={{ fontFamily: '"Sora", "Manrope", sans-serif' }}
          >
            "A combined platform with a value proposition unmatched within the
            Central Florida market."
          </p>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="slide-panel relative overflow-hidden border-t border-white/5 px-6 py-12 md:px-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(ellipse at center, ${ACCENT}30, transparent 60%)`,
          }}
        />
        <div className="relative mx-auto max-w-4xl text-center">
          <Kicker>Next Step</Kicker>
          <h2
            className="mt-8 text-4xl md:text-6xl font-light leading-[1.05] tracking-tight text-white"
            style={{ fontFamily: '"Sora", "Manrope", sans-serif' }}
          >
            Let's build Orlando's flagship for{" "}
            <span className="italic" style={{ color: ACCENT }}>
              innovation and global commerce.
            </span>
          </h2>
          <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-white/60 font-light">
            We welcome the opportunity to present this proposal in person to the
            leadership of the World Trade Center Club Orlando and discuss the
            path forward.
          </p>
          <a
            href="mailto:partnerships@startupfactoryhub.com"
            className="mt-12 inline-flex items-center gap-3 border px-8 py-4 font-mono text-xs uppercase tracking-[0.28em] transition-all hover:bg-[#10E1A0] hover:text-[#0A0F14] hover:shadow-[0_0_30px_rgba(16,225,160,0.5)]"
            style={{ borderColor: ACCENT, color: ACCENT }}
          >
            <Mail className="h-4 w-4" />
            Schedule a Presentation
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="slide-panel border-t border-white/5 px-6 py-14 md:px-12 flex items-center">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div className="flex items-center gap-5">
            <img
              src={sfhLogo}
              alt="Startup Factory Hub"
              className="h-10 object-contain opacity-90"
            />
            <div className="h-8 w-px bg-white/10" />
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
                Confidential & Proprietary
              </div>
              <div className="mt-1 text-sm text-white/60 font-light">
                © 2026 Startup Factory Hub Accelerator · startupfactoryhub.com
              </div>
            </div>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
            Prepared June 2026 · Orlando, FL
          </div>
        </div>
      </footer>
      </main>

      {/* Slide navigation HUD */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-end justify-between px-6 pb-6 md:px-12">
        <div
          className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/10 bg-[#0A0F14]/70 px-4 py-2 backdrop-blur-xl"
          style={{ boxShadow: `0 0 30px ${ACCENT}22` }}
        >
          <button
            onClick={() => goTo(slide - 1)}
            disabled={slide === 0}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/80 transition hover:border-[var(--a)] hover:text-white disabled:opacity-30"
            style={{ ['--a' as any]: ACCENT }}
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/70 min-w-[70px] text-center">
            <span style={{ color: ACCENT }}>{String(slide + 1).padStart(2, "0")}</span>
            <span className="mx-1 text-white/30">/</span>
            <span>{String(TOTAL_SLIDES).padStart(2, "0")}</span>
          </div>
          <button
            onClick={() => goTo(slide + 1)}
            disabled={slide >= TOTAL_SLIDES - 1}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/80 transition hover:border-[var(--a)] hover:text-white disabled:opacity-30"
            style={{ ['--a' as any]: ACCENT }}
            aria-label="Next slide"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Progress dots */}
        <div className="pointer-events-auto hidden items-center gap-1.5 rounded-full border border-white/10 bg-[#0A0F14]/70 px-3 py-2 backdrop-blur-xl md:flex">
          {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === slide ? 28 : 8,
                background: i === slide ? ACCENT : "rgba(255,255,255,0.18)",
                boxShadow: i === slide ? `0 0 12px ${ACCENT}` : "none",
              }}
            />
          ))}
        </div>
      </div>

    </div>

  );
};

export default WTCPartnership;
