import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Rocket, GraduationCap, DollarSign, Lightbulb, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import WebGLBackground from "./WebGLBackground";

const userTypes = [
  {
    icon: Rocket,
    title: "Startups",
    description: "Build your dream with AI roadmaps and mentor access.",
    features: ["Roadmaps", "Mentors", "Resources"],
    color: "ocean-primary"
  },
  {
    icon: Lightbulb,
    title: "Mentors",
    description: "Guide entrepreneurs and grow your network.",
    features: ["Find startups", "Share expertise", "Track impact"],
    color: "ocean-secondary"
  },
  {
    icon: DollarSign,
    title: "Investors",
    description: "Discover high-potential startups and founders.",
    features: ["Deal flow", "Analytics", "Connections"],
    color: "accent"
  },
  {
    icon: GraduationCap,
    title: "Students",
    description: "Learn, gain experience, find internships.",
    features: ["Resources", "Internships", "Career growth"],
    color: "primary"
  },
  {
    icon: Building2,
    title: "Accelerators",
    description: "Run cohorts and scale startup programs.",
    features: ["Cohort management", "Portfolio tracking", "Mentor matching"],
    color: "ocean-primary"
  }
];

const CommunitySection = () => {
  const navigate = useNavigate();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  return (
    <section id="community" className="relative overflow-hidden min-h-[700px] sm:min-h-[850px] md:min-h-[900px] flex items-center justify-center" style={{ perspective: '2000px' }}>
      {/* WebGL Globe Background - Centered */}
      <div className="absolute inset-0 opacity-70 flex items-center justify-center">
        <WebGLBackground />
      </div>
      
      {/* Lighter gradient overlay to show more of the globe */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/20 to-background/50" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-10 sm:mb-14">
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
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 max-w-7xl mx-auto">
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
                className="absolute inset-0 bg-ocean-primary/20 rounded-2xl blur-xl"
                style={{
                  transform: 'translateZ(-30px)',
                  opacity: hoveredIndex === index ? 1 : 0,
                  transition: 'opacity 0.6s ease'
                }}
              />
              
              {/* Animated border glow */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-ocean-primary/40 via-ocean-secondary/40 to-ocean-primary/40 rounded-2xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500" 
                style={{ transform: 'translateZ(-10px)' }}
              />
              
              {/* Main card - more transparent */}
              <div 
                className="relative bg-background/40 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-ocean-primary/30 group-hover:border-ocean-primary/60 transition-all duration-500 h-full"
                style={{
                  transform: 'translateZ(20px)',
                  boxShadow: hoveredIndex === index 
                    ? '0 20px 40px -10px rgba(22, 199, 132, 0.4), inset 0 0 30px rgba(22, 199, 132, 0.15)' 
                    : '0 8px 20px -5px rgba(0, 0, 0, 0.2)'
                }}
              >
                {/* Top energy line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-ocean-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-2xl" />
                
                <div className="flex flex-col items-center text-center">
                  {/* 3D Floating Icon */}
                  <div 
                    className="flex-shrink-0 mb-3 sm:mb-4"
                    style={{
                      transform: hoveredIndex === index ? 'translateZ(30px) scale(1.1)' : 'translateZ(10px)',
                      transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)'
                    }}
                  >
                    <div className="relative w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20">
                      {/* Outer glowing ring */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-ocean-primary/40 to-ocean-secondary/40 blur-lg group-hover:blur-xl transition-all duration-500" />
                      
                      {/* Hexagon container */}
                      <div className="hexagon w-full h-full bg-gradient-to-br from-ocean-primary/30 via-ocean-secondary/30 to-ocean-primary/20 backdrop-blur-sm group-hover:from-ocean-primary/50 group-hover:to-ocean-secondary/50 transition-all duration-500 border-2 border-ocean-primary/50 relative">
                        {/* Icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <type.icon className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 text-ocean-primary drop-shadow-[0_0_12px_rgba(22,199,132,0.6)]" />
                        </div>
                        
                        {/* Rotating orbit ring */}
                        <div className={`absolute inset-[-3px] border-2 border-dashed border-ocean-primary/40 rounded-full ${hoveredIndex === index ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }}>
                          <div className="absolute top-0 left-1/2 w-2 h-2 bg-ocean-secondary rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_rgba(22,199,132,0.9)]" />
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
                    <h3 className="text-sm sm:text-lg md:text-xl font-bold mb-1.5 sm:mb-2 group-hover:text-ocean-primary transition-colors duration-300">
                      {type.title}
                    </h3>
                    
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3 leading-relaxed">
                      {type.description}
                    </p>
                    
                    {/* Features with tech styling */}
                    <div className="flex flex-col gap-1 sm:gap-1.5 mb-3 sm:mb-4">
                      {type.features.map((feature, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-center text-[9px] sm:text-xs group/feature justify-center"
                          style={{
                            transform: hoveredIndex === index ? `translateZ(${5 + idx * 3}px)` : 'translateZ(0)',
                            transition: 'transform 0.6s ease',
                            transitionDelay: `${idx * 50}ms`
                          }}
                        >
                          <div className="w-2 h-2 bg-ocean-primary rounded-full mr-2 flex-shrink-0 group-hover/feature:shadow-[0_0_8px_rgba(22,199,132,0.8)] transition-all duration-300" />
                          <span className="text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      size="sm"
                      className="w-full text-xs sm:text-sm py-2 sm:py-2.5 bg-gradient-to-r from-ocean-primary to-ocean-secondary hover:from-ocean-secondary hover:to-ocean-primary text-primary-foreground border-0 shadow-[0_0_15px_rgba(22,199,132,0.4)] hover:shadow-[0_0_25px_rgba(22,199,132,0.6)] transition-all duration-300 relative overflow-hidden"
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
                
                {/* Corner decorations */}
                <div 
                  className="absolute top-2 right-2 w-6 h-6 border-t border-r border-ocean-primary/30 group-hover:border-ocean-primary/70 transition-all duration-300 rounded-tr-lg"
                  style={{ transform: 'translateZ(40px)' }}
                />
                <div 
                  className="absolute bottom-2 left-2 w-6 h-6 border-b border-l border-ocean-primary/30 group-hover:border-ocean-primary/70 transition-all duration-300 rounded-bl-lg"
                  style={{ transform: 'translateZ(40px)' }}
                />
                
                {/* Energy particles */}
                <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                  <div className={`absolute top-1/4 left-1/4 w-1 h-1 bg-ocean-primary rounded-full ${hoveredIndex === index ? 'animate-ping' : 'opacity-0'}`} />
                  <div className={`absolute top-3/4 right-1/4 w-1 h-1 bg-ocean-secondary rounded-full ${hoveredIndex === index ? 'animate-ping' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }} />
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