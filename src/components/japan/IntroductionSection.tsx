import { motion } from "framer-motion";
import { Target, Lightbulb, Handshake, ArrowRight } from "lucide-react";

const IntroductionSection = () => {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/40 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto"
        >
          {/* Section Header */}
          <div className="text-center mb-16">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-sm font-medium text-primary">INTRODUCTION & OBJECTIVES</span>
            </motion.div>
            
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-primary via-teal-400 to-primary bg-clip-text text-transparent">
                Partnership Proposal
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Startup Factory Hub × Japan Expansion
            </p>
          </div>

          {/* Main Introduction Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="relative group mb-12"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 via-teal-400/50 to-primary/50 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
            <div className="relative p-8 md:p-12 rounded-3xl bg-card/80 backdrop-blur-xl border border-primary/20">
              {/* Scan line effect */}
              <div className="absolute inset-0 overflow-hidden rounded-3xl">
                <motion.div
                  className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
              </div>

              <div className="relative z-10 space-y-6">
                <p className="text-lg md:text-xl text-foreground leading-relaxed">
                  <span className="text-primary font-semibold">The Partner</span> is exploring an expansion into Japan's innovation ecosystem. 
                  <span className="text-primary font-semibold"> Startup Factory Hub (SFH)</span> proposes a commercial partnership to launch and operate a Japan-based accelerator program on the Partner's behalf, leveraging SFH's established global infrastructure, AI-powered platform, and operational expertise.
                </p>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

                <p className="text-lg md:text-xl text-foreground leading-relaxed">
                  In today's evolving startup ecosystem, accelerators must combine <span className="text-primary font-semibold">global reach</span> with <span className="text-primary font-semibold">localized support</span> to nurture innovation effectively. Startup Factory Hub addresses this need through a technology-driven model that integrates digital acceleration with access to premium physical infrastructure and a curated network of mentors, corporates, and investors.
                </p>
              </div>

              {/* Corner decorations */}
              <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-primary/30 rounded-tl-lg" />
              <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-primary/30 rounded-tr-lg" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-primary/30 rounded-bl-lg" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-primary/30 rounded-br-lg" />
            </div>
          </motion.div>

          {/* Objectives Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Target,
                title: "Strategic Expansion",
                description: "Establish a strong presence in one of the world's most important deep tech markets",
              },
              {
                icon: Lightbulb,
                title: "Innovation Bridge",
                description: "Connect Japan's world-class research institutions with global commercialization pathways",
              },
              {
                icon: Handshake,
                title: "Partnership Model",
                description: "Zero operational burden for the Partner with full SFH management and execution",
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="group relative"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-teal-400 rounded-2xl opacity-0 group-hover:opacity-30 blur transition-all duration-500" />
                <div className="relative p-6 rounded-2xl bg-card/60 backdrop-blur-sm border border-border group-hover:border-primary/50 transition-all h-full">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 group-hover:from-primary/30 group-hover:to-primary/10 transition-all">
                    <item.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {item.description}
                  </p>
                  <ArrowRight className="w-5 h-5 text-primary mt-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default IntroductionSection;
