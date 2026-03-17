import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Shield, Star, Globe, Satellite, Landmark, Rocket, 
  Users, TrendingUp, Award, ChevronRight, Zap, Eye,
  Thermometer, Waves, Radio, Mountain, Sun, Ship,
  Gift, CreditCard, Building2, ArrowRight, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import OfficialBadge from '@/components/OfficialBadge';
import earthIntelImage from '@/assets/earth-intelligence-pass.jpg';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0, 0, 0.2, 1] as const }
  }),
};

const benefits = [
  {
    icon: <Landmark className="h-6 w-6" />,
    title: 'Free HSBC Banking',
    description: 'Exclusive HSBC Innovation Banking account — no fees, no minimums. Direct introduction handled by our team.',
    gradient: 'from-red-500/20 to-red-600/10',
    iconColor: 'text-red-400',
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: '25% Referral Commission',
    description: 'Earn 25% on every referral — 5% more than standard members. Unlimited earning potential.',
    gradient: 'from-emerald-500/20 to-emerald-600/10',
    iconColor: 'text-emerald-400',
  },
  {
    icon: <Rocket className="h-6 w-6" />,
    title: 'VC Direct Introductions',
    description: 'Priority access to our venture fund network. Direct introductions to top-tier VC firms for qualified startups.',
    gradient: 'from-blue-500/20 to-indigo-600/10',
    iconColor: 'text-blue-400',
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: 'Earth Intelligence Suite',
    description: 'Full access to satellite-derived global datasets — temperature, precipitation, radiation, vessel tracking, and more.',
    gradient: 'from-cyan-500/20 to-teal-600/10',
    iconColor: 'text-cyan-400',
  },
  {
    icon: <Gift className="h-6 w-6" />,
    title: 'Professional Perks',
    description: 'Exclusive discounts on electronics, hotels, travel, fitness, and 10+ categories through our partner network.',
    gradient: 'from-amber-500/20 to-orange-600/10',
    iconColor: 'text-amber-400',
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: 'Priority Network Access',
    description: 'First-in-line access to startup founders, fellow mentors, and exclusive community events.',
    gradient: 'from-purple-500/20 to-violet-600/10',
    iconColor: 'text-purple-400',
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
  {
    title: 'HSBC Innovation Banking',
    subtitle: 'Free Business Account',
    gradient: 'from-red-600 to-red-500',
    icon: <Landmark className="h-8 w-8 text-white" />,
  },
  {
    title: 'VC Direct Introduction',
    subtitle: 'Priority Venture Fund Access',
    gradient: 'from-indigo-600 to-blue-500',
    icon: <Rocket className="h-8 w-8 text-white" />,
  },
  {
    title: 'Earth Intelligence',
    subtitle: 'Global Satellite Analytics',
    gradient: 'from-cyan-600 to-teal-500',
    icon: <Satellite className="h-8 w-8 text-white" />,
  },
  {
    title: 'StartupPerks',
    subtitle: 'Professional Benefits',
    gradient: 'from-amber-500 to-orange-500',
    icon: <Gift className="h-8 w-8 text-white" />,
  },
];

const steps = [
  { step: '01', title: 'Receive Invitation', description: 'Get invited by our admin team via email' },
  { step: '02', title: 'Accept & Verify', description: 'Click the link and verify your account' },
  { step: '03', title: 'Complete Checklist', description: 'Upload avatar, verify email, connect with a peer' },
  { step: '04', title: 'Earn Official Badge', description: 'Unlock all benefits and your gold badge' },
];

export default function OfficialProgram() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero */}
      <section className="relative py-24 sm:py-32 px-4">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px]" />
        </div>

        <div className="relative max-w-6xl mx-auto text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full tech-card border border-amber-400/30 mb-8">
              <OfficialBadge size="md" />
              <span className="text-sm font-semibold text-amber-400">Invite-Only Program</span>
            </div>
          </motion.div>

          <motion.h1 
            className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
          >
            <span className="text-foreground">Official</span>{' '}
            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
              Mentors & Advisors
            </span>
          </motion.h1>

          <motion.p 
            className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-10"
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            An exclusive tier for verified partners who shape the next generation of startups. 
            Unlock premium tools, satellite intelligence, banking partnerships, and direct VC access.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
          >
            <Button 
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-8 h-12 text-base font-semibold"
              onClick={() => navigate('/join/mentor')}
            >
              Apply as Mentor <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-amber-400/30 text-amber-400 hover:bg-amber-400/10 px-8 h-12 text-base"
              onClick={() => navigate('/join/advisor')}
            >
              Apply as Advisor
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Exclusive <span className="text-amber-400">Benefits</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Official members receive a suite of premium tools and partnerships not available to standard users.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, i) => (
              <motion.div
                key={benefit.title}
                className={`tech-card rounded-xl p-6 border border-border/50 bg-gradient-to-br ${benefit.gradient} hover:border-amber-400/30 transition-all duration-300 group`}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <div className={`${benefit.iconColor} mb-4 group-hover:scale-110 transition-transform`}>
                  {benefit.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Wallet Passes */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/3 to-transparent" />
        <div className="relative max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Your Digital <span className="text-amber-400">Wallet Passes</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Every Official member receives a curated set of digital passes — accessible from your dashboard wallet.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {walletPasses.map((pass, i) => (
              <motion.div
                key={pass.title}
                className="group cursor-pointer"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${pass.gradient} p-5 h-48 flex flex-col justify-between shadow-lg group-hover:scale-[1.03] transition-transform duration-300`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                  <div className="relative z-10">
                    {pass.icon}
                  </div>
                  <div className="relative z-10">
                    <p className="text-white font-bold text-sm">{pass.title}</p>
                    <p className="text-white/70 text-xs">{pass.subtitle}</p>
                  </div>
                  <div className="absolute top-3 right-3">
                    <OfficialBadge size="sm" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Earth Intelligence Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full tech-card border border-cyan-400/30 mb-6">
                <Satellite className="h-4 w-4 text-cyan-400" />
                <span className="text-xs font-semibold text-cyan-400">Included for Official Members</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Earth <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">Intelligence</span> Suite
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Access the same satellite-derived datasets used by the world's top intelligence agencies and research institutions. 
                Real-time global coverage with professional-grade analytics — included at no extra cost for all Official members.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {earthIntelFeatures.map((feature, i) => (
                  <motion.div
                    key={feature.label}
                    className="flex items-center gap-3 p-3 rounded-lg tech-card border border-border/30"
                    initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.5}
                  >
                    <span className={feature.color}>{feature.icon}</span>
                    <span className="text-sm font-medium">{feature.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              className="relative"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
            >
              <div className="relative rounded-2xl overflow-hidden tech-card border border-cyan-400/20 p-1">
                <img 
                  src={earthIntelImage} 
                  alt="Earth Intelligence Suite - Global satellite analytics dashboard" 
                  className="rounded-xl w-full h-auto min-h-[380px] object-cover"
                />
              </div>
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-cyan-400/5 rounded-3xl blur-2xl -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              How to Become <span className="text-amber-400">Official</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.step}
                className="relative tech-card rounded-xl p-6 border border-border/50 text-center group hover:border-amber-400/30 transition-all"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <span className="text-4xl font-black text-amber-400/20 group-hover:text-amber-400/40 transition-colors">
                  {step.step}
                </span>
                <h3 className="font-semibold mt-3 mb-2">{step.title}</h3>
                <p className="text-xs text-muted-foreground">{step.description}</p>
                {i < steps.length - 1 && (
                  <ChevronRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-400/30" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <motion.div 
          className="max-w-4xl mx-auto tech-card rounded-2xl border border-amber-400/20 p-10 sm:p-14 text-center relative overflow-hidden"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5" />
          <div className="relative z-10">
            <OfficialBadge size="lg" className="justify-center mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to Go Official?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              Join the ranks of verified mentors and advisors who are shaping the future of startups worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-8"
                onClick={() => navigate('/join/mentor')}
              >
                Apply as Mentor <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-amber-400/30 text-amber-400 hover:bg-amber-400/10 px-8"
                onClick={() => navigate('/join/advisor')}
              >
                Apply as Advisor
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer spacer */}
      <div className="h-16" />
    </div>
  );
}
