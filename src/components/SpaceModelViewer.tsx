import { useEffect, useRef, useState } from "react";
import "@google/model-viewer";
import { ChevronLeft, ChevronRight, Smartphone, View, Rotate3d } from "lucide-react";

interface SpaceModel {
  name: string;
  src: string;
  alt: string;
}

interface SpaceModelViewerProps {
  models: SpaceModel[];
  defaultIndex?: number;
  compact?: boolean;
}

const SpaceModelViewer = ({ models, defaultIndex = 1, compact = false }: SpaceModelViewerProps) => {
  const [activeModel, setActiveModel] = useState(defaultIndex);
  const [arSupported, setArSupported] = useState(false);
  const [arActive, setArActive] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "error">("loading");
  const [loadProgress, setLoadProgress] = useState(0);
  const viewerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const xr = (navigator as any).xr;
    if (xr) {
      xr.isSessionSupported("immersive-ar").then((supported: boolean) => {
        setArSupported(supported);
      }).catch(() => setArSupported(false));
    }
  }, []);

  // Reset load state on model change
  useEffect(() => {
    setLoadState("loading");
    setLoadProgress(0);
  }, [activeModel]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const onLoad = () => setLoadState("loaded");
    const onError = () => setLoadState("error");
    const onProgress = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.totalProgress != null) {
        setLoadProgress(Math.round(detail.totalProgress * 100));
      }
    };
    const handleArStatus = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail?.status === "session-started") {
        setArActive(true);
      } else if (detail?.status === "not-presenting") {
        setArActive(false);
      }
    };

    viewer.addEventListener("load", onLoad);
    viewer.addEventListener("error", onError);
    viewer.addEventListener("progress", onProgress);
    viewer.addEventListener("ar-status", handleArStatus);
    return () => {
      viewer.removeEventListener("load", onLoad);
      viewer.removeEventListener("error", onError);
      viewer.removeEventListener("progress", onProgress);
      viewer.removeEventListener("ar-status", handleArStatus);
    };
  }, [activeModel]);

  const launchAR = () => {
    const mv = viewerRef.current as any;
    const xr = (navigator as any).xr;
    if (mv?.activateAR) {
      mv.activateAR();
    } else if (xr) {
      xr.requestSession("immersive-ar", {
        requiredFeatures: ["hit-test", "local-floor"],
        optionalFeatures: ["dom-overlay", "light-estimation"],
      }).then((session: any) => {
        console.log("WebXR AR session started", session);
      }).catch((err: any) => {
        console.warn("WebXR AR not available:", err);
        // Fallback: open model in Scene Viewer (Android) or Quick Look (iOS)
        const intentUrl = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(models[activeModel].src)}&mode=ar_preferred#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;end;`;
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (isIOS) {
          // USDZ would be needed for Quick Look, fallback to opening GLB
          window.open(models[activeModel].src, "_blank");
        } else {
          window.location.href = intentUrl;
        }
      });
    } else {
      window.open(models[activeModel].src, "_blank");
    }
  };

  const viewerHeight = compact ? "280px" : "450px";

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Rotate3d className="w-3.5 h-3.5 text-primary" />
          <span className="text-primary text-xs font-bold tracking-wider">
            3D SPACE EXPLORER ({activeModel + 1}/{models.length})
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {arSupported && (
            <span className="text-[9px] font-mono text-primary/60 mr-1 hidden sm:inline">
              WebXR AR ✓
            </span>
          )}
          <button
            onClick={() => setActiveModel((p) => (p - 1 + models.length) % models.length)}
            className="glass-morphism border border-primary/30 text-primary hover:bg-primary/20 p-1 rounded-lg transition-all"
          >
            <ChevronLeft className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
          </button>
          <button
            onClick={() => setActiveModel((p) => (p + 1) % models.length)}
            className="glass-morphism border border-primary/30 text-primary hover:bg-primary/20 p-1 rounded-lg transition-all"
          >
            <ChevronRight className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
          </button>
        </div>
      </div>

      <p className="text-foreground text-xs font-semibold mb-2">
        {models[activeModel].name}
        {loadState === "loading" && (
          <span className="text-muted-foreground/60 text-[10px] font-mono ml-2">
            — LOADING {loadProgress}%
          </span>
        )}
        {loadState === "error" && (
          <span className="text-destructive text-[10px] font-mono ml-2">— LOAD FAILED</span>
        )}
      </p>

      <div className="relative" style={{ height: viewerHeight }}>
        {/* Loading overlay */}
        {loadState === "loading" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card/90 rounded-xl">
            <Rotate3d className="w-8 h-8 text-primary animate-spin mb-3" />
            <p className="text-muted-foreground text-xs font-mono mb-2">LOADING 3D MODEL...</p>
            <div className="w-48 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
            <p className="text-muted-foreground/50 text-[9px] font-mono mt-1">{loadProgress}%</p>
          </div>
        )}

        {/* Error overlay */}
        {loadState === "error" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card/90 rounded-xl">
            <p className="text-destructive text-xs font-mono mb-2">⚠ MODEL FAILED TO LOAD</p>
            <button
              onClick={() => {
                setLoadState("loading");
                setLoadProgress(0);
                setActiveModel((p) => p); // force re-render
              }}
              className="glass-morphism border border-primary/50 text-primary px-3 py-1.5 rounded-lg text-[10px] font-mono hover:bg-primary/20 transition-all"
            >
              RETRY
            </button>
          </div>
        )}

        <model-viewer
          ref={(el: HTMLElement | null) => { viewerRef.current = el; }}
          key={`${activeModel}-${loadState === "error" ? Date.now() : ""}`}
          src={models[activeModel].src}
          alt={models[activeModel].alt}
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
          shadow-intensity="1.5"
          shadow-softness="0.8"
          exposure="1.1"
          camera-orbit="45deg 65deg auto"
          min-camera-orbit="auto auto 5%"
          max-camera-orbit="auto auto 200%"
          interaction-prompt="auto"
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "transparent",
            borderRadius: "0.75rem",
          }}
        >
          <button
            slot="ar-button"
            className="absolute bottom-3 right-3 glass-morphism border border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground px-3 py-1.5 rounded-lg font-bold transition-all duration-300 text-[10px] tracking-wider z-10 flex items-center gap-1.5"
          >
            <View className="w-3 h-3" />
            VIEW IN AR
          </button>
        </model-viewer>
      </div>

      {/* AR Launch Button - always visible */}
      <button
        onClick={launchAR}
        className={`w-full mt-2 glass-morphism border border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-glow ${
          compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm"
        } rounded-xl font-bold transition-all duration-300 tracking-wider flex items-center justify-center gap-2`}
      >
        <Smartphone className="w-4 h-4" />
        {arSupported ? "LAUNCH AR — GOOGLE WebXR" : "LAUNCH AR VIEW"}
        {arActive && <span className="text-[9px] bg-primary/20 px-1.5 py-0.5 rounded ml-1">ACTIVE</span>}
      </button>

      {/* AR capabilities info */}
      <div className="flex items-center justify-center gap-3 mt-1.5">
        <span className="text-muted-foreground/50 text-[9px] font-mono">
          {arSupported
            ? "WebXR: HIT-TEST • SURFACE DETECTION • LIGHT ESTIMATION"
            : "Rotate: drag • Zoom: pinch/scroll • AR: mobile only"
          }
        </span>
      </div>

      {/* Model selector */}
      <div className={`flex gap-1.5 mt-3 overflow-x-auto pb-1 scrollbar-thin`}>
        {models.map((model, i) => (
          <button
            key={i}
            onClick={() => setActiveModel(i)}
            className={`shrink-0 ${compact ? "px-2 py-1 text-[9px]" : "px-3 py-1.5 text-[10px]"} rounded-lg font-mono tracking-wider border transition-all ${
              i === activeModel
                ? "bg-primary/20 border-primary text-primary"
                : "glass-morphism border-border/50 text-muted-foreground hover:border-primary/50 hover:text-primary"
            }`}
          >
            {model.name.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SpaceModelViewer;
