import { useState } from "react";
import { Map, Calendar, Briefcase, Sparkles, TrendingUp, Brain } from "lucide-react";

const features = [
  {
    icon: Map,
    title: "Journey",
    description: "Track your startup's progress with personalized AI-generated roadmaps and guided milestones tailored to your goals.",
    gradient: "from-cyan-500/20 via-blue-500/20 to-purple-500/20"
  },
  {
    icon: Calendar,
    title: "Calendar",
    description: "Manage all your events, meetings, mentoring sessions, and deadlines in one unified calendar.",
    gradient: "from-purple-500/20 via-pink-500/20 to-cyan-500/20"
  },
  {
    icon: Briefcase,
    title: "Job Posting",
    description: "Connect startups with talent through our comprehensive job board for full-time, part-time, and advisory roles.",
    gradient: "from-emerald-500/20 via-cyan-500/20 to-blue-500/20"
  },
  {
    icon: Sparkles,
    title: "Smart Matching",
    description: "Our intelligent algorithm matches you with the perfect mentors, investors, and team members based on your needs.",
    gradient: "from-blue-500/20 via-indigo-500/20 to-purple-500/20"
  },
  {
    icon: TrendingUp,
    title: "Market Intelligence",
    description: "Access AI-powered market insights, industry trends, and competitive intelligence to stay ahead.",
    gradient: "from-pink-500/20 via-rose-500/20 to-orange-500/20"
  },
  {
    icon: Brain,
    title: "AI Recommendations",
    description: "Get personalized AI-powered recommendations for mentors, investors, resources, and next steps tailored to your startup journey.",
    gradient: "from-orange-500/20 via-amber-500/20 to-yellow-500/20"
  }
];
const FeaturesSection = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  return (
    <section id="features" className="py-12 sm:py-20 relative overflow-hidden">
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
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Powerful Features
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to build, grow, and scale your startup in one platform
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
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
                {/* Card */}
                <div className={`
                  h-full p-6 sm:p-8 rounded-2xl
                  bg-gradient-to-br ${feature.gradient}
                  backdrop-blur-xl border border-border/50
                  transition-all duration-300 ease-out
                  ${isHovered ? 'scale-105 shadow-2xl shadow-primary/20' : 'scale-100'}
                `}>
                  {/* Icon */}
                  <div className={`
                    w-14 h-14 rounded-xl mb-5
                    bg-gradient-to-br from-primary/20 to-primary/5
                    flex items-center justify-center
                    transition-all duration-300
                    ${isHovered ? 'scale-110 rotate-6' : 'scale-100 rotate-0'}
                  `}>
                    <Icon className="w-7 h-7 text-primary" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Hover Glow Effect */}
                  <div className={`
                    absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent
                    transition-opacity duration-300 pointer-events-none
                    ${isHovered ? 'opacity-100' : 'opacity-0'}
                  `} />
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