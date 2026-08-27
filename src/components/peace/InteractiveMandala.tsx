import { useEffect, useRef, useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";

/**
 * Psychedelic WebGL kaleidoscope mandala.
 * Raw WebGL fragment shader (no dependencies). The pointer warps the
 * fold-space in real time, so it behaves as a free interactive element
 * rather than a framed canvas widget.
 */

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2  u_res;
uniform float u_time;
uniform vec2  u_pointer;   // -1..1
uniform float u_seg;       // symmetry
uniform float u_palette;   // 0,1,2
uniform float u_energy;    // pointer proximity energy

vec3 palette(float t, float which) {
  vec3 a = vec3(0.5), b = vec3(0.5), c = vec3(1.0), d;
  if (which < 0.5)      d = vec3(0.00, 0.33, 0.67);  // full spectrum trip
  else if (which < 1.5) d = vec3(0.30, 0.20, 0.90);  // magenta / cyan acid
  else                  d = vec3(0.80, 0.90, 0.30);  // lime / violet haze
  return a + b * cos(6.28318 * (c * t + d));
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);
  uv *= 2.0;

  // pointer pulls the center of the mandala
  vec2 p = uv - u_pointer * 0.45;

  float r = length(p);
  float a = atan(p.y, p.x);

  // kaleidoscopic folding
  float seg = 6.28318 / u_seg;
  a = mod(a, seg);
  a = abs(a - seg * 0.5);

  vec2 k = vec2(cos(a), sin(a)) * r;

  float t = u_time * 0.25;
  float acc = 0.0;
  vec3 col = vec3(0.0);

  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    vec2 q = k;
    q = abs(q) / dot(q, q) - 0.72 - 0.08 * sin(t + fi);
    q += 0.22 * vec2(sin(t * 1.3 + fi), cos(t * 1.1 + fi * 1.7));
    float d = length(q) - 0.32 - 0.05 * sin(t * 2.0 + fi * 2.0);
    float glow = 0.016 / (abs(d) + 0.02);
    acc += glow;
    col += palette(fract(0.12 * fi + r * 0.35 - t * 0.35), u_palette) * glow;
  }

  // radial rings and center bloom
  float rings = 0.5 + 0.5 * sin(r * 22.0 - u_time * 1.6);
  col += palette(fract(r * 0.5 + u_time * 0.05), u_palette) * rings * 0.16;
  col += palette(fract(u_time * 0.08), u_palette) * (0.09 / (r + 0.12));

  col *= 0.55 + u_energy * 0.85;
  col = pow(col / (col + 0.85), vec3(0.85));       // tonemap
  col = mix(vec3(dot(col, vec3(0.33))), col, 1.6); // saturate

  float vig = smoothstep(1.75, 0.15, r);
  vec3 deep = vec3(0.03, 0.0, 0.06);
  gl_FragColor = vec4(deep + col * vig, 1.0);
}
`;

const PALETTES = ["SPECTRUM", "ACID", "HAZE"];

export default function InteractiveMandala({ height = 420 }: { height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointer = useRef({ x: 0, y: 0, target: 0, energy: 0 });
  const rafRef = useRef(0);
  const [segments, setSegments] = useState(10);
  const [palette, setPalette] = useState(0);
  const [autoSpin, setAutoSpin] = useState(true);
  const [failed, setFailed] = useState(false);

  const segRef = useRef(segments);
  const palRef = useRef(palette);
  const spinRef = useRef(autoSpin);
  segRef.current = segments;
  palRef.current = palette;
  spinRef.current = autoSpin;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = (canvas.getContext("webgl", { alpha: false, antialias: true }) ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) {
      setFailed(true);
      return;
    }

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn("[mandala] shader compile", gl.getShaderInfoLog(s));
      }
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      setFailed(true);
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uPtr = gl.getUniformLocation(prog, "u_pointer");
    const uSeg = gl.getUniformLocation(prog, "u_seg");
    const uPal = gl.getUniformLocation(prog, "u_palette");
    const uEnergy = gl.getUniformLocation(prog, "u_energy");

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    let start = performance.now();
    let clock = 0;
    let last = start;

    const render = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (spinRef.current) clock += dt;
      else clock += dt * 0.15;

      const p = pointer.current;
      p.energy += ((p.target || 0) - p.energy) * 0.06;

      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, clock);
      gl.uniform2f(uPtr, p.x, p.y);
      gl.uniform1f(uSeg, segRef.current);
      gl.uniform1f(uPal, palRef.current);
      gl.uniform1f(uEnergy, p.energy);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const move = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    pointer.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.current.y = -(((clientY - rect.top) / rect.height) * 2 - 1);
    pointer.current.target = 1;
  };

  return (
    <div className="relative w-full" style={{ height }}>
      {failed ? (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground font-mono">
          WEBGL UNAVAILABLE ON THIS DEVICE
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none cursor-crosshair rounded-2xl"
          onPointerMove={(e) => move(e.clientX, e.clientY)}
          onPointerDown={(e) => move(e.clientX, e.clientY)}
          onPointerLeave={() => (pointer.current.target = 0)}
        />
      )}

      {/* floating controls — no card, element stays free */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-wrap items-center justify-center gap-2 px-3 py-2 rounded-full backdrop-blur-md bg-background/30 border border-primary/20">
        {PALETTES.map((p, i) => (
          <button
            key={p}
            onClick={() => setPalette(i)}
            className={`px-2 py-1 rounded-full text-[9px] font-futuristic tracking-[0.2em] transition-all ${
              i === palette ? "bg-primary/25 text-primary" : "text-muted-foreground hover:text-primary"
            }`}
          >
            {p}
          </button>
        ))}
        <input
          type="range"
          min={3}
          max={24}
          step={1}
          value={segments}
          onChange={(e) => setSegments(Number(e.target.value))}
          className="w-20 accent-primary"
          aria-label="Mandala symmetry"
        />
        <button
          onClick={() => setAutoSpin((s) => !s)}
          className={`p-1.5 rounded-full transition-all ${autoSpin ? "text-primary" : "text-muted-foreground"}`}
          title="Toggle motion"
        >
          <Sparkles className="w-3 h-3" />
        </button>
        <button
          onClick={() => setSegments(3 + Math.floor(Math.random() * 20))}
          className="p-1.5 rounded-full text-muted-foreground hover:text-primary transition-all"
          title="Randomize symmetry"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
