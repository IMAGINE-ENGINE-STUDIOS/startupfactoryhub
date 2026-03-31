import { useRef, useCallback } from "react";
import { Shield, Globe, Users, Radio, Download, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import artemisBg from "@/assets/artemis-banner-bg.webp";
import nasaLogo from "@/assets/nasa-logo.png";
import html2canvas from "html2canvas";

const ArtemisMarketingBanner = () => {
  const bannerRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(async (format: "png" | "jpg") => {
    if (!bannerRef.current) return;
    try {
      toast.info("Rendering banner...");
      const canvas = await html2canvas(bannerRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0D0D0D",
      });
      const link = document.createElement("a");
      link.download = `artemis-watch-party-banner.${format}`;
      link.href = canvas.toDataURL(format === "jpg" ? "image/jpeg" : "image/png", 0.95);
      link.click();
      toast.success(`Downloaded as ${format.toUpperCase()}`);
    } catch {
      toast.error("Failed to render banner");
    }
  }, []);

  return (
    <div>
      <div className="tech-card border-0 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Artemis II Watch Party Banner</h2>
            <p className="text-muted-foreground text-sm">
              Official mission portal banner for the Artemis II Online Watch Party event.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleDownload("png")} className="gap-2">
              <Download className="h-4 w-4" />
              PNG
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDownload("jpg")} className="gap-2">
              <Image className="h-4 w-4" />
              JPG
            </Button>
          </div>
        </div>
      </div>

      <div className="tech-card border-0 p-4 overflow-hidden">
        <div ref={bannerRef} className="relative w-full overflow-hidden rounded-lg" style={{ aspectRatio: "16/7" }}>
          {/* Background Image */}
          <img
            src={artemisBg}
            alt="Artemis astronauts on the Moon"
            className="absolute inset-0 w-full h-full object-cover"
            crossOrigin="anonymous"
          />

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D0D]/95 via-[#0D0D0D]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D]/80 via-transparent to-[#0D0D0D]/40" />

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
              <img src={nasaLogo} alt="NASA" className="shrink-0 h-10 sm:h-12 w-10 sm:w-12 object-contain" crossOrigin="anonymous" style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.5))" }} />
              <div className="bg-[#0D0D0D]/60 backdrop-blur-md px-3 py-1 rounded-full border border-primary/30 flex items-center gap-2">
                <Radio className="w-3 h-3 text-red-500" />
                <span className="text-primary text-[10px] sm:text-xs font-semibold tracking-[0.2em]">
                  OFFICIAL MISSION WATCH PORTAL
                </span>
              </div>
            </div>

            <h2
              className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight tracking-wider mb-2 text-primary"
              style={{ textShadow: "0 0 20px hsl(var(--primary) / 0.5)" }}
            >
              Artemis II Online Watch Party
            </h2>

            <p className="text-[10px] sm:text-xs text-primary/80 font-semibold tracking-wider mb-3">
              OFFICIAL HOST — STARTUP FACTORY HUB
            </p>

            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-4 max-w-lg">
              Join the Startup Factory Hub community as we witness humanity's return to the Moon.
              Connect live with founders, mentors, and space enthusiasts worldwide.
            </p>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
              <span className="bg-[#0D0D0D]/50 backdrop-blur-sm border border-primary/20 px-2.5 py-1 rounded-full flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
                <Shield className="w-3 h-3 text-primary" /> SECURE STREAM
              </span>
              <span className="bg-[#0D0D0D]/50 backdrop-blur-sm border border-primary/20 px-2.5 py-1 rounded-full flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
                <Globe className="w-3 h-3 text-primary" /> GLOBAL ACCESS
              </span>
              <span className="bg-[#0D0D0D]/50 backdrop-blur-sm border border-primary/20 px-2.5 py-1 rounded-full flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
                <Users className="w-3 h-3 text-primary" /> COMMUNITY
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-primary font-bold text-xs sm:text-sm tracking-wider font-mono">
                APRIL 1 · 6:00 PM EST
              </span>
              <span className="bg-primary/20 border border-primary/50 text-primary px-4 py-2 rounded-lg text-xs sm:text-sm font-bold tracking-wider">
                startupfactoryhub.com/artemis-watch-party
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtemisMarketingBanner;
