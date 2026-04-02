import { useState } from "react";
import { ArrowLeft, Radio, Maximize2, Minimize2, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import MatrixBackground from "@/components/MatrixBackground";
import ArtemisBanner from "@/components/ArtemisBanner";
import SpaceModelViewer from "@/components/SpaceModelViewer";
import ArtemisLiveChat from "@/components/ArtemisLiveChat";
import SpaceArcade from "@/components/SpaceArcade";
import ArtemisVisitorCounter from "@/components/ArtemisVisitorCounter";
import { CesiumISSTracker } from "@/components/CesiumISSTracker";
import { CalendarDays, ExternalLink, Copy, Check, Mail, MessageCircle } from "lucide-react";

const NASA_BASE = "https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Models";

const SPACE_MODELS = [
  {
    name: "NASA Astronaut",
    src: `${NASA_BASE}/Astronaut/Astronaut.glb`,
    alt: "3D model of a NASA Astronaut",
  },
  {
    name: "Apollo Lunar Module",
    src: `${NASA_BASE}/Apollo%20Lunar%20Module/Apollo%20Lunar%20Module.glb`,
    alt: "3D model of the Apollo Lunar Module",
  },
  {
    name: "Perseverance Rover",
    src: `${NASA_BASE}/Mars%202020%20Perseverance%20Rover/Mars%202020%20Perseverance%20Rover.glb`,
    alt: "3D model of the Mars Perseverance Rover",
  },
  {
    name: "James Webb Telescope",
    src: `${NASA_BASE}/James%20Webb%20Space%20Telescope%20(A)/James%20Webb%20Space%20Telescope%20(A).glb`,
    alt: "3D model of the James Webb Space Telescope",
  },
  {
    name: "Gateway Lunar Station",
    src: `${NASA_BASE}/Gateway/Gateway%20Core.glb`,
    alt: "3D model of the Gateway Lunar Space Station",
  },
  {
    name: "Space Shuttle",
    src: `${NASA_BASE}/Space%20Shuttle%20(A)/Space%20Shuttle%20(A).glb`,
    alt: "3D model of the NASA Space Shuttle",
  },
  {
    name: "International Space Station",
    src: `${NASA_BASE}/International%20Space%20Station%20(ISS)%20(A)/International%20Space%20Station%20(ISS)%20(A).glb`,
    alt: "3D model of the International Space Station",
  },
];

const ArtemisWatchParty = () => {
  const [streamFullscreen, setStreamFullscreen] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const shareUrl = "https://startupfactoryhub.lovable.app/artemis-watch-party";
  const shareText = "🚀 Join me at the Artemis II Watch Party — Live NASA stream, AR, 3D models, arcade games & real-time moon tracking!";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Artemis II Watch Party", text: shareText, url: shareUrl });
      } catch {}
    }
  };

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
              <div className="relative">
                <button
                  onClick={() => setShowShareMenu((p) => !p)}
                  className="glass-morphism px-3 py-1.5 rounded-full border border-primary/30 flex items-center gap-2 text-primary hover:bg-primary/20 transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold tracking-wider hidden sm:inline">INVITE</span>
                </button>
                {showShareMenu && (
                  <div className="fixed right-4 mt-2 w-64 glass-morphism border border-primary/20 rounded-xl p-3 z-[9999] space-y-2 shadow-xl bg-background/95 backdrop-blur-xl" style={{ top: 'auto' }}>
                    <p className="text-[10px] text-muted-foreground font-mono tracking-wider mb-2">SHARE THIS EVENT</p>
                    <button
                      onClick={handleCopyLink}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-foreground hover:bg-primary/10 transition-all"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-primary" />}
                      {copied ? "Link copied!" : "Copy link"}
                    </button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-foreground hover:bg-primary/10 transition-all"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-green-400" />
                      WhatsApp
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-foreground hover:bg-primary/10 transition-all"
                    >
                      <span className="w-3.5 h-3.5 text-primary font-bold text-[10px]">𝕏</span>
                      Twitter / X
                    </a>
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-foreground hover:bg-primary/10 transition-all"
                    >
                      <span className="w-3.5 h-3.5 text-blue-400 font-bold text-[10px]">in</span>
                      LinkedIn
                    </a>
                    <a
                      href={`mailto:?subject=${encodeURIComponent("Join the Artemis II Watch Party!")}&body=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-foreground hover:bg-primary/10 transition-all"
                    >
                      <Mail className="w-3.5 h-3.5 text-primary" />
                      Email
                    </a>
                    {typeof navigator !== "undefined" && "share" in navigator && (
                      <button
                        onClick={handleNativeShare}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-foreground hover:bg-primary/10 transition-all border-t border-border/30 pt-2 mt-1"
                      >
                        <Share2 className="w-3.5 h-3.5 text-primary" />
                        More options...
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>


      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-12 space-y-6">
        
        {/* Live Stream - YouTube Embed */}
        {streamFullscreen && (
          <div className="fixed inset-0 z-[10001] bg-background flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/30">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-muted-foreground text-xs font-futuristic tracking-wider">
                  ARTEMIS II — NASA LIVE MISSION FEED
                </span>
              </div>
              <button
                onClick={() => setStreamFullscreen(false)}
                className="glass-morphism border border-primary/30 text-primary hover:bg-primary/20 p-1.5 rounded-lg transition-all"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1">
              <iframe
                src="https://www.youtube.com/embed/Tf_UjBMIzNo?autoplay=1&mute=1&rel=0&modestbranding=1"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-none"
                title="Artemis II NASA Live Stream"
              />
            </div>
          </div>
        )}
        <div className="tech-card rounded-2xl p-1 hover:shadow-glow transition-shadow duration-500">
          <div className="bg-card/60 rounded-xl p-3 sm:p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-muted-foreground text-xs font-futuristic tracking-wider">
                  ARTEMIS II — NASA LIVE MISSION FEED
                </span>
              </div>
              <button
                onClick={() => setStreamFullscreen(true)}
                className="glass-morphism border border-primary/30 text-primary hover:bg-primary/20 p-1.5 rounded-lg transition-all"
                title="Fullscreen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
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

        {/* Two Column: Whereby + Chat | Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          {/* Left: Whereby Video Room + Live Chat */}
          <div className="space-y-6">
            <div className="tech-card rounded-2xl p-1 hover:shadow-glow transition-shadow duration-500">
              <div className="bg-card/60 rounded-xl p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-muted-foreground text-xs font-futuristic tracking-wider">
                    COMMUNITY VIDEO ROOM — UP TO 200 PEOPLE
                  </span>
                </div>
                <iframe
                  src="https://startupfactoryhub.whereby.com/artemisabbc13fd-08fc-4667-ac1e-99e603a7db2c"
                  allow="camera; microphone; fullscreen; speaker; display-capture"
                  className="w-full h-[350px] sm:h-[420px] lg:h-[500px] rounded-xl border-none bg-secondary/30"
                  title="Whereby Community Room — 200 Participants"
                />
                <p className="text-muted-foreground/50 text-[10px] mt-2 text-center font-mono">
                  STARTUP FACTORY HUB — LIVE COMMUNITY ROOM (200 MAX CAPACITY)
                </p>
              </div>
            </div>

            {/* Live Chat below video */}
            <ArtemisLiveChat />

            {/* Artemis Banner */}
            <div className="mt-6">
              <ArtemisBanner />
            </div>
          </div>

          {/* Right Widgets */}
          <div className="space-y-6">
            {/* 3D Space Explorer Gallery (compact) */}
            <div className="tech-card rounded-2xl p-1 hover:shadow-glow transition-shadow duration-500">
              <div className="bg-card/60 rounded-xl p-3">
                <SpaceModelViewer models={SPACE_MODELS} defaultIndex={1} compact />
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

            {/* Space Arcade Game */}
            <div className="tech-card rounded-2xl p-1 hover:shadow-glow transition-shadow duration-500">
              <div className="bg-card/60 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-primary text-xs font-futuristic font-bold tracking-wider">
                    SPACE ARCADE
                  </span>
                </div>
                <SpaceArcade />
              </div>
            </div>

            {/* Visitor Counter */}
            <ArtemisVisitorCounter />
          </div>
        </div>

        {/* Live Moon Tracker - Full Width */}
        <div className="tech-card rounded-2xl p-1 hover:shadow-glow transition-shadow duration-500">
          <div className="bg-card/60 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-primary text-xs font-futuristic font-bold tracking-wider">
                LIVE MOON TRACKER
              </span>
            </div>
            <iframe
              src="https://eyes.nasa.gov/apps/solar-system/#/sc_artemis_ii?detailPanel=false&logo=false&shareButton=false&menu=false&collapseSettingsOptions=true&surfaceMapTiling=true&hd=true"
              allowFullScreen
              className="w-full h-[400px] sm:h-[500px] lg:h-[600px] rounded-xl border-none opacity-90"
              title="NASA Moon Tracker"
            />
            <p className="text-muted-foreground text-[10px] mt-2 text-center font-mono">
              NASA EYES — INTERACTIVE LUNAR TELEMETRY
            </p>
          </div>
        </div>
      </div>

        {/* Next Event Banner */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-6">
          <div className="tech-card rounded-2xl p-1 hover:shadow-glow transition-shadow duration-500">
            <div className="bg-card/60 rounded-xl p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="w-4 h-4 text-orange-400" />
                <span className="text-orange-400 text-xs font-futuristic font-bold tracking-wider">
                  NEXT EVENT
                </span>
              </div>
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
                <div className="flex-1 space-y-2">
                  <h3 className="text-lg sm:text-xl font-bold text-foreground">
                    🔥 Hot Deals in the Space Industry
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    In collaboration with the <span className="text-orange-400 font-semibold">NASA Technology Transfer Program</span>
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground font-mono">
                    <span className="glass-morphism px-2 py-1 rounded-lg border border-orange-400/20">
                      📅 April 16, 2026
                    </span>
                    <span className="glass-morphism px-2 py-1 rounded-lg border border-orange-400/20">
                      🕑 2:00 PM – 3:30 PM EST
                    </span>
                  </div>
                </div>
                <a
                  href="https://startupfactoryhub.com/events/e19b8e37-a4d2-4086-9989-9e4739c2964f/register"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-morphism border border-orange-400/50 text-orange-400 hover:bg-orange-400 hover:text-black px-5 py-2.5 rounded-xl font-bold text-sm tracking-wider transition-all duration-300 flex items-center gap-2 shrink-0"
                >
                  REGISTER NOW
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
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
