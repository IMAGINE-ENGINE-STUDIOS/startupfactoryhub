import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { EarthGlobe } from "@/components/ar-world/EarthGlobe";
import { ARCameraView } from "@/components/ar-world/ARCameraView";
import { DropDialog } from "@/components/ar-world/DropDialog";
import { DropDetailDialog } from "@/components/ar-world/DropDetailDialog";
import { LocationPermissionPrompt } from "@/components/ar-world/LocationPermissionPrompt";
import { useARDrops, type ARDrop } from "@/hooks/useARDrops";
import { useGalaxyPresence, distanceMeters } from "@/hooks/useGalaxyPresence";
import { useSpatialVoice } from "@/hooks/useSpatialVoice";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Camera,
  Globe2,
  Mic,
  MicOff,
  Users,
  Sparkles,
  MapPin,
  Lock,
  Video,
  VideoOff,
  X,
} from "lucide-react";

type Mode = "ar" | "globe";

const detectIsMobileAR = () => {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
  const hasCamera = !!navigator.mediaDevices?.getUserMedia;
  const hasGeo = !!navigator.geolocation;
  return isMobile && hasCamera && hasGeo;
};

export default function Galaxy() {
  const { user, loading: authLoading } = useAuth();
  const { role } = useUserRole();
  const isAdmin = role === "admin";
  const { drops, loading, createDrop, moveDrop, deleteDrop, updateDropTransform } = useARDrops();

  const [mode, setMode] = useState<Mode>(() =>
    detectIsMobileAR() ? "ar" : "globe"
  );
  const [radiusMeters, setRadiusMeters] = useState(1000);
  const [placingMode, setPlacingMode] = useState(false);
  const [pickedLatLng, setPickedLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [dropDialogOpen, setDropDialogOpen] = useState(false);
  const [selectedDrop, setSelectedDrop] = useState<ARDrop | null>(null);
  const [locationPromptDismissed, setLocationPromptDismissed] = useState(false);

  const presenceActive = !!user;
  const {
    peers,
    myLocation,
    myColor,
    myName,
    requestLocation,
    locationError,
    locationDenied,
    locationPermissionState,
  } = useGalaxyPresence(presenceActive);

  const {
    initVoice,
    voiceReady,
    muted,
    toggleMute,
    connectedPeers,
    updatePeerPosition,
    cameraOn,
    toggleCamera,
    peerVideoStreams,
    localVideoStream,
    micLevel,
  } = useSpatialVoice(presenceActive);

  // Bind local face cam stream to a preview <video>
  const previewRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (previewRef.current) {
      previewRef.current.srcObject = localVideoStream;
      if (localVideoStream) previewRef.current.play().catch(() => {});
    }
  }, [localVideoStream]);

  // SEO
  useEffect(() => {
    document.title = "Galaxy — AR drops, presence & spatial voice on Earth";
    const desc =
      "Galaxy: open your camera, see AR content within 1km, find others as glowing orbs and talk in true 3D spatial audio.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
  }, []);

  const dropHere = async () => {
    setLocationPromptDismissed(false);
    const location =
      myLocation ??
      (await requestLocation().catch(() => {
        return null;
      }));

    if (!location) {
      if (locationPermissionState === "denied") {
        setLocationPromptDismissed(true);
        setMode("globe");
        setPlacingMode(true);
        toast.error("Location is blocked. Pick a spot on the globe to add content instead.");
        return;
      }

      toast.error(locationError || "Galaxy needs your location before you can place content.");
      return;
    }

    setPickedLatLng({ lat: location.latitude, lng: location.longitude });
    setDropDialogOpen(true);
  };

  const handlePickLocation = (lat: number, lng: number) => {
    setPickedLatLng({ lat, lng });
    setDropDialogOpen(true);
    setPlacingMode(false);
  };

  useEffect(() => {
    if (myLocation) {
      setLocationPromptDismissed(false);
    }
  }, [myLocation]);

  const nearbyCount = useMemo(() => {
    if (!myLocation) return { drops: 0, peers: 0 };
    const d = drops.filter(
      (x) =>
        distanceMeters(myLocation.latitude, myLocation.longitude, x.latitude, x.longitude) <=
        radiusMeters
    ).length;
    const p = peers.filter(
      (x) =>
        distanceMeters(myLocation.latitude, myLocation.longitude, x.latitude, x.longitude) <=
        radiusMeters
    ).length;
    return { drops: d, peers: p };
  }, [drops, peers, myLocation, radiusMeters]);

  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center text-white/60">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading...
      </div>
    );
  }

  if (!user) {
    const redirect = encodeURIComponent("/galaxy");
    return (
      <div className="fixed inset-0 bg-black text-foreground overflow-hidden flex flex-col">
        <div className="absolute top-0 left-0 right-0 p-3 flex items-center gap-2">
          <Link to="/">
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/10 h-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-base font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Galaxy
          </h1>
        </div>

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-sm w-full text-center bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-semibold text-white">Sign in to enter Galaxy</h2>
              <p className="text-sm text-white/60">
                Galaxy uses your camera, location and microphone for live AR and 360° spatial voice.
                Please sign in first to continue.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <Link to={`/auth?redirect=${redirect}`}>
                <Button size="lg" className="w-full">Sign in</Button>
              </Link>
              <Link to={`/auth?tab=signup&redirect=${redirect}`}>
                <Button size="lg" variant="outline" className="w-full bg-transparent border-white/20 text-white hover:bg-white/10">
                  Create an account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black text-foreground overflow-hidden">
      {loading ? (
        <div className="w-full h-full flex items-center justify-center text-white/60">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading Galaxy...
        </div>
      ) : mode === "ar" ? (
        <ARCameraView
          drops={drops}
          peers={peers}
          myLocation={myLocation}
          myColor={myColor}
          myName={myName}
          myUserId={user.id}
          isAdmin={isAdmin}
          radiusMeters={radiusMeters}
          onSelectDrop={setSelectedDrop}
          onMoveDrop={moveDrop}
          onUpdateDropTransform={updateDropTransform}
          onUpdatePeerPosition={updatePeerPosition}
          peerVideoStreams={peerVideoStreams}
          faceCameraActive={cameraOn}
        />
      ) : (
        <EarthGlobe
          drops={drops}
          placingMode={placingMode}
          onPickLocation={handlePickLocation}
          onSelectDrop={setSelectedDrop}
        />
      )}

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-3 flex items-start justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <Link to="/">
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/10 h-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Galaxy
            </h1>
            <p className="text-[10px] text-white/60 leading-tight">
              {mode === "ar" ? "Live AR · 360° spatial audio" : "World map of drops"}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div className="flex bg-black/60 backdrop-blur border border-white/10 rounded-lg overflow-hidden">
            <button
              onClick={() => setMode("ar")}
              className={`px-2.5 py-1.5 text-xs flex items-center gap-1 ${
                mode === "ar" ? "bg-primary text-primary-foreground" : "text-white/70"
              }`}
            >
              <Camera className="w-3 h-3" />
              AR
            </button>
            <button
              onClick={() => setMode("globe")}
              className={`px-2.5 py-1.5 text-xs flex items-center gap-1 ${
                mode === "globe" ? "bg-primary text-primary-foreground" : "text-white/70"
              }`}
            >
              <Globe2 className="w-3 h-3" />
              Globe
            </button>
          </div>

          {mode === "ar" && myLocation && (
            <div className="bg-black/60 backdrop-blur border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white/80 flex items-center gap-2">
              <Users className="w-3 h-3" />
              {nearbyCount.peers} nearby
              <span className="opacity-50">·</span>
              <MapPin className="w-3 h-3" />
              {nearbyCount.drops} drops
            </div>
          )}
        </div>
      </div>

      {/* Local face cam preview (top-right under header). When this is on,
          the rear AR camera is paused — most phones can't run both at once. */}
      {mode === "ar" && cameraOn && localVideoStream && (
        <div className="absolute top-28 right-3 pointer-events-auto">
          <div
            className="relative rounded-xl overflow-hidden border-2 shadow-2xl"
            style={{
              width: 96,
              height: 96,
              borderColor: myColor,
              boxShadow: `0 0 16px ${myColor}aa`,
            }}
          >
            <video
              ref={previewRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
            <button
              onClick={toggleCamera}
              aria-label="Turn camera off"
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="absolute bottom-1 left-1 right-1 text-[9px] text-white text-center bg-black/60 rounded px-1 py-0.5 truncate">
              You
            </div>
          </div>
          <div className="mt-1 text-[9px] text-white/70 bg-black/60 backdrop-blur rounded px-1.5 py-0.5 text-center max-w-[96px]">
            AR view paused
          </div>
        </div>
      )}

      {/* Radius slider (AR mode only) */}
      {mode === "ar" && (
        <div className="absolute top-20 left-3 right-3 pointer-events-auto bg-black/60 backdrop-blur border border-white/10 rounded-lg px-3 py-2 max-w-[220px]">
          <div className="flex items-center justify-between text-[10px] text-white/70 mb-1">
            <span>Radius</span>
            <span className="font-semibold text-white">
              {radiusMeters >= 1000
                ? `${(radiusMeters / 1000).toFixed(1)} km`
                : `${radiusMeters} m`}
            </span>
          </div>
          <Slider
            value={[radiusMeters]}
            min={100}
            max={5000}
            step={50}
            onValueChange={(v) => setRadiusMeters(v[0])}
          />
        </div>
      )}

      {/* Bottom centered controls: mic · + · camera */}
      <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-2 pointer-events-none">
        {voiceReady && mode === "ar" && (
          <Badge
            variant="secondary"
            className="bg-black/60 backdrop-blur text-white border-white/10 text-[10px] h-5 pointer-events-auto"
          >
            {connectedPeers.size} in voice
          </Badge>
        )}

        <div className="flex items-center gap-5 pointer-events-auto">
          {/* Mic button (left) */}
          {mode === "ar" ? (
            !voiceReady ? (
              <button
                onClick={initVoice}
                aria-label="Join voice"
                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition shadow-lg"
              >
                <Mic className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={toggleMute}
                aria-label={muted ? "Unmute" : "Mute"}
                className={`relative w-12 h-12 rounded-full flex items-center justify-center transition shadow-lg border ${
                  muted
                    ? "bg-destructive/90 hover:bg-destructive text-white border-white/10"
                    : "bg-emerald-500/90 hover:bg-emerald-500 text-white border-white/20"
                }`}
                style={
                  !muted && micLevel > 0.02
                    ? {
                        boxShadow: `0 0 0 ${Math.round(
                          micLevel * 12
                        )}px rgba(16,185,129,${0.35 - micLevel * 0.2})`,
                      }
                    : undefined
                }
              >
                {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )
          ) : (
            <div className="w-12 h-12" />
          )}

          {/* + button (center) */}
          {mode === "ar" ? (
            <button
              onClick={() => {
                void dropHere();
              }}
              aria-label="Add content here"
              className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition border-2 border-white/20"
            >
              <Plus className="w-7 h-7" strokeWidth={2.5} />
            </button>
          ) : (
            <button
              onClick={() => setPlacingMode((p) => !p)}
              aria-label={placingMode ? "Cancel placing" : "Add content on globe"}
              className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition border-2 border-white/20 ${
                placingMode
                  ? "bg-destructive text-white"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              <Plus
                className={`w-7 h-7 transition-transform ${placingMode ? "rotate-45" : ""}`}
                strokeWidth={2.5}
              />
            </button>
          )}

          {/* Camera (face-cam) button (right) */}
          {mode === "ar" ? (
            <button
              onClick={() => {
                void toggleCamera();
              }}
              aria-label={cameraOn ? "Turn camera off" : "Turn camera on"}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-lg border ${
                cameraOn
                  ? "bg-primary/90 hover:bg-primary text-primary-foreground border-white/20"
                  : "bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur"
              }`}
            >
              {cameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
          ) : (
            <div className="w-12 h-12" />
          )}
        </div>
      </div>

      <DropDialog
        open={dropDialogOpen}
        onOpenChange={(o) => {
          setDropDialogOpen(o);
          if (!o) setPickedLatLng(null);
        }}
        latitude={pickedLatLng?.lat ?? null}
        longitude={pickedLatLng?.lng ?? null}
        onCreate={createDrop}
      />

      <DropDetailDialog
        drop={selectedDrop}
        onClose={() => setSelectedDrop(null)}
        onDelete={deleteDrop}
      />

      {mode === "ar" && !myLocation && !locationPromptDismissed && (
        <LocationPermissionPrompt
          message={
            locationError ||
            "AR drops are anchored to real GPS coordinates. Without location, every object falls back to the screen center — that's why they look glued. Allow location to see them in true 3D space."
          }
          onRequest={requestLocation}
          blocked={locationPermissionState === "denied"}
          onContinueWithoutLocation={() => {
            setLocationPromptDismissed(true);
            toast.error("Location is still required for AR placement. Enable it in browser settings, then tap + again.");
          }}
        />
      )}
    </div>
  );
}
