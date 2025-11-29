import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Rocket, GraduationCap, DollarSign, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";
import WebGLBackground from "./WebGLBackground";

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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  return (
    <section id="community" className="py-12 sm:py-20 relative overflow-hidden" style={{ perspective: '2000px' }}>
      {/* WebGL Globe Background */}
      <div className="absolute inset-0 opacity-40">
        <WebGLBackground />
      </div>
      
      {/* Radial gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80" />
      
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
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-6xl mx-auto">
          {userTypes.map((type, index) => (
            <div 
              key={index}
              className="group relative"
              style={{
                transformStyle: 'preserve-3d',
                transform: hoveredIndex === index ? 'rotateY(3deg) rotateX(3deg)' : 'rotateY(0deg) rotateX(0deg)',
                transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)'
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* 3D Shadow layer */}
              <div 
                className="absolute inset-0 bg-ocean-primary/20 rounded-xl blur-lg"
                style={{
                  transform: 'translateZ(-30px)',
                  opacity: hoveredIndex === index ? 1 : 0,
                  transition: 'opacity 0.6s ease'
                }}
              />
              
              {/* Animated border glow */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-ocean-primary/40 via-ocean-secondary/40 to-ocean-primary/40 rounded-xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500" 
                style={{ transform: 'translateZ(-10px)' }}
              />
              
              {/* Main card - elevated */}
              <div 
                className="relative glass-morphism p-3 sm:p-4 rounded-xl border border-ocean-primary/20 group-hover:border-ocean-primary/50 transition-all duration-500 h-full"
                style={{
                  transform: 'translateZ(20px)',
                  boxShadow: hoveredIndex === index 
                    ? '0 15px 30px -8px rgba(22, 199, 132, 0.3), inset 0 0 20px rgba(22, 199, 132, 0.1)' 
                    : '0 5px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              >
                {/* Top energy line */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-ocean-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="flex flex-col items-center text-center">
                  {/* 3D Floating Icon */}
                  <div 
                    className="flex-shrink-0 mb-2 sm:mb-3"
                    style={{
                      transform: hoveredIndex === index ? 'translateZ(30px) scale(1.1)' : 'translateZ(10px)',
                      transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)'
                    }}
                  >
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14">
                      {/* Outer glowing ring */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-ocean-primary/30 to-ocean-secondary/30 blur-md group-hover:blur-lg transition-all duration-500" />
                      
                      {/* Hexagon container */}
                      <div className="hexagon w-full h-full bg-gradient-to-br from-ocean-primary/20 via-ocean-secondary/20 to-ocean-primary/10 backdrop-blur-sm group-hover:from-ocean-primary/40 group-hover:to-ocean-secondary/40 transition-all duration-500 border border-ocean-primary/40 relative">
                        {/* Icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <type.icon className="w-6 h-6 sm:w-7 sm:h-7 text-ocean-primary drop-shadow-[0_0_8px_rgba(22,199,132,0.5)]" />
                        </div>
                        
                        {/* Rotating orbit ring */}
                        <div className={`absolute inset-[-2px] border border-dashed border-ocean-primary/30 rounded-full ${hoveredIndex === index ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }}>
                          <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-ocean-secondary rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_8px_rgba(22,199,132,0.8)]" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className="flex-1 min-w-0"
                    style={{
                      transform: 'translateZ(20px)',
                      transition: 'transform 0.6s ease'
                    }}
                  >
                    <h3 className="text-sm sm:text-base font-bold mb-1 sm:mb-2 group-hover:text-ocean-primary transition-colors duration-300">
                      {type.title}
                    </h3>
                    
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3 leading-relaxed line-clamp-2">
                      {type.description}
                    </p>
                    
                    {/* Features with tech styling - hidden on mobile, compact on desktop */}
                    <div className="hidden sm:flex flex-col gap-1 mb-3">
                      {type.features.slice(0, 2).map((feature, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-center text-[10px] group/feature justify-center"
                          style={{
                            transform: hoveredIndex === index ? `translateZ(${5 + idx * 3}px)` : 'translateZ(0)',
                            transition: 'transform 0.6s ease',
                            transitionDelay: `${idx * 50}ms`
                          }}
                        >
                          <div className="w-1.5 h-1.5 bg-ocean-primary rounded-full mr-1.5 flex-shrink-0 group-hover/feature:shadow-[0_0_6px_rgba(22,199,132,0.8)] transition-all duration-300" />
                          <span className="text-muted-foreground truncate">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      size="sm"
                      className="w-full text-[10px] sm:text-xs py-1.5 sm:py-2 bg-gradient-to-r from-ocean-primary to-ocean-secondary hover:from-ocean-secondary hover:to-ocean-primary text-primary-foreground border-0 shadow-[0_0_12px_rgba(22,199,132,0.3)] hover:shadow-[0_0_20px_rgba(22,199,132,0.5)] transition-all duration-300 relative overflow-hidden"
                      onClick={() => navigate("/auth")}
                      style={{
                        transform: 'translateZ(30px)'
                      }}
                    >
                      <span className="relative z-10">Join</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                    </Button>
                  </div>
                </div>
                
                {/* Energy particles */}
                <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
                  <div className={`absolute top-1/4 left-1/4 w-0.5 h-0.5 bg-ocean-primary rounded-full ${hoveredIndex === index ? 'animate-ping' : 'opacity-0'}`} />
                  <div className={`absolute top-3/4 right-1/4 w-0.5 h-0.5 bg-ocean-secondary rounded-full ${hoveredIndex === index ? 'animate-ping' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;