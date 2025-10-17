import { useState } from "react";
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  return (
    <section id="community" className="py-12 sm:py-20 relative overflow-hidden" style={{ perspective: '2000px' }}>
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
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 max-w-6xl mx-auto">
          {userTypes.map((type, index) => (
            <div 
              key={index}
              className="group relative"
              style={{
                transformStyle: 'preserve-3d',
                transform: hoveredIndex === index ? 'rotateY(5deg) rotateX(5deg)' : 'rotateY(0deg) rotateX(0deg)',
                transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)'
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* 3D Shadow layer */}
              <div 
                className="absolute inset-0 bg-ocean-primary/20 rounded-2xl blur-xl"
                style={{
                  transform: 'translateZ(-50px)',
                  opacity: hoveredIndex === index ? 1 : 0,
                  transition: 'opacity 0.6s ease'
                }}
              />
              
              {/* Animated border glow */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-ocean-primary/40 via-ocean-secondary/40 to-ocean-primary/40 rounded-2xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500" 
                style={{ transform: 'translateZ(-10px)' }}
              />
              
              {/* Main card - elevated */}
              <div 
                className="relative glass-morphism p-6 sm:p-8 rounded-2xl border-2 border-ocean-primary/20 group-hover:border-ocean-primary/50 transition-all duration-500"
                style={{
                  transform: 'translateZ(20px)',
                  boxShadow: hoveredIndex === index 
                    ? '0 25px 50px -12px rgba(22, 199, 132, 0.3), inset 0 0 30px rgba(22, 199, 132, 0.1)' 
                    : '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                }}
              >
                {/* Top energy line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-ocean-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="flex items-start space-x-6">
                  {/* 3D Floating Icon */}
                  <div 
                    className="flex-shrink-0"
                    style={{
                      transform: hoveredIndex === index ? 'translateZ(40px) scale(1.1)' : 'translateZ(20px)',
                      transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)'
                    }}
                  >
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                      {/* Outer glowing ring */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-ocean-primary/30 to-ocean-secondary/30 blur-md group-hover:blur-lg transition-all duration-500" />
                      
                      {/* Hexagon container */}
                      <div className="hexagon w-full h-full bg-gradient-to-br from-ocean-primary/20 via-ocean-secondary/20 to-ocean-primary/10 backdrop-blur-sm group-hover:from-ocean-primary/40 group-hover:to-ocean-secondary/40 transition-all duration-500 border-2 border-ocean-primary/40 relative">
                        {/* Icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <type.icon className="w-10 h-10 sm:w-12 sm:h-12 text-ocean-primary drop-shadow-[0_0_10px_rgba(22,199,132,0.5)]" />
                        </div>
                        
                        {/* Rotating orbit ring */}
                        <div className={`absolute inset-[-4px] border-2 border-dashed border-ocean-primary/30 rounded-full ${hoveredIndex === index ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }}>
                          <div className="absolute top-0 left-1/2 w-2 h-2 bg-ocean-secondary rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_rgba(22,199,132,0.8)]" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className="flex-1 min-w-0"
                    style={{
                      transform: 'translateZ(30px)',
                      transition: 'transform 0.6s ease'
                    }}
                  >
                    <h3 className="text-xl sm:text-2xl font-bold mb-3 group-hover:text-ocean-primary transition-colors duration-300">
                      {type.title}
                    </h3>
                    
                    <p className="text-sm sm:text-base text-muted-foreground mb-6 leading-relaxed">
                      {type.description}
                    </p>
                    
                    {/* Features with tech styling */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {type.features.map((feature, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-center text-xs sm:text-sm group/feature"
                          style={{
                            transform: hoveredIndex === index ? `translateZ(${10 + idx * 5}px)` : 'translateZ(0)',
                            transition: 'transform 0.6s ease',
                            transitionDelay: `${idx * 50}ms`
                          }}
                        >
                          <div className="w-2 h-2 bg-ocean-primary rounded-full mr-2 flex-shrink-0 group-hover/feature:shadow-[0_0_10px_rgba(22,199,132,0.8)] transition-all duration-300" />
                          <span className="text-muted-foreground truncate">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      className="w-full bg-gradient-to-r from-ocean-primary to-ocean-secondary hover:from-ocean-secondary hover:to-ocean-primary text-primary-foreground border-0 shadow-[0_0_20px_rgba(22,199,132,0.3)] hover:shadow-[0_0_30px_rgba(22,199,132,0.5)] transition-all duration-300 relative overflow-hidden"
                      onClick={() => navigate("/auth")}
                      style={{
                        transform: 'translateZ(40px)'
                      }}
                    >
                      <span className="relative z-10">Join as {type.title}</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                    </Button>
                  </div>
                </div>
                
                {/* 3D Corner decorations */}
                <div 
                  className="absolute top-4 right-4 w-10 h-10 border-t-2 border-r-2 border-ocean-primary/20 group-hover:border-ocean-primary transition-all duration-300"
                  style={{ transform: 'translateZ(50px)' }}
                />
                <div 
                  className="absolute bottom-4 left-4 w-10 h-10 border-b-2 border-l-2 border-ocean-primary/20 group-hover:border-ocean-primary transition-all duration-300"
                  style={{ transform: 'translateZ(50px)' }}
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