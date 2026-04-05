import { useState } from "react";
import { ArrowLeft, Flag, Share2, Link, Smartphone, Twitter, Briefcase, Mail, Upload, Radio, Users, Disc3, Rocket, Zap, Shield } from "lucide-react";
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
import HotDealsRocketBanner from "@/components/HotDealsRocketBanner";
import HotDealsDJConsole from "@/components/HotDealsDJConsole";
import DJAudioEngine from "@/components/dj/DJAudioEngine";
import PersonalRadio from "@/components/dj/PersonalRadio";

const NASA_BASE = "https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Models";

const SPACE_MODELS = [
  { name: "Apollo Lunar Module", src: `${NASA_BASE}/Apollo%20Lunar%20Module/Apollo%20Lunar%20Module.glb`, alt: "Apollo Lunar Module" },
  { name: "Perseverance Rover", src: `${NASA_BASE}/Mars%202020%20Perseverance%20Rover/Mars%202020%20Perseverance%20Rover.glb`, alt: "Perseverance Rover" },
  { name: "James Webb Telescope", src: `${NASA_BASE}/James%20Webb%20Space%20Telescope%20(A)/James%20Webb%20Space%20Telescope%20(A).glb`, alt: "James Webb Telescope" },
];

const HotDealsPortal = () => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDJ, setShowDJ] = useState(false);
  const navigate = useNavigate();

  const shareUrl = typeof window !== 'undefined' ? window.location.href : "https://startupfactoryhub.com/hot-deals-space";
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
      {/* Matrix bg */}
      <div className="fixed inset-0 z-0 opacity-10"><OrangeMatrixBackground /></div>

      {/* Houndstooth texture */}
      <div className="fixed inset-0 z-[1] pointer-events-none opacity-[0.03]" style={{
        backgroundImage: `
          linear-gradient(45deg, hsl(25 95% 53% / 0.4) 25%, transparent 25%),
          linear-gradient(-45deg, hsl(25 95% 53% / 0.4) 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, hsl(25 95% 53% / 0.4) 75%),
          linear-gradient(-45deg, transparent 75%, hsl(25 95% 53% / 0.4) 75%)
        `,
        backgroundSize: "40px 40px",
        backgroundPosition: "0 0, 0 20px, 20px -20px, -20px 0px",
      }} />

      {/* Industrial side rails */}
      <div className="fixed top-0 left-0 w-3 h-full z-[2] pointer-events-none" style={{
        background: 'linear-gradient(180deg, hsl(0 72% 51%) 0%, hsl(25 95% 53%) 50%, hsl(48 96% 53%) 100%)',
        boxShadow: '2px 0 20px rgba(249,115,22,0.3)',
      }} />
      <div className="fixed top-0 right-0 w-3 h-full z-[2] pointer-events-none" style={{
        background: 'linear-gradient(180deg, hsl(48 96% 53%) 0%, hsl(25 95% 53%) 50%, hsl(0 72% 51%) 100%)',
        boxShadow: '-2px 0 20px rgba(249,115,22,0.3)',
      }} />

      {/* HEADER - Industrial command bar */}
      <header className="relative z-10 bg-background/90 backdrop-blur-xl border-b-2 border-orange-500/50">
        <div className="absolute inset-x-0 bottom-0 h-[3px]" style={{
          background: 'linear-gradient(90deg, hsl(0 72% 51%), hsl(25 95% 53%), hsl(48 96% 53%))',
          boxShadow: '0 2px 20px rgba(249,115,22,0.4)',
        }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate("/")} className="flex items-center gap-3 group">
              <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-orange-400 transition-colors" />
              <img src={logo} alt="Startup Factory Hub" className="w-10 h-10" />
              <span className="text-base font-black text-orange-400 tracking-wider hidden sm:inline font-futuristic uppercase">Startup Factory Hub</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-lg flex items-center gap-2 border-2 border-red-500/50" style={{
                background: 'linear-gradient(135deg, hsl(0 72% 51% / 0.15), hsl(0 72% 51% / 0.05))',
                boxShadow: '0 0 20px rgba(239,68,68,0.15), inset 0 1px 0 rgba(239,68,68,0.1)',
              }}>
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400 text-sm font-black tracking-wider font-futuristic">RACE DAY</span>
              </div>
              <button
                onClick={() => setShowDJ(prev => !prev)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 border-2 transition-all text-sm font-black tracking-wider font-futuristic ${
                  showDJ
                    ? "bg-orange-500/20 border-orange-400/60 text-orange-400 animate-radio-pulse shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                    : "bg-muted/30 border-border text-muted-foreground hover:bg-orange-500/10 hover:border-orange-400/30 hover:text-orange-400"
                }`}
              >
                <Disc3 className="w-4 h-4" />
                <Radio className="w-4 h-4" />
                <span className="hidden sm:inline">DJ DECK</span>
              </button>
              <div className="relative">
                <button onClick={() => setShowShareMenu((p) => !p)} className="px-4 py-2 rounded-lg flex items-center gap-2 text-orange-400 hover:bg-orange-400/20 transition-all bg-orange-500/10 border-2 border-orange-400/30">
                  <Flag className="w-4 h-4" />
                  <span className="text-sm font-black tracking-wider hidden sm:inline font-futuristic">INVITE</span>
                </button>
                {showShareMenu && (
                  <div className="absolute right-0 mt-2 w-72 border-2 border-orange-400/30 rounded-xl p-4 z-[9999] space-y-2 shadow-2xl bg-background/95 backdrop-blur-xl">
                    <p className="text-xs text-muted-foreground font-mono tracking-wider mb-3 flex items-center gap-1.5"><Share2 className="w-3.5 h-3.5" /> SHARE THIS RACE</p>
                    <button onClick={handleCopyLink} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-orange-400/10 transition-all">
                      <Link className="w-4 h-4" />{copied ? "Link copied!" : "Copy link"}
                    </button>
                    <a href={`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-orange-400/10 transition-all">
                      <Smartphone className="w-4 h-4" /> WhatsApp
                    </a>
                    <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-orange-400/10 transition-all">
                      <Twitter className="w-4 h-4" /> Twitter / X
                    </a>
                    <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-orange-400/10 transition-all">
                      <Briefcase className="w-4 h-4" /> LinkedIn
                    </a>
                    <a href={`mailto:?subject=${encodeURIComponent("Hot Deals in the Space Industry")}&body=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-orange-400/10 transition-all">
                      <Mail className="w-4 h-4" /> Email
                    </a>
                    {typeof navigator !== "undefined" && "share" in navigator && (
                      <button onClick={handleNativeShare} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-orange-400/10 transition-all border-t border-border/30 pt-2 mt-1">
                        <Upload className="w-4 h-4" /> More options...
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* DJ Console Panel */}
        {showDJ && <HotDealsDJConsole />}

        {/* Hero Banner */}
        <HotDealsRocketBanner />

        {/* Mission Tagline */}
        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="h-[2px] w-12 sm:w-20 bg-gradient-to-r from-transparent to-orange-500/60" />
            <Shield className="w-5 h-5 text-orange-400" />
            <div className="h-[2px] w-12 sm:w-20 bg-gradient-to-l from-transparent to-orange-500/60" />
          </div>
          <p className="text-lg sm:text-xl text-muted-foreground font-futuristic tracking-wider">
            THE WORLD&apos;S PREMIER PITCH COMPETITION FOR
          </p>
          <p className="text-xl sm:text-2xl font-black text-transparent bg-clip-text font-futuristic tracking-wider mt-1" style={{
            backgroundImage: 'linear-gradient(90deg, hsl(0 72% 51%), hsl(25 95% 53%), hsl(48 96% 53%))',
          }}>
            AEROSPACE & DEEP TECH STARTUPS
          </p>
        </div>

        {/* LIVE PITCH ROOM — Industrial frame */}
        <div className="rounded-2xl overflow-hidden border-2 border-orange-500/40" style={{
          boxShadow: '0 0 40px rgba(249,115,22,0.1), inset 0 1px 0 rgba(249,115,22,0.05)',
        }}>
          <div className="bg-card/60 backdrop-blur-sm p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-muted-foreground text-sm font-futuristic tracking-wider font-bold flex items-center gap-2">
                <Radio className="w-4 h-4 text-red-400" /> LIVE PITCH ROOM
              </span>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-orange-500/30 to-transparent" />
              <span className="text-muted-foreground text-sm font-futuristic tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4" /> 200 MAX
              </span>
            </div>
            <iframe
              src="https://startupfactoryhub.whereby.com/hot-deals-space"
              allow="camera; microphone; fullscreen; speaker; display-capture"
              className="w-full h-[400px] sm:h-[500px] lg:h-[650px] rounded-xl border-2 border-border/30 bg-secondary/30"
              title="Hot Deals Live Pitch Room"
            />
            <div className="mt-3 flex items-center justify-center gap-2">
              <Rocket className="w-4 h-4 text-orange-400/40" />
              <p className="text-muted-foreground/50 text-xs font-futuristic tracking-wider">
                STARTUP FACTORY HUB — MISSION CONTROL
              </p>
              <Rocket className="w-4 h-4 text-orange-400/40 -scale-x-100" />
            </div>
          </div>
        </div>

        {/* Agenda */}
        <HotDealsAgenda />

        {/* Chat + Speakers side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <HotDealsLiveChat />
          <HotDealsSpeakers />
        </div>

        {/* Winner Announcement */}
        <HotDealsWinner />

        {/* Voting / Race Board */}
        <HotDealsVoting />

        {/* Partners */}
        <PartnersCarousel />

        {/* 3D Models + Arcade */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="rounded-2xl overflow-hidden border-2 border-orange-500/30" style={{
            boxShadow: '0 0 30px rgba(249,115,22,0.08)',
          }}>
            <div className="bg-card/60 p-4">
              <SpaceModelViewer models={SPACE_MODELS} defaultIndex={0} compact />
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden border-2 border-orange-500/30" style={{
            boxShadow: '0 0 30px rgba(249,115,22,0.08)',
          }}>
            <div className="bg-card/60 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-orange-400" />
                <span className="text-orange-400 text-sm font-futuristic font-black tracking-wider">SPACE ARCADE</span>
              </div>
              <SpaceArcade />
            </div>
          </div>
        </div>

        {/* Marketing Banner */}
        <div className="scan-effect overflow-hidden rounded-2xl border-2 border-orange-500/30 max-w-full">
          <SpaceEventBanner />
        </div>
      </div>

      {/* FOOTER — Industrial */}
      <footer className="relative z-10 border-t-2 border-orange-500/50 py-8">
        <div className="absolute inset-x-0 top-0 h-[3px]" style={{
          background: 'linear-gradient(90deg, hsl(0 72% 51%), hsl(25 95% 53%), hsl(48 96% 53%))',
          boxShadow: '0 -2px 20px rgba(249,115,22,0.3)',
        }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-muted-foreground/50 text-sm font-futuristic tracking-wider flex items-center justify-center gap-2">
            <Flag className="w-4 h-4" /> &copy; {new Date().getFullYear()} Startup Factory Hub — Hot Deals in the Space Industry <Flag className="w-4 h-4" />
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HotDealsPortal;
