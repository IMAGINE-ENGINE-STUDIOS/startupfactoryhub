import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const HeroSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Hexagonal background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="grid grid-cols-8 gap-4 transform rotate-12 scale-150">
          {Array.from({ length: 64 }).map((_, i) => (
            <div
              key={i}
              className="hexagon w-16 h-16 bg-gradient-primary opacity-20"
              style={{
                animationDelay: `${i * 0.1}s`,
                animation: "pulse 2s ease-in-out infinite"
              }}
            />
          ))}
        </div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-4 sm:mb-6">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-ocean-primary mr-2" />
            <span className="text-ocean-primary font-semibold tracking-wide uppercase text-xs sm:text-sm">
              AI-Powered Startup Acceleration
            </span>
          </div>
          
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-6 sm:mb-8 leading-tight px-4">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Startup Factory
            </span>
            <br />
            <span className="text-foreground">Hub</span>
          </h1>
          
          <p className="text-base sm:text-xl md:text-2xl text-muted-foreground mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
            The ultimate social accelerator platform where startups, mentors, investors, and students 
            connect in real-time with AI-powered roadmaps and instant matching.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-12 sm:mb-16 px-4">
            <Button 
              variant="hero" 
              size="xl" 
              className="group w-full sm:w-auto"
              onClick={() => navigate(user ? "/dashboard" : "/auth")}
            >
              {user ? "Go to Dashboard" : "Start Your Journey"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 md:gap-8 text-center px-4">
            <div className="glass-morphism p-3 sm:p-4 md:p-6 rounded-lg">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-ocean-primary mb-1 sm:mb-2">10K+</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Active Startups</div>
            </div>
            <div className="glass-morphism p-3 sm:p-4 md:p-6 rounded-lg">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-ocean-primary mb-1 sm:mb-2">5K+</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Expert Mentors</div>
            </div>
            <div className="glass-morphism p-3 sm:p-4 md:p-6 rounded-lg">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-ocean-primary mb-1 sm:mb-2">2K+</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Active Investors</div>
            </div>
            <div className="glass-morphism p-3 sm:p-4 md:p-6 rounded-lg">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-ocean-primary mb-1 sm:mb-2">50M+</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Resources</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;