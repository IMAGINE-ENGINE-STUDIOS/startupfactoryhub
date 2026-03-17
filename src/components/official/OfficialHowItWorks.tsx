import { motion } from 'framer-motion';
import { Lock, Shield, CheckCircle2, Award, ChevronRight, CircuitBoard } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const }
  }),
};

const steps = [
  { step: '01', title: 'Receive Invitation', description: 'Get invited by our admin team via email', icon: <Lock className="h-5 w-5" /> },
  { step: '02', title: 'Accept & Verify', description: 'Click the link and verify your account', icon: <Shield className="h-5 w-5" /> },
  { step: '03', title: 'Complete Checklist', description: 'Upload avatar, verify email, connect with a peer', icon: <CheckCircle2 className="h-5 w-5" /> },
  { step: '04', title: 'Earn Official Badge', description: 'Unlock all benefits and your verified badge', icon: <Award className="h-5 w-5" /> },
];

export default function OfficialHowItWorks() {
  return (
    <section className="py-28 px-4 relative">
      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-16"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/30 bg-card/30 mb-6">
            <CircuitBoard className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-bold text-amber-400/80 tracking-[0.15em] uppercase">Protocol</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            How to Become <span className="text-amber-400">Official</span>
          </h2>
        </motion.div>

        <div className="relative">
          {/* Connection line */}
          <motion.div
            className="hidden lg:block absolute top-1/2 left-[8%] right-[8%] h-px bg-gradient-to-r from-amber-400/20 via-amber-400/40 to-amber-400/20"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5 }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.step}
                className="relative"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                whileHover={{ scale: 1.05, y: -6 }}
              >
                <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-6 text-center hover:border-amber-400/30 transition-all">
                  <motion.div
                    className="w-12 h-12 mx-auto rounded-full border border-amber-400/30 flex items-center justify-center text-amber-400 mb-4 bg-amber-400/5"
                    animate={{
                      boxShadow: [
                        '0 0 0px rgba(245,158,11,0)',
                        '0 0 20px rgba(245,158,11,0.2)',
                        '0 0 0px rgba(245,158,11,0)',
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                  >
                    {step.icon}
                  </motion.div>
                  <span className="text-3xl font-black text-amber-400/10">{step.step}</span>
                  <h3 className="font-bold mt-2 mb-2">{step.title}</h3>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
                {i < steps.length - 1 && (
                  <ChevronRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-400/30 z-10" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
