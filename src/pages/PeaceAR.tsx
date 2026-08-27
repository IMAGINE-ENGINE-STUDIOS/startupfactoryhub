import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "@google/model-viewer";
import {
  ArrowLeft, Radio, Share2, Copy, Check, Mail, MessageCircle,
  View, Smartphone, Video, Loader2, Users, Leaf,
} from "lucide-react";
import logo from "@/assets/logo.png";
import bgImage from "@/assets/peace-ar-space-cannabis.jpg";
import ArtemisLiveChat from "@/components/ArtemisLiveChat";
import SpaceArcade from "@/components/SpaceArcade";
import HotDealsDJConsole from "@/components/HotDealsDJConsole";
import InteractiveMandala from "@/components/peace/InteractiveMandala";

const SHARE_URL = "https://startupfactoryhub.com/peacear";
const SHARE_TEXT =
  "Join PEACE/AR — a luxury online summit on cannabis in space. Live room for 200, AR models, mandalas, arcade and a virtual DJ.";

const KHRONOS =
  "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0";
const NASA = "https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Models";

/** Topic-related AR exhibits — cultivation, botany, lab and orbital hardware. */
const AR_PICKS = [
  { id: "sheen-chair", name: "Grow Pod", src: `${KHRONOS}/SheenChair/glTF-Binary/SheenChair.glb`, note: "Orbital cultivation seating pod" },
  { id: "avocado", name: "Botany Sample", src: `${KHRONOS}/Avocado/glTF-Binary/Avocado.glb`, note: "Microgravity plant specimen" },
  { id: "lantern", name: "Grow Light", src: `${KHRONOS}/Lantern/glTF-Binary/Lantern.glb`, note: "Full-spectrum lighting rig" },
  { id: "water-bottle", name: "Nutrient Flask", src: `${KHRONOS}/WaterBottle/glTF-Binary/WaterBottle.glb`, note: "Hydroponic nutrient vessel" },
  { id: "boom-box", name: "Sound System", src: `${KHRONOS}/BoomBox/glTF-Binary/BoomBox.glb`, note: "Summit DJ hardware" },
  { id: "gateway-station", name: "Orbital Greenhouse", src: `${NASA}/Gateway/Gateway%20Core.glb`, note: "Deep-space habitat module" },
  { id: "nasa-astronaut", name: "Crew Botanist", src: `${NASA}/Astronaut/Astronaut.glb`, note: "Life-sciences crew member" },
];


export default function PeaceAR() {
  const navigate = useNavigate();
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [roomLoading, setRoomLoading] = useState(false);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [modelIndex, setModelIndex] = useState(0);
  const model = AR_PICKS[modelIndex];

  const copyLink = () => {
    navigator.clipboard.writeText(SHARE_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openRoom = async () => {
    setRoomLoading(true);
    setRoomError(null);
    try {
      const res = await fetch(
        "https://zqiihhmdsdgwdcwmryym.supabase.co/functions/v1/create-whereby-room",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomName: "peace-ar-summit" }),
        }
      );
      if (!res.ok) throw new Error("Room service unavailable");
      const data = await res.json();
      if (!data?.roomUrl) throw new Error("No room returned");
      setRoomUrl(data.roomUrl);
    } catch (e: any) {
      setRoomError(e?.message || "Could not open the live room");
    } finally {
      setRoomLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
      {/* Luxury space-cannabis background */}
      <div className="fixed inset-0 z-0">
        <img
          src={bgImage}
          alt="Orbital greenhouse dome with cannabis plants above Earth"
          width={1920}
          height={1088}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/80 to-background/95" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary) / 0.4) 1px, transparent 1px),
                              linear-gradient(90deg, hsl(var(--primary) / 0.4) 1px, transparent 1px)`,
            backgroundSize: "44px 44px",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 glass-morphism border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-3 group">
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
                onClick={() => setShowShare((p) => !p)}
                className="glass-morphism px-3 py-1.5 rounded-full border border-primary/30 flex items-center gap-2 text-primary hover:bg-primary/20 transition-all"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold tracking-wider hidden sm:inline">INVITE</span>
              </button>
              {showShare && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl p-3 z-[9999] space-y-2 shadow-xl bg-background backdrop-blur-none border border-primary/20">
                  <p className="text-[10px] text-muted-foreground font-mono tracking-wider mb-2">SHARE THIS EVENT</p>
                  <button
                    onClick={copyLink}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-primary/10 transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5 text-primary" />}
                    {copied ? "Link copied!" : "Copy link"}
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(SHARE_TEXT + " " + SHARE_URL)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-primary/10 transition-all"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-primary" /> WhatsApp
                  </a>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SHARE_URL)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-primary/10 transition-all"
                  >
                    <span className="w-3.5 h-3.5 text-primary font-bold text-[10px]">in</span> LinkedIn
                  </a>
                  <a
                    href={`mailto:?subject=${encodeURIComponent("PEACE/AR — Cannabis in Space Summit")}&body=${encodeURIComponent(SHARE_TEXT + "\n\n" + SHARE_URL)}`}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-primary/10 transition-all"
                  >
                    <Mail className="w-3.5 h-3.5 text-primary" /> Email
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-6">
        <div className="flex items-center gap-2 mb-3">
          <Leaf className="w-4 h-4 text-primary" />
          <span className="text-primary text-[11px] font-futuristic tracking-[0.3em]">PEACE / AR — ORBITAL SUMMIT</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight bg-gradient-primary bg-clip-text text-transparent max-w-3xl">
          Cannabis in Space
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base mt-3 max-w-2xl">
          A luxury online gathering for founders, researchers and investors exploring cultivation,
          biotech and wellness beyond Earth. Live room for up to 200 participants, AR exhibits,
          interactive mandalas and a live DJ set.
        </p>
        <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
          <Users className="w-3.5 h-3.5 text-primary" />
          <span className="font-mono tracking-wider">200 SEAT CAPACITY · ONLINE · GLOBAL</span>
        </div>
      </section>

      {/* Main grid */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-12 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Live room */}
          <div className="tech-card border-0 rounded-2xl p-1">
            <div className="bg-card/60 rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-muted-foreground text-xs font-futuristic tracking-wider">
                  LIVE VIDEO ROOM — UP TO 200 PEOPLE
                </span>
              </div>
              {roomUrl ? (
                <iframe
                  src={roomUrl}
                  allow="camera; microphone; fullscreen; speaker; display-capture"
                  className="w-full h-[350px] sm:h-[420px] lg:h-[520px] rounded-xl border-none bg-secondary/30"
                  title="PEACE/AR live room"
                />
              ) : (
                <div className="h-[300px] sm:h-[380px] rounded-xl bg-secondary/20 border border-primary/10 flex flex-col items-center justify-center gap-4 text-center px-6">
                  <Video className="w-12 h-12 text-primary" />
                  <p className="text-sm text-muted-foreground max-w-sm">
                    The room opens on demand and stays live for the full event.
                  </p>
                  <button
                    onClick={openRoom}
                    disabled={roomLoading}
                    className="glass-morphism border border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider flex items-center gap-2 transition-all disabled:opacity-60"
                  >
                    {roomLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                    {roomLoading ? "OPENING ROOM…" : "ENTER LIVE ROOM"}
                  </button>
                  {roomError && <p className="text-[11px] text-destructive font-mono">{roomError}</p>}
                </div>
              )}
              <p className="text-muted-foreground/50 text-[10px] mt-2 text-center font-mono">
                STARTUP FACTORY HUB — LIVE COMMUNITY ROOM (200 MAX CAPACITY)
              </p>
            </div>
          </div>

          {/* Live chat */}
          <ArtemisLiveChat />

          {/* Interactive mandalas */}
          <div className="tech-card border-0 rounded-2xl p-1">
            <div className="bg-card/60 rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-primary text-xs font-futuristic font-bold tracking-wider">
                  INTERACTIVE MANDALAS
                </span>
                <span className="text-muted-foreground text-[10px] font-mono tracking-wider ml-auto hidden sm:inline">
                  DRAG INSIDE TO PAINT
                </span>
              </div>
              <InteractiveMandala height={340} />
            </div>
          </div>

          {/* Virtual DJ */}
          <div className="tech-card border-0 rounded-2xl p-1">
            <div className="bg-card/60 rounded-xl p-3 sm:p-4">
              <span className="text-primary text-xs font-futuristic font-bold tracking-wider block mb-3">
                VIRTUAL DJ — LIVE SET
              </span>
              <HotDealsDJConsole />
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* AR exhibit */}
          <div className="tech-card border-0 rounded-2xl p-1">
            <div className="bg-card/60 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-3">
                <View className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-primary text-xs font-bold tracking-wider truncate">
                  AR EXHIBIT — {model.name.toUpperCase()}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {AR_PICKS.map((m, i) => (
                  <button
                    key={m.id}
                    onClick={() => setModelIndex(i)}
                    className={`px-2 py-1 rounded-md text-[9px] font-futuristic tracking-wider border transition-all ${
                      i === modelIndex
                        ? "bg-primary/20 text-primary border-primary/40"
                        : "glass-morphism text-muted-foreground border-transparent hover:text-primary"
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
              <div className="relative" style={{ height: "300px" }}>
                <model-viewer
                  key={model.id}
                  src={model.src}
                  alt={`3D model of ${model.name}`}
                  ar
                  ar-modes="webxr scene-viewer quick-look"
                  ar-scale="auto"
                  ar-placement="floor"
                  xr-environment
                  environment-image="neutral"
                  auto-rotate
                  camera-controls
                  touch-action="pan-y"
                  loading="eager"
                  shadow-intensity="1.4"
                  exposure="1.1"
                  camera-orbit="45deg 65deg auto"
                  style={{ width: "100%", height: "100%", backgroundColor: "transparent", borderRadius: "0.75rem" }}
                >
                  <button
                    slot="ar-button"
                    className="absolute bottom-3 right-3 glass-morphism border border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground px-3 py-1.5 rounded-lg font-bold transition-all text-[10px] tracking-wider z-10 flex items-center gap-1.5"
                  >
                    <View className="w-3 h-3" /> VIEW IN AR
                  </button>
                </model-viewer>
              </div>
              <a
                href={`intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(model.src)}&mode=ar_preferred&title=${encodeURIComponent(model.name)}#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=https://developers.google.com/ar;end;`}
                className="w-full mt-2 glass-morphism border border-primary/50 rounded-xl font-bold text-xs tracking-wider flex items-center justify-center gap-2 px-4 py-3 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <Smartphone className="w-4 h-4" /> LAUNCH IN GOOGLE AR
              </a>
              <p className="text-muted-foreground/60 text-[9px] font-mono mt-1.5 text-center">
                {model.note} · Google model-viewer · Scene Viewer · WebXR
              </p>
            </div>

          </div>

          {/* Program */}
          <div className="tech-card border-0 rounded-2xl p-4">
            <span className="text-primary text-xs font-futuristic font-bold tracking-wider block mb-3">
              EVENT BRIEFING
            </span>
            <div className="space-y-2.5 text-xs text-muted-foreground">
              <p><span className="text-primary/70">FOCUS:</span> Cannabis science, cultivation and wellness in microgravity</p>
              <p><span className="text-primary/70">FORMAT:</span> Online summit · panels, demos and open networking</p>
              <p><span className="text-primary/70">CAPACITY:</span> 200 live participants</p>
              <p><span className="text-primary/70">EXPERIENCES:</span> AR exhibits · mandalas · arcade · live DJ</p>
            </div>
          </div>

          {/* Arcade */}
          <div className="tech-card border-0 rounded-2xl p-1">
            <div className="bg-card/60 rounded-xl p-3">
              <span className="text-primary text-xs font-futuristic font-bold tracking-wider block mb-2">
                SPACE ARCADE
              </span>
              <SpaceArcade />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
