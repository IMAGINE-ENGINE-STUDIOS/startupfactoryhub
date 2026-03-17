import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useMemo, useRef, useEffect, useState } from 'react';
import { 
  Shield, Star, Globe, Satellite, Landmark, Rocket, 
  Users, TrendingUp, Award, ChevronRight, Zap, Eye,
  Thermometer, Waves, Radio, Mountain, Sun, Ship,
  Gift, CreditCard, Building2, ArrowRight, CheckCircle2,
  Hexagon, CircuitBoard, Cpu, Database, Lock, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import OfficialBadge from '@/components/OfficialBadge';
import earthIntelImage from '@/assets/earth-intelligence-pass.jpg';
import officialMentorBadge from '@/assets/official-mentor-badge.png';
import officialAdvisorBadge from '@/assets/official-advisor-badge.png';

// ─── Animation Variants ───
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0, 0, 0.2, 1] as const }
  }),
};

const glowPulse = {
  initial: { boxShadow: '0 0 0px rgba(245,158,11,0)' },
  animate: { 
    boxShadow: [
      '0 0 20px rgba(245,158,11,0.1)',
      '0 0 60px rgba(245,158,11,0.3)',
      '0 0 20px rgba(245,158,11,0.1)',
    ],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const }
  }
};

// ─── Data ───
const benefits = [
  {
    icon: <Landmark className="h-6 w-6" />,
    title: 'Free HSBC Banking',
    description: 'Exclusive HSBC Innovation Banking account — no fees, no minimums. Direct introduction handled by our team.',
    iconColor: 'text-red-400',
    borderGlow: 'hover:shadow-[0_0_30px_rgba(239,68,68,0.2)]',
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: '25% Referral Commission',
    description: 'Earn 25% on every referral — 5% more than standard members. Unlimited earning potential.',
    iconColor: 'text-emerald-400',
    borderGlow: 'hover:shadow-[0_0_30px_rgba(52,211,153,0.2)]',
  },
  {
    icon: <Rocket className="h-6 w-6" />,
    title: 'VC Direct Introductions',
    description: 'Priority access to our venture fund network. Direct introductions to top-tier VC firms for qualified startups.',
    iconColor: 'text-blue-400',
    borderGlow: 'hover:shadow-[0_0_30px_rgba(96,165,250,0.2)]',
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: 'Earth Intelligence Suite',
    description: 'Full access to satellite-derived global datasets — temperature, precipitation, radiation, vessel tracking, and more.',
    iconColor: 'text-cyan-400',
    borderGlow: 'hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]',
  },
  {
    icon: <Gift className="h-6 w-6" />,
    title: 'Professional Perks',
    description: 'Exclusive discounts on electronics, hotels, travel, fitness, and 10+ categories through our partner network.',
    iconColor: 'text-amber-400',
    borderGlow: 'hover:shadow-[0_0_30px_rgba(251,191,36,0.2)]',
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: 'Priority Network Access',
    description: 'First-in-line access to startup founders, fellow mentors, and exclusive community events.',
    iconColor: 'text-purple-400',
    borderGlow: 'hover:shadow-[0_0_30px_rgba(192,132,252,0.2)]',
  },
];

const earthIntelFeatures = [
  { icon: <Thermometer className="h-5 w-5" />, label: 'Land & Sea Surface Temperature', color: 'text-orange-400' },
  { icon: <Waves className="h-5 w-5" />, label: 'Sea Surface Temperature', color: 'text-blue-400' },
  { icon: <Radio className="h-5 w-5" />, label: 'Precipitation Radar', color: 'text-cyan-400' },
  { icon: <Mountain className="h-5 w-5" />, label: 'Global Elevation Data', color: 'text-emerald-400' },
  { icon: <Sun className="h-5 w-5" />, label: 'Solar Radiation Analysis', color: 'text-yellow-400' },
  { icon: <Ship className="h-5 w-5" />, label: 'Live Vessel & Logistics Tracking', color: 'text-indigo-400' },
];

const walletPasses = [
  { title: 'HSBC Innovation Banking', subtitle: 'Free Business Account', gradient: 'from-red-600 to-red-500', icon: <Landmark className="h-8 w-8 text-white" /> },
  { title: 'VC Direct Introduction', subtitle: 'Priority Venture Fund Access', gradient: 'from-indigo-600 to-blue-500', icon: <Rocket className="h-8 w-8 text-white" /> },
  { title: 'Earth Intelligence', subtitle: 'Global Satellite Analytics', gradient: 'from-cyan-600 to-teal-500', icon: <Satellite className="h-8 w-8 text-white" /> },
  { title: 'StartupPerks', subtitle: 'Professional Benefits', gradient: 'from-amber-500 to-orange-500', icon: <Gift className="h-8 w-8 text-white" /> },
];

const steps = [
  { step: '01', title: 'Receive Invitation', description: 'Get invited by our admin team via email', icon: <Lock className="h-5 w-5" /> },
  { step: '02', title: 'Accept & Verify', description: 'Click the link and verify your account', icon: <Shield className="h-5 w-5" /> },
  { step: '03', title: 'Complete Checklist', description: 'Upload avatar, verify email, connect with a peer', icon: <CheckCircle2 className="h-5 w-5" /> },
  { step: '04', title: 'Earn Official Badge', description: 'Unlock all benefits and your gold badge', icon: <Award className="h-5 w-5" /> },
];

const stats = [
  { value: '500+', label: 'Official Members', icon: <Users className="h-4 w-4" /> },
  { value: '$2.5B+', label: 'Portfolio Value', icon: <TrendingUp className="h-4 w-4" /> },
  { value: '45+', label: 'Countries', icon: <Globe className="h-4 w-4" /> },
  { value: '98%', label: 'Retention Rate', icon: <Star className="h-4 w-4" /> },
];

// ─── Matrix Characters ───
const MATRIX_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';

// ─── Tron Grid Background ───
function TronGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      {/* Horizontal grid lines */}
      {Array.from({ length: 20 }, (_, i) => (
        <motion.div
          key={`h-${i}`}
          className="absolute left-0 right-0 h-px"
          style={{ 
            top: `${(i + 1) * 5}%`,
            background: 'linear-gradient(90deg, transparent, hsl(45 100% 60% / 0.3), transparent)',
          }}
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: [0.1, 0.4, 0.1], scaleX: 1 }}
          transition={{ duration: 4, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      {/* Vertical grid lines */}
      {Array.from({ length: 20 }, (_, i) => (
        <motion.div
          key={`v-${i}`}
          className="absolute top-0 bottom-0 w-px"
          style={{ 
            left: `${(i + 1) * 5}%`,
            background: 'linear-gradient(180deg, transparent, hsl(45 100% 60% / 0.2), transparent)',
          }}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: [0.05, 0.3, 0.05], scaleY: 1 }}
          transition={{ duration: 5, delay: i * 0.1, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ─── Matrix Rain (Katakana style) ───
function MatrixRain() {
  const columns = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => {
      const chars = Array.from({ length: Math.floor(Math.random() * 20) + 10 }, () =>
        MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
      );
      return {
        left: `${(i / 50) * 100}%`,
        delay: Math.random() * 10,
        duration: Math.random() * 8 + 4,
        chars,
        opacity: Math.random() * 0.12 + 0.02,
        fontSize: Math.random() * 4 + 10,
      };
    });
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {columns.map((col, i) => (
        <motion.div
          key={i}
          className="absolute top-0 flex flex-col items-center"
          style={{ left: col.left, fontSize: col.fontSize }}
          initial={{ y: '-100%' }}
          animate={{ y: '100vh' }}
          transition={{ duration: col.duration, repeat: Infinity, delay: col.delay, ease: 'linear' }}
        >
          {col.chars.map((char, j) => (
            <span
              key={j}
              className="font-mono leading-tight"
              style={{ 
                opacity: j === 0 ? col.opacity * 4 : col.opacity * (1 - j / col.chars.length),
                color: j === 0 ? 'hsl(45 100% 70%)' : 'hsl(45 80% 50%)',
                textShadow: j === 0 ? '0 0 10px hsl(45 100% 60%)' : 'none',
              }}
            >
              {char}
            </span>
          ))}
        </motion.div>
      ))}
    </div>
  );
}

// ─── Floating Hexagons ───
function FloatingHexagons() {
  const hexagons = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 40 + 20,
      delay: Math.random() * 6,
      duration: Math.random() * 10 + 8,
      rotation: Math.random() * 360,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {hexagons.map((h, i) => (
        <motion.div
          key={i}
          className="absolute border border-amber-400/10 rounded-lg"
          style={{ left: `${h.x}%`, top: `${h.y}%`, width: h.size, height: h.size }}
          animate={{
            y: [0, -40, 0],
            rotate: [h.rotation, h.rotation + 180, h.rotation + 360],
            opacity: [0.05, 0.2, 0.05],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: h.duration, repeat: Infinity, delay: h.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ─── Circuit Lines ───
function CircuitLines() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Horizontal circuit traces */}
      {[20, 40, 60, 80].map((top, i) => (
        <motion.div
          key={`circuit-h-${i}`}
          className="absolute h-px"
          style={{ top: `${top}%`, left: 0, right: 0 }}
        >
          <motion.div
            className="h-full w-20 rounded-full"
            style={{ background: 'linear-gradient(90deg, transparent, hsl(45 100% 60% / 0.6), transparent)' }}
            animate={{ x: ['-10%', '110%'] }}
            transition={{ duration: 3 + i, repeat: Infinity, delay: i * 1.5, ease: 'linear' }}
          />
        </motion.div>
      ))}
      {/* Vertical circuit traces */}
      {[25, 50, 75].map((left, i) => (
        <motion.div
          key={`circuit-v-${i}`}
          className="absolute w-px"
          style={{ left: `${left}%`, top: 0, bottom: 0 }}
        >
          <motion.div
            className="w-full h-20 rounded-full"
            style={{ background: 'linear-gradient(180deg, transparent, hsl(180 100% 50% / 0.4), transparent)' }}
            animate={{ y: ['-10%', '110%'] }}
            transition={{ duration: 4 + i, repeat: Infinity, delay: i * 2, ease: 'linear' }}
          />
        </motion.div>
      ))}
      {/* Node dots at intersections */}
      {[
        { x: 25, y: 20 }, { x: 50, y: 40 }, { x: 75, y: 60 }, { x: 25, y: 80 },
        { x: 50, y: 20 }, { x: 75, y: 40 }, { x: 25, y: 60 }, { x: 50, y: 80 },
      ].map((pos, i) => (
        <motion.div
          key={`node-${i}`}
          className="absolute w-1.5 h-1.5 rounded-full bg-amber-400"
          style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
          animate={{ opacity: [0.1, 0.8, 0.1], scale: [1, 1.5, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ─── Animated Neon Border Card ───
function NeonCard({ children, className = '', glowColor = 'amber' }: { children: React.ReactNode; className?: string; glowColor?: string }) {
  const colors: Record<string, string> = {
    amber: 'border-amber-400/30 hover:border-amber-400/60',
    cyan: 'border-cyan-400/30 hover:border-cyan-400/60',
    blue: 'border-blue-400/30 hover:border-blue-400/60',
  };

  return (
    <div className={`relative group ${className}`}>
      {/* Animated border glow */}
      <motion.div 
        className="absolute -inset-px rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"
        style={{
          background: glowColor === 'cyan' 
            ? 'linear-gradient(135deg, hsl(180 100% 50% / 0.3), transparent, hsl(180 100% 50% / 0.3))'
            : 'linear-gradient(135deg, hsl(45 100% 60% / 0.3), transparent, hsl(45 100% 60% / 0.3))'
        }}
      />
      <div className={`relative rounded-xl border ${colors[glowColor] || colors.amber} bg-background/50 backdrop-blur-xl transition-all duration-500`}>
        {children}
      </div>
    </div>
  );
}

// ─── Data Stream Counter ───
function DataStream() {
  const [values, setValues] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setValues(prev => {
        const next = [...prev, (Math.random() * 1000).toFixed(0).padStart(4, '0')];
        return next.slice(-8);
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex gap-1 overflow-hidden h-5">
      {values.map((v, i) => (
        <motion.span
          key={`${v}-${i}`}
          className="text-xs font-mono text-amber-400/40"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          {v}
        </motion.span>
      ))}
    </div>
  );
}

// ─── Main Component ───
export default function OfficialProgram() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[hsl(220,25%,4%)] text-white overflow-hidden relative">
      {/* Global Background Effects */}
      <TronGrid />
      <MatrixRain />
      <FloatingHexagons />
      <CircuitLines />

      {/* ═══ HERO ═══ */}
      <section className="relative py-28 sm:py-40 px-4">
        {/* Radial glow */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-amber-500/5 blur-[150px]" />
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-cyan-500/5 blur-[100px]" />
          {/* Horizontal scanner */}
          <motion.div
            className="absolute left-0 right-0 h-[2px]"
            style={{ background: 'linear-gradient(90deg, transparent, hsl(45 100% 60% / 0.5), hsl(180 100% 50% / 0.3), transparent)' }}
            animate={{ top: ['0%', '100%'] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          />
          {/* Secondary scanner */}
          <motion.div
            className="absolute top-0 bottom-0 w-[2px]"
            style={{ background: 'linear-gradient(180deg, transparent, hsl(180 100% 50% / 0.3), transparent)' }}
            animate={{ left: ['0%', '100%'] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        <div className="relative max-w-6xl mx-auto text-center z-10">
          {/* Status bar */}
          <motion.div 
            className="flex items-center justify-center gap-3 mb-6"
            initial="hidden" animate="visible" variants={fadeUp} custom={0}
          >
            <DataStream />
          </motion.div>

          {/* Both badges */}
          <motion.div 
            className="flex items-center justify-center gap-8 sm:gap-14 mb-10"
            initial="hidden" animate="visible" variants={fadeUp} custom={0.5}
          >
            <motion.div 
              className="text-center relative"
              variants={glowPulse}
              initial="initial"
              animate="animate"
            >
              <div className="relative">
                <motion.div 
                  className="absolute -inset-4 rounded-full bg-amber-400/10 blur-xl"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.img 
                  src={officialMentorBadge} 
                  alt="Official Mentor Badge" 
                  className="w-28 h-28 sm:w-36 sm:h-36 mx-auto relative z-10 drop-shadow-[0_0_40px_rgba(245,158,11,0.4)]"
                  animate={{ rotate: [0, 3, -3, 0], scale: [1, 1.03, 1] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
              <p className="text-sm font-bold text-amber-400 mt-3 tracking-widest uppercase">Mentor</p>
            </motion.div>

            {/* Divider with energy line */}
            <div className="relative h-32 flex items-center">
              <motion.div 
                className="w-px h-full bg-gradient-to-b from-transparent via-amber-400/50 to-transparent"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div
                className="absolute w-3 h-3 rounded-full bg-amber-400 left-1/2 -translate-x-1/2"
                animate={{ top: ['10%', '90%', '10%'], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{ boxShadow: '0 0 15px hsl(45 100% 60%)' }}
              />
            </div>

            <motion.div 
              className="text-center relative"
              variants={glowPulse}
              initial="initial"
              animate="animate"
            >
              <div className="relative">
                <motion.div 
                  className="absolute -inset-4 rounded-full bg-blue-400/10 blur-xl"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                />
                <motion.img 
                  src={officialAdvisorBadge} 
                  alt="Official Advisor Badge" 
                  className="w-28 h-28 sm:w-36 sm:h-36 mx-auto relative z-10 drop-shadow-[0_0_40px_rgba(96,165,250,0.4)]"
                  animate={{ rotate: [0, -3, 3, 0], scale: [1, 1.03, 1] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                />
              </div>
              <p className="text-sm font-bold text-blue-400 mt-3 tracking-widest uppercase">Advisor</p>
            </motion.div>
          </motion.div>

          {/* Tag */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-amber-400/30 bg-amber-400/5 backdrop-blur-xl mb-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              >
                <Hexagon className="h-4 w-4 text-amber-400" />
              </motion.div>
              <span className="text-sm font-bold text-amber-400 tracking-wider uppercase">Classified · Invite-Only</span>
              <motion.div
                className="w-2 h-2 rounded-full bg-emerald-400"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
          </motion.div>

          <motion.h1 
            className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter mb-6"
            initial="hidden" animate="visible" variants={fadeUp} custom={1.5}
          >
            <span className="text-white/90">Official</span>
            <br />
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent"
              style={{ textShadow: '0 0 80px rgba(245,158,11,0.3)' }}
            >
              Mentors & Advisors
            </span>
          </motion.h1>

          <motion.p 
            className="text-lg sm:text-xl text-white/50 max-w-3xl mx-auto mb-12 leading-relaxed"
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            An exclusive tier for verified partners who shape the next generation of startups. 
            Unlock premium tools, satellite intelligence, banking partnerships, and direct VC access.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            initial="hidden" animate="visible" variants={fadeUp} custom={2.5}
          >
            <Button 
              size="lg"
              className="relative overflow-hidden bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black px-10 h-14 text-base tracking-wide"
              onClick={() => navigate('/auth')}
            >
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
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
              Apply as Advisor
            </Button>
          </motion.div>

          {/* Stats Bar */}
          <motion.div 
            className="flex flex-wrap justify-center gap-8 sm:gap-14"
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className="text-amber-400/60">{stat.icon}</span>
                  <span className="text-2xl sm:text-3xl font-black text-white">{stat.value}</span>
                </div>
                <span className="text-xs text-white/30 font-medium tracking-wider uppercase">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ BENEFITS ═══ */}
      <section className="py-24 px-4 relative">
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/20 bg-amber-400/5 mb-6">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-bold text-amber-400/80 tracking-wider uppercase">Premium Access</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
              Exclusive <span className="text-amber-400">Benefits</span>
            </h2>
            <p className="text-white/40 max-w-2xl mx-auto">
              Official members receive a suite of premium tools and partnerships not available to standard users.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {benefits.map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                whileHover={{ scale: 1.03, y: -6 }}
              >
                <NeonCard>
                  <div className="p-6">
                    {/* Animated icon */}
                    <motion.div 
                      className={`${benefit.iconColor} mb-4`}
                      whileHover={{ rotate: [0, -10, 10, 0], scale: 1.2 }}
                      transition={{ duration: 0.5 }}
                    >
                      {benefit.icon}
                    </motion.div>
                    <h3 className="text-lg font-bold mb-2 text-white">{benefit.title}</h3>
                    <p className="text-sm text-white/40 leading-relaxed">{benefit.description}</p>
                    {/* Bottom accent line */}
                    <motion.div 
                      className="mt-4 h-px bg-gradient-to-r from-amber-400/30 via-amber-400/10 to-transparent"
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      style={{ transformOrigin: 'left' }}
                    />
                  </div>
                </NeonCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WALLET PASSES ═══ */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-amber-500/3 blur-[120px]" />
        </div>
        <div className="relative max-w-6xl mx-auto z-10">
          <motion.div 
            className="text-center mb-16"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/20 bg-amber-400/5 mb-6">
              <CreditCard className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-bold text-amber-400/80 tracking-wider uppercase">Digital Wallet</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
              Your Digital <span className="text-amber-400">Wallet Passes</span>
            </h2>
            <p className="text-white/40 max-w-2xl mx-auto">
              Every Official member receives a curated set of digital passes — accessible from your dashboard wallet.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {walletPasses.map((pass, i) => (
              <motion.div
                key={pass.title}
                className="group cursor-pointer"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                whileHover={{ y: -10, rotateY: 8, scale: 1.03 }}
                style={{ perspective: 1000 }}
              >
                <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${pass.gradient} p-5 h-52 flex flex-col justify-between shadow-2xl`}>
                  {/* Animated shine */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 5, delay: i * 0.5 }}
                  />
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-28 h-28 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                  <div className="relative z-10">{pass.icon}</div>
                  <div className="relative z-10">
                    <p className="text-white font-bold text-sm">{pass.title}</p>
                    <p className="text-white/60 text-xs">{pass.subtitle}</p>
                  </div>
                  <div className="absolute top-3 right-3 z-10">
                    <OfficialBadge size="sm" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ EARTH INTELLIGENCE ═══ */}
      <section className="py-24 px-4 relative">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/5 mb-6">
                <Satellite className="h-3.5 w-3.5 text-cyan-400" />
                <span className="text-xs font-bold text-cyan-400/80 tracking-wider uppercase">Included for Officials</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
                Earth <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">Intelligence</span> Suite
              </h2>
              <p className="text-white/40 mb-8 leading-relaxed">
                Access the same satellite-derived datasets used by the world's top intelligence agencies and research institutions. 
                Real-time global coverage with professional-grade analytics.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {earthIntelFeatures.map((feature, i) => (
                  <motion.div
                    key={feature.label}
                    className="flex items-center gap-3 p-3.5 rounded-lg border border-white/5 bg-white/[0.02] backdrop-blur-sm hover:border-cyan-400/20 transition-all"
                    initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.3}
                    whileHover={{ x: 6 }}
                  >
                    <span className={feature.color}>{feature.icon}</span>
                    <span className="text-sm font-medium text-white/70">{feature.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              className="relative"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
            >
              <div className="relative rounded-2xl overflow-hidden border border-cyan-400/20 p-1">
                <img 
                  src={earthIntelImage} 
                  alt="Earth Intelligence Suite - Global satellite analytics dashboard" 
                  className="rounded-xl w-full h-auto min-h-[380px] object-cover"
                />
                {/* Overlay scan effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-b from-cyan-400/5 to-transparent"
                  animate={{ opacity: [0, 0.3, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </div>
              <div className="absolute -inset-6 bg-cyan-400/5 rounded-3xl blur-3xl -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="py-24 px-4 relative">
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/20 bg-amber-400/5 mb-6">
              <CircuitBoard className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-bold text-amber-400/80 tracking-wider uppercase">Protocol</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
              How to Become <span className="text-amber-400">Official</span>
            </h2>
          </motion.div>

          {/* Connected steps */}
          <div className="relative">
            {/* Connection line */}
            <motion.div 
              className="hidden lg:block absolute top-1/2 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, hsl(45 100% 60% / 0.3), transparent)' }}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5 }}
            />
            {/* Moving dot on connection line */}
            <motion.div
              className="hidden lg:block absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-400 z-20"
              style={{ boxShadow: '0 0 10px hsl(45 100% 60%)' }}
              animate={{ left: ['5%', '95%', '5%'] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((step, i) => (
                <motion.div
                  key={step.step}
                  className="relative"
                  initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                  whileHover={{ scale: 1.05, y: -6 }}
                >
                  <NeonCard>
                    <div className="p-6 text-center">
                      <motion.div 
                        className="w-12 h-12 mx-auto rounded-full border border-amber-400/30 flex items-center justify-center text-amber-400 mb-4"
                        animate={{ boxShadow: ['0 0 0px rgba(245,158,11,0)', '0 0 20px rgba(245,158,11,0.3)', '0 0 0px rgba(245,158,11,0)'] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                      >
                        {step.icon}
                      </motion.div>
                      <span className="text-3xl font-black text-amber-400/15">{step.step}</span>
                      <h3 className="font-bold mt-2 mb-2 text-white">{step.title}</h3>
                      <p className="text-xs text-white/40">{step.description}</p>
                    </div>
                  </NeonCard>
                  {i < steps.length - 1 && (
                    <ChevronRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-400/30 z-10" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-24 px-4 relative">
        <motion.div 
          className="max-w-4xl mx-auto relative overflow-hidden rounded-3xl z-10"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-[hsl(220,25%,6%)] to-blue-500/10" />
          <div className="absolute inset-0 border border-amber-400/20 rounded-3xl" />
          
          {/* Animated border trace */}
          <svg className="absolute inset-0 w-full h-full rounded-3xl pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0.5" y="0.5" width="calc(100% - 1px)" height="calc(100% - 1px)" rx="24" ry="24" fill="none" stroke="url(#borderGrad)" strokeWidth="1.5" strokeDasharray="8 8">
              <animate attributeName="stroke-dashoffset" from="0" to="-32" dur="2s" repeatCount="indefinite" />
            </rect>
            <defs>
              <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(45 100% 60% / 0.6)" />
                <stop offset="50%" stopColor="hsl(180 100% 50% / 0.3)" />
                <stop offset="100%" stopColor="hsl(45 100% 60% / 0.6)" />
              </linearGradient>
            </defs>
          </svg>

          {/* Scanner */}
          <motion.div
            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent"
            animate={{ top: ['0%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />

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
            <p className="text-white/40 max-w-xl mx-auto mb-10">
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
                Apply as Advisor
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer spacer */}
      <div className="h-20" />
    </div>
  );
}
