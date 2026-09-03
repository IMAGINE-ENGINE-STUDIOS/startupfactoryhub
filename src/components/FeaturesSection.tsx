import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
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
} from "@/components/icons/FeatureIcons";

/* ------------------------------------------------------------------ */
/* Real product screenshots captured from the live application         */
/* ------------------------------------------------------------------ */
import shotJourney from "@/assets/features/journey.jpg";
import shotCalendar from "@/assets/features/calendar.jpg";
import shotJobs from "@/assets/features/jobs.jpg";
import shotMatching from "@/assets/features/matching.jpg";
import shotMarket from "@/assets/features/market.jpg";
import shotLightPaper from "@/assets/features/lightpaper.jpg";
import shotVideo from "@/assets/features/video.jpg";
import shotPortfolio from "@/assets/features/portfolio.jpg";
import shotResources from "@/assets/features/resources.jpg";
import shotAITools from "@/assets/features/ai-tools.jpg";

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
    image: shotJourney,
  },
  {
    icon: CalendarIcon,
    title: "Calendar",
    description: "Unified events, meetings, and deadlines in one place.",
    longDescription:
      "Every event, mentor session, pitch meeting, and program deadline flows into a single unified calendar. Sync with your schedule, get reminders, and never miss a Demo Day, office hour, or investor call again.",
    highlights: ["Unified events & meetings", "RSVP and reminders", "Program deadline tracking"],
    image: shotCalendar,
  },
  {
    icon: JobIcon,
    title: "Job Posting",
    description: "Connect startups with top talent through our job board.",
    longDescription:
      "Post roles, internships, and volunteering opportunities directly to a community of vetted builders. Startups find co-founders and early hires; talent discovers high-signal opportunities across the ecosystem.",
    highlights: ["Jobs, internships & volunteering", "Direct applicant pipeline", "Talent matched to startup stage"],
    image: shotJobs,
  },
  {
    icon: MatchIcon,
    title: "Smart Matching",
    description: "AI matches you with mentors, investors, and teammates.",
    longDescription:
      "Our matching engine analyzes industry, stage, goals, and expertise to connect you with the mentors, investors, and collaborators most likely to move your startup forward — with transparent compatibility scoring.",
    highlights: ["Mentor & investor matching", "Compatibility scoring", "Industry and stage aware"],
    image: shotMatching,
  },
  {
    icon: MarketIcon,
    title: "Market Intelligence",
    description: "AI-powered market insights and competitive intelligence.",
    longDescription:
      "Live, internet-grounded research on your market: sizing, trends, competitor movement, and signal analysis. Bayesian network models turn raw data into plain-language insight you can act on with confidence.",
    highlights: ["Live web-grounded research", "Competitive signal tracking", "Plain-language AI summaries"],
    image: shotMarket,
  },
  {
    icon: PaperIcon,
    title: "LightPaper",
    description: "Create, edit, and sign documents with enterprise tools.",
    longDescription:
      "A full document studio inside the hub: write, format, and paginate unlimited documents, collaborate live, collect signatures, and manage versions — from founder agreements to investor decks and legal docs.",
    highlights: ["Unlimited paginated documents", "Live co-editing & signing", "Enterprise-grade formatting"],
    image: shotLightPaper,
  },
  {
    icon: VideoIcon,
    title: "Video Calls",
    description: "Host meetings and pitch sessions with built-in video.",
    longDescription:
      "Built-in video rooms for mentor sessions, investor pitches, and team meetings — no external links needed. Create a room in one click, share it with your network, and host up to hundreds of participants.",
    highlights: ["One-click meeting rooms", "Large event capacity", "Integrated with booking requests"],
    image: shotVideo,
  },
  {
    icon: PortfolioIcon,
    title: "Portfolio Management",
    description: "Track investments, valuations, and portfolio performance.",
    longDescription:
      "Investors get a live command center for their dealflow: track positions, valuations, and cohort performance across the portfolio, with analytics that surface the startups gaining real traction.",
    highlights: ["Live portfolio tracking", "Valuation & performance analytics", "Cohort-level dealflow view"],
    image: shotPortfolio,
  },
  {
    icon: GlobalIcon,
    title: "Global Resources",
    description: "Access worldwide startup resources, grants, and opportunities.",
    longDescription:
      "A live global map of grants, programs, technology transfer opportunities, and startup resources — filterable by region and stage, so founders anywhere can find the support built for them.",
    highlights: ["Worldwide resource map", "Grants & program discovery", "Stage and region filters"],
    image: shotResources,
  },
  {
    icon: AIIcon,
    title: "AI Tools",
    description: "Summaries, translation, sentiment, and document analysis.",
    longDescription:
      "Genius, your built-in AI copilot: summarize documents, translate across languages, analyze sentiment, extract data from business cards, and get answers grounded in your workspace — all in one place.",
    highlights: ["Document summaries & analysis", "Translation & sentiment", "Workspace-aware copilot"],
    image: shotAITools,
  },
];

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

/** localStorage flag — the preview auto-opens only once, ever. */
const AUTO_OPEN_KEY = "sfh_feature_preview_autoopened";

const FeaturesSection = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const active = activeIndex !== null ? features[activeIndex] : null;

  // Auto-open the first feature preview exactly once. After the user closes
  // it, the popup only re-opens when a feature icon is explicitly clicked.
  useEffect(() => {
    try {
      if (window.localStorage.getItem(AUTO_OPEN_KEY)) return;
      window.localStorage.setItem(AUTO_OPEN_KEY, "1");
    } catch {
      /* storage blocked — still auto-open this visit */
    }
    const id = window.setTimeout(() => setActiveIndex(0), 1200);
    return () => window.clearTimeout(id);
  }, []);

  /** Move sideways through the feature previews (wraps around). */
  const step = useCallback((dir: 1 | -1) => {
    setActiveIndex((current) => {
      if (current === null) return current;
      return (current + dir + features.length) % features.length;
    });
  }, []);

  // Keyboard navigation while the preview is open
  useEffect(() => {
    if (activeIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "Escape") setActiveIndex(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, step]);

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
          <p className="text-xs text-muted-foreground/70 mt-2">
            Click any tool to see a real screenshot — use the arrows to browse.
          </p>
        </div>

        {/* 3D block wall */}
        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-7"
          style={{ perspective: "1400px" }}
        >
          {features.map((feature, index) => (
            <FeatureBlock
              key={feature.title}
              feature={feature}
              index={index}
              isActive={activeIndex === index}
              onOpen={() => setActiveIndex(index)}
            />
          ))}
        </div>
      </div>

      {/* Screenshot preview — floating glass panel (portal, no backdrop filter over the grid) */}
      {createPortal(
        <AnimatePresence>
          {active && activeIndex !== null && (
            <motion.div
              key="feature-preview"
              className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-3 sm:p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* dim layer (no blur filter) */}
              <div className="absolute inset-0 bg-background/70" onClick={() => setActiveIndex(null)} />

              {/* Side arrows — desktop */}
              <button
                onClick={() => step(-1)}
                aria-label="Previous feature"
                className="hidden sm:flex absolute left-4 lg:left-10 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-card/90 border border-border/60 hover:border-primary/50 hover:bg-card items-center justify-center shadow-xl transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
              <button
                onClick={() => step(1)}
                aria-label="Next feature"
                className="hidden sm:flex absolute right-4 lg:right-10 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-card/90 border border-border/60 hover:border-primary/50 hover:bg-card items-center justify-center shadow-xl transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-foreground" />
              </button>

              <motion.div
                role="dialog"
                aria-label={`${active.title} preview`}
                className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-3xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl shadow-primary/10"
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
                    className="ml-auto w-8 h-8 rounded-full bg-muted/40 hover:bg-muted/70 border border-border/50 flex items-center justify-center transition-colors shrink-0"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                {/* real screenshot */}
                <div className="px-4 sm:px-5">
                  <div className="relative rounded-xl overflow-hidden border border-border/60 bg-background/60">
                    <motion.img
                      key={active.title}
                      src={active.image}
                      alt={`${active.title} screenshot from the Startup Factory Hub platform`}
                      loading="lazy"
                      className="w-full h-auto block"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.25 }}
                    />
                  </div>
                </div>

                {/* mobile arrows + counter */}
                <div className="flex items-center justify-between gap-3 px-4 sm:px-5 pt-3">
                  <button
                    onClick={() => step(-1)}
                    aria-label="Previous feature"
                    className="sm:hidden w-9 h-9 rounded-full bg-muted/40 border border-border/50 flex items-center justify-center"
                  >
                    <ChevronLeft className="w-4 h-4 text-foreground" />
                  </button>
                  <span className="text-[11px] text-muted-foreground mx-auto">
                    {activeIndex + 1} / {features.length}
                  </span>
                  <button
                    onClick={() => step(1)}
                    aria-label="Next feature"
                    className="sm:hidden w-9 h-9 rounded-full bg-muted/40 border border-border/50 flex items-center justify-center"
                  >
                    <ChevronRight className="w-4 h-4 text-foreground" />
                  </button>
                </div>

                {/* long description + highlights */}
                <div className="p-4 sm:p-5 pt-3">
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
