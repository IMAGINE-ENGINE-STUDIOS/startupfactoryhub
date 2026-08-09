import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { PARTNERS, type Partner } from "@/config/partners";

const PartnersCarousel = () => {
  const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set());
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const visiblePartners = PARTNERS.filter(p => !failedLogos.has(p.name));
  // Duplicate for seamless infinite scroll
  const duplicatedPartners = [...visiblePartners, ...visiblePartners];

  const handleLogoError = (partnerName: string) => {
    setFailedLogos(prev => new Set(prev).add(partnerName));
  };

  return (
    <section className="relative py-16 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background" />
      
      {/* Subtle gradient overlays */}
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      <div className="w-full px-4 relative z-10">
        {/* Infinite Scroll Carousel */}
        <div 
          className="relative overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <motion.div
            ref={scrollRef}
            className="flex gap-6"
            animate={{
              x: isPaused ? undefined : [0, -70 * visiblePartners.length * 4],
            }}
            transition={{
              x: {
                duration: visiblePartners.length * 3,
                repeat: Infinity,
                ease: "linear",
                repeatType: "loop",
              },
            }}
            style={{ width: "fit-content" }}
          >
            {duplicatedPartners.map((partner, index) => (
              <PartnerLogoCard
                key={`${partner.name}-${index}`}
                partner={partner}
                onError={() => handleLogoError(partner.name)}
              />
            ))}
          </motion.div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </section>
  );
};

function PartnerLogoCard({ partner, onError }: { partner: Partner; onError: () => void }) {
  return (
    <div className="group flex-shrink-0">
      <div className="relative w-64 h-44 rounded-3xl bg-gradient-to-br from-card/80 to-card/40 border border-primary/5 backdrop-blur-md transition-all duration-500 hover:border-primary/20 hover:shadow-[0_0_40px_-15px_hsl(var(--primary)/0.4)] hover:scale-105">
        {/* Glow effect on hover */}
        <div className="absolute -inset-px rounded-3xl bg-gradient-to-r from-primary/20 via-ocean-primary/20 to-primary/20 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500" />
        
        {/* Inner container */}
        <div className="relative h-full w-full rounded-3xl bg-card/90 p-6 flex flex-col items-center justify-center gap-2 overflow-hidden">
          {/* Animated border */}
          <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute inset-0 rounded-3xl" style={{
              background: `linear-gradient(90deg, transparent, hsl(var(--primary)/0.3), transparent)`,
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s infinite',
            }} />
          </div>

          {/* Logo */}
          <div className="flex-1 flex items-center justify-center w-full">
            <img
              src={partner.logo}
              alt={partner.name}
              className="max-h-16 max-w-[180px] object-contain opacity-70 group-hover:opacity-100 transition-all duration-500"
              onError={onError}
            />
          </div>
          

          {/* Corner dots */}
          <div className="absolute top-2 left-2 w-1 h-1 rounded-full bg-primary/30 group-hover:bg-primary transition-colors" />
          <div className="absolute top-2 right-2 w-1 h-1 rounded-full bg-primary/30 group-hover:bg-primary transition-colors" />
          <div className="absolute bottom-2 left-2 w-1 h-1 rounded-full bg-ocean-primary/30 group-hover:bg-ocean-primary transition-colors" />
          <div className="absolute bottom-2 right-2 w-1 h-1 rounded-full bg-ocean-primary/30 group-hover:bg-ocean-primary transition-colors" />
        </div>
      </div>
    </div>
  );
}

export default PartnersCarousel;
