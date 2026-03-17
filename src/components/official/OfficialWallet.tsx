import { motion } from 'framer-motion';
import { Landmark, Rocket, Satellite, Gift, Wifi, CreditCard } from 'lucide-react';
import OfficialBadge from '@/components/OfficialBadge';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const }
  }),
};

const passes = [
  {
    title: 'HSBC Innovation Banking',
    subtitle: 'Business Account · No Fees',
    number: '•••• •••• •••• 4521',
    gradient: 'from-[#DB0011] via-[#AF000E] to-[#8A000B]',
    icon: <Landmark className="h-7 w-7 text-white/90" />,
    logo: 'HSBC',
  },
  {
    title: 'VC Direct Introduction',
    subtitle: 'Priority Venture Access',
    number: '•••• •••• •••• 7834',
    gradient: 'from-indigo-600 via-indigo-700 to-blue-800',
    icon: <Rocket className="h-7 w-7 text-white/90" />,
    logo: 'SFH',
  },
  {
    title: 'Earth Intelligence',
    subtitle: 'Global Satellite Analytics',
    number: '•••• •••• •••• 9012',
    gradient: 'from-cyan-600 via-teal-700 to-emerald-800',
    icon: <Satellite className="h-7 w-7 text-white/90" />,
    logo: 'EIS',
  },
  {
    title: 'StartupPerks',
    subtitle: 'Professional Benefits',
    number: '•••• •••• •••• 3456',
    gradient: 'from-amber-500 via-orange-600 to-red-600',
    icon: <Gift className="h-7 w-7 text-white/90" />,
    logo: 'PERKS',
  },
];

function WalletCard({ pass, index }: { pass: typeof passes[0]; index: number }) {
  return (
    <motion.div
      className="group cursor-pointer"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      custom={index}
      whileHover={{ y: -12, rotateY: 5, scale: 1.02 }}
      style={{ perspective: 1200 }}
    >
      <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${pass.gradient} p-6 aspect-square flex flex-col justify-between shadow-2xl`}>
        {/* Card texture overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, white 0.5px, transparent 0.5px)`,
            backgroundSize: '20px 20px',
          }}
        />

        {/* Shine sweep */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 -skew-x-12"
          animate={{ x: ['-150%', '250%'] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 6, delay: index * 0.8 }}
        />

        {/* Top row: icon + chip + contactless */}
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {pass.icon}
            <div>
              <p className="text-white font-bold text-sm leading-tight">{pass.title}</p>
              <p className="text-white/50 text-[10px]">{pass.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-white/40 rotate-90" />
            <OfficialBadge size="sm" />
          </div>
        </div>

        {/* Chip */}
        <div className="relative z-10 my-auto">
          <div className="w-11 h-8 rounded-md bg-gradient-to-br from-yellow-200/80 via-yellow-300/60 to-yellow-400/40 border border-yellow-200/20 flex items-center justify-center">
            <div className="w-7 h-5 rounded-sm border border-yellow-400/30 bg-gradient-to-br from-yellow-100/30 to-yellow-300/20" />
          </div>
        </div>

        {/* Bottom row: number + logo */}
        <div className="relative z-10 flex items-end justify-between">
          <div>
            <p className="text-white/60 text-xs font-mono tracking-[0.2em] mb-1">{pass.number}</p>
            <p className="text-white/30 text-[10px]">OFFICIAL MEMBER</p>
          </div>
          <span className="text-white/20 font-black text-lg tracking-wider">{pass.logo}</span>
        </div>

        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-black/10" />
      </div>
    </motion.div>
  );
}

export default function OfficialWallet() {
  return (
    <section className="py-28 px-4 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-amber-500/3 blur-[120px]" />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-16"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/20 bg-amber-400/5 mb-6">
            <CreditCard className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-bold text-amber-400/80 tracking-[0.15em] uppercase">Digital Wallet</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            Your Official <span className="text-amber-400">Wallet</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Every Official member receives a curated set of digital passes — real partnerships, real value, 
            accessible from your dashboard.
          </p>
        </motion.div>

        {/* Stacked wallet display */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {passes.map((pass, i) => (
              <WalletCard key={pass.title} pass={pass} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
