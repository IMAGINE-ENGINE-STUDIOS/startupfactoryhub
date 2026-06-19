import { useEffect, useState } from "react";
import sfhLogo from "@/assets/sfh-logo-combined.png";
import sfhEmblem from "@/assets/sfh-logo-emblem.png";

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
  Scan,
  Box,
  Smartphone,
  Eye,
  Layers,
  QrCode,
  Cpu,
  Wand2,
} from "lucide-react";


/**
 * /wtcpartnership — Confidential joint venture brochure for
 * the World Trade Center Club Orlando × Startup Factory Hub.
 *
 * Design system: editorial dark, refined serif display, mono kicker
 * accents, restrained gold (#C9A24A) on deep navy (#0A1428).
 */

const ACCENT = "#C9A24A"; // muted diplomatic gold
const NAV = "#0A1428"; // deep WTC navy

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
      style={{ fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif' }}
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
  <div className="group relative overflow-hidden rounded-sm border border-white/10 bg-white/[0.02] p-7 transition-all duration-500 hover:border-[color:var(--accent)] hover:bg-white/[0.04]"
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

const WTCPartnership = () => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.title = "Joint Venture Proposal — WTC Orlando × Startup Factory Hub";
  }, []);

  return (
    <div
      className="min-h-screen text-white antialiased"
      style={{
        background: NAV,
        fontFamily:
          '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* Editorial fonts */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=JetBrains+Mono:wght@400&family=Inter:wght@300;400;500&display=swap"
      />

      {/* Top bar */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled ? "backdrop-blur-xl bg-[#0A1428]/80 border-b border-white/5" : ""
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-12">
          <div className="flex items-center gap-4">
            <img
              src={sfhEmblem}
              alt="Startup Factory Hub"
              className="h-9 w-9 object-contain drop-shadow-[0_0_18px_rgba(201,162,74,0.35)]"
            />
            <div className="hidden h-8 w-px bg-white/15 sm:block" />
            <div className="hidden sm:block">
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
                Confidential · Joint Venture
              </div>
              <div className="text-sm font-medium tracking-wide text-white">
                Startup Factory Hub <span style={{ color: ACCENT }}>×</span> WTC Orlando
              </div>
            </div>
          </div>

          <a
            href="#proposal"
            className="hidden md:inline-flex items-center gap-2 border px-5 py-2 text-xs font-mono uppercase tracking-[0.24em] transition-all hover:bg-white hover:text-[#0A1428]"
            style={{ borderColor: ACCENT, color: ACCENT }}
          >
            Read Proposal <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-screen flex-col justify-center overflow-hidden px-6 pt-32 md:px-12">
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

          <h1
            className="mt-8 text-5xl md:text-7xl lg:text-[88px] font-light leading-[0.95] tracking-[-0.02em] text-white"
            style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
          >
            World Trade Center
            <br />
            <span className="italic" style={{ color: ACCENT }}>
              Innovation Hub
            </span>
            <br />
            <span className="text-3xl md:text-4xl lg:text-5xl text-white/60 font-light not-italic">
              powered by Startup Factory Hub
            </span>
          </h1>

          <p className="mt-10 max-w-2xl text-lg leading-relaxed text-white/65 font-light">
            A strategic joint venture establishing Orlando's premier destination for
            entrepreneurship, innovation, international trade, investment, and
            corporate collaboration.
          </p>

          <div className="mt-14 grid max-w-4xl grid-cols-1 gap-px border border-white/10 sm:grid-cols-3">
            {[
              { label: "Ownership", value: "50 / 50" },
              { label: "Region", value: "Central Florida" },
              { label: "Network", value: "Global · 130+ countries" },
            ].map((s) => (
              <div key={s.label} className="bg-white/[0.02] p-6">
                <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
                  {s.label}
                </div>
                <div
                  className="mt-2 text-2xl font-light text-white"
                  style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-20 flex items-center gap-3 text-white/40">
            <ChevronDown className="h-4 w-4 animate-bounce" />
            <span className="font-mono text-[10px] uppercase tracking-[0.28em]">
              Scroll
            </span>
          </div>
        </div>
      </section>

      {/* Prepared for */}
      <section className="border-y border-white/5 bg-white/[0.015] px-6 py-16 md:px-12">
        <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-2">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
              Prepared for
            </div>
            <div
              className="mt-3 text-2xl font-light text-white"
              style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
            >
              Leadership of the World Trade Center Club Orlando
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
              Prepared by
            </div>
            <div
              className="mt-3 text-2xl font-light text-white"
              style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
            >
              Startup Factory Hub Accelerator
            </div>
          </div>
        </div>
      </section>

      {/* Executive Summary */}
      <section id="proposal" className="px-6 py-28 md:px-12">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            kicker="01 · Executive Summary"
            title="A first-of-its-kind innovation destination for Central Florida."
          />
          <div className="mt-12 grid gap-12 md:grid-cols-12">
            <div className="md:col-span-7 space-y-6 text-base leading-relaxed text-white/70 font-light">
              <p>
                Startup Factory Hub Accelerator respectfully proposes the formation
                of a strategic Joint Venture with the World Trade Center Club
                Orlando to create the{" "}
                <span className="text-white">
                  World Trade Center Innovation Hub powered by Startup Factory Hub
                </span>
                —a premier destination for entrepreneurship, innovation,
                international trade, investment, and corporate collaboration.
              </p>
              <p>
                The Joint Venture will establish a globally connected innovation
                ecosystem designed to accelerate startup growth, foster corporate
                innovation, attract investment, facilitate international business
                expansion, and generate measurable economic impact across the
                region.
              </p>
              <p>
                By combining the prestige and global reach of the World Trade
                Center with the accelerator capabilities of Startup Factory Hub,
                the partnership creates a first-of-its-kind platform where
                founders, corporations, investors, universities, government, and
                international organizations converge.
              </p>
            </div>
            <aside className="md:col-span-5">
              <div
                className="relative h-full rounded-sm border p-8"
                style={{ borderColor: `${ACCENT}40`, background: `${ACCENT}08` }}
              >
                <Sparkles className="h-5 w-5" style={{ color: ACCENT }} />
                <p
                  className="mt-6 text-2xl font-light italic leading-snug text-white"
                  style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
                >
                  "Orlando's flagship center for innovation and global commerce."
                </p>
                <div className="mt-8 font-mono text-[10px] uppercase tracking-[0.28em] text-white/50">
                  The Innovation Hub
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Strategic Partnership Overview */}
      <section className="border-t border-white/5 px-6 py-28 md:px-12">
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
              <div className="rounded-sm border border-white/10 bg-white/[0.02] p-8">
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
                className="rounded-sm border border-white/10 bg-white/[0.02] p-6 transition-all duration-500 hover:border-[color:var(--accent)] hover:bg-white/[0.04]"
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
      <section className="border-t border-white/5 bg-white/[0.015] px-6 py-28 md:px-12">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            kicker="03 · Founding Partner Principles"
            title="Guided by shared commitment. Built for long-term impact."
          />

          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
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
            ].map(({ icon: Icon, title, body }) => (
              <HairlineCard key={title} icon={Icon} title={title}>
                {body}
              </HairlineCard>
            ))}
          </div>
        </div>
      </section>

      {/* Strategic Rationale */}
      <section className="border-t border-white/5 px-6 py-28 md:px-12">
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
      <section className="relative overflow-hidden border-t border-white/5 px-6 py-32 md:px-12">
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
              style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
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
              style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
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
      <section className="border-t border-white/5 bg-white/[0.015] px-6 py-28 md:px-12">
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
                  style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
                >
                  World Trade Center Club Orlando
                </div>
                <div
                  className="mt-8 text-6xl font-light"
                  style={{
                    color: ACCENT,
                    fontFamily: '"Cormorant Garamond", Georgia, serif',
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
                  style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
                >
                  Startup Factory Hub Accelerator
                </div>
                <div
                  className="mt-8 text-6xl font-light"
                  style={{
                    color: ACCENT,
                    fontFamily: '"Cormorant Garamond", Georgia, serif',
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
      <section className="border-t border-white/5 px-6 py-28 md:px-12">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            kicker="08 · Strategic Contributions"
            title="Two organizations. Complementary strengths."
          />

          <div className="mt-14 grid gap-8 lg:grid-cols-2">
            <div className="rounded-sm border border-white/10 p-10">
              <Globe2 className="h-6 w-6" style={{ color: ACCENT }} />
              <h3
                className="mt-6 text-2xl font-light text-white"
                style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
              >
                World Trade Center Club Orlando
              </h3>
              <p className="mt-3 text-sm text-white/55 font-light">
                Institutional, physical, and international assets.
              </p>
              <ul className="mt-8 space-y-3">
                <Bullet>Premium headquarters and innovation facilities</Bullet>
                <Bullet>Executive meeting, conference, and event spaces</Bullet>
                <Bullet>Access to the World Trade Center global network</Bullet>
                <Bullet>International trade and business relationships</Bullet>
                <Bullet>Corporate membership ecosystem</Bullet>
                <Bullet>Government and institutional relationships</Bullet>
                <Bullet>Global brand recognition and market credibility</Bullet>
                <Bullet>International delegation opportunities</Bullet>
              </ul>
            </div>

            <div className="rounded-sm border border-white/10 p-10">
              <Rocket className="h-6 w-6" style={{ color: ACCENT }} />
              <h3
                className="mt-6 text-2xl font-light text-white"
                style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
              >
                Startup Factory Hub Accelerator
              </h3>
              <p className="mt-3 text-sm text-white/55 font-light">
                Entrepreneurial expertise, platform, and ecosystem capabilities.
              </p>
              <ul className="mt-8 space-y-3">
                <Bullet>Accelerator and incubation operations</Bullet>
                <Bullet>Startup recruitment and portfolio management</Bullet>
                <Bullet>Mentor and advisor network</Bullet>
                <Bullet>Investor and venture capital relationships</Bullet>
                <Bullet>Corporate innovation programs</Bullet>
                <Bullet>Educational and executive programming</Bullet>
                <Bullet>Ecosystem activation and community management</Bullet>
                <Bullet>International entrepreneurship partnerships</Bullet>
                <Bullet>Marketing, branding, and growth initiatives</Bullet>
                <Bullet>Proprietary digital accelerator platform</Bullet>
                <Bullet>Founder engagement and networking programs</Bullet>
                <Bullet>Strategic partnership development</Bullet>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Operating Model */}
      <section className="border-t border-white/5 bg-white/[0.015] px-6 py-28 md:px-12">
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
              style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
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
      <section className="relative overflow-hidden border-t border-white/5 px-6 py-28 md:px-12">
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
            <div className="relative overflow-hidden rounded-sm border border-white/10 p-10 lg:col-span-7">
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
                  style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
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
                      className="flex items-start gap-3 rounded-sm border border-white/10 bg-white/[0.02] p-4"
                    >
                      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: ACCENT }} />
                      <span className="text-sm text-white/75 font-light">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Online platform pillar */}
            <div className="rounded-sm border border-white/10 p-10 lg:col-span-5">
              <Cpu className="h-6 w-6" style={{ color: ACCENT }} />
              <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
                Online Platform
              </div>
              <h3
                className="mt-3 text-2xl font-light text-white"
                style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
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
            style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
          >
            "The first innovation hub in Central Florida where the physical, digital, and
            augmented realities of global commerce converge."
          </p>
        </div>
      </section>

      {/* Workspace Ecosystem */}
      <section className="border-t border-white/5 px-6 py-28 md:px-12">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            kicker="11 · Workspace Ecosystem"

            title="A differentiated hybrid model. Local prestige. Global access."
            lead="Built for the evolving needs of entrepreneurs, corporations, and international business leaders."
          />

          <div className="mt-14 grid gap-8 lg:grid-cols-2">
            <div className="relative overflow-hidden rounded-sm border border-white/10 p-10">
              <div
                className="absolute right-0 top-0 h-32 w-32 -translate-y-12 translate-x-12 rounded-full opacity-10 blur-2xl"
                style={{ background: ACCENT }}
              />
              <MapPin className="h-6 w-6" style={{ color: ACCENT }} />
              <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
                Flagship Destination
              </div>
              <h3
                className="mt-3 text-3xl font-light text-white"
                style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
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

            <div className="relative overflow-hidden rounded-sm border border-white/10 p-10">
              <div
                className="absolute right-0 top-0 h-32 w-32 -translate-y-12 translate-x-12 rounded-full opacity-10 blur-2xl"
                style={{ background: ACCENT }}
              />
              <Globe2 className="h-6 w-6" style={{ color: ACCENT }} />
              <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
                Global Workspace Network
              </div>
              <h3
                className="mt-3 text-3xl font-light text-white"
                style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
              >
                IWG Strategic Partnership
              </h3>
              <p className="mt-4 text-sm text-white/55 font-light">
                Through Startup Factory Hub's partnership with IWG, qualifying
                members access flexible workspace across IWG's global network,
                subject to membership terms.
              </p>
              <ul className="mt-6 space-y-3">
                <Bullet>Flexible coworking access</Bullet>
                <Bullet>Dedicated office solutions</Bullet>
                <Bullet>Business lounges</Bullet>
                <Bullet>Meeting room access</Bullet>
                <Bullet>National workspace availability</Bullet>
                <Bullet>International business continuity</Bullet>
              </ul>
            </div>
          </div>

          <p
            className="mx-auto mt-16 max-w-3xl text-center text-2xl font-light italic leading-snug text-white/80"
            style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
          >
            "A combined platform with a value proposition unmatched within the
            Central Florida market."
          </p>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="relative overflow-hidden border-t border-white/5 px-6 py-32 md:px-12">
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
            style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
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
            className="mt-12 inline-flex items-center gap-3 border px-8 py-4 font-mono text-xs uppercase tracking-[0.28em] transition-all hover:bg-white hover:text-[#0A1428]"
            style={{ borderColor: ACCENT, color: ACCENT }}
          >
            <Mail className="h-4 w-4" />
            Schedule a Presentation
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-12 md:px-12">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
              Confidential & Proprietary
            </div>
            <div className="mt-2 text-sm text-white/60 font-light">
              © 2026 Startup Factory Hub Accelerator. All rights reserved.
            </div>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
            Prepared June 2026 · Orlando, FL
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WTCPartnership;
