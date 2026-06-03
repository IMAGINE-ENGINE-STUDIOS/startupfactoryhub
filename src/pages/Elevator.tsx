import { useEffect, useRef, useState } from "react";
import {
  Network, Search, Handshake, Calendar, Users, DollarSign, GraduationCap,
  Cpu, Target, TrendingUp, Brain, Rocket, Globe, ChevronLeft, ChevronRight,
  Maximize2, Minimize2, Rocket as RocketIcon, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import nasdaqFeature from "@/assets/nasdaq-feature.jpg";
import logo from "@/assets/logo.png";

const partners = [
  { name: "NASA", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/NASA_logo.svg/200px-NASA_logo.svg.png" },
  { name: "Google", logo: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png" },
  { name: "HSBC", logo: "/partners/hsbc-logo.png" },
  { name: "Nasdaq", logo: "/nasdaq-logo.png" },
  { name: "GitHub", logo: "/github-logo.png" },
  { name: "NVIDIA", logo: "https://www.nvidia.com/content/dam/en-zz/Solutions/about-nvidia/logo-and-brand/02-nvidia-logo-color-grn-500x200-4c25-p.png" },
  { name: "MongoDB", logo: "/mongodb-logo.webp" },
  { name: "TradingView", logo: "/partners/tradingview-logo.png" },
  { name: "HubSpot", logo: "https://www.hubspot.com/hubfs/HubSpot_Logos/HubSpot-Inversed-Favicon.png" },
  { name: "Datadog", logo: "https://imgix.datadoghq.com/img/dd_logo_n_70x75.png" },
  { name: "IWG", logo: "/partners/iwg-logo.png" },
  { name: "Lehigh", logo: "/lehigh-university-logo.png" },
];

/* ---------- Animated background layers ---------- */
const TechGrid = () => (
  <div
    className="absolute inset-0 opacity-[0.07] pointer-events-none"
    style={{
      backgroundImage:
        "linear-gradient(rgba(20,184,166,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(20,184,166,0.6) 1px, transparent 1px)",
      backgroundSize: "60px 60px",
    }}
  />
);

const FloatingOrbs = ({ color = "teal" }: { color?: "teal" | "rose" | "emerald" }) => {
  const map = {
    teal: "bg-teal-500/20",
    rose: "bg-rose-500/20",
    emerald: "bg-emerald-500/20",
  } as const;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className={`absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full blur-3xl ${map[color]} animate-pulse`} style={{ animationDuration: "6s" }} />
      <div className={`absolute -bottom-32 -right-32 w-[520px] h-[520px] rounded-full blur-3xl ${map[color]} animate-pulse`} style={{ animationDuration: "8s", animationDelay: "1s" }} />
      <div className={`absolute top-1/2 left-1/2 w-[300px] h-[300px] rounded-full blur-3xl ${map[color]} animate-pulse`} style={{ animationDuration: "10s" }} />
    </div>
  );
};

const ScanLine = ({ color = "teal" }: { color?: "teal" | "rose" | "emerald" }) => {
  const c = { teal: "via-teal-400/60", rose: "via-rose-400/60", emerald: "via-emerald-400/60" }[color];
  return (
    <div className="absolute inset-x-0 top-0 h-[2px] pointer-events-none overflow-hidden">
      <div className={`h-full w-1/3 bg-gradient-to-r from-transparent ${c} to-transparent animate-[slide_4s_linear_infinite]`} />
    </div>
  );
};

const CornerAccents = ({ color = "teal" }: { color?: "teal" | "rose" | "emerald" }) => {
  const c = { teal: "border-teal-400/60", rose: "border-rose-400/60", emerald: "border-emerald-400/60" }[color];
  return (
    <>
      <div className={`absolute top-6 left-6 w-10 h-10 border-l-2 border-t-2 ${c}`} />
      <div className={`absolute top-6 right-6 w-10 h-10 border-r-2 border-t-2 ${c}`} />
      <div className={`absolute bottom-6 left-6 w-10 h-10 border-l-2 border-b-2 ${c}`} />
      <div className={`absolute bottom-6 right-6 w-10 h-10 border-r-2 border-b-2 ${c}`} />
    </>
  );
};

const SlideShell = ({
  kicker, color = "teal", title, subtitle, children,
}: {
  kicker?: string; color?: "teal" | "rose" | "emerald";
  title?: string; subtitle?: React.ReactNode; children: React.ReactNode;
}) => {
  const ring = { teal: "ring-teal-500/30", rose: "ring-rose-500/30", emerald: "ring-emerald-500/30" }[color];
  const dot = { teal: "bg-teal-400", rose: "bg-rose-400", emerald: "bg-emerald-400" }[color];
  const text = { teal: "text-teal-300", rose: "text-rose-300", emerald: "text-emerald-300" }[color];
  return (
    <section className={`relative w-screen h-screen shrink-0 flex flex-col p-10 md:p-16 overflow-hidden`}>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <TechGrid />
      <FloatingOrbs color={color} />
      <ScanLine color={color} />
      <div className={`absolute inset-6 border ring-1 ${ring} rounded-3xl pointer-events-none border-white/5`} />
      <CornerAccents color={color} />

      <div className="relative z-10 max-w-[1600px] mx-auto w-full flex-1 flex flex-col justify-center min-h-0">
        {kicker && (
          <div className="flex items-center gap-3 justify-center mb-5">
            <div className={`w-2.5 h-2.5 ${dot} rotate-45 animate-pulse`} />
            <span className={`text-base md:text-lg font-semibold tracking-[0.4em] uppercase ${text}`}>{kicker}</span>
            <div className={`w-2.5 h-2.5 ${dot} rotate-45 animate-pulse`} />
          </div>
        )}
        {title && (
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-white text-center mb-6 tracking-tight leading-[1.02]">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="text-xl md:text-2xl lg:text-3xl text-center text-slate-300 mb-10 max-w-5xl mx-auto leading-snug">
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </section>
  );
};

/* ---------- Slides ---------- */
const CoverSlide = () => (
  <section className="relative w-screen h-screen shrink-0 flex flex-col items-center justify-center p-10 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
    <TechGrid />
    <FloatingOrbs color="teal" />
    <ScanLine color="teal" />
    <CornerAccents color="teal" />

    <div className="relative z-10 flex flex-col items-center text-center max-w-6xl">
      <img src={logo} alt="Startup Factory Hub" className="w-28 h-28 md:w-36 md:h-36 mb-8 drop-shadow-[0_0_40px_rgba(20,184,166,0.6)]" />

      <div className="flex items-center gap-3 mb-6">
        <div className="h-px w-12 bg-teal-400/60" />
        <span className="text-base md:text-lg font-semibold tracking-[0.5em] uppercase text-teal-300">Elevator Pitch</span>
        <div className="h-px w-12 bg-teal-400/60" />
      </div>

      <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white tracking-tight leading-[0.95] mb-6">
        STARTUP
        <br />
        <span className="bg-gradient-to-r from-teal-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
          FACTORY HUB
        </span>
      </h1>

      <p className="text-2xl md:text-3xl lg:text-4xl text-slate-200 max-w-4xl leading-snug font-light mb-10">
        The operating system for the <span className="text-teal-300 font-semibold">global innovation ecosystem</span>.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
        {["AI Intelligence", "Accelerator", "Hybrid Hubs", "Capital Access"].map((t) => (
          <span key={t} className="tech-card border-0 ring-1 ring-teal-500/40 px-5 py-2.5 rounded-full text-base md:text-lg font-semibold text-teal-200">
            {t}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-3 text-slate-400 text-base md:text-lg animate-pulse">
        <ChevronRight className="h-5 w-5" />
        <span className="tracking-wider uppercase">Press → or Space to begin</span>
      </div>
    </div>
  </section>
);

const ProblemSlide = () => (
  <SlideShell
    kicker="The Problem"
    color="rose"
    title="The Problem"
    subtitle={<>The innovation ecosystem is <span className="text-rose-300 font-semibold">fragmented and inefficient</span> — startups, partners, and capital operate in disconnected silos.</>}
  >
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {[
        { icon: Network, title: "Fragmented Ecosystem", desc: "Startups, technologies, and partners in disconnected environments." },
        { icon: Search, title: "Limited Tech Visibility", desc: "Innovation develops outside corporate and investment pipelines." },
        { icon: Handshake, title: "Inefficient Collaboration", desc: "Sourcing and engaging startups is slow and inconsistent." },
        { icon: Calendar, title: "No Post-Demo Support", desc: "Most accelerators fail to provide ongoing execution support." },
        { icon: Users, title: "No Operator Access", desc: "Founders lack guidance from builders who have scaled companies." },
        { icon: DollarSign, title: "Capital Without Execution", desc: "Funding deployed without the operational support to drive outcomes." },
      ].map((g, i) => (
        <div key={i} className="tech-card border-0 ring-1 ring-rose-500/30 backdrop-blur-sm rounded-2xl p-6 flex flex-col gap-4 hover:ring-rose-400/60 transition-all hover:-translate-y-1">
          <div className="w-14 h-14 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center">
            <g.icon className="h-7 w-7 text-rose-300" />
          </div>
          <div>
            <p className="text-xl md:text-2xl font-bold text-rose-200 mb-2 leading-tight">{g.title}</p>
            <p className="text-base md:text-lg text-slate-300 leading-snug">{g.desc}</p>
          </div>
        </div>
      ))}
    </div>
  </SlideShell>
);

const SolutionSlide = () => (
  <SlideShell
    kicker="The Solution"
    color="teal"
    title="The Solution"
    subtitle={<><span className="text-teal-300 font-semibold">Startup Factory Hub</span> unifies the ecosystem — connecting startups, partners, and capital in one integrated platform.</>}
  >
    {/* Connected journey */}
    <div className="relative w-full max-w-5xl mx-auto mb-10">
      <div className="absolute top-[34px] left-[6%] right-[6%] h-0.5 bg-gradient-to-r from-teal-500/40 via-cyan-400 to-teal-500/40" />
      <div className="grid grid-cols-5 gap-4 relative">
        {[
          { icon: GraduationCap, label: "Education" },
          { icon: Cpu, label: "Product" },
          { icon: Target, label: "Market" },
          { icon: DollarSign, label: "Revenue" },
          { icon: TrendingUp, label: "Scale" },
        ].map((s, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-teal-500/20 border-2 border-teal-400/70 flex items-center justify-center shadow-[0_0_24px_rgba(20,184,166,0.5)]">
              <s.icon className="h-7 w-7 md:h-9 md:w-9 text-teal-300" />
            </div>
            <span className="text-base md:text-lg font-bold mt-3 text-teal-200">{s.label}</span>
          </div>
        ))}
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {[
        { icon: Brain, label: "AI Business Intelligence", desc: "Structured insights into startups, markets, and tech enabling smarter collaboration & investment." },
        { icon: Rocket, label: "Integrated Accelerator", desc: "Continuous execution beyond demo day with operator guidance and strategic alignment." },
        { icon: Globe, label: "Hybrid Infrastructure", desc: "Physical hubs unified with a digital layer for seamless collaboration and data flow." },
        { icon: Network, label: "Strategic Ecosystem Access", desc: "Direct connection to startups, technologies, investors, and institutional opportunities." },
      ].map((p, i) => (
        <div key={i} className="tech-card border-0 ring-1 ring-teal-500/30 backdrop-blur-sm rounded-2xl p-6 hover:ring-teal-400/60 transition-all hover:-translate-y-1">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 rounded-xl bg-teal-500/20 border border-teal-400/50 flex items-center justify-center">
              <p.icon className="h-7 w-7 text-teal-300" />
            </div>
            <span className="text-xl md:text-2xl font-bold text-teal-200">{p.label}</span>
          </div>
          <p className="text-base md:text-lg text-slate-300 leading-snug">{p.desc}</p>
        </div>
      ))}
    </div>
  </SlideShell>
);

const EcosystemSlide = () => (
  <SlideShell
    kicker="Ecosystem & Recognition"
    color="emerald"
    title="Backed by Industry Leaders"
    subtitle={<>Featured on the iconic <span className="text-emerald-300 font-semibold">NASDAQ Tower</span> in Times Square — recognized as a leading global innovation platform.</>}
  >
    <div className="grid grid-cols-4 md:grid-cols-6 gap-3 mb-8">
      {partners.map((p, i) => (
        <div key={i} className="tech-card border-0 ring-1 ring-emerald-500/30 backdrop-blur-sm rounded-xl p-3 flex items-center justify-center h-20 md:h-24 hover:ring-emerald-400/60 transition-all">
          <img
            src={p.logo}
            alt={p.name}
            className="max-h-12 md:max-h-14 max-w-[110px] object-contain filter brightness-95"
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.style.display = "none";
              el.parentElement!.innerHTML = `<span class="text-sm md:text-base text-slate-300 font-semibold">${p.name}</span>`;
            }}
          />
        </div>
      ))}
    </div>

    <div className="relative rounded-3xl overflow-hidden ring-1 ring-emerald-500/50 flex-1 min-h-[260px] md:min-h-[340px] shadow-[0_0_60px_rgba(16,185,129,0.25)]">
      <img src={nasdaqFeature} alt="Startup Factory Hub on NASDAQ Tower" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
      <div className="absolute inset-0 flex flex-col items-center justify-end p-8 md:p-12 text-center">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-emerald-300" />
          <span className="text-sm md:text-base font-semibold tracking-[0.4em] uppercase text-emerald-300">As Featured On</span>
          <Sparkles className="h-5 w-5 text-emerald-300" />
        </div>
        <h3 className="text-4xl md:text-6xl lg:text-7xl font-black text-white drop-shadow-lg">
          NASDAQ TOWER
        </h3>
        <p className="text-xl md:text-2xl text-slate-100 mt-3 max-w-3xl">Times Square · New York City</p>
      </div>
    </div>
  </SlideShell>
);

const slides = [CoverSlide, ProblemSlide, SolutionSlide, EcosystemSlide];
const slideTitles = ["Cover", "Problem", "Solution", "Ecosystem"];

const Elevator = () => {
  const [idx, setIdx] = useState(0);
  const [isFs, setIsFs] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") setIdx((i) => Math.min(i + 1, slides.length - 1));
      if (e.key === "ArrowLeft" || e.key === "PageUp") setIdx((i) => Math.max(i - 1, 0));
      if (e.key === "Home") setIdx(0);
      if (e.key === "End") setIdx(slides.length - 1);
      if (e.key === "f" || e.key === "F") toggleFs();
      if (e.key === "Escape" && document.fullscreenElement) document.exitFullscreen();
    };
    const onFs = () => setIsFs(!!document.fullscreenElement);
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFs);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleFs = () => {
    if (!document.fullscreenElement) rootRef.current?.requestFullscreen();
    else document.exitFullscreen();
  };

  return (
    <div ref={rootRef} className="relative w-screen h-screen overflow-hidden bg-slate-950 text-white">
      <style>{`
        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>

      <div
        className="flex h-full transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)]"
        style={{ width: `${slides.length * 100}vw`, transform: `translateX(-${idx * 100}vw)` }}
      >
        {slides.map((S, i) => <S key={i} />)}
      </div>

      {/* Side nav */}
      <Button
        size="icon"
        variant="ghost"
        onClick={() => setIdx((i) => Math.max(i - 1, 0))}
        disabled={idx === 0}
        className="fixed left-6 top-1/2 -translate-y-1/2 z-50 h-14 w-14 rounded-full tech-card border-0 ring-1 ring-teal-500/40 backdrop-blur-md hover:ring-teal-400"
      >
        <ChevronLeft className="h-7 w-7" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => setIdx((i) => Math.min(i + 1, slides.length - 1))}
        disabled={idx === slides.length - 1}
        className="fixed right-6 top-1/2 -translate-y-1/2 z-50 h-14 w-14 rounded-full tech-card border-0 ring-1 ring-teal-500/40 backdrop-blur-md hover:ring-teal-400"
      >
        <ChevronRight className="h-7 w-7" />
      </Button>

      {/* Fullscreen */}
      <Button
        size="icon"
        variant="ghost"
        onClick={toggleFs}
        className="fixed top-6 right-6 z-50 h-12 w-12 rounded-full tech-card border-0 ring-1 ring-teal-500/40 backdrop-blur-md hover:ring-teal-400"
        aria-label="Toggle fullscreen"
        title="Fullscreen (F)"
      >
        {isFs ? <Minimize2 className="h-6 w-6" /> : <Maximize2 className="h-6 w-6" />}
      </Button>

      {/* Bottom nav */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 tech-card border-0 ring-1 ring-teal-500/40 backdrop-blur-md rounded-full px-6 py-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className="group flex flex-col items-center gap-1"
            aria-label={`Go to slide ${i + 1}: ${slideTitles[i]}`}
          >
            <span className={`h-2.5 rounded-full transition-all ${i === idx ? "w-10 bg-teal-400" : "w-2.5 bg-slate-600 group-hover:bg-slate-400"}`} />
          </button>
        ))}
        <span className="text-sm md:text-base text-slate-300 ml-3 tabular-nums font-semibold">
          {idx + 1} / {slides.length} · <span className="text-teal-300">{slideTitles[idx]}</span>
        </span>
      </div>
    </div>
  );
};

export default Elevator;
