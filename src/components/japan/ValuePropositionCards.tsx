import { motion } from "framer-motion";
import { Globe, Laptop, Brain, Users, Rocket } from "lucide-react";

const propositions = [
  {
    icon: Globe,
    title: "Global Coworking Access",
    description: "5,600+ sites across 130+ countries with premium workspace solutions",
    highlight: "130+ Countries",
  },
  {
    icon: Laptop,
    title: "Hybrid Model",
    description: "Seamless online platform combined with physical presence in Japan",
    highlight: "Online + Physical",
  },
  {
    icon: Brain,
    title: "AI-Powered Platform",
    description: "Intelligent automation, insights, and founder execution guidance",
    highlight: "Full AI Suite",
  },
  {
    icon: Users,
    title: "Mentor & Investor Network",
    description: "Access to global expert ecosystem and investment opportunities",
    highlight: "Global Network",
  },
  {
    icon: Rocket,
    title: "Deep Tech & Aerospace",
    description: "Specialized domain expertise for cutting-edge technology startups",
    highlight: "Specialized Focus",
  },
];

const ValuePropositionCards = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="text-primary">Value</span> Proposition
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A comprehensive ecosystem designed for deep tech innovation
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {propositions.map((prop, index) => (
            <motion.div
              key={prop.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group relative"
            >
              {/* Glow Effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-teal-400 rounded-2xl opacity-0 group-hover:opacity-30 blur-lg transition-all duration-500" />
              
              <div className="relative h-full p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-border hover:border-primary/50 transition-all duration-300">
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <prop.icon className="w-7 h-7 text-primary" />
                </div>

                {/* Highlight Badge */}
                <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary mb-3">
                  {prop.highlight}
                </span>

                {/* Content */}
                <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
                  {prop.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {prop.description}
                </p>

                {/* Bottom Glow Line */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent group-hover:w-3/4 transition-all duration-500" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValuePropositionCards;
