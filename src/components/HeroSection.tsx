import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Rocket, Radio } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import VideoBackground from "./VideoBackground";
import MatrixEffect from "./MatrixEffect";
import sfhMainLogo from "@/assets/sfh-main-logo.png.asset.json";
// Reverse Pitch Event: temporary main-page call to action, shown for 24 hours.
const EVENT_UNTIL = Date.parse("2026-10-10T18:45:00Z");
const HeroSection = () => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  return <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <VideoBackground />

      {/* Matrix Effect — words of wisdom raining over the hero */}
      <div className="absolute inset-0 z-[3] pointer-events-none">
        <MatrixEffect position="absolute" opacity={0.25} />
      </div>
      
      
      
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
          

          {/* Main Logo */}
          <div className="flex justify-center mb-6 sm:mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="relative">
              <div className="absolute -inset-4 sm:-inset-8 rounded-full bg-primary/10 blur-3xl animate-pulse" />
              <img
                src={sfhMainLogo.url}
                alt="Startup Factory Hub"
                className="relative z-10 w-48 sm:w-64 md:w-80 lg:w-96 h-auto drop-shadow-[0_0_60px_hsl(var(--primary)/0.35)]"
              />
            </div>
          </div>

          {/* Main Heading */}
          <div className="text-center mb-8 sm:mb-12 animate-fade-in" style={{
          animationDelay: '0.2s'
        }}>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">Startup Factory Hub is the AI-powered infrastructure layer for the global startup ecosystem.</p>
          </div>

          {/* CTA Buttons */}
          {Date.now() < EVENT_UNTIL ? (
            <div className="flex flex-col items-center justify-center gap-4 mb-12 sm:mb-16 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Button variant="hero" size="xl" className="group w-full sm:w-auto shadow-2xl shadow-primary/20 hover:shadow-primary/40 transition-all" onClick={() => navigate("/live-video?room=main")}>
                <Radio className="w-5 h-5 mr-2 animate-pulse" />
                Join the Reverse Pitch Event
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="xl" className="w-full sm:w-auto glass-morphism border-primary/30 hover:border-primary/50" onClick={() => navigate(user ? "/dashboard" : "/auth")}>
                Go to Dashboard
              </Button>
            </div>
          ) : (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 sm:mb-16 animate-fade-in" style={{
          animationDelay: '0.3s'
        }}>
            <Button variant="hero" size="xl" className="group w-full sm:w-auto shadow-2xl shadow-primary/20 hover:shadow-primary/40 transition-all" onClick={() => navigate(user ? "/dashboard" : "/auth")}>
              {user ? "Go to Dashboard" : "Start Your Journey"}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button variant="outline" size="xl" className="w-full sm:w-auto glass-morphism border-primary/30 hover:border-primary/50" onClick={() => navigate("/about")}>
              Learn More
            </Button>
            
            <Button variant="outline" size="xl" className="w-full sm:w-auto glass-morphism border-primary/30 hover:border-primary/50" onClick={() => navigate("/about#features")}>
              Explore Features
            </Button>

          </div>
          )}
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-[3]" />
    </section>;
};
export default HeroSection;