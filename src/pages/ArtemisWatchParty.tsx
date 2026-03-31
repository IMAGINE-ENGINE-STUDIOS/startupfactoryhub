import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MatrixBackground from "@/components/MatrixBackground";

const ArtemisWatchParty = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Load model-viewer script
    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js";
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#00FF41] font-mono relative overflow-x-hidden">
      {/* Matrix rain background */}
      <div className="fixed inset-0 z-0 opacity-15">
        <MatrixBackground />
      </div>

      {/* Subtle grid overlay */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,255,65,0.3) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,255,65,0.3) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-[#00FF41]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-[#00FF41]/70 hover:text-[#00FF41] transition-colors font-mono text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">[RETURN_HOME]</span>
            </button>
            <div className="bg-black/60 backdrop-blur-lg border border-[#00FF41]/30 rounded-lg px-4 py-2">
              <span className="text-[#00FF41]/60 text-xs">SYS://</span>
              <span className="text-[#00FF41] text-xs ml-1 animate-pulse">LIVE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Title */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-6">
        <div className="bg-black/50 backdrop-blur-lg border border-[#00FF41]/30 rounded-xl p-6 sm:p-8 text-center">
          <p className="text-[#00FF41]/50 text-xs tracking-[0.3em] mb-2 font-mono">
            {">"} INITIALIZING STREAM CONNECTION...
          </p>
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#00FF41] leading-tight tracking-wide"
            style={{
              textShadow: "0 0 20px rgba(0,255,65,0.5), 0 0 40px rgba(0,255,65,0.2)",
            }}
          >
            Welcome to the Startup Factory Hub's
            <br />
            Artemis II Online Watch Party!
          </h1>
          <p className="text-[#00FF41]/40 text-xs mt-3 font-mono">
            STATUS: CONNECTED | ENCRYPTION: AES-256 | LATENCY: 12ms
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          {/* Left Column - Video */}
          <div className="space-y-6">
            <div className="bg-black/40 backdrop-blur-lg border border-[#00FF41]/30 rounded-xl p-1 hover:shadow-[0_0_15px_rgba(0,255,65,0.4)] transition-shadow duration-300">
              <div className="bg-black/60 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-[#00FF41] animate-pulse" />
                  <span className="text-[#00FF41]/70 text-xs font-mono">
                    STREAM_FEED.exe — WHEREBY_SECURE_CHANNEL
                  </span>
                </div>
                <iframe
                  src="about:blank"
                  allow="camera; microphone; fullscreen; speaker; display-capture"
                  className="w-full h-[400px] sm:h-[500px] lg:h-[600px] rounded-xl border-none bg-black/80"
                  title="Whereby Video Room"
                />
                <p className="text-[#00FF41]/30 text-[10px] mt-2 text-center font-mono">
                  Replace src with your Whereby room URL to activate live video
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Widgets */}
          <div className="space-y-6">
            {/* NASA Moon Map */}
            <div className="bg-black/40 backdrop-blur-lg border border-[#00FF41]/30 rounded-xl p-1 hover:shadow-[0_0_15px_rgba(0,255,65,0.4)] transition-shadow duration-300">
              <div className="bg-black/60 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[#00FF41] text-xs font-mono font-bold">
                    {">"}_LIVE_MOON_TRACKER.exe
                  </span>
                </div>
                <iframe
                  src="https://eyes.nasa.gov/apps/solar-system/#/moon/telescope?detailPanel=false&logo=false&shareButton=false&menu=false&collapseSettingsOptions=true&surfaceMapTiling=true&hd=true"
                  allowFullScreen
                  className="w-full h-64 rounded-xl border-none opacity-90"
                  title="NASA Moon Tracker"
                />
              </div>
            </div>

            {/* AR Explorer */}
            <div className="bg-black/40 backdrop-blur-lg border border-[#00FF41]/30 rounded-xl p-1 hover:shadow-[0_0_15px_rgba(0,255,65,0.4)] transition-shadow duration-300">
              <div className="bg-black/60 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[#00FF41] text-xs font-mono font-bold">
                    {">"}_EXPLORE_IN_AR.sh
                  </span>
                </div>
                {/* @ts-ignore - model-viewer is a web component */}
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
                    height: "250px",
                    backgroundColor: "transparent",
                    borderRadius: "0.75rem",
                  }}
                >
                  <button
                    slot="ar-button"
                    className="absolute bottom-4 right-4 bg-black/60 border border-[#00FF41] text-[#00FF41] hover:bg-[#00FF41] hover:text-black hover:shadow-[0_0_10px_#00FF41] backdrop-blur-sm px-4 py-2 rounded font-mono font-bold transition-all duration-300 text-xs"
                  >
                    [ INITIALIZE AR ]
                  </button>
                {/* @ts-ignore */}
                </model-viewer>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-black/40 backdrop-blur-lg border border-[#00FF41]/30 rounded-xl p-4">
              <span className="text-[#00FF41]/70 text-xs font-mono font-bold block mb-3">
                {">"}_SYS_STATUS.log
              </span>
              <div className="space-y-2 text-[10px] font-mono text-[#00FF41]/50">
                <p>[ OK ] Video relay node ........... STANDBY</p>
                <p>[ OK ] Lunar telemetry feed ....... ACTIVE</p>
                <p>[ OK ] AR rendering engine ........ LOADED</p>
                <p>[ OK ] Encryption layer ........... AES-256</p>
                <p className="text-[#00FF41]/30">
                  — END OF STATUS REPORT —
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtemisWatchParty;
