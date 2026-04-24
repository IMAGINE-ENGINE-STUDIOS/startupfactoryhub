import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import "@google/model-viewer";
import {
  Loader2,
  AlertTriangle,
  Hand,
  Pin,
  File as FileIcon,
  Music,
  Type as TypeIcon,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  RotateCw,
  ArrowUpFromLine,
  ArrowDownFromLine,
} from "lucide-react";
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
  onUpdateDropTransform?: (
    id: string,
    transform: { altitude_m?: number; yaw_deg?: number; pitch_deg?: number; size_m?: number }
  ) => Promise<boolean>;
  onUpdatePeerPosition?: (peerId: string, east: number, north: number) => void;
  peerVideoStreams?: Map<string, MediaStream>;
  faceCameraActive?: boolean;
}

const FOV_H = 70; // horizontal field of view, degrees
const EYE_HEIGHT_M = 1.6; // assumed user eye level above ground

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
  onUpdateDropTransform,
  onUpdatePeerPosition,
  peerVideoStreams,
  faceCameraActive = false,
}: ARCameraViewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const environmentStreamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [heading, setHeading] = useState<number>(0);
  const [devicePitch, setDevicePitch] = useState<number>(0); // degrees, +up
  const [viewport, setViewport] = useState({
    w: typeof window !== "undefined" ? window.innerWidth : 800,
    h: typeof window !== "undefined" ? window.innerHeight : 600,
  });

  const [grabbedId, setGrabbedId] = useState<string | null>(null);
  const HOLD_DISTANCE_M = 8;

  // Held transform overrides while adjusting in AR
  const heldTransformRef = useRef<{
    altitude_m: number;
    yaw_deg: number;
    pitch_deg: number;
  } | null>(null);
  const [heldTick, setHeldTick] = useState(0); // re-render trigger

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

  // Viewport tracking for true-pixel projection
  useEffect(() => {
    const onResize = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Compass + pitch from device orientation
  useEffect(() => {
    const handler = (e: DeviceOrientationEvent) => {
      const h =
        (e as any).webkitCompassHeading != null
          ? (e as any).webkitCompassHeading
          : e.alpha != null
          ? 360 - e.alpha
          : null;
      if (h != null) setHeading(h);
      // beta: tilt front/back, 0 = phone flat. When holding portrait upright,
      // beta ~ 90. We treat the camera "looking up" when beta > 90.
      if (e.beta != null) {
        const pitch = e.beta - 90; // degrees, 0 = horizontal
        // clamp to a reasonable range
        setDevicePitch(Math.max(-90, Math.min(90, pitch)));
      }
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

  // Pinhole projection: returns screen pixel offsets from center + pixels-per-meter
  // at the given world distance. Returns null if behind / outside FOV.
  const projectWorld = (
    bearing: number,
    distMeters: number,
    altitudeAboveEyeM: number
  ) => {
    let relYaw = bearing - heading;
    while (relYaw > 180) relYaw -= 360;
    while (relYaw < -180) relYaw += 360;

    const halfFov = FOV_H / 2;
    if (Math.abs(relYaw) > halfFov + 15) return null;

    const w = viewport.w;
    const h = viewport.h;
    const focalPx = w / 2 / Math.tan((halfFov * Math.PI) / 180);

    // Vertical angle from camera to object
    // angle = atan(altitudeAboveEye / distance) - devicePitch
    const objVertRad = Math.atan2(altitudeAboveEyeM, Math.max(0.5, distMeters));
    const pitchRad = (devicePitch * Math.PI) / 180;
    const relVert = objVertRad - pitchRad;

    const dx = focalPx * Math.tan((relYaw * Math.PI) / 180);
    const dy = -focalPx * Math.tan(relVert); // screen y grows downward

    const cx = w / 2 + dx;
    const cy = h / 2 + dy;

    // Off-screen vertically? still allow some leeway so things scroll in/out
    if (cy < -h || cy > h * 2) return null;

    const pxPerMeter = focalPx / Math.max(0.5, distMeters);
    return { cx, cy, pxPerMeter, w, h };
  };

  const computeHeldGps = () => {
    if (!myLocation) return null;
    const headingRad = (heading * Math.PI) / 180;
    const east = Math.sin(headingRad) * HOLD_DISTANCE_M;
    const north = Math.cos(headingRad) * HOLD_DISTANCE_M;
    return localMetersToGps(myLocation.latitude, myLocation.longitude, east, north);
  };

  const canGrab = (drop: ARDrop) =>
    drop.placement_mode === "free" || drop.user_id === myUserId || isAdmin;

  const handleGrab = (drop: ARDrop) => {
    if (!canGrab(drop)) return;
    heldTransformRef.current = {
      altitude_m: drop.altitude_m ?? EYE_HEIGHT_M,
      yaw_deg: drop.yaw_deg ?? 0,
      pitch_deg: drop.pitch_deg ?? 0,
    };
    setGrabbedId(drop.id);
    setHeldTick((t) => t + 1);
  };

  const handleRelease = async () => {
    const id = grabbedId;
    const transform = heldTransformRef.current;
    setGrabbedId(null);
    heldTransformRef.current = null;
    if (!id) return;
    const target = computeHeldGps();
    if (target && onMoveDrop) {
      await onMoveDrop(id, target.lat, target.lon);
    }
    if (transform && onUpdateDropTransform) {
      await onUpdateDropTransform(id, transform);
    }
  };

  // While holding, periodically push position so peers see it move
  useEffect(() => {
    if (!grabbedId || !onMoveDrop) return;
    const interval = setInterval(() => {
      const target = computeHeldGps();
      if (target) onMoveDrop(grabbedId, target.lat, target.lon);
    }, 400);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grabbedId, heading, myLocation?.latitude, myLocation?.longitude]);

  const adjustHeld = (
    field: "altitude_m" | "yaw_deg" | "pitch_deg",
    delta: number
  ) => {
    if (!heldTransformRef.current) return;
    const t = heldTransformRef.current;
    if (field === "altitude_m") t.altitude_m = Math.max(-5, Math.min(20, t.altitude_m + delta));
    if (field === "yaw_deg") t.yaw_deg = ((t.yaw_deg + delta) % 360 + 360) % 360;
    if (field === "pitch_deg") t.pitch_deg = Math.max(-45, Math.min(45, t.pitch_deg + delta));
    setHeldTick((x) => x + 1);
  };

  return (
    <div
      className="absolute inset-0 bg-black overflow-hidden select-none"
    >
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

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

      {/* Drop overlays — true-size projection */}
      {nearbyDrops.map(({ drop, dist }) => {
        const isGrabbed = grabbedId === drop.id;

        const altitudeM = isGrabbed && heldTransformRef.current
          ? heldTransformRef.current.altitude_m
          : drop.altitude_m ?? EYE_HEIGHT_M;
        const yawDeg = isGrabbed && heldTransformRef.current
          ? heldTransformRef.current.yaw_deg
          : drop.yaw_deg ?? 0;
        const pitchDegDrop = isGrabbed && heldTransformRef.current
          ? heldTransformRef.current.pitch_deg
          : drop.pitch_deg ?? 0;
        const sizeM = drop.size_m ?? 1.5;

        // While grabbed, render at hold distance straight ahead
        const effectiveDist = isGrabbed ? HOLD_DISTANCE_M : Math.max(1, dist);
        const effectiveBearing = isGrabbed
          ? heading
          : bearingTo(drop.latitude, drop.longitude);
        const altAboveEye = altitudeM - EYE_HEIGHT_M;

        const proj = projectWorld(effectiveBearing, effectiveDist, altAboveEye);
        if (!proj) return null;

        const isMedia =
          drop.content_type === "image" ||
          drop.content_type === "video" ||
          drop.content_type === "model_3d";

        // True-size: pixels = realMeters * pxPerMeter, with sane min/max
        const pxSize = Math.max(24, Math.min(800, sizeM * proj.pxPerMeter));

        // The object's facing yaw on screen: how it differs from where camera looks
        // If yaw==bearing-to-camera, it faces camera straight on (rotateY=0)
        const bearingFromObject = (effectiveBearing + 180) % 360;
        let facingDelta = yawDeg - bearingFromObject;
        while (facingDelta > 180) facingDelta -= 360;
        while (facingDelta < -180) facingDelta += 360;

        const isFree = drop.placement_mode === "free";
        const grabbable = canGrab(drop);
        const ModeIcon = isFree ? Hand : Pin;

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
          return (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: drop.color || "#00ffaa" }}
            >
              <TypeIcon className="w-1/2 h-1/2 text-black/80 opacity-80" />
            </div>
          );
        };

        return (
          <div
            key={drop.id}
            className="absolute"
            style={{
              left: proj.cx,
              top: proj.cy,
              transform: "translate(-50%, -50%)",
              touchAction: "none",
              zIndex: isGrabbed ? 50 : 10,
              perspective: 800,
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
              className="block"
              aria-label={drop.title}
            >
              <div
                className={`relative overflow-hidden transition-shadow backdrop-blur-sm ${
                  isMedia ? "rounded-2xl" : "rounded-full"
                } ${
                  isGrabbed
                    ? "ring-4 ring-white animate-pulse"
                    : "ring-1 ring-white/30 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
                }`}
                style={{
                  width: pxSize,
                  height: pxSize,
                  background:
                    drop.content_type === "model_3d" ? "transparent" : "rgba(0,0,0,0.25)",
                  transform: `rotateY(${facingDelta}deg) rotateX(${-pitchDegDrop}deg)`,
                  transformStyle: "preserve-3d",
                }}
              >
                {renderMedia()}
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
            <div className="text-[10px] text-white text-center bg-black/60 backdrop-blur rounded px-1.5 py-0.5 mt-1 max-w-[200px] truncate mx-auto">
              {isGrabbed
                ? `Holding · alt ${altitudeM.toFixed(1)}m · yaw ${Math.round(yawDeg)}°`
                : `${drop.title} · ${Math.round(dist)}m · ${sizeM.toFixed(1)}m`}
            </div>
          </div>
        );
      })}

      {/* Peer orbs — also true-size (~0.4m diameter at eye level) */}
      {nearbyPeers.map(({ peer, dist }) => {
        const bearing = bearingTo(peer.latitude, peer.longitude);
        const proj = projectWorld(bearing, Math.max(1, dist), 0);
        if (!proj) return null;
        const orbSize = Math.max(20, Math.min(280, 0.5 * proj.pxPerMeter));
        const videoStream = peerVideoStreams?.get(peer.userId);
        return (
          <div
            key={peer.userId}
            className="absolute pointer-events-none"
            style={{
              left: proj.cx,
              top: proj.cy,
              transform: "translate(-50%, -50%)",
            }}
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
        {Math.round(heading)}° · pitch {Math.round(devicePitch)}°
      </div>

      {/* In-AR transform handles when holding */}
      {grabbedId && heldTransformRef.current && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur rounded-2xl border border-white/20 p-2 flex items-center gap-1.5 pointer-events-auto">
          <div className="flex flex-col items-center gap-1 px-1">
            <button
              onPointerDown={(e) => { e.stopPropagation(); adjustHeld("altitude_m", 0.25); }}
              className="w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
              aria-label="Raise"
            ><ArrowUpFromLine className="w-4 h-4" /></button>
            <span className="text-[9px] text-white/60">alt {heldTransformRef.current.altitude_m.toFixed(1)}m</span>
            <button
              onPointerDown={(e) => { e.stopPropagation(); adjustHeld("altitude_m", -0.25); }}
              className="w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
              aria-label="Lower"
            ><ArrowDownFromLine className="w-4 h-4" /></button>
          </div>
          <div className="w-px h-16 bg-white/15" />
          <div className="flex flex-col items-center gap-1 px-1">
            <button
              onPointerDown={(e) => { e.stopPropagation(); adjustHeld("yaw_deg", -15); }}
              className="w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
              aria-label="Rotate left"
            ><RotateCcw className="w-4 h-4" /></button>
            <span className="text-[9px] text-white/60">yaw {Math.round(heldTransformRef.current.yaw_deg)}°</span>
            <button
              onPointerDown={(e) => { e.stopPropagation(); adjustHeld("yaw_deg", 15); }}
              className="w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
              aria-label="Rotate right"
            ><RotateCw className="w-4 h-4" /></button>
          </div>
          <div className="w-px h-16 bg-white/15" />
          <div className="flex flex-col items-center gap-1 px-1">
            <button
              onPointerDown={(e) => { e.stopPropagation(); adjustHeld("pitch_deg", 5); }}
              className="w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
              aria-label="Tilt up"
            ><ChevronUp className="w-4 h-4" /></button>
            <span className="text-[9px] text-white/60">tilt {Math.round(heldTransformRef.current.pitch_deg)}°</span>
            <button
              onPointerDown={(e) => { e.stopPropagation(); adjustHeld("pitch_deg", -5); }}
              className="w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
              aria-label="Tilt down"
            ><ChevronDown className="w-4 h-4" /></button>
          </div>
          <div className="w-px h-16 bg-white/15" />
          <button
            onClick={handleRelease}
            className="px-3 h-16 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold"
          >
            Pin
          </button>
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
