import { Button } from "@/components/ui/button";
import { Rocket, GraduationCap, DollarSign, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";

const userTypes = [
  {
    icon: Rocket,
    title: "Startups",
    description: "Build your dream company with AI-powered roadmaps and instant access to mentors and resources.",
    features: ["Personalized roadmaps", "Mentor matching", "Resource discovery", "Progress tracking"],
    color: "ocean-primary"
  },
  {
    icon: Lightbulb,
    title: "Mentors & Advisors",
    description: "Share your expertise and guide the next generation of entrepreneurs while building your network.",
    features: ["Find promising startups", "Share expertise", "Build network", "Track impact"],
    color: "ocean-secondary"
  },
  {
    icon: DollarSign,
    title: "Investors",
    description: "Discover high-potential startups and connect with founders at the perfect moment.",
    features: ["Deal flow pipeline", "Startup analytics", "Direct connections", "Portfolio tracking"],
    color: "accent"
  },
  {
    icon: GraduationCap,
    title: "Students",
    description: "Learn from real entrepreneurs, gain experience, and find internship opportunities.",
    features: ["Learning resources", "Internship matching", "Skill development", "Career guidance"],
    color: "primary"
  }
];

const CommunitySection = () => {
  const navigate = useNavigate();
  
  return (
    <section id="community" className="py-12 sm:py-20 relative overflow-hidden">
      {/* Radial gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ocean-primary/5 to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
            <span className="text-foreground">Built for</span>{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent animate-gradient">
              Everyone
            </span>
          </h2>
          <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
            Whether you're a founder, mentor, investor, or student, our platform connects you with the right people at the right time.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {userTypes.map((type, index) => (
            <div 
              key={index}
              className="group relative"
            >
              {/* Animated border */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-ocean-primary/40 via-ocean-secondary/40 to-ocean-primary/40 rounded-2xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500" />
              
              {/* Card */}
              <div className="relative glass-morphism p-6 sm:p-8 rounded-2xl transition-all duration-300 group-hover:translate-y-[-4px]">
                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-ocean-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="flex items-start space-x-6">
                  {/* Icon with hexagon shape */}
                  <div className="flex-shrink-0">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                      {/* Hexagon background */}
                      <div className="hexagon w-full h-full bg-gradient-to-br from-ocean-primary/20 to-ocean-secondary/20 group-hover:from-ocean-primary/30 group-hover:to-ocean-secondary/30 transition-all duration-300 border-2 border-ocean-primary/30" />
                      
                      {/* Icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <type.icon className="w-8 h-8 sm:w-10 sm:h-10 text-ocean-primary group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      
                      {/* Pulse effect */}
                      <div className="absolute inset-0 hexagon border-2 border-ocean-primary animate-ping opacity-0 group-hover:opacity-20" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl sm:text-2xl font-bold mb-3 group-hover:text-ocean-primary transition-colors">
                      {type.title}
                    </h3>
                    
                    <p className="text-sm sm:text-base text-muted-foreground mb-6 leading-relaxed">
                      {type.description}
                    </p>
                    
                    {/* Features grid */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {type.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center text-xs sm:text-sm">
                          <div className="w-1.5 h-1.5 bg-ocean-primary rounded-full mr-2 flex-shrink-0 group-hover:animate-pulse" />
                          <span className="text-muted-foreground truncate">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      className="w-full bg-gradient-to-r from-ocean-primary to-ocean-secondary hover:from-ocean-secondary hover:to-ocean-primary text-primary-foreground border-0 group-hover:shadow-[0_0_20px_rgba(22,199,132,0.3)] transition-all duration-300"
                      onClick={() => navigate("/auth")}
                    >
                      Join as {type.title}
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-md" />
                    </Button>
                  </div>
                </div>
                
                {/* Corner decorations */}
                <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-ocean-primary/20 group-hover:border-ocean-primary/60 transition-all duration-300" />
                <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-ocean-primary/20 group-hover:border-ocean-primary/60 transition-all duration-300" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;