import { useEffect, useRef, useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import type { ARDrop } from "@/hooks/useARDrops";
import { type GalaxyPeer, distanceMeters, gpsToLocalMeters } from "@/hooks/useGalaxyPresence";

interface ARCameraViewProps {
  drops: ARDrop[];
  peers: GalaxyPeer[];
  myLocation: { latitude: number; longitude: number; heading: number | null } | null;
  myColor: string;
  myName: string;
  radiusMeters: number;
  onSelectDrop: (drop: ARDrop) => void;
  onUpdatePeerPosition?: (peerId: string, east: number, north: number) => void;
  peerVideoStreams?: Map<string, MediaStream>;
}

/**
 * Phone camera AR view. Streams the rear camera as the background and overlays:
 * - Colored orbs for each nearby user (positioned by compass + GPS)
 * - Pin markers for each AR drop within the radius
 * Tapping an overlay opens its detail dialog.
 */
export const ARCameraView = ({
  drops,
  peers,
  myLocation,
  myColor,
  myName,
  radiusMeters,
  onSelectDrop,
  onUpdatePeerPosition,
  peerVideoStreams,
}: ARCameraViewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [heading, setHeading] = useState<number>(0);

  // Start rear camera
  useEffect(() => {
    let stream: MediaStream | null = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
        }
      } catch (e: any) {
        setCameraError(e?.message || "Could not access camera");
      }
    })();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

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

    // iOS requires explicit permission
    const DOE: any = (window as any).DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === "function") {
      DOE.requestPermission().catch(() => {});
    }

    return () => {
      window.removeEventListener("deviceorientationabsolute" as any, handler);
      window.removeEventListener("deviceorientation", handler);
    };
  }, []);

  // Filter to nearby items
  const nearbyDrops = myLocation
    ? drops
        .map((d) => ({
          drop: d,
          dist: distanceMeters(
            myLocation.latitude,
            myLocation.longitude,
            d.latitude,
            d.longitude
          ),
        }))
        .filter((x) => x.dist <= radiusMeters)
    : [];

  const nearbyPeers = myLocation
    ? peers
        .map((p) => ({
          peer: p,
          dist: distanceMeters(
            myLocation.latitude,
            myLocation.longitude,
            p.latitude,
            p.longitude
          ),
        }))
        .filter((x) => x.dist <= radiusMeters)
    : [];

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

  // Project a world bearing (degrees from north) into a screen X percentage,
  // taking device heading into account. FOV ~ 70deg horizontal.
  const FOV_H = 70;
  const project = (bearing: number, dist: number) => {
    let rel = bearing - heading;
    while (rel > 180) rel -= 360;
    while (rel < -180) rel += 360;
    if (Math.abs(rel) > FOV_H / 2 + 10) return null;
    const x = 50 + (rel / (FOV_H / 2)) * 50;
    // Vertical position: closer = lower on screen
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

  return (
    <div className="absolute inset-0 bg-black overflow-hidden">
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

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

      {/* Drop overlays */}
      {nearbyDrops.map(({ drop, dist }) => {
        const bearing = bearingTo(drop.latitude, drop.longitude);
        const proj = project(bearing, Math.max(1, dist));
        if (!proj) return null;
        return (
          <button
            key={drop.id}
            onClick={() => onSelectDrop(drop)}
            className="absolute -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${proj.x}%`, top: `${proj.y}%` }}
          >
            <div
              className="rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(255,255,255,0.4)]"
              style={{
                width: 44 * proj.scale,
                height: 44 * proj.scale,
                background: drop.color || "#00ffaa",
                opacity: 0.9,
              }}
            >
              <span className="text-[10px] font-bold text-black/80">
                {drop.content_type === "model_3d"
                  ? "3D"
                  : drop.content_type === "image"
                  ? "IMG"
                  : drop.content_type === "audio"
                  ? "♪"
                  : drop.content_type === "video"
                  ? "▶"
                  : "T"}
              </span>
            </div>
            <div className="text-[10px] text-white text-center bg-black/60 backdrop-blur rounded px-1.5 py-0.5 mt-1 max-w-[120px] truncate">
              {drop.title} · {Math.round(dist)}m
            </div>
          </button>
        );
      })}

      {/* Peer orbs */}
      {nearbyPeers.map(({ peer, dist }) => {
        const bearing = bearingTo(peer.latitude, peer.longitude);
        const proj = project(bearing, Math.max(1, dist));
        if (!proj) return null;
        return (
          <div
            key={peer.userId}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: `${proj.x}%`, top: `${proj.y}%` }}
          >
            <div
              className="rounded-full animate-pulse"
              style={{
                width: 60 * proj.scale,
                height: 60 * proj.scale,
                background: `radial-gradient(circle at 30% 30%, ${peer.color}, ${peer.color}88 60%, transparent 75%)`,
                boxShadow: `0 0 30px ${peer.color}cc, inset 0 0 20px ${peer.color}66`,
              }}
            />
            <div className="text-[10px] text-white text-center bg-black/60 backdrop-blur rounded px-1.5 py-0.5 mt-1 max-w-[120px] truncate">
              {peer.name} · {Math.round(dist)}m
            </div>
          </div>
        );
      })}

      {/* Crosshair / heading indicator */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="w-2 h-2 rounded-full bg-white/60" />
      </div>
      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] text-white/70 bg-black/40 backdrop-blur px-2 py-0.5 rounded">
        {Math.round(heading)}° · You: {myColor}
      </div>
    </div>
  );
};
