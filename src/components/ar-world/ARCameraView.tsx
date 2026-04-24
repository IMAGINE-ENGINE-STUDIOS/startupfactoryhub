import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import "@google/model-viewer";
import { Loader2, AlertTriangle, Hand, Pin, File as FileIcon, Music, Type as TypeIcon } from "lucide-react";
import type { ARDrop } from "@/hooks/useARDrops";
import { type GalaxyPeer, distanceMeters, gpsToLocalMeters } from "@/hooks/useGalaxyPresence";
import { LidarWireframe } from "./LidarWireframe";

interface ARCameraViewProps {
  drops: ARDrop[];
  peers: GalaxyPeer[];
  myLocation: {
    latitude: number;
    longitude: number;
    heading: number | null;
    accuracy?: number;
  } | null;
  myColor: string;
  myName: string;
  myUserId: string | null;
  isAdmin: boolean;
  radiusMeters: number;
  onSelectDrop: (drop: ARDrop) => void;
  onMoveDrop?: (
    id: string,
    latitude: number,
    longitude: number,
    altitude?: number
  ) => Promise<boolean>;
  onUpdatePeerPosition?: (peerId: string, east: number, north: number) => void;
  peerVideoStreams?: Map<string, MediaStream>;
  faceCameraActive?: boolean;
}

const FOV_H = 70; // degrees, horizontal
// Convert local east/north meters back into a lat/lon, given an origin
const localMetersToGps = (
  originLat: number,
  originLon: number,
  east: number,
  north: number
) => {
  const R = 6371000;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = north / R;
  const dLon = east / (R * Math.cos(toRad(originLat)));
  return { lat: originLat + toDeg(dLat), lon: originLon + toDeg(dLon) };
};

export const ARCameraView = ({
  drops,
  peers,
  myLocation,
  myColor,
  myName,
  myUserId,
  isAdmin,
  radiusMeters,
  onSelectDrop,
  onMoveDrop,
  onUpdatePeerPosition,
  peerVideoStreams,
  faceCameraActive = false,
}: ARCameraViewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const environmentStreamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [heading, setHeading] = useState<number>(0);

  // The drop the user is currently "holding" with the camera
  const [grabbedId, setGrabbedId] = useState<string | null>(null);
  // While grabbed, we re-project the drop to the screen center every frame.
  // We assume distance ~ 8m in front of the user while holding.
  const HOLD_DISTANCE_M = 8;

  const startEnvironmentCamera = useCallback(async () => {
    try {
      environmentStreamRef.current?.getTracks().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      environmentStreamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      if (track) {
        track.onended = () => {
          setCameraReady(false);
          window.setTimeout(() => {
            void startEnvironmentCamera();
          }, 250);
        };
      }
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraError(null);
      setCameraReady(true);
      return true;
    } catch (e: any) {
      setCameraReady(false);
      setCameraError(e?.message || "Could not access camera");
      return false;
    }
  }, []);

  useEffect(() => {
    void startEnvironmentCamera();
    return () => {
      environmentStreamRef.current?.getTracks().forEach((t) => t.stop());
      environmentStreamRef.current = null;
    };
  }, [startEnvironmentCamera]);

  useEffect(() => {
    if (!faceCameraActive) return;
    const timer = window.setTimeout(() => {
      const track = environmentStreamRef.current?.getVideoTracks()[0];
      const active = track?.readyState === "live" && track.enabled;
      if (!active) {
        void startEnvironmentCamera();
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [faceCameraActive, startEnvironmentCamera]);

  // Compass / device orientation for heading
  useEffect(() => {
    const handler = (e: DeviceOrientationEvent) => {
      const h =
        (e as any).webkitCompassHeading != null
          ? (e as any).webkitCompassHeading
          : e.alpha != null
          ? 360 - e.alpha
          : null;
      if (h != null) setHeading(h);
    };
    window.addEventListener("deviceorientationabsolute" as any, handler);
    window.addEventListener("deviceorientation", handler);

    const DOE: any = (window as any).DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === "function") {
      DOE.requestPermission().catch(() => {});
    }

    return () => {
      window.removeEventListener("deviceorientationabsolute" as any, handler);
      window.removeEventListener("deviceorientation", handler);
    };
  }, []);

  const nearbyDrops = useMemo(() => {
    if (!myLocation) return [];
    return drops
      .map((d) => ({
        drop: d,
        dist: distanceMeters(
          myLocation.latitude,
          myLocation.longitude,
          d.latitude,
          d.longitude
        ),
      }))
      .filter((x) => x.dist <= radiusMeters);
  }, [drops, myLocation, radiusMeters]);

  const nearbyPeers = useMemo(() => {
    if (!myLocation) return [];
    return peers
      .map((p) => ({
        peer: p,
        dist: distanceMeters(
          myLocation.latitude,
          myLocation.longitude,
          p.latitude,
          p.longitude
        ),
      }))
      .filter((x) => x.dist <= radiusMeters);
  }, [peers, myLocation, radiusMeters]);

  // Push spatial audio positions to voice hook
  useEffect(() => {
    if (!myLocation || !onUpdatePeerPosition) return;
    nearbyPeers.forEach(({ peer }) => {
      const { east, north } = gpsToLocalMeters(
        myLocation.latitude,
        myLocation.longitude,
        peer.latitude,
        peer.longitude
      );
      onUpdatePeerPosition(peer.userId, east, north);
    });
  }, [nearbyPeers, myLocation, onUpdatePeerPosition]);

  const project = (bearing: number, dist: number) => {
    let rel = bearing - heading;
    while (rel > 180) rel -= 360;
    while (rel < -180) rel += 360;
    if (Math.abs(rel) > FOV_H / 2 + 10) return null;
    const x = 50 + (rel / (FOV_H / 2)) * 50;
    const y = 50 + Math.min(20, Math.max(-15, 8 - dist / 50));
    const scale = Math.max(0.4, Math.min(1.6, 80 / Math.max(8, dist)));
    return { x, y, scale };
  };

  const bearingTo = (lat: number, lon: number) => {
    if (!myLocation) return 0;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const toDeg = (r: number) => (r * 180) / Math.PI;
    const dLon = toRad(lon - myLocation.longitude);
    const lat1 = toRad(myLocation.latitude);
    const lat2 = toRad(lat);
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  };

  // Compute new GPS for a drop projected ~HOLD_DISTANCE_M in front of the camera
  const computeHeldGps = () => {
    if (!myLocation) return null;
    const headingRad = (heading * Math.PI) / 180;
    const east = Math.sin(headingRad) * HOLD_DISTANCE_M;
    const north = Math.cos(headingRad) * HOLD_DISTANCE_M;
    return localMetersToGps(myLocation.latitude, myLocation.longitude, east, north);
  };

  const canGrab = (drop: ARDrop) =>
    drop.placement_mode === "free" || drop.user_id === myUserId || isAdmin;

  // Grab handlers
  const handleGrab = (drop: ARDrop) => {
    if (!canGrab(drop)) return;
    setGrabbedId(drop.id);
  };

  const handleRelease = async () => {
    if (!grabbedId || !onMoveDrop) {
      setGrabbedId(null);
      return;
    }
    const target = computeHeldGps();
    const id = grabbedId;
    setGrabbedId(null);
    if (target) {
      await onMoveDrop(id, target.lat, target.lon);
    }
  };

  // While holding, continuously update server position so other peers see it move
  useEffect(() => {
    if (!grabbedId || !onMoveDrop) return;
    const interval = setInterval(() => {
      const target = computeHeldGps();
      if (target) onMoveDrop(grabbedId, target.lat, target.lon);
    }, 400);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grabbedId, heading, myLocation?.latitude, myLocation?.longitude]);

  return (
    <div
      className="absolute inset-0 bg-black overflow-hidden select-none"
      onPointerUp={grabbedId ? handleRelease : undefined}
      onPointerLeave={grabbedId ? handleRelease : undefined}
    >
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* LiDAR-style coordinate wireframe wrapping the room */}
      {cameraReady && (
        <LidarWireframe
          heading={heading}
          accuracy={myLocation?.accuracy ?? null}
          color={myColor}
          latitude={myLocation?.latitude ?? null}
          longitude={myLocation?.longitude ?? null}
          fovDeg={FOV_H}
        />
      )}

      {!cameraReady && !cameraError && (
        <div className="absolute inset-0 flex items-center justify-center text-white/70">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Starting camera...
        </div>
      )}

      {cameraError && (
        <div className="absolute inset-0 flex items-center justify-center text-white p-6">
          <div className="bg-black/80 border border-white/15 rounded-lg p-4 max-w-sm text-center">
            <AlertTriangle className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-sm font-semibold mb-1">Camera not available</div>
            <p className="text-xs text-white/70">{cameraError}</p>
            <p className="text-xs text-white/60 mt-2">
              Galaxy needs your camera and location to show AR content around you.
            </p>
          </div>
        </div>
      )}

      {/* Drop overlays — render real media, pinned to coordinates */}
      {nearbyDrops.map(({ drop, dist }) => {
        const isGrabbed = grabbedId === drop.id;
        const proj = isGrabbed
          ? { x: 50, y: 50, scale: 1.4 }
          : (() => {
              const bearing = bearingTo(drop.latitude, drop.longitude);
              return project(bearing, Math.max(1, dist));
            })();
        if (!proj) return null;

        const isFree = drop.placement_mode === "free";
        const grabbable = canGrab(drop);
        const ModeIcon = isFree ? Hand : Pin;

        // Size scales with proximity; media gets a bigger frame than orbs
        const baseSize =
          drop.content_type === "image" ||
          drop.content_type === "video" ||
          drop.content_type === "model_3d"
            ? 140
            : 56;
        const size = baseSize * proj.scale;

        const renderMedia = () => {
          if (drop.content_type === "image" && drop.content_url) {
            return (
              <img
                src={drop.content_url}
                alt={drop.title}
                draggable={false}
                className="w-full h-full object-cover"
              />
            );
          }
          if (drop.content_type === "video" && drop.content_url) {
            return (
              <video
                src={drop.content_url}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            );
          }
          if (drop.content_type === "model_3d" && drop.content_url) {
            return (
              <model-viewer
                src={drop.content_url}
                alt={drop.title}
                auto-rotate
                camera-controls={false as any}
                disable-zoom
                interaction-prompt="none"
                shadow-intensity="0"
                style={{
                  width: "100%",
                  height: "100%",
                  background: "transparent",
                  ["--poster-color" as any]: "transparent",
                }}
              />
            );
          }
          if (drop.content_type === "audio") {
            return (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: drop.color || "#00ffaa" }}
              >
                <Music className="w-1/2 h-1/2 text-black/80" />
              </div>
            );
          }
          if (drop.content_type === "file") {
            return (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: drop.color || "#00ffaa" }}
              >
                <FileIcon className="w-1/2 h-1/2 text-black/80" />
              </div>
            );
          }
          // text
          return (
            <div
              className="w-full h-full flex items-center justify-center text-[10px] font-semibold text-black/80 px-1.5 text-center"
              style={{ background: drop.color || "#00ffaa" }}
            >
              <TypeIcon className="w-1/2 h-1/2 opacity-80" />
            </div>
          );
        };

        const isMedia =
          drop.content_type === "image" ||
          drop.content_type === "video" ||
          drop.content_type === "model_3d";

        return (
          <div
            key={drop.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${proj.x}%`,
              top: `${proj.y}%`,
              touchAction: "none",
              zIndex: isGrabbed ? 50 : 10,
            }}
          >
            <button
              onClick={() => !isGrabbed && onSelectDrop(drop)}
              onPointerDown={(e) => {
                if (!grabbable) return;
                e.preventDefault();
                const timer = window.setTimeout(() => handleGrab(drop), 350);
                const cancel = () => {
                  clearTimeout(timer);
                  window.removeEventListener("pointerup", cancel);
                  window.removeEventListener("pointercancel", cancel);
                };
                window.addEventListener("pointerup", cancel, { once: true });
                window.addEventListener("pointercancel", cancel, { once: true });
              }}
              className="block group"
              aria-label={drop.title}
            >
              <div
                className={`relative overflow-hidden transition-all backdrop-blur-sm ${
                  isMedia ? "rounded-2xl" : "rounded-full"
                } ${
                  isGrabbed
                    ? "ring-4 ring-white animate-pulse"
                    : "ring-1 ring-white/30 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
                }`}
                style={{
                  width: size,
                  height: size,
                  background:
                    drop.content_type === "model_3d" ? "transparent" : "rgba(0,0,0,0.25)",
                }}
              >
                {renderMedia()}
                {/* Mode badge */}
                <div
                  className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border ${
                    isFree
                      ? "bg-emerald-500 border-emerald-200"
                      : "bg-white/90 border-white"
                  }`}
                  title={isFree ? "Free move — anyone can grab" : "Pinned · only owner can move"}
                >
                  <ModeIcon className="w-2.5 h-2.5 text-black" />
                </div>
              </div>
            </button>
            <div className="text-[10px] text-white text-center bg-black/60 backdrop-blur rounded px-1.5 py-0.5 mt-1 max-w-[160px] truncate mx-auto">
              {isGrabbed
                ? "Holding — release to drop"
                : `${drop.title} · ${Math.round(dist)}m`}
            </div>
          </div>
        );
      })}

      {/* Peer orbs */}
      {nearbyPeers.map(({ peer, dist }) => {
        const bearing = bearingTo(peer.latitude, peer.longitude);
        const proj = project(bearing, Math.max(1, dist));
        if (!proj) return null;
        const orbSize = 60 * proj.scale;
        const videoStream = peerVideoStreams?.get(peer.userId);
        return (
          <div
            key={peer.userId}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: `${proj.x}%`, top: `${proj.y}%` }}
          >
            <div className="relative" style={{ width: orbSize, height: orbSize }}>
              <div
                className="absolute inset-0 rounded-full animate-pulse"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${peer.color}, ${peer.color}88 60%, transparent 75%)`,
                  boxShadow: `0 0 30px ${peer.color}cc, inset 0 0 20px ${peer.color}66`,
                }}
              />
              {videoStream && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 rounded-full overflow-hidden border-2 shadow-lg"
                  style={{
                    bottom: `${orbSize * 0.7}px`,
                    width: orbSize * 0.85,
                    height: orbSize * 0.85,
                    borderColor: peer.color,
                    boxShadow: `0 0 16px ${peer.color}cc`,
                  }}
                >
                  <PeerVideo stream={videoStream} />
                </div>
              )}
            </div>
            <div className="text-[10px] text-white text-center bg-black/60 backdrop-blur rounded px-1.5 py-0.5 mt-1 max-w-[120px] truncate">
              {peer.name} · {Math.round(dist)}m
            </div>
          </div>
        );
      })}

      {/* Crosshair / heading indicator */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div
          className={`rounded-full transition-all ${
            grabbedId
              ? "w-8 h-8 border-2 border-white animate-pulse"
              : "w-2 h-2 bg-white/60"
          }`}
        />
      </div>

      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] text-white/70 bg-black/40 backdrop-blur px-2 py-0.5 rounded">
        {Math.round(heading)}° · You: {myColor}
      </div>

      {/* Grab hint */}
      {grabbedId && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full border border-white/20 pointer-events-none">
          Aim and release to drop here
        </div>
      )}
    </div>
  );
};

const PeerVideo = ({ stream }: { stream: MediaStream }) => {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current && ref.current.srcObject !== stream) {
      ref.current.srcObject = stream;
      ref.current.play().catch(() => {});
    }
  }, [stream]);
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted
      className="w-full h-full object-cover"
    />
  );
};
