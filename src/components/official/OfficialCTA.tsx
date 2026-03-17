import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import officialMentorBadge from '@/assets/official-mentor-badge.png';
import officialAdvisorBadge from '@/assets/official-advisor-badge.png';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const }
  }),
};

export default function OfficialCTA() {
  const navigate = useNavigate();

  return (
    <section className="py-28 px-4 relative">
      <motion.div
        className="max-w-4xl mx-auto relative overflow-hidden rounded-3xl"
        initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-card to-blue-500/10" />
        <div className="absolute inset-0 border border-amber-400/20 rounded-3xl" />

        {/* Animated dashed border */}
        <svg className="absolute inset-0 w-full h-full rounded-3xl pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <rect x="0.5" y="0.5" width="calc(100% - 1px)" height="calc(100% - 1px)" rx="24" ry="24" fill="none" stroke="url(#ctaGrad)" strokeWidth="1" strokeDasharray="8 8">
            <animate attributeName="stroke-dashoffset" from="0" to="-32" dur="2s" repeatCount="indefinite" />
          </rect>
          <defs>
            <linearGradient id="ctaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(245,158,11,0.5)" />
              <stop offset="50%" stopColor="rgba(96,165,250,0.3)" />
              <stop offset="100%" stopColor="rgba(245,158,11,0.5)" />
            </linearGradient>
          </defs>
        </svg>

        <div className="relative z-10 p-12 sm:p-16 text-center">
          <div className="flex justify-center gap-6 mb-8">
            <motion.img
              src={officialMentorBadge}
              alt="Mentor Badge"
              className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.img
              src={officialAdvisorBadge}
              alt="Advisor Badge"
              className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-[0_0_20px_rgba(96,165,250,0.4)]"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            />
          </div>

          <h2 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">
            Ready to Go <span className="text-amber-400">Official</span>?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-10">
            Join the ranks of verified mentors and advisors who are shaping the future of startups worldwide.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="relative overflow-hidden bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black px-10 h-14"
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
            <Button
              size="lg"
              className="border-2 border-blue-400/40 text-blue-400 bg-blue-400/5 hover:bg-blue-400/15 hover:border-blue-400/60 px-10 h-14 font-bold backdrop-blur-xl"
              onClick={() => navigate('/auth')}
            >
              Apply as Advisor <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
