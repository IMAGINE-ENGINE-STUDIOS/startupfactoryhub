import { motion } from "framer-motion";
import { Rocket, Search, Users, Network, Cpu, Building2, BarChart3, Award, Briefcase, CheckCircle2 } from "lucide-react";

const terms = [
  {
    category: "Accelerator",
    included: "End-to-end design, launch, and execution of Japan-based accelerator program",
    value: "Immediate market presence without setup overhead",
    icon: Rocket,
  },
  {
    category: "Startup Sourcing",
    included: "Deal sourcing, screening, due diligence, and curation of Japanese deep-tech startups",
    value: "High-quality, pre-vetted deal flow",
    icon: Search,
  },
  {
    category: "Program Management",
    included: "Dedicated team, founder support, scheduling, milestone tracking, and cohort coordination",
    value: "Zero operational burden for Partner",
    icon: Users,
  },
  {
    category: "Mentorship Network",
    included: "Access to SFH's global mentor network with domain-specific experts",
    value: "World-class guidance for portfolio startups",
    icon: Network,
  },
  {
    category: "AI Platform",
    included: "Full AI-powered accelerator platform with analytics, tracking, and automation",
    value: "Real-time insights and performance tracking",
    icon: Cpu,
  },
  {
    category: "Coworking & Events",
    included: "Professional workspace access for cohorts, pitch sessions, and demo days",
    value: "High-quality physical presence in Japan",
    icon: Building2,
  },
  {
    category: "Reporting & KPIs",
    included: "Monthly progress updates plus comprehensive end-of-cohort reports",
    value: "Full transparency and accountability",
    icon: BarChart3,
  },
  {
    category: "Branding",
    included: "Co-branded accelerator presence across all program materials and events",
    value: "Ecosystem credibility and visibility",
    icon: Award,
  },
  {
    category: "Deal Flow Access",
    included: "Early privileged access to all accelerated startups for investment consideration",
    value: "Strategic first-mover advantage",
    icon: Briefcase,
  },
];

const CommercialTerms = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(20,184,166,0.1),transparent_50%)]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">PHASE 1 TERMS</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Commercial <span className="text-primary">Terms</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Complete breakdown of what's included in the Phase 1 partnership
          </p>
        </motion.div>

        {/* Terms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {terms.map((term, index) => (
            <motion.div
              key={term.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -5 }}
              className="group relative"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/40 to-teal-400/40 rounded-2xl opacity-0 group-hover:opacity-100 blur transition-all duration-500" />
              <div className="relative h-full p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-border group-hover:border-transparent transition-all">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-teal-400/10 flex items-center justify-center group-hover:from-primary/30 group-hover:to-teal-400/20 transition-all">
                    <term.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    {term.category}
                  </h3>
                </div>

                {/* Included */}
                <div className="mb-4">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">Included</span>
                  <p className="text-sm text-foreground mt-1">{term.included}</p>
                </div>

                {/* Partner Value */}
                <div className="pt-4 border-t border-border">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Partner Value</span>
                  <p className="text-sm text-primary font-medium mt-1">{term.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CommercialTerms;
