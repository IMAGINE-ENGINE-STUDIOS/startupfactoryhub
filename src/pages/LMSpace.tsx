/**
 * Lockheed Martin Space partnership brochure (/LMSpace) — one horizontal
 * screen "venture pipeline" mind map: IP owner -> Imagine Engine -> Startup
 * Factory Hub -> Decahedron Ventures -> Lockheed Martin Space ecosystem.
 * Drawn on a fixed 1600x900 stage scaled to the viewport so text always fits.
 * Credits: Imagine Engine Studios Corp.
 */
import { useEffect, useState } from "react";
import {
  Download, Building2, Lightbulb, Rocket, TrendingUp, Users, Brain, Route, Handshake,
  FlaskConical, Gift, Mic, Code2, Landmark, Briefcase, Coins, Target,
} from "lucide-react";
import { usePageSeo } from "@/hooks/usePageSeo";
import sfhLogo from "@/assets/sfh-main-logo.png.asset.json";

const G = "#39ff88";
const CY = "#22d3ee";
const LM = "#4aa8ff";
const VI = "#b28cff";
const AM = "#f5c35b";
const MONO = "'JetBrains Mono', ui-monospace, monospace";
const SANS = "'Space Grotesk', 'Inter', system-ui, sans-serif";
const SERIF = "'Playfair Display', Georgia, serif";
const W = 1600, H = 900, Y = 470;

const IE = { x: 375, r: 72 };
const SFH = { x: 800, r: 118 };
const DV = { x: 1200, r: 80 };

const SFH_TAGS: [string, typeof Users, number][] = [
  ["Team formation", Users, -155], ["Mentors & advisors", Handshake, -118],
  ["Genius AI strategy", Brain, -62], ["Journey mapping", Route, -25],
  ["Labs & office space", FlaskConical, 155], ["500+ resources & perks", Gift, 118],
  ["Events & pitch days", Mic, 62], ["AI product building", Code2, 25],
];
const DV_TAGS: [string, typeof Users, number][] = [
  ["Angels & family offices", Coins, -90], ["Early-stage VCs", TrendingUp, -38],
  ["Private equity", Landmark, 38], ["Direct investment", Briefcase, 90],
];
const TIMELINE = [
  ["00", "Origin", "University / Corp IP", LM], ["01", "Product", "Imagine Engine", VI],
  ["02", "Factory", "Startup Factory Hub", G], ["03", "Capital", "Decahedron Ventures", CY],
  ["04", "Plug-in", "Lockheed Martin Space", AM],
] as const;

const WAVE = `M40,${Y} C200,${Y - 70} 320,${Y + 60} ${IE.x},${Y} S640,${Y - 70} ${SFH.x},${Y} S1030,${Y + 70} ${DV.x},${Y} S1360,${Y - 60} 1560,${Y}`;

function useStageScale() {
  const calc = () => Math.min(window.innerWidth / W, window.innerHeight / H);
  const [s, setS] = useState(calc);
  useEffect(() => { const f = () => setS(calc()); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, []);
  return s;
}

const Tag = ({ x, y, label, Icon, color }: { x: number; y: number; label: string; Icon: typeof Users; color: string }) => (
  <div className="absolute flex items-center gap-2 lm-tag" style={{ left: x, top: y, transform: "translate(-50%,-50%)", padding: "6px 12px", borderRadius: 999, border: `1px solid ${color}55`, background: "rgba(4,14,22,0.9)", boxShadow: `0 0 14px ${color}25`, fontFamily: MONO, fontSize: 11.5, letterSpacing: "0.07em", textTransform: "uppercase", color: "#e4eef8", whiteSpace: "nowrap" }}>
    <Icon style={{ width: 15, height: 15, color }} /> {label}
  </div>
);

const Planet = ({ x, r, color, children, spin = 26 }: { x: number; r: number; color: string; children: React.ReactNode; spin?: number }) => (
  <>
    <div className="absolute rounded-full" style={{ left: x - r - 26, top: Y - r - 26, width: (r + 26) * 2, height: (r + 26) * 2, border: `1px dashed ${color}55`, animation: `lmSpin ${spin}s linear infinite` }} />
    <div className="absolute rounded-full flex flex-col items-center justify-center text-center" style={{ left: x - r, top: Y - r, width: r * 2, height: r * 2, background: `radial-gradient(circle at 35% 30%, ${color}55, ${color}14 45%, rgba(2,10,16,0.96) 75%)`, border: `1px solid ${color}aa`, animation: "lmPulse 3.4s ease-in-out infinite", ["--c" as string]: color }}>
      {children}
    </div>
  </>
);

export default function LMSpace() {
  usePageSeo({
    title: "Lockheed Martin Space Partnership — Startup Factory Hub",
    description: "Venture pipeline for Lockheed Martin Space: university and corporate IP turned into validated, investable ventures.",
    path: "/LMSpace",
  });
  const s = useStageScale();
  const pol = (cx: number, rx: number, ry: number, deg: number) => [cx + rx * Math.cos((deg * Math.PI) / 180), Y + ry * Math.sin((deg * Math.PI) / 180)];

  return (
    <div className="lm-root" style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#010810", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`
        @page { size: A4 landscape; margin: 0; }
        @keyframes lmSpin { to { transform: rotate(360deg); } }
        @keyframes lmFlow { to { stroke-dashoffset: -120; } }
        @keyframes lmPulse { 0%,100% { box-shadow: 0 0 30px color-mix(in srgb, var(--c) 30%, transparent); } 50% { box-shadow: 0 0 70px color-mix(in srgb, var(--c) 55%, transparent); } }
        @keyframes lmBlink { 50% { opacity: .25; } }
        @keyframes lmTw { 50% { opacity: .15; } }
        .lm-tag { transition: transform .25s, box-shadow .25s; }
        .lm-tag:hover { transform: translate(-50%,-50%) scale(1.06) !important; }
        @media print {
          html, body, #root { background: #010810 !important; }
          .lm-print { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <div className="relative shrink-0" style={{ width: W, height: H, transform: `scale(${s})`, transformOrigin: "center", color: "#dbe8f5", fontFamily: SANS, background: `radial-gradient(ellipse at 50% 52%, rgba(57,255,136,0.13), transparent 42%), radial-gradient(ellipse at 95% 50%, rgba(74,168,255,0.14), transparent 35%), #010810`, overflow: "hidden" }}>
        {/* Stars + grid */}
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.05, backgroundImage: `linear-gradient(${CY} 1px, transparent 1px), linear-gradient(90deg, ${CY} 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
        {Array.from({ length: 70 }).map((_, i) => (
          <span key={i} className="absolute rounded-full" style={{ left: (i * 337) % W, top: (i * 211) % H, width: i % 5 ? 1.5 : 2.5, height: i % 5 ? 1.5 : 2.5, background: "#cfe8ff", opacity: 0.5, animation: `lmTw ${2 + (i % 4)}s ease-in-out ${i % 3}s infinite` }} />
        ))}

        {/* Header */}
        <div className="absolute flex items-start justify-between" style={{ left: 40, right: 40, top: 26 }}>
          <div className="flex items-start gap-4">
            <img src={sfhLogo.url} alt="Startup Factory Hub" style={{ height: 52, width: "auto" }} />
            <div>
              <div className="flex items-center gap-3" style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.2em" }}>
                <span style={{ color: G, border: `1px solid ${G}66`, padding: "3px 10px", borderRadius: 999 }}>STARTUP FACTORY HUB</span>
                <span style={{ color: "#7f97b0" }}>×</span>
                <span style={{ color: LM }}>LOCKHEED MARTIN SPACE // PARTNERSHIP BRIEF</span>
              </div>
              <h1 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 44, lineHeight: 1.1, color: "#f2f7ff", marginTop: 8 }}>
                Venture Pipeline <span style={{ color: "#4b6077" }}>/</span> <span style={{ color: G }}>Lab to Investable Company</span>
              </h1>
              <div style={{ fontFamily: MONO, fontSize: 12.5, letterSpacing: "0.06em", color: "#8aa3bd", marginTop: 4 }}>
                University / corporate IP → Product → Team + Incubation → Investment → Lockheed Martin Space ecosystem
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <button onClick={() => window.print()} className="lm-print inline-flex items-center gap-2 rounded-md px-4 py-2 font-semibold" style={{ background: G, color: "#02130a", fontFamily: MONO, fontSize: 13 }}>
              <Download style={{ width: 16, height: 16 }} /> Download PDF
            </button>
            {/* TRL bar */}
            <div style={{ border: `1px solid ${CY}33`, background: "rgba(4,14,22,0.85)", borderRadius: 12, padding: "8px 12px" }}>
              <div className="flex items-center justify-between" style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.16em", color: "#8aa3bd", marginBottom: 6, gap: 24 }}>
                <span>TECHNOLOGY READINESS LEVEL</span>
                <span style={{ color: G }}>RESEARCH 1–6 → PRODUCT 6–10</span>
              </div>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: 10 }).map((_, i) => {
                  const lit = i >= 5;
                  return (
                    <span key={i} className="flex items-center justify-center rounded-full" style={{ width: 26, height: 26, fontFamily: MONO, fontSize: 11, fontWeight: 700, border: `1px solid ${lit ? G : "#2a3b4d"}`, background: lit ? `${G}${i === 5 ? "ff" : "33"}` : "transparent", color: lit ? (i === 5 ? "#02130a" : G) : "#5d7894", boxShadow: lit ? `0 0 10px ${G}55` : "none" }}>{i + 1}</span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Pipeline wave */}
        <svg className="absolute inset-0" width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <defs>
            <linearGradient id="lmWave" x1="0" x2="1">
              <stop offset="0" stopColor={LM} /><stop offset="0.3" stopColor={VI} /><stop offset="0.5" stopColor={G} /><stop offset="0.75" stopColor={CY} /><stop offset="1" stopColor={AM} />
            </linearGradient>
          </defs>
          <ellipse cx={SFH.x} cy={Y} rx={225} ry={220} fill="none" stroke={G} strokeOpacity={0.14} strokeDasharray="3 7" />
          
          <path d={WAVE} fill="none" stroke="url(#lmWave)" strokeOpacity={0.35} strokeWidth={8} style={{ filter: "blur(6px)" }} />
          <path d={WAVE} fill="none" stroke="url(#lmWave)" strokeWidth={2.5} />
          <path d={WAVE} fill="none" stroke="#ffffff" strokeWidth={3} strokeLinecap="round" strokeDasharray="10 110" style={{ animation: "lmFlow 2.4s linear infinite" }} />
          {[0, 1.6, 3.2].map((d) => (
            <circle key={d} r={5} fill={G} style={{ filter: `drop-shadow(0 0 6px ${G})` }}>
              <animateMotion dur="4.8s" begin={`${d}s`} repeatCount="indefinite" path={WAVE} />
            </circle>
          ))}
        </svg>

        {/* Origin */}
        <div className="absolute" style={{ left: 40, top: Y - 118, width: 210, padding: 16, borderRadius: 16, border: `1px dashed ${LM}88`, background: "rgba(4,14,26,0.92)", boxShadow: `0 0 26px ${LM}22` }}>
          <div className="flex items-center justify-between" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em", color: LM }}>
            <span>ORIGIN // 00</span>
            <Building2 style={{ width: 20, height: 20 }} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#f2f7ff", lineHeight: 1.15, marginTop: 8 }}>University or Corporation</div>
          <div style={{ fontSize: 15, color: "#cfe0f0", marginTop: 6, lineHeight: 1.35 }}>Holds research IP it wants to commercialize.</div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: "#8aa3bd", marginTop: 8, lineHeight: 1.5 }}>Patents · Research · Lab prototypes</div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: LM, marginTop: 8 }}>IP TRANSFER →</div>
        </div>

        {/* Imagine Engine */}
        <Planet x={IE.x} r={IE.r} color={VI} spin={20}>
          <Lightbulb style={{ width: 24, height: 24, color: VI }} />
          <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, letterSpacing: "0.14em", color: "#f2f7ff", marginTop: 4, lineHeight: 1.2 }}>IMAGINE<br />ENGINE</div>
        </Planet>
        <div className="absolute text-center" style={{ left: IE.x - 120, top: 262, width: 240, fontFamily: MONO, fontSize: 11, letterSpacing: "0.18em", color: VI }}>ENGINE 01 · IP → PRODUCT</div>
        <div className="absolute text-center" style={{ left: IE.x - 130, top: 288, width: 260 }}>
          <div style={{ fontSize: 15, color: "#e4eef8", lineHeight: 1.35 }}>De-risk, validate and package the IP into a buildable product.</div>
          <div style={{ fontFamily: MONO, fontSize: 11.5, color: VI, marginTop: 6 }}>TRL 1–6 IN → TRL 6–10 OUT</div>
        </div>

        {/* Startup Factory Hub */}
        <Planet x={SFH.x} r={SFH.r} color={G} spin={34}>
          <img src={sfhLogo.url} alt="" style={{ width: 54, height: "auto" }} />
          <div style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, letterSpacing: "0.14em", color: "#f2f7ff", marginTop: 6, lineHeight: 1.2 }}>STARTUP<br />FACTORY HUB</div>
          <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.1em", color: G, marginTop: 6, lineHeight: 1.35 }}>AI VENTURE-BUILDING<br />PLATFORM</div>
        </Planet>
        {SFH_TAGS.map(([l, I, a]) => { const [x, y] = pol(SFH.x, 225, 220, a); return <Tag key={l} x={x} y={y} label={l} Icon={I} color={G} />; })}
        <div className="absolute text-center" style={{ left: SFH.x - 330, top: 726, width: 660, padding: "8px 16px", borderRadius: 12, border: `1px solid ${G}33`, background: "rgba(4,18,12,0.85)" }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.18em", color: G }}>ENGINE 02 · TEAM + INCUBATION</div>
          <div style={{ fontSize: 14, color: "#e4eef8", marginTop: 3, lineHeight: 1.35 }}>
            One AI-powered incubator and accelerator: we build or match the team, then nurture it with mentors, labs, workspace, resources and strategy from idea to growth.
          </div>
        </div>

        {/* Decahedron Ventures */}
        <Planet x={DV.x} r={DV.r} color={CY} spin={24}>
          <Target style={{ width: 24, height: 24, color: CY }} />
          <div style={{ fontFamily: MONO, fontSize: 13.5, fontWeight: 700, letterSpacing: "0.14em", color: "#f2f7ff", marginTop: 4, lineHeight: 1.2 }}>DECAHEDRON<br />VENTURES</div>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", color: CY, marginTop: 4 }}>ENGINE 03</div>
        </Planet>
        {DV_TAGS.map(([l, I], i) => <Tag key={l} x={DV.x} y={[290, 334, 606, 650][i]} label={l} Icon={I} color={CY} />)}
        <div className="absolute text-center" style={{ left: DV.x - 150, top: 690, width: 300 }}>
          <div style={{ fontSize: 15, color: "#e4eef8", lineHeight: 1.35 }}>Investment platform and private equity firm.</div>
          <div style={{ fontFamily: MONO, fontSize: 11.5, color: CY, marginTop: 4 }}>INVESTOR-READY → FUNDED</div>
        </div>

        {/* Lockheed Martin Space */}
        <div className="absolute" style={{ right: 40, top: Y - 108, width: 220, padding: 16, borderRadius: 16, border: `1px solid ${AM}88`, background: "rgba(20,16,6,0.9)", boxShadow: `0 0 34px ${AM}30` }}>
          <div className="flex items-center justify-between" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em", color: AM }}>
            <span>OUTPUT // 04</span>
            <Rocket style={{ width: 20, height: 20 }} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#f2f7ff", lineHeight: 1.15, marginTop: 8 }}>Lockheed Martin Space</div>
          <div style={{ fontSize: 15, color: "#f0e6cc", marginTop: 6, lineHeight: 1.35 }}>Validated, investable ventures plug into the Lockheed Martin Space ecosystem.</div>
          <div className="flex items-center gap-2" style={{ fontFamily: MONO, fontSize: 11, color: AM, marginTop: 10 }}>
            <span style={{ width: 7, height: 7, borderRadius: 9, background: AM, boxShadow: `0 0 8px ${AM}`, animation: "lmBlink 1.6s infinite" }} /> READY TO PLUG IN
          </div>
        </div>

        {/* Timeline */}
        <div className="absolute flex items-center justify-between" style={{ left: 40, right: 40, bottom: 22, padding: "12px 22px", borderRadius: 14, border: `1px solid ${CY}26`, background: "rgba(4,14,22,0.85)" }}>
          <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em", color: "#7f97b0" }}>MISSION TIMELINE</span>
          {TIMELINE.map(([n, t, sub, c], i) => (
            <div key={n} className="flex items-center gap-3">
              <span className="flex items-center justify-center rounded-full" style={{ width: 32, height: 32, border: `1px solid ${c}`, color: c, fontFamily: MONO, fontSize: 12, fontWeight: 700, boxShadow: `0 0 10px ${c}44` }}>{n}</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#f2f7ff" }}>{t}</div>
                <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.1em", color: "#8aa3bd", textTransform: "uppercase" }}>{sub}</div>
              </div>
              {i < TIMELINE.length - 1 && <span style={{ width: 60, height: 1, background: `linear-gradient(90deg, ${c}, transparent)`, marginLeft: 12 }} />}
            </div>
          ))}
          <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.16em", color: "#7f97b0" }}>startupfactoryhub.com</span>
        </div>
      </div>
    </div>
  );
}
