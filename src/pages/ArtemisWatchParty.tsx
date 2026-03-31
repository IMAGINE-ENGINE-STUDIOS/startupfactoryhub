import { useEffect } from "react";
import { ArrowLeft, Radio, Shield, Satellite, Globe, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import MatrixBackground from "@/components/MatrixBackground";

const ArtemisWatchParty = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js";
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
      {/* Matrix rain background */}
      <div className="fixed inset-0 z-0 opacity-10">
        <MatrixBackground />
      </div>

      {/* Grid overlay */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
                            linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Header / Nav */}
      <header className="relative z-10 glass-morphism border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-3 group"
            >
              <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <img src={logo} alt="Startup Factory Hub" className="w-8 h-8 glow-effect" />
              <span className="text-sm font-bold bg-gradient-primary bg-clip-text text-transparent tracking-wide hidden sm:inline">
                STARTUP FACTORY HUB
              </span>
            </button>
            <div className="flex items-center gap-3">
              <div className="glass-morphism px-3 py-1.5 rounded-full border border-primary/20 flex items-center gap-2">
                <Radio className="w-3 h-3 text-red-500 animate-pulse" />
                <span className="text-primary text-xs font-semibold tracking-wider">LIVE EVENT</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Title */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-4 sm:pb-6">
        <div className="tech-card rounded-2xl p-6 sm:p-8 text-center relative overflow-hidden">
          {/* Scan line effect */}
          <div className="absolute inset-0 scan-effect pointer-events-none" />
          
          <div className="flex items-center justify-center gap-3 mb-3">
            <Satellite className="w-5 h-5 text-primary animate-pulse" />
            <span className="text-muted-foreground text-xs tracking-[0.3em] font-futuristic uppercase">
              Official Mission Watch Portal
            </span>
            <Satellite className="w-5 h-5 text-primary animate-pulse" />
          </div>
          
          <h1
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight tracking-wider"
            style={{
              textShadow: "0 0 20px hsl(var(--primary) / 0.5), 0 0 40px hsl(var(--primary) / 0.2)",
            }}
          >
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Artemis II Online Watch Party
            </span>
          </h1>
          <p className="text-muted-foreground text-sm mt-3 max-w-2xl mx-auto">
            Join the Startup Factory Hub community as we witness humanity's return to the Moon.
            Connect live with founders, mentors, and space enthusiasts worldwide.
          </p>

          {/* Status bar */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 mt-4 text-[10px] sm:text-xs text-muted-foreground font-mono">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-primary" /> SECURE STREAM
            </span>
            <span className="flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-primary" /> GLOBAL ACCESS
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-3 h-3 text-primary" /> COMMUNITY
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-12 space-y-6">
        
        {/* Live Stream - YouTube Embed */}
        <div className="tech-card rounded-2xl p-1 hover:shadow-glow transition-shadow duration-500">
          <div className="bg-card/60 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-muted-foreground text-xs font-futuristic tracking-wider">
                ARTEMIS II — NASA LIVE MISSION FEED
              </span>
            </div>
            <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingBottom: "56.25%" }}>
              <iframe
                src="https://www.youtube.com/embed/Tf_UjBMIzNo?autoplay=1&mute=1&rel=0&modestbranding=1"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-none"
                title="Artemis II NASA Live Stream"
              />
            </div>
          </div>
        </div>

        {/* Two Column: Whereby + Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          {/* Whereby Video Room */}
          <div className="tech-card rounded-2xl p-1 hover:shadow-glow transition-shadow duration-500">
            <div className="bg-card/60 rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-muted-foreground text-xs font-futuristic tracking-wider">
                  COMMUNITY VIDEO ROOM — WHEREBY
                </span>
              </div>
              <iframe
                src="https://startupfactoryhub.whereby.com/evt-startup-factory-hub-mne4z41141dc95-d769-4dfd-b59a-be5b74ab0c8e"
                allow="camera; microphone; fullscreen; speaker; display-capture"
                className="w-full h-[350px] sm:h-[420px] lg:h-[500px] rounded-xl border-none bg-secondary/30"
                title="Whereby Community Room"
              />
              <p className="text-muted-foreground/50 text-[10px] mt-2 text-center font-mono">
                STARTUP FACTORY HUB — LIVE COMMUNITY ROOM
              </p>
            </div>
          </div>

          {/* Right Widgets */}
          <div className="space-y-6">
            {/* NASA Moon Tracker */}
            <div className="tech-card rounded-2xl p-1 hover:shadow-glow transition-shadow duration-500">
              <div className="bg-card/60 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-primary text-xs font-futuristic font-bold tracking-wider">
                    LIVE MOON TRACKER
                  </span>
                </div>
                <iframe
                  src="https://eyes.nasa.gov/apps/solar-system/#/moon/telescope?detailPanel=false&logo=false&shareButton=false&menu=false&collapseSettingsOptions=true&surfaceMapTiling=true&hd=true"
                  allowFullScreen
                  className="w-full h-56 sm:h-64 rounded-xl border-none opacity-90"
                  title="NASA Moon Tracker"
                />
              </div>
            </div>

            {/* Mission Info */}
            <div className="tech-card rounded-2xl p-4">
              <span className="text-primary text-xs font-futuristic font-bold tracking-wider block mb-3">
                MISSION BRIEFING
              </span>
              <div className="space-y-2.5 text-xs text-muted-foreground">
                <p><span className="text-primary/70">MISSION:</span> Artemis II — Crewed Lunar Flyby</p>
                <p><span className="text-primary/70">CREW:</span> 4 Astronauts</p>
                <p><span className="text-primary/70">VEHICLE:</span> Orion / SLS Block 1</p>
                <p><span className="text-primary/70">OBJECTIVE:</span> First crewed flight beyond low Earth orbit since Apollo 17</p>
              </div>
            </div>

            {/* System Status */}
            <div className="tech-card rounded-2xl p-4">
              <span className="text-primary text-xs font-futuristic font-bold tracking-wider block mb-3">
                SYSTEM STATUS
              </span>
              <div className="space-y-1.5 text-[10px] font-mono text-muted-foreground/60">
                <p>[ <span className="text-primary">OK</span> ] NASA live feed ............. ACTIVE</p>
                <p>[ <span className="text-primary">OK</span> ] Community room ............. STANDBY</p>
                <p>[ <span className="text-primary">OK</span> ] Lunar telemetry ............ SYNCED</p>
                <p>[ <span className="text-primary">OK</span> ] AR engine .................. LOADED</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3D Moon Model - Full Width Below */}
        <div className="tech-card rounded-2xl p-1 hover:shadow-glow transition-shadow duration-500">
          <div className="bg-card/60 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-primary text-xs font-futuristic font-bold tracking-wider">
                3D LUNAR EXPLORER — INTERACT & AR
              </span>
            </div>
            {/* @ts-ignore */}
            <model-viewer
              src="https://svs.gsfc.nasa.gov/vis/a010000/a014900/a014959/Moon_NASA_LRO_8k_Flat.glb"
              ios-src="https://svs.gsfc.nasa.gov/vis/a010000/a014900/a014959/Moon_NASA_LRO_Flat_Small.usdz"
              alt="A 3D model of the Moon"
              ar
              ar-modes="webxr scene-viewer quick-look"
              environment-image="neutral"
              auto-rotate
              camera-controls
              style={{
                width: "100%",
                height: "350px",
                backgroundColor: "transparent",
                borderRadius: "0.75rem",
              }}
            >
              <button
                slot="ar-button"
                className="absolute bottom-4 right-4 glass-morphism border border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-glow px-4 py-2 rounded-lg font-futuristic font-bold transition-all duration-300 text-xs tracking-wider"
              >
                [ INITIALIZE AR ]
              </button>
            {/* @ts-ignore */}
            </model-viewer>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/30 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-muted-foreground/40 text-xs font-mono">
            © {new Date().getFullYear()} Startup Factory Hub — Artemis II Watch Party Portal
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ArtemisWatchParty;
