import nasdaqFeature from "@/assets/nasdaq-feature.jpg";
import { MapPin, Award, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const NasdaqFeature = () => {
  return (
    <section className="relative h-screen w-full">
      {/* Full Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${nasdaqFeature})` }}
      />
      
      {/* Overlay Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/40" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
        
        {/* Top Badge */}
        <div className="mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
            <Award className="w-5 h-5 text-cyan-400" />
            <span className="text-white font-semibold tracking-wider uppercase text-sm">
              As Featured On
            </span>
          </div>
        </div>

        {/* Main Title */}
        <div className="text-center mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-200 to-cyan-400 tracking-tight mb-4"
              style={{
                textShadow: '0 0 60px rgba(6, 182, 212, 0.5), 0 0 120px rgba(6, 182, 212, 0.3)',
              }}>
            NASDAQ
          </h2>
          <div className="text-2xl sm:text-3xl md:text-4xl font-light text-white/80 tracking-wide">
            TOWER
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-white/70 text-center max-w-xl mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Startup Factory Hub was proudly displayed on the iconic NASDAQ Tower, 
          reaching millions of viewers worldwide.
        </p>

        {/* Location */}
        <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <MapPin className="w-5 h-5 text-cyan-400" />
          <span className="text-white/80 font-medium">
            Times Square, New York City
          </span>
        </div>

        {/* CTA Button */}
        <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <Button
            size="lg"
            className="px-8 py-6 text-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300 group"
            onClick={() => window.open('https://www.nasdaq.com', '_blank')}
          >
            Learn More
            <ExternalLink className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>

      {/* Stats at Bottom */}
      <div className="absolute bottom-12 left-0 right-0 z-10 animate-fade-in" style={{ animationDelay: '0.5s' }}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-1">1M+</div>
              <div className="text-sm text-white/50 uppercase tracking-wider">Daily Impressions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-1">24/7</div>
              <div className="text-sm text-white/50 uppercase tracking-wider">Global Exposure</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-1">#1</div>
              <div className="text-sm text-white/50 uppercase tracking-wider">Startup Platform</div>
            </div>
          </div>
        </div>
      </div>

      {/* Corner Decorations */}
      <div className="absolute top-8 left-8 w-24 h-24 border-l-2 border-t-2 border-cyan-400/30" />
      <div className="absolute top-8 right-8 w-24 h-24 border-r-2 border-t-2 border-cyan-400/30" />
      <div className="absolute bottom-8 left-8 w-24 h-24 border-l-2 border-b-2 border-cyan-400/30 hidden md:block" />
      <div className="absolute bottom-8 right-8 w-24 h-24 border-r-2 border-b-2 border-cyan-400/30 hidden md:block" />
    </section>
  );
};

export default NasdaqFeature;
