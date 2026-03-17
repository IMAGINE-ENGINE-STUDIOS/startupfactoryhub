import { motion } from 'framer-motion';
import { ArrowRight, Landmark, TrendingUp, Shield, Briefcase, Globe, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import officialAdvisorBadge from '@/assets/official-advisor-badge.png';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const }
  }),
};

const advisorBenefits = [
  { icon: <Landmark className="h-5 w-5" />, text: 'Free HSBC Innovation Banking — no fees, no minimums' },
  { icon: <TrendingUp className="h-5 w-5" />, text: '25% Referral Commission on all referrals' },
  { icon: <Briefcase className="h-5 w-5" />, text: 'Strategic advisory roles with portfolio startups' },
  { icon: <Globe className="h-5 w-5" />, text: 'Earth Intelligence Suite — global satellite data' },
  { icon: <Shield className="h-5 w-5" />, text: 'Verified blue badge on your public profile' },
  { icon: <Star className="h-5 w-5" />, text: 'Featured in the official advisor directory' },
];

export default function OfficialAdvisorSection() {
  const navigate = useNavigate();

  return (
    <section className="py-28 px-4 relative overflow-hidden">
      {/* Accent glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[150px]" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Benefits list (flipped layout) */}
          <motion.div
            className="order-2 lg:order-1"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
          >
            <div className="space-y-4 mb-8">
              {advisorBenefits.map((benefit, i) => (
                <motion.div
                  key={i}
                  className="flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm hover:border-blue-400/30 transition-all group"
                  initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.5 + 1}
                  whileHover={{ x: 6 }}
                >
                  <div className="text-blue-400 mt-0.5 group-hover:scale-110 transition-transform">
                    {benefit.icon}
                  </div>
                  <span className="text-sm font-medium text-foreground/80">{benefit.text}</span>
                </motion.div>
              ))}
            </div>

            <Button
              size="lg"
              className="border-2 border-blue-400/40 text-blue-400 bg-blue-400/5 hover:bg-blue-400/15 hover:border-blue-400/60 px-8 h-12 font-bold"
              onClick={() => navigate('/auth')}
            >
              Apply as Advisor <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>

          {/* Right: Badge & Visual */}
          <motion.div
            className="flex flex-col items-center lg:items-end order-1 lg:order-2"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          >
            <div className="relative mb-8">
              <motion.div
                className="absolute -inset-10 rounded-full bg-blue-400/8 blur-3xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
              />
              <motion.img
                src={officialAdvisorBadge}
                alt="Official Advisor Badge"
                className="w-48 h-48 sm:w-56 sm:h-56 relative z-10 drop-shadow-[0_0_60px_rgba(96,165,250,0.4)]"
                animate={{ rotate: [0, -2, 2, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>

            <div className="text-center lg:text-right">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-400/30 bg-blue-400/5 mb-4">
                <span className="text-xs font-bold text-blue-400 tracking-[0.15em] uppercase">For Advisors</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
                Official <span className="text-blue-400">Advisor</span>
              </h2>
              <p className="text-muted-foreground max-w-md leading-relaxed ml-auto">
                Shape strategy at the highest level. As an Official Advisor, you unlock banking partnerships, 
                premium perks, and a verified presence across the platform.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
