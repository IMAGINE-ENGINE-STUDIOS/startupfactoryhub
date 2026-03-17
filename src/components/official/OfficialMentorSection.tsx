import { motion } from 'framer-motion';
import { ArrowRight, Users, TrendingUp, Globe, Rocket, BookOpen, Award, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import officialMentorBadge from '@/assets/official-mentor-badge.png';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const }
  }),
};

const mentorBenefits = [
  { icon: <TrendingUp className="h-5 w-5" />, text: '25% Referral Commission — 5% more than standard' },
  { icon: <Rocket className="h-5 w-5" />, text: 'VC Direct Introductions for qualified startups' },
  { icon: <Users className="h-5 w-5" />, text: 'Priority access to startup founders & community events' },
  { icon: <Globe className="h-5 w-5" />, text: 'Earth Intelligence Suite — satellite analytics' },
  { icon: <BookOpen className="h-5 w-5" />, text: 'Create & monetize courses on the platform' },
  { icon: <Award className="h-5 w-5" />, text: 'Verified gold badge on your public profile' },
];

export default function OfficialMentorSection() {
  const navigate = useNavigate();

  return (
    <section className="py-28 px-4 relative overflow-hidden">
      {/* Accent glow */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-amber-500/5 blur-[150px]" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Badge & Visual */}
          <motion.div
            className="flex flex-col items-center lg:items-start"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          >
            <div className="relative mb-8">
              <motion.div
                className="absolute -inset-10 rounded-full bg-amber-400/8 blur-3xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 5, repeat: Infinity }}
              />
              <motion.img
                src={officialMentorBadge}
                alt="Official Mentor Badge"
                className="w-48 h-48 sm:w-56 sm:h-56 relative z-10 drop-shadow-[0_0_60px_rgba(245,158,11,0.4)]"
                animate={{ rotate: [0, 2, -2, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>

            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/30 bg-amber-400/5 mb-4">
                <span className="text-xs font-bold text-amber-400 tracking-[0.15em] uppercase">For Mentors</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
                Official <span className="text-amber-400">Mentor</span>
              </h2>
              <p className="text-muted-foreground max-w-md leading-relaxed">
                Guide the next generation of founders. As an Official Mentor, you gain access to exclusive tools, 
                premium commissions, and direct venture capital introductions.
              </p>
            </div>
          </motion.div>

          {/* Right: Benefits list */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
              {mentorBenefits.map((benefit, i) => (
                <motion.div
                  key={i}
                  className="group cursor-pointer flex flex-col items-center text-center p-4 rounded-2xl border border-border/40 bg-card/20 backdrop-blur-sm hover:border-amber-400/40 hover:bg-amber-400/5 transition-all"
                  initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.3 + 1}
                  whileHover={{ y: -4, scale: 1.03 }}
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-400/20 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all">
                    <div className="text-amber-400">{benefit.icon}</div>
                  </div>
                  <span className="text-xs font-medium text-foreground/70 leading-tight">{benefit.text}</span>
                </motion.div>
              ))}
            </div>

            <Button
              size="lg"
              className="relative overflow-hidden bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold px-8 h-12"
              onClick={() => navigate('/auth')}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
              />
              <span className="relative z-10 flex items-center gap-2">
                Apply as Mentor <ArrowRight className="h-4 w-4" />
              </span>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
