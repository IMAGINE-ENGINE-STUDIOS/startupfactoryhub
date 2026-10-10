// @ts-nocheck -- Imagine Studio v2
/**
 * Drop-in theater screen for 3D Studio levels. Shows a screen share, an image
 * or a PDF page on its face. Controls appear when the screen is selected, and
 * Flow / Genius AI can drive it with a window "ie-theater" event:
 *   { id?, kind: "screen" | "image" | "pdf" | "stop", url?, page? }
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useSourceTexture, type TheaterSource } from "../plaza/TheaterScreen";
import { openTheaterFullscreen, closeTheaterFullscreen } from "../plaza/TheaterFullscreen";

const W = 1.6, H = 0.9;

export default function StudioTheater({ obj, selected, onSelect }: { obj: any; selected?: boolean; onSelect?: (id: string) => void }) {
  const [src, setSrc] = useState<TheaterSource>(null);
  const [pages, setPages] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { tex, pages: n } = useSourceTexture(src);
  useEffect(() => setPages(n), [n]);

  const idle = useMemo(() => {
    const c = document.createElement("canvas"); c.width = 1024; c.height = 576;
    const g = c.getContext("2d")!; g.fillStyle = "#0d1117"; g.fillRect(0, 0, 1024, 576);
    g.fillStyle = "#e6edf3"; g.font = "600 54px sans-serif"; g.textAlign = "center";
    g.fillText(obj.name || "Theater Screen", 512, 270); g.font = "28px sans-serif"; g.fillStyle = "#8b949e";
    g.fillText("Select to share your screen or a document", 512, 330);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, [obj.name]);

  const stop = () => { streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null; setSrc(null); };
  const shareScreen = async () => {
    try {
      stop();
      const s = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: false });
      streamRef.current = s;
      const el = document.createElement("video"); el.muted = true; el.playsInline = true; el.autoplay = true; el.srcObject = s;
      el.style.cssText = "position:fixed;left:0;top:0;width:320px;height:180px;opacity:0.01;pointer-events:none;z-index:-1";
      document.body.appendChild(el);
      s.getVideoTracks()[0]?.addEventListener("ended", () => { el.remove(); setSrc(null); });
      setSrc({ kind: "video", el, by: "You" });
    } catch { /* cancelled */ }
  };
  const showFile = (f?: File) => {
    if (!f) return; stop();
    const url = URL.createObjectURL(f);
    const pdf = f.type === "application/pdf" || /\.pdf$/i.test(f.name);
    setSrc(pdf ? { kind: "pdf", url, name: f.name, page: 1, by: "You" } : { kind: "image", url, name: f.name, by: "You" });
  };
  const turn = (d: number) => setSrc((s: any) => (s?.kind === "pdf" ? { ...s, page: Math.min(Math.max(1, s.page + d), pages || 1) } : s));

  useEffect(() => {
    const on = (e: any) => {
      const d = e.detail || {}; if (d.id && d.id !== obj.id && d.id !== obj.name) return;
      if (d.kind === "stop") stop();
      else if (d.kind === "screen") shareScreen();
      else if (d.kind === "image" && d.url) { stop(); setSrc({ kind: "image", url: d.url, name: "image", by: "Flow" }); }
      else if (d.kind === "pdf" && d.url) { stop(); setSrc({ kind: "pdf", url: d.url, name: "document", page: d.page || 1, by: "Flow" }); }
      else if (d.kind === "page") turn(+d.dir || 1);
      else if (d.kind === "fullscreen") { if (src) openTheaterFullscreen(src); }
      else if (d.kind === "exitFullscreen") closeTheaterFullscreen();
    };
    window.addEventListener("ie-theater", on);
    return () => { window.removeEventListener("ie-theater", on); };
  }, [obj.id, obj.name, pages, src]); // eslint-disable-line
  useEffect(() => () => stop(), []); // eslint-disable-line

  const btn = "rounded-md bg-background px-2 py-1 text-[11px] border border-border hover:bg-muted";
  return (
    <group visible={obj.visible} onClick={(e) => { e.stopPropagation(); onSelect?.(obj.id); }}>
      <mesh position={[0, 0, -0.02]} userData={{ __objId: obj.id }}>
        <boxGeometry args={[W + 0.06, H + 0.06, 0.03]} />
        <meshStandardMaterial color={selected ? "#3b82f6" : "#1a1d22"} />
      </mesh>
      <mesh userData={{ __objId: obj.id }}>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial map={tex || idle} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      {selected && (
        <Html position={[0, -H / 2 - 0.12, 0]} center>
          <div className="flex gap-1 whitespace-nowrap" onPointerDown={(e) => e.stopPropagation()}>
            <button className={btn} onClick={shareScreen}>Share screen</button>
            <button className={btn} onClick={() => fileRef.current?.click()}>Show document</button>
            {src?.kind === "pdf" && <><button className={btn} onClick={() => turn(-1)}>Prev</button><button className={btn} onClick={() => turn(1)}>Next</button></>}
            {src && <button className={btn} onClick={() => openTheaterFullscreen(src)}>Full screen</button>}
            {src && <button className={btn} onClick={stop}>Stop</button>}
            <input ref={fileRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => { showFile(e.target.files?.[0]); e.target.value = ""; }} />
          </div>
        </Html>
      )}
    </group>
  );
}
