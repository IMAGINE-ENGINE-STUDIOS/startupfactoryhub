import { motion } from 'framer-motion';
import { Satellite, Thermometer, Waves, Radio, Mountain, Sun, Ship, Lock } from 'lucide-react';
import { lazy, Suspense } from 'react';

const GlobalResourcesMap = lazy(() => 
  import('@/components/GlobalResourcesMap').then(m => ({ default: m.GlobalResourcesMap }))
);

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const }
  }),
};

const features = [
  { icon: <Thermometer className="h-4 w-4" />, label: 'Land Surface Temperature', color: 'text-orange-400' },
  { icon: <Waves className="h-4 w-4" />, label: 'Sea Surface Temperature', color: 'text-blue-400' },
  { icon: <Radio className="h-4 w-4" />, label: 'Precipitation Radar', color: 'text-cyan-400' },
  { icon: <Mountain className="h-4 w-4" />, label: 'Global Elevation Data', color: 'text-emerald-400' },
  { icon: <Sun className="h-4 w-4" />, label: 'Solar Radiation', color: 'text-yellow-400' },
  { icon: <Ship className="h-4 w-4" />, label: 'Live Vessel Tracking', color: 'text-indigo-400' },
];

export default function OfficialEarthIntel() {
  return (
    <section className="py-28 px-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-cyan-500/3 blur-[150px]" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-12"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/5 mb-6">
            <Satellite className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-xs font-bold text-cyan-400/80 tracking-[0.15em] uppercase">Included for Officials</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            Earth <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">Intelligence</span> Suite
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            Access the same satellite-derived datasets used by leading intelligence agencies and research institutions.
            Real-time global coverage with professional-grade analytics — included for all Official members.
          </p>
        </motion.div>

        {/* Feature chips */}
        <motion.div
          className="flex flex-wrap justify-center gap-3 mb-10"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
        >
          {features.map((f) => (
            <div key={f.label} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/40 bg-card/30 backdrop-blur-sm">
              <span className={f.color}>{f.icon}</span>
              <span className="text-xs font-medium text-foreground/70">{f.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Live Map embed */}
        <motion.div
          className="relative rounded-2xl overflow-hidden border border-cyan-400/20"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
        >
          {/* Map container */}
          <div className="relative w-full h-[500px] sm:h-[600px]">
            <Suspense fallback={
              <div className="w-full h-full bg-card flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Satellite className="h-8 w-8 text-cyan-400" />
                  </motion.div>
                  <span className="text-sm text-muted-foreground">Loading Earth Intelligence...</span>
                </div>
              </div>
            }>
              <GlobalResourcesMap />
            </Suspense>
          </div>

          {/* Bottom overlay with gradient */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background/80 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium text-foreground/70">Full access for Official Members</span>
              </div>
              <div className="flex items-center gap-1.5">
                <motion.div
                  className="w-2 h-2 rounded-full bg-emerald-400"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span className="text-xs text-muted-foreground">Live Data</span>
              </div>
            </div>
          </div>

          {/* Glow */}
          <div className="absolute -inset-4 bg-cyan-400/3 rounded-3xl blur-2xl -z-10" />
        </motion.div>
      </div>
    </section>
  );
}
