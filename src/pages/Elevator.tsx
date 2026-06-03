import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Network, Search, Handshake, Calendar, Users, DollarSign, GraduationCap,
  Cpu, Target, TrendingUp, Brain, Rocket, Globe, ChevronLeft, ChevronRight,
  Maximize2, Minimize2, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import nasdaqFeature from "@/assets/nasdaq-feature.jpg";
import logo from "@/assets/logo.png";
import imgAi from "@/assets/elevator-ai.png";
import imgAccelerator from "@/assets/elevator-accelerator.png";
import imgHybrid from "@/assets/elevator-hybrid.png";
import imgEcosystem from "@/assets/elevator-ecosystem.png";
import imgFragmented from "@/assets/problem-fragmented.png";
import imgVisibility from "@/assets/problem-visibility.png";
import imgCollaboration from "@/assets/problem-collaboration.png";
import imgSupport from "@/assets/problem-support.png";
import imgOperator from "@/assets/problem-operator.png";
import imgCapital from "@/assets/problem-capital.png";

/* Slides render at a fixed 1920x1080 canvas and scale to fit any viewport.
   This guarantees content NEVER overflows on any device or projector. */
const SLIDE_W = 1920;
const SLIDE_H = 1080;

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

/* ---------- Background decorations ---------- */
const MATRIX_CHARS = "アイウエオカキクケコサシスセソタチツテトナニヌネノ01ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩABCDEF0123456789@#$%&*";
const MatrixSymbolLayer = ({ density = 0.18, columns = 48 }: { density?: number; columns?: number }) => {
  const cols = Array.from({ length: columns }, (_, i) => i);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" style={{ opacity: density }}>
      {cols.map((c) => {
        const charsInCol = 28 + Math.floor(Math.random() * 14);
        const left = (c / columns) * 100;
        const delay = (Math.random() * 6).toFixed(2);
        const duration = 14 + Math.random() * 10;
        return (
          <div
            key={c}
            className="absolute top-0 text-teal-400 font-mono whitespace-pre"
            style={{
              left: `${left}%`,
              fontSize: 16,
              lineHeight: "20px",
              writingMode: "vertical-rl",
              textOrientation: "upright",
              animation: `matrix-fall ${duration}s linear ${delay}s infinite`,
              textShadow: "0 0 8px rgba(20,184,166,0.7)",
            }}
          >
            {Array.from({ length: charsInCol }, () => MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]).join("")}
          </div>
        );
      })}
    </div>
  );
};

const TechGrid = () => (
  <div
    className="absolute inset-0 opacity-[0.07] pointer-events-none"
    style={{
      backgroundImage:
        "linear-gradient(rgba(20,184,166,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(20,184,166,0.6) 1px, transparent 1px)",
      backgroundSize: "80px 80px",
    }}
  />
);

const FloatingOrbs = ({ color = "teal" }: { color?: "teal" | "rose" | "emerald" }) => {
  const c = { teal: "bg-teal-500/20", rose: "bg-rose-500/20", emerald: "bg-emerald-500/20" }[color];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className={`absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-3xl ${c} animate-pulse`} style={{ animationDuration: "6s" }} />
      <div className={`absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full blur-3xl ${c} animate-pulse`} style={{ animationDuration: "8s", animationDelay: "1s" }} />
    </div>
  );
};

const ScanLine = ({ color = "teal" }: { color?: "teal" | "rose" | "emerald" }) => {
  const c = { teal: "via-teal-400/60", rose: "via-rose-400/60", emerald: "via-emerald-400/60" }[color];
  return (
    <div className="absolute inset-x-0 top-0 h-[3px] pointer-events-none overflow-hidden">
      <div className={`h-full w-1/3 bg-gradient-to-r from-transparent ${c} to-transparent animate-[slide_4s_linear_infinite]`} />
    </div>
  );
};

const CornerAccents = ({ color = "teal" }: { color?: "teal" | "rose" | "emerald" }) => {
  const c = { teal: "border-teal-400/60", rose: "border-rose-400/60", emerald: "border-emerald-400/60" }[color];
  return (
    <>
      <div className={`absolute top-10 left-10 w-16 h-16 border-l-2 border-t-2 ${c}`} />
      <div className={`absolute top-10 right-10 w-16 h-16 border-r-2 border-t-2 ${c}`} />
      <div className={`absolute bottom-10 left-10 w-16 h-16 border-l-2 border-b-2 ${c}`} />
      <div className={`absolute bottom-10 right-10 w-16 h-16 border-r-2 border-b-2 ${c}`} />
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
    <div className="relative w-full h-full flex flex-col overflow-hidden" style={{ padding: 80 }}>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <TechGrid />
      <FloatingOrbs color={color} />
      <ScanLine color={color} />
      <div className={`absolute inset-8 border ring-1 ${ring} rounded-[32px] pointer-events-none border-white/5`} />
      <CornerAccents color={color} />

      <div className="relative z-10 w-full flex-1 flex flex-col justify-center min-h-0">
        {kicker && (
          <div className="flex items-center gap-4 justify-center" style={{ marginBottom: 28 }}>
            <div className={`w-4 h-4 ${dot} rotate-45 animate-pulse`} />
            <span className={`font-semibold tracking-[0.4em] uppercase ${text}`} style={{ fontSize: 24 }}>{kicker}</span>
            <div className={`w-4 h-4 ${dot} rotate-45 animate-pulse`} />
          </div>
        )}
        {title && (
          <h2 className="font-black text-white text-center tracking-tight" style={{ fontSize: 104, lineHeight: 1.02, marginBottom: 32 }}>
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="text-center text-slate-300 mx-auto" style={{ fontSize: 36, lineHeight: 1.3, maxWidth: 1400, marginBottom: 56 }}>
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </div>
  );
};

/* ---------- Slides ---------- */
const CoverSlide = () => (
  <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden" style={{ padding: 80 }}>
    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
    <MatrixSymbolLayer density={0.28} columns={52} />
    <TechGrid />
    <FloatingOrbs color="teal" />
    <ScanLine color="teal" />
    <CornerAccents color="teal" />
    {/* Vignette so the headline stays readable above the matrix */}
    <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(2,6,23,0) 0%, rgba(2,6,23,0.55) 55%, rgba(2,6,23,0.85) 100%)" }} />

    <div className="relative z-10 flex flex-col items-center text-center" style={{ maxWidth: 1500 }}>
      <img src={logo} alt="Startup Factory Hub" style={{ width: 180, height: 180, marginBottom: 40 }} className="drop-shadow-[0_0_60px_rgba(20,184,166,0.6)]" />

      <div className="flex items-center" style={{ gap: 16, marginBottom: 28 }}>
        <div className="bg-teal-400/60" style={{ height: 2, width: 60 }} />
        <span className="font-semibold tracking-[0.5em] uppercase text-teal-300" style={{ fontSize: 24 }}>Elevator Pitch</span>
        <div className="bg-teal-400/60" style={{ height: 2, width: 60 }} />
      </div>

      <h1 className="font-black text-white tracking-tight" style={{ fontSize: 168, lineHeight: 0.95, marginBottom: 32 }}>
        STARTUP
        <br />
        <span className="bg-gradient-to-r from-teal-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
          FACTORY HUB
        </span>
      </h1>

      <p className="text-slate-200 font-light" style={{ fontSize: 44, lineHeight: 1.25, maxWidth: 1400, marginBottom: 48 }}>
        The operating system for the <span className="text-teal-300 font-semibold">global innovation ecosystem</span>.
      </p>

      <div className="flex flex-wrap items-center justify-center" style={{ gap: 16 }}>
        {["AI Intelligence", "Accelerator", "Hybrid Hubs", "Capital Access"].map((t) => (
          <span key={t} className="tech-card border-0 ring-1 ring-teal-500/40 rounded-full font-semibold text-teal-200" style={{ padding: "16px 32px", fontSize: 26 }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  </div>
);

const ProblemSlide = () => (
  <SlideShell
    kicker="The Problem"
    color="rose"
    title="The Problem"
    subtitle={<>The innovation ecosystem is <span className="text-rose-300 font-semibold">fragmented and inefficient</span> — startups, partners, and capital operate in disconnected silos.</>}
  >
    <div className="grid grid-cols-3" style={{ gap: 24 }}>
      {[
        { icon: Network, title: "Fragmented Ecosystem", desc: "Startups, technologies, and partners in disconnected environments.", image: imgFragmented },
        { icon: Search, title: "Limited Tech Visibility", desc: "Innovation develops outside corporate and investment pipelines.", image: imgVisibility },
        { icon: Handshake, title: "Inefficient Collaboration", desc: "Sourcing and engaging startups is slow and inconsistent.", image: imgCollaboration },
        { icon: Calendar, title: "No Post-Demo Support", desc: "Most accelerators fail to provide ongoing execution support.", image: imgSupport },
        { icon: Users, title: "No Operator Access", desc: "Founders lack guidance from builders who have scaled companies.", image: imgOperator },
        { icon: DollarSign, title: "Capital Without Execution", desc: "Funding deployed without operational support to drive outcomes.", image: imgCapital },
      ].map((g, i) => (
        <div key={i} className="tech-card border-0 ring-1 ring-rose-500/30 backdrop-blur-sm rounded-2xl overflow-hidden flex flex-col" style={{ height: 280 }}>
          {/* Image */}
          <div className="relative overflow-hidden" style={{ height: 110 }}>
            <img src={g.image} alt={g.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/50 to-slate-950" />
            <div className="absolute top-3 left-3 rounded-xl bg-rose-500/20 border border-rose-400/50 backdrop-blur-md flex items-center justify-center" style={{ width: 56, height: 56 }}>
              <g.icon className="text-rose-300" style={{ width: 28, height: 28 }} />
            </div>
          </div>
          {/* Content */}
          <div className="flex-1 flex flex-col justify-center" style={{ padding: 20 }}>
            <p className="font-bold text-rose-200" style={{ fontSize: 24, lineHeight: 1.15, marginBottom: 8 }}>{g.title}</p>
            <p className="text-slate-300" style={{ fontSize: 18, lineHeight: 1.35 }}>{g.desc}</p>
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
    <div className="relative mx-auto" style={{ maxWidth: 1400, marginBottom: 48 }}>
      <div className="absolute bg-gradient-to-r from-teal-500/40 via-cyan-400 to-teal-500/40" style={{ top: 48, left: "6%", right: "6%", height: 2 }} />
      <div className="grid grid-cols-5 relative" style={{ gap: 24 }}>
        {[
          { icon: GraduationCap, label: "Education" },
          { icon: Cpu, label: "Product" },
          { icon: Target, label: "Market" },
          { icon: DollarSign, label: "Revenue" },
          { icon: TrendingUp, label: "Scale" },
        ].map((s, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="rounded-full bg-teal-500/20 border-2 border-teal-400/70 flex items-center justify-center shadow-[0_0_30px_rgba(20,184,166,0.5)]" style={{ width: 96, height: 96 }}>
              <s.icon className="text-teal-300" style={{ width: 44, height: 44 }} />
            </div>
            <span className="font-bold text-teal-200" style={{ fontSize: 24, marginTop: 16 }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>

    <div className="grid grid-cols-4" style={{ gap: 24 }}>
      {[
        { icon: Brain, label: "AI Business Intelligence", desc: "Structured insights into startups, markets & tech for smarter investment decisions.", image: imgAi },
        { icon: Rocket, label: "Integrated Accelerator", desc: "Continuous execution beyond demo day with operator guidance.", image: imgAccelerator },
        { icon: Globe, label: "Hybrid Infrastructure", desc: "Physical hubs unified with a digital layer for seamless collaboration.", image: imgHybrid },
        { icon: Network, label: "Strategic Ecosystem Access", desc: "Direct connection to startups, investors, and institutional opportunities.", image: imgEcosystem },
      ].map((p, i) => (
        <div
          key={i}
          className="tech-card border-0 ring-1 ring-teal-500/30 backdrop-blur-sm rounded-3xl overflow-hidden flex flex-col"
          style={{ height: 380 }}
        >
          {/* Image square */}
          <div className="relative overflow-hidden" style={{ height: 160 }}>
            <img src={p.image} alt={p.label} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/50 to-slate-950" />
            <div className="absolute top-4 left-4 rounded-xl bg-teal-500/20 border border-teal-400/50 backdrop-blur-md flex items-center justify-center" style={{ width: 64, height: 64 }}>
              <p.icon className="text-teal-300" style={{ width: 32, height: 32 }} />
            </div>
          </div>
          {/* Content */}
          <div className="flex-1 flex flex-col justify-center" style={{ padding: 24 }}>
            <h4 className="font-bold text-teal-200" style={{ fontSize: 26, lineHeight: 1.15, marginBottom: 12 }}>{p.label}</h4>
            <p className="text-slate-300" style={{ fontSize: 19, lineHeight: 1.4 }}>{p.desc}</p>
          </div>
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
    <div className="grid grid-cols-6" style={{ gap: 16, marginBottom: 40 }}>
      {partners.map((p, i) => (
        <div key={i} className="tech-card border-0 ring-1 ring-emerald-500/30 backdrop-blur-sm rounded-2xl flex items-center justify-center" style={{ padding: 16, height: 120 }}>
          <img
            src={p.logo}
            alt={p.name}
            style={{ maxHeight: 70, maxWidth: 160, objectFit: "contain" }}
            className="filter brightness-95"
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.style.display = "none";
              el.parentElement!.innerHTML = `<span style="font-size:24px" class="text-slate-200 font-semibold">${p.name}</span>`;
            }}
          />
        </div>
      ))}
    </div>

    <div className="relative rounded-3xl overflow-hidden ring-1 ring-emerald-500/50 shadow-[0_0_80px_rgba(16,185,129,0.3)]" style={{ height: 360 }}>
      <img src={nasdaqFeature} alt="Startup Factory Hub on NASDAQ Tower" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
      <div className="absolute inset-0 flex flex-col items-center justify-end text-center" style={{ padding: 48 }}>
        <div className="flex items-center" style={{ gap: 12, marginBottom: 16 }}>
          <Sparkles className="text-emerald-300" style={{ width: 24, height: 24 }} />
          <span className="font-semibold tracking-[0.4em] uppercase text-emerald-300" style={{ fontSize: 22 }}>As Featured On</span>
          <Sparkles className="text-emerald-300" style={{ width: 24, height: 24 }} />
        </div>
        <h3 className="font-black text-white drop-shadow-lg" style={{ fontSize: 96, lineHeight: 1 }}>
          NASDAQ TOWER
        </h3>
        <p className="text-slate-100" style={{ fontSize: 32, marginTop: 12 }}>Times Square · New York City</p>
      </div>
    </div>
  </SlideShell>
);

const slides = [CoverSlide, ProblemSlide, SolutionSlide, EcosystemSlide];
const slideTitles = ["Cover", "Problem", "Solution", "Ecosystem"];

/* ---------- Scaled stage ---------- */
const ScaledStage = ({ children }: { children: React.ReactNode }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const update = () => {
      if (!wrapRef.current) return;
      const { clientWidth: w, clientHeight: h } = wrapRef.current;
      setScale(Math.min(w / SLIDE_W, h / SLIDE_H));
    };
    update();
    const ro = new ResizeObserver(update);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener("resize", update);
    return () => { ro.disconnect(); window.removeEventListener("resize", update); };
  }, []);

  return (
    <div ref={wrapRef} className="relative w-full h-full overflow-hidden">
      <div
        className="absolute"
        style={{
          width: SLIDE_W,
          height: SLIDE_H,
          left: "50%",
          top: "50%",
          marginLeft: -SLIDE_W / 2,
          marginTop: -SLIDE_H / 2,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {children}
      </div>
    </div>
  );
};

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
        {slides.map((S, i) => (
          <div key={i} className="w-screen h-full shrink-0">
            <ScaledStage>
              <S />
            </ScaledStage>
          </div>
        ))}
      </div>

      <Button
        size="icon"
        variant="ghost"
        onClick={() => setIdx((i) => Math.max(i - 1, 0))}
        disabled={idx === 0}
        className="fixed left-4 top-1/2 -translate-y-1/2 z-50 h-12 w-12 rounded-full tech-card border-0 ring-1 ring-teal-500/40 backdrop-blur-md hover:ring-teal-400"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => setIdx((i) => Math.min(i + 1, slides.length - 1))}
        disabled={idx === slides.length - 1}
        className="fixed right-4 top-1/2 -translate-y-1/2 z-50 h-12 w-12 rounded-full tech-card border-0 ring-1 ring-teal-500/40 backdrop-blur-md hover:ring-teal-400"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      <Button
        size="icon"
        variant="ghost"
        onClick={toggleFs}
        className="fixed top-4 right-4 z-50 h-11 w-11 rounded-full tech-card border-0 ring-1 ring-teal-500/40 backdrop-blur-md hover:ring-teal-400"
        aria-label="Toggle fullscreen"
        title="Fullscreen (F)"
      >
        {isFs ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
      </Button>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 tech-card border-0 ring-1 ring-teal-500/40 backdrop-blur-md rounded-full px-5 py-2.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`h-2.5 rounded-full transition-all ${i === idx ? "w-10 bg-teal-400" : "w-2.5 bg-slate-600 hover:bg-slate-400"}`}
            aria-label={`Go to slide ${i + 1}: ${slideTitles[i]}`}
          />
        ))}
        <span className="text-sm text-slate-300 ml-2 tabular-nums font-semibold">
          {idx + 1} / {slides.length} · <span className="text-teal-300">{slideTitles[idx]}</span>
        </span>
      </div>
    </div>
  );
};

export default Elevator;
