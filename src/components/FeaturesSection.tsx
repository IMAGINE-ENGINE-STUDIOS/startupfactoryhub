import { useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowUpRight } from "lucide-react";
import {
  JourneyIcon,
  CalendarIcon,
  JobIcon,
  MatchIcon,
  MarketIcon,
  PaperIcon,
  VideoIcon,
  PortfolioIcon,
  GlobalIcon,
  AIIcon,
  SparkMark,
} from "@/components/icons/FeatureIcons";

/* ------------------------------------------------------------------ */
/* Miniature UI snapshots — stylized previews of each tool, pure CSS  */
/* ------------------------------------------------------------------ */

const Snap = ({ children }: { children: React.ReactNode }) => (
  <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden border border-border/60 bg-gradient-to-br from-background/80 to-card/90 p-3 sm:p-4">
    {/* window chrome */}
    <div className="flex items-center gap-1.5 mb-3">
      <span className="w-2 h-2 rounded-full bg-red-400/70" />
      <span className="w-2 h-2 rounded-full bg-amber-400/70" />
      <span className="w-2 h-2 rounded-full bg-emerald-400/70" />
      <span className="ml-2 h-2 w-24 rounded-full bg-muted/60" />
    </div>
    {children}
  </div>
);

const Bar = ({ w, tone = "bg-muted/50" }: { w: string; tone?: string }) => (
  <span className={`block h-1.5 rounded-full ${tone}`} style={{ width: w }} />
);

const JourneySnap = () => (
  <Snap>
    <div className="flex items-end justify-between h-[70%] px-1">
      {[30, 45, 38, 62, 55, 78, 92].map((h, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5">
          <div
            className={`w-4 sm:w-5 rounded-t-md ${i >= 5 ? "bg-gradient-to-t from-primary/60 to-cyan-400/80" : "bg-primary/25"}`}
            style={{ height: `${h}%` }}
          />
          <span className={`w-1.5 h-1.5 rounded-full ${i >= 5 ? "bg-cyan-400" : "bg-muted-foreground/40"}`} />
        </div>
      ))}
    </div>
    <Bar w="55%" tone="bg-primary/40" />
  </Snap>
);

const CalendarSnap = () => (
  <Snap>
    <div className="grid grid-cols-7 gap-1 h-[72%]">
      {Array.from({ length: 21 }).map((_, i) => (
        <div
          key={i}
          className={`rounded-md border border-border/40 ${
            i === 9 ? "bg-primary/70" : i === 12 || i === 16 ? "bg-cyan-400/40" : "bg-muted/30"
          }`}
        />
      ))}
    </div>
    <div className="flex gap-2 mt-1">
      <Bar w="30%" tone="bg-primary/40" />
      <Bar w="20%" tone="bg-cyan-400/40" />
    </div>
  </Snap>
);

const JobSnap = () => (
  <Snap>
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/20 p-2">
          <span className={`w-6 h-6 rounded-lg ${i === 0 ? "bg-primary/50" : "bg-muted/50"}`} />
          <div className="flex-1 space-y-1">
            <Bar w={i === 0 ? "60%" : i === 1 ? "45%" : "52%"} />
            <Bar w="30%" tone="bg-muted/30" />
          </div>
          <span className={`h-4 w-10 rounded-full ${i === 0 ? "bg-primary/60" : "bg-muted/40"}`} />
        </div>
      ))}
    </div>
  </Snap>
);

const MatchSnap = () => (
  <Snap>
    <div className="relative h-[75%]">
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-cyan-400 shadow-lg shadow-primary/40" />
      {[
        "left-[8%] top-[10%]",
        "right-[10%] top-[18%]",
        "left-[14%] bottom-[8%]",
        "right-[16%] bottom-[12%]",
      ].map((pos, i) => (
        <span key={i} className={`absolute ${pos} flex flex-col items-center gap-1`}>
          <span className="w-7 h-7 rounded-full bg-muted/60 border border-primary/30" />
          <span className="h-1 w-8 rounded-full bg-primary/40" />
        </span>
      ))}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 60" preserveAspectRatio="none">
        <line x1="50" y1="30" x2="14" y2="12" stroke="hsl(var(--primary))" strokeOpacity="0.4" strokeWidth="0.8" />
        <line x1="50" y1="30" x2="86" y2="15" stroke="hsl(var(--primary))" strokeOpacity="0.4" strokeWidth="0.8" />
        <line x1="50" y1="30" x2="18" y2="50" stroke="hsl(var(--primary))" strokeOpacity="0.4" strokeWidth="0.8" />
        <line x1="50" y1="30" x2="82" y2="48" stroke="hsl(var(--primary))" strokeOpacity="0.4" strokeWidth="0.8" />
      </svg>
    </div>
  </Snap>
);

const MarketSnap = () => (
  <Snap>
    <svg className="w-full h-[72%]" viewBox="0 0 100 40" preserveAspectRatio="none">
      <defs>
        <linearGradient id="mkt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 34 L14 28 L28 30 L42 20 L56 23 L70 12 L84 15 L100 5 L100 40 L0 40 Z" fill="url(#mkt)" />
      <path d="M0 34 L14 28 L28 30 L42 20 L56 23 L70 12 L84 15 L100 5" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.4" />
      <circle cx="100" cy="5" r="2" fill="#22d3ee" />
    </svg>
    <div className="flex gap-2">
      <Bar w="24%" tone="bg-primary/50" />
      <Bar w="18%" tone="bg-cyan-400/50" />
      <Bar w="28%" tone="bg-muted/40" />
    </div>
  </Snap>
);

const PaperSnap = () => (
  <Snap>
    <div className="flex gap-3 h-[75%]">
      <div className="flex-1 rounded-lg border border-border/40 bg-background/60 p-2 space-y-1.5">
        <Bar w="70%" tone="bg-primary/40" />
        <Bar w="90%" />
        <Bar w="85%" />
        <Bar w="60%" />
        <Bar w="80%" />
      </div>
      <div className="w-16 space-y-1.5">
        <span className="block h-8 rounded-md bg-primary/40" />
        <span className="block h-8 rounded-md bg-muted/40" />
        <span className="block h-8 rounded-md bg-cyan-400/30" />
      </div>
    </div>
  </Snap>
);

const VideoSnap = () => (
  <Snap>
    <div className="grid grid-cols-2 gap-2 h-[72%]">
      <div className="relative rounded-lg bg-gradient-to-br from-primary/40 to-purple-500/30 border border-border/40">
        <span className="absolute bottom-1.5 left-1.5 h-1.5 w-8 rounded-full bg-background/70" />
      </div>
      <div className="grid grid-rows-2 gap-2">
        <div className="rounded-lg bg-muted/40 border border-border/40" />
        <div className="rounded-lg bg-muted/40 border border-border/40" />
      </div>
    </div>
    <div className="flex justify-center gap-2 mt-2">
      <span className="w-6 h-2.5 rounded-full bg-primary/60" />
      <span className="w-6 h-2.5 rounded-full bg-muted/50" />
      <span className="w-6 h-2.5 rounded-full bg-red-400/60" />
    </div>
  </Snap>
);

const PortfolioSnap = () => (
  <Snap>
    <div className="flex gap-3 h-[72%]">
      {[
        ["bg-primary/60", "68%"],
        ["bg-cyan-400/50", "45%"],
        ["bg-purple-400/50", "82%"],
        ["bg-muted/40", "30%"],
      ].map(([tone, h], i) => (
        <div key={i} className="flex-1 flex flex-col justify-end gap-1">
          <div className={`rounded-t-md ${tone}`} style={{ height: h }} />
          <Bar w="100%" tone="bg-muted/30" />
        </div>
      ))}
    </div>
    <div className="flex justify-between mt-2">
      <Bar w="30%" tone="bg-primary/40" />
      <Bar w="18%" tone="bg-emerald-400/50" />
    </div>
  </Snap>
);

const GlobalSnap = () => (
  <Snap>
    <div className="relative h-[75%] flex items-center justify-center">
      <div className="w-24 h-24 rounded-full border border-primary/30 bg-[radial-gradient(circle_at_35%_35%,hsl(var(--primary)/0.35),transparent_70%)]" />
      <span className="absolute w-2 h-2 rounded-full bg-cyan-400 left-[38%] top-[30%] animate-pulse" />
      <span className="absolute w-2 h-2 rounded-full bg-primary left-[58%] top-[48%] animate-pulse" />
      <span className="absolute w-1.5 h-1.5 rounded-full bg-purple-400 left-[46%] top-[62%] animate-pulse" />
      <span className="absolute w-28 h-28 rounded-full border border-dashed border-primary/20 animate-[spin_14s_linear_infinite]" />
    </div>
  </Snap>
);

const AISnap = () => (
  <Snap>
    <div className="space-y-2 h-[75%]">
      <div className="flex gap-2">
        <span className="w-5 h-5 rounded-lg bg-gradient-to-br from-primary to-cyan-400" />
        <div className="flex-1 rounded-lg bg-muted/30 border border-border/40 p-1.5 space-y-1">
          <Bar w="85%" />
          <Bar w="60%" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <div className="w-2/3 rounded-lg bg-primary/20 border border-primary/30 p-1.5 space-y-1">
          <Bar w="75%" tone="bg-primary/40" />
          <Bar w="45%" tone="bg-primary/30" />
        </div>
      </div>
      <div className="flex gap-1.5">
        <span className="h-4 w-12 rounded-full bg-muted/40" />
        <span className="h-4 w-14 rounded-full bg-primary/40" />
        <span className="h-4 w-10 rounded-full bg-cyan-400/40" />
      </div>
    </div>
  </Snap>
);

/* ------------------------------------------------------------------ */
/* Feature data                                                        */
/* ------------------------------------------------------------------ */

const features = [
  {
    icon: JourneyIcon,
    title: "Journey",
    description: "AI roadmaps and guided milestones for every founder.",
    longDescription:
      "A step-by-step operating system for your startup. Journey breaks the path from idea to growth into six structured phases with guided milestones, AI-generated next steps, and progress tracking — so founders always know exactly what to do next.",
    highlights: ["Six-phase founder roadmap", "AI-generated milestones", "Progress & completion tracking"],
    snapshot: JourneySnap,
  },
  {
    icon: CalendarIcon,
    title: "Calendar",
    description: "Unified events, meetings, and deadlines in one place.",
    longDescription:
      "Every event, mentor session, pitch meeting, and program deadline flows into a single unified calendar. Sync with your schedule, get reminders, and never miss a Demo Day, office hour, or investor call again.",
    highlights: ["Unified events & meetings", "RSVP and reminders", "Program deadline tracking"],
    snapshot: CalendarSnap,
  },
  {
    icon: JobIcon,
    title: "Job Posting",
    description: "Connect startups with top talent through our job board.",
    longDescription:
      "Post roles, internships, and volunteering opportunities directly to a community of vetted builders. Startups find co-founders and early hires; talent discovers high-signal opportunities across the ecosystem.",
    highlights: ["Jobs, internships & volunteering", "Direct applicant pipeline", "Talent matched to startup stage"],
    snapshot: JobSnap,
  },
  {
    icon: MatchIcon,
    title: "Smart Matching",
    description: "AI matches you with mentors, investors, and teammates.",
    longDescription:
      "Our matching engine analyzes industry, stage, goals, and expertise to connect you with the mentors, investors, and collaborators most likely to move your startup forward — with transparent compatibility scoring.",
    highlights: ["Mentor & investor matching", "Compatibility scoring", "Industry and stage aware"],
    snapshot: MatchSnap,
  },
  {
    icon: MarketIcon,
    title: "Market Intelligence",
    description: "AI-powered market insights and competitive intelligence.",
    longDescription:
      "Live, internet-grounded research on your market: sizing, trends, competitor movement, and signal analysis. Bayesian network models turn raw data into plain-language insight you can act on with confidence.",
    highlights: ["Live web-grounded research", "Competitive signal tracking", "Plain-language AI summaries"],
    snapshot: MarketSnap,
  },
  {
    icon: PaperIcon,
    title: "LightPaper",
    description: "Create, edit, and sign documents with enterprise tools.",
    longDescription:
      "A full document studio inside the hub: write, format, and paginate unlimited documents, collaborate live, collect signatures, and manage versions — from founder agreements to investor decks and legal docs.",
    highlights: ["Unlimited paginated documents", "Live co-editing & signing", "Enterprise-grade formatting"],
    snapshot: PaperSnap,
  },
  {
    icon: VideoIcon,
    title: "Video Calls",
    description: "Host meetings and pitch sessions with built-in video.",
    longDescription:
      "Built-in video rooms for mentor sessions, investor pitches, and team meetings — no external links needed. Create a room in one click, share it with your network, and host up to hundreds of participants.",
    highlights: ["One-click meeting rooms", "Large event capacity", "Integrated with booking requests"],
    snapshot: VideoSnap,
  },
  {
    icon: PortfolioIcon,
    title: "Portfolio Management",
    description: "Track investments, valuations, and portfolio performance.",
    longDescription:
      "Investors get a live command center for their dealflow: track positions, valuations, and cohort performance across the portfolio, with analytics that surface the startups gaining real traction.",
    highlights: ["Live portfolio tracking", "Valuation & performance analytics", "Cohort-level dealflow view"],
    snapshot: PortfolioSnap,
  },
  {
    icon: GlobalIcon,
    title: "Global Resources",
    description: "Access worldwide startup resources, grants, and opportunities.",
    longDescription:
      "A live global map of grants, programs, technology transfer opportunities, and startup resources — filterable by region and stage, so founders anywhere can find the support built for them.",
    highlights: ["Worldwide resource map", "Grants & program discovery", "Stage and region filters"],
    snapshot: GlobalSnap,
  },
  {
    icon: AIIcon,
    title: "AI Tools",
    description: "Summaries, translation, sentiment, and document analysis.",
    longDescription:
      "Genius, your built-in AI copilot: summarize documents, translate across languages, analyze sentiment, extract data from business cards, and get answers grounded in your workspace — all in one place.",
    highlights: ["Document summaries & analysis", "Translation & sentiment", "Workspace-aware copilot"],
    snapshot: AISnap,
  },
];

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

const FeaturesSection = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const active = activeIndex !== null ? features[activeIndex] : null;

  return (
    <section id="features" className="py-12 sm:py-20 relative overflow-hidden">
      {/* Subtle ambient field */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] h-[60%] bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.10)_0%,transparent_60%)]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-12">

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-primary via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Powerful Features
            </span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to build, grow, and scale your startup — unified in one intelligent hub.
          </p>
          <p className="text-xs text-muted-foreground/70 mt-2">Hover or tap any tool to preview it.</p>
        </div>

        {/* Uniform square wall */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isActive = activeIndex === index;

            return (
              <div
                key={feature.title}
                className="group relative outline-none cursor-pointer"
                tabIndex={0}
                role="button"
                aria-label={`${feature.title} — open preview`}
                aria-haspopup="dialog"
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => setActiveIndex(index)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveIndex(index);
                  }
                }}
              >
                <div
                  className={`
                    tech-card border-0
                    relative flex flex-col items-center justify-center text-center
                    aspect-square w-full h-full
                    p-3 sm:p-4 lg:p-5
                    rounded-2xl
                    bg-gradient-to-br from-card/95 to-card/60
                    backdrop-blur-xl
                    border border-border/50
                    transition-all duration-300 ease-out
                    focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background
                    active:scale-[0.98]
                    ${isActive ? "scale-[1.03] shadow-xl shadow-primary/20 border-primary/40" : "shadow-lg shadow-black/5"}
                  `}
                >
                  {/* Animated energy ring behind icon */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[70%] w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 blur-2xl transition-opacity duration-300 opacity-0 group-hover:opacity-100" />

                  {/* Icon halo */}
                  <div className="relative w-9 h-9 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary/25 to-primary/5 border border-primary/15 mb-2 sm:mb-3 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:border-primary/40">
                    <Icon className="w-4 h-4 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-primary transition-transform duration-300 group-hover:animate-icon-energize" />
                  </div>

                  <h3 className="text-[11px] sm:text-sm lg:text-base font-bold text-foreground mb-1 leading-tight">
                    {feature.title}
                  </h3>

                  <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground leading-snug line-clamp-2 lg:line-clamp-3">
                    {feature.description}
                  </p>

                  {/* Expand affordance */}
                  <span className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowUpRight className="w-3 h-3 text-primary" />
                  </span>

                  {/* Hover glow overlay */}
                  <div
                    className={`absolute inset-0 rounded-2xl pointer-events-none bg-gradient-to-br from-primary/10 via-transparent to-transparent transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-0"}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Snapshot preview — floating glass panel (portal, no backdrop filter over the grid) */}
      {createPortal(
        <AnimatePresence>
          {active && (
            <motion.div
              key="feature-preview"
              className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-3 sm:p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {/* dim layer (no blur filter) */}
              <div className="absolute inset-0 bg-background/70" onClick={() => setActiveIndex(null)} />

              <motion.div
                role="dialog"
                aria-label={`${active.title} preview`}
                className="relative w-full max-w-lg rounded-3xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl shadow-primary/10 overflow-hidden"
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
              >
                {/* header */}
                <div className="flex items-center gap-3 p-4 sm:p-5 pb-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary/25 to-primary/5 border border-primary/20 shrink-0">
                    <active.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-foreground leading-tight">{active.title}</h3>
                    <p className="text-xs text-muted-foreground">{active.description}</p>
                  </div>
                  <button
                    onClick={() => setActiveIndex(null)}
                    aria-label="Close preview"
                    className="ml-auto w-8 h-8 rounded-full bg-muted/40 hover:bg-muted/70 border border-border/50 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                {/* snapshot */}
                <div className="px-4 sm:px-5">
                  <active.snapshot />
                </div>

                {/* long description + highlights */}
                <div className="p-4 sm:p-5 pt-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{active.longDescription}</p>
                  <ul className="mt-3 space-y-1.5">
                    {active.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-2 text-xs text-foreground/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-primary to-cyan-400 shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </section>
  );
};

export default FeaturesSection;
