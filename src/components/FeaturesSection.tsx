import { useState } from "react";
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

const features = [
  {
    icon: JourneyIcon,
    title: "Journey",
    description: "AI roadmaps and guided milestones for every founder.",
  },
  {
    icon: CalendarIcon,
    title: "Calendar",
    description: "Unified events, meetings, and deadlines in one place.",
  },
  {
    icon: JobIcon,
    title: "Job Posting",
    description: "Connect startups with top talent through our job board.",
  },
  {
    icon: MatchIcon,
    title: "Smart Matching",
    description: "AI matches you with mentors, investors, and teammates.",
  },
  {
    icon: MarketIcon,
    title: "Market Intelligence",
    description: "AI-powered market insights and competitive intelligence.",
  },
  {
    icon: PaperIcon,
    title: "LightPaper",
    description: "Create, edit, and sign documents with enterprise tools.",
  },
  {
    icon: VideoIcon,
    title: "Video Calls",
    description: "Host meetings and pitch sessions with built-in video.",
  },
  {
    icon: PortfolioIcon,
    title: "Portfolio Management",
    description: "Track investments, valuations, and portfolio performance.",
  },
  {
    icon: GlobalIcon,
    title: "Global Resources",
    description: "Access worldwide startup resources, grants, and opportunities.",
  },
  {
    icon: AIIcon,
    title: "AI Tools",
    description: "Summaries, translation, sentiment, and document analysis.",
  },
];


const FeaturesSection = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section id="features" className="py-12 sm:py-20 relative overflow-hidden">
      {/* Subtle ambient field */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] h-[60%] bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.10)_0%,transparent_60%)]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
            <SparkMark className="w-3.5 h-3.5" />
            Platform Capabilities
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-primary via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Powerful Features
            </span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to build, grow, and scale your startup — unified in one intelligent hub.
          </p>
        </div>

        {/* Uniform square wall */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={feature.title}
                className="group relative"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
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
                    ${isHovered ? "scale-[1.03] shadow-xl shadow-primary/20 border-primary/40" : "shadow-lg shadow-black/5"}
                  `}
                >
                  {/* Icon halo */}
                  <div
                    className={`
                      w-9 h-9 sm:w-12 sm:h-12 lg:w-14 lg:h-14
                      rounded-2xl
                      flex items-center justify-center
                      bg-gradient-to-br from-primary/25 to-primary/5
                      border border-primary/15
                      mb-2 sm:mb-3
                      transition-transform duration-300
                      ${isHovered ? "scale-110 rotate-3" : "scale-100 rotate-0"}
                    `}
                  >
                    <Icon className="w-4 h-4 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-primary" />
                  </div>

                  {/* Title */}
                  <h3 className="text-[11px] sm:text-sm lg:text-base font-bold text-foreground mb-1 leading-tight">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground leading-snug line-clamp-2 sm:line-clamp-2 lg:line-clamp-3">
                    {feature.description}
                  </p>

                  {/* Hover glow overlay */}
                  <div
                    className={`
                      absolute inset-0 rounded-2xl pointer-events-none
                      bg-gradient-to-br from-primary/10 via-transparent to-transparent
                      transition-opacity duration-300
                      ${isHovered ? "opacity-100" : "opacity-0"}
                    `}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
