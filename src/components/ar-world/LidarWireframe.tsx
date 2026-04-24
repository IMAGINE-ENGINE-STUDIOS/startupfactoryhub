import { useEffect, useRef } from "react";

interface LidarWireframeProps {
  /** Compass heading in degrees (0 = North) */
  heading: number;
  /** GPS accuracy in meters (drives confidence ring opacity) */
  accuracy?: number | null;
  /** User color used to tint the mesh */
  color?: string;
  /** Lat/Lon shown in the HUD readout */
  latitude?: number | null;
  longitude?: number | null;
  /** Horizontal field of view in degrees, matching the AR camera projection */
  fovDeg?: number;
}

/**
 * LiDAR-style wireframe overlay that wraps the user's surroundings with a
 * coordinate-locked mesh. The grid is registered to compass heading so cells
 * stay anchored to physical bearings as the device rotates, providing a
 * pixel-by-pixel reference for placing AR content.
 */
export const LidarWireframe = ({
  heading,
  accuracy,
  color = "#22d3ee",
  latitude,
  longitude,
  fovDeg = 70,
}: LidarWireframeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(canvas.clientWidth * dpr);
      canvas.height = Math.floor(canvas.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const horizonY = h * 0.55;
      const t = (tRef.current += 1);

      // Bearing offset so vertical lines map to physical compass bearings.
      // 1° horizontal = w / fovDeg pixels.
      const pxPerDeg = w / fovDeg;
      const headingMod = ((heading % 360) + 360) % 360;

      ctx.lineWidth = 1;

      // ---------- Floor grid (perspective) ----------
      // Lines converging toward a vanishing point at the horizon.
      ctx.strokeStyle = `${color}33`;
      const cellMeters = 1; // 1m grid cells
      const rows = 14;
      for (let r = 1; r <= rows; r++) {
        // distance ahead in meters → screen y using simple perspective falloff
        const d = r * cellMeters;
        const y = horizonY + ((h - horizonY) * (1 - 1 / (1 + d * 0.18)));
        const alpha = Math.max(0.05, 0.35 - r * 0.02);
        ctx.strokeStyle = `${color}${Math.floor(alpha * 255)
          .toString(16)
          .padStart(2, "0")}`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      const cols = 18;
      for (let c = -cols; c <= cols; c++) {
        const x1 = cx + c * (w / (cols * 2));
        ctx.strokeStyle = `${color}22`;
        ctx.beginPath();
        ctx.moveTo(cx, horizonY);
        ctx.lineTo(x1, h);
        ctx.stroke();
      }

      // ---------- Ceiling mesh (mirrored) ----------
      for (let r = 1; r <= rows; r++) {
        const d = r * cellMeters;
        const y = horizonY - (horizonY * (1 - 1 / (1 + d * 0.18)));
        const alpha = Math.max(0.04, 0.25 - r * 0.018);
        ctx.strokeStyle = `${color}${Math.floor(alpha * 255)
          .toString(16)
          .padStart(2, "0")}`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // ---------- Compass-locked vertical bearing lines ----------
      // Draw a vertical tick every 10° of bearing within FOV
      ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      for (let b = 0; b < 360; b += 10) {
        let rel = b - headingMod;
        while (rel > 180) rel -= 360;
        while (rel < -180) rel += 360;
        if (Math.abs(rel) > fovDeg / 2 + 2) continue;
        const x = cx + rel * pxPerDeg;
        const major = b % 90 === 0;
        const minor = b % 30 === 0;
        ctx.strokeStyle = major
          ? `${color}cc`
          : minor
          ? `${color}77`
          : `${color}44`;
        ctx.lineWidth = major ? 1.4 : 1;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();

        if (minor) {
          const label = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][b / 45] ||
            `${b}°`;
          const text = b % 45 === 0 ? label : `${b}°`;
          ctx.fillStyle = `${color}dd`;
          ctx.fillText(text, x, 4);
        }
      }

      // ---------- Horizon line ----------
      ctx.strokeStyle = `${color}aa`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(w, horizonY);
      ctx.stroke();

      // ---------- Scanning sweep ----------
      const sweepY = horizonY + ((h - horizonY) * ((t % 90) / 90));
      const grad = ctx.createLinearGradient(0, sweepY - 30, 0, sweepY + 30);
      grad.addColorStop(0, `${color}00`);
      grad.addColorStop(0.5, `${color}55`);
      grad.addColorStop(1, `${color}00`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, sweepY - 30, w, 60);

      // ---------- Crosshair / center reticle ----------
      ctx.strokeStyle = `${color}ee`;
      ctx.lineWidth = 1;
      const reticle = 18;
      ctx.beginPath();
      ctx.moveTo(cx - reticle, cy);
      ctx.lineTo(cx - 4, cy);
      ctx.moveTo(cx + 4, cy);
      ctx.lineTo(cx + reticle, cy);
      ctx.moveTo(cx, cy - reticle);
      ctx.lineTo(cx, cy - 4);
      ctx.moveTo(cx, cy + 4);
      ctx.lineTo(cx, cy + reticle);
      ctx.stroke();

      // Corner brackets (L-shaped frames)
      const bracket = 22;
      const inset = 14;
      ctx.lineWidth = 2;
      ctx.strokeStyle = `${color}cc`;
      const corners: Array<[number, number, number, number]> = [
        [inset, inset, 1, 1],
        [w - inset, inset, -1, 1],
        [inset, h - inset, 1, -1],
        [w - inset, h - inset, -1, -1],
      ];
      corners.forEach(([x, y, sx, sy]) => {
        ctx.beginPath();
        ctx.moveTo(x, y + sy * bracket);
        ctx.lineTo(x, y);
        ctx.lineTo(x + sx * bracket, y);
        ctx.stroke();
      });

      // Pixel coordinate readout near reticle
      ctx.fillStyle = `${color}dd`;
      ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        `px ${Math.round(cx)},${Math.round(cy)}`,
        cx + reticle + 4,
        cy - 5
      );
      ctx.fillText(
        `bearing ${Math.round(headingMod)}°`,
        cx + reticle + 4,
        cy + 6
      );

      // GPS readout (bottom-left)
      if (latitude != null && longitude != null) {
        ctx.fillStyle = `${color}cc`;
        ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.fillText(
          `LAT ${latitude.toFixed(6)}  LON ${longitude.toFixed(6)}`,
          inset + 4,
          h - inset - 14
        );
        if (accuracy != null) {
          ctx.fillText(
            `ACC ±${accuracy.toFixed(1)}m`,
            inset + 4,
            h - inset - 2
          );
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [heading, accuracy, color, latitude, longitude, fovDeg]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden
    />
  );
};
