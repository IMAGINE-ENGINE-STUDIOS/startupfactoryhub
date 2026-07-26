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
      {/* Light bottom-only gradient so the image stays fully visible */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />

      
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center text-center px-6 pb-16 md:pb-24">
        <div className="inline-block px-5 py-2 bg-black/70 backdrop-blur-sm rounded-full mb-6 border border-white/20">
          <span className="text-white font-semibold text-sm tracking-widest">AS FEATURED IN</span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
          Featured on the <span className="text-white">NASDAQ Tower</span>
        </h2>

        <p className="text-white text-lg sm:text-xl max-w-2xl drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] font-medium">
          Startup Factory Hub showcased in Times Square, New York City —
        </p>
      </div>

    </section>
  );
};

export default NasdaqFeature;
