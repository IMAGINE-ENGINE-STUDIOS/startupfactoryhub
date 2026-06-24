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
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/40 pointer-events-none" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <div className="inline-block px-5 py-2 bg-black/60 backdrop-blur-md rounded-full mb-6 border border-white/30">
          <span className="text-white font-semibold text-sm tracking-widest">AS FEATURED IN</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white [text-shadow:_0_4px_24px_rgba(0,0,0,0.9)]">
          Featured on the <span className="bg-gradient-primary bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">NASDAQ Tower</span>
        </h2>
        <p className="text-white text-lg sm:text-xl max-w-2xl [text-shadow:_0_2px_12px_rgba(0,0,0,0.9)]">
          Startup Factory Hub showcased in Times Square, New York City
        </p>
      </div>
    </section>
  );
};

export default NasdaqFeature;
