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
      {/* Deep multi-layer darkening for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/60 pointer-events-none" />
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />
      
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        {/* Solid dark badge for max contrast */}
        <div className="inline-block px-5 py-2 bg-black/80 backdrop-blur-sm rounded-full mb-6 border border-white/20">
          <span className="text-white font-semibold text-sm tracking-widest">AS FEATURED IN</span>
        </div>
        
        {/* Headline with solid color instead of gradient text, heavy shadow */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white drop-shadow-[0_4px_24px_rgba(0,0,0,1)]">
          Featured on the <span className="text-white">NASDAQ Tower</span>
        </h2>
        
        <p className="text-white text-lg sm:text-xl max-w-2xl drop-shadow-[0_4px_16px_rgba(0,0,0,1)] font-medium">
          Startup Factory Hub showcased in Times Square, New York City —
        </p>
      </div>
    </section>
  );
};

export default NasdaqFeature;
