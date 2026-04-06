import { Flag } from "lucide-react";

const HotDealsRocketBanner = () => {
  return (
    <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-[0_0_60px_rgba(16,185,129,0.15)] h-56 sm:h-72 lg:h-80">
      {/* Metallic background with rivets */}
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(ellipse 120% 80% at 50% 120%, hsl(160 50% 10%) 0%, transparent 70%),
          radial-gradient(ellipse 80% 60% at 80% 20%, hsl(155 40% 14%) 0%, transparent 60%),
          radial-gradient(ellipse 60% 80% at 20% 30%, hsl(165 35% 12%) 0%, transparent 50%),
          linear-gradient(180deg, hsl(160 30% 8%) 0%, hsl(155 40% 6%) 50%, hsl(165 25% 5%) 100%)
        `,
      }} />

      {/* Metallic texture grain */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='60' height='60' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
      }} />

      {/* Horizontal rivet line - top */}
      <div className="absolute top-6 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-700/40 to-transparent" />
      <div className="absolute top-6 left-0 right-0 flex justify-between px-6 sm:px-10">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={`top-${i}`} className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full -mt-1 relative" style={{
            background: `radial-gradient(circle at 35% 35%, hsl(160 40% 30%) 0%, hsl(155 35% 16%) 50%, hsl(165 25% 10%) 100%)`,
            boxShadow: `inset 0 1px 2px rgba(0,0,0,0.6), 0 1px 1px rgba(16,185,129,0.1)`,
          }} />
        ))}
      </div>

      {/* Horizontal rivet line - bottom */}
      <div className="absolute bottom-6 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-700/40 to-transparent" />
      <div className="absolute bottom-6 left-0 right-0 flex justify-between px-6 sm:px-10">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={`bot-${i}`} className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full -mb-1 relative" style={{
            background: `radial-gradient(circle at 35% 35%, hsl(160 40% 30%) 0%, hsl(155 35% 16%) 50%, hsl(165 25% 10%) 100%)`,
            boxShadow: `inset 0 1px 2px rgba(0,0,0,0.6), 0 1px 1px rgba(16,185,129,0.1)`,
          }} />
        ))}
      </div>

      {/* Welding seam - horizontal center */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-emerald-800/30 to-transparent" />
        <div className="h-[1px] mt-[1px] bg-gradient-to-r from-transparent via-emerald-600/15 to-transparent" />
      </div>

      {/* Speed lines */}
      <div className="absolute left-4 top-[30%] w-16 sm:w-24 h-[1px] bg-gradient-to-r from-emerald-500/20 to-transparent" />
      <div className="absolute left-8 top-[45%] w-12 sm:w-20 h-[1px] bg-gradient-to-r from-emerald-500/15 to-transparent" />
      <div className="absolute left-2 top-[60%] w-20 sm:w-28 h-[1px] bg-gradient-to-r from-orange-500/10 to-transparent" />
      <div className="absolute left-10 top-[75%] w-10 sm:w-16 h-[1px] bg-gradient-to-r from-emerald-500/15 to-transparent" />

      {/* Small stars */}
      {[
        { top: "15%", left: "12%", size: "1.5px" },
        { top: "25%", left: "35%", size: "1px" },
        { top: "70%", left: "18%", size: "2px" },
        { top: "40%", left: "55%", size: "1px" },
        { top: "80%", left: "65%", size: "1.5px" },
        { top: "20%", left: "75%", size: "1px" },
        { top: "60%", left: "42%", size: "1.5px" },
      ].map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-emerald-300/40"
          style={{ top: star.top, left: star.left, width: star.size, height: star.size }}
        />
      ))}

      {/* Panel lines / hull plates */}
      <div className="absolute top-0 left-[25%] w-[1px] h-full bg-gradient-to-b from-transparent via-emerald-700/15 to-transparent" />
      <div className="absolute top-0 left-[50%] w-[1px] h-full bg-gradient-to-b from-transparent via-emerald-700/10 to-transparent" />
      <div className="absolute top-0 left-[75%] w-[1px] h-full bg-gradient-to-b from-transparent via-emerald-700/15 to-transparent" />

      {/* Edge vignette */}
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, hsl(165 25% 4% / 0.7) 100%)
        `,
      }} />

      {/* Content overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center relative z-10">
          <p className="text-emerald-400 text-xs sm:text-sm font-futuristic tracking-[0.5em] mb-2 flex items-center justify-center gap-2 font-bold">
            <Flag className="w-4 h-4 text-emerald-400" /> GLOBAL STARTUP PITCH COMPETITION <Flag className="w-4 h-4 text-emerald-400" />
          </p>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-transparent bg-clip-text font-futuristic tracking-wider leading-none" style={{
            backgroundImage: 'linear-gradient(90deg, hsl(0 72% 51%), hsl(25 95% 53%), hsl(48 96% 53%))',
            filter: 'drop-shadow(0 0 30px rgba(251,146,60,0.4))',
          }}>
            HOT DEALS
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-foreground/80 mt-2 font-futuristic tracking-[0.3em] font-bold">IN THE SPACE INDUSTRY</p>
          <p className="text-xs sm:text-sm text-emerald-400/60 mt-2 font-futuristic tracking-wider">APRIL 16, 2026 — VIRTUAL EVENT</p>
        </div>
      </div>

      {/* Checkered flag corners */}
      <div className="absolute top-0 left-0 w-8 h-8 opacity-30" style={{
        backgroundImage: `linear-gradient(45deg, hsl(0 0% 100%) 25%, transparent 25%), linear-gradient(-45deg, hsl(0 0% 100%) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(0 0% 100%) 75%), linear-gradient(-45deg, transparent 75%, hsl(0 0% 100%) 75%)`,
        backgroundSize: "8px 8px",
        backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
      }} />
      <div className="absolute top-0 right-0 w-8 h-8 opacity-30" style={{
        backgroundImage: `linear-gradient(45deg, hsl(0 0% 100%) 25%, transparent 25%), linear-gradient(-45deg, hsl(0 0% 100%) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(0 0% 100%) 75%), linear-gradient(-45deg, transparent 75%, hsl(0 0% 100%) 75%)`,
        backgroundSize: "8px 8px",
        backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
      }} />
    </div>
  );
};

export default HotDealsRocketBanner;
