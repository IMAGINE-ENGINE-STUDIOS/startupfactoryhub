// @ts-nocheck -- imported Imagine Studio v2
import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { mobileAxes, mobileLook, inputPulse, controllerPrefs } from "@/imagine-studio/components/level/locomotion/locomotionState";

/**
 * On-screen touch controls for Play mode. Rendered only on touch-capable
 * viewports. Writes into the shared `mobileAxes` singleton and `inputPulse`
 * so it reuses the exact same code path as keyboard/gamepad input — no
 * changes required in the character controller beyond reading the axes.
 *
 * Layout:
 *   - Left: virtual thumbstick (drag to move).
 *   - Right: Jump, Run (toggle). No Interact button (founder directive
 *     2026-10-25 — tapping a character or its proximity pill opens it).
 */
export default function MobileTouchControls({ visible, layerClass = "z-50" }: { visible: boolean; layerClass?: string }) {
  const [supported, setSupported] = useState(false);
  const [runOn, setRunOn] = useState(false);
  const stickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const activeId = useRef<number | null>(null);
  const lookId = useRef<number | null>(null);
  const lookLast = useRef<{ x: number; y: number } | null>(null);

  const [pref, setPref] = useState(controllerPrefs.mobileJoystick);
  useEffect(() => {
    const on = () => setPref(controllerPrefs.mobileJoystick);
    window.addEventListener("ie-controller-prefs", on);
    return () => window.removeEventListener("ie-controller-prefs", on);
  }, []);
  useEffect(() => {
    // Show whenever a touch device or coarse pointer is present.
    const mq = window.matchMedia?.("(pointer: coarse)");
    setSupported(!!mq?.matches || ("ontouchstart" in window));
  }, []);

  useEffect(() => {
    if (!visible) { mobileAxes.x = 0; mobileAxes.z = 0; mobileAxes.jump = false; mobileAxes.run = false; }
  }, [visible]);

  useEffect(() => { mobileAxes.run = runOn; }, [runOn]);

  const setKnob = (dx: number, dy: number, radius: number) => {
    const len = Math.hypot(dx, dy);
    const clamp = Math.min(len, radius);
    const nx = len ? (dx / len) * clamp : 0;
    const ny = len ? (dy / len) * clamp : 0;
    if (knobRef.current) {
      knobRef.current.style.transform = `translate(${nx}px, ${ny}px)`;
    }
    // Normalize to -1..1, invert Y (up = forward = -z)
    const nrmX = -(nx / radius); // A/left → +x in controller
    const nrmZ = ny / radius;    // down → +z
    mobileAxes.x = nrmX;
    mobileAxes.z = nrmZ;
  };

  const onStickStart = (e: React.PointerEvent) => {
    if (activeId.current !== null) return;
    activeId.current = e.pointerId;
    (e.target as Element).setPointerCapture(e.pointerId);
    const rect = stickRef.current!.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setKnob(e.clientX - cx, e.clientY - cy, rect.width / 2 - 12);
  };
  const onStickMove = (e: React.PointerEvent) => {
    if (activeId.current !== e.pointerId) return;
    const rect = stickRef.current!.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setKnob(e.clientX - cx, e.clientY - cy, rect.width / 2 - 12);
  };
  const onStickEnd = (e: React.PointerEvent) => {
    if (activeId.current !== e.pointerId) return;
    activeId.current = null;
    try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {}
    setKnob(0, 0, 1);
    mobileAxes.x = 0; mobileAxes.z = 0;
  };

  if (!visible || pref === "off" || (!supported && pref !== "always")) return null;

  return (
    <div className={`pointer-events-none fixed inset-0 ${layerClass} select-none`} style={{ touchAction: "none" }}>
      {/* Right-side full-height look pad — drag to yaw/pitch the camera.
          Sits behind the action buttons (lower z) so taps on Jump/Run/
          Interact still reach them. Transparent, no visible chrome. */}
      <div
        className="pointer-events-auto absolute top-0 right-0 h-full"
        style={{ width: "100%", touchAction: "none", zIndex: 0 }}
        onPointerDown={(e) => {
          if (lookId.current !== null) return;
          lookId.current = e.pointerId;
          lookLast.current = { x: e.clientX, y: e.clientY };
          (e.target as Element).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (lookId.current !== e.pointerId || !lookLast.current) return;
          mobileLook.dx += e.clientX - lookLast.current.x;
          mobileLook.dy += e.clientY - lookLast.current.y;
          lookLast.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          if (lookId.current !== e.pointerId) return;
          lookId.current = null;
          lookLast.current = null;
          try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {}
        }}
        onPointerCancel={(e) => {
          if (lookId.current !== e.pointerId) return;
          lookId.current = null;
          lookLast.current = null;
        }}
      />
      {/* Left thumbstick */}
      <div
        ref={stickRef}
        onPointerDown={onStickStart}
        onPointerMove={onStickMove}
        onPointerUp={onStickEnd}
        onPointerCancel={onStickEnd}
        className="pointer-events-auto absolute bottom-5 left-4 w-[104px] h-[104px] rounded-full border border-white/25 bg-black/40 backdrop-blur-md shadow-2xl flex items-center justify-center"
        style={{ zIndex: 2 }}
      >
        <div
          ref={knobRef}
          className="w-11 h-11 rounded-full bg-white/85 border border-white/60 shadow-lg"
          style={{ transform: "translate(0,0)", transition: activeId.current === null ? "transform 120ms ease" : "none" }}
        />
      </div>

      {/* Right action cluster */}
      <div className="pointer-events-auto absolute bottom-5 right-4 flex flex-col items-end gap-2.5" style={{ zIndex: 2 }}>
        <div className="flex items-center gap-2.5">
          <button
            onPointerDown={() => setRunOn((v) => !v)}
            className={`w-[52px] h-[52px] rounded-full border backdrop-blur-md text-[10px] font-bold uppercase tracking-wider shadow-lg active:scale-95 ${
              runOn
                ? "border-amber-300/70 bg-amber-400/30 text-amber-100"
                : "border-white/30 bg-black/40 text-white/85"
            }`}
          >
            Run
          </button>
        </div>
        <button
          onPointerDown={() => { mobileAxes.jump = true; }}
          onPointerUp={() => { mobileAxes.jump = false; }}
          onPointerCancel={() => { mobileAxes.jump = false; }}
          className="w-[60px] h-[60px] rounded-full border border-sky-300/60 bg-sky-500/30 backdrop-blur-md text-sky-50 shadow-2xl active:scale-95 flex items-center justify-center"
          aria-label="Jump"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}