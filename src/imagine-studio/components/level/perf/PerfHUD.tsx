// @ts-nocheck -- imported Imagine Studio v2
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getPerfSnapshot, subscribePerf, type PerfSnapshot } from "./perfStore";

const STORAGE_KEY = "level.perfHud.open";

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
}

function fpsColor(fps: number): string {
  if (fps >= 55) return "#34d399";
  if (fps >= 40) return "#fbbf24";
  return "#f87171";
}

// DOM-overlay performance HUD. Toggle with the backtick (`) key. State persists
// across reloads via localStorage so it's there next time you need it.
export default function PerfHUD({ active = true }: { active?: boolean }) {
  const [closed, setClosed] = useState(false);
  useEffect(() => { if (active) setClosed(false); }, [active]);
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_KEY) !== "0";
  });
  const [snap, setSnap] = useState<PerfSnapshot>(getPerfSnapshot());

  useEffect(() => {
    return subscribePerf(setSnap);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ignore when user is typing in an input
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "`") {
        setOpen((v) => {
          const next = !v;
          try { window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0"); } catch { /* ignore */ }
          return next;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (typeof document === "undefined" || !open || !active || closed) return null;

  return createPortal(
    <div
      aria-label="Performance HUD"
      style={{
        position: "fixed",
        top: 12,
        right: 12,
        zIndex: 999_999,
        font: "11px/1.35 ui-monospace, SFMono-Regular, Menlo, monospace",
        color: "#e5e7eb",
        background: "rgba(15, 23, 42, 0.78)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: "1px solid rgba(148, 163, 184, 0.25)",
        borderRadius: 10,
        padding: "8px 10px",
        minWidth: 180,
        boxShadow: "0 6px 24px rgba(0,0,0,0.35)",
        pointerEvents: "auto",
        userSelect: "none",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
        <span style={{ color: fpsColor(snap.fps), fontWeight: 700, fontSize: 14 }}>
          {snap.fps} fps
        </span>
        <button onClick={() => setClosed(true)} aria-label="Close FPS" style={{ marginLeft: "auto", background: "transparent", border: 0, color: "#94a3b8", cursor: "pointer", fontSize: 14, lineHeight: 1 }}>✕</button>
        <span style={{ color: "#94a3b8" }}>{snap.ms.toFixed(2)} ms</span>
      </div>
      <Row label="draw calls" value={fmt(snap.calls)} />
      <Row label="triangles" value={fmt(snap.tris)} />
      <Row label="programs" value={fmt(snap.programs)} />
      <Row label="textures" value={fmt(snap.textures)} />
      <Row label="geometries" value={fmt(snap.geometries)} />
      {snap.heapMB != null && <Row label="heap" value={`${snap.heapMB} MB`} />}
      <div style={{ marginTop: 6, color: "#64748b", fontSize: 10 }}>press ` to hide</div>
    </div>,
    document.body,
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span style={{ color: "#94a3b8" }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}