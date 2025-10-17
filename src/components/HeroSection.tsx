import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, Users, MapPin, MessageSquare, Calendar, Target, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import WebGLBackground from "./WebGLBackground";

const features = [
  {
    icon: Brain,
    title: "AI Roadmaps",
    description: "Personalized startup roadmaps powered by AI"
  },
  {
    icon: Users,
    title: "Instant Matching",
    description: "Connect with mentors & investors instantly"
  },
  {
    icon: MapPin,
    title: "Global Resources",
    description: "Access labs, grants & events worldwide"
  },
  {
    icon: MessageSquare,
    title: "Real-Time Chat",
    description: "Seamless communication tools"
  },
  {
    icon: Calendar,
    title: "Event Management",
    description: "Organize & discover opportunities"
  },
  {
    icon: Target,
    title: "Smart Milestones",
    description: "AI-powered actionable steps"
  }
];

const HeroSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* WebGL Background */}
      <WebGLBackground />
      
      {/* Background Image Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background/95 to-background/90 z-[1]" />
      
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
          <div className="text-center mb-8 sm:mb-12 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-4 sm:mb-6 leading-tight">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
                Startup Factory
              </span>
              <br />
              <span className="text-foreground">Hub</span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
              The ultimate social accelerator platform where startups, mentors, investors, and students 
              connect in real-time with AI-powered tools.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 sm:mb-16 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Button 
              variant="hero" 
              size="xl" 
              className="group w-full sm:w-auto shadow-2xl shadow-primary/20 hover:shadow-primary/40 transition-all" 
              onClick={() => navigate(user ? "/dashboard" : "/auth")}
            >
              {user ? "Go to Dashboard" : "Start Your Journey"}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button 
              variant="outline" 
              size="xl" 
              className="w-full sm:w-auto glass-morphism border-primary/30 hover:border-primary/50" 
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Explore Features
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="glass-morphism p-6 rounded-2xl border border-primary/10 hover:border-primary/30 transition-all duration-300 group hover:scale-105 animate-fade-in"
                style={{ animationDelay: `${0.3 + index * 0.1}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-bold mb-1 text-foreground group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Stats Bar */}
          <div className="mt-12 sm:mt-16 flex flex-wrap items-center justify-center gap-8 sm:gap-12 animate-fade-in" style={{ animationDelay: '0.9s' }}>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">10K+</div>
              <div className="text-sm text-muted-foreground mt-1">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">500+</div>
              <div className="text-sm text-muted-foreground mt-1">Startups Launched</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">$50M+</div>
              <div className="text-sm text-muted-foreground mt-1">Funding Raised</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">98%</div>
              <div className="text-sm text-muted-foreground mt-1">Success Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-[3]" />
    </section>
  );
};

export default HeroSection;
