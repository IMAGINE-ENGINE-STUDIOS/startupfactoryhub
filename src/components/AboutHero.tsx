import { Cpu, Zap, Target } from "lucide-react";
import bannerBg from "@/assets/about-space-bg.jpg.asset.json";

const AboutHero = () => {
  const items = [
    { icon: Cpu, title: "Deep Tech", desc: "AI, Biotech, Quantum" },
    { icon: Zap, title: "Accelerate", desc: "Growth methodology" },
    { icon: Target, title: "Succeed", desc: "Built for success" },
  ];

  return (
    <section id="about" className="relative overflow-hidden border-y border-primary/20">
      {/* Imagery layer */}
      <div className="absolute inset-0">
          <img
            src={bannerBg.url}
            alt="Startup Factory Hub deep tech accelerator"
            className="h-full w-full object-cover"
            loading="lazy"
            width={1920}
            height={1080}
          />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
      </div>

      {/* Full-bleed animated glassmorphic overlay */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Slow-spinning transparent conic sheen */}
        <div className="absolute -inset-1/2 animate-[spin_26s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,hsl(var(--primary)/0.10)_100deg,transparent_200deg,hsl(var(--primary)/0.06)_280deg,transparent_360deg)] opacity-70" />
        {/* Soft radial glows */}
        <div className="absolute right-0 top-0 h-full w-3/4 bg-[radial-gradient(circle_at_75%_25%,hsl(var(--primary)/0.18)_0%,transparent_55%)]" />
        <div className="absolute left-0 bottom-0 h-3/4 w-1/2 bg-[radial-gradient(circle_at_20%_80%,hsl(var(--primary)/0.10)_0%,transparent_50%)]" />
        {/* Fine grid */}
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(hsl(var(--primary))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary))_1px,transparent_1px)] [background-size:44px_44px]" />
        {/* Floating glass orbs */}
        <div className="absolute right-[12%] top-[18%] h-28 w-28 rounded-full bg-primary/[0.10] blur-3xl animate-pulse" />
        <div className="absolute right-[28%] bottom-[22%] h-36 w-36 rounded-full bg-primary/[0.08] blur-3xl animate-pulse [animation-delay:1s]" />
        <div className="absolute right-[6%] bottom-[12%] h-20 w-20 rounded-full bg-primary/[0.12] blur-2xl animate-pulse [animation-delay:2s]" />
        {/* Orbit rings */}
        <div className="absolute right-[20%] top-1/2 h-48 w-48 -translate-y-1/2 rounded-full border border-primary/10" />
        <div className="absolute right-[16%] top-1/2 h-64 w-64 -translate-y-1/2 rounded-full border border-primary/5" />
        {/* Rising bars along the right edge */}
        <div className="absolute inset-x-4 bottom-0 flex items-end justify-end gap-1.5 sm:inset-x-10">
          {[28, 46, 34, 62, 50, 78, 68, 92, 58, 84].map((h, i) => (
            <span
              key={i}
              className="w-2 sm:w-3 rounded-t-sm bg-gradient-to-t from-primary/50 to-primary/20 opacity-50"
              style={{ height: `${h * 0.55}px`, animationDelay: `${i * 120}ms` }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="flex flex-col items-center gap-10 lg:flex-row lg:gap-16">
          {/* Left: text */}
          <div className="flex-1 text-center lg:text-left">
            <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-primary">
              Startup Factory Hub
            </p>
            <h2 className="mt-2 text-2xl font-bold leading-tight tracking-tight sm:text-4xl">
              <span className="bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
                About Startup Factory Hub
              </span>
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Startup Factory Hub is building the <span className="font-medium text-primary">AI-powered infrastructure layer</span> for the global startup ecosystem.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2 lg:justify-start">
              {["Deep Tech", "AI, Biotech, Quantum", "Growth methodology", "Built for success"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Right: key points */}
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 lg:w-auto lg:grid-cols-1">
            {items.map((item) => (
              <div
                key={item.title}
                className="group flex items-center gap-3 rounded-xl border border-primary/20 bg-background/40 p-3 backdrop-blur-md transition-all duration-300 hover:border-primary/40 hover:bg-background/60 sm:flex-col sm:items-start lg:flex-row lg:items-center"
              >
                <div className="min-w-0 text-left sm:text-center lg:text-left">
                  <h3 className="text-sm font-semibold leading-tight">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutHero;
