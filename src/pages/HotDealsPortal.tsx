import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import OrangeMatrixBackground from "@/components/OrangeMatrixBackground";
import SpaceModelViewer from "@/components/SpaceModelViewer";
import SpaceArcade from "@/components/SpaceArcade";
import PartnersCarousel from "@/components/PartnersCarousel";
import HotDealsVoting from "@/components/HotDealsVoting";
import HotDealsWinner from "@/components/HotDealsWinner";
import HotDealsAgenda from "@/components/HotDealsAgenda";
import HotDealsSpeakers from "@/components/HotDealsSpeakers";
import HotDealsLiveChat from "@/components/HotDealsLiveChat";
import SpaceEventBanner from "@/components/marketing/SpaceEventBanner";

const NASA_BASE = "https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Models";

const SPACE_MODELS = [
  { name: "Apollo Lunar Module", src: `${NASA_BASE}/Apollo%20Lunar%20Module/Apollo%20Lunar%20Module.glb`, alt: "Apollo Lunar Module" },
  { name: "NASA Astronaut", src: `${NASA_BASE}/Astronaut/Astronaut.glb`, alt: "NASA Astronaut" },
  { name: "Perseverance Rover", src: `${NASA_BASE}/Mars%202020%20Perseverance%20Rover/Mars%202020%20Perseverance%20Rover.glb`, alt: "Perseverance Rover" },
  { name: "James Webb Telescope", src: `${NASA_BASE}/James%20Webb%20Space%20Telescope%20(A)/James%20Webb%20Space%20Telescope%20(A).glb`, alt: "James Webb Telescope" },
];

const HotDealsPortal = () => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const shareUrl = "https://startupfactoryhub.com/hot-deals-space";
  const shareText = "Hot Deals in the Space Industry — Live startup pitches, voting, NASA AR models & more! In collaboration with NASA Technology Transfer Program.";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "Hot Deals in the Space Industry", text: shareText, url: shareUrl }); } catch {}
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
      <div className="fixed inset-0 z-0 opacity-10"><OrangeMatrixBackground /></div>
      <div className="fixed inset-0 z-[1] pointer-events-none opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(hsl(25 95% 53% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(25 95% 53% / 0.3) 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
      }} />

      {/* Header */}
      <header className="relative z-10 glass-morphism border-b border-orange-400/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate("/")} className="flex items-center gap-3 group">
              <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-orange-400 transition-colors" />
              <img src={logo} alt="Startup Factory Hub" className="w-8 h-8" />
              <span className="text-sm font-bold text-orange-400 tracking-wide hidden sm:inline">STARTUP FACTORY HUB</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="glass-morphism px-3 py-1.5 rounded-full border border-orange-400/30 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-orange-400 text-xs font-semibold tracking-wider">LIVE EVENT</span>
              </div>
              <div className="relative">
                <button onClick={() => setShowShareMenu((p) => !p)} className="glass-morphism px-3 py-1.5 rounded-full border border-orange-400/30 flex items-center gap-2 text-orange-400 hover:bg-orange-400/20 transition-all">
                  <span className="text-sm">🔥</span>
                  <span className="text-xs font-semibold tracking-wider hidden sm:inline">INVITE</span>
                </button>
                {showShareMenu && (
                  <div className="fixed right-4 mt-2 w-64 glass-morphism border border-orange-400/20 rounded-xl p-3 z-[9999] space-y-2 shadow-xl bg-background/95 backdrop-blur-xl">
                    <p className="text-[10px] text-muted-foreground font-mono tracking-wider mb-2">SHARE THIS EVENT</p>
                    <button onClick={handleCopyLink} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-foreground hover:bg-orange-400/10 transition-all">
                      <span className="text-sm">{copied ? "✓" : "🔥"}</span>{copied ? "Link copied!" : "Copy link"}
                    </button>
                    <a href={`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-foreground hover:bg-orange-400/10 transition-all">
                      <span className="text-sm">🔥</span> WhatsApp
                    </a>
                    <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-foreground hover:bg-orange-400/10 transition-all">
                      <span className="text-sm">🔥</span> Twitter / X
                    </a>
                    <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-foreground hover:bg-orange-400/10 transition-all">
                      <span className="text-sm">🔥</span> LinkedIn
                    </a>
                    <a href={`mailto:?subject=${encodeURIComponent("Hot Deals in the Space Industry")}&body=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-foreground hover:bg-orange-400/10 transition-all">
                      <span className="text-sm">🔥</span> Email
                    </a>
                    {typeof navigator !== "undefined" && "share" in navigator && (
                      <button onClick={handleNativeShare} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-foreground hover:bg-orange-400/10 transition-all border-t border-border/30 pt-2 mt-1">
                        <span className="text-sm">🔥</span> More options...
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* 1. LIVE PITCH ROOM — Top */}
        <div className="tech-card rounded-2xl p-1 border border-orange-400/10">
          <div className="bg-card/60 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              <span className="text-muted-foreground text-xs font-futuristic tracking-wider">
                LIVE PITCH ROOM — UP TO 200 PEOPLE
              </span>
            </div>
            <iframe
              src="https://startupfactoryhub.whereby.com/hot-deals-space"
              allow="camera; microphone; fullscreen; speaker; display-capture"
              className="w-full h-[400px] sm:h-[500px] lg:h-[600px] rounded-xl border-none bg-secondary/30"
              title="Hot Deals Live Pitch Room"
            />
            <p className="text-muted-foreground/50 text-[10px] mt-2 text-center font-mono">
              STARTUP FACTORY HUB — LIVE PITCH ROOM (200 MAX CAPACITY)
            </p>
          </div>
        </div>

        {/* 2. AGENDA TICKER */}
        <HotDealsAgenda />

        {/* 3. LIVE CHAT + SPEAKERS side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HotDealsLiveChat />
          <HotDealsSpeakers />
        </div>

        {/* 5. WINNER */}
        <HotDealsWinner />

        {/* 6. STARTUP VOTING CARDS */}
        <HotDealsVoting />

        {/* 7. Two Column: 3D Models | Arcade */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="tech-card rounded-2xl p-1 border border-orange-400/10">
            <div className="bg-card/60 rounded-xl p-3">
              <SpaceModelViewer models={SPACE_MODELS} defaultIndex={0} compact />
            </div>
          </div>
          <div className="tech-card rounded-2xl p-1 border border-orange-400/10">
            <div className="bg-card/60 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-orange-400 text-xs font-futuristic font-bold tracking-wider">SPACE ARCADE</span>
              </div>
              <SpaceArcade />
            </div>
          </div>
        </div>

        {/* 8. EVENT BANNER with scan-effect */}
        <div className="scan-effect overflow-hidden rounded-2xl border border-orange-400/30">
          <SpaceEventBanner />
        </div>

        {/* 9. Partners */}
        <PartnersCarousel />
      </div>

      <footer className="relative z-10 border-t border-orange-400/20 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-muted-foreground/40 text-xs font-mono">
            &copy; {new Date().getFullYear()} Startup Factory Hub — Hot Deals in the Space Industry
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HotDealsPortal;
