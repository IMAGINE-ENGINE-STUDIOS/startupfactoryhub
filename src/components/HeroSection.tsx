import { Button } from "@/components/ui/button";
import { ArrowRight, Rocket, Users, TrendingUp, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ParticleNetwork from "./ParticleNetwork";

const HeroSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const stats = [
    { icon: Rocket, value: "500+", label: "Startups" },
    { icon: Users, value: "200+", label: "Mentors" },
    { icon: TrendingUp, value: "$10M+", label: "Invested" },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Particle Network Background */}
      <ParticleNetwork />
      
      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 z-[1]" />
      
      {/* Scan Line Effect */}
      <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
        <div className="scan-line" />
      </div>

      {/* Cyber Grid */}
      <div className="absolute inset-0 z-[1] opacity-[0.03]">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-20 relative z-10">
        <div className="max-w-6xl mx-auto">
          
          {/* Badge */}
          <div className="flex items-center justify-center mb-8 animate-fade-in">
            <div className="cyber-badge px-6 py-2 rounded-full">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-primary font-mono text-xs sm:text-sm tracking-widest uppercase">
                  AI-Powered Acceleration
                </span>
                <Zap className="w-4 h-4 text-primary animate-pulse" />
              </div>
            </div>
          </div>

          {/* Main Headline */}
          <div className="text-center mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 leading-[0.9] tracking-tight">
              <span className="block text-foreground">STARTUP</span>
              <span className="block cyber-text text-primary mt-2">
                FACTORY
              </span>
              <span className="block text-foreground mt-2">HUB</span>
            </h1>
            
            {/* Glowing divider */}
            <div className="flex items-center justify-center gap-4 my-8">
              <div className="h-px w-16 sm:w-24 bg-gradient-to-r from-transparent to-primary" />
              <div className="w-2 h-2 rounded-full bg-primary glow-dot" />
              <div className="h-px w-16 sm:w-24 bg-gradient-to-l from-transparent to-primary" />
            </div>
            
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
              The ultimate social accelerator where startups, mentors, investors, 
              and students connect in real-time with AI-powered tools.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Button 
              size="lg"
              className="group w-full sm:w-auto cyber-button-primary px-8 py-6 text-lg"
              onClick={() => navigate(user ? "/dashboard" : "/auth")}
            >
              <span className="relative z-10 flex items-center gap-2">
                {user ? "Enter Dashboard" : "Launch Your Journey"}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
            
            <Button 
              variant="outline"
              size="lg"
              className="w-full sm:w-auto cyber-button-secondary px-8 py-6 text-lg"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Explore Platform
            </Button>
          </div>

          {/* Stats Bar */}
          <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="cyber-stats-bar max-w-3xl mx-auto">
              <div className="grid grid-cols-3 divide-x divide-primary/20">
                {stats.map((stat, index) => (
                  <div 
                    key={stat.label}
                    className="flex flex-col items-center py-6 px-4 group"
                  >
                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground cyber-number">
                      {stat.value}
                    </span>
                    <span className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider mt-1">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <span className="text-xs uppercase tracking-widest font-mono">Scroll</span>
              <div className="w-6 h-10 rounded-full border-2 border-primary/30 flex items-start justify-center p-2">
                <div className="w-1 h-2 bg-primary rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Corner Accents */}
      <div className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-primary/30 z-10" />
      <div className="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-primary/30 z-10" />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-primary/30 z-10 hidden sm:block" />
      <div className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-primary/30 z-10 hidden sm:block" />
    </section>
  );
};

export default HeroSection;
