import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import racingBanner from "@/assets/hot-deals-racing-banner.jpg";
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
      {/* Racing background effects */}
      <div className="fixed inset-0 z-0 opacity-10"><OrangeMatrixBackground /></div>
      
      {/* Checkered flag pattern overlay */}
      <div className="fixed inset-0 z-[1] pointer-events-none opacity-[0.02]" style={{
        backgroundImage: `
          linear-gradient(45deg, hsl(25 95% 53% / 0.4) 25%, transparent 25%),
          linear-gradient(-45deg, hsl(25 95% 53% / 0.4) 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, hsl(25 95% 53% / 0.4) 75%),
          linear-gradient(-45deg, transparent 75%, hsl(25 95% 53% / 0.4) 75%)
        `,
        backgroundSize: "40px 40px",
        backgroundPosition: "0 0, 0 20px, 20px -20px, -20px 0px",
      }} />

      {/* Racing stripe accents on sides */}
      <div className="fixed top-0 left-0 w-2 h-full z-[2] pointer-events-none bg-gradient-to-b from-red-600 via-orange-500 to-yellow-500 opacity-60" />
      <div className="fixed top-0 right-0 w-2 h-full z-[2] pointer-events-none bg-gradient-to-b from-yellow-500 via-orange-500 to-red-600 opacity-60" />

      {/* Header - Racing style */}
      <header className="relative z-10 border-b-2 border-orange-500/40 bg-background/80 backdrop-blur-xl">
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate("/")} className="flex items-center gap-3 group">
              <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-orange-400 transition-colors" />
              <img src={logo} alt="Startup Factory Hub" className="w-8 h-8" />
              <span className="text-sm font-bold text-orange-400 tracking-wide hidden sm:inline font-futuristic">STARTUP FACTORY HUB</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-full flex items-center gap-2 bg-red-600/20 border border-red-500/40">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400 text-xs font-bold tracking-wider font-futuristic">RACE DAY</span>
              </div>
              <div className="relative">
                <button onClick={() => setShowShareMenu((p) => !p)} className="px-3 py-1.5 rounded-full flex items-center gap-2 text-orange-400 hover:bg-orange-400/20 transition-all bg-orange-500/10 border border-orange-400/30">
                  <span className="text-sm">🏁</span>
                  <span className="text-xs font-bold tracking-wider hidden sm:inline font-futuristic">INVITE</span>
                </button>
                {showShareMenu && (
                  <div className="fixed right-4 mt-2 w-64 border border-orange-400/20 rounded-xl p-3 z-[9999] space-y-2 shadow-xl bg-background/95 backdrop-blur-xl">
                    <p className="text-[10px] text-muted-foreground font-mono tracking-wider mb-2">🏁 SHARE THIS RACE</p>
                    <button onClick={handleCopyLink} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-foreground hover:bg-orange-400/10 transition-all">
                      <span className="text-sm">{copied ? "✓" : "🔗"}</span>{copied ? "Link copied!" : "Copy link"}
                    </button>
                    <a href={`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-foreground hover:bg-orange-400/10 transition-all">
                      <span className="text-sm">📱</span> WhatsApp
                    </a>
                    <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-foreground hover:bg-orange-400/10 transition-all">
                      <span className="text-sm">🐦</span> Twitter / X
                    </a>
                    <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-foreground hover:bg-orange-400/10 transition-all">
                      <span className="text-sm">💼</span> LinkedIn
                    </a>
                    <a href={`mailto:?subject=${encodeURIComponent("Hot Deals in the Space Industry")}&body=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-foreground hover:bg-orange-400/10 transition-all">
                      <span className="text-sm">✉️</span> Email
                    </a>
                    {typeof navigator !== "undefined" && "share" in navigator && (
                      <button onClick={handleNativeShare} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-foreground hover:bg-orange-400/10 transition-all border-t border-border/30 pt-2 mt-1">
                        <span className="text-sm">📤</span> More options...
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Racing Banner Hero */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="relative rounded-2xl overflow-hidden border-2 border-orange-500/30 shadow-[0_0_40px_rgba(251,146,60,0.15)]">
          <img src={racingBanner} alt="Hot Deals Racing" className="w-full h-32 sm:h-48 lg:h-56 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-orange-400 text-[10px] sm:text-xs font-futuristic tracking-[0.4em] mb-1">🏁 STARTUP PITCH COMPETITION 🏁</p>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400 font-futuristic tracking-wider drop-shadow-lg">
                HOT DEALS
              </h1>
              <p className="text-xs sm:text-sm text-foreground/80 mt-1 font-futuristic tracking-wider">IN THE SPACE INDUSTRY</p>
            </div>
          </div>
          {/* Checkered flag corners */}
          <div className="absolute top-0 left-0 w-8 h-8 opacity-40" style={{
            backgroundImage: `linear-gradient(45deg, hsl(0 0% 100%) 25%, transparent 25%), linear-gradient(-45deg, hsl(0 0% 100%) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(0 0% 100%) 75%), linear-gradient(-45deg, transparent 75%, hsl(0 0% 100%) 75%)`,
            backgroundSize: "8px 8px",
            backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
          }} />
          <div className="absolute top-0 right-0 w-8 h-8 opacity-40" style={{
            backgroundImage: `linear-gradient(45deg, hsl(0 0% 100%) 25%, transparent 25%), linear-gradient(-45deg, hsl(0 0% 100%) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(0 0% 100%) 75%), linear-gradient(-45deg, transparent 75%, hsl(0 0% 100%) 75%)`,
            backgroundSize: "8px 8px",
            backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
          }} />
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* 1. LIVE PITCH ROOM */}
        <div className="racing-card rounded-2xl p-1">
          <div className="bg-card/60 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-muted-foreground text-xs font-futuristic tracking-wider">
                🏎️ LIVE PITCH ROOM — UP TO 200 RACERS
              </span>
            </div>
            <iframe
              src="https://startupfactoryhub.whereby.com/hot-deals-space"
              allow="camera; microphone; fullscreen; speaker; display-capture"
              className="w-full h-[400px] sm:h-[500px] lg:h-[600px] rounded-xl border-none bg-secondary/30"
              title="Hot Deals Live Pitch Room"
            />
            <p className="text-muted-foreground/50 text-[10px] mt-2 text-center font-mono">
              🏁 STARTUP FACTORY HUB — LIVE PITCH ROOM (200 MAX CAPACITY)
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

        {/* 7. Partners */}
        <PartnersCarousel />

        {/* 8. Two Column: 3D Models | Arcade */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="racing-card rounded-2xl p-1">
            <div className="bg-card/60 rounded-xl p-3">
              <SpaceModelViewer models={SPACE_MODELS} defaultIndex={0} compact />
            </div>
          </div>
          <div className="racing-card rounded-2xl p-1">
            <div className="bg-card/60 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-orange-400 text-xs font-futuristic font-bold tracking-wider">🏎️ SPACE ARCADE</span>
              </div>
              <SpaceArcade />
            </div>
          </div>
        </div>

        {/* 9. EVENT BANNER */}
        <div className="scan-effect overflow-hidden rounded-2xl border-2 border-orange-500/30">
          <SpaceEventBanner />
        </div>
      </div>

      <footer className="relative z-10 border-t-2 border-orange-500/40 py-6">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-muted-foreground/40 text-xs font-mono">
            🏁 &copy; {new Date().getFullYear()} Startup Factory Hub — Hot Deals in the Space Industry 🏁
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HotDealsPortal;
