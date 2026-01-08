import { motion } from "framer-motion";
import { Globe, Laptop, Brain, Users, Rocket, Zap } from "lucide-react";

const propositions = [
  {
    icon: Globe,
    title: "Global Coworking Access",
    highlight: "5,600+ Sites • 130+ Countries",
    description: "SFH offers cohort startups access to flexible coworking spaces worldwide. This provides founders with workspaces in thousands of locations globally – a valuable advantage for international collaboration and market entry.",
  },
  {
    icon: Laptop,
    title: "Hybrid Model",
    highlight: "Online + Physical Presence",
    description: "Startup Factory Hub offers a comprehensive online platform (for training, mentorship, and networking) complemented by physical hubs. This hybrid approach ensures startups receive both digital convenience and real-world support.",
  },
  {
    icon: Brain,
    title: "AI-Powered Platform",
    highlight: "Intelligent Automation",
    description: "At the core is SFH's AI-driven accelerator platform, which integrates intelligent automation and advanced AI assistants. Founders get market research, competitive analysis, pitch development, financial modeling, and milestone planning—all AI-powered.",
  },
  {
    icon: Users,
    title: "Mentor & Investor Network",
    highlight: "Global Expert Ecosystem",
    description: "SFH has a curated ecosystem of mentors, corporate partners, and investors across multiple continents. Startups gain structured access to domain experts, industry veterans, and potential funders aligned with their technology focus.",
  },
  {
    icon: Rocket,
    title: "Deep Tech & Aerospace Focus",
    highlight: "Specialized Expertise",
    description: "Uniquely, SFH specializes in deep science and hard-tech ventures – including aerospace, AI, robotics, advanced materials, quantum, and telecommunications. This specialization ensures startups get relevant guidance and connections.",
  },
];

const ValuePropositionCards = () => {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
      
      {/* Animated grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.03)_1px,transparent_1px)] bg-[size:80px_80px]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">VALUE PROPOSITION</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-4">
            Why <span className="text-primary">Startup Factory Hub</span>?
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            A comprehensive ecosystem designed for deep tech innovation with global infrastructure and specialized expertise
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {propositions.map((prop, index) => (
            <motion.div
              key={prop.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className={`group relative ${index === 4 ? 'md:col-span-2 lg:col-span-1 lg:col-start-2' : ''}`}
            >
              {/* Animated border glow */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-teal-400 to-primary rounded-2xl opacity-0 group-hover:opacity-50 blur-lg transition-all duration-500" />
              
              {/* Card */}
              <div className="relative h-full p-8 rounded-2xl bg-card/80 backdrop-blur-xl border border-border group-hover:border-primary/50 transition-all duration-300">
                {/* Scan line effect */}
                <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                  <motion.div
                    className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
                    animate={{ top: ["0%", "100%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                </div>

                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-teal-400/10 flex items-center justify-center mb-6 group-hover:from-primary/30 group-hover:to-teal-400/20 transition-all border border-primary/20">
                  <prop.icon className="w-8 h-8 text-primary" />
                </div>

                {/* Highlight Badge */}
                <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
                  <span className="text-sm font-bold text-primary">{prop.highlight}</span>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-4 text-foreground group-hover:text-primary transition-colors">
                  {prop.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {prop.description}
                </p>

                {/* Corner brackets */}
                <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-primary/0 group-hover:border-primary/30 rounded-tl-lg transition-all" />
                <div className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 border-primary/0 group-hover:border-primary/30 rounded-tr-lg transition-all" />
                <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 border-primary/0 group-hover:border-primary/30 rounded-bl-lg transition-all" />
                <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-primary/0 group-hover:border-primary/30 rounded-br-lg transition-all" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValuePropositionCards;
