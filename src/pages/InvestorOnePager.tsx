/**
 * Investor One-Pager (/onepager) — Startup Factory Hub branding, leadership team,
 * print-ready A4 layout ("Download PDF" uses the browser's Save as PDF).
 * Credits: Imagine Engine Studios Corp.
 */
import { Download, ArrowUpRight, Linkedin } from "lucide-react";
import { usePageSeo } from "@/hooks/usePageSeo";
import { TEAM } from "@/pages/apex/TeamRoadmapPages";
import sfhLogo from "@/assets/sfh-main-logo.png.asset.json";

const G = "#39ff88";
const CY = "#22d3ee";
const MONO = "'JetBrains Mono', ui-monospace, monospace";
const SERIF = "'Playfair Display', Georgia, serif";

const STATS = [
  ["270", "users across the founder ecosystem"],
  ["50+", "corporate partners"],
  ["6", "revenue-generating startups in the equity-based program"],
  ["NASDAQ Tower, NY", "company-reported feature"],
];
const JOURNEY = ["Idea", "Research", "MVP", "Validation", "Launch", "Growth"];
const MODEL = [
  ["[01] INTELLIGENCE", "AI-enabled tools", "Support faster research, planning, validation and execution across the company-building lifecycle."],
  ["[02] OPERATIONS", "Accelerator + venture studio", "Pair a repeatable founder journey with hands-on guidance, strategic partners and execution support."],
  ["[03] PORTFOLIO", "Equity-driven upside", "Build a portfolio of operating startups while growing the platform and its ecosystem."],
];
const USE = ["Expand the AI-enabled venture-building platform", "Scale founder acquisition and accelerator cohorts", "Grow corporate and ecosystem partnerships", "Strengthen the portfolio support and operating team"];
const WHY = ["Platform growth can strengthen the founder pipeline", "Partner network can improve access, expertise and distribution", "Equity participation can create portfolio-level upside", "Operating data can improve the founder journey over time"];

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.22em", color: G, textTransform: "uppercase", marginBottom: 5 }}>{children}</div>
);
const box = { border: "1px solid rgba(57,255,136,0.22)", background: "rgba(8,20,14,0.75)", borderRadius: 10 } as const;

export default function InvestorOnePager() {
  usePageSeo({
    title: "Investor One-Pager — Startup Factory Hub",
    description: "Startup Factory Hub seed investor one-pager: AI venture building, accelerator and equity portfolio.",
    path: "/onepager",
  });

  return (
    <div className="op-root min-h-screen py-8 px-3" style={{ background: "#020805" }}>
      <style>{`
        @page { size: A4; margin: 0; }
        @media print {
          html, body, #root { background: #020805 !important; }
          .op-root { padding: 0 !important; min-height: 0 !important; }
          .op-toolbar { display: none !important; }
          .op-sheet { box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <div className="op-toolbar mx-auto mb-4 flex justify-end gap-2" style={{ maxWidth: 794 }}>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold"
          style={{ background: G, color: "#02130a", fontFamily: MONO }}
        >
          <Download className="h-4 w-4" /> Download PDF
        </button>
      </div>

      <main
        className="op-sheet relative mx-auto overflow-hidden"
        style={{ width: 794, minHeight: 1123, height: 1123, background: "radial-gradient(ellipse at 90% 0%, rgba(57,255,136,0.14), transparent 50%), radial-gradient(ellipse at 0% 100%, rgba(34,211,238,0.10), transparent 45%), #020805", color: "#d6e7dc", boxShadow: "0 30px 80px -30px rgba(57,255,136,0.35)", borderRadius: 6, fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.1, backgroundImage: "linear-gradient(rgba(57,255,136,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(57,255,136,0.5) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative h-full flex flex-col px-9 pt-7 pb-5 gap-3.5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={sfhLogo.url} alt="Startup Factory Hub" style={{ height: 34, width: "auto" }} />
              <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em", color: "#e8fff0" }}>STARTUP FACTORY HUB</span>
            </div>
            <div className="flex items-center gap-2" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", color: G }}>
              <span style={{ width: 7, height: 7, borderRadius: 9, background: G, boxShadow: `0 0 8px ${G}` }} /> SEED ROUND / ACTIVE
            </div>
          </div>
          <div className="h-px" style={{ background: `linear-gradient(90deg, ${G}, ${CY}, transparent)` }} />

          {/* Hero */}
          <div>
            <Eyebrow>AI venture building · Accelerator · Equity portfolio</Eyebrow>
            <h1 style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 36, lineHeight: 1.05, color: "#f4fff8" }}>
              Turn ideas into <span style={{ color: G, textShadow: `0 0 18px rgba(57,255,136,0.45)` }}>investable companies.</span>
            </h1>
            <p style={{ fontSize: 12, lineHeight: 1.5, marginTop: 6, maxWidth: 640, color: "#b5cbbd" }}>
              An AI-enabled founder platform, structured accelerator and hands-on venture builder — one connected system engineered to move startups from idea to launch.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2.5">
            {STATS.map(([n, l], i) => (
              <div key={n} className="px-3 py-2.5" style={{ ...box, borderColor: i === 3 ? "rgba(34,211,238,0.4)" : box.border.split(" ").slice(2).join(" ") }}>
                <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: i === 3 ? 15 : 24, color: i === 3 ? CY : G, lineHeight: 1.1 }}>{n}</div>
                <div style={{ fontSize: 9.5, color: "#9fb8a8", marginTop: 3, lineHeight: 1.3 }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Body */}
          <div className="grid gap-4" style={{ gridTemplateColumns: "1.55fr 1fr" }}>
            <div className="flex flex-col gap-3">
              <div>
                <Eyebrow>The opportunity</Eyebrow>
                <h2 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 16, color: "#f4fff8" }}>Infrastructure for the next generation of founders</h2>
                <p style={{ fontSize: 10.5, lineHeight: 1.5, marginTop: 4, color: "#b5cbbd" }}>
                  Early-stage founders face fragmented tools, limited expert access and long feedback loops. Startup Factory Hub brings the operating journey into one connected platform — combining guided execution, human support and AI tools designed for venture creation.
                </p>
                <div className="grid grid-cols-6 gap-1.5 mt-2">
                  {JOURNEY.map((s, i) => (
                    <div key={s} className="text-center py-1.5" style={{ ...box, borderRadius: 6 }}>
                      <div style={{ fontFamily: MONO, fontSize: 8.5, color: G }}>0{i + 1}</div>
                      <div style={{ fontSize: 9.5, color: "#e8fff0" }}>{s}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Eyebrow>The platform model</Eyebrow>
                <div className="grid grid-cols-3 gap-2">
                  {MODEL.map(([c, t, d]) => (
                    <div key={t} className="p-2.5" style={box}>
                      <div style={{ fontFamily: MONO, fontSize: 8, color: CY, letterSpacing: "0.12em" }}>{c}</div>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: "#f4fff8", marginTop: 3 }}>{t}</div>
                      <p style={{ fontSize: 9.5, lineHeight: 1.4, color: "#9fb8a8", marginTop: 3 }}>{d}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Eyebrow>Momentum</Eyebrow>
                <p style={{ fontSize: 10.5, lineHeight: 1.5, color: "#b5cbbd" }}>
                  The company reports 270 users, including NASA KSC, UKSA and APEX Accelerator at UCF, alongside more than 50 corporate partners. Six startups in the equity-based program are reported to be generating revenue.
                </p>
              </div>
            </div>

            <aside className="flex flex-col gap-3">
              <div className="p-3" style={{ ...box, borderColor: "rgba(57,255,136,0.45)", background: "linear-gradient(160deg, rgba(57,255,136,0.12), rgba(8,20,14,0.8))" }}>
                <Eyebrow>The raise</Eyebrow>
                <h2 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 16, color: "#f4fff8" }}>Seeking seed capital</h2>
                <p style={{ fontSize: 10, lineHeight: 1.45, marginTop: 3, color: "#b5cbbd" }}>For angels and venture investors focused on venture-building platforms, accelerators, incubators and AI tools.</p>
                <a href="https://startupfactoryhub.com/deck" target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center justify-between rounded-md px-3 py-1.5" style={{ background: G, color: "#02130a", fontSize: 10.5, fontWeight: 700, fontFamily: MONO }}>
                  View investor deck <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
              {[["Use of seed capital", USE], ["Why this can compound", WHY]].map(([t, items]) => (
                <div key={t as string}>
                  <Eyebrow>{t as string}</Eyebrow>
                  <ul className="flex flex-col gap-1">
                    {(items as string[]).map((x) => (
                      <li key={x} className="flex gap-2" style={{ fontSize: 10, lineHeight: 1.35, color: "#c8dccf" }}>
                        <span style={{ color: G, fontFamily: MONO }}>›</span>{x}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </aside>
          </div>

          {/* Team */}
          <div className="flex-1 min-h-0 flex flex-col">
            <Eyebrow>Leadership team</Eyebrow>
            <div className="grid grid-cols-5 gap-2 flex-1 min-h-0">
              {TEAM.map((m) => (
                <div key={m.n} className="flex flex-col overflow-hidden" style={box}>
                  <img src={m.img} alt={m.n} className="w-full object-cover object-top" style={{ height: 92 }} />
                  <div className="p-2 flex flex-col flex-1 min-h-0">
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: "#f4fff8", lineHeight: 1.15 }}>{m.n}</div>
                    <div style={{ fontFamily: MONO, fontSize: 7.5, letterSpacing: "0.1em", color: G, textTransform: "uppercase", marginTop: 2 }}>{m.r}</div>
                    <p style={{ fontSize: 9, lineHeight: 1.4, color: "#9fb8a8", marginTop: 3, display: "-webkit-box", WebkitLineClamp: 11, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{m.bio}</p>
                    <a href={m.li} target="_blank" rel="noopener noreferrer" className="mt-auto pt-1 inline-flex items-center gap-1" style={{ fontSize: 8, color: CY, fontFamily: MONO }}>
                      <Linkedin className="h-3 w-3" /> LinkedIn
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontSize: 8, lineHeight: 1.4, color: "#6f8a79" }}>
            Round size, valuation and investment terms are not stated in this one-pager and should be confirmed directly with Startup Factory Hub. Traction and affiliation statements are company-reported and should be substantiated in investor diligence.
          </p>
          <div className="flex justify-between pt-2" style={{ borderTop: "1px solid rgba(57,255,136,0.2)", fontFamily: MONO, fontSize: 9, color: "#8fa99a" }}>
            <span><b style={{ color: "#e8fff0" }}>Startup Factory Hub</b> / Validate your idea. Launch your startup.</span>
            <span>startupfactoryhub.com · Investor one-pager / October 2026</span>
          </div>
        </div>
      </main>
    </div>
  );
}
