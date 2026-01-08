import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";
import { TrendingUp, Microscope, Building2, Rocket, Satellite, Handshake } from "lucide-react";

const stats = [
  { value: 10, suffix: "T", prefix: "¥", label: "Government Startup Investment", subtext: "2023-2027 Initiative" },
  { value: 3, suffix: "%", prefix: "", label: "GDP R&D Expenditure", subtext: "World's Highest" },
  { value: 4288, suffix: "+", prefix: "", label: "University Startups", subtext: "8 Years Consecutive Growth" },
  { value: 100000, suffix: "", prefix: "", label: "Target Startups by 2027", subtext: "10x Growth Target" },
];

const reasons = [
  {
    icon: Microscope,
    title: "Robust R&D Ecosystem",
    description: "World-leading research infrastructure with 3% GDP investment in R&D",
  },
  {
    icon: Rocket,
    title: "Deep Tech Momentum",
    description: "Strong government push for aerospace, biotech, and advanced manufacturing",
  },
  {
    icon: Building2,
    title: "Corporate Support",
    description: "Major corporations actively seeking startup partnerships and investments",
  },
  {
    icon: Satellite,
    title: "New Space Opportunities",
    description: "Rapidly growing space tech sector with significant government funding",
  },
];

const AnimatedCounter = ({ value, prefix, suffix }: { value: number; prefix: string; suffix: string }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return num.toLocaleString();
    }
    return num.toString();
  };

  return (
    <span className="font-mono">
      {prefix}{formatNumber(displayValue)}{suffix}
    </span>
  );
};

const WhyJapanStats = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-primary/5" />
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
          <span className="text-red-500 text-lg font-semibold mb-2 block">なぜ今、日本なのか</span>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Why <span className="text-red-500">Japan</span> Now?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Unprecedented government support and market opportunity
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500/50 to-primary/50 rounded-2xl opacity-0 group-hover:opacity-100 blur transition-all duration-500" />
              <div className="relative p-6 rounded-2xl bg-card border border-border text-center">
                <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-2">
                  <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">{stat.label}</p>
                <p className="text-xs text-muted-foreground">{stat.subtext}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Reasons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((reason, index) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + index * 0.1 }}
              whileHover={{ y: -5 }}
              className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border hover:border-red-500/30 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4 group-hover:bg-red-500/20 transition-colors">
                <reason.icon className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">{reason.title}</h3>
              <p className="text-sm text-muted-foreground">{reason.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyJapanStats;
