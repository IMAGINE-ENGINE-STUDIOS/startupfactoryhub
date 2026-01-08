import { motion } from "framer-motion";
import { BookOpen, FileText, Scale, Microscope, Database, Zap } from "lucide-react";

const resources = [
  { icon: FileText, label: "Startup Playbooks", description: "Comprehensive guides for every stage" },
  { icon: Microscope, label: "Market Research", description: "In-depth sector analysis reports" },
  { icon: Scale, label: "Legal Templates", description: "Ready-to-use legal documents" },
  { icon: Database, label: "Technical Tutorials", description: "Deep tech implementation guides" },
];

const ContentKnowledge = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">KNOWLEDGE INFRASTRUCTURE</span>
              </div>
              
              <h2 className="text-3xl md:text-5xl font-bold">
                Content & <span className="text-primary">Knowledge</span> Infrastructure
              </h2>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                Provides on-demand access to curated playbooks, technical resources, legal templates, and sector-specific guidance, ensuring <span className="text-primary font-semibold">consistent quality</span> and reducing dependence on live sessions alone.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-4">
                {resources.map((resource, index) => (
                  <motion.div
                    key={resource.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="group p-4 rounded-xl bg-card/60 border border-border hover:border-primary/50 transition-all"
                  >
                    <resource.icon className="w-6 h-6 text-primary mb-2" />
                    <p className="font-semibold text-foreground text-sm">{resource.label}</p>
                    <p className="text-xs text-muted-foreground">{resource.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right Visual */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative p-8 rounded-3xl bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-primary/20">
                {/* Animated circles */}
                <div className="absolute inset-0 overflow-hidden rounded-3xl">
                  <motion.div
                    className="absolute w-32 h-32 bg-primary/10 rounded-full blur-2xl"
                    animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
                    transition={{ duration: 8, repeat: Infinity }}
                    style={{ top: "20%", left: "10%" }}
                  />
                  <motion.div
                    className="absolute w-24 h-24 bg-teal-400/10 rounded-full blur-2xl"
                    animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
                    transition={{ duration: 6, repeat: Infinity }}
                    style={{ bottom: "20%", right: "10%" }}
                  />
                </div>

                <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center">
                      <Zap className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">On-Demand Access</h3>
                      <p className="text-muted-foreground">24/7 Resource Availability</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {["Curated by industry experts", "Updated quarterly", "Sector-specific content", "Multi-language support"].map((item, i) => (
                      <motion.div
                        key={item}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10"
                      >
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-sm font-medium text-foreground">{item}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContentKnowledge;
