import { motion } from "framer-motion";
import {
  Rocket, Users, Building2, Mic2, CalendarDays, GraduationCap,
  Lightbulb, Network, DollarSign, Sparkles, Target, CheckCircle2,
  ArrowRight
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

const responsibilities = [
  {
    title: "Startup Accelerator / Incubator",
    description: "Structured programs that guide early-stage ventures from idea to market-ready product, providing cohort-based growth and hands-on support.",
    icon: Rocket,
    glow: NEON.cyan,
    tags: ["Cohorts", "MVP", "Product-Market Fit"],
  },
  {
    title: "Founder Community",
    description: "A vibrant peer network where founders share resources, solve problems together, and build the relationships that fuel long-term success.",
    icon: Users,
    glow: NEON.magenta,
    tags: ["Peer Support", "Networking", "Culture"],
  },
  {
    title: "Corporate Innovation Programs",
    description: "Curated engagements that connect enterprises with startups to pilot emerging technologies, accelerate R&D, and unlock new revenue streams.",
    icon: Building2,
    glow: NEON.violet,
    tags: ["Pilots", "R&D", "Partnerships"],
  },
  {
    title: "Pitch Events",
    description: "High-energy forums where founders present their ventures to investors, partners, and industry experts for feedback and funding opportunities.",
    icon: Mic2,
    glow: NEON.amber,
    tags: ["Investor Access", "Feedback", "Exposure"],
  },
  {
    title: "Demo Days",
    description: "Culmination showcases where accelerator cohorts demonstrate traction, product progress, and market potential to a curated audience of investors.",
    icon: CalendarDays,
    glow: NEON.rose,
    tags: ["Showcase", "Traction", "Fundraising"],
  },
  {
    title: "Venture Education",
    description: "Workshops, masterclasses, and practical curricula covering fundraising, go-to-market strategy, financial modeling, and leadership development.",
    icon: GraduationCap,
    glow: NEON.lime,
    tags: ["Curriculum", "Mentorship", "Skill Building"],
  },
  {
    title: "Innovation Programming",
    description: "Continuously designed experiences—from sprints to hackathons—that surface bold ideas and move them quickly toward validation.",
    icon: Lightbulb,
    glow: NEON.cyan,
    tags: ["Sprints", "Hackathons", "Validation"],
  },
  {
    title: "Mentor Network",
    description: "A global bench of seasoned operators, sector experts, and serial founders who provide strategic guidance and tactical advice to portfolio companies.",
    icon: Network,
    glow: NEON.violet,
    tags: ["Operators", "Experts", "Advisors"],
  },
  {
    title: "Investor Ecosystem",
    description: "A curated community of angels, venture funds, family offices, and corporate strategists actively seeking high-potential opportunities.",
    icon: DollarSign,
    glow: NEON.lime,
    tags: ["Angels", "VCs", "Corporates"],
  },
];

const highlights = [
  { label: "Founder Velocity", detail: "Rapid idea-to-market execution" },
  { label: "Capital Access", detail: "Direct investor relationships" },
  { label: "Enterprise Demand", detail: "Corporate pilot opportunities" },
  { label: "Network Effects", detail: "Mentors, peers & global reach" },
];

export default function StartupFactoryResponsibilities() {
  return (
    <div
      className="min-h-screen w-full text-white overflow-x-hidden relative"
      style={{
        background:
          "radial-gradient(1200px 800px at 10% -10%, #1e1b4b 0%, transparent 60%)," +
          "radial-gradient(1100px 700px at 90% 5%, #0e7490 0%, transparent 55%)," +
          "radial-gradient(1000px 800px at 50% 110%, #3730a3 0%, transparent 60%)," +
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
      {[NEON.cyan, NEON.violet, NEON.lime].map((c, i) => (
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
          className="text-center mb-16"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] tracking-[0.25em] uppercase border border-white/15 backdrop-blur-xl mb-6"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: NEON.cyan }} />
            Partnership Responsibilities
          </div>
          <h1
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
            style={{
              backgroundImage: `linear-gradient(135deg, #fff 0%, ${NEON.cyan} 45%, ${NEON.violet} 100%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}
          >
            Startup Factory Hub
          </h1>
          <p className="text-white/60 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            Driving venture creation and founder success through acceleration, community, corporate innovation,
            investor access, and continuous education.
          </p>
        </motion.div>

        {/* Highlights strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {highlights.map((h, idx) => (
            <motion.div
              key={h.label}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6, delay: idx * 0.08 }}
            >
              <Glass glow={NEON.cyan} className="p-6 h-full">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle2 className="w-5 h-5" style={{ color: NEON.cyan }} />
                  <div className="text-sm font-semibold">{h.label}</div>
                </div>
                <div className="text-xs text-white/50 uppercase tracking-widest">{h.detail}</div>
              </Glass>
            </motion.div>
          ))}
        </div>

        {/* Responsibilities grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
          {responsibilities.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6, delay: idx * 0.06 }}
            >
              <Glass glow={item.glow} className="p-8 h-full flex flex-col">
                <div className="flex items-start justify-between mb-5">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/10"
                    style={{ background: `${item.glow}1a` }}
                  >
                    <item.icon className="w-7 h-7" style={{ color: item.glow }} />
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/30" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed flex-1 mb-5">
                  {item.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-[11px] font-medium tracking-wide border border-white/10"
                      style={{ background: `${item.glow}15`, color: item.glow }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Glass>
            </motion.div>
          ))}
        </div>

        {/* Closing CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="text-center"
        >
          <Glass glow={NEON.lime} className="inline-block px-8 py-6 md:px-12 md:py-8 max-w-4xl">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Target className="w-5 h-5" style={{ color: NEON.lime }} />
              <span className="text-[11px] tracking-[0.25em] uppercase text-white/50">Core Mission</span>
            </div>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              To transform entrepreneurial potential into high-growth companies by surrounding founders
              with capital, customers, mentors, and the operational support they need to scale.
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
            <span className="text-white/30">Responsibilities</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
