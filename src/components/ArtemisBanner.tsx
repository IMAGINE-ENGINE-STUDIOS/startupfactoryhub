import { Shield, Globe, Users, Radio } from "lucide-react";
import artemisBg from "@/assets/artemis-banner-bg.webp";
import nasaLogo from "@/assets/nasa-logo.png";

const ArtemisBanner = () => {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-primary/20" style={{ aspectRatio: "16/7" }}>
      {/* Background Image */}
      <img
        src={artemisBg}
        alt="Artemis astronauts on the Moon"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/40" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary) / 0.5) 1px, transparent 1px),
                            linear-gradient(90deg, hsl(var(--primary) / 0.5) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center p-6 sm:p-8 md:p-12 max-w-2xl">
        {/* NASA Logo + Badge row */}
        <div className="flex items-center gap-3 mb-3">
          <img src={nasaLogo} alt="NASA" className="shrink-0 h-10 sm:h-12 w-10 sm:w-12 object-contain drop-shadow-lg" />
          <div className="glass-morphism px-3 py-1 rounded-full border border-primary/30 flex items-center gap-2">
            <Radio className="w-3 h-3 text-red-500 animate-pulse" />
            <span className="text-primary text-[10px] sm:text-xs font-semibold tracking-[0.2em]">
              OFFICIAL MISSION WATCH PORTAL
            </span>
          </div>
        </div>

        {/* Title */}
        <h2
          className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight tracking-wider mb-2"
          style={{ textShadow: "0 0 20px hsl(var(--primary) / 0.5)" }}
        >
          <span className="bg-gradient-primary bg-clip-text text-transparent">
            Artemis II Online Watch Party
          </span>
        </h2>

        <p className="text-[10px] sm:text-xs text-primary/80 font-semibold tracking-wider mb-3">
          OFFICIAL HOST — STARTUP FACTORY HUB
        </p>

        <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-4 max-w-lg">
          Join the Startup Factory Hub community as we witness humanity's return to the Moon.
          Connect live with founders, mentors, and space enthusiasts worldwide.
        </p>

        {/* Status chips */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
          <span className="glass-morphism border border-primary/20 px-2.5 py-1 rounded-full flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
            <Shield className="w-3 h-3 text-primary" /> SECURE STREAM
          </span>
          <span className="glass-morphism border border-primary/20 px-2.5 py-1 rounded-full flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
            <Globe className="w-3 h-3 text-primary" /> GLOBAL ACCESS
          </span>
          <span className="glass-morphism border border-primary/20 px-2.5 py-1 rounded-full flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
            <Users className="w-3 h-3 text-primary" /> COMMUNITY
          </span>
        </div>

        {/* Date & CTA */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-primary font-bold text-xs sm:text-sm tracking-wider font-mono">
            APRIL 1 · 6:00 PM EST
          </span>
          <a
            href="https://startupfactoryhub.com/artemis-watch-party"
            target="_blank"
            rel="noopener noreferrer"
            className="glass-morphism border border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground px-4 py-2 rounded-lg text-xs sm:text-sm font-bold tracking-wider transition-all duration-300 hover:shadow-glow"
          >
            JOIN LIVE →
          </a>
        </div>
      </div>

      {/* Scan line */}
      <div className="absolute inset-0 scan-effect pointer-events-none" />
    </div>
  );
};

export default ArtemisBanner;
