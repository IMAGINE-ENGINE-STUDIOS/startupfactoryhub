import nasdaqFeature from "@/assets/nasdaq-feature.jpg";

const NasdaqFeature = () => {
  return (
    <section className="py-12 sm:py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-block px-4 py-2 bg-ocean-primary/10 rounded-full mb-4">
            <span className="text-ocean-primary font-semibold text-sm">AS FEATURED IN</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            Featured on the <span className="bg-gradient-primary bg-clip-text text-transparent">NASDAQ Tower</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Startup Factory Hub showcased in Times Square, New York City
          </p>
        </div>
        
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-xl overflow-hidden shadow-elegant hover:shadow-glow transition-all duration-500">
            <img 
              src={nasdaqFeature} 
              alt="Startup Factory Hub featured on NASDAQ Tower in Times Square, New York City" 
              className="w-full h-auto object-cover aspect-video"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default NasdaqFeature;
