import { motion } from "framer-motion";
import { Zap, Building2, Handshake, Plane, GraduationCap, Map, PartyPopper, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const addOns = [
  {
    icon: Zap,
    title: "Hackathons & Innovation Challenges",
    description: "Organize themed hackathons to source innovative solutions and engage the developer community.",
  },
  {
    icon: Building2,
    title: "Venture Studio Program",
    description: "Build startups from scratch with ideation, validation, and initial funding support.",
  },
  {
    icon: Handshake,
    title: "Corporate Pilot & PoC Programs",
    description: "Facilitate proof-of-concept projects between startups and enterprise partners.",
  },
  {
    icon: Plane,
    title: "Startup Soft-Landing",
    description: "Support international startups entering the Japan market with localization services.",
  },
  {
    icon: GraduationCap,
    title: "Executive Education",
    description: "Premium programs for corporate executives on innovation and venture building.",
  },
  {
    icon: Map,
    title: "Custom Ecosystem Mapping",
    description: "Detailed analysis and visualization of specific industry verticals in Japan.",
  },
  {
    icon: PartyPopper,
    title: "Branded Innovation Events",
    description: "Custom-designed events featuring your brand as the innovation leader.",
  },
];

const OptionalAddOns = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-card/30 to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Optional <span className="text-primary">Add-Ons</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Extend your partnership with additional programs
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-4">
          {addOns.map((addOn, index) => (
            <motion.div
              key={addOn.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <button
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                className="w-full group"
              >
                <div className={cn(
                  "p-6 rounded-2xl bg-card border border-border transition-all",
                  expandedIndex === index && "border-primary/50 bg-card/80"
                )}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <addOn.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground text-left flex-1 group-hover:text-primary transition-colors">
                      {addOn.title}
                    </h3>
                    <ChevronRight className={cn(
                      "w-5 h-5 text-muted-foreground transition-transform",
                      expandedIndex === index && "rotate-90"
                    )} />
                  </div>
                  
                  {expandedIndex === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pl-16"
                    >
                      <p className="text-muted-foreground text-left">
                        {addOn.description}
                      </p>
                    </motion.div>
                  )}
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OptionalAddOns;
