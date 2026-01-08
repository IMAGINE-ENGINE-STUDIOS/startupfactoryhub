import { motion } from "framer-motion";
import { Shield, TrendingUp, Eye, Scale, Database, CheckCircle2 } from "lucide-react";

const benefits = [
  {
    icon: Shield,
    title: "Reduces Execution Risk",
    description: "Replaces fragmented tools with a single operating system for accelerator management",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: TrendingUp,
    title: "Improves Startup Outcomes",
    description: "Structured guidance and continuous feedback loops drive better performance",
    color: "from-primary to-teal-400",
  },
  {
    icon: Eye,
    title: "Creates Transparency",
    description: "Real-time reporting, KPI dashboards, and post-program analytics for complete visibility",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Scale,
    title: "Scales Efficiently",
    description: "Expand across cities, sectors, and cohorts without increasing headcount",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: Database,
    title: "Generates Data Assets",
    description: "Long-term data enables better investment decisions and ecosystem intelligence",
    color: "from-green-500 to-emerald-500",
  },
];

const WhyMattersPartners = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card/50 to-background" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
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
            <span className="text-sm font-medium text-primary">PARTNER VALUE</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Why This Matters for <span className="text-primary">Partners</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Strategic advantages that make SFH the ideal partner for Japan expansion
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className={`group relative ${index === 4 ? 'md:col-span-2 lg:col-span-1 lg:col-start-2' : ''}`}
            >
              {/* Animated border */}
              <div className="absolute -inset-0.5 bg-gradient-to-r opacity-0 group-hover:opacity-100 rounded-2xl blur transition-all duration-500" 
                style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }} />
              
              <div className="relative h-full p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-border group-hover:border-transparent transition-all">
                {/* Icon with gradient background */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${benefit.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <benefit.icon className="w-7 h-7 text-white" />
                </div>

                <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>

                {/* Hover indicator */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 rounded-full bg-gradient-to-r from-primary to-teal-400 group-hover:w-1/2 transition-all duration-500" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyMattersPartners;
