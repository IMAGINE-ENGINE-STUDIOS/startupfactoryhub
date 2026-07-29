import { useState, useEffect } from "react";
import { Map, Calendar, Briefcase, Sparkles, TrendingUp, FileText, Video, PieChart, Globe, Bot, ChevronDown } from "lucide-react";

const features = [
  {
    icon: Map,
    title: "Journey",
    description: "Track progress with AI-generated roadmaps and guided milestones.",
    gradient: "from-cyan-500/20 via-blue-500/20 to-purple-500/20"
  },
  {
    icon: Calendar,
    title: "Calendar",
    description: "Manage events, meetings, and deadlines in one unified calendar.",
    gradient: "from-purple-500/20 via-pink-500/20 to-cyan-500/20"
  },
  {
    icon: Briefcase,
    title: "Job Posting",
    description: "Connect startups with talent through our comprehensive job board.",
    gradient: "from-emerald-500/20 via-cyan-500/20 to-blue-500/20"
  },
  {
    icon: Sparkles,
    title: "Smart Matching",
    description: "AI matches you with perfect mentors, investors, and team members.",
    gradient: "from-blue-500/20 via-indigo-500/20 to-purple-500/20"
  },
  {
    icon: TrendingUp,
    title: "Market Intelligence",
    description: "AI-powered market insights and competitive intelligence.",
    gradient: "from-pink-500/20 via-rose-500/20 to-orange-500/20"
  },
  {
    icon: FileText,
    title: "LightPaper",
    description: "Create, edit, and sign documents with enterprise-grade tools.",
    gradient: "from-blue-500/20 via-indigo-500/20 to-purple-500/20"
  },
  {
    icon: Video,
    title: "Video Calls",
    description: "Host meetings and pitch sessions with built-in video conferencing.",
    gradient: "from-red-500/20 via-orange-500/20 to-yellow-500/20"
  },
  {
    icon: PieChart,
    title: "Portfolio Management",
    description: "Track investments, valuations, and portfolio performance.",
    gradient: "from-green-500/20 via-emerald-500/20 to-teal-500/20"
  },
  {
    icon: Globe,
    title: "Global Resources",
    description: "Access worldwide startup resources, grants, and opportunities.",
    gradient: "from-violet-500/20 via-purple-500/20 to-fuchsia-500/20"
  },
  {
    icon: Bot,
    title: "AI Tools",
    description: "Summaries, translation, sentiment, and document analysis in one suite.",
    gradient: "from-cyan-500/20 via-teal-500/20 to-emerald-500/20"
  }
];
const FeaturesSection = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  
  return (
    <section id="features" className="py-10 sm:py-14 relative overflow-hidden">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(hsl(var(--ocean-border)) 1px, transparent 1px), 
                             linear-gradient(90deg, hsl(var(--ocean-border)) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          animation: 'gridMove 20s linear infinite'
        }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 bg-gradient-to-r from-primary via-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Powerful Features
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Everything you need to build, grow, and scale your startup
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 items-start">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isHovered = hoveredIndex === index;
            const isExpanded = expandedIndex === index;

            return (
              <div
                key={feature.title}
                className="group relative"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Card */}
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  className={`
                    w-full text-left relative h-full p-3 sm:p-5 rounded-xl
                    bg-gradient-to-br ${feature.gradient}
                    backdrop-blur-xl border transition-all duration-300 ease-out
                    ${isExpanded ? 'border-primary/50 shadow-lg shadow-primary/20' : 'border-border/50'}
                    ${isHovered && !isExpanded ? 'scale-[1.02] shadow-lg shadow-primary/20' : 'scale-100'}
                  `}
                >
                  {/* Icon */}
                  <div className={`
                    w-8 h-8 sm:w-11 sm:h-11 rounded-lg mb-2 sm:mb-3
                    bg-gradient-to-br from-primary/20 to-primary/5
                    flex items-center justify-center
                    transition-all duration-300
                    ${isHovered || isExpanded ? 'scale-110 rotate-6' : 'scale-100 rotate-0'}
                  `}>
                    <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
                  </div>

                  {/* Content */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs sm:text-base font-bold mb-1 sm:mb-1.5 text-foreground">
                      {feature.title}
                    </h3>
                    <ChevronDown
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-primary' : ''}`}
                    />
                  </div>
                  <p className={`text-[10px] sm:text-sm text-muted-foreground leading-snug sm:leading-relaxed transition-all duration-300 ${isExpanded ? '' : 'line-clamp-2'}`}>
                    {feature.description}
                  </p>

                  {/* Hover Glow Effect */}
                  <div className={`
                    absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 to-transparent
                    transition-opacity duration-300 pointer-events-none
                    ${isHovered || isExpanded ? 'opacity-100' : 'opacity-0'}
                  `} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
export default FeaturesSection;