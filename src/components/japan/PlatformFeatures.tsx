import { motion } from "framer-motion";
import { Map, Settings, Brain, Target, Users, Globe } from "lucide-react";

const features = [
  {
    icon: Map,
    title: "Centralized Resource Map",
    description: "Interactive global resource directory with real-time availability",
  },
  {
    icon: Settings,
    title: "Program Management",
    description: "End-to-end cohort and curriculum management tools",
  },
  {
    icon: Brain,
    title: "AI-Guided Execution",
    description: "Intelligent founder coaching and milestone recommendations",
  },
  {
    icon: Target,
    title: "Milestone & KPI Tracking",
    description: "Real-time progress monitoring with automated reporting",
  },
  {
    icon: Users,
    title: "Intelligent Matchmaking",
    description: "AI-powered mentor, investor, and partner matching",
  },
  {
    icon: Globe,
    title: "Cross-Border Enablement",
    description: "Seamless expansion support across 130+ countries",
  },
];

const PlatformFeatures = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Platform <span className="text-primary">Features</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Comprehensive tools for accelerator success
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              {/* Animated Border */}
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-primary via-teal-400 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-primary via-teal-400 to-primary opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
              
              <div className="relative p-8 rounded-2xl bg-card border border-border h-full">
                {/* Scan Line Effect */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent animate-scan" />
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0 group-hover:from-primary/30 group-hover:to-primary/10 transition-all">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>

                {/* Corner Accents */}
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-primary/30 rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-primary/30 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlatformFeatures;
