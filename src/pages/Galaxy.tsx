import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EarthGlobe } from "@/components/ar-world/EarthGlobe";
import { ARCameraView } from "@/components/ar-world/ARCameraView";
import { DropDialog } from "@/components/ar-world/DropDialog";
import { DropDetailDialog } from "@/components/ar-world/DropDetailDialog";
import { useARDrops, type ARDrop } from "@/hooks/useARDrops";
import { useGalaxyPresence, distanceMeters } from "@/hooks/useGalaxyPresence";
import { useSpatialVoice } from "@/hooks/useSpatialVoice";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
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
  const { user } = useAuth();
  const { drops, loading, createDrop, deleteDrop } = useARDrops();

  const [mode, setMode] = useState<Mode>(() =>
    detectIsMobileAR() ? "ar" : "globe"
  );
  const [radiusMeters, setRadiusMeters] = useState(1000);
  const [placingMode, setPlacingMode] = useState(false);
  const [pickedLatLng, setPickedLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [dropDialogOpen, setDropDialogOpen] = useState(false);
  const [selectedDrop, setSelectedDrop] = useState<ARDrop | null>(null);

  // Live presence (only active when signed in)
  const presenceActive = !!user;
  const { peers, myLocation, myColor, myName } = useGalaxyPresence(presenceActive);

  // Spatial voice (lazily initialized when user taps mic)
  const {
    initVoice,
    stopVoice,
    voiceReady,
    muted,
    toggleMute,
    connectedPeers,
    updatePeerPosition,
  } = useSpatialVoice(presenceActive);

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

  // Drop here at my current location (AR flow)
  const dropHere = () => {
    if (!myLocation) return;
    setPickedLatLng({ lat: myLocation.latitude, lng: myLocation.longitude });
    setDropDialogOpen(true);
  };

  // Globe pick
  const handlePickLocation = (lat: number, lng: number) => {
    setPickedLatLng({ lat, lng });
    setDropDialogOpen(true);
    setPlacingMode(false);
  };

  // Counts of nearby items for status bar
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

  return (
    <div className="fixed inset-0 bg-black text-foreground overflow-hidden">
      {/* Main view */}
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
          radiusMeters={radiusMeters}
          onSelectDrop={setSelectedDrop}
          onUpdatePeerPosition={updatePeerPosition}
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
          {/* Mode toggle */}
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

          {/* Status */}
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

      {/* Radius slider (AR mode only) */}
      {mode === "ar" && (
        <div className="absolute top-20 left-3 right-3 pointer-events-auto bg-black/60 backdrop-blur border border-white/10 rounded-lg px-3 py-2">
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

      {/* Bottom controls */}
      <div className="absolute bottom-4 left-3 right-3 flex items-end justify-between pointer-events-none">
        {/* Voice toggle */}
        <div className="pointer-events-auto flex flex-col gap-2 items-start">
          {user && mode === "ar" && (
            <>
              {!voiceReady ? (
                <Button
                  size="sm"
                  onClick={initVoice}
                  className="bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20 h-9"
                >
                  <Mic className="w-4 h-4 mr-1" />
                  Join voice
                </Button>
              ) : (
                <div className="flex flex-col gap-1.5 items-start">
                  <Button
                    size="sm"
                    onClick={toggleMute}
                    className={
                      muted
                        ? "bg-destructive hover:bg-destructive/90 text-white h-9"
                        : "bg-emerald-500/90 hover:bg-emerald-500 text-white h-9"
                    }
                  >
                    {muted ? (
                      <MicOff className="w-4 h-4 mr-1" />
                    ) : (
                      <Mic className="w-4 h-4 mr-1" />
                    )}
                    {muted ? "Muted" : "Live"}
                  </Button>
                  <Badge
                    variant="secondary"
                    className="bg-black/60 backdrop-blur text-white border-white/10 text-[10px] h-5"
                  >
                    {connectedPeers.size} voice
                  </Badge>
                </div>
              )}
            </>
          )}
        </div>

        {/* Drop content */}
        <div className="pointer-events-auto">
          {!user ? (
            <Link to="/auth">
              <Button size="lg" className="shadow-lg">
                Sign in to join Galaxy
              </Button>
            </Link>
          ) : mode === "ar" ? (
            <Button
              size="lg"
              onClick={dropHere}
              disabled={!myLocation}
              className="bg-primary hover:bg-primary/90 shadow-lg"
            >
              <Plus className="w-5 h-5 mr-1" />
              Drop here
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={() => setPlacingMode((p) => !p)}
              className={
                placingMode
                  ? "bg-destructive hover:bg-destructive/90 text-white shadow-lg"
                  : "bg-primary hover:bg-primary/90 shadow-lg"
              }
            >
              {placingMode ? (
                "Cancel"
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-1" />
                  Drop on globe
                </>
              )}
            </Button>
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
    </div>
  );
}
