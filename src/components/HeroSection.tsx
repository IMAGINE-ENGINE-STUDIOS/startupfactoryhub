import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import VideoBackground from "./VideoBackground";
const HeroSection = () => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  return <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <VideoBackground />
      
      
      {/* Animated Grid Pattern */}
      <div className="absolute inset-0 z-[2] opacity-20">
        <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(rgba(79, 70, 229, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(79, 70, 229, 0.1) 1px, transparent 1px)`,
        backgroundSize: '50px 50px',
        animation: 'gridMove 20s linear infinite'
      }} />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-12 relative z-10">
        <div className="max-w-7xl mx-auto">
          
          {/* Top Badge */}
          <div className="flex items-center justify-center mb-6 sm:mb-8 animate-fade-in">
            <div className="glass-morphism px-4 sm:px-6 py-2 rounded-full border border-primary/20">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary animate-pulse" />
                <span className="text-primary font-semibold text-xs sm:text-sm tracking-wide">
                  AI-POWERED STARTUP ACCELERATION
                </span>
              </div>
            </div>
          </div>

          {/* Main Heading */}
          <div className="text-center mb-8 sm:mb-12 animate-fade-in" style={{
          animationDelay: '0.1s'
        }}>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 leading-tight tracking-wider">
              <span className="bg-gradient-to-r from-primary via-[#40E0D0] to-primary bg-clip-text text-transparent">
                STARTUP FACTORY HUB
              </span>
            </h1>
            
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">The ultimate social accelerator platform where startups, mentors, accelerators, investors, and students connect in real-time with AI-powered strategies.</p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 sm:mb-16 animate-fade-in" style={{
          animationDelay: '0.2s'
        }}>
            <Button variant="hero" size="xl" className="group w-full sm:w-auto shadow-2xl shadow-primary/20 hover:shadow-primary/40 transition-all" onClick={() => navigate(user ? "/dashboard" : "/auth")}>
              {user ? "Go to Dashboard" : "Start Your Journey"}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button variant="outline" size="xl" className="w-full sm:w-auto glass-morphism border-primary/30 hover:border-primary/50" onClick={() => navigate("/about")}>
              Learn More
            </Button>
            
            <Button variant="outline" size="xl" className="w-full sm:w-auto glass-morphism border-primary/30 hover:border-primary/50" onClick={() => document.getElementById('features')?.scrollIntoView({
            behavior: 'smooth'
          })}>
              Explore Features
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-[3]" />
    </section>;
};
export default HeroSection;