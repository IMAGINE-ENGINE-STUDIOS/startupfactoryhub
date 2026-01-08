import { motion } from "framer-motion";
import { Mail, Calendar, FileDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import MatrixBackground from "@/components/MatrixBackground";

const JapanCTA = () => {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/10 to-background">
        <MatrixBackground />
      </div>
      
      {/* Glowing Orbs */}
      <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-red-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: "1s" }} />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          {/* Japanese Text */}
          <p className="text-2xl md:text-3xl text-primary/60 mb-4 tracking-widest">
            パートナーシップを始めましょう
          </p>

          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Ready to Launch in <span className="text-primary">Japan</span>?
          </h2>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Join us in building the next generation of deep tech innovators in Japan's thriving startup ecosystem.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg group">
                <Calendar className="w-5 h-5 mr-2" />
                Schedule a Call
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-6 text-lg">
                <FileDown className="w-5 h-5 mr-2" />
                Download Proposal
              </Button>
            </motion.div>
          </div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-2 text-muted-foreground"
          >
            <Mail className="w-5 h-5 text-primary" />
            <a href="mailto:info@startupfactoryhub.com" className="hover:text-primary transition-colors">
              info@startupfactoryhub.com
            </a>
          </motion.div>

          {/* Bottom Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-16 inline-flex items-center gap-3 px-6 py-3 rounded-full bg-card/50 backdrop-blur-sm border border-border"
          >
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-xs font-bold text-primary">🚀</div>
              <div className="w-8 h-8 rounded-full bg-red-500/20 border-2 border-background flex items-center justify-center text-xs font-bold text-red-500">🇯🇵</div>
              <div className="w-8 h-8 rounded-full bg-teal-500/20 border-2 border-background flex items-center justify-center text-xs font-bold text-teal-500">🌏</div>
            </div>
            <span className="text-sm text-muted-foreground">
              Startup Factory Hub × Japan Partnership
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default JapanCTA;
