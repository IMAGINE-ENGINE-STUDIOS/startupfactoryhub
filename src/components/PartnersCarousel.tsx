import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Handshake } from "lucide-react";

const PARTNERS = [
  { name: "NASA", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/NASA_logo.svg/200px-NASA_logo.svg.png", tier: "Technology" },
  { name: "Google", logo: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png", tier: "Cloud" },
  { name: "Nasdaq", logo: "/nasdaq-logo.png", tier: "Entrepreneurship" },
  { name: "F6S", logo: "/partners/f6s-logo.png", tier: "Startup" },
  { name: "TradingView", logo: "https://www.tradingview.com/static/images/logo-tradingview.svg", tier: "Finance" },
  { name: "IWG", logo: "/partners/iwg-logo.png", tier: "Workspace" },
  { name: "Regus", logo: "/partners/regus-logo.png", tier: "Workspace" },
  { name: "Advantary Capital Partners", logo: "/partners/advantary-logo.jpg", tier: "Investment" },
  { name: "Lehigh University", logo: "/lehigh-university-logo.png", tier: "Academic" },
  { name: "HubSpot", logo: "https://www.hubspot.com/hubfs/HubSpot_Logos/HubSpot-Inversed-Favicon.png", tier: "Marketing" },
  { name: "GitHub", logo: "/github-logo.png", tier: "Developer" },
  { name: "MongoDB", logo: "/mongodb-logo.webp", tier: "Infrastructure" },
  { name: "Datadog", logo: "https://imgix.datadoghq.com/img/dd_logo_n_70x75.png", tier: "Technology" },
  { name: "Lovable", logo: "/partners/lovable-logo.png", tier: "Technology" },
  { name: "Decahedron Ventures", logo: "/partners/decahedron-ventures-logo.jpg", tier: "Investment" },
  { name: "Flusso Capital", logo: "/partners/flusso-capital-logo.png", tier: "Investment" },
  { name: "LivePlan", logo: "/partners/liveplan-logo.png", tier: "Accelerator" },
  { name: "UK Venture Partners", logo: "/partners/uk-venture-logo.jpg", tier: "Investment" },
  { name: "Flippa", logo: "/partners/flippa-logo.png", tier: "Marketplace" },
  { name: "Ducere University", logo: "/partners/ducere-logo.png", tier: "Academic" },
  { name: "HackerEarth", logo: "/partners/hackerearth-logo.png", tier: "Technology" },
  { name: "Orlandopreneur", logo: "/partners/orlandopreneur-logo.png", tier: "Community" },
  { name: "Grupo Incostas", logo: "/partners/incostas-logo.png", tier: "Business" },
  { name: "Nouel Consult", logo: "/partners/nouel-logo.png", tier: "Legal" },
  { name: "PitchPerfecter.AI", logo: "/partners/pitchperfecter-logo.png", tier: "Startup" },
  { name: "LOT Network", logo: "/partners/lotnetwork-logo.png", tier: "Legal" },
  { name: "HSBC Innovation Banking", logo: "/partners/hsbc-logo.png", tier: "Banking" },
];

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
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-6">
            <Handshake className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary tracking-wider uppercase">Our Network</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Partners &{" "}
            <span className="bg-gradient-to-r from-primary via-ocean-primary to-primary bg-clip-text text-transparent">
              Collaborators
            </span>
          </h2>
          
          <p className="text-muted-foreground max-w-xl mx-auto">
            Backed by industry leaders and innovators shaping the future of technology
          </p>
        </motion.div>

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
              <div
                key={`${partner.name}-${index}`}
                className="group flex-shrink-0"
              >
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
                        onError={() => handleLogoError(partner.name)}
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

export default PartnersCarousel;
