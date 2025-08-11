import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap } from "lucide-react";

const HeroSection = () => {
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
      
      <div className="container mx-auto px-6 py-20 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <Sparkles className="w-6 h-6 text-ocean-primary mr-2" />
            <span className="text-ocean-primary font-semibold tracking-wide uppercase text-sm">
              AI-Powered Startup Acceleration
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Startup Factory
            </span>
            <br />
            <span className="text-foreground">Hub</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            The ultimate social accelerator platform where startups, mentors, investors, and students 
            connect in real-time with AI-powered roadmaps and instant matching.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
            <Button variant="hero" size="xl" className="group">
              Start Your Journey
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="glass" size="xl">
              <Zap className="w-5 h-5 mr-2" />
              AI Demo
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="glass-morphism p-6 rounded-lg">
              <div className="text-3xl font-bold text-ocean-primary mb-2">10K+</div>
              <div className="text-sm text-muted-foreground">Active Startups</div>
            </div>
            <div className="glass-morphism p-6 rounded-lg">
              <div className="text-3xl font-bold text-ocean-primary mb-2">5K+</div>
              <div className="text-sm text-muted-foreground">Expert Mentors</div>
            </div>
            <div className="glass-morphism p-6 rounded-lg">
              <div className="text-3xl font-bold text-ocean-primary mb-2">2K+</div>
              <div className="text-sm text-muted-foreground">Active Investors</div>
            </div>
            <div className="glass-morphism p-6 rounded-lg">
              <div className="text-3xl font-bold text-ocean-primary mb-2">50M+</div>
              <div className="text-sm text-muted-foreground">Resources</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;