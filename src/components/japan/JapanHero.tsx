import { motion } from "framer-motion";
import { Rocket, Globe, Cpu, TrendingUp, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import MatrixBackground from "@/components/MatrixBackground";

const floatingCards = [
  { icon: Rocket, label: "Deep Tech", value: "¥10T Initiative" },
  { icon: Globe, label: "Global Reach", value: "130+ Countries" },
  { icon: Cpu, label: "AI Platform", value: "Full Access" },
  { icon: TrendingUp, label: "ROI Target", value: "6-10 Startups" },
];

const JapanHero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background">
        <MatrixBackground />
      </div>
      
      {/* Animated Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.03)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      
      {/* Japanese Pattern Overlay */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <pattern id="waves" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M0 10 Q5 0, 10 10 T20 10" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#waves)" />
        </svg>
      </div>

      {/* Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-red-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />

      <div className="relative z-10 container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-5xl mx-auto"
        >
          {/* Top Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Badge className="mb-6 px-4 py-2 text-sm bg-red-500/10 text-red-400 border-red-500/30 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              PARTNERSHIP PROPOSAL 2025
            </Badge>
          </motion.div>

          {/* Japanese Characters */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-light text-primary/60 mb-4 tracking-widest"
          >
            日本アクセラレーター
          </motion.p>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6"
          >
            <span className="bg-gradient-to-r from-primary via-teal-300 to-primary bg-clip-text text-transparent animate-gradient-x">
              JAPAN
            </span>
            <br />
            <span className="text-foreground">ACCELERATOR</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto"
          >
            Deep Tech & Aerospace Expansion
            <br />
            <span className="text-primary">Startup Factory Hub × Strategic Partner</span>
          </motion.p>

          {/* Investment Highlight */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-primary/20 to-teal-500/20 border border-primary/30 backdrop-blur-sm mb-12"
          >
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
            <span className="text-lg font-semibold text-primary">
              ¥10 Trillion Government Startup Initiative (2023-2027)
            </span>
          </motion.div>

          {/* Floating Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {floatingCards.map((card, index) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group relative p-4 rounded-xl bg-card/50 backdrop-blur-md border border-primary/20 hover:border-primary/50 transition-all duration-300"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <card.icon className="w-8 h-8 text-primary mb-2 mx-auto" />
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-lg font-bold text-foreground">{card.value}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-primary/30 flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-primary"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default JapanHero;
