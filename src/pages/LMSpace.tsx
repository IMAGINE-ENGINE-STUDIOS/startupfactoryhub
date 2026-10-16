/**
 * Lockheed Martin Space partnership brochure (/LMSpace) — single horizontal
 * screen, print-ready landscape PDF. Presents the 3-Engine System.
 * Credits: Imagine Engine Studios Corp.
 */
import { Download, Lightbulb, Users, TrendingUp, ArrowRight, Building2 } from "lucide-react";
import { usePageSeo } from "@/hooks/usePageSeo";
import sfhLogo from "@/assets/sfh-main-logo.png.asset.json";

const G = "#39ff88";
const CY = "#22d3ee";
const LM = "#4aa8ff";
const MONO = "'JetBrains Mono', ui-monospace, monospace";
const SERIF = "'Playfair Display', Georgia, serif";

const ENGINES = [
  {
    n: "01", name: "Imagine Engine", tag: "IP → Product", icon: Lightbulb, color: "#b28cff",
    rows: [
      ["Entry", "University or corporate IP at TRL 1–6"],
      ["What we do", "De-risk, validate, IP packaging"],
      ["Exit", "Commercial product at TRL 6–10"],
    ],
    note: "Where raw research becomes a buildable product.",
  },
  {
    n: "02", name: "Startup Factory Hub", tag: "Team & Incubation", icon: Users, color: G,
    rows: [
      ["Teams", "Create teams around the product or match existing teams"],
      ["The factory", "Incubator / Accelerator platform"],
      ["Nurture with", "Human Capital, Professional Space, Lab Access, Mentorship, Advisory, Strategic Guidance, Platform"],
    ],
    note: "",
  },
  {
    n: "03", name: "Decahedron Ventures", tag: "Growth & Capital", icon: TrendingUp, color: CY,
    rows: [
      ["Journey", "Ideation → Growth → Maturity"],
      ["Traction", "We find the first commercial clients for the tech"],
      ["Readiness", "Make it Investor-Ready"],
      ["Then", "Angels, Family Offices, Early-Stage Investors, or direct investment through your Private Equity firm"],
    ],
    note: "",
  },
];

export default function LMSpace() {
  usePageSeo({
    title: "Lockheed Martin Space Partnership — Startup Factory Hub",
    description: "Partnership opportunity with Lockheed Martin Space: the 3-Engine System taking IP to product, teams and capital.",
    path: "/LMSpace",
  });

  return (
    <div className="lm-root" style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#01060e", color: "#dbe8f5", fontFamily: "'Inter', system-ui, sans-serif", position: "relative" }}>
      <style>{`
        @page { size: A4 landscape; margin: 0; }
        @media print {
          html, body, #root { background: #01060e !important; }
          .lm-root { width: 297mm !important; height: 210mm !important; }
          .lm-print { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 100% 0%, rgba(74,168,255,0.18), transparent 50%), radial-gradient(ellipse at 0% 100%, rgba(57,255,136,0.10), transparent 45%)` }} />
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.08, backgroundImage: `linear-gradient(${LM} 1px, transparent 1px), linear-gradient(90deg, ${LM} 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />

      <div className="relative h-full flex flex-col" style={{ padding: "clamp(14px,2.4vh,28px) clamp(18px,3vw,48px)", gap: "clamp(8px,1.8vh,20px)" }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={sfhLogo.url} alt="Startup Factory Hub" style={{ height: "clamp(26px,4vh,40px)", width: "auto" }} />
            <span style={{ fontFamily: MONO, fontSize: "clamp(9px,1.1vh,12px)", letterSpacing: "0.2em" }}>STARTUP FACTORY HUB</span>
            <span style={{ color: LM, fontFamily: MONO }}>×</span>
            <span style={{ fontFamily: MONO, fontSize: "clamp(9px,1.1vh,12px)", letterSpacing: "0.2em", color: LM }}>LOCKHEED MARTIN SPACE</span>
          </div>
          <div className="flex items-center gap-3">
            <span style={{ fontFamily: MONO, fontSize: "clamp(8px,1vh,11px)", letterSpacing: "0.2em", color: G }}>PARTNERSHIP OPPORTUNITY</span>
            <button onClick={() => window.print()} className="lm-print inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold" style={{ background: G, color: "#02130a", fontFamily: MONO }}>
              <Download className="h-3.5 w-3.5" /> Download PDF
            </button>
          </div>
        </div>

        {/* Title */}
        <div>
          <div style={{ fontFamily: MONO, fontSize: "clamp(9px,1.2vh,12px)", letterSpacing: "0.24em", color: CY, marginBottom: 6 }}>THE 3-ENGINE SYSTEM</div>
          <h1 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: "clamp(24px,5vh,54px)", lineHeight: 1.05, color: "#f2f7ff" }}>
            From space research to <span style={{ color: G }}>funded companies.</span>
          </h1>
        </div>

        {/* Engines */}
        <div className="flex-1 min-h-0 grid items-stretch" style={{ gridTemplateColumns: "0.7fr auto 1fr auto 1fr auto 1fr", gap: "clamp(6px,1vw,14px)" }}>
          <div className="min-h-0 flex flex-col overflow-hidden" style={{ border: `1px dashed ${LM}70`, background: "rgba(6,16,30,0.6)", borderRadius: 14, padding: "clamp(10px,2vh,22px)" }}>
            <div className="flex items-center justify-between">
              <span style={{ fontFamily: MONO, fontSize: "clamp(9px,1.1vh,12px)", letterSpacing: "0.2em", color: LM }}>START</span>
              <Building2 style={{ color: LM, width: "clamp(18px,2.6vh,26px)", height: "clamp(18px,2.6vh,26px)" }} />
            </div>
            <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: "clamp(18px,3vh,30px)", color: "#f2f7ff", marginTop: 6, lineHeight: 1.1 }}>University or Corporation</div>
            <div style={{ fontFamily: MONO, fontSize: "clamp(10px,1.4vh,14px)", color: LM, marginTop: 2 }}>IP Owner</div>
            <div className="flex flex-col flex-1 justify-center">
              <div style={{ borderLeft: `2px solid ${LM}`, paddingLeft: 10 }}>
                <div style={{ fontSize: "clamp(11px,2.1vh,19px)", lineHeight: 1.35, color: "#e4eef8" }}>Holds IP it wants to commercialize.</div>
              </div>
            </div>
            <div style={{ fontSize: "clamp(10px,1.4vh,14px)", fontStyle: "italic", color: LM }}>Then the engines plug in.</div>
          </div>
          <div className="flex items-center"><ArrowRight style={{ color: "#5d7894", width: 22, height: 22 }} /></div>
          {ENGINES.map((e, i) => {
            const Icon = e.icon;
            return [
              <div key={e.n} className="min-h-0 flex flex-col overflow-hidden" style={{ border: `1px solid ${e.color}40`, background: "rgba(6,16,30,0.78)", borderRadius: 14, padding: "clamp(10px,2vh,22px)", boxShadow: `inset 0 1px 0 ${e.color}30` }}>
                <div className="flex items-center justify-between">
                  <span style={{ fontFamily: MONO, fontSize: "clamp(9px,1.1vh,12px)", letterSpacing: "0.2em", color: e.color }}>PHASE {e.n}</span>
                  <Icon style={{ color: e.color, width: "clamp(18px,2.6vh,26px)", height: "clamp(18px,2.6vh,26px)" }} />
                </div>
                <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: "clamp(18px,3vh,30px)", color: "#f2f7ff", marginTop: 6, lineHeight: 1.1 }}>{e.name}</div>
                <div style={{ fontFamily: MONO, fontSize: "clamp(10px,1.4vh,14px)", color: e.color, marginTop: 2, marginBottom: "clamp(6px,1.4vh,14px)" }}>{e.tag}</div>
                <div className="flex flex-col flex-1 justify-around" style={{ gap: "clamp(5px,1.1vh,12px)" }}>
                  {e.rows.map(([k, v]) => (
                    <div key={k} style={{ borderLeft: `2px solid ${e.color}`, paddingLeft: 10 }}>
                      <div style={{ fontFamily: MONO, fontSize: "clamp(8px,1.2vh,12px)", letterSpacing: "0.16em", textTransform: "uppercase", color: "#8aa3bd" }}>{k}</div>
                      <div style={{ fontSize: "clamp(11px,2.1vh,19px)", lineHeight: 1.35, color: "#e4eef8" }}>{v}</div>
                    </div>
                  ))}
                </div>
                {e.note && <div className="mt-auto" style={{ fontSize: "clamp(10px,1.4vh,14px)", fontStyle: "italic", color: e.color, paddingTop: 10 }}>{e.note}</div>}
              </div>,
              i < ENGINES.length - 1 && (
                <div key={`a${i}`} className="flex items-center">
                  <ArrowRight style={{ color: "#5d7894", width: 22, height: 22 }} />
                </div>
              ),
            ];
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between" style={{ borderTop: "1px solid rgba(74,168,255,0.2)", paddingTop: "clamp(6px,1.2vh,12px)", fontFamily: MONO, fontSize: "clamp(8px,1vh,11px)", letterSpacing: "0.14em", color: "#8aa3bd" }}>
          <span>IMAGINE ENGINE // STARTUP FACTORY HUB // DECAHEDRON VENTURES</span>
          <span>startupfactoryhub.com</span>
        </div>
      </div>
    </div>
  );
}
