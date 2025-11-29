import nasdaqFeature from "@/assets/nasdaq-feature.jpg";
import { MapPin, Building2, Award } from "lucide-react";

const NasdaqFeature = () => {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Full-screen Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${nasdaqFeature})` }}
      />
      
      {/* Dark Overlay with Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/40" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/60" />
      
      {/* Scan Line Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="nasdaq-scan-line" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
        
        {/* Badge */}
        <div className="mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20">
            <Award className="w-4 h-4 text-primary" />
            <span className="text-primary font-mono text-xs sm:text-sm tracking-widest uppercase">
              As Featured In
            </span>
          </div>
        </div>

        {/* Main Title with Neon Effect */}
        <div className="text-center mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tighter">
            <span className="nasdaq-neon-text">NASDAQ</span>
          </h2>
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent to-cyan-400" />
            <Building2 className="w-5 h-5 text-cyan-400" />
            <div className="h-px w-12 sm:w-20 bg-gradient-to-l from-transparent to-cyan-400" />
          </div>
        </div>

        {/* Subtitle */}
        <div className="text-center max-w-2xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <p className="text-xl sm:text-2xl md:text-3xl font-light text-white/90 mb-4">
            Startup Factory Hub
          </p>
          <p className="text-base sm:text-lg text-white/60 mb-8">
            Showcased on the world's most iconic digital billboard
          </p>
          
          {/* Location Badge */}
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 backdrop-blur-md border border-white/10">
            <MapPin className="w-5 h-5 text-cyan-400" />
            <span className="text-white/80 font-medium">
              Times Square, New York City
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="grid grid-cols-3 gap-4 sm:gap-8">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white nasdaq-stat-glow">
                1M+
              </div>
              <div className="text-xs sm:text-sm text-white/50 uppercase tracking-wider mt-1">
                Daily Views
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white nasdaq-stat-glow">
                24/7
              </div>
              <div className="text-xs sm:text-sm text-white/50 uppercase tracking-wider mt-1">
                Global Reach
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white nasdaq-stat-glow">
                #1
              </div>
              <div className="text-xs sm:text-sm text-white/50 uppercase tracking-wider mt-1">
                Startup Hub
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Corner Frames */}
      <div className="absolute top-8 left-8 w-20 h-20 border-l-2 border-t-2 border-cyan-400/30" />
      <div className="absolute top-8 right-8 w-20 h-20 border-r-2 border-t-2 border-cyan-400/30" />
      <div className="absolute bottom-8 left-8 w-20 h-20 border-l-2 border-b-2 border-cyan-400/30 hidden sm:block" />
      <div className="absolute bottom-8 right-8 w-20 h-20 border-r-2 border-b-2 border-cyan-400/30 hidden sm:block" />
    </section>
  );
};

export default NasdaqFeature;
