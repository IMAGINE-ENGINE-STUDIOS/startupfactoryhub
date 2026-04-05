import { useEffect, useMemo, useRef, useState } from "react";
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

type ModelViewerElement = HTMLElement & {
  activateAR?: () => Promise<void> | void;
  canActivateAR?: boolean;
};

const SpaceModelViewer = ({ models, defaultIndex = 0, compact = false }: SpaceModelViewerProps) => {
  const [activeModel, setActiveModel] = useState(Math.min(defaultIndex, models.length - 1));
  const [arSupported, setArSupported] = useState(false);
  const [arActive, setArActive] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "error">("loading");
  const [loadProgress, setLoadProgress] = useState(0);
  const [arMessage, setArMessage] = useState("Move your phone slowly to scan a floor or table surface.");
  const viewerRef = useRef<ModelViewerElement | null>(null);

  const isMobile = useMemo(
    () => /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent),
    [],
  );
  const isIOS = useMemo(
    () => /iPad|iPhone|iPod/i.test(navigator.userAgent),
    [],
  );
  const isAndroid = useMemo(
    () => /Android/i.test(navigator.userAgent),
    [],
  );

  useEffect(() => {
    const xr = (navigator as Navigator & { xr?: { isSessionSupported: (mode: string) => Promise<boolean> } }).xr;
    if (!isMobile) {
      setArSupported(false);
      setArMessage("AR launch is available on supported mobile devices.");
      return;
    }

    if (xr) {
      xr.isSessionSupported("immersive-ar")
        .then((supported) => {
          setArSupported(supported || isAndroid || isIOS);
          setArMessage(
            supported
              ? "Scan the ground, then tap to place the model in your space."
              : isIOS
                ? "Quick Look may be limited for GLB files on iPhone/iPad. Android gives the best AR support here."
                : "Use your phone camera to scan a floor or table, then place the model.",
          );
        })
        .catch(() => {
          setArSupported(isAndroid || isIOS);
          setArMessage(
            isIOS
              ? "Quick Look may be limited for GLB files on iPhone/iPad. Android gives the best AR support here."
              : "Use your phone camera to scan a floor or table, then place the model.",
          );
        });
      return;
    }

    setArSupported(isAndroid || isIOS);
    setArMessage(
      isIOS
        ? "Quick Look may be limited for GLB files on iPhone/iPad. Android gives the best AR support here."
        : "Use your phone camera to scan a floor or table, then place the model.",
    );
  }, [isAndroid, isIOS, isMobile]);

  useEffect(() => {
    setLoadState("loading");
    setLoadProgress(0);
    setArActive(false);
  }, [activeModel]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const onLoad = () => setLoadState("loaded");
    const onError = () => setLoadState("error");
    const onProgress = (e: Event) => {
      const detail = (e as CustomEvent<{ totalProgress?: number }>).detail;
      if (detail?.totalProgress != null) {
        setLoadProgress(Math.round(detail.totalProgress * 100));
      }
    };
    const handleArStatus = (event: Event) => {
      const detail = (event as CustomEvent<{ status?: string }>).detail;
      if (detail?.status === "session-started") {
        setArActive(true);
        setArMessage("Scanning started — move the phone slowly until a surface is found.");
      } else if (detail?.status === "object-placed") {
        setArMessage("Model placed — walk around it or pinch to resize if supported.");
      } else if (detail?.status === "failed") {
        setArActive(false);
        setArMessage("AR launch failed on this device. Try Android Chrome for the best result.");
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

  const launchAR = async () => {
    const viewer = viewerRef.current;

    if (!isMobile) {
      setArMessage("AR only works on supported mobile devices.");
      return;
    }

    if (loadState !== "loaded") {
      setArMessage("Wait for the 3D model to finish loading before starting AR.");
      return;
    }

    if (viewer?.activateAR) {
      try {
        setArMessage("Opening camera scan… point your phone at the floor or a table.");
        await viewer.activateAR();
        return;
      } catch {
        setArMessage("AR could not start on this device. Try Android Chrome for the best support.");
      }
    }

    if (isAndroid) {
      const sceneViewerUrl = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(models[activeModel].src)}&mode=ar_preferred#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;end;`;
      window.location.href = sceneViewerUrl;
      return;
    }

    setArMessage("This model uses GLB, so iPhone AR may be limited without a USDZ version.");
    window.open(models[activeModel].src, "_blank", "noopener,noreferrer");
  };

  const viewerHeight = compact ? "280px" : "450px";
  const canLaunchAr = isMobile && loadState === "loaded";

  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Rotate3d className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-primary text-xs font-bold tracking-wider truncate">
            3D SPACE EXPLORER ({activeModel + 1}/{models.length})
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {arSupported && (
            <span className="text-[9px] font-mono text-primary/60 mr-1 hidden sm:inline">
              MOBILE AR ✓
            </span>
          )}
          <button
            onClick={() => setActiveModel((p) => (p - 1 + models.length) % models.length)}
            className="glass-morphism border border-primary/30 text-primary hover:bg-primary/20 p-1 rounded-lg transition-all"
            aria-label="Previous model"
          >
            <ChevronLeft className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
          </button>
          <button
            onClick={() => setActiveModel((p) => (p + 1) % models.length)}
            className="glass-morphism border border-primary/30 text-primary hover:bg-primary/20 p-1 rounded-lg transition-all"
            aria-label="Next model"
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

        {loadState === "error" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card/90 rounded-xl px-4 text-center">
            <p className="text-destructive text-xs font-mono mb-2">⚠ MODEL FAILED TO LOAD</p>
            <button
              onClick={() => {
                setLoadState("loading");
                setLoadProgress(0);
                setActiveModel((p) => p);
              }}
              className="glass-morphism border border-primary/50 text-primary px-3 py-1.5 rounded-lg text-[10px] font-mono hover:bg-primary/20 transition-all"
            >
              RETRY
            </button>
          </div>
        )}

        <model-viewer
          ref={(el) => {
            viewerRef.current = el as ModelViewerElement | null;
          }}
          key={`model-${activeModel}`}
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

      <button
        onClick={launchAR}
        disabled={!canLaunchAr}
        className={`w-full mt-2 glass-morphism border border-primary/50 rounded-xl font-bold transition-all duration-300 tracking-wider flex items-center justify-center gap-2 ${
          compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm"
        } ${
          canLaunchAr
            ? "text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-glow"
            : "text-muted-foreground/60 opacity-70 cursor-not-allowed"
        }`}
      >
        <Smartphone className="w-4 h-4" />
        {isMobile ? "START MOBILE AR SCAN" : "OPEN ON MOBILE FOR AR"}
        {arActive && <span className="text-[9px] bg-primary/20 px-1.5 py-0.5 rounded ml-1">ACTIVE</span>}
      </button>

      <div className="flex items-center justify-center gap-3 mt-1.5 px-2 text-center">
        <span className="text-muted-foreground/60 text-[9px] font-mono">
          {arMessage}
        </span>
      </div>

      <div className={`flex gap-1.5 mt-3 overflow-x-auto pb-1 scrollbar-thin`}>
        {models.map((model, i) => (
          <button
            key={model.name}
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
