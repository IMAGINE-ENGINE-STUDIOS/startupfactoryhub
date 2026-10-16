/**
 * Lockheed Martin Space partnership brochure (/LMSpace) — single horizontal
 * screen, animated "engine mind map": IP owner -> 3-Engine System -> Lockheed
 * Martin Space ecosystem. Print-ready landscape PDF.
 * Credits: Imagine Engine Studios Corp.
 */
import { Download, Lightbulb, Users, TrendingUp, Building2, Rocket } from "lucide-react";
import { usePageSeo } from "@/hooks/usePageSeo";
import sfhLogo from "@/assets/sfh-main-logo.png.asset.json";

const G = "#39ff88";
const CY = "#22d3ee";
const LM = "#4aa8ff";
const VI = "#b28cff";
const MONO = "'JetBrains Mono', ui-monospace, monospace";
const SERIF = "'Playfair Display', Georgia, serif";

type Node = {
  id: string; x: number; y: number; w: string; color: string; icon: typeof Lightbulb;
  label: string; name: string; tag: string; rows: [string, string][]; note?: string; dashed?: boolean;
};

const NODES: Node[] = [
  { id: "src", x: 10, y: 50, w: "15vw", color: LM, icon: Building2, dashed: true, label: "START", name: "University or Corporation", tag: "IP Owner",
    rows: [["Input", "Holds IP it wants to commercialize"]], note: "Then the engines plug in." },
  { id: "e1", x: 30.5, y: 27, w: "20vw", color: VI, icon: Lightbulb, label: "ENGINE 01", name: "Imagine Engine", tag: "IP → Product",
    rows: [["Entry", "University or corporate IP at TRL 1–6"], ["What we do", "De-risk, validate, IP packaging"], ["Exit", "Commercial product at TRL 6–10"]] },
  { id: "e2", x: 50, y: 72, w: "21vw", color: G, icon: Users, label: "ENGINE 02", name: "Startup Factory Hub", tag: "Team & Incubation",
    rows: [["Teams", "Create teams around the product or match existing teams"], ["The factory", "Incubator / Accelerator platform"], ["Nurture with", "Human Capital, Professional Space, Lab Access, Mentorship, Advisory, Strategic Guidance, Platform"]] },
  { id: "e3", x: 69.5, y: 27, w: "20vw", color: CY, icon: TrendingUp, label: "ENGINE 03", name: "Decahedron Ventures", tag: "Growth & Capital",
    rows: [["Journey", "Ideation → Growth → Maturity"], ["Traction", "First commercial clients for the tech"], ["Readiness", "Make it Investor-Ready"], ["Then", "Angels, Family Offices, Early-Stage Investors, or your Private Equity firm"]] },
  { id: "lm", x: 90, y: 50, w: "15vw", color: LM, icon: Rocket, label: "OUTPUT", name: "Lockheed Martin Space", tag: "Ecosystem",
    rows: [["Plug-in", "Validated, investable ventures connect to the Lockheed Martin Space ecosystem"]] },
];

// Links in a 1000x600 space (x% * 10, y% * 6)
const P = (id: string) => { const n = NODES.find((k) => k.id === id)!; return [n.x * 10, n.y * 6]; };
const CORE = [500, 165];
const LINKS: { a: number[]; b: number[]; color: string; dur: number }[] = [
  { a: P("src"), b: P("e1"), color: LM, dur: 3 },
  { a: P("e1"), b: P("e2"), color: VI, dur: 3.2 },
  { a: P("e2"), b: P("e3"), color: G, dur: 3.2 },
  { a: P("e3"), b: P("lm"), color: CY, dur: 3 },
  { a: CORE, b: P("e1"), color: VI, dur: 4 },
  { a: CORE, b: P("e2"), color: G, dur: 4 },
  { a: CORE, b: P("e3"), color: CY, dur: 4 },
];
const curve = (a: number[], b: number[]) => {
  const mx = (a[0] + b[0]) / 2;
  return `M${a[0]},${a[1]} C${mx},${a[1]} ${mx},${b[1]} ${b[0]},${b[1]}`;
};

export default function LMSpace() {
  usePageSeo({
    title: "Lockheed Martin Space Partnership — Startup Factory Hub",
    description: "Partnership opportunity with Lockheed Martin Space: the 3-Engine System that turns IP into validated, investable ventures.",
    path: "/LMSpace",
  });

  return (
    <div className="lm-root" style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#01060e", color: "#dbe8f5", fontFamily: "'Inter', system-ui, sans-serif", position: "relative" }}>
      <style>{`
        @page { size: A4 landscape; margin: 0; }
        @keyframes lmFlow { to { stroke-dashoffset: -88; } }
        @keyframes lmSpin { to { transform: rotate(360deg); } }
        @keyframes lmSpinR { to { transform: rotate(-360deg); } }
        @keyframes lmPulse { 0%,100% { box-shadow: 0 0 24px rgba(57,255,136,.25), inset 0 0 18px rgba(57,255,136,.15); } 50% { box-shadow: 0 0 48px rgba(57,255,136,.5), inset 0 0 28px rgba(57,255,136,.3); } }
        @keyframes lmFloat { 0%,100% { transform: translate(-50%,-50%); } 50% { transform: translate(-50%,calc(-50% - 5px)); } }
        @keyframes lmScan { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }
        @keyframes lmBlink { 50% { opacity: .25; } }
        .lm-node { animation: lmFloat 6s ease-in-out infinite; transition: border-color .3s, box-shadow .3s; }
        .lm-node:hover { box-shadow: 0 0 34px var(--c); border-color: var(--c) !important; }
        @media print {
          html, body, #root { background: #01060e !important; }
          .lm-root { width: 297mm !important; height: 210mm !important; }
          .lm-print { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 35%, rgba(57,255,136,0.10), transparent 45%), radial-gradient(ellipse at 100% 50%, rgba(74,168,255,0.16), transparent 40%), radial-gradient(ellipse at 0% 50%, rgba(74,168,255,0.10), transparent 40%)` }} />
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.07, backgroundImage: `linear-gradient(${LM} 1px, transparent 1px), linear-gradient(90deg, ${LM} 1px, transparent 1px)`, backgroundSize: "36px 36px" }} />
      <div className="absolute inset-x-0 top-0 pointer-events-none" style={{ height: 120, background: "linear-gradient(transparent, rgba(57,255,136,0.05), transparent)", animation: "lmScan 7s linear infinite" }} />

      <div className="relative h-full flex flex-col" style={{ padding: "clamp(12px,2.2vh,26px) clamp(18px,3vw,44px)", gap: "clamp(6px,1.2vh,14px)" }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={sfhLogo.url} alt="Startup Factory Hub" style={{ height: "clamp(24px,3.8vh,38px)", width: "auto" }} />
            <span style={{ fontFamily: MONO, fontSize: "clamp(9px,1.1vh,12px)", letterSpacing: "0.2em" }}>STARTUP FACTORY HUB</span>
            <span style={{ color: LM, fontFamily: MONO }}>×</span>
            <span style={{ fontFamily: MONO, fontSize: "clamp(9px,1.1vh,12px)", letterSpacing: "0.2em", color: LM }}>LOCKHEED MARTIN SPACE</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2" style={{ fontFamily: MONO, fontSize: "clamp(8px,1vh,11px)", letterSpacing: "0.2em", color: G }}>
              <span style={{ width: 7, height: 7, borderRadius: 9, background: G, boxShadow: `0 0 8px ${G}`, animation: "lmBlink 1.6s infinite" }} /> ENGINE ONLINE // PARTNERSHIP OPPORTUNITY
            </span>
            <button onClick={() => window.print()} className="lm-print inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold" style={{ background: G, color: "#02130a", fontFamily: MONO }}>
              <Download className="h-3.5 w-3.5" /> Download PDF
            </button>
          </div>
        </div>

        {/* Title */}
        <div>
          <div style={{ fontFamily: MONO, fontSize: "clamp(9px,1.2vh,12px)", letterSpacing: "0.24em", color: CY, marginBottom: 4 }}>THE 3-ENGINE SYSTEM</div>
          <h1 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: "clamp(22px,4.4vh,48px)", lineHeight: 1.05, color: "#f2f7ff" }}>
            An engine that produces <span style={{ color: G }}>validated, investable ventures.</span>
          </h1>
        </div>

        {/* Mind map */}
        <div className="relative flex-1 min-h-0">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 600" preserveAspectRatio="none">
            {LINKS.map((l, i) => {
              const d = curve(l.a, l.b);
              return (
                <g key={i}>
                  <path d={d} fill="none" stroke={l.color} strokeOpacity={0.22} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
                  <path d={d} fill="none" stroke={l.color} strokeWidth={2.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" strokeDasharray="6 82"
                    style={{ animation: `lmFlow ${l.dur}s linear infinite`, filter: `drop-shadow(0 0 4px ${l.color})` }} />
                </g>
              );
            })}
          </svg>

          {/* Engine core */}
          <div className="absolute" style={{ left: "50%", top: "27.5%", transform: "translate(-50%,-50%)", width: "clamp(110px,19vh,170px)", aspectRatio: "1" }}>
            <div className="absolute inset-0 rounded-full" style={{ border: `1px dashed ${G}80`, animation: "lmSpin 18s linear infinite" }} />
            <div className="absolute rounded-full" style={{ inset: "12%", border: `2px solid transparent`, borderTopColor: CY, borderBottomColor: VI, animation: "lmSpinR 6s linear infinite" }} />
            <div className="absolute rounded-full flex flex-col items-center justify-center text-center" style={{ inset: "24%", background: "radial-gradient(circle, rgba(57,255,136,0.18), rgba(2,10,8,0.95))", border: `1px solid ${G}90`, animation: "lmPulse 3s ease-in-out infinite" }}>
              <img src={sfhLogo.url} alt="" style={{ width: "42%", height: "auto" }} />
              <span style={{ fontFamily: MONO, fontSize: "clamp(7px,1vh,10px)", letterSpacing: "0.16em", color: G, marginTop: 2 }}>CORE</span>
            </div>
          </div>
          <div className="absolute text-center" style={{ left: "50%", top: "1%", transform: "translateX(-50%)", fontFamily: MONO, fontSize: "clamp(8px,1.05vh,11px)", letterSpacing: "0.18em", color: "#8aa3bd", whiteSpace: "nowrap" }}>
            PRODUCE <span style={{ color: VI }}>›</span> VALIDATE <span style={{ color: G }}>›</span> INVEST <span style={{ color: CY }}>›</span> PLUG IN
          </div>

          {/* Nodes */}
          {NODES.map((n, i) => {
            const Icon = n.icon;
            return (
              <div key={n.id} className="lm-node absolute flex flex-col"
                style={{ left: `${n.x}%`, top: `${n.y}%`, width: n.w, animationDelay: `${i * 0.8}s`, ["--c" as string]: `${n.color}80`,
                  border: `1px ${n.dashed ? "dashed" : "solid"} ${n.color}55`, background: "rgba(5,14,26,0.86)", backdropFilter: "blur(8px)", borderRadius: 14,
                  padding: "clamp(8px,1.5vh,16px)", boxShadow: `0 0 22px ${n.color}22, inset 0 1px 0 ${n.color}40` }}>
                <div className="flex items-center justify-between">
                  <span style={{ fontFamily: MONO, fontSize: "clamp(8px,1vh,11px)", letterSpacing: "0.2em", color: n.color }}>{n.label}</span>
                  <span className="flex items-center justify-center rounded-md" style={{ width: "clamp(20px,3vh,28px)", height: "clamp(20px,3vh,28px)", background: `${n.color}18`, border: `1px solid ${n.color}55` }}>
                    <Icon style={{ color: n.color, width: "60%", height: "60%" }} />
                  </span>
                </div>
                <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: "clamp(15px,2.5vh,25px)", color: "#f2f7ff", marginTop: 4, lineHeight: 1.1 }}>{n.name}</div>
                <div style={{ fontFamily: MONO, fontSize: "clamp(9px,1.25vh,13px)", color: n.color, marginBottom: "clamp(4px,0.9vh,10px)" }}>{n.tag}</div>
                <div className="flex flex-col" style={{ gap: "clamp(3px,0.7vh,8px)" }}>
                  {n.rows.map(([k, v]) => (
                    <div key={k} style={{ borderLeft: `2px solid ${n.color}`, paddingLeft: 8 }}>
                      <div style={{ fontFamily: MONO, fontSize: "clamp(7px,1vh,10px)", letterSpacing: "0.16em", textTransform: "uppercase", color: "#7f97b0" }}>{k}</div>
                      <div style={{ fontSize: "clamp(10px,1.6vh,15px)", lineHeight: 1.3, color: "#e4eef8" }}>{v}</div>
                    </div>
                  ))}
                </div>
                {n.note && <div style={{ fontSize: "clamp(9px,1.3vh,13px)", fontStyle: "italic", color: n.color, marginTop: 8 }}>{n.note}</div>}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between" style={{ borderTop: "1px solid rgba(74,168,255,0.2)", paddingTop: "clamp(5px,1vh,10px)", fontFamily: MONO, fontSize: "clamp(8px,1vh,11px)", letterSpacing: "0.14em", color: "#8aa3bd" }}>
          <span>IMAGINE ENGINE // STARTUP FACTORY HUB // DECAHEDRON VENTURES</span>
          <span>startupfactoryhub.com</span>
        </div>
      </div>
    </div>
  );
}
