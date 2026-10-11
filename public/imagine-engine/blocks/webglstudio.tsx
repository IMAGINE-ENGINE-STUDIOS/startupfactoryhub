import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Float } from "@react-three/drei";

function Shape({ kind, color, speed, wire, rough, metal }) {
  const ref = useRef(null);
  useFrame((_, dt) => { if (ref.current) { ref.current.rotation.y += dt * speed; ref.current.rotation.x += dt * speed * 0.4; } });
  return (
    <Float speed={1.5} floatIntensity={0.6}>
      <mesh ref={ref} castShadow>
        {kind === "knot" && <torusKnotGeometry args={[0.8, 0.28, 220, 32]} />}
        {kind === "sphere" && <icosahedronGeometry args={[1.1, 4]} />}
        {kind === "box" && <boxGeometry args={[1.5, 1.5, 1.5]} />}
        <meshStandardMaterial color={color} wireframe={wire} roughness={rough} metalness={metal} />
      </mesh>
    </Float>
  );
}

export default function WebGLStudio() {
  const [s, setS] = useState({ kind: "knot", color: "#4f8cff", speed: 0.6, wire: false, rough: 0.25, metal: 0.7, env: "city" });
  const set = (k, v) => setS((p) => ({ ...p, [k]: v }));
  window.__IE_DISPATCH = (a, p) => { if (a === "set" && p) setS((x) => ({ ...x, ...p })); };
  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-neutral-950 text-neutral-100">
      <div className="flex-1 min-h-[60vh]">
        <Canvas shadows camera={{ position: [3, 2, 4], fov: 45 }}>
          <ambientLight intensity={0.3} />
          <directionalLight position={[4, 6, 3]} intensity={1.2} castShadow />
          <Shape {...s} />
          <ContactShadows position={[0, -1.4, 0]} opacity={0.5} blur={2.5} scale={10} />
          <Environment preset={s.env} />
          <OrbitControls makeDefault enableDamping />
        </Canvas>
      </div>
      <aside className="w-full md:w-72 p-5 space-y-4 border-l border-neutral-800 text-sm">
        <h2 className="text-lg font-semibold">Scene controls</h2>
        <label className="block">Shape
          <select className="mt-1 w-full bg-neutral-900 rounded p-2" value={s.kind} onChange={(e) => set("kind", e.target.value)}>
            <option value="knot">Torus knot</option><option value="sphere">Sphere</option><option value="box">Box</option>
          </select>
        </label>
        <label className="block">Color <input type="color" className="ml-2 align-middle" value={s.color} onChange={(e) => set("color", e.target.value)} /></label>
        {[["speed", "Spin speed", 0, 3], ["rough", "Roughness", 0, 1], ["metal", "Metalness", 0, 1]].map(([k, l, a, b]) => (
          <label key={k} className="block">{l}
            <input type="range" min={a} max={b} step={0.01} className="w-full" value={s[k]} onChange={(e) => set(k, +e.target.value)} />
          </label>
        ))}
        <label className="block">Lighting
          <select className="mt-1 w-full bg-neutral-900 rounded p-2" value={s.env} onChange={(e) => set("env", e.target.value)}>
            {["city", "sunset", "studio", "forest", "night", "warehouse"].map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={s.wire} onChange={(e) => set("wire", e.target.checked)} /> Wireframe</label>
      </aside>
    </div>
  );
}
