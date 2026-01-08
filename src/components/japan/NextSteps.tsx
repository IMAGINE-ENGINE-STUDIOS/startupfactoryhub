import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Globe, Rocket, Lightbulb } from "lucide-react";

const NextSteps = () => {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.1),transparent_70%)]" />
      </div>

      {/* Animated elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
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
          className="max-w-5xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">NEXT STEPS</span>
            </motion.div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Ready to <span className="text-primary">Partner</span>?
            </h2>
          </div>

          {/* Main Message Cards */}
          <div className="space-y-6 mb-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-teal-400/50 rounded-2xl opacity-0 group-hover:opacity-100 blur transition-all duration-500" />
              <div className="relative p-8 rounded-2xl bg-card/80 backdrop-blur-xl border border-primary/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Rocket className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-lg md:text-xl text-foreground leading-relaxed">
                    <span className="text-primary font-semibold">Startup Factory Hub</span> is excited to partner with you to launch a successful Japan program. This Phase 1 partnership offers a <span className="text-primary font-semibold">low-risk, high-impact route</span> for the Partner to establish a presence in one of the world's most important deep tech markets—with immediate deal flow, curated programming, and no operational overhead.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="relative group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-400/50 to-primary/50 rounded-2xl opacity-0 group-hover:opacity-100 blur transition-all duration-500" />
              <div className="relative p-8 rounded-2xl bg-card/80 backdrop-blur-xl border border-primary/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-lg md:text-xl text-foreground leading-relaxed">
                    Together, we will act as a <span className="text-primary font-semibold">bridge between Japan's world-class research institutions</span> and global commercialization pathways, turning cutting-edge Japanese innovations into <span className="text-primary font-semibold">scalable businesses with international impact</span>.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Vision Statement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20">
              <Lightbulb className="w-6 h-6 text-primary" />
              <p className="text-lg font-medium text-foreground">
                From Japanese Innovation to <span className="text-primary">Global Impact</span>
              </p>
              <ArrowRight className="w-5 h-5 text-primary" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default NextSteps;
