import nasdaqFeature from "@/assets/nasdaq-feature.jpg";

const NasdaqFeature = () => {
  return (
    <section className="relative w-full h-screen">
      <img 
        src={nasdaqFeature} 
        alt="Startup Factory Hub featured on NASDAQ Tower in Times Square, New York City" 
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <div className="inline-block px-4 py-2 bg-background/20 backdrop-blur-sm rounded-full mb-4 border border-white/20">
          <span className="text-white font-semibold text-sm">AS FEATURED IN</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white drop-shadow-lg">
          Featured on the <span className="bg-gradient-primary bg-clip-text text-transparent">NASDAQ Tower</span>
        </h2>
        <p className="text-white/90 text-lg sm:text-xl max-w-2xl drop-shadow-md">
          Startup Factory Hub showcased in Times Square, New York City
        </p>
      </div>
    </section>
  );
};

export default NasdaqFeature;
