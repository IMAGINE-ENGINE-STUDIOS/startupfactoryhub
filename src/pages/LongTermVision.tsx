import { motion } from "framer-motion";
import {
  Globe2, Rocket, Building2, Handshake, TrendingUp, Users,
  MapPin, Network, Target, Sparkles, ArrowUpRight, Landmark,
  Lightbulb, Award
} from "lucide-react";

/* ---------- Design tokens ---------- */
const NEON = {
  cyan: "#22d3ee",
  magenta: "#e879f9",
  lime: "#a3e635",
  amber: "#fbbf24",
  violet: "#8b5cf6",
  rose: "#fb7185",
};

/* ---------- Glass card primitive ---------- */
function Glass({
  children, className = "", glow = NEON.cyan,
}: { children: React.ReactNode; className?: string; glow?: string }) {
  return (
    <div
      className={`relative rounded-2xl border border-white/10 backdrop-blur-xl ${className}`}
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 20px 60px -20px ${glow}33`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-60"
        style={{
          background: `radial-gradient(600px 200px at 20% -10%, ${glow}1f, transparent 60%)`,
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

const ecosystemNodes = [
  { label: "Entrepreneurship", icon: Rocket, glow: NEON.cyan },
  { label: "Investment", icon: TrendingUp, glow: NEON.lime },
  { label: "Corporate Innovation", icon: Building2, glow: NEON.violet },
  { label: "International Trade", icon: Globe2, glow: NEON.amber },
  { label: "Education", icon: Lightbulb, glow: NEON.rose },
  { label: "Global Organizations", icon: Landmark, glow: NEON.magenta },
];

const pillars = [
  {
    title: "Globally Connected Ecosystem",
    body: "More than a shared facility—this is a convergent platform where entrepreneurship, investment, corporate innovation, and international trade intersect and reinforce one another.",
    icon: Network,
    glow: NEON.cyan,
  },
  {
    title: "Attracting Global Stakeholders",
    body: "Founders, investors, corporations, educators, and international organizations unite in Orlando to access capital, talent, markets, and world-class programming.",
    icon: Handshake,
    glow: NEON.lime,
  },
  {
    title: "Model for the Future",
    body: "By pairing Startup Factory Hub's entrepreneurial velocity with the prestige and reach of the World Trade Center network, this collaboration becomes a blueprint for innovation hubs worldwide.",
    icon: Award,
    glow: NEON.violet,
  },
];

const visionMetrics = [
  { label: "Regional Competitiveness", value: "↑", detail: "Strengthened" },
  { label: "Economic Impact", value: "→", detail: "Lasting" },
  { label: "Global Reach", value: "∞", detail: "Worldwide" },
  { label: "Innovation Model", value: "✦", detail: "Replicable" },
];

export default function LongTermVision() {
  return (
    <div
      className="min-h-screen w-full text-white overflow-x-hidden relative"
      style={{
        background:
          "radial-gradient(1200px 800px at 10% -10%, #1e1b4b 0%, transparent 60%)," +
          "radial-gradient(1100px 700px at 90% 5%, #0e7490 0%, transparent 55%)," +
          "radial-gradient(1000px 800px at 50% 110%, #14532d 0%, transparent 60%)," +
          "linear-gradient(180deg, #05060f 0%, #020306 100%)",
      }}
    >
      {/* animated grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
        }}
      />
      {/* floating orbs */}
      {[NEON.cyan, NEON.lime, NEON.violet].map((c, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl pointer-events-none"
          style={{
            background: c,
            width: 420, height: 420, opacity: 0.16,
            left: `${8 + i * 32}%`, top: `${12 + i * 22}%`,
          }}
          animate={{ x: [0, 50, -30, 0], y: [0, -40, 30, 0] }}
          transition={{ duration: 20 + i * 5, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] tracking-[0.25em] uppercase border border-white/15 backdrop-blur-xl mb-6"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: NEON.cyan }} />
            Strategic Horizon
          </div>
          <h1
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
            style={{
              backgroundImage: `linear-gradient(135deg, #fff 0%, ${NEON.cyan} 45%, ${NEON.lime} 100%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}
          >
            Long-Term Vision
          </h1>
          <p className="text-white/60 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            Building a globally connected innovation ecosystem that positions Orlando
            among the leading centers for entrepreneurship and international business in the southeastern United States.
          </p>
        </motion.div>

        {/* Ecosystem convergence wheel */}
        <div className="mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="text-[11px] tracking-[0.3em] uppercase text-white/50 mb-3">Convergence Model</div>
            <h2 className="text-3xl md:text-4xl font-bold">Where the Future Converges</h2>
          </motion.div>

          <div className="relative flex items-center justify-center min-h-[420px] md:min-h-[520px]">
            {/* center hub */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="absolute z-10 w-36 h-36 md:w-48 md:h-48 rounded-full flex flex-col items-center justify-center border border-white/15 backdrop-blur-2xl"
              style={{
                background: "radial-gradient(circle at 30% 30%, rgba(34,211,238,0.25), rgba(255,255,255,0.04) 60%)",
                boxShadow: `0 0 80px -20px ${NEON.cyan}66`,
              }}
            >
              <Globe2 className="w-8 h-8 md:w-10 md:h-10 mb-2" style={{ color: NEON.cyan }} />
              <div className="text-xs md:text-sm font-semibold tracking-widest uppercase text-center">Global<br />Innovation<br />Ecosystem</div>
            </motion.div>

            {/* orbit ring */}
            <div
              className="absolute rounded-full border border-white/10 w-[320px] h-[320px] md:w-[440px] md:h-[440px]"
            />
            <div
              className="absolute rounded-full border border-dashed border-white/10 w-[380px] h-[380px] md:w-[500px] md:h-[500px]"
            />

            {/* orbiting nodes */}
            {ecosystemNodes.map((node, idx) => {
              const angle = (idx * 360) / ecosystemNodes.length - 90;
              const radius = 160;
              const mdRadius = 220;
              const radians = (angle * Math.PI) / 180;
              const x = `${50 + (radius / 320) * 50 * Math.cos(radians)}%`;
              const y = `${50 + (radius / 320) * 50 * Math.sin(radians)}%`;
              const mdX = `${50 + (mdRadius / 440) * 50 * Math.cos(radians)}%`;
              const mdY = `${50 + (mdRadius / 440) * 50 * Math.sin(radians)}%`;
              return (
                <motion.div
                  key={node.label}
                  initial={{ opacity: 0, scale: 0.6 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 + idx * 0.1 }}
                  className="absolute flex flex-col items-center gap-2"
                  style={{
                    left: x, top: y,
                    transform: "translate(-50%, -50%)",
                    ["--md-x" as string]: mdX,
                    ["--md-y" as string]: mdY,
                  }}
                >
                  <Glass
                    glow={node.glow}
                    className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center"
                  >
                    <node.icon className="w-7 h-7 md:w-8 md:h-8" style={{ color: node.glow }} />
                  </Glass>
                  <span className="text-[10px] md:text-xs font-medium tracking-wide text-white/80 text-center w-24 md:w-28">
                    {node.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-24">
          {pillars.map((p, idx) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6, delay: idx * 0.1 }}
            >
              <Glass glow={p.glow} className="p-8 h-full flex flex-col">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 border border-white/10"
                  style={{ background: `${p.glow}1a` }}
                >
                  <p.icon className="w-6 h-6" style={{ color: p.glow }} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{p.title}</h3>
                <p className="text-white/60 leading-relaxed text-sm flex-1">{p.body}</p>
              </Glass>
            </motion.div>
          ))}
        </div>

        {/* Orlando positioning strip */}
        <div className="mb-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7 }}
            className="rounded-3xl border border-white/10 p-8 md:p-12 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(34,211,238,0.08) 0%, rgba(163,230,53,0.05) 50%, rgba(139,92,246,0.08) 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            <div
              className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20"
              style={{ background: NEON.cyan, transform: "translate(30%, -30%)" }}
            />
            <div className="relative flex flex-col md:flex-row items-start md:items-center gap-8">
              <div
                className="flex items-center justify-center w-20 h-20 rounded-2xl border border-white/10 shrink-0"
                style={{ background: `${NEON.cyan}15` }}
              >
                <MapPin className="w-9 h-9" style={{ color: NEON.cyan }} />
              </div>
              <div className="flex-1">
                <div className="text-[11px] tracking-[0.25em] uppercase text-white/50 mb-2">Regional Positioning</div>
                <h2 className="text-2xl md:text-3xl font-bold mb-3">Orlando: A Leading Innovation & Global Business Hub</h2>
                <p className="text-white/60 leading-relaxed max-w-3xl">
                  By aligning world-class entrepreneurial programming with the prestige and international reach of the World Trade Center network,
                  Orlando becomes a magnet for founders, capital, and global commerce across the southeastern United States.
                </p>
              </div>
              <ArrowUpRight className="w-8 h-8 text-white/40" />
            </div>
          </motion.div>
        </div>

        {/* Vision metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {visionMetrics.map((m, idx) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6, delay: idx * 0.08 }}
            >
              <Glass glow={NEON.cyan} className="p-6 text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2" style={{ color: NEON.cyan }}>
                  {m.value}
                </div>
                <div className="text-sm font-medium text-white/80 mb-1">{m.label}</div>
                <div className="text-xs text-white/50 uppercase tracking-widest">{m.detail}</div>
              </Glass>
            </motion.div>
          ))}
        </div>

        {/* Closing statement */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="text-center"
        >
          <Glass glow={NEON.lime} className="inline-block px-8 py-6 md:px-12 md:py-8 max-w-4xl">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Target className="w-5 h-5" style={{ color: NEON.lime }} />
              <span className="text-[11px] tracking-[0.25em] uppercase text-white/50">The Outcome</span>
            </div>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed italic">
              “A collaboration that creates lasting economic impact, strengthens regional competitiveness,
              and serves as a model for future World Trade Center innovation hubs worldwide.”
            </p>
          </Glass>
        </motion.div>

        {/* Footer credit */}
        <motion.div
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="mt-20 text-center"
        >
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-xl">
            <Rocket className="w-4 h-4" style={{ color: NEON.cyan }} />
            <span className="text-sm text-white/70">Startup Factory Hub</span>
            <span className="text-white/30">×</span>
            <Globe2 className="w-4 h-4" style={{ color: NEON.lime }} />
            <span className="text-sm text-white/70">World Trade Center Club Orlando</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
