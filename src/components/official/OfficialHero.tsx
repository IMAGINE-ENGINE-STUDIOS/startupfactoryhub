import { motion } from 'framer-motion';
import { ArrowRight, Hexagon, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import VideoBackground from '@/components/VideoBackground';
import officialMentorBadge from '@/assets/official-mentor-badge.png';
import officialAdvisorBadge from '@/assets/official-advisor-badge.png';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] as const }
  }),
};

export default function OfficialHero() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <VideoBackground />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/60 z-[1]" />

      {/* Animated grid */}
      <div className="absolute inset-0 z-[2] opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(245,158,11,0.15) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(245,158,11,0.15) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />
      </div>

      {/* Scanning line */}
      <motion.div
        className="absolute left-0 right-0 h-[2px] z-[3]"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.4), rgba(34,211,238,0.3), transparent)' }}
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
        {/* Badges side by side */}
        <motion.div
          className="flex items-center justify-center gap-10 sm:gap-16 mb-10"
          initial="hidden" animate="visible" variants={fadeUp} custom={0}
        >
          <motion.div className="text-center">
            <div className="relative">
              <motion.div
                className="absolute -inset-6 rounded-full bg-amber-400/10 blur-2xl"
                animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <motion.img
                src={officialMentorBadge}
                alt="Official Mentor Badge"
                className="w-28 h-28 sm:w-36 sm:h-36 mx-auto relative z-10 drop-shadow-[0_0_50px_rgba(245,158,11,0.5)]"
                animate={{ rotate: [0, 2, -2, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            <p className="text-sm font-bold text-amber-400 mt-3 tracking-[0.2em] uppercase">Mentor</p>
          </motion.div>

          {/* Energy divider */}
          <div className="relative h-28 flex items-center">
            <motion.div
              className="w-px h-full bg-gradient-to-b from-transparent via-white/30 to-transparent"
              animate={{ opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
          </div>

          <motion.div className="text-center">
            <div className="relative">
              <motion.div
                className="absolute -inset-6 rounded-full bg-blue-400/10 blur-2xl"
                animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
              />
              <motion.img
                src={officialAdvisorBadge}
                alt="Official Advisor Badge"
                className="w-28 h-28 sm:w-36 sm:h-36 mx-auto relative z-10 drop-shadow-[0_0_50px_rgba(96,165,250,0.5)]"
                animate={{ rotate: [0, -2, 2, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              />
            </div>
            <p className="text-sm font-bold text-blue-400 mt-3 tracking-[0.2em] uppercase">Advisor</p>
          </motion.div>
        </motion.div>

        {/* Tag */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-amber-400/30 bg-amber-400/5 backdrop-blur-xl mb-8">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}>
              <Hexagon className="h-4 w-4 text-amber-400" />
            </motion.div>
            <span className="text-sm font-bold text-amber-400 tracking-[0.15em] uppercase">Classified · Invite-Only Program</span>
            <motion.div
              className="w-2 h-2 rounded-full bg-emerald-400"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter mb-6 text-white"
          initial="hidden" animate="visible" variants={fadeUp} custom={1.5}
        >
          Official{' '}
          <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
            Program
          </span>
        </motion.h1>

        <motion.p
          className="text-lg sm:text-xl text-white/50 max-w-3xl mx-auto mb-12 leading-relaxed"
          initial="hidden" animate="visible" variants={fadeUp} custom={2}
        >
          An exclusive tier for verified partners who shape the next generation of startups.
          Unlock premium tools, satellite intelligence, banking partnerships, and direct VC access.
        </motion.p>

        {/* CTA */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial="hidden" animate="visible" variants={fadeUp} custom={2.5}
        >
          <Button
            size="lg"
            className="relative overflow-hidden bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black px-10 h-14 text-base tracking-wide"
            onClick={() => navigate('/auth')}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            />
            <span className="relative z-10 flex items-center gap-2">
              Apply as Mentor <ArrowRight className="h-4 w-4" />
            </span>
          </Button>
          <Button
            size="lg"
            className="border-2 border-blue-400/40 text-blue-400 bg-blue-400/5 hover:bg-blue-400/15 hover:border-blue-400/60 px-10 h-14 text-base font-bold tracking-wide backdrop-blur-xl"
            onClick={() => navigate('/auth')}
          >
            Apply as Advisor <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent z-[5]" />
    </section>
  );
}
