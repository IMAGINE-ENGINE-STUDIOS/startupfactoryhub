import { useState } from "react";
import { Brain, Users, MapPin, MessageSquare, Calendar, Target } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Generated Roadmaps",
    description: "Get personalized startup roadmaps powered by advanced AI, tailored to your industry and goals.",
    gradient: "from-cyan-500/20 via-blue-500/20 to-purple-500/20"
  },
  {
    icon: Users,
    title: "Instant Matching",
    description: "Connect with the perfect mentors, investors, and team members through our intelligent matching system.",
    gradient: "from-purple-500/20 via-pink-500/20 to-cyan-500/20"
  },
  {
    icon: MapPin,
    title: "Global Resources",
    description: "Access a comprehensive directory of labs, offices, grants, perks, and events worldwide.",
    gradient: "from-emerald-500/20 via-cyan-500/20 to-blue-500/20"
  },
  {
    icon: MessageSquare,
    title: "Real-Time Communication",
    description: "Seamless messaging and collaboration tools to keep your team and network connected.",
    gradient: "from-blue-500/20 via-indigo-500/20 to-purple-500/20"
  },
  {
    icon: Calendar,
    title: "Event Management",
    description: "Discover and organize startup events, workshops, and networking opportunities.",
    gradient: "from-pink-500/20 via-rose-500/20 to-orange-500/20"
  },
  {
    icon: Target,
    title: "Actionable Milestones",
    description: "Transform any resource into clear, actionable steps with AI-powered recommendations.",
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

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
            <span className="bg-gradient-primary bg-clip-text text-transparent animate-gradient">
              Powerful Features
            </span>
          </h2>
          <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
            Everything you need to accelerate your startup journey, powered by cutting-edge AI technology.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group relative"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Glowing border effect */}
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${feature.gradient} rounded-xl opacity-0 group-hover:opacity-100 blur transition-all duration-500`} />
              
              {/* Card content */}
              <div className="relative glass-morphism p-6 sm:p-8 rounded-xl transition-all duration-300 group-hover:translate-y-[-8px] h-full">
                {/* Animated scan line */}
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${feature.gradient} transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700`} />
                
                {/* Icon container with orbit effect */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-6 mx-auto">
                  {/* Outer rotating ring */}
                  <div className={`absolute inset-0 border-2 border-ocean-primary/30 rounded-full ${hoveredIndex === index ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }}>
                    <div className="absolute top-0 left-1/2 w-2 h-2 bg-ocean-primary rounded-full -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  
                  {/* Inner icon */}
                  <div className={`absolute inset-2 bg-gradient-to-br ${feature.gradient} backdrop-blur-sm rounded-full flex items-center justify-center border border-ocean-primary/20 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-7 h-7 sm:w-9 sm:h-9 text-ocean-primary group-hover:text-ocean-secondary transition-colors" />
                  </div>
                </div>
                
                <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-center group-hover:text-ocean-primary transition-colors">
                  {feature.title}
                </h3>
                
                <p className="text-sm sm:text-base text-muted-foreground text-center leading-relaxed">
                  {feature.description}
                </p>

                {/* Corner accents */}
                <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-ocean-primary/0 group-hover:border-ocean-primary/50 transition-all duration-300" />
                <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-ocean-primary/0 group-hover:border-ocean-primary/50 transition-all duration-300" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;