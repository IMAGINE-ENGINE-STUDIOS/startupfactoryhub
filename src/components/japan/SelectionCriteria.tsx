import { motion } from "framer-motion";
import { Users, Cpu, Shield, Beaker, Target, MapPin, TrendingUp, DollarSign, Route, Coins, CheckCircle, Info } from "lucide-react";

const criteria = [
  {
    category: "Team",
    area: "Founding Strength",
    question: "Technical depth and execution ability?",
    signals: "Founder background, prior ventures, team composition",
    icon: Users,
  },
  {
    category: "Technology",
    area: "Core Tech Advantage",
    question: "Meaningfully differentiated?",
    signals: "Architecture, benchmarks, technical innovation",
    icon: Cpu,
  },
  {
    category: "IP & Moat",
    area: "Defensibility",
    question: "Is innovation defensible?",
    signals: "Patents, trade secrets, barriers to entry",
    icon: Shield,
  },
  {
    category: "Validation",
    area: "Technical Proof",
    question: "Demonstrated beyond theory?",
    signals: "Prototypes, pilots, lab results, MVPs",
    icon: Beaker,
  },
  {
    category: "Market",
    area: "Problem–Solution Fit",
    question: "Real, urgent market need?",
    signals: "Customer interviews, LOIs, market validation",
    icon: Target,
  },
  {
    category: "Strategic Fit",
    area: "Japan Alignment",
    question: "Aligns with priority sectors?",
    signals: "AI, aerospace, robotics, quantum, biotech",
    icon: MapPin,
  },
  {
    category: "Scalability",
    area: "Growth Roadmap",
    question: "Can scale technically and commercially?",
    signals: "Manufacturing plans, scaling strategy",
    icon: TrendingUp,
  },
  {
    category: "Commercial",
    area: "Revenue Potential",
    question: "Credible path to revenue?",
    signals: "Pricing model, sales pipeline, unit economics",
    icon: DollarSign,
  },
  {
    category: "Execution",
    area: "Go-to-Market Strategy",
    question: "Understands GTM, partnerships, regulatory?",
    signals: "Strategy documentation, market entry plan",
    icon: Route,
  },
  {
    category: "Capital",
    area: "Capital Efficiency",
    question: "Deployed toward clear milestones?",
    signals: "Budget, runway planning, capital allocation",
    icon: Coins,
  },
];

const SelectionCriteria = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-card/30 via-background to-card/30" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <CheckCircle className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">EVALUATION FRAMEWORK</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Selection <span className="text-primary">Criteria</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Comprehensive 10-point evaluation framework for startup selection
          </p>
        </motion.div>

        {/* Criteria Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
          {criteria.map((item, index) => (
            <motion.div
              key={item.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              className="group relative"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-teal-400/50 rounded-xl opacity-0 group-hover:opacity-100 blur transition-all duration-300" />
              <div className="relative p-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border group-hover:border-transparent transition-all h-full">
                {/* Number badge */}
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                  {index + 1}
                </div>

                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">{item.category}</span>
                  <h4 className="font-bold text-foreground text-sm">{item.area}</h4>
                  <p className="text-xs text-muted-foreground italic">{item.question}</p>
                  <p className="text-xs text-muted-foreground/80">{item.signals}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Scoring System */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative p-6 rounded-2xl bg-card/60 backdrop-blur-sm border border-primary/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Info className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-foreground mb-2">Scoring System</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" />
                    <span className="text-muted-foreground">Each category: 10 points max</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-primary font-bold">50+</span>
                    <span className="text-muted-foreground">points (50%) minimum for program entry</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-green-500 font-bold">70-100%</span>
                    <span className="text-muted-foreground">considered for follow-up investment</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-foreground font-bold">100</span>
                    <span className="text-muted-foreground">total possible points</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SelectionCriteria;
