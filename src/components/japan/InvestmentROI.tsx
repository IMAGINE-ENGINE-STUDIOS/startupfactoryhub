import { motion } from "framer-motion";
import { DollarSign, Calendar, Users, TrendingUp, CheckCircle } from "lucide-react";

const highlights = [
  { icon: DollarSign, label: "Total Investment", value: "$350,000", subtext: "USD" },
  { icon: Calendar, label: "Contract Term", value: "12", subtext: "Months" },
  { icon: Users, label: "Target Startups", value: "12-50", subtext: "Per Year" },
  { icon: TrendingUp, label: "Cost per Startup", value: "$3-6K", subtext: "Per Company" },
];

const outcomes = [
  "6-10 investment-ready startups",
  "1-10 startups securing external funding",
  "Direct deal flow access for co-investment",
  "Brand presence in Japan's innovation ecosystem",
  "Comprehensive market intelligence reports",
  "100+ events including Demo Days",
];

const InvestmentROI = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-red-500/5" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Investment & <span className="text-primary">ROI</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Clear investment terms with measurable outcomes
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          {/* Main Investment Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative mb-12"
          >
            {/* Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-teal-400 to-primary rounded-3xl opacity-30 blur-xl" />
            
            <div className="relative p-8 md:p-12 rounded-3xl bg-card border border-primary/30">
              {/* Top Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full bg-gradient-to-r from-primary to-teal-400 text-white font-bold">
                Partnership Investment
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-4">
                {highlights.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="text-center"
                  >
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                      <item.icon className="w-7 h-7 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{item.label}</p>
                    <p className="text-3xl md:text-4xl font-bold text-foreground font-mono">{item.value}</p>
                    <p className="text-xs text-muted-foreground">{item.subtext}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Expected Outcomes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-2xl bg-card/50 border border-border"
          >
            <h3 className="text-2xl font-bold text-center mb-8">Expected Outcomes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {outcomes.map((outcome, index) => (
                <motion.div
                  key={outcome}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border"
                >
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                  <span className="text-foreground">{outcome}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default InvestmentROI;
