import { useEffect, useRef, useState } from "react";
import {
  Network, Search, Handshake, Calendar, Users, DollarSign, GraduationCap,
  Cpu, Target, TrendingUp, Brain, Rocket, Globe, ChevronLeft, ChevronRight, Maximize2, Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import nasdaqFeature from "@/assets/nasdaq-feature.jpg";

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

const SlideShell = ({ kicker, kickerColor, title, children }: { kicker: string; kickerColor: string; title: string; children: React.ReactNode }) => (
  <section className="relative w-screen h-screen shrink-0 flex flex-col p-6 md:p-12 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
    <div className="absolute inset-4 border border-teal-500/20 rounded-2xl pointer-events-none" />
    <div className="relative z-10 max-w-6xl mx-auto w-full flex-1 flex flex-col justify-center min-h-0">
      <div className="flex items-center gap-2 justify-center mb-3">
        <div className={`w-2 h-2 ${kickerColor} rotate-45`} />
        <span className={`text-xs font-semibold tracking-[0.3em] uppercase ${kickerColor.replace('bg-', 'text-').replace('-500', '-400')}`}>{kicker}</span>
        <div className={`w-2 h-2 ${kickerColor} rotate-45`} />
      </div>
      <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-6">{title}</h2>
      {children}
    </div>
  </section>
);

const ProblemSlide = () => (
  <SlideShell kicker="The Problem" kickerColor="bg-rose-500" title="The Problem">
    <p className="text-base md:text-lg text-center text-slate-300 mb-6 max-w-3xl mx-auto leading-relaxed">
      The current innovation ecosystem is <span className="text-rose-400 font-semibold">fragmented and inefficient</span> — startups, partners, and capital operate in disconnected silos.
    </p>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {[
        { icon: Network, title: "Fragmented ecosystem", desc: "Startups, technologies, and partners in disconnected environments." },
        { icon: Search, title: "Limited tech visibility", desc: "Innovation develops outside traditional corporate and investment pipelines." },
        { icon: Handshake, title: "Inefficient collaboration", desc: "Sourcing, vetting, and engaging startups is slow and inconsistent." },
        { icon: Calendar, title: "No post–demo day support", desc: "Most accelerators fail to provide ongoing execution support." },
        { icon: Users, title: "Limited access to operators", desc: "Founders lack guidance from builders who have scaled companies." },
        { icon: DollarSign, title: "Capital without execution", desc: "Funding deployed without the operational support to drive outcomes." },
      ].map((g, i) => (
        <div key={i} className="tech-card border-0 ring-1 ring-rose-500/30 backdrop-blur-sm rounded-lg p-3 flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
            <g.icon className="h-5 w-5 text-rose-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-rose-300 mb-1">{g.title}</p>
            <p className="text-xs text-slate-300 leading-snug">{g.desc}</p>
          </div>
        </div>
      ))}
    </div>
  </SlideShell>
);

const SolutionSlide = () => (
  <SlideShell kicker="The Solution" kickerColor="bg-teal-500" title="The Solution">
    <p className="text-base md:text-lg text-center text-slate-300 mb-6 max-w-3xl mx-auto leading-relaxed">
      <span className="text-teal-400 font-semibold">Startup Factory Hub</span> unifies the ecosystem — connecting startups, partners, and capital in one integrated platform.
    </p>
    <div className="grid grid-cols-5 gap-3 mb-6">
      {[
        { icon: GraduationCap, label: "Education" },
        { icon: Cpu, label: "Product" },
        { icon: Target, label: "Market" },
        { icon: DollarSign, label: "Revenue" },
        { icon: TrendingUp, label: "Scale" },
      ].map((s, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-teal-500/20 border-2 border-teal-500/60 flex items-center justify-center shadow-[0_0_12px_rgba(20,184,166,0.35)]">
            <s.icon className="h-5 w-5 text-teal-400" />
          </div>
          <span className="text-xs font-bold mt-1.5 text-teal-400">{s.label}</span>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {[
        { icon: Brain, label: "AI Business Intelligence", desc: "Structured insights into startups, markets, and tech enabling smarter collaboration & investment." },
        { icon: Rocket, label: "Integrated Accelerator", desc: "Continuous execution beyond demo day with operator guidance and strategic alignment." },
        { icon: Globe, label: "Hybrid Infrastructure", desc: "Physical hubs unified with a digital layer for seamless collaboration and data flow." },
        { icon: Network, label: "Strategic Ecosystem Access", desc: "Direct connection to startups, technologies, investors, and institutional opportunities." },
      ].map((p, i) => (
        <div key={i} className="tech-card border-0 ring-1 ring-teal-500/30 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-9 h-9 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center">
              <p.icon className="h-4 w-4 text-teal-400" />
            </div>
            <span className="text-sm font-bold text-teal-300">{p.label}</span>
          </div>
          <p className="text-xs text-slate-300 leading-snug">{p.desc}</p>
        </div>
      ))}
    </div>
  </SlideShell>
);

const EcosystemSlide = () => (
  <SlideShell kicker="Ecosystem & Recognition" kickerColor="bg-emerald-500" title="Ecosystem, Partners & Recognition">
    <p className="text-base md:text-lg text-center text-slate-300 mb-6 max-w-3xl mx-auto">
      Backed by industry leaders shaping the future — featured on the iconic <span className="text-emerald-400 font-semibold">NASDAQ Tower</span> in Times Square.
    </p>
    <div className="grid grid-cols-6 gap-2 mb-6">
      {partners.map((p, i) => (
        <div key={i} className="tech-card border-0 ring-1 ring-teal-500/30 backdrop-blur-sm rounded-lg p-2 flex items-center justify-center h-16">
          <img
            src={p.logo}
            alt={p.name}
            className="max-h-10 max-w-[90px] object-contain filter brightness-90"
            onError={(e) => { const el = e.target as HTMLImageElement; el.style.display = 'none'; el.parentElement!.innerHTML = `<span class="text-xs text-slate-400 font-medium">${p.name}</span>`; }}
          />
        </div>
      ))}
    </div>
    <div className="relative rounded-2xl overflow-hidden ring-1 ring-emerald-500/40 flex-1 min-h-[200px]">
      <img src={nasdaqFeature} alt="Startup Factory Hub on NASDAQ Tower" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
      <div className="absolute inset-0 flex flex-col items-center justify-end p-6 text-center">
        <span className="text-xs font-semibold tracking-[0.3em] uppercase text-emerald-400 mb-2">As Featured On</span>
        <h3 className="text-xl md:text-3xl font-bold text-white">NASDAQ Tower · Times Square</h3>
        <p className="text-slate-200 mt-1 text-sm max-w-2xl">Recognized as a leading platform empowering startups worldwide.</p>
      </div>
    </div>
  </SlideShell>
);

const slides = [ProblemSlide, SolutionSlide, EcosystemSlide];

const Elevator = () => {
  const [idx, setIdx] = useState(0);
  const [isFs, setIsFs] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") setIdx((i) => Math.min(i + 1, slides.length - 1));
      if (e.key === "ArrowLeft" || e.key === "PageUp") setIdx((i) => Math.max(i - 1, 0));
      if (e.key === "Escape" && document.fullscreenElement) document.exitFullscreen();
    };
    const onFs = () => setIsFs(!!document.fullscreenElement);
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, []);

  const toggleFs = () => {
    if (!document.fullscreenElement) rootRef.current?.requestFullscreen();
    else document.exitFullscreen();
  };

  return (
    <div ref={rootRef} className="relative w-screen h-screen overflow-hidden bg-slate-950 text-white">
      <div
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ width: `${slides.length * 100}vw`, transform: `translateX(-${idx * 100}vw)` }}
      >
        {slides.map((S, i) => <S key={i} />)}
      </div>

      {/* Controls */}
      <Button
        size="icon"
        variant="ghost"
        onClick={() => setIdx((i) => Math.max(i - 1, 0))}
        disabled={idx === 0}
        className="fixed left-4 top-1/2 -translate-y-1/2 z-50 h-12 w-12 rounded-full tech-card border-0 ring-1 ring-teal-500/30 backdrop-blur-md"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => setIdx((i) => Math.min(i + 1, slides.length - 1))}
        disabled={idx === slides.length - 1}
        className="fixed right-4 top-1/2 -translate-y-1/2 z-50 h-12 w-12 rounded-full tech-card border-0 ring-1 ring-teal-500/30 backdrop-blur-md"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      <Button
        size="icon"
        variant="ghost"
        onClick={toggleFs}
        className="fixed top-4 right-4 z-50 h-10 w-10 rounded-full tech-card border-0 ring-1 ring-teal-500/30 backdrop-blur-md"
        aria-label="Toggle fullscreen"
      >
        {isFs ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
      </Button>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 tech-card border-0 ring-1 ring-teal-500/30 backdrop-blur-md rounded-full px-4 py-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`h-2 rounded-full transition-all ${i === idx ? "w-8 bg-teal-400" : "w-2 bg-slate-600"}`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
        <span className="text-xs text-slate-400 ml-2 tabular-nums">{idx + 1} / {slides.length}</span>
      </div>
    </div>
  );
};

export default Elevator;
