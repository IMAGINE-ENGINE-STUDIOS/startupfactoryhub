import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Nexus from "nexusui";

type Settings = { speed: number; size: number; spin: number; x: number; y: number; pulse: boolean };
const DEFAULTS: Settings = { speed: 1, size: 1, spin: 0, x: 0.5, y: 0.5, pulse: true };
const SHAPES = ["#5eead4", "#e879f9", "#fbbf24", "#60a5fa", "#f87171"];

export default function MotionStudio() {
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [presets, setPresets] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const stage = useRef<HTMLDivElement>(null);
  const dots = useRef<(HTMLDivElement | null)[]>([]);
  const ctrl = { dial: useRef<HTMLDivElement>(null), slider: useRef<HTMLDivElement>(null), pad: useRef<HTMLDivElement>(null), toggle: useRef<HTMLDivElement>(null) };
  const widgets = useRef<any>({});

  useEffect(() => {
    const w: any = {};
    w.dial = new Nexus.Dial(ctrl.dial.current, { size: [80, 80], min: 0.2, max: 3, value: DEFAULTS.speed });
    w.slider = new Nexus.Slider(ctrl.slider.current, { size: [160, 24], min: 0.4, max: 2, value: DEFAULTS.size });
    w.pad = new Nexus.Position(ctrl.pad.current, { size: [160, 120], x: 0.5, y: 0.5 });
    w.toggle = new Nexus.Toggle(ctrl.toggle.current, { size: [48, 24], state: true });
    Object.values(w).forEach((x: any) => x.colorize && x.colorize("accent", "#5eead4"));
    w.dial.on("change", (v: number) => setS((p) => ({ ...p, speed: v })));
    w.slider.on("change", (v: number) => setS((p) => ({ ...p, size: v })));
    w.pad.on("change", (v: any) => setS((p) => ({ ...p, x: v.x, y: v.y })));
    w.toggle.on("change", (v: boolean) => setS((p) => ({ ...p, pulse: v })));
    widgets.current = w;
    return () => Object.values(w).forEach((x: any) => x.destroy && x.destroy());
  }, []);

  useEffect(() => {
    const el = stage.current; if (!el) return;
    const W = el.clientWidth, H = el.clientHeight;
    const tl = gsap.timeline({ repeat: -1, yoyo: true });
    dots.current.forEach((d, i) => {
      if (!d) return;
      const a = (i / SHAPES.length) * Math.PI * 2, r = 70 * s.size;
      gsap.to(d, { x: s.x * W - W / 2 + Math.cos(a) * r, y: (1 - s.y) * H - H / 2 + Math.sin(a) * r, scale: s.size, duration: 0.6, ease: "power3.out" });
      if (s.pulse) tl.to(d, { scale: s.size * 1.35, rotate: 180, duration: 0.8 / s.speed, ease: "sine.inOut" }, i * 0.08);
    });
    return () => { tl.kill(); };
  }, [s]);

  useEffect(() => {
    (window as any).__IE_DISPATCH = (action: string, payload: any) => { if (action === "SET_MOTION") setS((p) => ({ ...p, ...payload })); };
    load();
  }, []);

  async function load() {
    try { const IE = (window as any).IE; if (IE?.db) setPresets(await IE.db("motion_presets").list({ order: "created_at", desc: true, limit: 20 })); } catch (e: any) { setStatus("Could not load presets"); }
  }
  async function save() {
    if (!name.trim()) return setStatus("Name your preset first");
    try { await (window as any).IE.db("motion_presets").insert({ name: name.trim(), ...s }); setName(""); setStatus("Saved"); (window as any).IE.emit?.("motion:saved", s); load(); } catch { setStatus("Save failed"); }
  }
  function apply(p: any) {
    const n = { speed: p.speed, size: p.size, spin: p.spin || 0, x: p.x, y: p.y, pulse: !!p.pulse };
    setS(n); const w = widgets.current;
    w.dial && (w.dial.value = n.speed); w.slider && (w.slider.value = n.size); w.pad && (w.pad.x = n.x, w.pad.y = n.y); w.toggle && (w.toggle.state = n.pulse);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-6 grid gap-4 md:grid-cols-[280px_1fr]">
      <aside className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-4">
        <h1 className="text-lg font-semibold">Motion Studio</h1>
        <div><p className="text-xs text-zinc-400 mb-1">Speed {s.speed.toFixed(2)}</p><div ref={ctrl.dial} /></div>
        <div><p className="text-xs text-zinc-400 mb-1">Size {s.size.toFixed(2)}</p><div ref={ctrl.slider} /></div>
        <div><p className="text-xs text-zinc-400 mb-1">Position</p><div ref={ctrl.pad} /></div>
        <div className="flex items-center gap-2"><div ref={ctrl.toggle} /><span className="text-xs text-zinc-400">Pulse</span></div>
        <div className="flex gap-2"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Preset name" className="flex-1 rounded-lg bg-zinc-800 px-2 py-1 text-sm" /><button onClick={save} className="rounded-lg bg-teal-500 px-3 text-sm font-medium text-zinc-950">Save</button></div>
        {status && <p className="text-xs text-zinc-400">{status}</p>}
        <div className="space-y-1">
          {presets.length === 0 ? <p className="text-xs text-zinc-500">No presets yet.</p> : presets.map((p) => (
            <button key={p.id} onClick={() => apply(p)} className="block w-full text-left rounded-lg px-2 py-1 text-sm hover:bg-zinc-800">{p.name}</button>
          ))}
        </div>
      </aside>
      <main ref={stage} className="relative min-h-[420px] rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden flex items-center justify-center">
        {SHAPES.map((c, i) => (
          <div key={c} ref={(el) => (dots.current[i] = el)} className="absolute h-12 w-12 rounded-2xl" style={{ background: c, boxShadow: `0 0 30px ${c}88` }} />
        ))}
      </main>
    </div>
  );
}
