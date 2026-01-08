import { motion } from "framer-motion";
import { Building, Rocket, DollarSign, Users, ArrowRight } from "lucide-react";

const phases = [
  {
    phase: "Phase 1",
    title: "Foundation Year",
    duration: "12 months",
    startups: "12-50 startups",
    description: "Establish accelerator presence and run initial cohorts",
  },
];

const roles = [
  {
    role: "Strategic Partner",
    responsibilities: [
      "Japan market expertise & connections",
      "Local corporate network access",
      "Regulatory & compliance guidance",
      "Co-investment opportunities",
      "Marketing & brand presence",
    ],
    color: "from-red-500 to-orange-500",
  },
  {
    role: "Startup Factory Hub (Operator)",
    responsibilities: [
      "Full platform access & management",
      "Curriculum & program design",
      "Global mentor network",
      "AI-powered tools & analytics",
      "100+ annual events coordination",
    ],
    color: "from-primary to-teal-400",
  },
];

const fundingBreakdown = [
  { item: "Platform & Technology", amount: "$150,000" },
  { item: "Program Operations", amount: "$100,000" },
  { item: "Events & Marketing", amount: "$50,000" },
  { item: "Team & Support", amount: "$50,000" },
];

const PartnershipStructure = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background to-card/30" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Partnership <span className="text-primary">Structure</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Clear roles and responsibilities for successful collaboration
          </p>
        </motion.div>

        {/* Phase Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto mb-16"
        >
          <div className="relative p-8 rounded-2xl bg-gradient-to-r from-primary/10 to-teal-500/10 border border-primary/30">
            <div className="absolute top-0 left-8 -translate-y-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-sm font-bold">
              Phase 1
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mt-4">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Foundation Year</h3>
                <p className="text-muted-foreground">Establish accelerator presence and run initial cohorts</p>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">12</p>
                  <p className="text-sm text-muted-foreground">Months</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">12-50</p>
                  <p className="text-sm text-muted-foreground">Startups</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Roles Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {roles.map((role, index) => (
            <motion.div
              key={role.role}
              initial={{ opacity: 0, x: index === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="relative group"
            >
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${role.color} rounded-2xl opacity-20 group-hover:opacity-40 blur transition-opacity`} />
              <div className="relative p-8 rounded-2xl bg-card border border-border h-full">
                <div className={`inline-block px-4 py-2 rounded-lg bg-gradient-to-r ${role.color} text-white text-sm font-bold mb-6`}>
                  {role.role}
                </div>
                <ul className="space-y-4">
                  {role.responsibilities.map((resp, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <ArrowRight className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Funding Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <h3 className="text-2xl font-bold text-center mb-8">Program Funding Allocation</h3>
          <div className="space-y-4">
            {fundingBreakdown.map((item, index) => (
              <motion.div
                key={item.item}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 rounded-xl bg-card/50 border border-border"
              >
                <span className="text-foreground">{item.item}</span>
                <span className="text-xl font-bold text-primary font-mono">{item.amount}</span>
              </motion.div>
            ))}
            <div className="flex items-center justify-between p-4 rounded-xl bg-primary/10 border border-primary/30">
              <span className="text-lg font-bold text-foreground">Total Investment</span>
              <span className="text-2xl font-bold text-primary font-mono">$350,000</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PartnershipStructure;
