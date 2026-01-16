import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";

const PARTNERS = [
  { name: "Decahedron Ventures", logo: "/partners/decahedron-ventures-logo.jpg", tier: "Investment Partner" },
  { name: "Flusso Capital", logo: "/partners/flusso-capital-logo.png", tier: "Investment Partner" },
  { name: "LivePlan", logo: "/partners/liveplan-logo.png", tier: "Accelerator Partner" },
  { name: "UK Venture Partners", logo: "/partners/uk-venture-logo.jpg", tier: "Investment Partner" },
  { name: "Flippa", logo: "/partners/flippa-logo.png", tier: "Marketplace Partner" },
  { name: "Ducere University", logo: "/partners/ducere-logo.png", tier: "Academic Partner" },
  { name: "HackerEarth", logo: "/partners/hackerearth-logo.png", tier: "Technology Partner" },
  { name: "Advantary Capital Partners", logo: "/partners/advantary-logo.jpg", tier: "Investment Partner" },
  { name: "Orlandopreneur", logo: "/partners/orlandopreneur-logo.png", tier: "Community Partner" },
  { name: "Grupo Incostas", logo: "/partners/incostas-logo.png", tier: "Business Partner" },
  { name: "Nouel Consult", logo: "/partners/nouel-logo.png", tier: "Legal Partner" },
  { name: "PitchPerfecter.AI", logo: "/partners/pitchperfecter-logo.png", tier: "Startup Partner" },
  { name: "LOT Network", logo: "/partners/lotnetwork-logo.png", tier: "Legal Partner" },
  { name: "F6S", logo: "/partners/f6s-logo.png", tier: "Startup Partner" },
  { name: "NASA", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/NASA_logo.svg/200px-NASA_logo.svg.png", tier: "Technology Partner" },
  { name: "GitHub", logo: "/github-logo.png", tier: "Developer Partner" },
  { name: "Lehigh University", logo: "/lehigh-university-logo.png", tier: "Academic Partner" },
  { name: "MongoDB", logo: "/mongodb-logo.webp", tier: "Infrastructure Partner" },
  { name: "Datadog", logo: "https://imgix.datadoghq.com/img/dd_logo_n_70x75.png", tier: "Technology Partner" },
  { name: "Google", logo: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png", tier: "Cloud Partner" },
  { name: "NVIDIA Inception", logo: "https://www.nvidia.com/content/dam/en-zz/Solutions/about-nvidia/logo-and-brand/01-nvidia-logo-horiz-500x200-2c50-d.png", tier: "AI Partner" },
  { name: "Nasdaq Entrepreneurial Center", logo: "/nasdaq-logo.png", tier: "Entrepreneurship Partner" },
  { name: "HubSpot", logo: "https://www.hubspot.com/hubfs/HubSpot_Logos/HubSpot-Inversed-Favicon.png", tier: "Marketing Partner" },
];

const PartnersCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set());
  const [isPaused, setIsPaused] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const visiblePartners = PARTNERS.filter(p => !failedLogos.has(p.name));
  const itemsPerView = 5;
  const totalSlides = Math.ceil(visiblePartners.length / itemsPerView);

  const handleLogoError = (partnerName: string) => {
    setFailedLogos(prev => new Set(prev).add(partnerName));
  };

  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 4000);

    return () => clearInterval(interval);
  }, [totalSlides, isPaused]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const getCurrentPartners = () => {
    const start = currentIndex * itemsPerView;
    return visiblePartners.slice(start, start + itemsPerView);
  };

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)/0.5) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(var(--primary)/0.5) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Glowing orbs */}
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-[100px]" />
      <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-ocean-primary/5 rounded-full blur-[100px]" />

      <div className="container mx-auto px-4 relative z-10">
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

        {/* Carousel Container */}
        <div 
          className="relative max-w-6xl mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Navigation Buttons */}
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 w-10 h-10 rounded-full bg-background/80 border border-primary/20 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/40 transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-primary" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 w-10 h-10 rounded-full bg-background/80 border border-primary/20 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/40 transition-all"
          >
            <ChevronRight className="w-5 h-5 text-primary" />
          </Button>

          {/* Carousel Track */}
          <div ref={carouselRef} className="overflow-hidden px-8">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
            >
              {getCurrentPartners().map((partner, index) => (
                <motion.div
                  key={partner.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="group"
                >
                  <div className="relative h-32 p-4 rounded-xl bg-card/50 border border-primary/10 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:bg-card/80 hover:shadow-[0_0_30px_-10px_hsl(var(--primary)/0.3)]">
                    {/* Corner accents */}
                    <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-primary/30 rounded-tl-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-primary/30 rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-ocean-primary/30 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-ocean-primary/30 rounded-br-lg opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Logo Container */}
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <div className="flex-1 flex items-center justify-center w-full">
                        <img
                          src={partner.logo}
                          alt={partner.name}
                          className="max-h-12 max-w-full object-contain filter grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
                          onError={() => handleLogoError(partner.name)}
                        />
                      </div>
                      
                      {/* Partner Info */}
                      <div className="text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="text-[10px] font-mono text-primary/70 uppercase tracking-wider">
                          {partner.tier}
                        </span>
                      </div>
                    </div>

                    {/* Scan line effect on hover */}
                    <div className="absolute inset-0 overflow-hidden rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none">
                      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" 
                        style={{ 
                          animation: 'scan 2s ease-in-out infinite',
                        }} 
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Pagination Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`transition-all duration-300 ${
                  index === currentIndex
                    ? "w-8 h-2 bg-gradient-to-r from-primary to-ocean-primary rounded-full"
                    : "w-2 h-2 bg-primary/20 hover:bg-primary/40 rounded-full"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-8 md:gap-16 mt-12 pt-8 border-t border-primary/10"
        >
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-ocean-primary bg-clip-text text-transparent">
              {visiblePartners.length}+
            </div>
            <div className="text-sm text-muted-foreground font-mono uppercase tracking-wider">Partners</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-ocean-primary bg-clip-text text-transparent">
              12+
            </div>
            <div className="text-sm text-muted-foreground font-mono uppercase tracking-wider">Industries</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-ocean-primary bg-clip-text text-transparent">
              Global
            </div>
            <div className="text-sm text-muted-foreground font-mono uppercase tracking-wider">Network</div>
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(-100%); }
          50% { transform: translateY(100%); }
        }
      `}</style>
    </section>
  );
};

export default PartnersCarousel;
